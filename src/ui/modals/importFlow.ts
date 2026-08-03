/**
 * Food Spot — URL import flow.
 *
 * `importFromClipboard` reads the clipboard and, when it holds an http(s)
 * link, jumps straight into the import modal. `openImportModal` shows the
 * URL input + Import button with a progress state; the parsed draft either
 * goes through the review form (`reviewBeforeSave` — actually wired up,
 * unlike v0.1) or is saved directly with an Undo notice (10s window,
 * trash-recoverable).
 *
 * SPEC-v1.1 §5: importing a TripAdvisor/Yelp/TheFork URL that duplicate
 * detection matches to an existing spot offers "Attach as rating source"
 * (sets the source URL + refreshes ratings) alongside Merge / Keep-as-new.
 */
import { Modal, Notice, setIcon } from "obsidian";
import type {
  FoodSpot,
  FoodSpotPluginApi,
  ImportedSpotDraft,
  RatingSource,
  SpotInput,
  SpotSource,
} from "../../types";
import * as importers from "../../import/importers";
import { openAddModal, openMergeModal } from "./addEdit";
import { refreshSpotRatings } from "../components/card";

export function importFromClipboard(plugin: FoodSpotPluginApi): void {
  navigator.clipboard
    .readText()
    .then((text) => {
      const url = (text ?? "").trim();
      if (/^https?:\/\/\S+$/i.test(url)) {
        openImportModal(plugin, url);
      } else {
        new Notice("Clipboard doesn't contain a web link — paste one into the import box.");
        openImportModal(plugin);
      }
    })
    .catch(() => {
      new Notice("Couldn't read the clipboard — paste the link manually.");
      openImportModal(plugin);
    });
}

export function openImportModal(plugin: FoodSpotPluginApi, url?: string): void {
  new ImportModal(plugin, url).open();
}

class ImportModal extends Modal {
  private urlInput!: HTMLInputElement;
  private importBtn!: HTMLButtonElement;
  private statusEl!: HTMLElement;
  private msgEl!: HTMLElement;
  private running = false;

  constructor(
    private readonly plugin: FoodSpotPluginApi,
    private readonly initialUrl?: string
  ) {
    super(plugin.app);
  }

  override onOpen(): void {
    this.modalEl.addClass("fs-modal", "fs-import-modal");
    this.titleEl.setText("Import from a link");
    this.contentEl.createEl("p", {
      cls: "fs-import-hint",
      text: "Google Maps links (short links too), TripAdvisor pages, and most restaurant websites work.",
    });

    const wrap = this.contentEl.createDiv({ cls: "fs-field fs-field-wide" });
    wrap.createEl("label", { cls: "fs-field-label", text: "Link" });
    this.urlInput = wrap.createEl("input", {
      type: "text",
      placeholder: "https://maps.app.goo.gl/…",
    });
    this.urlInput.value = this.initialUrl ?? "";
    this.msgEl = wrap.createDiv({ cls: "fs-field-msg" });
    this.urlInput.addEventListener("input", () => {
      wrap.removeClass("fs-field-error");
      this.msgEl.setText("");
    });
    this.urlInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") void this.run();
    });

    this.statusEl = this.contentEl.createDiv({ cls: "fs-import-status" });

    const buttons = this.contentEl.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    this.importBtn = buttons.createEl("button", { text: "Import", cls: "mod-cta" });
    this.importBtn.type = "button";
    this.importBtn.addEventListener("click", () => void this.run());

    window.setTimeout(() => this.urlInput.focus(), 0);
  }

  private setStatus(text: string, spinning: boolean): void {
    this.statusEl.empty();
    if (text === "") return;
    if (spinning) {
      const icon = this.statusEl.createSpan({ cls: "fs-spin" });
      setIcon(icon, "loader-2");
    }
    this.statusEl.createSpan({ text });
  }

  private async run(): Promise<void> {
    if (this.running) return;
    const url = this.urlInput.value.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      this.urlInput.parentElement?.addClass("fs-field-error");
      this.msgEl.setText("Enter a full link starting with http:// or https://.");
      this.urlInput.focus();
      return;
    }
    this.running = true;
    this.importBtn.disabled = true;
    this.urlInput.disabled = true;
    this.setStatus("Fetching and parsing the page…", true);

    let draft: ImportedSpotDraft;
    try {
      draft = await this.plugin.importer.importFromUrl(url);
    } catch (e) {
      this.running = false;
      this.importBtn.disabled = false;
      this.urlInput.disabled = false;
      this.setStatus("", false);
      this.urlInput.parentElement?.addClass("fs-field-error");
      this.msgEl.setText(`Import failed — ${errorMessage(e)}`);
      return;
    }

    // Rating-source URL matching an existing spot? Offer to attach it as a
    // rating source instead of creating a duplicate (SPEC-v1.1 §5).
    const attach = this.findRatingAttachTarget(url, draft);
    if (attach) {
      this.setStatus("", false);
      this.showAttachChoice(attach.spot, attach.source, draft);
      return;
    }

    await this.finishImport(draft);
  }

  /** Review form or direct save — the pre-v1.1 tail of `run`. */
  private async finishImport(draft: ImportedSpotDraft): Promise<void> {
    // Warnings travel with the draft: the review form renders them as a
    // banner; on direct save they surface as Notices (this modal closes
    // before its own status line could ever be seen).
    if (this.plugin.settings.reviewBeforeSave) {
      this.close();
      openAddModal(this.plugin, draft);
      return;
    }

    // Direct save (best-effort draft with defaults) + Undo notice.
    const input = draftToInput(this.plugin, draft);
    if (!input) {
      this.close();
      new Notice("Couldn't read a name from that link — review the details before saving.");
      openAddModal(this.plugin, draft);
      return;
    }
    try {
      const created = await this.plugin.store.createSpot(input);
      this.close();
      showUndoNotice(this.plugin, created);
      for (const w of draft.warnings) new Notice(`Import warning — ${w}`, 10000);
    } catch (e) {
      this.running = false;
      this.importBtn.disabled = false;
      this.urlInput.disabled = false;
      this.setStatus("", false);
      this.urlInput.parentElement?.addClass("fs-field-error");
      this.msgEl.setText(`Couldn't save the spot — ${errorMessage(e)}`);
    }
  }

  // -------------------------------------------------- attach rating source

  /**
   * A TripAdvisor/Yelp/TheFork import whose draft matches an existing spot
   * (distance-aware duplicate scan) — the attach candidate, or null.
   */
  private findRatingAttachTarget(
    url: string,
    draft: ImportedSpotDraft
  ): { spot: FoodSpot; source: AttachSource } | null {
    if (!this.plugin.settings.duplicateDetectionEnabled) return null;
    const source = detectSource(draft.sourceUrl) ?? detectSource(url);
    if (source !== "tripadvisor" && source !== "yelp" && source !== "thefork") return null;
    let dups: FoodSpot[] = [];
    try {
      dups = this.plugin.importer.findDuplicates(draft.fields, this.plugin.store.getSpots());
    } catch {
      return null; // duplicate scan is best-effort — fall back to the normal flow
    }
    const spot = dups[0];
    return spot ? { spot, source } : null;
  }

  private showAttachChoice(
    target: FoodSpot,
    source: AttachSource,
    draft: ImportedSpotDraft
  ): void {
    const banner = this.contentEl.createDiv({ cls: "fs-dup-banner fs-attach-banner" });
    const icon = banner.createSpan({ cls: "fs-dup-icon" });
    setIcon(icon, "star");
    const text = banner.createDiv({ cls: "fs-dup-text" });
    text.createDiv({
      text: `This ${SOURCE_LABELS[source]} page looks like “${target.name}”${
        target.city ? ` in ${target.city}` : ""
      }, which is already in your library.`,
    });
    const actions = text.createDiv({ cls: "fs-dup-actions" });

    const attach = actions.createEl("button", {
      text: `Attach as rating source to “${target.name}”`,
      cls: "mod-cta",
    });
    attach.type = "button";
    attach.addEventListener("click", () => {
      attach.disabled = true;
      void this.attachRatingSource(target, source, draft.sourceUrl).catch((e: unknown) => {
        attach.disabled = false;
        new Notice(`Couldn't attach the rating source — ${errorMessage(e)}`);
      });
    });

    const merge = actions.createEl("button", { text: "Merge into existing" });
    merge.type = "button";
    merge.addEventListener("click", () => {
      this.close();
      openMergeModal(this.plugin, target.path, draft.fields);
    });

    const keep = actions.createEl("button", { text: "Keep as new" });
    keep.type = "button";
    keep.addEventListener("click", () => {
      banner.remove();
      void this.finishImport(draft);
    });
  }

  /** Set the source URL on the existing spot, then refresh its ratings. */
  private async attachRatingSource(
    target: FoodSpot,
    source: AttachSource,
    url: string
  ): Promise<void> {
    const key = SOURCE_URL_KEYS[source];
    const updated = await this.plugin.store.updateSpot(target.path, {
      external: { ...target.external, [key]: url },
    });
    this.close();
    new Notice(`Attached ${SOURCE_LABELS[source]} as a rating source for “${target.name}”.`);
    void refreshSpotRatings(this.plugin, updated);
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}

type AttachSource = Exclude<RatingSource, "google">;

const SOURCE_LABELS: Record<AttachSource, string> = {
  tripadvisor: "TripAdvisor",
  yelp: "Yelp",
  thefork: "TheFork",
  facebook: "Facebook",
  opentable: "OpenTable",
  eetnu: "Eet.nu",
};

const SOURCE_URL_KEYS: Record<AttachSource, keyof FoodSpot["external"]> = {
  tripadvisor: "tripadvisorUrl",
  yelp: "yelpUrl",
  thefork: "theforkUrl",
  facebook: "facebookUrl",
  opentable: "opentableUrl",
  eetnu: "eetnuUrl",
};

/**
 * Rating-source detection: prefers the importers module's export (added in
 * this wave); host-based fallback keeps this file self-sufficient meanwhile.
 */
const detectSource: (url: string) => RatingSource | null =
  (importers as { detectRatingSource?: (url: string) => RatingSource | null })
    .detectRatingSource ?? fallbackDetectSource;

function fallbackDetectSource(url: string): RatingSource | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host.includes("tripadvisor.")) return "tripadvisor";
  if (host === "yelp.com" || host.endsWith(".yelp.com")) return "yelp";
  if (host.includes("thefork.") || host.includes("lafourchette.") || host.includes("eltenedor."))
    return "thefork";
  return null;
}

/**
 * Every SpotInput key, required (the value may still be undefined). Same gate
 * as `spotStore.updateSpot`: a field added to the contract must break the
 * build here rather than be silently dropped from every import.
 */
type CompleteSpotInput = SpotInput & Record<keyof SpotInput, unknown>;

/** Best-effort SpotInput from a draft; null when there's no usable name. */
function draftToInput(plugin: FoodSpotPluginApi, draft: ImportedSpotDraft): SpotInput | null {
  const f = draft.fields;
  const name = f.name?.trim();
  if (!name) return null;
  return {
    name,
    cuisines: f.cuisines ?? [],
    country: f.country ?? plugin.settings.defaultCountry ?? "",
    city: f.city,
    district: f.district,
    address: f.address,
    coordinates: f.coordinates,
    status: f.status ?? "want-to-try",
    favorite: f.favorite ?? false,
    rating: f.rating,
    ratingLocked: f.ratingLocked ?? false,
    price: f.price,
    url: f.url,
    phone: f.phone,
    source: f.source ?? kindToSource(draft.importerKind),
    sourceUrl: f.sourceUrl ?? draft.sourceUrl,
    // v0.1 defect #3: external ratings survive the save.
    external: { ...(f.external ?? {}) },
    photo: f.photo,
    menu: f.menu,
    // Google returns opening hours and the pipeline puts them on the draft;
    // omitting them here meant an imported note never carried the hours the
    // import dialog had just shown.
    hours: f.hours,
    tags: f.tags ?? [],
    visits: f.visits ?? [],
    notes: f.notes ?? "",
    // Store-owned: a brand new note gets its own identity and timestamps.
    legacyId: undefined,
    ctime: undefined,
    created: undefined,
  } satisfies CompleteSpotInput;
}

function kindToSource(kind: ImportedSpotDraft["importerKind"]): SpotSource {
  switch (kind) {
    case "google-maps":
      return "google-maps";
    case "tripadvisor":
      return "tripadvisor";
    default:
      return "url";
  }
}

/** "Added X — Undo" notice; Undo trash-deletes the created note within 10s. */
function showUndoNotice(plugin: FoodSpotPluginApi, spot: FoodSpot): void {
  const frag = document.createDocumentFragment();
  frag.createSpan({ text: `Added “${spot.name}”. ` });
  const btn = frag.createEl("button", { text: "Undo", cls: "fs-notice-undo" });
  btn.type = "button";
  const notice = new Notice(frag, 10000);
  btn.addEventListener("click", () => {
    notice.hide();
    plugin.store.deleteSpot(spot.path).then(
      () => new Notice("Import undone — the note went to the trash."),
      (e: unknown) => new Notice(`Couldn't undo the import — ${errorMessage(e)}`)
    );
  });
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
