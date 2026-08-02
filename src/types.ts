/**
 * Food Spot — shared domain types and module contracts.
 *
 * This file is the single source of truth for cross-module interfaces.
 * Module owners implement against these types; changing a contract here
 * requires coordinating with every consumer.
 */
import type { App, TFile } from "obsidian";

// ---------------------------------------------------------------------------
// Domain
// ---------------------------------------------------------------------------

export type SpotStatus = "want-to-try" | "visited";
export const SPOT_STATUSES: SpotStatus[] = ["want-to-try", "visited"];

export type SpotSource = "manual" | "google-maps" | "tripadvisor" | "url";

export interface Coordinates {
  lat: number;
  lng: number;
}

/** One visit, parsed from a `## Visits` bullet line. */
export interface Visit {
  /** ISO date YYYY-MM-DD. Required. */
  date: string;
  /** 0.5–5 in half steps. */
  rating?: number;
  /** Amount spent, plain number in the user's currency. */
  spent?: number;
  /** Free-form remainder of the bullet line. */
  note: string;
  /** Dish photos: vault paths, written as `![[…]]` embeds on the bullet. */
  photos?: string[];
}

/** External (public) rating snapshot stored in frontmatter. */
export interface ExternalRatings {
  googleRating?: number;
  googleRatingCount?: number;
  googlePlaceId?: string;
  tripadvisorRating?: number;
  tripadvisorRatingCount?: number;
  /** Frontmatter: tripadvisor_url — refreshed via the page's JSON-LD. */
  tripadvisorUrl?: string;
  yelpRating?: number;
  yelpRatingCount?: number;
  yelpUrl?: string;
  theforkRating?: number;
  theforkRatingCount?: number;
  theforkUrl?: string;
  facebookRating?: number;
  facebookRatingCount?: number;
  facebookUrl?: string;
  opentableRating?: number;
  opentableRatingCount?: number;
  opentableUrl?: string;
  /** Eet.nu (NL) rates on a 10-scale — stored raw, displayed "/10". */
  eetnuRating?: number;
  eetnuRatingCount?: number;
  eetnuUrl?: string;
  /** ISO date of the last successful fetch. */
  ratingsUpdated?: string;
}

export const RATING_SOURCES = [
  "google",
  "tripadvisor",
  "yelp",
  "thefork",
  "facebook",
  "opentable",
  "eetnu",
] as const;
export type RatingSource = (typeof RATING_SOURCES)[number];

/**
 * A restaurant. Source of truth is the markdown note; this is the in-memory
 * index record derived from frontmatter + parsed body sections.
 */
export interface FoodSpot {
  /** Vault path of the backing note — the identity of a spot. */
  path: string;
  name: string;
  cuisines: string[];
  country: string;
  city?: string;
  district?: string;
  address?: string;
  coordinates?: Coordinates;
  status: SpotStatus;
  favorite: boolean;
  /** Personal rating 0.5–5; derived from visit ratings unless ratingLocked. */
  rating?: number;
  /** When true, `rating` was set manually and is not recomputed from visits. */
  ratingLocked: boolean;
  /** Price tier 1–4. */
  price?: number;
  url?: string;
  phone?: string;
  source: SpotSource;
  sourceUrl?: string;
  external: ExternalRatings;
  /** Card image: https URL or vault-relative path. */
  photo?: string;
  /** Menu: https URL or vault-relative path (image/PDF). */
  menu?: string;
  tags: string[];
  visits: Visit[];
  /** Derived: visits.length (persisted to frontmatter for Dataview users). */
  visitCount: number;
  /** Derived: max visit date, ISO. */
  lastVisit?: string;
  /** v0.1 migration idempotency key. */
  legacyId?: string;
  /** ISO dates. */
  created: string;
  updated: string;
  /**
   * File creation time in ms. `created` is date-only (Dataview-friendly), so
   * everything added on the same day ties — this breaks those ties in
   * date-added sorting and the dashboard's "Recently added".
   */
  ctime?: number;
  /** First `## Notes` section content (body sync). */
  notes: string;
}

/** Fields for creating/updating a spot (path + derived fields are managed by the store). */
export type SpotInput = Omit<
  FoodSpot,
  "path" | "visitCount" | "lastVisit" | "created" | "updated"
> & { created?: string };

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export type DateFormat = "european" | "american" | "iso";
export type CardTextPlacement = "inside" | "under";
export type DashboardCardStyle = "rings" | "rectangles";
export type SpotViewMode = "cards" | "table";

export interface RatingTier {
  label: string;
  color: string; // hex
}

export interface StatusColors {
  wantToTry: string;
  visited: string;
  favorite: string;
}

export interface SortSpec {
  key: SortKey;
  direction: "asc" | "desc";
}

export type SortKey =
  | "name"
  | "rating"
  | "external-rating"
  | "price"
  | "date-added"
  | "last-visit"
  | "visit-count";

/** Exclusion-set filter state for the Spots tab (WatchLog model: all-on by default). */
export interface SpotFilterState {
  /** Facet -> set of EXCLUDED values. Empty set = facet fully on. */
  excludedStatuses: string[];
  excludedCuisines: string[];
  excludedCountries: string[];
  excludedCities: string[];
  excludedPrices: number[]; // 0 encodes "no price"
  minRating: number; // 0 = off; unrated spots are NOT excluded by this
  favoritesOnly: boolean;
}

export interface SavedFilterPreset {
  name: string;
  filters: SpotFilterState;
  query: string;
  sort: SortSpec;
  secondarySort?: SortSpec;
}

export interface FoodSpotSettings {
  spotsFolder: string;
  organizeByCountry: boolean;
  /** Vault folder where fetched photos/menus are saved. */
  mediaFolder: string;
  defaultCountry: string;
  currencySymbol: string;
  dateFormat: DateFormat;
  halfStarRatings: boolean;
  staleRatingThresholdDays: number;
  // Import
  duplicateDetectionEnabled: boolean;
  duplicateDetectionRadiusMeters: number;
  reviewBeforeSave: boolean;
  apiKeys: { googlePlaces?: string };
  // Customize
  cardSizeDesktop: number; // -3..3
  cardSizeMobile: number; // -3..3
  cardTextPlacement: CardTextPlacement;
  dashboardCardStyle: DashboardCardStyle;
  statusColors: StatusColors;
  ratingTiers: RatingTier[]; // exactly 5
  // Persisted UI state
  spotViewMode: SpotViewMode;
  filterState: SpotFilterState;
  sort: SortSpec;
  secondarySort?: SortSpec;
  savedPreset?: SavedFilterPreset;
  activeTab: string;
  /** True once the v0.1 JSON migration has completed (or was never needed). */
  legacyMigrationDone: boolean;
}

export const EMPTY_FILTER_STATE: SpotFilterState = {
  excludedStatuses: [],
  excludedCuisines: [],
  excludedCountries: [],
  excludedCities: [],
  excludedPrices: [],
  minRating: 0,
  favoritesOnly: false,
};

export const DEFAULT_SETTINGS: FoodSpotSettings = {
  spotsFolder: "Food Spot",
  organizeByCountry: true,
  mediaFolder: "Food Spot/_media",
  defaultCountry: "",
  currencySymbol: "€",
  dateFormat: "european",
  halfStarRatings: true,
  staleRatingThresholdDays: 180,
  duplicateDetectionEnabled: true,
  duplicateDetectionRadiusMeters: 75,
  reviewBeforeSave: true,
  apiKeys: {},
  cardSizeDesktop: 0,
  cardSizeMobile: -1,
  cardTextPlacement: "inside",
  dashboardCardStyle: "rings",
  statusColors: {
    wantToTry: "#ff9500",
    visited: "#30d158",
    favorite: "#ff2d55",
  },
  ratingTiers: [
    { label: "Avoid", color: "#e5484d" },
    { label: "Meh", color: "#e0a83c" },
    { label: "Good", color: "#8fbc5c" },
    { label: "Great", color: "#4caf7d" },
    { label: "Outstanding", color: "#3d9ede" },
  ],
  spotViewMode: "cards",
  filterState: { ...EMPTY_FILTER_STATE },
  sort: { key: "date-added", direction: "desc" },
  activeTab: "dashboard",
  legacyMigrationDone: false,
};

// ---------------------------------------------------------------------------
// Store contract (src/store/) — owner: storage module
// ---------------------------------------------------------------------------

/** Fired via workspace.trigger and as DOM CustomEvent "foodspot-data-changed". */
export const DATA_CHANGED_EVENT = "foodspot-data-changed";

export interface SpotStoreApi {
  /** All indexed spots (stable array identity until next change). */
  getSpots(): FoodSpot[];
  getByPath(path: string): FoodSpot | undefined;
  /** Distinct sorted values for autocomplete/filters. */
  distinct(field: "cuisines" | "tags" | "city" | "district" | "country"): string[];
  /** Creates the note (folder auto-created); returns the new spot. */
  createSpot(input: SpotInput): Promise<FoodSpot>;
  /** Rewrites frontmatter + managed body sections surgically. */
  updateSpot(path: string, input: Partial<SpotInput>): Promise<FoodSpot>;
  /** Adds a visit bullet; recomputes derived fields. */
  addVisit(path: string, visit: Visit): Promise<FoodSpot>;
  updateVisit(path: string, index: number, visit: Visit): Promise<FoodSpot>;
  deleteVisit(path: string, index: number): Promise<FoodSpot>;
  /** Trash-deletes the note (caller shows the confirm modal). */
  deleteSpot(path: string): Promise<void>;
  /** Update `## Notes` section only. */
  setNotes(path: string, notes: string): Promise<void>;
  openNote(path: string): Promise<void>;
  /** Subscribe to index changes; returns unsubscribe. */
  onChange(cb: () => void): () => void;
  /** The TFile behind a spot. */
  fileFor(path: string): TFile | null;
}

// ---------------------------------------------------------------------------
// Import contract (src/import/) — owner: import module
// ---------------------------------------------------------------------------

export type FieldConfidence = "high" | "low";

export interface EnrichOptions {
  photo: boolean;
  ratings: boolean;
  coords: boolean;
  address: boolean;
  menu: boolean;
  /** Overwrite existing non-empty fields (default false: fill gaps only). */
  overwrite?: boolean;
  /** Also auto-discover rating-source pages (TA, TheFork, …) — slower. */
  discoverSources?: boolean;
}

export interface ImportedSpotDraft {
  fields: Partial<SpotInput>;
  confidence: Partial<Record<keyof SpotInput, FieldConfidence>>;
  importerKind: "google-maps" | "tripadvisor" | "generic";
  sourceUrl: string;
  warnings: string[];
}

export interface PlaceCandidate {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  ratingCount?: number;
  priceLevel?: number;
  location?: Coordinates;
}

export interface ImportPipelineApi {
  /** Full URL import: resolve short links, dispatch to the right importer, enrich. */
  importFromUrl(url: string): Promise<ImportedSpotDraft>;
  /** Google Places text search (Add modal "Search online"). Throws if no API key. */
  searchPlaces(query: string, near?: Coordinates): Promise<PlaceCandidate[]>;
  /** Fetch full details for a candidate into a draft. */
  placeDetails(placeId: string): Promise<ImportedSpotDraft>;
  /**
   * Re-fetch external ratings for one spot (all sources with a URL +
   * Google). Per-source failures (e.g. bot-walled sites) are reported via
   * onWarning instead of failing silently.
   */
  refreshRatings(
    spot: FoodSpot,
    onWarning?: (message: string) => void,
  ): Promise<Partial<ExternalRatings> | null>;
  /**
   * Full single-spot enrichment from Google + rating-source pages: coords,
   * address, price, ratings, top photo (downloaded into settings.mediaFolder,
   * returned as vault path in `photo`), website, menu URL discovered on the
   * website. Only fills what `opts` asks for and what the spot is missing,
   * never overwrites non-empty user fields unless opts.overwrite — and
   * opts.overwrite only widens the fields `opts` selects: price / website /
   * phone (which have no opts flag) are always fill-gaps-only.
   */
  enrichSpot(
    spot: FoodSpot,
    opts: EnrichOptions,
  ): Promise<Partial<SpotInput> | null>;
  /** Sequential, throttled bulk enrichment with progress + cancellation. */
  bulkEnrich(
    spots: FoodSpot[],
    opts: EnrichOptions,
    onProgress: (done: number, total: number, current: string) => void,
    signal: { cancelled: boolean },
  ): Promise<{ updated: number; skipped: number; failed: string[] }>;
  /**
   * Web-search + verify + attach rating-source pages for the spot (no API
   * keys involved). Returns the external-ratings patch plus what was
   * attached/skipped; never throws for individual source failures.
   */
  discoverSources(
    spot: FoodSpot,
    onProgress?: (sourceLabel: string) => void,
  ): Promise<{
    patch: Partial<ExternalRatings>;
    attached: string[];
    skipped: { label: string; reason: string }[];
  }>;
  hasGoogleKey(): boolean;
  /** Distance-aware duplicate scan against the current library. */
  findDuplicates(draft: Partial<SpotInput>, spots: FoodSpot[]): FoodSpot[];
}

// ---------------------------------------------------------------------------
// Plugin surface available to UI modules
// ---------------------------------------------------------------------------

export interface FoodSpotPluginApi {
  app: App;
  settings: FoodSpotSettings;
  saveSettings(): Promise<void>;
  store: SpotStoreApi;
  importer: ImportPipelineApi;
  /** Open the main view and switch to a tab; optionally apply a location filter. */
  activateView(tab?: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// UI contracts
// ---------------------------------------------------------------------------

/** Every tab module exports `mount<Name>Tab(container, plugin): TabHandle`. */
export interface TabHandle {
  /** Re-render from current store state (incremental — never lose input focus). */
  refresh(): void;
  destroy(): void;
}

export const VIEW_TYPE = "foodspot-view";
export const PLUGIN_ICON = "utensils";
export const CODE_BLOCK_LANG = "foodspot";
export const FRONTMATTER_TYPE = "foodspot";
