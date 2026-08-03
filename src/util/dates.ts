/**
 * Calendar-date helpers with LOCAL semantics.
 *
 * `new Date("2026-08-02")` and `toISOString().slice(0, 10)` both go through
 * UTC, which shifts the day for anyone west of Greenwich in the evening or
 * east of it in the morning: a visit logged tonight can render as "yesterday",
 * and "today" can be written into a note as tomorrow's date. Everything in
 * Food Spot that means a *calendar day* (visit dates, created/updated,
 * ratings_updated) goes through these helpers instead.
 */

/** Today as YYYY-MM-DD in the user's own timezone. */
export function todayIso(): string {
  return formatCalendarDate(new Date());
}

/** A Date at LOCAL midnight of the given YYYY-MM-DD, or null when unparseable. */
export function parseCalendarDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (m === null) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Local-midnight construction; the round-trip check rejects overflow dates
  // like 2026-02-31, which the Date constructor would silently roll forward.
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return d;
}

/** YYYY-MM-DD for a Date, read in the user's own timezone. */
export function formatCalendarDate(d: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Whole calendar days from `aIso` to `bIso` (b − a), DST-safe because both
 * ends are normalized to local midnight. NaN when either side is unparseable.
 */
export function daysBetweenCalendar(aIso: string, bIso: string): number {
  const a = parseCalendarDate(aIso);
  const b = parseCalendarDate(bIso);
  if (a === null || b === null) return Number.NaN;
  const DAY = 86_400_000;
  // Round: a DST transition makes the raw difference 23 or 25 hours.
  return Math.round((b.getTime() - a.getTime()) / DAY);
}

/** Whole calendar days between `iso` and today; NaN when unparseable. */
export function daysSinceCalendar(iso: string): number {
  return daysBetweenCalendar(iso, todayIso());
}
