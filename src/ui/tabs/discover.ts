/**
 * Food Spot — Discover tab: find restaurants that are NOT in the library yet
 * and add them as "want to try" proposals in one click.
 *
 * Google Text Search drives it ("<keyword> restaurants in <location>"), and
 * everything here is quota-aware:
 *  - pagination NEVER auto-loops. A next_page_token buys a "Load more" button
 *    that stays disabled for NEXT_PAGE_DELAY_MS, because Google rejects a
 *    token that young with INVALID_REQUEST.
 *  - thumbnails come from the Place Photo endpoint, which bills per call, so
 *    they load lazily through one shared IntersectionObserver (card.ts
 *    pattern) and resolved object URLs are cached module-wide with a "none"
 *    sentinel — a missing or broken photo is never fetched twice.
 *
 * Query + results live in module state so switching tabs doesn't throw away
 * a search (and its quota); destroy() drops them and revokes the object URLs.
 */
import { Notice, setIcon } from "obsidian";
import type { FoodSpotPluginApi, SpotInput, TabHandle } from "../../types";
import { normalizeName } from "../../import/pipeline";
import { createWithQuickAdd, openQuickAdd } from "../modals/quickAdd";
import type { QuickAddResult } from "../modals/quickAdd";
import {
  NEXT_PAGE_DELAY_MS,
  PlacesClient,
  type PhotoCandidate,
} from "../../import/places";

const NO_KEY_HINT = "Add a Google Places API key in Settings → Food Spot → API";
const MAX_KEYWORD_HINT = "thai, vegetarian, sushi…";

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function fmtCount(n: number): string {
  return n >= 1000 ? `${(Math.round(n / 100) / 10).toFixed(1)}k` : String(n);
}

/** "<keyword> restaurants in <location>" — keyword optional. */
export function discoverQuery(location: string, keyword: string): string {
  const kw = keyword.trim();
  return `${kw === "" ? "" : `${kw} `}restaurants in ${location.trim()}`;
}

// ---------------------------------------------------------------------------
// Module state — survives tab switches, cleared on destroy
// ---------------------------------------------------------------------------

interface DiscoverState {
  location: string;
  keyword: string;
  /** Query that produced `results` (used for the zero-results message). */
  query: string;
  results: PhotoCandidate[];
  nextPageToken?: string;
  error?: string;
  /** False until the first search of this view session completes. */
  searched: boolean;
}

let state: DiscoverState = {
  location: "",
  keyword: "",
  query: "",
  results: [],
  searched: false,
};

function resetState(): void {
  state = { location: "", keyword: "", query: "", results: [], searched: false };
}

// ---------------------------------------------------------------------------
// Lazy Place Photo thumbnails (shared observer + object-URL cache)
// ---------------------------------------------------------------------------

const NONE = "none";
/** photo_reference -> object URL, or "none" for known-missing/broken photos. */
const photoCache = new Map<string, string>();
const inFlight = new Set<string>();
const pendingLoaders = new WeakMap<Element, () => void>();
let sharedObserver: IntersectionObserver | null = null;
/**
 * Bumped by disposeThumbs(). A request that resolves after teardown has no
 * cache left to live in and no later teardown to revoke it, so it must revoke
 * its own object URL and stay out of the (detached) DOM.
 */
let thumbGen = 0;

function observer(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          sharedObserver?.unobserve(entry.target);
          const load = pendingLoaders.get(entry.target);
          pendingLoaders.delete(entry.target);
          load?.();
        }
      },
      { rootMargin: "200px" }
    );
  }
  return sharedObserver;
}

/**
 * Unregister every pending thumbnail inside `root`. MUST run before results
 * DOM is thrown away — the observer holds strong references to its targets.
 */
function releaseThumbs(root: HTMLElement): void {
  if (!sharedObserver) return;
  for (const t of Array.from(root.querySelectorAll<HTMLElement>("[data-needs-photo]"))) {
    sharedObserver.unobserve(t);
    pendingLoaders.delete(t);
  }
}

function disposeThumbs(): void {
  thumbGen++;
  sharedObserver?.disconnect();
  sharedObserver = null;
  for (const url of photoCache.values()) {
    if (url !== NONE) URL.revokeObjectURL(url);
  }
  photoCache.clear();
  inFlight.clear();
}

function mimeFor(ext: string): string {
  return `image/${ext === "jpg" ? "jpeg" : ext}`;
}

/**
 * Register `thumbEl` for an on-demand Place Photo fetch. Nothing is requested
 * until the tile scrolls into view — a Place Photo call costs quota.
 */
function attachLazyThumb(
  thumbEl: HTMLElement,
  places: PlacesClient,
  photoRef: string
): void {
  const cached = photoCache.get(photoRef);
  if (cached === NONE) return;
  if (cached !== undefined) {
    renderThumb(thumbEl, cached);
    return;
  }
  thumbEl.dataset.needsPhoto = "true";
  pendingLoaders.set(thumbEl, () => {
    void (async () => {
      const gen = thumbGen;
      const known = photoCache.get(photoRef);
      if (known !== undefined) {
        delete thumbEl.dataset.needsPhoto;
        if (known !== NONE) renderThumb(thumbEl, known);
        return;
      }
      if (inFlight.has(photoRef)) {
        delete thumbEl.dataset.needsPhoto;
        return;
      }
      inFlight.add(photoRef);
      try {
        const { data, ext } = await places.fetchPlacePhoto(photoRef, 320);
        const url = URL.createObjectURL(new Blob([data], { type: mimeFor(ext) }));
        if (gen !== thumbGen) {
          URL.revokeObjectURL(url);
          return;
        }
        photoCache.set(photoRef, url);
        renderThumb(thumbEl, url);
      } catch {
        // Sentinel: a photo that failed once is never re-requested. A cache
        // that was already torn down must stay empty.
        if (gen === thumbGen) photoCache.set(photoRef, NONE);
      } finally {
        inFlight.delete(photoRef);
        delete thumbEl.dataset.needsPhoto;
      }
    })();
  });
  observer().observe(thumbEl);
}

function renderThumb(thumbEl: HTMLElement, src: string): void {
  if (thumbEl.querySelector("img")) return;
  const img = thumbEl.createEl("img", { cls: "fs-discover-img" });
  img.setAttribute("alt", "");
  img.setAttribute("width", "96");
  img.setAttribute("height", "96");
  img.decoding = "async";
  img.onload = () => img.addClass("is-loaded");
  img.onerror = () => img.remove();
  img.src = src;
}

// ---------------------------------------------------------------------------
// Tab
// ---------------------------------------------------------------------------

export function mountDiscoverTab(
  container: HTMLElement,
  plugin: FoodSpotPluginApi
): TabHandle {
  const root = container.createDiv({ cls: "fs-discover" });
  const places = new PlacesClient(plugin);

  /** Bumped on every query change so stale responses can be dropped. */
  let searchGen = 0;
  /** Generation of the request in flight; null when nothing is outstanding. */
  let busyGen: number | null = null;
  /** Per-tile saved-state updaters, keyed by place id. */
  let tileSync: { placeId: string; name: string; address?: string; sync(saved: boolean): void }[] = [];
  let loadMoreTimer: number | null = null;

  // -- controls (built ONCE — never rebuilt by render) ----------------------

  const controls = root.createDiv({ cls: "fs-toolbar fs-discover-controls" });

  const locWrap = controls.createDiv({ cls: "fs-discover-field fs-discover-location-field" });
  const locationInput = locWrap.createEl("input", {
    cls: "fs-discover-input fs-discover-location",
    attr: {
      type: "text",
      placeholder: "City, country or area — e.g. Rotterdam",
      "aria-label": "Location to search",
      spellcheck: "false",
      enterkeyhint: "search",
    },
  });
  locationInput.value = state.location;

  const kwWrap = controls.createDiv({ cls: "fs-discover-field fs-discover-keyword-field" });
  const keywordInput = kwWrap.createEl("input", {
    cls: "fs-discover-input fs-discover-keyword",
    attr: {
      type: "text",
      placeholder: MAX_KEYWORD_HINT,
      "aria-label": "Keyword or cuisine",
      spellcheck: "false",
      enterkeyhint: "search",
    },
  });
  keywordInput.value = state.keyword;

  /** × inside a field; clearing the location also clears stale results. */
  const clearButton = (
    wrap: HTMLElement,
    input: HTMLInputElement,
    onCleared: () => void,
  ): HTMLButtonElement => {
    const btn = wrap.createEl("button", {
      cls: "fs-discover-clear",
      attr: { "aria-label": "Clear", tabindex: "-1", title: "Clear" },
    });
    btn.type = "button";
    setIcon(btn, "x");
    const sync = (): void => btn.toggleClass("is-visible", input.value.length > 0);
    sync();
    input.addEventListener("input", sync);
    btn.addEventListener("click", () => {
      input.value = "";
      sync();
      input.focus();
      onCleared();
    });
    return btn;
  };

  /**
   * A response only belongs to the query it was started for. Every edit to
   * either field retires the generation in flight, so a Rotterdam answer can
   * never repopulate results under a blank or Amsterdam query.
   */
  const invalidate = (): void => {
    searchGen++;
    setStatus("");
  };

  /** True only while a request for the query CURRENTLY on screen is running. */
  const busy = (): boolean => busyGen !== null && busyGen === searchGen;

  /** No location = nothing those results belong to any more. */
  const dropResults = (): void => {
    invalidate();
    state.location = "";
    state.keyword = keywordInput.value.trim();
    state.query = "";
    state.results = [];
    delete state.nextPageToken;
    delete state.error;
    state.searched = false;
    render();
  };
  clearButton(locWrap, locationInput, dropResults);
  // Emptying the field by hand (select-all + delete, backspacing) must behave
  // exactly like pressing the ×.
  locationInput.addEventListener("input", () => {
    if (locationInput.value.trim() === "") dropResults();
    else invalidate();
  });
  clearButton(kwWrap, keywordInput, () => {
    invalidate();
    state.keyword = "";
  });
  keywordInput.addEventListener("input", invalidate);

  const searchBtn = controls.createEl("button", {
    cls: "fs-btn fs-btn-accent",
    attr: { "aria-label": "Search restaurants", title: "Search restaurants" },
  });
  const searchIcon = searchBtn.createSpan({ cls: "fs-btn-icon" });
  setIcon(searchIcon, "search");
  searchBtn.createSpan({ cls: "fs-btn-label", text: "Search" });
  searchBtn.addEventListener("click", () => void runSearch());

  const onEnter = (e: KeyboardEvent): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      void runSearch();
    }
  };
  locationInput.addEventListener("keydown", onEnter);
  keywordInput.addEventListener("keydown", onEnter);

  const statusEl = root.createDiv({ cls: "fs-discover-status is-hidden" });
  const bodyEl = root.createDiv({ cls: "fs-discover-body fs-vscroll" });

  // -- saved-state lookup --------------------------------------------------

  interface SavedSets {
    ids: Set<string>;
    /** normalized name -> lowercase cities it is saved in ("" = no city recorded). */
    nameCities: Map<string, Set<string>>;
  }

  function savedSets(): SavedSets {
    const spots = plugin.store.getSpots();
    const nameCities = new Map<string, Set<string>>();
    for (const s of spots) {
      const key = normalizeName(s.name);
      let cities = nameCities.get(key);
      if (!cities) nameCities.set(key, (cities = new Set()));
      cities.add((s.city ?? "").trim().toLowerCase());
    }
    return {
      ids: new Set(
        spots
          .map((s) => s.external.googlePlaceId)
          .filter((id): id is string => id !== undefined && id !== "")
      ),
      nameCities,
    };
  }

  /**
   * placeId matches always win. A bare name match only counts when it is
   * location-compatible: the saved spot has no city, or the candidate's
   * address mentions that city — otherwise "Sushi Bar" in Rotterdam would
   * mark every "Sushi Bar" on the planet as saved.
   */
  function isSaved(
    c: { placeId: string; name: string; address?: string },
    sets: SavedSets
  ): boolean {
    if (sets.ids.has(c.placeId)) return true;
    const cities = sets.nameCities.get(normalizeName(c.name));
    if (!cities) return false;
    const addr = (c.address ?? "").toLowerCase();
    for (const city of cities) {
      if (city === "" || (addr !== "" && addr.includes(city))) return true;
    }
    return false;
  }

  // -- search --------------------------------------------------------------

  function setStatus(text: string, isError = false): void {
    statusEl.empty();
    statusEl.toggleClass("is-hidden", text === "");
    statusEl.toggleClass("fs-discover-error", isError);
    if (text !== "") statusEl.setText(text);
  }

  async function runSearch(): Promise<void> {
    // Only a request for the query as it stands now blocks a new one — a
    // superseded search must never keep the user waiting for its own answer.
    if (busy()) return;
    if (!places.hasKey()) {
      new Notice(NO_KEY_HINT);
      render();
      return;
    }
    const location = locationInput.value.trim();
    if (location === "") {
      new Notice("Enter a location to search — a city, country or area.");
      locationInput.focus();
      return;
    }
    const keyword = keywordInput.value.trim();
    const query = discoverQuery(location, keyword);
    const gen = ++searchGen;

    state.location = location;
    state.keyword = keyword;
    state.query = query;
    busyGen = gen;
    setStatus(`Searching Google for “${query}”…`);
    try {
      const page = await places.textSearchPaged(query);
      if (gen !== searchGen) return;
      state.results = page.candidates;
      state.nextPageToken = page.nextPageToken;
      delete state.error;
      state.searched = true;
    } catch (e) {
      if (gen !== searchGen) return;
      state.results = [];
      delete state.nextPageToken;
      state.error = errorMessage(e);
      state.searched = true;
    } finally {
      // Never clear a flag a NEWER request already claimed.
      if (busyGen === gen) busyGen = null;
      if (gen === searchGen) setStatus("");
    }
    render();
  }

  async function loadMore(token: string, btn: HTMLButtonElement): Promise<void> {
    if (busy()) return;
    const gen = searchGen;
    busyGen = gen;
    btn.disabled = true;
    btn.setText("Loading…");
    try {
      const page = await places.textSearchNextPage(token);
      if (gen !== searchGen) return;
      // Google can repeat a place across pages — dedupe by place id.
      const seen = new Set(state.results.map((c) => c.placeId));
      state.results = [
        ...state.results,
        ...page.candidates.filter((c) => !seen.has(c.placeId)),
      ];
      state.nextPageToken = page.nextPageToken;
      delete state.error;
    } catch (e) {
      if (gen !== searchGen) return;
      state.error = errorMessage(e);
      delete state.nextPageToken;
    } finally {
      if (busyGen === gen) busyGen = null;
    }
    render();
  }

  // -- add -----------------------------------------------------------------

  function draftToInput(
    fields: Partial<SpotInput>,
    sourceUrl: string,
    c: PhotoCandidate
  ): SpotInput {
    return {
      name: (fields.name ?? c.name).trim(),
      cuisines: fields.cuisines ?? [],
      country: (fields.country ?? plugin.settings.defaultCountry).trim(),
      city: fields.city,
      district: fields.district,
      address: fields.address ?? (c.address === "" ? undefined : c.address),
      coordinates: fields.coordinates ?? c.location,
      status: "want-to-try",
      favorite: false,
      permanentlyClosed: false,
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

  async function addCandidate(
    c: PhotoCandidate,
    btn: HTMLButtonElement,
    markSaved: () => void,
    withOptions = false
  ): Promise<void> {
    // Ask BEFORE the details call so a cancel costs no quota.
    let choice: QuickAddResult | null = null;
    if (withOptions) {
      choice = await openQuickAdd(plugin, c.name, c.priceLevel || undefined);
      if (!choice) return;
    }
    btn.disabled = true;
    const label = btn.getText();
    btn.setText("Adding…");
    try {
      const draft = await plugin.importer.placeDetails(c.placeId);
      const input = draftToInput(draft.fields, draft.sourceUrl, c);
      if (choice) {
        await createWithQuickAdd(plugin, input, choice);
      } else {
        // No review modal here by design: Discover is the fast-add path.
        const spot = await plugin.store.createSpot(input);
        new Notice(`Added ${spot.name} — want to try`);
      }
      markSaved();
    } catch (e) {
      btn.disabled = false;
      btn.setText(label);
      new Notice(`Couldn't add ${c.name} — ${errorMessage(e)}`);
    }
  }

  // -- render --------------------------------------------------------------

  function emptyState(
    icon: string,
    title: string,
    text: string,
    action?: { label: string; onClick(): void }
  ): void {
    const empty = bodyEl.createDiv({ cls: "fs-empty" });
    const ic = empty.createDiv({ cls: "fs-empty-icon" });
    setIcon(ic, icon);
    empty.createDiv({ cls: "fs-empty-title", text: title });
    empty.createDiv({ cls: "fs-empty-text", text });
    if (action) {
      const actions = empty.createDiv({ cls: "fs-empty-actions" });
      const btn = actions.createEl("button", { cls: "fs-btn", text: action.label });
      btn.type = "button";
      btn.addEventListener("click", action.onClick);
    }
  }

  function buildTile(c: PhotoCandidate, saved: boolean): void {
    const tile = bodyEl.createDiv({ cls: "fs-result-tile fs-discover-tile" });

    const thumb = tile.createDiv({ cls: "fs-discover-thumb" });
    thumb.createSpan({
      cls: "fs-discover-letter",
      text: (c.name[0] ?? "?").toUpperCase(),
    });
    if (c.photoRef !== undefined) attachLazyThumb(thumb, places, c.photoRef);

    const main = tile.createDiv({ cls: "fs-result-main" });
    const nameRow = main.createDiv({ cls: "fs-result-name" });
    nameRow.createSpan({ text: c.name });
    if (c.address !== "") main.createDiv({ cls: "fs-result-address", text: c.address });

    const meta = main.createDiv({ cls: "fs-result-meta fs-discover-meta" });
    if (c.rating !== undefined) {
      const g = meta.createSpan({ cls: "fs-discover-rating" });
      g.createSpan({ cls: "fs-meta-g", text: "G" });
      g.createSpan({
        text: ` ${c.rating.toFixed(1)}${c.ratingCount ? ` (${fmtCount(c.ratingCount)})` : ""}`,
      });
    }
    if (c.priceLevel !== undefined && c.priceLevel > 0) {
      meta.createSpan({
        cls: "fs-discover-price",
        text: plugin.settings.currencySymbol.repeat(Math.min(4, c.priceLevel)),
      });
    }

    const actions = tile.createDiv({ cls: "fs-discover-actions" });
    const sync = (isSavedNow: boolean): void => {
      actions.empty();
      tile.toggleClass("fs-in-library", isSavedNow);
      if (isSavedNow) {
        actions.createSpan({ cls: "fs-badge-saved", text: "✓ Saved" });
        return;
      }
      const add = actions.createEl("button", {
        cls: "fs-btn fs-btn-accent fs-discover-add",
        attr: { "aria-label": `Add ${c.name} to want to try` },
      });
      add.type = "button";
      const ic = add.createSpan({ cls: "fs-btn-icon" });
      setIcon(ic, "plus");
      add.createSpan({ cls: "fs-btn-label", text: "Add" });
      add.addEventListener("click", () => void addCandidate(c, add, () => sync(true)));

      // "Add with details": status, rating and price in one step — for places
      // you have already been to.
      const opts = actions.createEl("button", {
        cls: "fs-btn fs-discover-add-opts",
        attr: {
          "aria-label": `Add ${c.name} with rating and price`,
          title: "Add with status, rating and price",
        },
      });
      opts.type = "button";
      setIcon(opts.createSpan({ cls: "fs-btn-icon" }), "sliders-horizontal");
      opts.addEventListener("click", () => void addCandidate(c, opts, () => sync(true), true));
    };
    sync(saved);
    tileSync.push({ placeId: c.placeId, name: c.name, address: c.address, sync });
  }

  function buildLoadMore(token: string): void {
    const wrap = bodyEl.createDiv({ cls: "fs-discover-more" });
    const btn = wrap.createEl("button", { cls: "fs-btn", text: "Load more…" });
    btn.type = "button";
    // Google needs ~2s before the token is valid. Never poll, never auto-load:
    // the button simply wakes up once the wait is over.
    btn.disabled = true;
    if (loadMoreTimer !== null) window.clearTimeout(loadMoreTimer);
    loadMoreTimer = window.setTimeout(() => {
      loadMoreTimer = null;
      btn.disabled = false;
      btn.setText("Load more");
    }, NEXT_PAGE_DELAY_MS);
    btn.addEventListener("click", () => void loadMore(token, btn));
  }

  function render(): void {
    releaseThumbs(bodyEl);
    bodyEl.empty();
    tileSync = [];

    if (!places.hasKey()) {
      emptyState(
        "key-round",
        "Google Places key required",
        "Discover searches Google for restaurants you haven't saved yet. It needs an API key.",
        { label: "How do I add a key?", onClick: () => new Notice(NO_KEY_HINT) }
      );
      return;
    }
    if (state.error !== undefined) {
      emptyState("alert-triangle", "Search failed", state.error, {
        label: "Try again",
        onClick: () => void runSearch(),
      });
      return;
    }
    if (!state.searched) {
      emptyState(
        "compass",
        "Search restaurants anywhere",
        "Try “thai in Rotterdam” — put the city in the first box and the cuisine in the second.",
      );
      return;
    }
    if (state.results.length === 0) {
      emptyState(
        "search-x",
        "No restaurants found",
        `Google returned nothing for “${state.query}”. Try a broader area or drop the keyword.`,
      );
      return;
    }

    const sets = savedSets();
    for (const c of state.results) buildTile(c, isSaved(c, sets));
    if (state.nextPageToken !== undefined) buildLoadMore(state.nextPageToken);
  }

  render();

  return {
    /** Re-check Saved badges against the library without re-querying Google. */
    refresh: () => {
      if (bodyEl.querySelector(".fs-discover-tile") === null) {
        render();
        return;
      }
      const sets = savedSets();
      for (const t of tileSync) t.sync(isSaved(t, sets));
    },
    destroy: () => {
      searchGen++;
      busyGen = null;
      if (loadMoreTimer !== null) window.clearTimeout(loadMoreTimer);
      loadMoreTimer = null;
      releaseThumbs(bodyEl);
      tileSync = [];
      disposeThumbs();
      resetState();
      root.remove();
    },
  };
}
