/**
 * Food Spot — pure search/filter/sort logic for the Spots tab and widgets.
 *
 * No Obsidian imports: everything here is testable in isolation.
 *
 * Query language (mirrors WatchLog):
 *   free terms        fuzzy-AND via Fuse.js (threshold 0.24, weighted fields)
 *   "quoted text"     exact (case/diacritic-insensitive) substring
 *   field:value       scoped: cuisine, city, country, district, tag, status,
 *                     dish (visit notes), name
 *   rating:>=4        numeric comparators on rating / google / price / visits
 *   -term             exclusion (substring, predictable)
 *   a | b             OR groups; terms inside a group AND together
 */
import Fuse from "fuse.js";
import type { FoodSpot, SortKey, SortSpec, SpotFilterState } from "../types";

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

interface Term {
  exclude: boolean;
  field?: string;
  quoted: boolean;
  value: string;
}

const TEXT_FIELDS = new Set([
  "cuisine",
  "cuisines",
  "city",
  "country",
  "district",
  "tag",
  "tags",
  "status",
  "dish",
  "name",
]);
const NUM_FIELDS = new Set(["rating", "google", "price", "visits"]);

const TOKEN_RE = /(-)?(?:([A-Za-z]+):)?(?:"([^"]*)"|([^\s"]+))/g;

/** Lowercase + strip diacritics for predictable matching. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
}

/** Parse the raw query into OR groups of AND terms. */
function tokenize(query: string): Term[][] {
  const groups: Term[][] = [];
  let current: Term[] = [];
  TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(query)) !== null) {
    const minus = m[1];
    const field = m[2];
    const quotedVal = m[3];
    const bareVal = m[4];
    if (!minus && !field && bareVal === "|") {
      if (current.length) groups.push(current);
      current = [];
      continue;
    }
    const value = quotedVal !== undefined ? quotedVal : bareVal ?? "";
    // Skip lone punctuation (mid-typing states like "-" or "|")
    if (!value || /^[-|]+$/.test(value)) continue;
    let f: string | undefined = field ? field.toLowerCase() : undefined;
    let v = value;
    if (f && !TEXT_FIELDS.has(f) && !NUM_FIELDS.has(f)) {
      // Unknown field → treat the whole token as free text.
      v = `${field ?? ""}:${value}`;
      f = undefined;
    }
    current.push({
      exclude: !!minus,
      field: f,
      quoted: quotedVal !== undefined,
      value: v,
    });
  }
  if (current.length) groups.push(current);
  return groups;
}

// ---------------------------------------------------------------------------
// Field access
// ---------------------------------------------------------------------------

function textFieldValues(spot: FoodSpot, field: string): string[] {
  switch (field) {
    case "cuisine":
    case "cuisines":
      return spot.cuisines;
    case "city":
      return spot.city ? [spot.city] : [];
    case "country":
      return [spot.country];
    case "district":
      return spot.district ? [spot.district] : [];
    case "tag":
    case "tags":
      return spot.tags;
    case "status":
      return [spot.status];
    case "dish":
      return spot.visits.map((v) => v.note).filter((n) => n.length > 0);
    case "name":
      return [spot.name];
    default:
      return [];
  }
}

function numFieldValue(spot: FoodSpot, field: string): number | undefined {
  switch (field) {
    case "rating":
      return spot.rating;
    case "google":
      return spot.external.googleRating;
    case "price":
      return spot.price;
    case "visits":
      return spot.visitCount;
    default:
      return undefined;
  }
}

const CMP_RE = /^(>=|<=|>|<|=)?\s*(\d+(?:[.,]\d+)?)$/;

function matchNumeric(value: number | undefined, raw: string): boolean {
  const m = CMP_RE.exec(raw.trim());
  if (!m || value === undefined) return false;
  const target = parseFloat(m[2].replace(",", "."));
  switch (m[1] ?? "=") {
    case ">":
      return value > target;
    case ">=":
      return value >= target;
    case "<":
      return value < target;
    case "<=":
      return value <= target;
    default:
      return value === target;
  }
}

/** All searchable text of a spot, normalized, for substring/exclusion checks. */
function haystack(spot: FoodSpot): string {
  return norm(
    [
      spot.name,
      spot.cuisines.join(" "),
      spot.city ?? "",
      spot.district ?? "",
      spot.country,
      spot.tags.join(" "),
      spot.address ?? "",
      spot.notes,
      spot.visits.map((v) => v.note).join(" "),
    ].join(" ")
  );
}

// ---------------------------------------------------------------------------
// Fuzzy index
// ---------------------------------------------------------------------------

interface FuzzyDoc {
  path: string;
  name: string;
  cuisines: string[];
  city: string;
  district: string;
  country: string;
  tags: string[];
  address: string;
  notes: string;
  visitNotes: string;
}

function buildFuse(spots: FoodSpot[]): Fuse<FuzzyDoc> {
  const docs: FuzzyDoc[] = spots.map((s) => ({
    path: s.path,
    name: s.name,
    cuisines: s.cuisines,
    city: s.city ?? "",
    district: s.district ?? "",
    country: s.country,
    tags: s.tags,
    address: s.address ?? "",
    notes: s.notes,
    visitNotes: s.visits.map((v) => v.note).join(" "),
  }));
  return new Fuse(docs, {
    threshold: 0.24,
    ignoreLocation: true,
    keys: [
      { name: "name", weight: 0.6 },
      { name: "cuisines", weight: 0.3 },
      { name: "city", weight: 0.25 },
      { name: "district", weight: 0.15 },
      { name: "country", weight: 0.15 },
      { name: "tags", weight: 0.2 },
      { name: "address", weight: 0.1 },
      { name: "notes", weight: 0.1 },
      { name: "visitNotes", weight: 0.15 },
    ],
  });
}

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

/**
 * Exclusion-set semantics (WatchLog model): empty set = facet fully on.
 * "" / 0 encode the "Empty" specials. minRating NEVER excludes unrated spots.
 * A multi-cuisine spot is hidden only when every one of its cuisines is
 * excluded (it stays reachable through its other cuisines).
 */
function passesFilters(s: FoodSpot, f: SpotFilterState): boolean {
  if (f.favoritesOnly && !s.favorite) return false;
  if (f.excludedStatuses.includes(s.status)) return false;
  if (f.excludedCountries.includes(s.country ?? "")) return false;
  if (f.excludedCities.includes(s.city ?? "")) return false;
  if (f.excludedCuisines.length > 0) {
    if (s.cuisines.length === 0) {
      if (f.excludedCuisines.includes("")) return false;
    } else if (s.cuisines.every((c) => f.excludedCuisines.includes(c))) {
      return false;
    }
  }
  if (f.excludedPrices.includes(s.price ?? 0)) return false;
  if (f.minRating > 0 && s.rating !== undefined && s.rating < f.minRating) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function filterSpots(
  spots: FoodSpot[],
  query: string,
  filters: SpotFilterState
): FoodSpot[] {
  const pool = spots.filter((s) => passesFilters(s, filters));
  const q = query.trim();
  if (!q) return pool;
  const groups = tokenize(q);
  if (groups.length === 0) return pool;

  let fuse: Fuse<FuzzyDoc> | null = null;
  const fuzzyCache = new Map<string, Set<string>>();
  const fuzzyPaths = (term: string): Set<string> => {
    let hit = fuzzyCache.get(term);
    if (!hit) {
      if (!fuse) fuse = buildFuse(pool);
      hit = new Set(fuse.search(term).map((r) => r.item.path));
      fuzzyCache.set(term, hit);
    }
    return hit;
  };

  const matchesTerm = (spot: FoodSpot, t: Term): boolean => {
    let ok: boolean;
    if (t.field && NUM_FIELDS.has(t.field)) {
      ok = matchNumeric(numFieldValue(spot, t.field), t.value);
    } else if (t.field && TEXT_FIELDS.has(t.field)) {
      const needle = norm(t.value);
      ok = textFieldValues(spot, t.field).some((v) => norm(v).includes(needle));
    } else if (t.quoted || t.exclude) {
      // Quoted → exact substring; exclusions → substring (predictable, not fuzzy).
      ok = haystack(spot).includes(norm(t.value));
    } else {
      ok = fuzzyPaths(t.value).has(spot.path);
    }
    return t.exclude ? !ok : ok;
  };

  return pool.filter((spot) =>
    groups.some((group) => group.every((t) => matchesTerm(spot, t)))
  );
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

const SORT_VALUES: Record<SortKey, (s: FoodSpot) => string | number | undefined> = {
  name: (s) => s.name.toLowerCase(),
  rating: (s) => s.rating,
  "external-rating": (s) => s.external.googleRating ?? s.external.tripadvisorRating,
  price: (s) => s.price,
  "date-added": (s) => s.created || undefined,
  "last-visit": (s) => s.lastVisit,
  "visit-count": (s) => s.visitCount,
};

/** Spots with no value for the key always sort LAST, regardless of direction. */
export function sortSpots(
  spots: FoodSpot[],
  primary: SortSpec,
  secondary?: SortSpec
): FoodSpot[] {
  const cmp =
    (spec: SortSpec) =>
    (a: FoodSpot, b: FoodSpot): number => {
      const get = SORT_VALUES[spec.key];
      if (!get) return 0;
      const av = get(a);
      const bv = get(b);
      const aEmpty = av === undefined || av === "";
      const bEmpty = bv === undefined || bv === "";
      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1;
      if (bEmpty) return -1;
      let c: number;
      if (typeof av === "string" && typeof bv === "string") c = av.localeCompare(bv);
      else c = (av as number) - (bv as number);
      return spec.direction === "desc" ? -c : c;
    };
  const p = cmp(primary);
  const s = secondary ? cmp(secondary) : null;
  return [...spots].sort(
    (a, b) => p(a, b) || (s ? s(a, b) : 0) || a.name.localeCompare(b.name)
  );
}
