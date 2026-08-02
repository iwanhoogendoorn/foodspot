/**
 * Food Spot — "paste a list of restaurant names" parser (PURE, no imports).
 *
 * The input is whatever someone copied out of a chat: bullets, numbering,
 * emoji, a stray link, a line of prose. The rules below are deliberately dumb
 * and order-independent so the live "N names recognized" counter in the list
 * import modal never surprises the user:
 *
 *   1. one candidate per line
 *   2. strip list markers off the FRONT ("-", "*", "•", ">", "1.", "1)",
 *      "1 - ") — repeatedly, so "1. - Momiji" resolves
 *   3. strip emoji (and skin-tone/variation/ZWJ/flag scaffolding) anywhere
 *   4. strip leading/trailing punctuation, collapse inner whitespace
 *   5. drop: empties, anything with no letter in it, URLs and bare domains,
 *      and lines longer than MAX_NAME_LENGTH (prose, not a name)
 *   6. dedupe case-insensitively, keeping the first spelling seen
 *   7. cap at MAX_NAMES; the overflow is reported as `dropped`
 *
 * Only rule 7 feeds `dropped` — lines rejected by rule 5 were never names, so
 * counting them would make the modal claim it threw away data it never had.
 */

/** Hard cap on how many names one paste can yield. */
export const MAX_NAMES = 100;

/** Cleaned lines longer than this are prose, not a restaurant name. */
export const MAX_NAME_LENGTH = 80;

export interface ParsedNameList {
  names: string[];
  /** Valid names discarded because the paste exceeded MAX_NAMES. */
  dropped: number;
}

/** Emoji, skin tones, variation selectors, ZWJ and regional-indicator flags. */
const EMOJI_RE =
  /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{20E3}\u{200D}]/gu;

/** Bidi marks and zero-width junk that rides along with pasted chat text. */
const INVISIBLE_RE = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

/** "-", "*", "•", "·", "‣", "▪", "◦", "+", ">", en/em dashes. */
const BULLET_RE = /^[\s>*•·‣▪◦+\-–—]+/;

/** "1." / "1)" / "1]" / "1:" and the spaced "1 - " form. */
const NUMBERING_RE = /^(?:\d{1,3}[.):\]]\s*|\d{1,3}\s+[-–—]\s+)/;

const LEADING_PUNCT_RE = /^[\s,;:.!?*•·"'“”‘’]+/;
const TRAILING_PUNCT_RE = /[\s,;:.!*•·\-–—"'“”‘’]+$/;

/** Suffixes that make a dotted, space-free line a link rather than a name. */
const URL_TLDS = new Set([
  "com", "net", "org", "info", "biz", "io", "co", "app", "site", "menu",
  "restaurant", "nl", "be", "de", "fr", "es", "it", "pt", "uk", "eu", "us",
]);

function looksLikeUrl(s: string): boolean {
  if (/https?:\/\//i.test(s) || /\bwww\./i.test(s)) return true;
  // A bare domain only counts when the whole line is one dotted token whose
  // last piece is a known suffix — "St.Louis Diner" must survive.
  if (/\s/.test(s)) return false;
  const parts = s.toLowerCase().split(".");
  if (parts.length < 2 || parts.some((p) => p === "")) return false;
  return URL_TLDS.has(parts[parts.length - 1]);
}

/** Rules 2–4: one raw line to a cleaned name (possibly empty). */
function cleanLine(line: string): string {
  let s = line.replace(INVISIBLE_RE, "").replace(EMOJI_RE, " ");
  // Markers can nest ("1. - Momiji"), so strip until nothing more comes off.
  for (let i = 0; i < 5; i++) {
    const before = s;
    s = s.replace(BULLET_RE, "").replace(NUMBERING_RE, "");
    if (s === before) break;
  }
  return s
    .replace(LEADING_PUNCT_RE, "")
    .replace(TRAILING_PUNCT_RE, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isName(s: string): boolean {
  if (s === "" || s.length > MAX_NAME_LENGTH) return false;
  if (!/\p{L}/u.test(s)) return false;
  return !looksLikeUrl(s);
}

/** Parse pasted text into names, reporting how many the cap discarded. */
export function parseNameListVerbose(text: string): ParsedNameList {
  const seen = new Set<string>();
  const names: string[] = [];
  let dropped = 0;
  for (const raw of text.split(/\r\n|\r|\n/)) {
    const name = cleanLine(raw);
    if (!isName(name)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (names.length >= MAX_NAMES) {
      dropped++;
      continue;
    }
    names.push(name);
  }
  return { names, dropped };
}

/** Names only — the counter and the importer both read through this. */
export function parseNameList(text: string): string[] {
  return parseNameListVerbose(text).names;
}
