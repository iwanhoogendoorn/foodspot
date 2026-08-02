/**
 * Food Spot — paste a list of restaurant names and add them in one go.
 *
 * The story: someone drops a list of places in a chat. You copy the whole
 * message, paste it here, and the modal does the rest. Two phases live in ONE
 * modal so the pasted text is never lost:
 *
 *   PHASE 1 (paste)  textarea + "Search near" bias, a live parsed-name count,
 *                    and two exits — look each name up on Google, or add them
 *                    as bare want-to-try spots with no API call at all.
 *   PHASE 2 (review) one row per pasted name with its Google match, a
 *                    checkbox, and a picker when Google offered alternatives.
 *
 * Everything Google touches is sequential and throttled (LOOKUP_THROTTLE_MS)
 * — a 40-name paste must not fan out 40 simultaneous requests at the quota.
 * A generation counter guards every await: closing the modal or going Back
 * bumps it, and the in-flight loop returns without touching dead DOM. Cancel
 * is separate (a signal flag), because a cancelled lookup KEEPS the rows it
 * already collected instead of throwing the work away.
 *
 * Saved detection mirrors the Discover tab: a google_place_id match always
 * wins, and a bare name match only counts when it is location-compatible.
 */
import { Modal, Notice, setIcon } from "obsidian";
import type { FoodSpot, FoodSpotPluginApi, PlaceCandidate, SpotInput } from "../../types";
import { normalizeName } from "../../import/pipeline";
import { MAX_NAMES, parseNameListVerbose } from "../../import/listParse";

const NO_KEY_HINT = "Add a Google Places API key in Settings → Food Spot → API";
/** Min pause between Google calls in a lookup or add run. */
const LOOKUP_THROTTLE_MS = 320;
/** Alternatives offered per name in the review dropdown. */
const MAX_CANDIDATES = 3;

const PLACEHOLDER = [
  "Rotterdam tips 🍜",
  "1. Little V",
  "2. Momiji",
  "- Fitzgerald",
  "• Bokaal",
].join("\n");

export function openListImportModal(plugin: FoodSpotPluginApi): void {
  new ListImportModal(plugin).open();
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fmtCount(n: number): string {
  return n >= 1000 ? `${(Math.round(n / 100) / 10).toFixed(1)}k` : String(n);
}

/** "<name> restaurant <near>" — the near part biases Google, nothing more. */
export function lookupQuery(name: string, near: string): string {
  const suffix = near.trim();
  return `${name} restaurant${suffix === "" ? "" : ` ${suffix}`}`;
}

// ---------------------------------------------------------------------------
// saved-state lookup (mirrors src/ui/tabs/discover.ts)
// ---------------------------------------------------------------------------

interface SavedSets {
  ids: Set<string>;
  /** normalized name -> lowercase cities it is saved in ("" = no city). */
  nameCities: Map<string, Set<string>>;
}

function savedSets(spots: FoodSpot[]): SavedSets {
  const nameCities = new Map<string, Set<string>>();
  const ids = new Set<string>();
  for (const s of spots) {
    const key = normalizeName(s.name);
    let cities = nameCities.get(key);
    if (!cities) nameCities.set(key, (cities = new Set()));
    cities.add((s.city ?? "").trim().toLowerCase());
    const id = s.external.googlePlaceId;
    if (id !== undefined && id !== "") ids.add(id);
  }
  return { ids, nameCities };
}

/** Fold a just-created spot in, so a repeat later in the same run is skipped. */
function rememberSaved(sets: SavedSets, spot: FoodSpot): void {
  const key = normalizeName(spot.name);
  let cities = sets.nameCities.get(key);
  if (!cities) sets.nameCities.set(key, (cities = new Set()));
  cities.add((spot.city ?? "").trim().toLowerCase());
  const id = spot.external.googlePlaceId;
  if (id !== undefined && id !== "") sets.ids.add(id);
}

function isSaved(c: PlaceCandidate, sets: SavedSets): boolean {
  if (sets.ids.has(c.placeId)) return true;
  const cities = sets.nameCities.get(normalizeName(c.name));
  if (!cities) return false;
  const addr = (c.address ?? "").toLowerCase();
  for (const city of cities) {
    if (city === "" || (addr !== "" && addr.includes(city))) return true;
  }
  return false;
}

/** Bare-name rows have no address, so any saved spot with that name counts. */
function nameTaken(name: string, sets: SavedSets): boolean {
  return sets.nameCities.has(normalizeName(name));
}

/** Google's answer is trusted only when its name still looks like the paste. */
function isConfident(pasted: string, c: PlaceCandidate): boolean {
  const a = normalizeName(pasted);
  const b = normalizeName(c.name);
  if (a === "" || b === "") return false;
  return a === b || a.includes(b) || b.includes(a);
}

// ---------------------------------------------------------------------------
// modal
// ---------------------------------------------------------------------------

/** Result of looking one pasted name up, before any DOM exists. */
interface LookupResult {
  name: string;
  candidates: PlaceCandidate[];
  /** Set when the Google call itself failed for this name. */
  error?: string;
}

interface ReviewRow extends LookupResult {
  /** Index into `candidates`, or -1 when Google returned nothing. */
  selected: number;
  checked: boolean;
  saved: boolean;
  rowEl: HTMLElement;
  checkbox: HTMLInputElement;
  statusEl: HTMLElement;
  candEl: HTMLElement;
}

class ListImportModal extends Modal {
  private text = "";
  private near: string;
  private rows: ReviewRow[] = [];
  /** Bumped by close/Back/new run — every await checks it before touching DOM. */
  private gen = 0;
  private adding = false;
  private unsubscribe: (() => void) | null = null;
  private footerCountEl: HTMLElement | null = null;
  private addBtn: HTMLButtonElement | null = null;
  private progress: {
    fill: HTMLElement;
    count: HTMLElement;
    current: HTMLElement;
  } | null = null;

  constructor(private readonly plugin: FoodSpotPluginApi) {
    super(plugin.app);
    this.near = plugin.settings.defaultCountry;
  }

  override onOpen(): void {
    this.modalEl.addClass("fs-modal", "fs-list-import-modal");
    this.titleEl.setText("Import a list of restaurant names");
    // Spots added from another window must not keep claiming to be new.
    this.unsubscribe = this.plugin.store.onChange(() => this.refreshSaved());
    this.renderPaste();
  }

  override onClose(): void {
    this.gen++;
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.rows = [];
    this.progress = null;
    this.footerCountEl = null;
    this.addBtn = null;
    this.contentEl.empty();
  }

  // -- phase 1: paste ------------------------------------------------------

  private renderPaste(): void {
    this.gen++;
    this.adding = false;
    this.rows = [];
    this.progress = null;
    this.footerCountEl = null;
    this.addBtn = null;
    const body = this.contentEl;
    body.empty();

    body.createEl("p", {
      cls: "fs-import-hint",
      text: "Paste the whole message — bullets, numbering and emoji are stripped for you. One restaurant per line.",
    });

    const textarea = body.createEl("textarea", {
      cls: "fs-li-textarea",
      attr: { rows: "9", placeholder: PLACEHOLDER, spellcheck: "false" },
    });
    textarea.value = this.text;

    const nearField = body.createDiv({ cls: "fs-field fs-li-near" });
    nearField.createEl("label", { cls: "fs-field-label", text: "Search near" });
    const nearInput = nearField.createEl("input", {
      cls: "fs-li-near-input",
      attr: {
        type: "text",
        placeholder: "City, area or country — biases the Google lookup",
        spellcheck: "false",
      },
    });
    nearInput.value = this.near;
    nearInput.addEventListener("input", () => {
      this.near = nearInput.value;
    });

    const countEl = body.createDiv({ cls: "fs-li-count" });

    const buttons = body.createDiv({ cls: "fs-modal-buttons" });
    const bareBtn = buttons.createEl("button", { text: "Add without lookup" });
    bareBtn.type = "button";
    const lookupBtn = buttons.createEl("button", { cls: "mod-cta" });
    lookupBtn.type = "button";
    const lookupIcon = lookupBtn.createSpan({ cls: "fs-btn-icon" });
    setIcon(lookupIcon, "search");
    lookupBtn.createSpan({ text: "Look up on Google" });

    const hasKey = this.plugin.importer.hasGoogleKey();
    if (!hasKey) lookupBtn.title = NO_KEY_HINT;

    const sync = (): void => {
      this.text = textarea.value;
      const { names, dropped } = parseNameListVerbose(this.text);
      const n = names.length;
      const parts = [`${n} name${n === 1 ? "" : "s"} recognized`];
      if (dropped > 0) parts.push(`${dropped} over the ${MAX_NAMES} limit ignored`);
      countEl.setText(parts.join(" · "));
      countEl.toggleClass("fs-li-count-empty", n === 0);
      lookupBtn.disabled = n === 0 || !hasKey;
      bareBtn.disabled = n === 0;
    };
    textarea.addEventListener("input", sync);
    textarea.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !lookupBtn.disabled) {
        e.preventDefault();
        sync();
        void this.runLookup(parseNameListVerbose(this.text).names);
      }
    });
    sync();

    bareBtn.addEventListener("click", () => {
      void this.addWithoutLookup(parseNameListVerbose(this.text).names);
    });
    lookupBtn.addEventListener("click", () => {
      if (!hasKey) {
        new Notice(NO_KEY_HINT);
        return;
      }
      void this.runLookup(parseNameListVerbose(this.text).names);
    });

    textarea.focus();
  }

  /** No Google at all: bare want-to-try spots straight from the pasted names. */
  private async addWithoutLookup(names: string[]): Promise<void> {
    if (names.length === 0) return;
    const myGen = ++this.gen;
    const signal = { cancelled: false };
    this.adding = true;
    this.renderProgress("Adding spots…", names.length, signal);
    const sets = savedSets(this.plugin.store.getSpots());
    let added = 0;
    let skipped = 0;
    let failed = 0;
    for (let i = 0; i < names.length; i++) {
      if (myGen !== this.gen) return;
      if (signal.cancelled) break;
      const name = names[i];
      this.setProgress(i, names.length, name);
      if (nameTaken(name, sets)) {
        skipped++;
        continue;
      }
      try {
        const spot = await this.plugin.store.createSpot(this.bareInput(name));
        if (myGen !== this.gen) return;
        rememberSaved(sets, spot);
        added++;
      } catch {
        failed++;
      }
    }
    if (myGen !== this.gen) return;
    this.adding = false;
    this.finish(signal.cancelled, added, 0, skipped, failed);
  }

  // -- phase 2: lookup + review -------------------------------------------

  private async runLookup(names: string[]): Promise<void> {
    if (names.length === 0) return;
    const myGen = ++this.gen;
    const signal = { cancelled: false };
    this.renderProgress("Looking up on Google…", names.length, signal);
    const near = this.near;
    const results: LookupResult[] = [];
    for (let i = 0; i < names.length; i++) {
      if (myGen !== this.gen) return;
      if (signal.cancelled) break;
      const name = names[i];
      this.setProgress(i, names.length, name);
      const result: LookupResult = { name, candidates: [] };
      try {
        const found = await this.plugin.importer.searchPlaces(lookupQuery(name, near));
        result.candidates = found.slice(0, MAX_CANDIDATES);
      } catch (e) {
        result.error = errorMessage(e);
      }
      if (myGen !== this.gen) return;
      results.push(result);
      // Throttle between calls only — never after the last one.
      if (i < names.length - 1 && !signal.cancelled) await sleep(LOOKUP_THROTTLE_MS);
    }
    if (myGen !== this.gen) return;
    this.setProgress(results.length, names.length, "");
    // Cancelling keeps what was already looked up; the rest simply never ran.
    this.renderReview(results, names.length);
  }

  private renderReview(results: LookupResult[], requested: number): void {
    const body = this.contentEl;
    body.empty();
    this.progress = null;
    this.rows = [];

    const head = body.createDiv({ cls: "fs-li-review-head" });
    head.setText(
      results.length < requested
        ? `${results.length} of ${requested} names looked up — the rest was cancelled.`
        : `${results.length} name${results.length === 1 ? "" : "s"} looked up. Tick the ones to add.`
    );

    const list = body.createDiv({ cls: "fs-li-list" });
    const sets = savedSets(this.plugin.store.getSpots());
    for (const result of results) this.buildRow(list, result, sets);

    const footer = body.createDiv({ cls: "fs-li-footer" });
    this.footerCountEl = footer.createSpan({ cls: "fs-li-footer-count" });
    const buttons = footer.createDiv({ cls: "fs-li-footer-buttons" });
    const back = buttons.createEl("button", { text: "Back" });
    back.type = "button";
    back.addEventListener("click", () => this.renderPaste());
    this.addBtn = buttons.createEl("button", { cls: "mod-cta", text: "Add selected" });
    this.addBtn.type = "button";
    this.addBtn.addEventListener("click", () => void this.addSelected());
    this.syncFooter();
  }

  private buildRow(list: HTMLElement, result: LookupResult, sets: SavedSets): void {
    const rowEl = list.createDiv({ cls: "fs-li-row" });
    const checkbox = rowEl.createEl("input", { cls: "fs-li-check", type: "checkbox" });
    const main = rowEl.createDiv({ cls: "fs-li-main" });
    const head = main.createDiv({ cls: "fs-li-head" });
    head.createSpan({ cls: "fs-li-name", text: result.name });
    const statusEl = head.createSpan({ cls: "fs-li-status" });
    const candEl = main.createDiv({ cls: "fs-li-cand" });

    const top = result.candidates[0];
    const saved = top !== undefined && isSaved(top, sets);
    const row: ReviewRow = {
      ...result,
      selected: result.candidates.length > 0 ? 0 : -1,
      // Only a confident, not-yet-saved match is ticked for you.
      checked: top !== undefined && !saved && isConfident(result.name, top),
      saved,
      rowEl,
      checkbox,
      statusEl,
      candEl,
    };
    checkbox.checked = row.checked;
    checkbox.setAttribute("aria-label", `Add ${result.name}`);
    checkbox.addEventListener("change", () => {
      row.checked = checkbox.checked;
      this.syncFooter();
    });
    this.rows.push(row);
    this.renderCandidate(row);
  }

  /** Rebuilds the candidate block + status badge for one row. */
  private renderCandidate(row: ReviewRow): void {
    row.candEl.empty();
    row.statusEl.empty();
    row.rowEl.toggleClass("fs-li-saved", row.saved);

    const c = row.selected >= 0 ? row.candidates[row.selected] : undefined;
    if (c === undefined) {
      row.statusEl.createSpan({
        cls: "fs-li-badge fs-li-badge-warn",
        text: row.error !== undefined ? "Lookup failed" : "Not found",
      });
      row.candEl.createDiv({
        cls: "fs-li-none",
        text:
          row.error ??
          "Google found nothing — tick it to add the name as a plain spot.",
      });
      return;
    }

    if (row.saved) {
      row.statusEl.createSpan({ cls: "fs-badge-saved", text: "✓ Already saved" });
    } else if (!isConfident(row.name, c)) {
      row.statusEl.createSpan({ cls: "fs-li-badge", text: "Check match" });
    }

    row.candEl.createDiv({ cls: "fs-li-cand-name", text: c.name });
    if (c.address !== "") row.candEl.createDiv({ cls: "fs-li-cand-addr", text: c.address });

    const meta = row.candEl.createDiv({ cls: "fs-li-meta" });
    if (c.rating !== undefined) {
      const g = meta.createSpan({ cls: "fs-li-rating" });
      g.createSpan({ cls: "fs-meta-g", text: "G" });
      g.createSpan({
        text: ` ${c.rating.toFixed(1)}${c.ratingCount ? ` (${fmtCount(c.ratingCount)})` : ""}`,
      });
    }
    if (c.priceLevel !== undefined && c.priceLevel > 0) {
      meta.createSpan({
        cls: "fs-li-price",
        text: this.plugin.settings.currencySymbol.repeat(Math.min(4, c.priceLevel)),
      });
    }

    if (row.candidates.length > 1) {
      const select = row.candEl.createEl("select", { cls: "dropdown fs-li-picker" });
      select.setAttribute("aria-label", `Choose the match for ${row.name}`);
      row.candidates.forEach((cand, i) => {
        const opt = select.createEl("option", {
          text: cand.address === "" ? cand.name : `${cand.name} — ${cand.address}`,
        });
        opt.value = String(i);
        if (i === row.selected) opt.selected = true;
      });
      select.addEventListener("change", () => {
        row.selected = Number(select.value);
        const picked = row.candidates[row.selected];
        row.saved = picked !== undefined && isSaved(picked, savedSets(this.plugin.store.getSpots()));
        // A saved pick can never stay ticked; an unsaved one keeps your choice.
        if (row.saved) {
          row.checked = false;
          row.checkbox.checked = false;
        }
        this.renderCandidate(row);
        this.syncFooter();
      });
    }
  }

  private syncFooter(): void {
    const n = this.rows.filter((r) => r.checked).length;
    this.footerCountEl?.setText(`${n} selected · adds as want to try`);
    if (this.addBtn) this.addBtn.disabled = n === 0;
  }

  /** Re-check saved badges against the library without re-querying Google. */
  private refreshSaved(): void {
    // A change fired by our own run would fight the add loop for the DOM.
    if (this.adding || this.rows.length === 0) return;
    const sets = savedSets(this.plugin.store.getSpots());
    for (const row of this.rows) {
      const c = row.selected >= 0 ? row.candidates[row.selected] : undefined;
      const saved = c !== undefined && isSaved(c, sets);
      if (saved === row.saved) continue;
      row.saved = saved;
      if (saved) {
        row.checked = false;
        row.checkbox.checked = false;
      }
      this.renderCandidate(row);
    }
    this.syncFooter();
  }

  // -- add -----------------------------------------------------------------

  private bareInput(name: string): SpotInput {
    return {
      name,
      cuisines: [],
      country: this.plugin.settings.defaultCountry.trim(),
      status: "want-to-try",
      favorite: false,
      ratingLocked: false,
      source: "manual",
      external: {},
      tags: [],
      visits: [],
      notes: "",
    };
  }

  /** Same mapping the Discover tab uses for its one-click Add. */
  private draftToInput(
    fields: Partial<SpotInput>,
    sourceUrl: string,
    c: PlaceCandidate
  ): SpotInput {
    return {
      name: (fields.name ?? c.name).trim(),
      cuisines: fields.cuisines ?? [],
      country: (fields.country ?? this.plugin.settings.defaultCountry).trim(),
      city: fields.city,
      district: fields.district,
      address: fields.address ?? (c.address === "" ? undefined : c.address),
      coordinates: fields.coordinates ?? c.location,
      status: "want-to-try",
      favorite: false,
      ratingLocked: false,
      price: fields.price ?? c.priceLevel,
      url: fields.url,
      phone: fields.phone,
      source: "google-maps",
      sourceUrl: fields.sourceUrl ?? sourceUrl,
      // Google ratings + place_id come from the details call and must survive.
      external: fields.external ?? {},
      tags: [],
      visits: [],
      notes: "",
    };
  }

  private async addSelected(): Promise<void> {
    const chosen = this.rows.filter((r) => r.checked);
    if (chosen.length === 0) return;
    const myGen = ++this.gen;
    const signal = { cancelled: false };
    this.adding = true;
    this.renderProgress("Adding spots…", chosen.length, signal);
    const sets = savedSets(this.plugin.store.getSpots());
    let added = 0;
    let bare = 0;
    let skipped = 0;
    let failed = 0;
    for (let i = 0; i < chosen.length; i++) {
      if (myGen !== this.gen) return;
      if (signal.cancelled) break;
      const row = chosen[i];
      this.setProgress(i, chosen.length, row.name);
      const c = row.selected >= 0 ? row.candidates[row.selected] : undefined;
      try {
        if (c === undefined) {
          if (nameTaken(row.name, sets)) {
            skipped++;
            continue;
          }
          const spot = await this.plugin.store.createSpot(this.bareInput(row.name));
          if (myGen !== this.gen) return;
          rememberSaved(sets, spot);
          added++;
          bare++;
          continue;
        }
        if (isSaved(c, sets)) {
          skipped++;
          continue;
        }
        const draft = await this.plugin.importer.placeDetails(c.placeId);
        if (myGen !== this.gen) return;
        const spot = await this.plugin.store.createSpot(
          this.draftToInput(draft.fields, draft.sourceUrl, c)
        );
        if (myGen !== this.gen) return;
        rememberSaved(sets, spot);
        added++;
      } catch {
        failed++;
      }
      if (i < chosen.length - 1 && !signal.cancelled) await sleep(LOOKUP_THROTTLE_MS);
    }
    if (myGen !== this.gen) return;
    this.adding = false;
    this.finish(signal.cancelled, added, bare, skipped, failed);
  }

  private finish(
    cancelled: boolean,
    added: number,
    bare: number,
    skipped: number,
    failed: number
  ): void {
    const parts = [`added ${added}`];
    if (bare > 0) parts.push(`${bare} without a Google match`);
    if (skipped > 0) parts.push(`${skipped} skipped (already saved)`);
    if (failed > 0) parts.push(`${failed} failed`);
    this.close();
    new Notice(
      `${cancelled ? "List import cancelled" : "List import done"} — ${parts.join(" · ")}.`,
      10000
    );
  }

  // -- progress ------------------------------------------------------------

  private renderProgress(
    title: string,
    total: number,
    signal: { cancelled: boolean }
  ): void {
    const body = this.contentEl;
    body.empty();
    this.footerCountEl = null;
    this.addBtn = null;
    // Rows from a previous review are detached now — never re-render them.
    this.rows = [];
    body.createDiv({ cls: "fs-li-progress-title", text: title });
    const track = body.createDiv({ cls: "fs-progress-track" });
    const fill = track.createDiv({ cls: "fs-progress-fill" });
    const meta = body.createDiv({ cls: "fs-enrich-progress-meta" });
    const count = meta.createSpan({ cls: "fs-enrich-count", text: `0 / ${total}` });
    const current = meta.createSpan({ cls: "fs-enrich-current" });
    this.progress = { fill, count, current };

    const buttons = body.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => {
      signal.cancelled = true;
      cancel.disabled = true;
      cancel.setText("Cancelling…");
    });
  }

  private setProgress(done: number, total: number, current: string): void {
    if (!this.progress) return;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    this.progress.fill.style.width = `${pct}%`;
    this.progress.count.setText(`${done} / ${total}`);
    this.progress.current.setText(current);
  }
}
