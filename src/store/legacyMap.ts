/**
 * Pure helpers: v0.1 legacy JSON spot -> markdown note pieces, plus shared
 * path/date utilities used by the store. No Obsidian imports — testable in
 * isolation.
 */
import type { FoodSpotSettings, SpotSource, Visit } from "../types";
import { serializeVisits } from "./visitsParser";

export interface LegacyNotePlan {
  fileName: string;
  folder: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

// ---------------------------------------------------------------------------
// Shared pure utilities (also used by noteWriter/spotStore)
// ---------------------------------------------------------------------------

/** Strip characters Obsidian forbids or that break links; tidy whitespace. */
export function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|#^[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .replace(/\.+$/, "");
  return cleaned || "Untitled spot";
}

/** `Name (City)` filename (without extension collision handling). */
export function spotFileName(name: string, city?: string): string {
  const base = city && city.trim() ? `${name} (${city.trim()})` : name;
  return `${sanitizeFileName(base)}.md`;
}

/** Folder for a spot per settings (optionally a per-country subfolder). */
export function spotFolder(settings: FoodSpotSettings, country: string): string {
  const root = settings.spotsFolder.replace(/^\/+|\/+$/g, "");
  if (settings.organizeByCountry && country.trim()) {
    return root ? `${root}/${sanitizeFileName(country)}` : sanitizeFileName(country);
  }
  return root;
}

/** ISO YYYY-MM-DD for today. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Extract YYYY-MM-DD from an ISO-ish string; undefined when unparseable. */
export function dateOnly(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  if (m) return m[1];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

/** Round to the nearest half step (visit-rating average -> spot rating). */
export function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

/** Derived fields from a visit list. */
export function deriveFromVisits(visits: Visit[]): {
  visitCount: number;
  lastVisit?: string;
  avgRating?: number;
} {
  let lastVisit: string | undefined;
  const rated: number[] = [];
  for (const v of visits) {
    if (!lastVisit || v.date > lastVisit) lastVisit = v.date;
    if (typeof v.rating === "number") rated.push(v.rating);
  }
  const avgRating = rated.length
    ? roundHalf(rated.reduce((a, b) => a + b, 0) / rated.length)
    : undefined;
  return { visitCount: visits.length, lastVisit, avgRating };
}

// ---------------------------------------------------------------------------
// Legacy mapping
// ---------------------------------------------------------------------------

function asStr(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function asNum(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (v.trim() && Number.isFinite(n)) return n;
  }
  return undefined;
}

function asStrArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && !!x.trim()).map((x) => x.trim());
}

const VALID_SOURCES: SpotSource[] = ["manual", "google-maps", "tripadvisor", "url"];

/**
 * Map one v0.1 legacy JSON spot to a note plan per the SPEC migration table.
 * - status "favorite" -> status "visited" + favorite: true
 * - photos -> `photo` (first) + "## Photos" list section
 * - externalRating: google -> google_*, tripadvisor -> tripadvisor_*, else a
 *   line in the body
 * - region merged into district when district empty, else dropped with a note
 *   in the body
 */
export function legacySpotToNote(
  legacy: any,
  settings: FoodSpotSettings,
): LegacyNotePlan {
  const name = asStr(legacy?.name) ?? "Unnamed spot";
  const country = asStr(legacy?.country) ?? settings.defaultCountry ?? "";
  const city = asStr(legacy?.city);
  const legacyDistrict = asStr(legacy?.district);
  const legacyRegion = asStr(legacy?.region);
  const district = legacyDistrict ?? legacyRegion;

  const extraNoteLines: string[] = [];
  if (legacyDistrict && legacyRegion && legacyRegion !== legacyDistrict) {
    extraNoteLines.push(
      `> Migration note: legacy region "${legacyRegion}" dropped (district already set to "${legacyDistrict}").`,
    );
  }

  // Status: legacy "favorite" is a STATUS -> visited + favorite flag.
  const legacyStatus = asStr(legacy?.status);
  const favorite = legacyStatus === "favorite";
  const status = favorite || legacyStatus === "visited" ? "visited" : "want-to-try";

  // Visits
  const visits: Visit[] = [];
  if (Array.isArray(legacy?.visits)) {
    for (const v of legacy.visits) {
      const date = dateOnly(v?.date);
      if (!date) continue;
      const visit: Visit = { date, note: asStr(v?.notes) ?? "" };
      const rating = asNum(v?.rating);
      if (rating !== undefined) visit.rating = rating;
      visits.push(visit);
    }
  }
  const derived = deriveFromVisits(visits);

  // Rating: personalRating was manually set in v0.1 -> lock it so visit
  // averages never silently overwrite a migrated opinion.
  const personalRating = asNum(legacy?.personalRating);
  const rating = personalRating ?? derived.avgRating;
  const ratingLocked = personalRating !== undefined;

  // Source
  const legacySource = asStr(legacy?.source) ?? "manual";
  const sourceUrl = asStr(legacy?.sourceUrl);
  let source: SpotSource;
  if ((VALID_SOURCES as string[]).includes(legacySource)) {
    source = legacySource as SpotSource;
  } else {
    source = sourceUrl ? "url" : "manual";
  }
  // In real v0.1 data, manual spots kept the restaurant website in sourceUrl.
  const url = source === "manual" && sourceUrl ? sourceUrl : asStr(legacy?.url);

  // External rating
  let googleRating: number | undefined;
  let googleRatingCount: number | undefined;
  let tripRating: number | undefined;
  let tripRatingCount: number | undefined;
  let ratingsUpdated: string | undefined;
  const ext = legacy?.externalRating;
  if (ext && asNum(ext.rating) !== undefined) {
    const extSource = (asStr(ext.source) ?? "").toLowerCase();
    const extRating = asNum(ext.rating) as number;
    const extCount = asNum(ext.reviewCount);
    const fetched = dateOnly(ext.fetchedAt);
    if (extSource.includes("google")) {
      googleRating = extRating;
      googleRatingCount = extCount;
      ratingsUpdated = fetched;
    } else if (extSource.includes("tripadvisor")) {
      tripRating = extRating;
      tripRatingCount = extCount;
      ratingsUpdated = fetched;
    } else {
      const scale = asNum(ext.scale) ?? 5;
      const parts = [`${extRating}/${scale}`];
      if (extCount !== undefined) parts.push(`${extCount} reviews`);
      if (extSource) parts.push(`source: ${extSource}`);
      if (fetched) parts.push(`fetched ${fetched}`);
      extraNoteLines.push(`> Migrated external rating: ${parts.join(" · ")}`);
    }
  }

  // Photos
  const photos: { path: string; isLocal: boolean; caption?: string }[] = [];
  if (Array.isArray(legacy?.photos)) {
    for (const p of legacy.photos) {
      const path = asStr(p?.path);
      if (!path) continue;
      photos.push({ path, isLocal: !!p?.isLocal, caption: asStr(p?.caption) });
    }
  }
  const photo = photos.length ? photos[0].path : undefined;

  // Coordinates
  const lat = asNum(legacy?.coordinates?.lat);
  const lng = asNum(legacy?.coordinates?.lng);
  const location = lat !== undefined && lng !== undefined ? `${lat},${lng}` : undefined;

  const created = dateOnly(legacy?.createdAt) ?? todayISO();
  const updated = dateOnly(legacy?.updatedAt) ?? created;

  const frontmatter: Record<string, unknown> = {
    type: "foodspot",
    name,
    cuisines: asStrArray(legacy?.cuisines),
    country,
    city,
    district,
    address: asStr(legacy?.address),
    location,
    status,
    favorite,
    rating,
    rating_locked: ratingLocked ? true : undefined,
    price: asNum(legacy?.priceTier),
    url,
    phone: asStr(legacy?.phone),
    source,
    source_url: sourceUrl,
    google_rating: googleRating,
    google_rating_count: googleRatingCount,
    tripadvisor_rating: tripRating,
    tripadvisor_rating_count: tripRatingCount,
    ratings_updated: ratingsUpdated,
    photo,
    visit_count: derived.visitCount,
    last_visit: derived.lastVisit,
    tags: asStrArray(legacy?.tags),
    legacy_id: asStr(legacy?.id),
    created,
    updated,
  };

  // Body
  const notesParts: string[] = [];
  const userNotes = asStr(legacy?.notes);
  if (userNotes) notesParts.push(userNotes);
  if (extraNoteLines.length) notesParts.push(extraNoteLines.join("\n"));
  const notes = notesParts.join("\n\n");

  let body = `## Notes\n\n${notes ? `${notes}\n\n` : ""}## Visits\n`;
  if (visits.length) body += `\n${serializeVisits(visits)}\n`;
  if (photos.length) {
    const photoLines = photos
      .map((p) => {
        const ref = p.isLocal ? `![[${p.path}]]` : p.path;
        return p.caption ? `- ${ref} — ${p.caption}` : `- ${ref}`;
      })
      .join("\n");
    body += `\n## Photos\n\n${photoLines}\n`;
  }

  return {
    fileName: spotFileName(name, city),
    folder: spotFolder(settings, country),
    frontmatter,
    body,
  };
}
