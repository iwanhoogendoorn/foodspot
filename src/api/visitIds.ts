/**
 * Addressable ids for visits, which have none of their own.
 *
 * A visit is a markdown bullet inside a note, and the store addresses it by
 * position (`updateVisit(path, index, …)`). A raw index is useless as a public
 * id: delete an earlier bullet and every later index silently means a
 * different visit. So an id encodes what actually identifies a visit to a
 * human — which spot, which date, and which one that day — and is resolved
 * back to an index at request time.
 *
 * Appending a visit never invalidates an existing id. Editing a visit's DATE
 * does change its own id (the new one comes back in the response), and
 * deleting one of several same-date visits renumbers the later ones for that
 * date only.
 *
 * No node imports: pure, and unit-tested in the smoke suite.
 */
import type { FoodSpot } from "../types";

/** Cannot occur in a vault path, a date, or a number — so it cannot be ambiguous. */
const SEP = "\u0000";

export interface DecodedVisitId {
  spotPath: string;
  date: string;
  /** 1-based position among visits sharing that date, in document order. */
  occurrence: number;
}

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function encodeVisitId(spotPath: string, date: string, occurrence: number): string {
  return toBase64Url(`${spotPath}${SEP}${date}${SEP}${occurrence}`);
}

/** Parses an id, or null when it is malformed — callers answer 404 either way. */
export function decodeVisitId(id: string): DecodedVisitId | null {
  if (id === "" || !/^[A-Za-z0-9_-]+$/.test(id)) return null;
  let raw: string;
  try {
    const b64 = id.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    // fatal: invalid UTF-8 is a bad id, not a replacement character.
    raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
  const parts = raw.split(SEP);
  if (parts.length !== 3) return null;
  const [spotPath, date, occurrenceRaw] = parts;
  const occurrence = Number(occurrenceRaw);
  if (spotPath === "") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!Number.isInteger(occurrence) || occurrence < 1) return null;
  return { spotPath, date, occurrence };
}

/** One id per visit of a spot, in document order — index-aligned with `spot.visits`. */
export function visitIdsOf(spot: FoodSpot): string[] {
  const seenPerDate = new Map<string, number>();
  return spot.visits.map((v) => {
    const occurrence = (seenPerDate.get(v.date) ?? 0) + 1;
    seenPerDate.set(v.date, occurrence);
    return encodeVisitId(spot.path, v.date, occurrence);
  });
}

/** Index of the nth visit on `date`, or -1 when the spot has no such visit. */
export function findVisitIndex(spot: FoodSpot, date: string, occurrence: number): number {
  let seen = 0;
  for (let i = 0; i < spot.visits.length; i++) {
    if (spot.visits[i].date !== date) continue;
    seen += 1;
    if (seen === occurrence) return i;
  }
  return -1;
}
