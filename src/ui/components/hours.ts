/**
 * Food Spot — opening hours: parsing, open-now state and display order.
 *
 * PURE module (no obsidian import): the stored format is one readable line
 * per day, e.g. "Mon 17:00-22:00", "Sat 12:00-14:30,17:00-23:00",
 * "Tue closed" — human-editable in the note AND parseable here.
 *
 * Parsing is deliberately tolerant: full or short day names, any case, a
 * ":" after the day, en/em dashes as the range separator, and closing times
 * past midnight ("Fri 17:00-01:00") which are stored with close < open.
 */

/** Minutes since midnight; `close < open` means the range runs past midnight. */
export interface DayHours {
  /** 0 = Sunday … 6 = Saturday (matches Date#getDay and Google's periods). */
  day: number;
  ranges: { open: number; close: number }[];
}

/** Display order: Monday first, Sunday last. */
const DISPLAY_DAYS = [1, 2, 3, 4, 5, 6, 0];

const DAY_LABELS: Record<number, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

/** First three letters of every accepted day name -> day number. */
const DAY_BY_PREFIX: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function dayFromWord(word: string): number | undefined {
  return DAY_BY_PREFIX[word.slice(0, 3).toLowerCase()];
}

/**
 * Whether the machine clock may stand in for a spot's own clock when no IANA
 * timezone is known. A spot abroad is judged with the wrong wall time (a New
 * York restaurant read against an Amsterdam clock), so callers must suppress
 * the open/closed claim and show the hours only.
 *
 * Unknown on either side (no country on the spot, no default country in
 * settings) is treated as "same country": the library is overwhelmingly local
 * and dropping every chip would be worse than the rare wrong one.
 */
export function localClockApplies(
  spotCountry: string | undefined,
  homeCountry: string | undefined,
): boolean {
  const spot = (spotCountry ?? "").trim().toLowerCase();
  const home = (homeCountry ?? "").trim().toLowerCase();
  if (spot === "" || home === "") return true;
  return spot === home;
}

/** "17:00" / "9:30" -> minutes since midnight; "24:00" folds to 0 (midnight). */
function parseTime(text: string): number | undefined {
  const m = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (m === null) return undefined;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59) return undefined;
  // 24:00 is the only legal hour-24 notation. Wrapping anything else (24:30)
  // into 00:30 would silently present an invalid time as a plausible one.
  if (h === 24 && min !== 0) return undefined;
  const total = h * 60 + min;
  return total === 1440 ? 0 : total;
}

/** Minutes since midnight -> "HH:MM". */
function fmtTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/**
 * Parse readable hour lines. Unrecognizable lines are skipped; a day whose
 * line says "closed" (any case) parses to an entry with zero ranges — the
 * difference between "known closed" and "unknown" that openState needs.
 * Result is sorted by day number, one entry per day (repeated days merge).
 */
export function parseHours(lines: string[]): DayHours[] {
  const byDay = new Map<number, { open: number; close: number }[]>();

  for (const raw of lines) {
    if (typeof raw !== "string") continue;
    const line = raw.replace(/[‐-―]/g, "-").trim();
    if (line === "") continue;
    const head = /^([A-Za-z]+)\s*:?\s*(.*)$/.exec(line);
    if (head === null) continue;
    const day = dayFromWord(head[1]);
    if (day === undefined) continue;
    const rest = head[2].trim();

    const ranges = byDay.get(day) ?? [];
    if (!byDay.has(day)) byDay.set(day, ranges);
    if (rest === "" || /closed/i.test(rest)) continue;

    for (const part of rest.split(",")) {
      const pair = part.split("-");
      if (pair.length !== 2) continue;
      const open = parseTime(pair[0]);
      const close = parseTime(pair[1]);
      if (open === undefined || close === undefined) continue;
      ranges.push({ open, close });
    }
    ranges.sort((a, b) => a.open - b.open);
  }

  return [...byDay.entries()]
    .map(([day, ranges]) => ({ day, ranges }))
    .sort((a, b) => a.day - b.day);
}

/**
 * The wall clock a spot's hours must be read against: day of week + minutes
 * since midnight in `timeZone`, or in the machine's own zone when no zone is
 * given. Returns null for a zone the runtime rejects — an unusable zone must
 * not silently fall back to the local clock, because a wrong "Open" claim is
 * worse than no claim at all.
 */
function wallClock(
  now: Date,
  timeZone: string | undefined,
): { day: number; minutes: number } | null {
  if (timeZone === undefined || timeZone.trim() === "") {
    return { day: now.getDay(), minutes: now.getHours() * 60 + now.getMinutes() };
  }
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone.trim(),
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
  } catch {
    return null;
  }
  const partValue = (type: string): string =>
    parts.find((p) => p.type === type)?.value ?? "";
  const day = dayFromWord(partValue("weekday"));
  const hourText = partValue("hour");
  const minuteText = partValue("minute");
  // Digits are checked before Number(): Number("") is 0, which would read a
  // missing part as midnight.
  if (day === undefined || !/^\d{1,2}$/.test(hourText) || !/^\d{1,2}$/.test(minuteText)) {
    return null;
  }
  // Some ICU builds still render midnight as "24" under h23.
  return { day, minutes: (Number(hourText) % 24) * 60 + Number(minuteText) };
}

/**
 * Open-now state for the card chip and the detail modal.
 *
 * `timeZone` is the spot's own IANA zone (e.g. "America/New_York"); pass it
 * whenever it is known, otherwise the machine clock is used — which is only
 * honest for spots in the user's own timezone (see `localClockApplies`).
 *
 * Returns null when the hours are unknown, nothing in them parsed, or the
 * given timezone is unusable — the UI then shows no indicator at all rather
 * than guessing "closed".
 *
 * A range with `close <= open` runs past midnight, so "now" is matched against
 * both today's ranges and yesterday's after-midnight tail.
 */
export function openState(
  hours: string[] | undefined,
  now: Date,
  timeZone?: string,
): { open: boolean; label: string } | null {
  if (hours === undefined || hours.length === 0) return null;
  const parsed = parseHours(hours);
  if (parsed.length === 0) return null;
  const clock = wallClock(now, timeZone);
  if (clock === null) return null;

  const byDay = new Map(parsed.map((d) => [d.day, d.ranges]));
  const today = clock.day;
  const minutes = clock.minutes;

  for (const range of byDay.get(today) ?? []) {
    // close === open is the degenerate "open all day" range Google emits for
    // 24/7 places that still carry a closing time.
    const overnight = range.close <= range.open;
    if (minutes >= range.open && (overnight || minutes < range.close)) {
      return { open: true, label: `Open until ${fmtTime(range.close)}` };
    }
  }
  // Yesterday's after-midnight tail: "Fri 17:00-01:00" is still open at 00:30.
  for (const range of byDay.get((today + 6) % 7) ?? []) {
    if (range.close < range.open && minutes < range.close) {
      return { open: true, label: `Open until ${fmtTime(range.close)}` };
    }
  }

  const laterToday = (byDay.get(today) ?? [])
    .filter((r) => r.open > minutes)
    .sort((a, b) => a.open - b.open)[0];
  if (laterToday !== undefined) {
    return { open: false, label: `Closed — opens ${fmtTime(laterToday.open)}` };
  }
  // Scan forward a full week; offset 7 catches libraries listing a single day.
  for (let offset = 1; offset <= 7; offset++) {
    const day = (today + offset) % 7;
    const next = (byDay.get(day) ?? []).slice().sort((a, b) => a.open - b.open)[0];
    if (next !== undefined) {
      return { open: false, label: `Closed — opens ${DAY_LABELS[day]} ${fmtTime(next.open)}` };
    }
  }
  return { open: false, label: "Closed today" };
}

/**
 * The seven lines for the detail modal, Monday first. Original lines are
 * returned verbatim (the user's own wording survives); days the note never
 * mentions become "Wed —" so the block always reads as a full week. Today is
 * not marked here — the caller styles the line at index (getDay() + 6) % 7.
 */
export function formatHoursForDisplay(hours: string[]): string[] {
  const lineByDay = new Map<number, string>();
  for (const raw of hours) {
    if (typeof raw !== "string") continue;
    const line = raw.trim();
    if (line === "") continue;
    const head = /^([A-Za-z]+)/.exec(line);
    if (head === null) continue;
    const day = dayFromWord(head[1]);
    if (day === undefined || lineByDay.has(day)) continue;
    lineByDay.set(day, line);
  }
  return DISPLAY_DAYS.map((day) => lineByDay.get(day) ?? `${DAY_LABELS[day]} —`);
}
