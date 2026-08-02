/**
 * Food Spot — pure menu-link discovery (no Obsidian imports).
 *
 * `findMenuUrl` scans a page's anchors for links whose href or text matches
 * the menu-word pattern (menu / menukaart / kaart / carte / speisekarte),
 * resolves relative hrefs against the page URL and prefers same-host links
 * over external ones. Match precision:
 *   - gift-card/voucher links are skipped outright ("cadeaukaart" contains
 *     "kaart" but is never the menu);
 *   - STRONG tokens (menu…, speisekarte, carte as a word) outrank the bare
 *     Dutch "kaart" substring, so "Menukaart" beats an earlier "Kaartjes".
 */

const MENU_WORD_RE = /menu|menukaart|kaart|carte|speisekarte/i;

/** High-precision tokens; a bare "kaart"/"carte" substring is a weak match. */
const STRONG_MENU_RE = /menu|speisekarte|\bcartes?\b/i;

/** Gift-card / voucher / ticket words — never the menu, even when "kaart" matches. */
const NOT_MENU_RE = /cadeau|gift|voucher|tegoed|kado|(?<!menu)kaartje/i;

const ANCHOR_RE =
  /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;

/**
 * Find the menu link on a restaurant website. Returns an absolute URL —
 * ranked strong-same-host > weak-same-host > strong-off-host > weak-off-host,
 * earliest anchor winning within a rank. `null` when no anchor matches.
 */
export function findMenuUrl(html: string, baseUrl: string): string | null {
  let baseHost = "";
  try {
    baseHost = new URL(baseUrl).hostname.toLowerCase();
  } catch {
    /* relative hrefs will simply fail to resolve below */
  }

  // Rank 0: strong + same-host (returned immediately), 1: weak + same-host,
  // 2: strong + off-host, 3: weak + off-host.
  const candidates: (string | null)[] = [null, null, null];
  const re = new RegExp(ANCHOR_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const href = (m[1] ?? m[2] ?? m[3] ?? "").trim();
    if (href === "" || href.startsWith("#")) continue;
    if (/^(javascript|mailto|tel|data):/i.test(href)) continue;
    const text = m[4].replace(/<[^>]*>/g, " ");
    if (!MENU_WORD_RE.test(href) && !MENU_WORD_RE.test(text)) continue;
    if (NOT_MENU_RE.test(href) || NOT_MENU_RE.test(text)) continue;

    let resolved: URL;
    try {
      resolved = new URL(href, baseUrl);
    } catch {
      continue;
    }
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") continue;

    const abs = resolved.toString();
    const strong = STRONG_MENU_RE.test(href) || STRONG_MENU_RE.test(text);
    const sameHost = baseHost !== "" && resolved.hostname.toLowerCase() === baseHost;
    if (strong && sameHost) return abs;
    const rank = sameHost ? 0 : strong ? 1 : 2;
    if (candidates[rank] === null) candidates[rank] = abs;
  }
  return candidates[0] ?? candidates[1] ?? candidates[2];
}
