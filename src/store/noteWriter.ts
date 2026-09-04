/**
 * Note read/write engine for Food Spot notes.
 *
 * WRITE DISCIPLINE (mirrors WatchLog):
 * - Frontmatter writes ONLY via `app.fileManager.processFrontMatter`, using
 *   the SPEC's kebab/snake keys (google_rating, visit_count, …) mapped
 *   to/from the camelCase FoodSpot fields.
 * - Body updates surgically replace ONLY the `## Notes` / `## Visits`
 *   sections (created at end of file when missing); everything else the user
 *   wrote is preserved byte-for-byte.
 */
import { App, TFile } from "obsidian";
import type { Coordinates, FoodSpot, SpotInput, SpotSource, Visit } from "../types";
import { SPOT_STATUSES } from "../types";
import {
  dateOnly,
  deriveFromVisits,
  todayISO,
} from "./legacyMap";
import {
  parseVisitLines,
  parseVisitsSection,
  serializeVisitLines,
  serializeVisits,
  VisitLine,
} from "./visitsParser";

// ---------------------------------------------------------------------------
// Coercion helpers (frontmatter values arrive untyped)
// ---------------------------------------------------------------------------

function asStr(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return undefined;
}

function asNum(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function asBool(v: unknown): boolean {
  return v === true || v === "true";
}

function asStrArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .map((x) => asStr(x))
      .filter((x): x is string => x !== undefined);
  }
  const single = asStr(v);
  return single ? [single] : [];
}

/** Parse a `"lat,lng"` frontmatter location value. */
export function parseLocation(v: unknown): Coordinates | undefined {
  const raw = asStr(v);
  if (!raw) return undefined;
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(raw);
  if (!m) return undefined;
  return { lat: Number(m[1]), lng: Number(m[2]) };
}

function serializeLocation(c: Coordinates | undefined): string | undefined {
  return c ? `${c.lat},${c.lng}` : undefined;
}

// ---------------------------------------------------------------------------
// Section surgery
// ---------------------------------------------------------------------------

const FM_OPEN = /^---\r?\n/;

/** Split content into [frontmatter block incl. fences, body]. */
function splitFrontmatter(content: string): [string, string] {
  if (!FM_OPEN.test(content)) return ["", content];
  const close = /\r?\n---(?:\r?\n|$)/g;
  close.lastIndex = 3; // past the opening fence
  const m = close.exec(content);
  if (!m) return ["", content];
  const end = m.index + m[0].length;
  return [content.slice(0, end), content.slice(end)];
}

interface SectionRange {
  /** Start of the heading line within the body. */
  start: number;
  /** Start of the section content (after the heading line). */
  contentStart: number;
  /** End of the section (start of next h1/h2 heading, or body length). */
  end: number;
}

/** Captures the fence marker and whatever follows it on the same line. */
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})(.*)$/;

/**
 * Locate a managed `## Heading` section. Fence-aware: heading lines inside
 * ``` / ~~~ code blocks are ignored, both when finding the section start and
 * when finding the next h1/h2 that ends it — otherwise a code sample showing
 * the visit format would get spliced as if it were the real section.
 *
 * Fence matching follows CommonMark exactly. Treating any backtick/tilde run
 * as a closing fence would end the block early on a line like ```` ```not-a-close ````
 * inside a code sample, and the managed-section rewrite would then eat the
 * user's content that follows it.
 */
function findSection(body: string, heading: string): SectionRange | null {
  const nextHeading = /^#{1,2}[ \t]/;
  const blank = /^[ \t]*$/;
  let inFence = false;
  let fenceChar = "";
  let fenceLen = 0;
  let pos = 0;
  let start = -1;
  let contentStart = -1;
  while (pos <= body.length) {
    const lineEnd = body.indexOf("\n", pos);
    const end = lineEnd === -1 ? body.length : lineEnd;
    const line = body.slice(pos, end).replace(/\r$/, "");
    const fence = FENCE_RE.exec(line);
    if (fence) {
      const marker = fence[1];
      const rest = fence[2];
      if (inFence) {
        // Closing fence: same character, at least as long as the opener, and
        // nothing but trailing whitespace after it.
        if (
          marker[0] === fenceChar &&
          marker.length >= fenceLen &&
          blank.test(rest)
        ) {
          inFence = false;
        }
      } else if (marker[0] === "~" || !rest.includes("`")) {
        // The info string of a backtick fence may not contain a backtick, so
        // `` ```js`x `` opens nothing.
        inFence = true;
        fenceChar = marker[0];
        fenceLen = marker.length;
      }
    } else if (!inFence) {
      if (start === -1) {
        if (line.replace(/[ \t]+$/, "") === heading) {
          start = pos;
          contentStart = lineEnd === -1 ? body.length : lineEnd + 1;
        }
      } else if (nextHeading.test(line)) {
        return { start, contentStart, end: pos };
      }
    }
    if (lineEnd === -1) break;
    pos = lineEnd + 1;
  }
  if (start === -1) return null;
  return { start, contentStart, end: body.length };
}

/** Content of a managed section ("" when the section is missing). */
export function extractSection(content: string, heading: string): string {
  const [, body] = splitFrontmatter(content);
  const range = findSection(body, heading);
  if (!range) return "";
  return body
    .slice(range.contentStart, range.end)
    .replace(/^(?:[ \t]*\r?\n)+/, "")
    .replace(/\s+$/, "");
}

/**
 * Replace ONLY the given `## Heading` section, preserving all other content.
 * The section is appended at the end of the file when missing.
 */
export function replaceSection(
  content: string,
  heading: string,
  sectionBody: string,
): string {
  const [fm, body] = splitFrontmatter(content);
  const trimmedSection = sectionBody.replace(/\s+$/, "");
  const block = trimmedSection
    ? `${heading}\n\n${trimmedSection}\n\n`
    : `${heading}\n\n`;
  const range = findSection(body, heading);
  if (!range) {
    let base = body.replace(/\s+$/, "");
    base = base ? `${base}\n\n` : "";
    return `${fm}${base}${block.replace(/\n+$/, "\n")}`;
  }
  const before = body.slice(0, range.start);
  const after = body.slice(range.end);
  const newBody = after.trim()
    ? `${before}${block}${after}`
    : `${before}${block.replace(/\n+$/, "\n")}`;
  return `${fm}${newBody}`;
}

/** Fresh note body for a new spot. */
export function buildNoteBody(notes: string, visits: Visit[]): string {
  const notesPart = notes.trim() ? `${notes.trim()}\n\n` : "";
  const visitsPart = visits.length ? `\n\n${serializeVisits(visits)}\n` : "\n";
  return `## Notes\n\n${notesPart}## Visits${visitsPart}`;
}

// ---------------------------------------------------------------------------
// Frontmatter mapping (camelCase model <-> snake_case note keys)
// ---------------------------------------------------------------------------

export interface DerivedFields {
  visitCount: number;
  lastVisit?: string;
  rating?: number;
}

/** Recompute derived fields per SPEC: rating = avg of visit ratings (nearest 0.5) unless locked. */
export function computeDerived(
  visits: Visit[],
  ratingLocked: boolean,
  currentRating: number | undefined,
): DerivedFields {
  const d = deriveFromVisits(visits);
  const rating =
    !ratingLocked && d.avgRating !== undefined ? d.avgRating : currentRating;
  return { visitCount: d.visitCount, lastVisit: d.lastVisit, rating };
}

/**
 * Full frontmatter record for a spot. Keys with `undefined` values are
 * DELETED from the note by `applyFrontmatter`, so this record always covers
 * the complete schema.
 */
export function frontmatterFromInput(
  input: SpotInput,
  derived: DerivedFields,
  dates: { created: string; updated: string },
): Record<string, unknown> {
  return {
    type: "foodspot",
    name: input.name,
    cuisines: input.cuisines,
    country: input.country,
    city: asStr(input.city),
    district: asStr(input.district),
    address: asStr(input.address),
    location: serializeLocation(input.coordinates),
    status: input.status,
    favorite: input.favorite,
    // Written only when true — 195 notes don't need `permanently_closed: false`.
    permanently_closed: input.permanentlyClosed ? true : undefined,
    rating: derived.rating,
    rating_locked: input.ratingLocked ? true : undefined,
    price: input.price,
    url: asStr(input.url),
    phone: asStr(input.phone),
    source: input.source,
    source_url: asStr(input.sourceUrl),
    google_rating: input.external.googleRating,
    google_rating_count: input.external.googleRatingCount,
    google_place_id: asStr(input.external.googlePlaceId),
    tripadvisor_rating: input.external.tripadvisorRating,
    tripadvisor_rating_count: input.external.tripadvisorRatingCount,
    tripadvisor_url: asStr(input.external.tripadvisorUrl),
    yelp_rating: input.external.yelpRating,
    yelp_rating_count: input.external.yelpRatingCount,
    yelp_url: asStr(input.external.yelpUrl),
    thefork_rating: input.external.theforkRating,
    thefork_rating_count: input.external.theforkRatingCount,
    thefork_url: asStr(input.external.theforkUrl),
    facebook_rating: input.external.facebookRating,
    facebook_rating_count: input.external.facebookRatingCount,
    facebook_url: asStr(input.external.facebookUrl),
    opentable_rating: input.external.opentableRating,
    opentable_rating_count: input.external.opentableRatingCount,
    opentable_url: asStr(input.external.opentableUrl),
    eetnu_rating: input.external.eetnuRating,
    eetnu_rating_count: input.external.eetnuRatingCount,
    eetnu_url: asStr(input.external.eetnuUrl),
    ratings_updated: asStr(input.external.ratingsUpdated),
    photo: asStr(input.photo),
    menu: asStr(input.menu),
    hours: input.hours && input.hours.length > 0 ? input.hours : undefined,
    visit_count: derived.visitCount,
    last_visit: derived.lastVisit,
    tags: input.tags,
    legacy_id: asStr(input.legacyId),
    created: dates.created,
    updated: dates.updated,
  };
}

/** Apply a record inside a processFrontMatter callback (undefined = delete). */
export function applyFrontmatter(
  fm: Record<string, unknown>,
  data: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) delete fm[key];
    else fm[key] = value;
  }
}

/** Write a (partial or full) frontmatter record to a note. */
export async function writeSpotFrontmatter(
  app: App,
  file: TFile,
  data: Record<string, unknown>,
): Promise<void> {
  await app.fileManager.processFrontMatter(file, (fm) =>
    applyFrontmatter(fm, data),
  );
}

const VALID_SOURCES: SpotSource[] = ["manual", "google-maps", "tripadvisor", "url"];

/**
 * Build the in-memory FoodSpot from a note's frontmatter + body.
 * Derived fields are recomputed from the parsed visits so externally edited
 * notes stay truthful even when their persisted derived keys are stale.
 */
export function buildSpot(
  path: string,
  fm: Record<string, unknown>,
  body: string,
  ctime?: number,
): FoodSpot {
  const baseName = path.split("/").pop()?.replace(/\.md$/i, "") ?? path;
  const visits = parseVisitsSection(extractSection(body, "## Visits"));
  let ratingLocked = asBool(fm.rating_locked ?? fm.ratingLocked);
  const fmRating = asNum(fm.rating);
  // A frontmatter rating that disagrees with the visit-derived average was
  // set by hand (our own writes always keep them in sync). Treat it as a
  // manual override — otherwise the next unrelated write (favorite toggle,
  // bulk rewrite) would silently replace it with the average.
  if (!ratingLocked && fmRating !== undefined) {
    const avg = deriveFromVisits(visits).avgRating;
    if (avg !== undefined && avg !== fmRating) ratingLocked = true;
  }
  const derived = computeDerived(visits, ratingLocked, fmRating);
  const statusRaw = asStr(fm.status);
  const sourceRaw = asStr(fm.source);
  const created =
    dateOnly(asStr(fm.created)) ?? dateOnly(asStr(fm.updated)) ?? todayISO();

  return {
    path,
    name: asStr(fm.name) ?? baseName,
    cuisines: asStrArray(fm.cuisines),
    country: asStr(fm.country) ?? "",
    city: asStr(fm.city),
    district: asStr(fm.district),
    address: asStr(fm.address),
    coordinates: parseLocation(fm.location),
    status: SPOT_STATUSES.includes(statusRaw as never)
      ? (statusRaw as FoodSpot["status"])
      : "want-to-try",
    favorite: asBool(fm.favorite),
    permanentlyClosed: asBool(fm.permanently_closed),
    rating: derived.rating,
    ratingLocked,
    price: asNum(fm.price),
    url: asStr(fm.url),
    phone: asStr(fm.phone),
    source: VALID_SOURCES.includes(sourceRaw as never)
      ? (sourceRaw as SpotSource)
      : "manual",
    sourceUrl: asStr(fm.source_url ?? fm.sourceUrl),
    external: {
      googleRating: asNum(fm.google_rating),
      googleRatingCount: asNum(fm.google_rating_count),
      googlePlaceId: asStr(fm.google_place_id),
      tripadvisorRating: asNum(fm.tripadvisor_rating),
      tripadvisorRatingCount: asNum(fm.tripadvisor_rating_count),
      tripadvisorUrl: asStr(fm.tripadvisor_url),
      yelpRating: asNum(fm.yelp_rating),
      yelpRatingCount: asNum(fm.yelp_rating_count),
      yelpUrl: asStr(fm.yelp_url),
      theforkRating: asNum(fm.thefork_rating),
      theforkRatingCount: asNum(fm.thefork_rating_count),
      theforkUrl: asStr(fm.thefork_url),
      facebookRating: asNum(fm.facebook_rating),
      facebookRatingCount: asNum(fm.facebook_rating_count),
      facebookUrl: asStr(fm.facebook_url),
      opentableRating: asNum(fm.opentable_rating),
      opentableRatingCount: asNum(fm.opentable_rating_count),
      opentableUrl: asStr(fm.opentable_url),
      eetnuRating: asNum(fm.eetnu_rating),
      eetnuRatingCount: asNum(fm.eetnu_rating_count),
      eetnuUrl: asStr(fm.eetnu_url),
      ratingsUpdated: dateOnly(asStr(fm.ratings_updated)),
    },
    photo: asStr(fm.photo),
    menu: asStr(fm.menu),
    hours: asStrArray(fm.hours).length > 0 ? asStrArray(fm.hours) : undefined,
    tags: asStrArray(fm.tags),
    visits,
    visitCount: derived.visitCount,
    lastVisit: derived.lastVisit,
    legacyId: asStr(fm.legacy_id ?? fm.legacyId),
    created,
    updated: dateOnly(asStr(fm.updated)) ?? created,
    ctime,
    notes: extractSection(body, "## Notes"),
  };
}

// ---------------------------------------------------------------------------
// File creation (shared by SpotStore.createSpot and the legacy migration)
// ---------------------------------------------------------------------------

/** Create every missing folder level of a vault path. */
export async function ensureFolder(app: App, folder: string): Promise<void> {
  const parts = folder.split("/").filter(Boolean);
  let path = "";
  for (const part of parts) {
    path = path ? `${path}/${part}` : part;
    if (app.vault.getAbstractFileByPath(path)) continue;
    try {
      await app.vault.createFolder(path);
    } catch {
      // Folder created concurrently — fine.
    }
  }
}

/** First non-colliding path for a filename (numeric suffix: "Name 2.md"). */
export function availablePath(app: App, folder: string, fileName: string): string {
  const base = fileName.replace(/\.md$/i, "");
  const prefix = folder ? `${folder}/` : "";
  let candidate = `${prefix}${base}.md`;
  let n = 2;
  while (app.vault.getAbstractFileByPath(candidate)) {
    candidate = `${prefix}${base} ${n}.md`;
    n += 1;
  }
  return candidate;
}

/**
 * Create a spot note: folder auto-created, filename collision-suffixed
 * (NEVER overwrites), body written first, frontmatter applied via
 * processFrontMatter.
 */
export async function createSpotNote(
  app: App,
  folder: string,
  fileName: string,
  frontmatter: Record<string, unknown>,
  body: string,
): Promise<TFile> {
  await ensureFolder(app, folder);
  const path = availablePath(app, folder, fileName);
  const file = await app.vault.create(path, body);
  await writeSpotFrontmatter(app, file, frontmatter);
  return file;
}

// ---------------------------------------------------------------------------
// Surgical body writers
// ---------------------------------------------------------------------------

/** Replace only the `## Notes` section. */
export async function writeNotesSection(
  app: App,
  file: TFile,
  notes: string,
): Promise<void> {
  await app.vault.process(file, (content) =>
    replaceSection(content, "## Notes", notes.trim()),
  );
}

/** Replace only the `## Visits` section from a full visit list. */
export async function writeVisitsSection(
  app: App,
  file: TFile,
  visits: Visit[],
): Promise<void> {
  await app.vault.process(file, (content) =>
    replaceSection(content, "## Visits", serializeVisits(visits)),
  );
}

/**
 * Read-modify-write the Visits section through the raw line model so
 * non-visit lines the user wrote inside `## Visits` survive verbatim.
 * Returns the visit list after mutation.
 */
export async function mutateVisitLines(
  app: App,
  file: TFile,
  mutate: (lines: VisitLine[]) => VisitLine[],
): Promise<Visit[]> {
  let result: Visit[] = [];
  await app.vault.process(file, (content) => {
    const lines = parseVisitLines(extractSection(content, "## Visits"));
    const next = mutate(lines);
    result = next
      .filter((l): l is Extract<VisitLine, { kind: "visit" }> => l.kind === "visit")
      .map((l) => l.visit);
    return replaceSection(content, "## Visits", serializeVisitLines(next));
  });
  return result;
}
