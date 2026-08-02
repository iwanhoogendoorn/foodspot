/**
 * Food Spot — spot detail modal (SPEC "Detail modal").
 *
 * Photo header with letter-placeholder fallback, inline-editable name,
 * status segmented control, favorite toggle, lockable star rating with an
 * "auto" link back to visit-derived, price selector, cuisine/tag chips that
 * jump to a Spots-tab query, address/phone/website actions, external ratings
 * row with Refresh + stale badge, inline visits CRUD, a debounced two-way
 * synced Notes box, and an Open note button.
 *
 * Refreshes on store.onChange while open (skipped while the user is typing
 * in a field — never steal focus); unsubscribes on close.
 */
import { Modal, Notice, TFile, setIcon } from "obsidian";
import type {
  DateFormat,
  FoodSpot,
  FoodSpotPluginApi,
  SpotInput,
  SpotStatus,
  Visit,
} from "../../types";
import { SPOT_STATUSES } from "../../types";
import { starRating } from "../components/starRating";
import { isStaleRatings } from "../components/card";
import { confirmModal } from "./confirm";
import { openEditModal } from "./addEdit";

export function openDetailModal(plugin: FoodSpotPluginApi, path: string): void {
  new DetailModal(plugin, path).open();
}

const STATUS_LABELS: Record<SpotStatus, string> = {
  "want-to-try": "Want to try",
  visited: "Visited",
};

class DetailModal extends Modal {
  private unsubscribe: (() => void) | null = null;
  private pendingRefresh = false;
  private notesTimer: number | undefined;
  private pendingNotes: string | null = null;
  private editingVisitIndex: number | null = null;
  private addingVisit = false;
  private refreshingRatings = false;
  private focusTimer: number | undefined;
  private closed = false;

  constructor(
    private readonly plugin: FoodSpotPluginApi,
    private readonly path: string
  ) {
    super(plugin.app);
  }

  override onOpen(): void {
    this.modalEl.addClass("fs-modal", "fs-detail-modal");
    this.unsubscribe = this.plugin.store.onChange(() => this.onStoreChange());
    this.contentEl.addEventListener("focusout", () => {
      window.clearTimeout(this.focusTimer);
      this.focusTimer = window.setTimeout(() => {
        // The modal may have closed while this was queued — never rebuild a
        // detached content tree.
        if (this.closed) return;
        if (this.pendingRefresh && !this.typingInside()) {
          this.pendingRefresh = false;
          this.render();
        }
      }, 120);
    });
    this.render();
  }

  private typingInside(): boolean {
    const ae = document.activeElement;
    return (
      ae instanceof HTMLElement &&
      this.contentEl.contains(ae) &&
      (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")
    );
  }

  private onStoreChange(): void {
    if (this.typingInside() || this.editingVisitIndex !== null || this.addingVisit) {
      this.pendingRefresh = true;
      return;
    }
    this.render();
  }

  private spot(): FoodSpot | undefined {
    return this.plugin.store.getByPath(this.path);
  }

  // -------------------------------------------------------------- render

  private render(): void {
    if (this.closed) return; // late async callbacks must not rebuild a closed modal
    const spot = this.spot();
    if (!spot) {
      this.close();
      return;
    }
    this.contentEl.empty();
    this.titleEl.setText("");

    this.renderHeader(this.contentEl, spot);
    this.renderControls(this.contentEl, spot);
    this.renderChips(this.contentEl, spot);
    this.renderInfo(this.contentEl, spot);
    this.renderExternal(this.contentEl, spot);
    this.renderVisits(this.contentEl, spot);
    this.renderNotes(this.contentEl, spot);
    this.renderFooter(this.contentEl, spot);
  }

  private renderHeader(parent: HTMLElement, spot: FoodSpot): void {
    const header = parent.createDiv({ cls: "fs-detail-header" });
    const photo = header.createDiv({ cls: "fs-detail-photo" });
    const placeholder = (): void => {
      photo.empty();
      photo.addClass("fs-photo-placeholder");
      const tierPalette = this.plugin.settings.ratingTiers;
      const key = spot.cuisines[0] ?? spot.name;
      const tier = tierPalette[hashStr(key) % Math.max(1, tierPalette.length)];
      photo.style.background = tier
        ? `color-mix(in srgb, ${tier.color} 45%, var(--background-secondary))`
        : "var(--background-secondary)";
      photo.createSpan({
        cls: "fs-photo-letter",
        text: (spot.name.trim().charAt(0) || "?").toUpperCase(),
      });
    };
    const src = this.resolvePhoto(spot);
    if (src) {
      const img = photo.createEl("img", { cls: "fs-detail-img" });
      img.alt = spot.name;
      img.addEventListener("error", placeholder);
      img.src = src;
    } else {
      placeholder();
    }

    const nameRow = header.createDiv({ cls: "fs-detail-name-row" });
    const h2 = nameRow.createEl("h2", { cls: "fs-detail-name", text: spot.name });
    h2.title = "Click to rename";
    h2.addEventListener("click", () => this.editName(nameRow, h2, spot));
  }

  private editName(row: HTMLElement, h2: HTMLElement, spot: FoodSpot): void {
    h2.hide();
    const input = row.createEl("input", { type: "text", cls: "fs-detail-name-input" });
    input.value = spot.name;
    let done = false;
    const finish = (commit: boolean): void => {
      if (done) return;
      done = true;
      const value = input.value.trim();
      input.remove();
      h2.show();
      if (commit && value !== "" && value !== spot.name) {
        void this.plugin.store
          .updateSpot(this.path, { name: value })
          .catch((e: unknown) => new Notice(`Couldn't rename — ${errorMessage(e)}`));
      }
    };
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") finish(true);
      else if (ev.key === "Escape") {
        ev.preventDefault();
        ev.stopPropagation();
        finish(false);
      }
    });
    input.addEventListener("blur", () => finish(true));
    input.focus();
    input.select();
  }

  private renderControls(parent: HTMLElement, spot: FoodSpot): void {
    const row = parent.createDiv({ cls: "fs-detail-controls" });

    // Status segmented control
    const seg = row.createDiv({ cls: "fs-segmented" });
    for (const st of SPOT_STATUSES) {
      const btn = seg.createEl("button", { cls: "fs-seg-btn", text: STATUS_LABELS[st] });
      btn.type = "button";
      if (st === spot.status) {
        btn.addClass("fs-active");
        const color =
          st === "visited"
            ? this.plugin.settings.statusColors.visited
            : this.plugin.settings.statusColors.wantToTry;
        btn.style.setProperty("--fs-seg-active-color", color);
      }
      btn.addEventListener("click", () => {
        if (st === spot.status) return;
        void this.update({ status: st });
      });
    }

    // Favorite toggle
    const fav = row.createEl("button", { cls: "fs-fav-toggle" });
    fav.type = "button";
    fav.title = spot.favorite ? "Remove from favorites" : "Mark as favorite";
    setIcon(fav, "heart");
    if (spot.favorite) {
      fav.addClass("fs-active");
      fav.style.color = this.plugin.settings.statusColors.favorite;
    }
    fav.addEventListener("click", () => void this.update({ favorite: !spot.favorite }));

    // Star rating + auto link
    const ratingWrap = row.createDiv({ cls: "fs-detail-rating" });
    starRating(ratingWrap, {
      value: spot.rating,
      halfSteps: this.plugin.settings.halfStarRatings,
      tiers: this.plugin.settings.ratingTiers,
      showLabel: true,
      onChange: (v) => {
        if (v > 0) {
          void this.update({ rating: v, ratingLocked: true });
        } else {
          // Cleared: back to visit-derived (store recomputes when unlocked).
          void this.update({ ratingLocked: false });
        }
      },
    });
    if (spot.ratingLocked) {
      const auto = ratingWrap.createEl("a", { cls: "fs-rating-auto", text: "auto" });
      auto.title = "Unlock and derive the rating from visit ratings again";
      auto.addEventListener("click", (ev) => {
        ev.preventDefault();
        void this.update({ ratingLocked: false });
      });
    }

    // Price selector
    const priceSeg = row.createDiv({ cls: "fs-segmented fs-price-seg" });
    for (let n = 1; n <= 4; n++) {
      const btn = priceSeg.createEl("button", {
        cls: "fs-seg-btn",
        text: this.plugin.settings.currencySymbol.repeat(n),
      });
      btn.type = "button";
      if (spot.price !== undefined && n <= spot.price) btn.addClass("fs-active");
      btn.addEventListener("click", () => {
        void this.update({ price: spot.price === n ? undefined : n });
      });
    }
  }

  private renderChips(parent: HTMLElement, spot: FoodSpot): void {
    if (spot.cuisines.length === 0 && spot.tags.length === 0) return;
    const row = parent.createDiv({ cls: "fs-detail-chips" });
    for (const c of spot.cuisines) {
      const chip = row.createSpan({ cls: "fs-chip fs-chip-cuisine", text: c });
      chip.title = `Show all ${c} spots`;
      chip.addEventListener("click", () => this.jumpToQuery(`cuisine:"${c}"`));
    }
    for (const t of spot.tags) {
      const chip = row.createSpan({ cls: "fs-chip fs-chip-tag", text: `#${t}` });
      chip.title = `Show all #${t} spots`;
      chip.addEventListener("click", () => this.jumpToQuery(`tag:"${t}"`));
    }
  }

  private jumpToQuery(query: string): void {
    // The view reads pendingQuery in setActiveTab (plugin-level handoff).
    (this.plugin as unknown as { pendingQuery?: string }).pendingQuery = query;
    this.close();
    void this.plugin.activateView("spots");
  }

  private renderInfo(parent: HTMLElement, spot: FoodSpot): void {
    const block = parent.createDiv({ cls: "fs-detail-info" });

    // A formatted address usually already contains district/city/country —
    // only append the parts it doesn't mention ("…Delft, Netherlands, Delft,
    // Netherlands" was the old result).
    const addrLower = (spot.address ?? "").toLowerCase();
    const locationText = [
      spot.address,
      ...[spot.district, spot.city, spot.country].filter(
        (part): part is string => !!part && !addrLower.includes(part.toLowerCase()),
      ),
    ]
      .filter(Boolean)
      .join(", ");
    if (locationText) {
      const row = block.createDiv({ cls: "fs-info-row" });
      const icon = row.createSpan({ cls: "fs-info-icon" });
      setIcon(icon, "map-pin");
      row.createSpan({ cls: "fs-info-text", text: locationText });
      this.iconButton(row, "map", "Open in Google Maps", () => {
        window.open(this.mapsUrl(spot));
      });
      this.iconButton(row, "copy", "Copy address", () => {
        void navigator.clipboard
          .writeText(spot.address ?? locationText)
          .then(() => new Notice("Address copied."));
      });
    } else {
      const row = block.createDiv({ cls: "fs-info-row fs-info-empty" });
      const icon = row.createSpan({ cls: "fs-info-icon" });
      setIcon(icon, "map-pin");
      row.createSpan({ cls: "fs-info-text", text: "No address yet — edit the spot to add one." });
    }

    if (spot.url) {
      const row = block.createDiv({ cls: "fs-info-row" });
      const icon = row.createSpan({ cls: "fs-info-icon" });
      setIcon(icon, "globe");
      const link = row.createEl("a", { cls: "fs-info-text", text: prettyUrl(spot.url) });
      link.href = spot.url;
      link.addEventListener("click", (ev) => {
        ev.preventDefault();
        window.open(spot.url);
      });
      this.iconButton(row, "copy", "Copy link", () => {
        void navigator.clipboard.writeText(spot.url ?? "").then(() => new Notice("Link copied."));
      });
    }

    if (spot.phone) {
      const row = block.createDiv({ cls: "fs-info-row" });
      const icon = row.createSpan({ cls: "fs-info-icon" });
      setIcon(icon, "phone");
      row.createSpan({ cls: "fs-info-text", text: spot.phone });
      this.iconButton(row, "copy", "Copy phone number", () => {
        void navigator.clipboard.writeText(spot.phone ?? "").then(() => new Notice("Phone number copied."));
      });
    }

    this.renderMenuRow(block, spot);

    if (spot.sourceUrl && spot.sourceUrl !== spot.url) {
      const row = block.createDiv({ cls: "fs-info-row" });
      const icon = row.createSpan({ cls: "fs-info-icon" });
      setIcon(icon, "external-link");
      const link = row.createEl("a", { cls: "fs-info-text", text: `Source: ${prettyUrl(spot.sourceUrl)}` });
      link.href = spot.sourceUrl;
      link.addEventListener("click", (ev) => {
        ev.preventDefault();
        window.open(spot.sourceUrl);
      });
    }
  }

  /** SPEC-v1.1 §4: external URL → link; vault path → preview / open-in-Obsidian. */
  private renderMenuRow(block: HTMLElement, spot: FoodSpot): void {
    if (!spot.menu) return;
    const menu = spot.menu;
    const row = block.createDiv({ cls: "fs-info-row" });
    const icon = row.createSpan({ cls: "fs-info-icon" });
    setIcon(icon, "book-open");

    if (/^https?:\/\//i.test(menu)) {
      const link = row.createEl("a", { cls: "fs-info-text", text: `Menu — ${prettyUrl(menu)}` });
      link.href = menu;
      link.title = "Open menu";
      link.addEventListener("click", (ev) => {
        ev.preventDefault();
        window.open(menu);
      });
      this.iconButton(row, "copy", "Copy menu link", () => {
        void navigator.clipboard.writeText(menu).then(() => new Notice("Menu link copied."));
      });
      return;
    }

    // Vault path (image or PDF)
    const app = this.plugin.app;
    const file =
      app.metadataCache.getFirstLinkpathDest(menu, spot.path) ??
      app.vault.getAbstractFileByPath(menu);
    if (!(file instanceof TFile)) {
      row.addClass("fs-info-empty");
      row.createSpan({ cls: "fs-info-text", text: `Menu file not found — ${menu}` });
      return;
    }
    const openInObsidian = (): void => {
      this.close();
      void app.workspace.openLinkText(file.path, spot.path);
    };
    if (/^(png|jpe?g|webp|gif|avif)$/i.test(file.extension)) {
      row.createSpan({ cls: "fs-info-text", text: "Menu" });
      const preview = block.createDiv({ cls: "fs-menu-preview" });
      preview.title = "Open in Obsidian";
      const img = preview.createEl("img", { cls: "fs-menu-preview-img" });
      img.alt = `${spot.name} menu`;
      img.src = app.vault.getResourcePath(file);
      preview.addEventListener("click", openInObsidian);
      return;
    }
    const link = row.createEl("a", { cls: "fs-info-text", text: `Menu — ${file.name}` });
    link.title = "Open in Obsidian";
    link.addEventListener("click", (ev) => {
      ev.preventDefault();
      openInObsidian();
    });
  }

  private mapsUrl(spot: FoodSpot): string {
    if (spot.coordinates) {
      return `https://www.google.com/maps/search/?api=1&query=${spot.coordinates.lat},${spot.coordinates.lng}`;
    }
    const q = [spot.name, spot.address ?? "", spot.city ?? "", spot.country]
      .filter(Boolean)
      .join(" ");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }

  private renderExternal(parent: HTMLElement, spot: FoodSpot): void {
    const ext = spot.external;
    const row = parent.createDiv({ cls: "fs-detail-external" });
    // SPEC-v1.1 §5: every source with a value, e.g. "G 4.6 (1.2k) · TA 4.5 (210)".
    // TheFork rates on a 10-scale — shown "/10", never converted silently.
    const sources: {
      label: string;
      cls: string;
      rating?: number;
      count?: number;
      scale10?: boolean;
    }[] = [
      { label: "G", cls: "fs-ext-google", rating: ext.googleRating, count: ext.googleRatingCount },
      { label: "TA", cls: "fs-ext-ta", rating: ext.tripadvisorRating, count: ext.tripadvisorRatingCount },
      { label: "Yelp", cls: "fs-ext-yelp", rating: ext.yelpRating, count: ext.yelpRatingCount },
      {
        label: "TheFork",
        cls: "fs-ext-thefork",
        rating: ext.theforkRating,
        count: ext.theforkRatingCount,
        scale10: true,
      },
      { label: "FB", cls: "fs-ext-facebook", rating: ext.facebookRating, count: ext.facebookRatingCount },
      {
        label: "OpenTable",
        cls: "fs-ext-opentable",
        rating: ext.opentableRating,
        count: ext.opentableRatingCount,
      },
      {
        label: "Eet.nu",
        cls: "fs-ext-eetnu",
        rating: ext.eetnuRating,
        count: ext.eetnuRatingCount,
        scale10: true,
      },
    ];
    const hasAny = sources.some((s) => s.rating !== undefined);

    for (const s of sources) {
      if (s.rating === undefined) continue;
      const badge = row.createSpan({ cls: `fs-ext-badge ${s.cls}` });
      badge.createSpan({ cls: "fs-ext-source", text: s.label });
      badge.createSpan({
        text: ` ${s.rating.toFixed(1)}${s.scale10 ? "/10" : ""}${
          s.count !== undefined ? ` (${shortCount(s.count)})` : ""
        }`,
      });
    }
    if (!hasAny) {
      row.createSpan({ cls: "fs-ext-none", text: "No public ratings yet — add a source:" });
    }

    // Sources without a rating render as "+ TA"-style attach chips: click,
    // paste the spot's page URL (with a site-search shortcut), fetch.
    const ATTACHABLE: { label: string; key: SourceUrlKey; domain: string }[] = [
      { label: "TA", key: "tripadvisorUrl", domain: "tripadvisor.com" },
      { label: "Yelp", key: "yelpUrl", domain: "yelp.com" },
      { label: "TheFork", key: "theforkUrl", domain: "thefork.com" },
      { label: "FB", key: "facebookUrl", domain: "facebook.com" },
      { label: "OpenTable", key: "opentableUrl", domain: "opentable.com" },
      { label: "Eet.nu", key: "eetnuUrl", domain: "eet.nu" },
    ];
    const ratingBySourceLabel = new Map(sources.map((s) => [s.label, s.rating]));
    const anyMissing = ATTACHABLE.some((a) => ratingBySourceLabel.get(a.label) === undefined);
    if (anyMissing) {
      const findBtn = row.createEl("button", { cls: "fs-btn fs-small-btn fs-ext-find" });
      findBtn.type = "button";
      findBtn.title =
        "Auto-attach verifiable sources (Eet.nu rating + Facebook link via the Eet.nu API). TripAdvisor/Yelp/TheFork/OpenTable bot-wall automated lookups — paste those via their + chips.";
      const findIcon = findBtn.createSpan({ cls: "fs-btn-icon" });
      setIcon(findIcon, "wand-sparkles");
      const findLabel = findBtn.createSpan({ text: " Find sources" });
      findBtn.addEventListener("click", () => {
        findBtn.disabled = true;
        findBtn.addClass("fs-loading");
        setIcon(findIcon, "loader-2");
        void (async () => {
          try {
            const res = await this.plugin.importer.discoverSources(spot, (label) =>
              findLabel.setText(` Searching ${label}…`)
            );
            if (Object.keys(res.patch).length > 0) {
              await this.plugin.store.updateSpot(this.path, {
                external: { ...spot.external, ...res.patch },
              });
            }
            if (res.attached.length > 0) {
              new Notice(`Attached: ${res.attached.join(", ")}.`);
            } else {
              new Notice(
                "Nothing auto-attachable found. TripAdvisor, Yelp, TheFork and OpenTable block automated lookups — use their + chips to paste the page link.",
                8000
              );
            }
            this.render();
          } catch (e) {
            new Notice(`Source discovery failed: ${errorMessage(e)}`);
            findBtn.disabled = false;
            findBtn.removeClass("fs-loading");
            setIcon(findIcon, "wand-sparkles");
            findLabel.setText(" Find sources");
          }
        })();
      });
    }
    for (const a of ATTACHABLE) {
      if (ratingBySourceLabel.get(a.label) !== undefined) continue;
      const chipBtn = row.createEl("button", { cls: "fs-ext-add" });
      chipBtn.type = "button";
      chipBtn.title = ext[a.key]
        ? `${a.label} link attached but no rating found — fix the URL`
        : `Add a ${a.label} rating source`;
      chipBtn.setText(`+ ${a.label}`);
      chipBtn.addEventListener("click", () => {
        new AttachSourceModal(this.plugin, spot, a, () => this.render()).open();
      });
    }

    if (hasAny && isStaleRatings(this.plugin, ext)) {
      const stale = row.createSpan({ cls: "fs-stale-badge" });
      stale.setText(
        ext.ratingsUpdated ? `stale — fetched ${this.formatDate(ext.ratingsUpdated)}` : "stale"
      );
      stale.title = `Older than ${this.plugin.settings.staleRatingThresholdDays} days`;
    }

    const refresh = row.createEl("button", { cls: "fs-ext-refresh" });
    refresh.type = "button";
    refresh.title = "Refresh public ratings from every linked source";
    setIcon(refresh, "refresh-cw");
    refresh.createSpan({ text: " Refresh" });
    refresh.addEventListener("click", () => void this.refreshRatings(refresh, spot));
  }

  private async refreshRatings(btn: HTMLButtonElement, spot: FoodSpot): Promise<void> {
    if (this.refreshingRatings) return;
    this.refreshingRatings = true;
    btn.disabled = true;
    btn.addClass("fs-loading");
    try {
      const updated = await this.plugin.importer.refreshRatings(spot);
      if (updated) {
        await this.plugin.store.updateSpot(this.path, {
          external: { ...spot.external, ...updated },
        });
        new Notice("Public ratings refreshed.");
      } else {
        new Notice("No fresh ratings found for this spot.");
      }
    } catch (e) {
      new Notice(`Couldn't refresh ratings — ${errorMessage(e)}`);
    } finally {
      this.refreshingRatings = false;
      if (btn.isConnected) {
        btn.disabled = false;
        btn.removeClass("fs-loading");
      }
    }
  }

  // -------------------------------------------------------------- visits

  private renderVisits(parent: HTMLElement, spot: FoodSpot): void {
    const section = parent.createDiv({ cls: "fs-detail-section fs-detail-visits" });
    const head = section.createDiv({ cls: "fs-detail-section-head" });
    head.createEl("h3", {
      text: `Visits${spot.visits.length > 0 ? ` (${spot.visits.length})` : ""}`,
    });
    const addBtn = head.createEl("button", { cls: "fs-small-btn" });
    addBtn.type = "button";
    setIcon(addBtn.createSpan(), "plus");
    addBtn.createSpan({ text: "Log visit" });

    const formHost = section.createDiv();
    addBtn.addEventListener("click", () => {
      if (this.addingVisit) return;
      this.addingVisit = true;
      formHost.empty();
      this.visitForm(formHost, undefined, async (visit) => {
        const before = this.spot();
        await this.plugin.store.addVisit(this.path, visit);
        if (before?.status === "want-to-try") {
          await this.plugin.store.updateSpot(this.path, { status: "visited" });
          new Notice(`Visit logged — “${before.name}” marked as visited.`);
        }
        this.addingVisit = false;
        this.render();
      }, () => {
        this.addingVisit = false;
        formHost.empty();
        this.maybeDeferredRender();
      });
    });

    const list = section.createDiv({ cls: "fs-visit-list" });
    if (spot.visits.length === 0) {
      list.createDiv({
        cls: "fs-empty-state",
        text: "No visits yet — log the first one to start rating this spot.",
      });
      return;
    }
    // Newest first for display; keep original indexes for store calls.
    const indexed = spot.visits.map((v, i) => ({ v, i }));
    indexed.sort((a, b) => b.v.date.localeCompare(a.v.date) || b.i - a.i);
    for (const { v, i } of indexed) {
      this.visitRow(list, v, i);
    }
  }

  private visitRow(parent: HTMLElement, visit: Visit, index: number): void {
    const row = parent.createDiv({ cls: "fs-visit-row" });
    if (this.editingVisitIndex === index) {
      this.visitForm(row, visit, async (updated) => {
        // Re-resolve the target: the visits list may have changed (sync,
        // another device) while the form was open — a stale ordinal would
        // silently overwrite a different visit.
        const idx = this.resolveVisitIndex(visit, index);
        if (idx === -1) {
          this.editingVisitIndex = null;
          new Notice("That visit changed while you were editing — your change was not applied.");
          this.render();
          return;
        }
        await this.plugin.store.updateVisit(this.path, idx, updated);
        this.editingVisitIndex = null;
        this.render();
      }, () => {
        this.editingVisitIndex = null;
        this.render();
      });
      return;
    }
    row.createSpan({ cls: "fs-visit-date", text: this.formatDate(visit.date) });
    const stars = row.createSpan({ cls: "fs-visit-stars" });
    if (visit.rating !== undefined) {
      starRating(stars, {
        value: visit.rating,
        halfSteps: this.plugin.settings.halfStarRatings,
        tiers: this.plugin.settings.ratingTiers,
        readOnly: true,
      });
    }
    if (visit.spent !== undefined) {
      row.createSpan({
        cls: "fs-visit-spent",
        text: `${this.plugin.settings.currencySymbol}${visit.spent}`,
      });
    }
    if (visit.note) row.createSpan({ cls: "fs-visit-note", text: visit.note });

    const actions = row.createDiv({ cls: "fs-visit-actions" });
    this.iconButton(actions, "pencil", "Edit visit", () => {
      this.editingVisitIndex = index;
      this.render();
    });
    this.iconButton(actions, "trash-2", "Delete visit", () => {
      void confirmModal(this.app, {
        title: "Delete visit",
        body: `Remove the visit on ${this.formatDate(visit.date)}? The bullet line is deleted from the note and derived ratings are recomputed.`,
        cta: "Delete visit",
        danger: true,
      }).then(async (yes) => {
        if (!yes) return;
        try {
          // Re-resolve while the confirm sat open — see updateVisit above.
          const idx = this.resolveVisitIndex(visit, index);
          if (idx === -1) {
            new Notice("That visit changed while the dialog was open — nothing was deleted.");
            this.render();
            return;
          }
          await this.plugin.store.deleteVisit(this.path, idx);
        } catch (e) {
          new Notice(`Couldn't delete the visit — ${errorMessage(e)}`);
        }
      });
    });
  }

  private visitForm(
    parent: HTMLElement,
    initial: Visit | undefined,
    onSave: (v: Visit) => Promise<void>,
    onCancel: () => void
  ): void {
    const form = parent.createDiv({ cls: "fs-visit-form" });
    const dateInput = form.createEl("input", { type: "date" });
    dateInput.value = initial?.date ?? todayIso();
    let rating = initial?.rating ?? 0;
    const starsWrap = form.createSpan({ cls: "fs-visit-form-stars" });
    starRating(starsWrap, {
      value: rating,
      halfSteps: this.plugin.settings.halfStarRatings,
      tiers: this.plugin.settings.ratingTiers,
      onChange: (v) => {
        rating = v;
      },
    });
    const spentInput = form.createEl("input", { type: "number", cls: "fs-visit-spent-input" });
    spentInput.placeholder = this.plugin.settings.currencySymbol;
    spentInput.min = "0";
    spentInput.step = "0.01";
    if (initial?.spent !== undefined) spentInput.value = String(initial.spent);
    const noteInput = form.createEl("input", { type: "text", cls: "fs-visit-note-input" });
    noteInput.placeholder = "What did you eat?";
    noteInput.value = initial?.note ?? "";

    const actions = form.createDiv({ cls: "fs-visit-form-actions" });
    const save = actions.createEl("button", { text: "Save", cls: "mod-cta fs-small-btn" });
    save.type = "button";
    const cancel = actions.createEl("button", { text: "Cancel", cls: "fs-small-btn" });
    cancel.type = "button";

    const doSave = (): void => {
      if (!dateInput.value) {
        dateInput.addClass("fs-input-invalid");
        return;
      }
      const spentRaw = spentInput.value.trim();
      const spent = spentRaw === "" ? undefined : Number(spentRaw);
      save.disabled = true;
      void onSave({
        date: dateInput.value,
        rating: rating > 0 ? rating : undefined,
        spent: spent !== undefined && !Number.isNaN(spent) ? spent : undefined,
        note: noteInput.value.trim(),
      }).catch((e: unknown) => {
        save.disabled = false;
        new Notice(`Couldn't save the visit — ${errorMessage(e)}`);
      });
    };
    save.addEventListener("click", doSave);
    noteInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") doSave();
    });
    cancel.addEventListener("click", onCancel);
    dateInput.focus();
  }

  /**
   * Find `target` in the CURRENT store snapshot: prefer the render-time
   * ordinal when it still matches, otherwise a unique content match
   * (date + note + rating + spent). -1 = gone or ambiguous — abort.
   */
  private resolveVisitIndex(target: Visit, hint: number): number {
    const visits = this.spot()?.visits ?? [];
    const same = (v: Visit): boolean =>
      v.date === target.date &&
      v.note === target.note &&
      v.rating === target.rating &&
      v.spent === target.spent;
    if (hint >= 0 && hint < visits.length && same(visits[hint])) return hint;
    const matches: number[] = [];
    visits.forEach((v, i) => {
      if (same(v)) matches.push(i);
    });
    return matches.length === 1 ? matches[0] : -1;
  }

  private maybeDeferredRender(): void {
    if (this.pendingRefresh) {
      this.pendingRefresh = false;
      this.render();
    }
  }

  // --------------------------------------------------------------- notes

  private renderNotes(parent: HTMLElement, spot: FoodSpot): void {
    const section = parent.createDiv({ cls: "fs-detail-section fs-detail-notes" });
    section.createEl("h3", { text: "Notes" });
    const area = section.createEl("textarea", { cls: "fs-notes-input" });
    area.rows = 4;
    area.placeholder = "Anything worth remembering — dishes, seating, who to bring…";
    // A store-change re-render while an edit is still debounced must NOT
    // revert the textarea to the stale indexed value (v0.1 defect #17).
    area.value = this.pendingNotes ?? spot.notes;
    area.addEventListener("input", () => {
      this.pendingNotes = area.value;
      window.clearTimeout(this.notesTimer);
      this.notesTimer = window.setTimeout(() => void this.flushNotes(), 600);
    });
    // Flush on blur too: shrinks the quit-during-debounce loss window.
    area.addEventListener("blur", () => void this.flushNotes());
  }

  private async flushNotes(): Promise<void> {
    window.clearTimeout(this.notesTimer);
    this.notesTimer = undefined;
    if (this.pendingNotes === null) return;
    const notes = this.pendingNotes;
    this.pendingNotes = null;
    try {
      await this.plugin.store.setNotes(this.path, notes);
    } catch (e) {
      // The text must survive a failed write: restore it (unless the user
      // typed more meanwhile) so the next flush retries instead of dropping it.
      if (this.pendingNotes === null) this.pendingNotes = notes;
      new Notice(`Couldn't save notes — ${errorMessage(e)}`);
    }
  }

  // -------------------------------------------------------------- footer

  private renderFooter(parent: HTMLElement, spot: FoodSpot): void {
    const footer = parent.createDiv({ cls: "fs-detail-footer" });
    const openNote = footer.createEl("button", { cls: "fs-small-btn" });
    openNote.type = "button";
    setIcon(openNote.createSpan(), "file-text");
    openNote.createSpan({ text: "Open note" });
    openNote.addEventListener("click", () => {
      this.close();
      void this.plugin.store.openNote(this.path);
    });
    const edit = footer.createEl("button", { cls: "fs-small-btn" });
    edit.type = "button";
    setIcon(edit.createSpan(), "pencil");
    edit.createSpan({ text: "Edit" });
    edit.addEventListener("click", () => {
      this.close();
      openEditModal(this.plugin, this.path);
    });
    footer.createSpan({
      cls: "fs-detail-meta",
      text: `Added ${this.formatDate(spot.created)}${
        spot.lastVisit ? ` · last visit ${this.formatDate(spot.lastVisit)}` : ""
      }`,
    });
  }

  // -------------------------------------------------------------- helpers

  private iconButton(
    parent: HTMLElement,
    icon: string,
    title: string,
    onClick: () => void
  ): HTMLButtonElement {
    const btn = parent.createEl("button", { cls: "fs-icon-btn" });
    btn.type = "button";
    btn.title = title;
    setIcon(btn, icon);
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      onClick();
    });
    return btn;
  }

  private resolvePhoto(spot: FoodSpot): string | null {
    if (!spot.photo) return null;
    if (/^https?:\/\//i.test(spot.photo)) return spot.photo;
    const app = this.plugin.app;
    const file =
      app.metadataCache.getFirstLinkpathDest(spot.photo, spot.path) ??
      app.vault.getAbstractFileByPath(spot.photo);
    return file instanceof TFile ? app.vault.getResourcePath(file) : null;
  }

  private formatDate(iso: string): string {
    return formatDate(iso, this.plugin.settings.dateFormat);
  }

  private async update(input: Partial<SpotInput>): Promise<void> {
    try {
      await this.plugin.store.updateSpot(this.path, input);
    } catch (e) {
      new Notice(`Couldn't save the change — ${errorMessage(e)}`);
    }
  }

  override onClose(): void {
    this.closed = true;
    window.clearTimeout(this.focusTimer);
    this.focusTimer = undefined;
    this.unsubscribe?.();
    this.unsubscribe = null;
    void this.flushNotes(); // never lose the last edit (v0.1 defect #17)
    this.contentEl.empty();
  }
}

// ------------------------------------------------------------------ utils

function formatDate(iso: string, fmt: DateFormat): string {
  const parts = iso.split("T")[0]?.split("-");
  if (!parts || parts.length !== 3) return iso;
  const [y, m, d] = parts;
  switch (fmt) {
    case "european":
      return `${d}-${m}-${y}`;
    case "american":
      return `${m}/${d}/${y}`;
    default:
      return `${y}-${m}-${d}`;
  }
}

function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function prettyUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url;
  }
}

/** "1234" → "1.2k" — matches the card meta count format. */
function shortCount(n: number): string {
  return n >= 1000 ? `${(Math.round(n / 100) / 10).toFixed(1)}k` : String(n);
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

type SourceUrlKey =
  | "tripadvisorUrl"
  | "yelpUrl"
  | "theforkUrl"
  | "facebookUrl"
  | "opentableUrl"
  | "eetnuUrl";

/**
 * Paste-a-URL attach flow for one rating source, with a browser site-search
 * shortcut for finding the page. Saving stores the URL and fetches ratings.
 */
class AttachSourceModal extends Modal {
  constructor(
    private plugin: FoodSpotPluginApi,
    private spot: FoodSpot,
    private source: { label: string; key: SourceUrlKey; domain: string },
    private onDone: () => void
  ) {
    super(plugin.app);
  }

  override onOpen(): void {
    const { contentEl, titleEl } = this;
    this.modalEl.addClass("fs-modal");
    titleEl.setText(`Add ${this.source.label} rating source`);

    const hint = contentEl.createDiv({ cls: "fs-import-hint" });
    hint.setText(
      `Paste the ${this.source.domain} page of "${this.spot.name}". Ratings are fetched from the page's public data.`
    );

    const input = contentEl.createEl("input", {
      type: "text",
      cls: "fs-preset-name-input",
      attr: { placeholder: `https://www.${this.source.domain}/…` },
    });
    input.value = (this.spot.external[this.source.key] as string | undefined) ?? "";

    const searchBtn = contentEl.createEl("button", {
      cls: "fs-btn fs-small-btn",
      text: `Find on ${this.source.label} (opens browser)`,
    });
    searchBtn.type = "button";
    searchBtn.style.marginTop = "8px";
    searchBtn.addEventListener("click", () => {
      const q = encodeURIComponent(
        `site:${this.source.domain} ${this.spot.name} ${this.spot.city ?? ""}`.trim()
      );
      window.open(`https://www.google.com/search?q=${q}`);
    });

    const buttons = contentEl.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    const save = buttons.createEl("button", { cls: "mod-cta", text: "Save & fetch" });
    save.type = "button";
    const doSave = async (): Promise<void> => {
      const url = input.value.trim();
      if (!/^https?:\/\//i.test(url)) {
        new Notice("Paste a full http(s) link.");
        return;
      }
      save.disabled = true;
      try {
        const updated = await this.plugin.store.updateSpot(this.spot.path, {
          external: { ...this.spot.external, [this.source.key]: url },
        });
        this.close();
        const fresh = await this.plugin.importer.refreshRatings(updated);
        if (fresh) {
          await this.plugin.store.updateSpot(this.spot.path, {
            external: { ...updated.external, ...fresh },
          });
          new Notice(`${this.source.label} rating attached.`);
        } else {
          new Notice(
            `${this.source.label} link saved, but no public rating was found on that page.`
          );
        }
        this.onDone();
      } catch (e) {
        save.disabled = false;
        new Notice(`Attach failed: ${errorMessage(e)}`);
      }
    };
    save.addEventListener("click", () => void doSave());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") void doSave();
    });
    window.setTimeout(() => input.focus(), 0);
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}
