/**
 * Food Spot — Add / Edit modal.
 *
 * Grouped sections (Essentials / Location / Ratings & price / Extra),
 * autocomplete from store.distinct, single "lat, lng" coordinates field with
 * paste support (clearing clears the pair — v0.1 wrote `0` and relocated the
 * spot to the Gulf of Guinea), inline per-field validation (no Notice walls),
 * confidence styling on draft-prefilled fields, distance-aware duplicate
 * banner with Merge / Keep-as-new, and an in-modal Google Places search with
 * duplicate badges and a generation counter against stale responses.
 *
 * External ratings from an import draft SURVIVE the save (v0.1 dropped them).
 */
import { Modal, Notice, setIcon } from "obsidian";
import type {
  Coordinates,
  ExternalRatings,
  FoodSpot,
  FoodSpotPluginApi,
  ImportedSpotDraft,
  PlaceCandidate,
  SpotInput,
  SpotSource,
  SpotStatus,
  Visit,
} from "../../types";
import { SPOT_STATUSES } from "../../types";
import { starRating, type StarRatingHandle } from "../components/starRating";
import { attachAutocomplete, type AutocompleteHandle } from "../components/autocomplete";

export function openAddModal(
  plugin: FoodSpotPluginApi,
  draft?: ImportedSpotDraft,
  opts?: { focusSearch?: boolean }
): void {
  new AddEditModal(plugin, { mode: "add", draft, focusSearch: opts?.focusSearch }).open();
}

export function openEditModal(plugin: FoodSpotPluginApi, path: string): void {
  new AddEditModal(plugin, { mode: "edit", path }).open();
}

/** Edit an existing spot with draft fields merged into its gaps (import-flow "Merge"). */
export function openMergeModal(
  plugin: FoodSpotPluginApi,
  path: string,
  mergeFields: Partial<SpotInput>
): void {
  new AddEditModal(plugin, { mode: "edit", path, mergeFields }).open();
}

interface AddEditOptions {
  mode: "add" | "edit";
  path?: string;
  draft?: ImportedSpotDraft;
  /** Fields merged into an existing spot ("Merge into existing" flow). */
  mergeFields?: Partial<SpotInput>;
  focusSearch?: boolean;
}

interface FormState {
  name: string;
  cuisines: string[];
  status: SpotStatus;
  favorite: boolean;
  country: string;
  city: string;
  district: string;
  address: string;
  coordsRaw: string;
  rating?: number;
  ratingLocked: boolean;
  price?: number;
  url: string;
  phone: string;
  tags: string[];
  photo: string;
  menu: string;
  notes: string;
  source: SpotSource;
  sourceUrl?: string;
  external: ExternalRatings;
  legacyId?: string;
}

const STATUS_LABELS: Record<SpotStatus, string> = {
  "want-to-try": "Want to try",
  visited: "Visited",
};

class AddEditModal extends Modal {
  private state: FormState;
  private existingVisits: Visit[] = [];
  /**
   * Edit mode: the spot as it was when the modal opened. On save, only the
   * fields the user actually changed relative to this snapshot are written —
   * anything edited elsewhere (note editor, sync, rating refresh) while the
   * modal sat open is preserved instead of being clobbered by stale values.
   */
  private editBaseline: SpotInput | null = null;
  private lowConfidence = new Set<string>();
  private mergedKeys = new Set<string>();
  private dupDismissed = false;
  private dupBannerEl: HTMLElement | null = null;
  private saving = false;
  private searchGen = 0;
  private searchTimer: number | undefined;
  private acHandles: AutocompleteHandle[] = [];

  // Control refs (incremental updates only — never rebuild on input).
  private searchInput: HTMLInputElement | null = null;
  private nameInput!: HTMLInputElement;
  private cuisinesInput!: HTMLInputElement;
  private statusBtns = new Map<SpotStatus, HTMLElement>();
  private favoriteInput!: HTMLInputElement;
  private countryInput!: HTMLInputElement;
  private cityInput!: HTMLInputElement;
  private districtInput!: HTMLInputElement;
  private addressInput!: HTMLInputElement;
  private coordsInput!: HTMLInputElement;
  private starHandle!: StarRatingHandle;
  private priceBtns: HTMLElement[] = [];
  private urlInput!: HTMLInputElement;
  private phoneInput!: HTMLInputElement;
  private tagsInput!: HTMLInputElement;
  private photoInput!: HTMLInputElement;
  private menuInput!: HTMLInputElement;
  private taUrlInput!: HTMLInputElement;
  private yelpUrlInput!: HTMLInputElement;
  private theforkUrlInput!: HTMLInputElement;
  private facebookUrlInput!: HTMLInputElement;
  private opentableUrlInput!: HTMLInputElement;
  private eetnuUrlInput!: HTMLInputElement;
  private notesArea!: HTMLTextAreaElement;
  private saveBtn!: HTMLButtonElement;

  constructor(
    private readonly plugin: FoodSpotPluginApi,
    private readonly opts: AddEditOptions
  ) {
    super(plugin.app);
    this.state = this.initialState();
  }

  // -------------------------------------------------------------- state

  private initialState(): FormState {
    const s: FormState = {
      name: "",
      cuisines: [],
      status: "want-to-try",
      favorite: false,
      country: this.plugin.settings.defaultCountry ?? "",
      city: "",
      district: "",
      address: "",
      coordsRaw: "",
      ratingLocked: false,
      url: "",
      phone: "",
      tags: [],
      photo: "",
      menu: "",
      notes: "",
      source: "manual",
      external: {},
    };
    if (this.opts.mode === "edit" && this.opts.path) {
      const spot = this.plugin.store.getByPath(this.opts.path);
      if (spot) {
        s.name = spot.name;
        s.cuisines = [...spot.cuisines];
        s.status = spot.status;
        s.favorite = spot.favorite;
        s.country = spot.country;
        s.city = spot.city ?? "";
        s.district = spot.district ?? "";
        s.address = spot.address ?? "";
        s.coordsRaw = spot.coordinates
          ? `${spot.coordinates.lat}, ${spot.coordinates.lng}`
          : "";
        s.rating = spot.rating;
        s.ratingLocked = spot.ratingLocked;
        s.price = spot.price;
        s.url = spot.url ?? "";
        s.phone = spot.phone ?? "";
        s.tags = [...spot.tags];
        s.photo = spot.photo ?? "";
        s.menu = spot.menu ?? "";
        s.notes = spot.notes;
        s.source = spot.source;
        s.sourceUrl = spot.sourceUrl;
        s.external = { ...spot.external };
        s.legacyId = spot.legacyId;
        this.existingVisits = spot.visits.map((v) => ({ ...v }));
        this.editBaseline = baselineFromSpot(spot);
      }
    }
    if (this.opts.draft) this.applyDraftTo(s, this.opts.draft);
    if (this.opts.mergeFields) this.applyMergeTo(s, this.opts.mergeFields);
    return s;
  }

  private applyDraftTo(s: FormState, draft: ImportedSpotDraft): void {
    const f = draft.fields;
    if (f.name !== undefined) s.name = f.name;
    if (f.cuisines !== undefined) s.cuisines = [...f.cuisines];
    if (f.status !== undefined) s.status = f.status;
    if (f.favorite !== undefined) s.favorite = f.favorite;
    if (f.country !== undefined) s.country = f.country;
    if (f.city !== undefined) s.city = f.city;
    if (f.district !== undefined) s.district = f.district;
    if (f.address !== undefined) s.address = f.address;
    if (f.coordinates !== undefined)
      s.coordsRaw = `${f.coordinates.lat}, ${f.coordinates.lng}`;
    if (f.rating !== undefined) s.rating = f.rating;
    if (f.ratingLocked !== undefined) s.ratingLocked = f.ratingLocked;
    if (f.price !== undefined) s.price = f.price;
    if (f.url !== undefined) s.url = f.url;
    if (f.phone !== undefined) s.phone = f.phone;
    if (f.tags !== undefined) s.tags = [...f.tags];
    if (f.photo !== undefined) s.photo = f.photo;
    if (f.menu !== undefined) s.menu = f.menu;
    if (f.notes !== undefined) s.notes = f.notes;
    s.source = f.source ?? kindToSource(draft.importerKind);
    s.sourceUrl = f.sourceUrl ?? draft.sourceUrl;
    if (f.external) s.external = { ...s.external, ...f.external };
    this.lowConfidence = new Set(
      Object.entries(draft.confidence)
        .filter(([, c]) => c === "low")
        .map(([k]) => (k === "coordinates" ? "coords" : k))
    );
  }

  /** Fill empty fields of an existing spot from merged draft values. */
  private applyMergeTo(s: FormState, m: Partial<SpotInput>): void {
    const fill = (key: string, cur: string, val: string | undefined): string => {
      if (cur.trim() === "" && val && val.trim() !== "") {
        this.mergedKeys.add(key);
        return val;
      }
      return cur;
    };
    s.city = fill("city", s.city, m.city);
    s.district = fill("district", s.district, m.district);
    s.address = fill("address", s.address, m.address);
    s.url = fill("url", s.url, m.url);
    s.phone = fill("phone", s.phone, m.phone);
    s.photo = fill("photo", s.photo, m.photo);
    s.menu = fill("menu", s.menu, m.menu);
    s.country = fill("country", s.country, m.country);
    if (s.coordsRaw.trim() === "" && m.coordinates) {
      s.coordsRaw = `${m.coordinates.lat}, ${m.coordinates.lng}`;
      this.mergedKeys.add("coords");
    }
    if (s.price === undefined && m.price !== undefined) s.price = m.price;
    if (m.cuisines?.length) {
      const have = new Set(s.cuisines.map((c) => c.toLowerCase()));
      for (const c of m.cuisines) if (!have.has(c.toLowerCase())) s.cuisines.push(c);
    }
    if (m.tags?.length) {
      const have = new Set(s.tags.map((t) => t.toLowerCase()));
      for (const t of m.tags) if (!have.has(t.toLowerCase())) s.tags.push(t);
    }
    if (m.external) {
      s.external = { ...m.external, ...stripUndefined(s.external) };
    }
    if (!s.sourceUrl && m.sourceUrl) s.sourceUrl = m.sourceUrl;
  }

  // -------------------------------------------------------------- render

  override onOpen(): void {
    this.modalEl.addClass("fs-modal", "fs-addedit-modal");
    if (this.opts.mode === "edit" && !this.plugin.store.getByPath(this.opts.path ?? "")) {
      new Notice("That spot no longer exists.");
      this.close();
      return;
    }
    this.titleEl.setText(
      this.opts.mode === "add"
        ? "Add a food spot"
        : `Edit — ${this.state.name || "spot"}`
    );

    // Importer warnings (bot-check detection, incomplete fields, …) — shown
    // here because the import modal closes before its status line can paint.
    const warnings = this.opts.draft?.warnings ?? [];
    if (warnings.length > 0) {
      const banner = this.contentEl.createDiv({ cls: "fs-import-warnings" });
      const icon = banner.createSpan({ cls: "fs-dup-icon" });
      setIcon(icon, "alert-triangle");
      const list = banner.createDiv();
      for (const w of warnings) list.createDiv({ cls: "fs-import-warning", text: w });
    }

    const body = this.contentEl.createDiv({ cls: "fs-addedit-body" });

    if (this.opts.mode === "add" && this.plugin.importer.hasGoogleKey()) {
      this.buildSearchSection(body);
    }
    this.buildEssentials(body);
    this.buildLocation(body);
    this.buildRatingsPrice(body);
    this.buildExtra(body);

    const buttons = this.contentEl.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    this.saveBtn = buttons.createEl("button", {
      text: this.opts.mode === "add" ? "Add spot" : "Save changes",
      cls: "mod-cta",
    });
    this.saveBtn.type = "button";
    this.saveBtn.addEventListener("click", () => void this.save());

    this.markProvenance();
    window.setTimeout(() => {
      if (this.opts.focusSearch && this.searchInput) this.searchInput.focus();
      else this.nameInput.focus();
    }, 0);
  }

  private section(parent: HTMLElement, title: string, icon: string): HTMLElement {
    const sec = parent.createDiv({ cls: "fs-form-section" });
    const head = sec.createDiv({ cls: "fs-form-section-title" });
    const ic = head.createSpan({ cls: "fs-section-icon" });
    setIcon(ic, icon);
    head.createSpan({ text: title });
    return sec.createDiv({ cls: "fs-form-section-body" });
  }

  private field(
    parent: HTMLElement,
    label: string,
    key: string,
    wide = false
  ): HTMLElement {
    const wrap = parent.createDiv({ cls: "fs-field" });
    if (wide) wrap.addClass("fs-field-wide");
    wrap.dataset["key"] = key;
    wrap.createEl("label", { cls: "fs-field-label", text: label });
    return wrap;
  }

  private textField(
    parent: HTMLElement,
    label: string,
    key: string,
    opts: {
      value: string;
      placeholder?: string;
      wide?: boolean;
      onInput: (v: string) => void;
    }
  ): HTMLInputElement {
    const wrap = this.field(parent, label, key, opts.wide ?? false);
    const input = wrap.createEl("input", { type: "text" });
    if (opts.placeholder) input.placeholder = opts.placeholder;
    input.value = opts.value;
    input.addEventListener("input", () => {
      opts.onInput(input.value);
      this.clearError(key);
      input.removeClass("fs-conf-low");
    });
    wrap.createDiv({ cls: "fs-field-msg" });
    return input;
  }

  // ------------------------------------------------ Google Places search

  private buildSearchSection(parent: HTMLElement): void {
    const body = this.section(parent, "Search online", "search");
    body.addClass("fs-search-section");
    const wrap = body.createDiv({ cls: "fs-field fs-field-wide" });
    this.searchInput = wrap.createEl("input", {
      type: "text",
      cls: "fs-places-search",
      placeholder: "Search Google Places — “momiji den haag”…",
    });
    const results = body.createDiv({ cls: "fs-search-results" });
    this.searchInput.addEventListener("input", () => {
      window.clearTimeout(this.searchTimer);
      const q = this.searchInput?.value.trim() ?? "";
      const gen = ++this.searchGen; // invalidate anything in flight
      if (q.length < 2) {
        results.empty();
        return;
      }
      this.searchTimer = window.setTimeout(
        () => void this.runSearch(q, gen, results),
        600
      );
    });
  }

  private async runSearch(q: string, gen: number, resultsEl: HTMLElement): Promise<void> {
    resultsEl.empty();
    resultsEl.createDiv({ cls: "fs-search-status", text: "Searching…" });
    let candidates: PlaceCandidate[];
    try {
      candidates = await this.plugin.importer.searchPlaces(q);
    } catch (e) {
      if (gen !== this.searchGen) return;
      resultsEl.empty();
      resultsEl.createDiv({
        cls: "fs-search-status fs-search-error",
        text: `Search failed — ${errorMessage(e)}`,
      });
      return;
    }
    if (gen !== this.searchGen) return; // stale response — drop it
    resultsEl.empty();
    if (candidates.length === 0) {
      resultsEl.createDiv({ cls: "fs-search-status", text: `No places found for “${q}”.` });
      return;
    }
    const spots = this.plugin.store.getSpots();
    const savedIds = new Set(
      spots.map((s) => s.external.googlePlaceId).filter((id): id is string => !!id)
    );
    const savedNames = new Set(spots.map((s) => normalizeName(s.name)));
    for (const c of candidates.slice(0, 8)) {
      const saved = savedIds.has(c.placeId) || savedNames.has(normalizeName(c.name));
      const tile = resultsEl.createDiv({ cls: "fs-result-tile" });
      if (saved) tile.addClass("fs-in-library");
      const main = tile.createDiv({ cls: "fs-result-main" });
      const nameRow = main.createDiv({ cls: "fs-result-name" });
      nameRow.createSpan({ text: c.name });
      if (saved) nameRow.createSpan({ cls: "fs-badge-saved", text: "✓ Already saved" });
      main.createDiv({ cls: "fs-result-address", text: c.address });
      const meta = tile.createDiv({ cls: "fs-result-meta" });
      if (c.rating !== undefined) {
        meta.createSpan({
          cls: "fs-result-rating",
          text: `★ ${c.rating.toFixed(1)}${c.ratingCount ? ` (${formatCount(c.ratingCount)})` : ""}`,
        });
      }
      if (c.priceLevel !== undefined && c.priceLevel > 0) {
        meta.createSpan({
          cls: "fs-result-price",
          text: this.plugin.settings.currencySymbol.repeat(Math.min(4, c.priceLevel)),
        });
      }
      tile.addEventListener("click", () => void this.pickCandidate(c, resultsEl));
    }
  }

  private async pickCandidate(c: PlaceCandidate, resultsEl: HTMLElement): Promise<void> {
    const gen = ++this.searchGen;
    resultsEl.empty();
    resultsEl.createDiv({ cls: "fs-search-status", text: `Loading details for ${c.name}…` });
    try {
      const draft = await this.plugin.importer.placeDetails(c.placeId);
      if (gen !== this.searchGen) return;
      this.applyDraftTo(this.state, draft);
      this.syncInputs();
      this.markProvenance();
      resultsEl.empty();
      resultsEl.createDiv({
        cls: "fs-search-status",
        text: `Prefilled from Google — review the fields below.`,
      });
    } catch (e) {
      if (gen !== this.searchGen) return;
      resultsEl.empty();
      resultsEl.createDiv({
        cls: "fs-search-status fs-search-error",
        text: `Couldn't load details — ${errorMessage(e)}`,
      });
    }
  }

  // ------------------------------------------------------------ sections

  private buildEssentials(parent: HTMLElement): void {
    const body = this.section(parent, "Essentials", "utensils");
    const grid = body.createDiv({ cls: "fs-field-grid" });

    this.nameInput = this.textField(grid, "Name", "name", {
      value: this.state.name,
      placeholder: "Momiji",
      wide: true,
      onInput: (v) => {
        this.state.name = v;
        this.resetDupBanner();
      },
    });
    this.cuisinesInput = this.textField(grid, "Cuisines", "cuisines", {
      value: this.state.cuisines.join(", "),
      placeholder: "Japanese, Sushi",
      wide: true,
      onInput: (v) => {
        this.state.cuisines = splitList(v);
      },
    });
    this.acHandles.push(
      attachAutocomplete(this.cuisinesInput, {
        getSuggestions: () => this.plugin.store.distinct("cuisines"),
        multi: true,
      })
    );

    const statusWrap = this.field(grid, "Status", "status");
    const seg = statusWrap.createDiv({ cls: "fs-segmented" });
    for (const st of SPOT_STATUSES) {
      const btn = seg.createEl("button", { cls: "fs-seg-btn", text: STATUS_LABELS[st] });
      btn.type = "button";
      btn.addEventListener("click", () => {
        this.state.status = st;
        this.paintStatus();
      });
      this.statusBtns.set(st, btn);
    }
    this.paintStatus();

    const favWrap = this.field(grid, "Favorite", "favorite");
    const favLabel = favWrap.createEl("label", { cls: "fs-checkbox-label" });
    this.favoriteInput = favLabel.createEl("input", { type: "checkbox" });
    this.favoriteInput.checked = this.state.favorite;
    favLabel.createSpan({ text: "Mark as favorite" });
    this.favoriteInput.addEventListener("change", () => {
      this.state.favorite = this.favoriteInput.checked;
    });
  }

  private buildLocation(parent: HTMLElement): void {
    const body = this.section(parent, "Location", "map-pin");
    const grid = body.createDiv({ cls: "fs-field-grid" });

    this.countryInput = this.textField(grid, "Country", "country", {
      value: this.state.country,
      placeholder: "Netherlands",
      onInput: (v) => {
        this.state.country = v;
      },
    });
    this.acHandles.push(
      attachAutocomplete(this.countryInput, {
        getSuggestions: () => this.plugin.store.distinct("country"),
      })
    );
    this.cityInput = this.textField(grid, "City", "city", {
      value: this.state.city,
      placeholder: "Den Haag",
      onInput: (v) => {
        this.state.city = v;
      },
    });
    this.acHandles.push(
      attachAutocomplete(this.cityInput, {
        getSuggestions: () => this.plugin.store.distinct("city"),
      })
    );
    this.districtInput = this.textField(grid, "District", "district", {
      value: this.state.district,
      placeholder: "Scheveningen",
      onInput: (v) => {
        this.state.district = v;
      },
    });
    this.acHandles.push(
      attachAutocomplete(this.districtInput, {
        getSuggestions: () => this.plugin.store.distinct("district"),
      })
    );
    this.addressInput = this.textField(grid, "Address", "address", {
      value: this.state.address,
      placeholder: "Street 1, 2511 XX",
      onInput: (v) => {
        this.state.address = v;
      },
    });
    this.coordsInput = this.textField(grid, "Coordinates", "coords", {
      value: this.state.coordsRaw,
      placeholder: "52.0808, 4.2889 — paste “lat, lng”; clear to remove both",
      wide: true,
      onInput: (v) => {
        this.state.coordsRaw = v;
      },
    });
  }

  private buildRatingsPrice(parent: HTMLElement): void {
    const body = this.section(parent, "Ratings & price", "star");
    const grid = body.createDiv({ cls: "fs-field-grid" });

    const ratingWrap = this.field(grid, "My rating", "rating");
    this.starHandle = starRating(ratingWrap, {
      value: this.state.rating,
      halfSteps: this.plugin.settings.halfStarRatings,
      tiers: this.plugin.settings.ratingTiers,
      showLabel: true,
      onChange: (v) => {
        if (v > 0) {
          this.state.rating = v;
          this.state.ratingLocked = true;
        } else {
          this.state.rating = undefined;
          this.state.ratingLocked = false;
        }
      },
    });
    ratingWrap.createDiv({
      cls: "fs-field-hint",
      text: "Set manually to lock it; otherwise it follows your visit ratings.",
    });

    const priceWrap = this.field(grid, "Price", "price");
    const seg = priceWrap.createDiv({ cls: "fs-segmented" });
    this.priceBtns = [];
    for (let n = 1; n <= 4; n++) {
      const btn = seg.createEl("button", {
        cls: "fs-seg-btn",
        text: this.plugin.settings.currencySymbol.repeat(n),
      });
      btn.type = "button";
      btn.addEventListener("click", () => {
        this.state.price = this.state.price === n ? undefined : n;
        this.paintPrice();
      });
      this.priceBtns.push(btn);
    }
    this.paintPrice();

    this.urlInput = this.textField(grid, "Website", "url", {
      value: this.state.url,
      placeholder: "https://…",
      onInput: (v) => {
        this.state.url = v;
      },
    });
    this.phoneInput = this.textField(grid, "Phone", "phone", {
      value: this.state.phone,
      placeholder: "+31 70 …",
      onInput: (v) => {
        this.state.phone = v;
      },
    });

    // SPEC-v1.1 §5: rating-source page URLs; ratings are fetched from them
    // on refresh. TheFork rates 0–10 — stored raw, displayed "/10".
    this.taUrlInput = this.textField(grid, "TripAdvisor URL", "tripadvisorUrl", {
      value: this.state.external.tripadvisorUrl ?? "",
      placeholder: "https://www.tripadvisor.com/…",
      wide: true,
      onInput: (v) => {
        this.state.external.tripadvisorUrl = emptyToUndef(v);
      },
    });
    this.yelpUrlInput = this.textField(grid, "Yelp URL", "yelpUrl", {
      value: this.state.external.yelpUrl ?? "",
      placeholder: "https://www.yelp.com/biz/…",
      wide: true,
      onInput: (v) => {
        this.state.external.yelpUrl = emptyToUndef(v);
      },
    });
    this.theforkUrlInput = this.textField(grid, "TheFork URL", "theforkUrl", {
      value: this.state.external.theforkUrl ?? "",
      placeholder: "https://www.thefork.com/restaurant/…",
      wide: true,
      onInput: (v) => {
        this.state.external.theforkUrl = emptyToUndef(v);
      },
    });
    this.facebookUrlInput = this.textField(grid, "Facebook URL", "facebookUrl", {
      value: this.state.external.facebookUrl ?? "",
      placeholder: "https://www.facebook.com/…",
      wide: true,
      onInput: (v) => {
        this.state.external.facebookUrl = emptyToUndef(v);
      },
    });
    this.opentableUrlInput = this.textField(grid, "OpenTable URL", "opentableUrl", {
      value: this.state.external.opentableUrl ?? "",
      placeholder: "https://www.opentable.com/r/…",
      wide: true,
      onInput: (v) => {
        this.state.external.opentableUrl = emptyToUndef(v);
      },
    });
    this.eetnuUrlInput = this.textField(grid, "Eet.nu URL", "eetnuUrl", {
      value: this.state.external.eetnuUrl ?? "",
      placeholder: "https://www.eet.nu/…",
      wide: true,
      onInput: (v) => {
        this.state.external.eetnuUrl = emptyToUndef(v);
      },
    });
    const hint = grid.createDiv({ cls: "fs-field-hint fs-field-wide" });
    hint.setText(
      "Paste the spot's page link per source — public ratings are fetched from it on Refresh. TheFork and Eet.nu use a 10-scale. Facebook only works for pages that expose ratings publicly."
    );
  }

  private buildExtra(parent: HTMLElement): void {
    const body = this.section(parent, "Extra", "tag");
    const grid = body.createDiv({ cls: "fs-field-grid" });

    this.tagsInput = this.textField(grid, "Tags", "tags", {
      value: this.state.tags.join(", "),
      placeholder: "date-night, terrace",
      wide: true,
      onInput: (v) => {
        this.state.tags = splitList(v);
      },
    });
    this.acHandles.push(
      attachAutocomplete(this.tagsInput, {
        getSuggestions: () => this.plugin.store.distinct("tags"),
        multi: true,
      })
    );
    this.photoInput = this.textField(grid, "Photo", "photo", {
      value: this.state.photo,
      placeholder: "https://… or a vault path",
      wide: true,
      onInput: (v) => {
        this.state.photo = v;
      },
    });
    this.menuInput = this.textField(grid, "Menu", "menu", {
      value: this.state.menu,
      placeholder: "https://… or a vault path (image/PDF)",
      wide: true,
      onInput: (v) => {
        this.state.menu = v;
      },
    });

    const notesWrap = this.field(grid, "Notes", "notes", true);
    this.notesArea = notesWrap.createEl("textarea", { cls: "fs-notes-input" });
    this.notesArea.rows = 3;
    this.notesArea.value = this.state.notes;
    this.notesArea.addEventListener("input", () => {
      this.state.notes = this.notesArea.value;
    });
  }

  // --------------------------------------------------------- sync/paint

  private paintStatus(): void {
    for (const [st, btn] of this.statusBtns) {
      btn.toggleClass("fs-active", st === this.state.status);
    }
  }

  private paintPrice(): void {
    this.priceBtns.forEach((btn, i) => {
      btn.toggleClass("fs-active", this.state.price !== undefined && i < this.state.price);
    });
  }

  /** Push state into existing controls (used after search prefill). */
  private syncInputs(): void {
    this.nameInput.value = this.state.name;
    this.cuisinesInput.value = this.state.cuisines.join(", ");
    this.favoriteInput.checked = this.state.favorite;
    this.countryInput.value = this.state.country;
    this.cityInput.value = this.state.city;
    this.districtInput.value = this.state.district;
    this.addressInput.value = this.state.address;
    this.coordsInput.value = this.state.coordsRaw;
    this.urlInput.value = this.state.url;
    this.phoneInput.value = this.state.phone;
    this.tagsInput.value = this.state.tags.join(", ");
    this.photoInput.value = this.state.photo;
    this.menuInput.value = this.state.menu;
    this.taUrlInput.value = this.state.external.tripadvisorUrl ?? "";
    this.yelpUrlInput.value = this.state.external.yelpUrl ?? "";
    this.theforkUrlInput.value = this.state.external.theforkUrl ?? "";
    this.facebookUrlInput.value = this.state.external.facebookUrl ?? "";
    this.opentableUrlInput.value = this.state.external.opentableUrl ?? "";
    this.eetnuUrlInput.value = this.state.external.eetnuUrl ?? "";
    this.notesArea.value = this.state.notes;
    this.starHandle.set(this.state.rating);
    this.paintStatus();
    this.paintPrice();
    this.resetDupBanner();
  }

  /** Italic/faded styling on low-confidence or merged-in fields. */
  private markProvenance(): void {
    const keys = new Set([...this.lowConfidence, ...this.mergedKeys]);
    this.contentEl.querySelectorAll<HTMLElement>(".fs-field").forEach((wrap) => {
      const key = wrap.dataset["key"] ?? "";
      const control = wrap.querySelector<HTMLElement>("input, textarea");
      if (!control) return;
      control.toggleClass("fs-conf-low", keys.has(key));
    });
  }

  // ---------------------------------------------------------- validation

  private setError(key: string, msg: string): boolean {
    const wrap = this.contentEl.querySelector<HTMLElement>(`.fs-field[data-key="${key}"]`);
    if (!wrap) return false;
    wrap.addClass("fs-field-error");
    wrap.querySelector(".fs-field-msg")?.setText(msg);
    return true;
  }

  private clearError(key: string): void {
    const wrap = this.contentEl.querySelector<HTMLElement>(`.fs-field[data-key="${key}"]`);
    if (!wrap) return;
    wrap.removeClass("fs-field-error");
    wrap.querySelector(".fs-field-msg")?.setText("");
  }

  private validate(): { ok: boolean; coordinates?: Coordinates } {
    for (const key of [
      "name",
      "coords",
      "url",
      "tripadvisorUrl",
      "yelpUrl",
      "theforkUrl",
      "facebookUrl",
      "opentableUrl",
      "eetnuUrl",
    ]) {
      this.clearError(key);
    }
    let firstBad: HTMLElement | null = null;
    let ok = true;

    if (this.state.name.trim() === "") {
      this.setError("name", "A name is required.");
      firstBad = firstBad ?? this.nameInput;
      ok = false;
    }
    let coordinates: Coordinates | undefined;
    const parsed = parseCoords(this.state.coordsRaw);
    if (parsed === "invalid") {
      this.setError("coords", "Use “lat, lng” — e.g. 52.0808, 4.2889 (lat −90…90, lng −180…180).");
      firstBad = firstBad ?? this.coordsInput;
      ok = false;
    } else if (parsed) {
      coordinates = parsed;
    }
    const url = this.state.url.trim();
    if (url !== "" && !/^https?:\/\//i.test(url)) {
      this.setError("url", "Must be a full link starting with http:// or https://.");
      firstBad = firstBad ?? this.urlInput;
      ok = false;
    }
    // Rating-source URLs: http(s) when non-empty (menu allows vault paths).
    const sourceUrls: [string, string | undefined, HTMLInputElement][] = [
      ["tripadvisorUrl", this.state.external.tripadvisorUrl, this.taUrlInput],
      ["yelpUrl", this.state.external.yelpUrl, this.yelpUrlInput],
      ["theforkUrl", this.state.external.theforkUrl, this.theforkUrlInput],
      ["facebookUrl", this.state.external.facebookUrl, this.facebookUrlInput],
      ["opentableUrl", this.state.external.opentableUrl, this.opentableUrlInput],
      ["eetnuUrl", this.state.external.eetnuUrl, this.eetnuUrlInput],
    ];
    for (const [key, value, input] of sourceUrls) {
      if (value !== undefined && !/^https?:\/\//i.test(value)) {
        this.setError(key, "Must be a full link starting with http:// or https://.");
        firstBad = firstBad ?? input;
        ok = false;
      }
    }
    if (firstBad) firstBad.focus();
    return ok ? { ok, coordinates } : { ok };
  }

  private buildInput(coordinates: Coordinates | undefined): SpotInput {
    const s = this.state;
    return {
      name: s.name.trim(),
      cuisines: s.cuisines,
      country: s.country.trim(),
      city: emptyToUndef(s.city),
      district: emptyToUndef(s.district),
      address: emptyToUndef(s.address),
      coordinates,
      status: s.status,
      favorite: s.favorite,
      rating: s.rating,
      ratingLocked: s.ratingLocked,
      price: s.price,
      url: emptyToUndef(s.url),
      phone: emptyToUndef(s.phone),
      source: s.source,
      sourceUrl: s.sourceUrl,
      // v0.1 defect #3: external ratings must survive the save.
      external: { ...s.external },
      photo: emptyToUndef(s.photo),
      menu: emptyToUndef(s.menu),
      tags: s.tags,
      visits: this.existingVisits,
      legacyId: s.legacyId,
      notes: s.notes,
    };
  }

  /**
   * Edit mode: only the fields the user changed vs. the open-time snapshot.
   * `visits` is deliberately NEVER included — this modal doesn't edit visits,
   * and writing a full list would erase visits logged while it was open and
   * flatten non-visit lines the user keeps inside `## Visits`.
   */
  private editPartial(input: SpotInput): Partial<SpotInput> {
    const base = this.editBaseline;
    if (!base) {
      const { visits: _visits, ...rest } = input;
      return rest;
    }
    const out: Partial<SpotInput> = {};
    const scalars = [
      "name", "country", "city", "district", "address", "status", "favorite",
      "rating", "ratingLocked", "price", "url", "phone", "source", "sourceUrl",
      "photo", "menu", "notes",
    ] as const;
    for (const key of scalars) {
      if (input[key] !== base[key]) {
        (out as Record<string, unknown>)[key] = input[key];
      }
    }
    if (!sameList(input.cuisines, base.cuisines)) out.cuisines = input.cuisines;
    if (!sameList(input.tags, base.tags)) out.tags = input.tags;
    if (
      input.coordinates?.lat !== base.coordinates?.lat ||
      input.coordinates?.lng !== base.coordinates?.lng
    ) {
      out.coordinates = input.coordinates;
    }
    if (!sameExternal(input.external, base.external)) {
      out.external = input.external;
    }
    return out;
  }

  // ------------------------------------------------------------- saving

  private async save(): Promise<void> {
    if (this.saving) return;
    const { ok, coordinates } = this.validate();
    if (!ok) return;
    const input = this.buildInput(coordinates);

    if (
      this.opts.mode === "add" &&
      this.plugin.settings.duplicateDetectionEnabled &&
      !this.dupDismissed
    ) {
      let dups: FoodSpot[] = [];
      try {
        dups = this.plugin.importer.findDuplicates(input, this.plugin.store.getSpots());
      } catch {
        // duplicate scan is best-effort; never block a save on it
      }
      if (dups.length > 0) {
        this.showDupBanner(dups);
        return;
      }
    }

    this.saving = true;
    this.saveBtn.disabled = true;
    try {
      if (this.opts.mode === "add") {
        const spot = await this.plugin.store.createSpot(input);
        new Notice(`Added “${spot.name}”.`);
      } else if (this.opts.path) {
        await this.plugin.store.updateSpot(this.opts.path, this.editPartial(input));
        new Notice(`Saved “${input.name}”.`);
      }
      this.close();
    } catch (e) {
      this.saving = false;
      this.saveBtn.disabled = false;
      new Notice(`Food Spot: save failed — ${errorMessage(e)}`);
    }
  }

  // ---------------------------------------------------- duplicate banner

  private showDupBanner(dups: FoodSpot[]): void {
    this.dupBannerEl?.remove();
    const dup = dups[0];
    if (!dup) return;
    const banner = createDiv({ cls: "fs-dup-banner" });
    const icon = banner.createSpan({ cls: "fs-dup-icon" });
    setIcon(icon, "alert-triangle");
    const text = banner.createDiv({ cls: "fs-dup-text" });
    text.createDiv({
      text: `This looks like “${dup.name}”${dup.city ? ` in ${dup.city}` : ""}, which is already in your library.`,
    });
    const actions = text.createDiv({ cls: "fs-dup-actions" });
    const merge = actions.createEl("button", { text: "Merge into existing", cls: "mod-cta" });
    merge.type = "button";
    merge.addEventListener("click", () => {
      const fields = this.buildInput(parseCoordsSafe(this.state.coordsRaw));
      this.close();
      new AddEditModal(this.plugin, {
        mode: "edit",
        path: dup.path,
        mergeFields: fields,
      }).open();
    });
    const keep = actions.createEl("button", { text: "Keep as new" });
    keep.type = "button";
    keep.addEventListener("click", () => {
      this.dupDismissed = true;
      this.resetDupBanner();
      void this.save();
    });
    this.contentEl.prepend(banner);
    this.dupBannerEl = banner;
    banner.scrollIntoView({ block: "nearest" });
  }

  private resetDupBanner(): void {
    this.dupBannerEl?.remove();
    this.dupBannerEl = null;
  }

  override onClose(): void {
    window.clearTimeout(this.searchTimer);
    this.searchGen++; // drop any in-flight search
    for (const h of this.acHandles) h.destroy();
    this.acHandles = [];
    this.contentEl.empty();
  }
}

// ------------------------------------------------------------------ utils

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

export function normalizeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function splitList(v: string): string[] {
  return v
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function emptyToUndef(v: string): string | undefined {
  const t = v.trim();
  return t === "" ? undefined : t;
}

/** "52.08, 4.28" (parens/semicolons/space-separated tolerated) → Coordinates.
 *  Empty input → null (coordinates cleared — BOTH values, v0.1 defect #9). */
function parseCoords(raw: string): Coordinates | null | "invalid" {
  const t = raw.trim().replace(/^[([]+/, "").replace(/[)\]]+$/, "").trim();
  if (t === "") return null;
  const m = t.match(/^(-?\d+(?:[.,]\d+)?)\s*(?:[,;]|\s)\s*(-?\d+(?:[.,]\d+)?)$/);
  if (!m || m[1] === undefined || m[2] === undefined) return "invalid";
  const lat = parseFloat(m[1].replace(",", "."));
  const lng = parseFloat(m[2].replace(",", "."));
  if (Number.isNaN(lat) || Number.isNaN(lng)) return "invalid";
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return "invalid";
  return { lat, lng };
}

function parseCoordsSafe(raw: string): Coordinates | undefined {
  const p = parseCoords(raw);
  return p === null || p === "invalid" ? undefined : p;
}

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
}

/** Open-time snapshot of a spot as a SpotInput (visits excluded — not edited here). */
function baselineFromSpot(spot: FoodSpot): SpotInput {
  return {
    name: spot.name,
    cuisines: [...spot.cuisines],
    country: spot.country,
    city: spot.city,
    district: spot.district,
    address: spot.address,
    coordinates: spot.coordinates ? { ...spot.coordinates } : undefined,
    status: spot.status,
    favorite: spot.favorite,
    rating: spot.rating,
    ratingLocked: spot.ratingLocked,
    price: spot.price,
    url: spot.url,
    phone: spot.phone,
    source: spot.source,
    sourceUrl: spot.sourceUrl,
    external: { ...spot.external },
    photo: spot.photo,
    menu: spot.menu,
    tags: [...spot.tags],
    visits: [],
    legacyId: spot.legacyId,
    notes: spot.notes,
  };
}

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * Key-driven on purpose: a hand-written field list silently dropped the
 * Facebook / OpenTable / Eet.nu URLs — the modal reported "Saved" while the
 * edit was never sent. Every ExternalRatings value is flat, so identity
 * comparison over the union of both key sets is exhaustive by construction and
 * a field added to the type can never be forgotten here.
 */
function sameExternal(a: ExternalRatings, b: ExternalRatings): boolean {
  const av = a as Record<string, unknown>;
  const bv = b as Record<string, unknown>;
  for (const key of new Set([...Object.keys(av), ...Object.keys(bv)])) {
    if (av[key] !== bv[key]) return false;
  }
  return true;
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
