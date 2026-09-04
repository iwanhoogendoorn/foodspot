/**
 * Food Spot's HTTP surface, as a pure function: a request in, a JSON response
 * out. Everything goes through the same SpotStore mutations the views use, so
 * an outside caller cannot skip the bookkeeping (derived visit_count /
 * last_visit, surgical frontmatter writes, change notifications) that keeps a
 * vault consistent. Mirrors Helm's src/api/routes.ts.
 */
import type { FoodSpot, FoodSpotSettings, SpotInput, SpotStatus, SpotStoreApi, Visit } from "../types";
import { SPOT_STATUSES } from "../types";
import { parseCalendarDate } from "../util/dates";

export const API_BASE = "/foodspot/v1";

export interface ApiRequest {
  method: string;
  /** Path with the base stripped: `spots`, `spots/Netherlands/Harput (Den Haag).md`, … */
  path: string;
  query: Record<string, string>;
  body?: unknown;
}

export interface ApiResponse {
  status: number;
  body: unknown;
}

export interface ApiDeps {
  store: SpotStoreApi;
  settings: () => FoodSpotSettings;
  today: () => string;
  version: string;
  /** False until the store's initial vault scan has finished. */
  ready: () => boolean;
}

const ok = (body: unknown): ApiResponse => ({ status: 200, body });
const made = (body: unknown): ApiResponse => ({ status: 201, body });
const bad = (message: string): ApiResponse => ({ status: 400, body: { error: message } });
const missing = (message: string): ApiResponse => ({ status: 404, body: { error: message } });

const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;
const has = (body: Record<string, unknown>, k: string): boolean =>
  Object.prototype.hasOwnProperty.call(body, k);

const isIsoDate = (s: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && parseCalendarDate(s) !== null;
const day = (v: unknown): string | undefined => {
  const s = str(v);
  return s && isIsoDate(s) ? s : undefined;
};
/** Personal ratings are half stars: 0.5–5 in steps of 0.5. */
const isHalfStarRating = (n: number): boolean => n >= 0.5 && n <= 5 && Number.isInteger(n * 2);

const spentOf = (v: Visit): number | undefined =>
  typeof v.spent === "number" && Number.isFinite(v.spent) ? v.spent : undefined;

function totalSpent(s: FoodSpot): number | null {
  let sum = 0;
  let any = false;
  for (const v of s.visits) {
    const a = spentOf(v);
    if (a !== undefined) {
      sum += a;
      any = true;
    }
  }
  return any ? Math.round(sum * 100) / 100 : null;
}

function visitJson(v: Visit): Record<string, unknown> {
  return {
    date: v.date,
    spent: spentOf(v) ?? null,
    rating: v.rating ?? null,
    note: v.note,
    ...(v.photos && v.photos.length > 0 ? { photos: v.photos } : {}),
  };
}

/** The list-view shape: everything about the spot except the visit bullets. */
function spotJson(s: FoodSpot): Record<string, unknown> {
  return {
    path: s.path,
    name: s.name,
    status: s.status,
    favorite: s.favorite,
    permanentlyClosed: s.permanentlyClosed,
    rating: s.rating ?? null,
    price: s.price ?? null,
    cuisines: s.cuisines,
    country: s.country,
    city: s.city ?? null,
    address: s.address ?? null,
    location: s.coordinates ?? null,
    url: s.url ?? null,
    phone: s.phone ?? null,
    googleRating: s.external.googleRating ?? null,
    googleRatingCount: s.external.googleRatingCount ?? null,
    tags: s.tags,
    visitCount: s.visitCount,
    lastVisit: s.lastVisit ?? null,
    totalSpent: totalSpent(s),
    created: s.created,
    updated: s.updated,
  };
}

function spotJsonFull(s: FoodSpot): Record<string, unknown> {
  return {
    ...spotJson(s),
    hours: s.hours ?? null,
    menu: s.menu ?? null,
    photo: s.photo ?? null,
    source: s.source,
    sourceUrl: s.sourceUrl ?? null,
    external: s.external,
    notes: s.notes,
    visits: s.visits.map(visitJson),
  };
}

/**
 * A spot by reference: exact vault path, path relative to the spots folder,
 * either with `.md` optional, the note's basename, or (unique) name. An
 * ambiguous name is an error that lists the candidates rather than a guess.
 */
function findSpot(ref: string, d: ApiDeps): FoodSpot | ApiResponse {
  const direct =
    d.store.getByPath(ref) ??
    d.store.getByPath(`${ref}.md`) ??
    d.store.getByPath(`${d.settings().spotsFolder}/${ref}`) ??
    d.store.getByPath(`${d.settings().spotsFolder}/${ref}.md`);
  if (direct) return direct;
  const lower = ref.toLowerCase();
  const matches = d.store
    .getSpots()
    .filter(
      (s) =>
        s.name.toLowerCase() === lower ||
        s.path.toLowerCase().endsWith(`/${lower}.md`) ||
        s.path.toLowerCase().endsWith(`/${lower}`),
    );
  if (matches.length === 1) return matches[0];
  if (matches.length > 1)
    return bad(`"${ref}" is ambiguous — use a path: ${matches.map((m) => m.path).join(" | ")}`);
  return missing(`No spot "${ref}"`);
}

const isResponse = (v: FoodSpot | ApiResponse): v is ApiResponse =>
  typeof (v as ApiResponse).status === "number" && "body" in v;

export async function handle(req: ApiRequest, d: ApiDeps): Promise<ApiResponse> {
  const parts = req.path.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  const head = parts[0];
  const body = asRecord(req.body);
  const method = req.method.toUpperCase();

  if (head === "health" && method === "GET") {
    const spots = d.store.getSpots();
    const countries = new Set(spots.map((s) => s.country));
    return ok({
      ok: true,
      version: d.version,
      ready: d.ready(),
      today: d.today(),
      counts: {
        spots: spots.length,
        visited: spots.filter((s) => s.status === "visited").length,
        wantToTry: spots.filter((s) => s.status === "want-to-try").length,
        visits: spots.reduce((n, s) => n + s.visits.length, 0),
        countries: countries.size,
      },
    });
  }

  if (head === "stats" && method === "GET") return ok(stats(d));

  if (head === "visits" && method === "GET") return ok({ visits: listVisits(req.query, d) });

  if (head === "spots") {
    // Spot paths contain slashes, so the ref is everything after `spots/` —
    // unless the last segment is the `visits` sub-resource.
    let sub: string | undefined;
    let refParts = parts.slice(1);
    if (refParts.length > 1 && refParts[refParts.length - 1] === "visits") {
      sub = "visits";
      refParts = refParts.slice(0, -1);
    }
    const ref = refParts.length > 0 ? refParts.join("/") : undefined;

    if (method === "GET" && ref === undefined) return ok({ spots: listSpots(req.query, d) });
    if (method === "POST" && ref === undefined) return createSpot(body, d);
    if (ref === undefined) return { status: 405, body: { error: `Cannot ${method} ${req.path}` } };

    const found = findSpot(ref, d);
    if (isResponse(found)) return found;

    if (sub === "visits") {
      if (method === "GET") return ok({ visits: found.visits.map(visitJson) });
      if (method === "POST") return addVisit(found, body, d);
      return { status: 405, body: { error: `Cannot ${method} ${req.path}` } };
    }
    if (method === "GET") return ok(spotJsonFull(found));
    if (method === "PATCH" || method === "PUT") return patchSpot(found, body, d);
    if (method === "DELETE") {
      await d.store.deleteSpot(found.path);
      return ok({ deleted: found.path });
    }
    return { status: 405, body: { error: `Cannot ${method} ${req.path}` } };
  }

  return missing(`No route ${req.path}`);
}

function listSpots(q: Record<string, string>, d: ApiDeps): Record<string, unknown>[] {
  const limit = Math.min(Number(q["limit"] ?? 500) || 500, 1000);
  const status = (q["status"] ?? "all").toLowerCase();
  const text = (q["q"] ?? "").toLowerCase();
  const cuisine = (q["cuisine"] ?? "").toLowerCase();
  const tag = (q["tag"] ?? "").toLowerCase();
  const minRating = Number(q["minRating"] ?? 0) || 0;
  const out: FoodSpot[] = [];
  for (const s of d.store.getSpots()) {
    if (status !== "all" && s.status !== status) continue;
    if (q["favorite"] === "true" && !s.favorite) continue;
    if (q["country"] && s.country.toLowerCase() !== q["country"].toLowerCase()) continue;
    if (q["city"] && (s.city ?? "").toLowerCase() !== q["city"].toLowerCase()) continue;
    if (cuisine && !s.cuisines.some((c) => c.toLowerCase() === cuisine)) continue;
    if (tag && !s.tags.some((t) => t.toLowerCase() === tag)) continue;
    if (minRating > 0 && (s.rating ?? 0) < minRating) continue;
    if (
      text &&
      ![s.name, s.city ?? "", s.country, ...s.cuisines].some((f) =>
        f.toLowerCase().includes(text),
      )
    )
      continue;
    out.push(s);
  }
  return out
    .sort((a, b) => a.name.localeCompare(b.name) || a.path.localeCompare(b.path))
    .slice(0, limit)
    .map(spotJson);
}

function listVisits(q: Record<string, string>, d: ApiDeps): Record<string, unknown>[] {
  const limit = Math.min(Number(q["limit"] ?? 100) || 100, 1000);
  const rows: { spot: FoodSpot; visit: Visit }[] = [];
  for (const spot of d.store.getSpots()) {
    for (const visit of spot.visits) {
      if (q["from"] && visit.date < q["from"]) continue;
      if (q["to"] && visit.date > q["to"]) continue;
      rows.push({ spot, visit });
    }
  }
  return rows
    .sort((a, b) => b.visit.date.localeCompare(a.visit.date) || a.spot.name.localeCompare(b.spot.name))
    .slice(0, limit)
    .map((r) => ({
      spot: { path: r.spot.path, name: r.spot.name, city: r.spot.city ?? null, country: r.spot.country },
      ...visitJson(r.visit),
    }));
}

function stats(d: ApiDeps): Record<string, unknown> {
  const spots = d.store.getSpots();
  let visits = 0;
  let spent = 0;
  const byCountry: Record<string, number> = {};
  for (const s of spots) {
    visits += s.visits.length;
    for (const v of s.visits) spent += spentOf(v) ?? 0;
    byCountry[s.country] = (byCountry[s.country] ?? 0) + 1;
  }
  const top = spots
    .filter((s) => s.visits.length > 0)
    .sort((a, b) => b.visits.length - a.visits.length || a.name.localeCompare(b.name))
    .slice(0, 10)
    .map((s) => ({ path: s.path, name: s.name, visits: s.visits.length, totalSpent: totalSpent(s) }));
  return {
    currency: d.settings().currencySymbol,
    spots: spots.length,
    visited: spots.filter((s) => s.status === "visited").length,
    wantToTry: spots.filter((s) => s.status === "want-to-try").length,
    favorites: spots.filter((s) => s.favorite).length,
    visits,
    totalSpent: Math.round(spent * 100) / 100,
    countries: new Set(spots.map((s) => s.country)).size,
    cities: new Set(spots.map((s) => s.city).filter(Boolean)).size,
    byCountry,
    topVisited: top,
  };
}

/** Reads the writable-over-HTTP fields out of a request body, validating hard. */
function spotFields(
  body: Record<string, unknown>,
): { fields: Partial<SpotInput> } | ApiResponse {
  const fields: Partial<SpotInput> = {};
  if (has(body, "status")) {
    const s = str(body["status"]);
    if (!s || !SPOT_STATUSES.includes(s as SpotStatus))
      return bad(`status must be one of ${SPOT_STATUSES.join(", ")}`);
    fields.status = s as SpotStatus;
  }
  if (has(body, "favorite")) {
    if (typeof body["favorite"] !== "boolean") return bad("favorite must be true or false");
    fields.favorite = body["favorite"];
  }
  if (has(body, "rating")) {
    if (body["rating"] === null) {
      // Back to deriving from visit ratings.
      fields.rating = undefined;
      fields.ratingLocked = false;
    } else {
      const r = num(body["rating"]);
      if (r === undefined || !isHalfStarRating(r))
        return bad("rating must be 0.5–5 in half steps, or null to unlock");
      fields.rating = r;
      fields.ratingLocked = true;
    }
  }
  if (has(body, "price")) {
    if (body["price"] === null) fields.price = undefined;
    else {
      const p = num(body["price"]);
      if (p === undefined || !Number.isInteger(p) || p < 1 || p > 4)
        return bad("price must be 1–4, or null to clear");
      fields.price = p;
    }
  }
  if (has(body, "cuisines")) {
    const raw = body["cuisines"];
    const list = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : null;
    if (!list || !list.every((c) => typeof c === "string"))
      return bad("cuisines must be a string or an array of strings");
    fields.cuisines = list.map((c) => (c as string).trim()).filter(Boolean);
  }
  if (has(body, "tags")) {
    const raw = body["tags"];
    if (!Array.isArray(raw) || !raw.every((t) => typeof t === "string"))
      return bad("tags must be an array of strings");
    fields.tags = raw.map((t) => (t as string).trim()).filter(Boolean);
  }
  if (has(body, "location")) {
    const raw = body["location"];
    if (raw === null) fields.coordinates = undefined;
    else {
      const r = asRecord(raw);
      const lat = num(r["lat"]);
      const lng = num(r["lng"]);
      if (lat === undefined || lng === undefined)
        return bad('location must be {"lat": …, "lng": …}, or null to clear');
      fields.coordinates = { lat, lng };
    }
  }
  for (const key of ["name", "city", "district", "address", "url", "phone", "menu"] as const) {
    if (!has(body, key)) continue;
    if (body[key] === null) {
      if (key === "name") return bad("name cannot be cleared");
      fields[key] = undefined;
    } else {
      const v = str(body[key]);
      if (!v) return bad(`${key} must be a non-empty string, or null to clear`);
      fields[key] = v;
    }
  }
  if (has(body, "country")) {
    const v = str(body["country"]);
    if (!v) return bad("country must be a non-empty string");
    fields.country = v;
  }
  return { fields };
}

async function createSpot(body: Record<string, unknown>, d: ApiDeps): Promise<ApiResponse> {
  const name = str(body["name"]);
  if (!name) return bad("A spot needs a name");
  const parsed = spotFields(body);
  if ("status" in parsed && "body" in parsed) return parsed;
  const fields = (parsed as { fields: Partial<SpotInput> }).fields;
  const country = fields.country ?? str(d.settings().defaultCountry);
  if (!country) return bad("A spot needs a country (none set as default in settings)");
  const notes = typeof body["notes"] === "string" ? (body["notes"] as string) : "";
  const input: SpotInput = {
    name,
    cuisines: fields.cuisines ?? [],
    country,
    city: fields.city,
    district: fields.district,
    address: fields.address,
    coordinates: fields.coordinates,
    status: fields.status ?? "want-to-try",
    favorite: fields.favorite ?? false,
    permanentlyClosed: false,
    rating: fields.rating,
    ratingLocked: fields.ratingLocked ?? false,
    price: fields.price,
    url: fields.url,
    phone: fields.phone,
    source: "manual",
    sourceUrl: undefined,
    external: {},
    photo: undefined,
    menu: fields.menu,
    hours: undefined,
    tags: fields.tags ?? [],
    visits: [],
    legacyId: undefined,
    notes,
  };
  const spot = await d.store.createSpot(input);
  return made({ spot: spotJsonFull(spot) });
}

async function patchSpot(
  spot: FoodSpot,
  body: Record<string, unknown>,
  d: ApiDeps,
): Promise<ApiResponse> {
  const parsed = spotFields(body);
  if ("status" in parsed && "body" in parsed) return parsed;
  const fields = (parsed as { fields: Partial<SpotInput> }).fields;
  const notes = has(body, "notes") ? body["notes"] : undefined;
  if (notes !== undefined && typeof notes !== "string") return bad("notes must be a string");
  if (Object.keys(fields).length === 0 && notes === undefined) return bad("Nothing to change");
  // `spotFields` uses undefined for "clear this key"; updateSpot honours that
  // only for keys present on the partial, which structuredClone-free spread keeps.
  let after = spot;
  if (Object.keys(fields).length > 0) after = await d.store.updateSpot(spot.path, fields);
  if (notes !== undefined) await d.store.setNotes(spot.path, notes);
  return ok({ spot: spotJsonFull(d.store.getByPath(after.path) ?? after) });
}

async function addVisit(
  spot: FoodSpot,
  body: Record<string, unknown>,
  d: ApiDeps,
): Promise<ApiResponse> {
  const rawDate = body["date"];
  const date = rawDate === undefined ? d.today() : day(rawDate);
  if (!date) return bad("date must be a date like 2026-09-02 (omit it for today)");
  const visit: Visit = { date, note: "" };
  if (has(body, "spent")) {
    const a = num(body["spent"]);
    if (a === undefined || a < 0) return bad("spent must be a non-negative number");
    visit.spent = a;
  }
  if (has(body, "rating")) {
    const r = num(body["rating"]);
    if (r === undefined || !isHalfStarRating(r)) return bad("rating must be 0.5–5 in half steps");
    visit.rating = r;
  }
  if (has(body, "note")) {
    if (typeof body["note"] !== "string") return bad("note must be a string");
    visit.note = (body["note"] as string).trim();
  }
  const after = await d.store.addVisit(spot.path, visit);
  return made({ spot: { path: after.path, name: after.name, visitCount: after.visitCount, lastVisit: after.lastVisit ?? null }, visit: visitJson(visit) });
}
