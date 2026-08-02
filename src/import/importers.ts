/**
 * Food Spot — per-source URL importers.
 *
 * Five importers: google-maps (URL parsing on the RESOLVED url + og:title
 * fallback), tripadvisor (JSON-LD first, URL slug fallback), yelp and
 * thefork (JSON-LD; ratings land in their own external fields — TheFork
 * keeps its raw 10-scale value), generic (JSON-LD then OpenGraph).
 * Every extracted field is tagged with a confidence level.
 */
import type {
  ExternalRatings,
  FieldConfidence,
  ImportedSpotDraft,
  RatingSource,
  SpotInput,
} from "../types";
import {
  extractJsonLd,
  extractOpenGraph,
  theforkRating10,
  type JsonLdRestaurant,
} from "./jsonld";

export interface Importer {
  kind: ImportedSpotDraft["importerKind"];
  matches(url: URL): boolean;
  /** Parse from the resolved URL + optional page HTML (null when unfetchable). */
  parse(resolvedUrl: string, html: string | null): ImportedSpotDraft;
}

// ---------------------------------------------------------------------------
// Draft field helpers (shared with the pipeline's Places enrichment)
// ---------------------------------------------------------------------------

/**
 * Set a draft field respecting confidence: never overwrites an existing
 * high-confidence value; upgrades low-confidence values when the incoming
 * confidence is high. Skips undefined / empty values.
 */
export function setDraftField<K extends keyof SpotInput>(
  draft: Pick<ImportedSpotDraft, "fields" | "confidence">,
  key: K,
  value: SpotInput[K] | undefined,
  conf: FieldConfidence,
): void {
  if (value === undefined || value === null) return;
  if (typeof value === "string" && value.trim() === "") return;
  if (Array.isArray(value) && value.length === 0) return;
  if (draft.fields[key] !== undefined) {
    const existing = draft.confidence[key];
    if (!(existing === "low" && conf === "high")) return;
  }
  draft.fields[key] = value;
  draft.confidence[key] = conf;
}

/** Merge external-rating fields into the draft (always additive). */
export function mergeExternal(
  draft: Pick<ImportedSpotDraft, "fields" | "confidence">,
  ext: Partial<ExternalRatings>,
): void {
  const defined: Partial<ExternalRatings> = {};
  for (const [k, v] of Object.entries(ext)) {
    if (v !== undefined) (defined as Record<string, unknown>)[k] = v;
  }
  if (Object.keys(defined).length === 0) return;
  draft.fields.external = { ...(draft.fields.external ?? {}), ...defined };
  draft.confidence.external = "high";
}

function newDraft(kind: ImportedSpotDraft["importerKind"], sourceUrl: string): ImportedSpotDraft {
  const draft: ImportedSpotDraft = {
    fields: {},
    confidence: {},
    importerKind: kind,
    sourceUrl,
    warnings: [],
  };
  const source: SpotInput["source"] =
    kind === "google-maps" ? "google-maps" : kind === "tripadvisor" ? "tripadvisor" : "url";
  setDraftField(draft, "source", source, "high");
  setDraftField(draft, "sourceUrl", sourceUrl, "high");
  return draft;
}

/** Two-letter ISO country code → English name (best effort). */
function expandCountry(value: string): { name: string; confident: boolean } {
  const v = value.trim();
  if (!/^[A-Za-z]{2}$/.test(v)) return { name: v, confident: true };
  try {
    const intl = Intl as unknown as {
      DisplayNames?: new (
        locales: string[],
        opts: { type: string },
      ) => { of(code: string): string | undefined };
    };
    if (intl.DisplayNames) {
      const name = new intl.DisplayNames(["en"], { type: "region" }).of(v.toUpperCase());
      if (name !== undefined && name !== v.toUpperCase()) return { name, confident: true };
    }
  } catch {
    /* fall through */
  }
  return { name: v.toUpperCase(), confident: false };
}

function applyJsonLd(
  draft: ImportedSpotDraft,
  ld: JsonLdRestaurant,
  ratingTarget: "google" | "tripadvisor" | "yelp" | "thefork" | "none",
): void {
  setDraftField(draft, "name", ld.name, "high");
  if (ld.address) {
    setDraftField(draft, "address", ld.address.street ?? ld.address.full, "high");
    setDraftField(draft, "city", ld.address.city, "high");
    if (ld.address.country !== undefined) {
      const { name, confident } = expandCountry(ld.address.country);
      setDraftField(draft, "country", name, confident ? "high" : "low");
    }
  }
  if (ld.lat !== undefined && ld.lng !== undefined) {
    setDraftField(draft, "coordinates", { lat: ld.lat, lng: ld.lng }, "high");
  }
  setDraftField(draft, "cuisines", ld.cuisines, "high");
  setDraftField(draft, "price", ld.price, "high");
  setDraftField(draft, "phone", ld.phone, "high");
  setDraftField(draft, "photo", ld.image, "high");

  if (ratingTarget === "thefork") {
    // TheFork rates on a 10-scale — store the raw 10-scale value (a page
    // publishing bestRating 5 is normalized TO the 10-scale, never to 5).
    const thefork10 = theforkRating10(ld);
    if (thefork10 !== undefined) {
      mergeExternal(draft, {
        theforkRating: thefork10,
        theforkRatingCount: ld.ratingCount,
      });
    }
    return;
  }
  if (ld.rating !== undefined) {
    if (ratingTarget === "google") {
      mergeExternal(draft, { googleRating: ld.rating, googleRatingCount: ld.ratingCount });
    } else if (ratingTarget === "tripadvisor") {
      mergeExternal(draft, {
        tripadvisorRating: ld.rating,
        tripadvisorRatingCount: ld.ratingCount,
      });
    } else if (ratingTarget === "yelp") {
      mergeExternal(draft, { yelpRating: ld.rating, yelpRatingCount: ld.ratingCount });
    } else {
      draft.warnings.push(
        `Found an on-page rating (${ld.rating}${ld.ratingCount !== undefined ? `, ${ld.ratingCount} reviews` : ""}) from an unknown provider — not saved.`,
      );
    }
  }
}

function applyOpenGraph(draft: ImportedSpotDraft, html: string, cleanTitle: (t: string) => string): void {
  const og = extractOpenGraph(html);
  if (og.title !== undefined) {
    const title = cleanTitle(og.title);
    if (title !== "") setDraftField(draft, "name", title, "low");
  }
  setDraftField(draft, "photo", og.image, "low");
}

const COORD_PAIR_RE = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/;

function validCoords(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

// ---------------------------------------------------------------------------
// Google Maps importer
// ---------------------------------------------------------------------------

const googleMapsImporter: Importer = {
  kind: "google-maps",
  matches(u: URL): boolean {
    const h = u.hostname.toLowerCase();
    if (h === "maps.app.goo.gl") return true;
    if ((h === "goo.gl" || h === "www.goo.gl") && u.pathname.startsWith("/maps")) return true;
    if (/^(www\.)?google\.[a-z.]+$/.test(h) && u.pathname.startsWith("/maps")) return true;
    if (/^maps\.google\.[a-z.]+$/.test(h)) return true;
    return false;
  },
  parse(resolvedUrl: string, html: string | null): ImportedSpotDraft {
    const draft = newDraft("google-maps", resolvedUrl);

    // Coordinates — from the RESOLVED url only (v0.1 parsed the share link: never enriched).
    // !3d/!4d markers are the place pin (high); @lat,lng is just the viewport center (low).
    const bang = resolvedUrl.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    const at = resolvedUrl.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    for (const [m, conf] of [
      [bang, "high"],
      [at, "low"],
    ] as const) {
      if (m) {
        const lat = Number.parseFloat(m[1]);
        const lng = Number.parseFloat(m[2]);
        if (validCoords(lat, lng)) setDraftField(draft, "coordinates", { lat, lng }, conf);
      }
    }

    // Name from the /maps/place/<slug> segment.
    const place = resolvedUrl.match(/\/maps\/place\/([^/@?#]+)/);
    if (place) {
      try {
        const name = decodeURIComponent(place[1].replace(/\+/g, " ")).trim();
        if (name !== "" && !COORD_PAIR_RE.test(name)) setDraftField(draft, "name", name, "high");
      } catch {
        /* malformed escape — ignore */
      }
    }
    const search = resolvedUrl.match(/\/maps\/search\/([^/@?#]+)/);
    if (search && draft.fields.name === undefined) {
      try {
        const q = decodeURIComponent(search[1].replace(/\+/g, " ")).trim();
        if (q !== "" && !COORD_PAIR_RE.test(q)) setDraftField(draft, "name", q, "low");
      } catch {
        /* ignore */
      }
    }

    // ?q= param: either "lat,lng" or a query string.
    try {
      const q = new URL(resolvedUrl).searchParams.get("q") ?? "";
      const pair = q.match(COORD_PAIR_RE);
      if (pair) {
        const lat = Number.parseFloat(pair[1]);
        const lng = Number.parseFloat(pair[2]);
        if (validCoords(lat, lng)) setDraftField(draft, "coordinates", { lat, lng }, "high");
      } else if (q.trim() !== "" && !q.startsWith("place_id:")) {
        setDraftField(draft, "name", q.trim(), "low");
      }
    } catch {
      /* not a URL — skip query parsing */
    }

    if (html !== null) {
      const ld = extractJsonLd(html);
      if (ld !== null) applyJsonLd(draft, ld, "google");
      applyOpenGraph(draft, html, (t) =>
        t.replace(/\s*[-–·|]\s*Google\s*Maps\s*$/i, "").split(" · ")[0].trim(),
      );
    }

    if (draft.fields.name === undefined && draft.fields.coordinates === undefined) {
      draft.warnings.push(
        "Could not read a place name or coordinates from this Google Maps link.",
      );
    }
    return draft;
  },
};

// ---------------------------------------------------------------------------
// TripAdvisor importer
// ---------------------------------------------------------------------------

const tripadvisorImporter: Importer = {
  kind: "tripadvisor",
  matches(u: URL): boolean {
    return u.hostname.toLowerCase().includes("tripadvisor.");
  },
  parse(resolvedUrl: string, html: string | null): ImportedSpotDraft {
    const draft = newDraft("tripadvisor", resolvedUrl);
    mergeExternal(draft, { tripadvisorUrl: resolvedUrl });

    if (html !== null) {
      const ld = extractJsonLd(html);
      if (ld !== null) applyJsonLd(draft, ld, "tripadvisor");
      applyOpenGraph(draft, html, (t) =>
        t.replace(/\s*[-–|]\s*Tripadvisor\s*$/i, "").replace(/^\s*[A-Z ]+’?S?\s*,/, "").trim(),
      );
    }

    // URL slug fallback: .../Restaurant_Review-g###-d###-Reviews-Name_Here-City.html
    const slug = resolvedUrl.match(/-Reviews-([^/]+?)-([^/.]+?)\.html/i);
    if (slug) {
      const name = slug[1].replace(/_/g, " ").trim();
      const city = slug[2].replace(/_/g, " ").trim();
      if (name !== "") setDraftField(draft, "name", name, "low");
      if (city !== "") setDraftField(draft, "city", city, "low");
    }

    if (draft.fields.name === undefined) {
      draft.warnings.push("Could not read the restaurant name from this TripAdvisor page.");
    }
    return draft;
  },
};

// ---------------------------------------------------------------------------
// Yelp importer (JSON-LD; ratings land in yelp_* fields)
// ---------------------------------------------------------------------------

const yelpImporter: Importer = {
  kind: "generic",
  matches(u: URL): boolean {
    return u.hostname.toLowerCase().includes("yelp.");
  },
  parse(resolvedUrl: string, html: string | null): ImportedSpotDraft {
    const draft = newDraft("generic", resolvedUrl);
    mergeExternal(draft, { yelpUrl: resolvedUrl });

    if (html !== null) {
      const ld = extractJsonLd(html);
      if (ld !== null) applyJsonLd(draft, ld, "yelp");
      applyOpenGraph(draft, html, (t) =>
        t.replace(/\s*[-–|]\s*Yelp\s*$/i, "").trim(),
      );
    }

    if (draft.fields.name === undefined) {
      draft.warnings.push("Could not read the restaurant name from this Yelp page.");
    }
    return draft;
  },
};

// ---------------------------------------------------------------------------
// TheFork importer (JSON-LD; raw 10-scale rating in thefork_* fields)
// ---------------------------------------------------------------------------

const theforkImporter: Importer = {
  kind: "generic",
  matches(u: URL): boolean {
    const h = u.hostname.toLowerCase();
    return h.includes("thefork.") || h.includes("lafourchette.");
  },
  parse(resolvedUrl: string, html: string | null): ImportedSpotDraft {
    const draft = newDraft("generic", resolvedUrl);
    mergeExternal(draft, { theforkUrl: resolvedUrl });

    if (html !== null) {
      const ld = extractJsonLd(html);
      if (ld !== null) applyJsonLd(draft, ld, "thefork");
      applyOpenGraph(draft, html, (t) =>
        t.replace(/\s*[-–|]\s*(?:TheFork|LaFourchette)\s*$/i, "").trim(),
      );
    }

    if (draft.fields.name === undefined) {
      draft.warnings.push("Could not read the restaurant name from this TheFork page.");
    }
    return draft;
  },
};

// ---------------------------------------------------------------------------
// Generic importer (JSON-LD → OpenGraph; everything else lands here)
// ---------------------------------------------------------------------------

const genericImporter: Importer = {
  kind: "generic",
  matches(): boolean {
    return true;
  },
  parse(resolvedUrl: string, html: string | null): ImportedSpotDraft {
    const draft = newDraft("generic", resolvedUrl);
    // For a restaurant's own site, the page itself is the website.
    setDraftField(draft, "url", resolvedUrl, "low");

    if (html !== null) {
      const ld = extractJsonLd(html);
      if (ld !== null) {
        applyJsonLd(draft, ld, "none");
        if (ld.url !== undefined) setDraftField(draft, "url", ld.url, "high");
      }
      applyOpenGraph(draft, html, (t) => t.split(/\s*[|–]\s*/)[0].trim());
    }

    if (draft.fields.name === undefined) {
      draft.warnings.push(
        "No restaurant metadata (JSON-LD or OpenGraph) found on this page — fill in the details manually.",
      );
    }
    return draft;
  },
};

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

const IMPORTERS: Importer[] = [
  googleMapsImporter,
  tripadvisorImporter,
  yelpImporter,
  theforkImporter,
  genericImporter,
];

export function pickImporter(url: string): Importer {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Not a valid URL: ${url}`);
  }
  for (const importer of IMPORTERS) {
    if (importer.matches(parsed)) return importer;
  }
  return genericImporter;
}

/**
 * Which rating source a pasted URL belongs to (page-scraped sources only —
 * used by the "Attach as rating source" flow on duplicate detection).
 */
export function detectRatingSource(url: string): RatingSource | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host.includes("tripadvisor.")) return "tripadvisor";
  if (host.includes("yelp.")) return "yelp";
  if (host.includes("thefork.") || host.includes("lafourchette.")) return "thefork";
  if (host.includes("facebook.com") || host === "fb.com" || host.endsWith(".fb.com")) return "facebook";
  if (host.includes("opentable.")) return "opentable";
  if (host.includes("eet.nu")) return "eetnu";
  return null;
}
