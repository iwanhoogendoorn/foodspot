/**
 * Pure parsing/serialization for the `## Visits` section.
 *
 * Bullet format: `- [date:: 2026-07-12] [rating:: 4.5] [spent:: 45] free text`
 * - Inline fields may appear in any order; only `date` is required.
 * - Lines without a valid `[date:: …]` field are NOT visits; they are kept
 *   verbatim on rewrite (round-trip safety for user content we don't model).
 */
import type { Visit } from "../types";

/** One physical line of the Visits section: a parsed visit or raw text. */
export type VisitLine =
  | { kind: "visit"; visit: Visit }
  | { kind: "raw"; text: string };

/** Matches recognized inline fields only — unknown fields stay in the note. */
const KNOWN_FIELD_RE = /\[\s*(date|rating|spent)\s*::\s*([^\]]*)\]/gi;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}/;

function parseNumber(raw: string): number | undefined {
  const cleaned = raw.trim().replace(",", ".");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Parse a single line into a Visit, or null when the line has no valid
 * `[date:: YYYY-MM-DD]` field (caller keeps such lines verbatim).
 */
export function parseVisitLine(line: string): Visit | null {
  let date: string | undefined;
  let rating: number | undefined;
  let spent: number | undefined;

  KNOWN_FIELD_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = KNOWN_FIELD_RE.exec(line)) !== null) {
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === "date" && date === undefined) {
      const iso = ISO_DATE_RE.exec(value);
      if (iso) date = iso[0];
    } else if (key === "rating" && rating === undefined) {
      rating = parseNumber(value);
    } else if (key === "spent" && spent === undefined) {
      spent = parseNumber(value);
    }
  }
  if (!date) return null;

  const note = line
    .replace(KNOWN_FIELD_RE, " ")
    .replace(/^\s*[-*+]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

  const visit: Visit = { date, note };
  if (rating !== undefined) visit.rating = rating;
  if (spent !== undefined) visit.spent = spent;
  return visit;
}

/**
 * Parse the full section text into an ordered line model. Blank lines are
 * dropped (serialization re-normalizes spacing); any non-blank line that is
 * not a visit bullet is preserved as raw text.
 */
export function parseVisitLines(sectionText: string): VisitLine[] {
  const lines: VisitLine[] = [];
  for (const line of sectionText.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const visit = parseVisitLine(line);
    if (visit) lines.push({ kind: "visit", visit });
    else lines.push({ kind: "raw", text: line });
  }
  return lines;
}

/** Contract API: just the visits, in document order. */
export function parseVisitsSection(sectionText: string): Visit[] {
  const visits: Visit[] = [];
  for (const line of parseVisitLines(sectionText)) {
    if (line.kind === "visit") visits.push(line.visit);
  }
  return visits;
}

/** Serialize one visit to its canonical bullet line. */
export function serializeVisit(visit: Visit): string {
  let out = `- [date:: ${visit.date}]`;
  if (visit.rating !== undefined) out += ` [rating:: ${visit.rating}]`;
  if (visit.spent !== undefined) out += ` [spent:: ${visit.spent}]`;
  const note = visit.note.trim();
  if (note) out += ` ${note}`;
  return out;
}

/** Serialize a line model back to section text (raw lines verbatim). */
export function serializeVisitLines(lines: VisitLine[]): string {
  return lines
    .map((l) => (l.kind === "visit" ? serializeVisit(l.visit) : l.text))
    .join("\n");
}

/** Contract API: serialize visits only. */
export function serializeVisits(visits: Visit[]): string {
  return visits.map(serializeVisit).join("\n");
}
