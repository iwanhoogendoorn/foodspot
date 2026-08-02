/**
 * Food Spot — network layer for the import pipeline.
 *
 * All traffic goes through Obsidian's `requestUrl` (never fetch), raced
 * against an 8s timeout, scanned for bot-check pages, throttled per host
 * (min 300ms between calls), with manual redirect resolution for short
 * links (maps.app.goo.gl etc.) via the Location header, up to 3 hops.
 */
import { requestUrl, type RequestUrlResponse } from "obsidian";

export const DEFAULT_TIMEOUT_MS = 8000;
const MIN_INTERVAL_MS = 300;
const MAX_REDIRECT_HOPS = 3;

const BOT_CHECK_RE = /just a moment|g-recaptcha|cf-challenge|captcha/i;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const SHORTLINK_HOSTS = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "www.goo.gl",
  "g.co",
  "bit.ly",
  "tinyurl.com",
  "t.co",
]);

const DEFAULT_HEADERS: Record<string, string> = {
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "en",
};

export class BotCheckError extends Error {
  constructor(url: string) {
    super(
      `${hostOf(url)} is showing a bot-check page instead of content. ` +
        "Open the link once in your browser, then retry — or add the spot manually.",
    );
    this.name = "BotCheckError";
  }
}

export class TimeoutError extends Error {
  constructor(url: string, ms: number) {
    super(`Request to ${hostOf(url)} timed out after ${Math.round(ms / 1000)}s.`);
    this.name = "TimeoutError";
  }
}

export interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  /** Passed to requestUrl; default true (HTTP error statuses reject). */
  throw?: boolean;
  /** Skip the bot-check body scan (use for JSON API endpoints). */
  skipBotCheck?: boolean;
  timeoutMs?: number;
}

export interface ResolvedUrl {
  finalUrl: string;
  /** Body of the final hop when it returned 2xx HTML — reuse to avoid a second fetch. */
  html?: string;
}

// ---------------------------------------------------------------------------
// Per-host sequential throttle: min 300ms between calls to the same host.
// ---------------------------------------------------------------------------

const lastCallAt = new Map<string, number>();
const hostQueues = new Map<string, Promise<void>>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function throttle(host: string): Promise<void> {
  const prev = hostQueues.get(host) ?? Promise.resolve();
  const next = prev.then(async () => {
    const wait = (lastCallAt.get(host) ?? 0) + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCallAt.set(host, Date.now());
  });
  hostQueues.set(
    host,
    next.catch(() => undefined),
  );
  return next;
}

// ---------------------------------------------------------------------------
// fetchWithTimeout
// ---------------------------------------------------------------------------

function safeText(res: RequestUrlResponse): string | null {
  try {
    const t = res.text;
    return typeof t === "string" ? t : null;
  } catch {
    return null;
  }
}

function headerOf(res: RequestUrlResponse, name: string): string | undefined {
  const headers = res.headers ?? {};
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) return headers[key];
  }
  return undefined;
}

/**
 * requestUrl raced against a timeout. Throws BotCheckError when the response
 * body looks like a CAPTCHA / challenge page (unless skipBotCheck).
 */
export async function fetchWithTimeout(
  url: string,
  opts: FetchOptions = {},
): Promise<RequestUrlResponse> {
  await throttle(hostOf(url));
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(url, timeoutMs)), timeoutMs);
  });
  try {
    const res = await Promise.race([
      requestUrl({
        url,
        method: opts.method ?? "GET",
        headers: { ...DEFAULT_HEADERS, ...(opts.headers ?? {}) },
        throw: opts.throw ?? true,
      }),
      timeout,
    ]);
    if (!opts.skipBotCheck) {
      const body = safeText(res);
      if (body !== null && BOT_CHECK_RE.test(body)) throw new BotCheckError(url);
    }
    return res;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Redirect resolution for short links
// ---------------------------------------------------------------------------

function isShortlinkHost(url: string): boolean {
  return SHORTLINK_HOSTS.has(hostOf(url).toLowerCase());
}

/** Unwrap Google's consent interstitial (consent.google.com?continue=<target>). */
function unwrapConsent(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/^consent\.google\.[a-z.]+$/.test(u.hostname)) return null;
    const cont = u.searchParams.get("continue");
    if (cont && /^https?:\/\//.test(cont)) return cont;
  } catch {
    /* not a URL */
  }
  return null;
}

/** Pull a redirect target out of an HTML body (og:url, canonical, meta refresh, maps URL). */
function extractTargetFromHtml(html: string, baseUrl: string): string | null {
  const unescape = (s: string): string =>
    s.replace(/\\u0026/g, "&").replace(/&amp;/g, "&");

  const og = html.match(
    /<meta[^>]+property\s*=\s*["']og:url["'][^>]*content\s*=\s*["']([^"']+)["']/i,
  ) ?? html.match(
    /<meta[^>]+content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:url["']/i,
  );
  const canonical = html.match(
    /<link[^>]+rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["']/i,
  );
  const refresh = html.match(
    /<meta[^>]+http-equiv\s*=\s*["']refresh["'][^>]*content\s*=\s*["'][^"']*url=([^"']+)["']/i,
  );
  const mapsInBody = html.match(
    /https:\/\/www\.google\.[a-z.]+\/maps\/(?:place|search)\/[^"'\\\s<>]+/i,
  );

  for (const m of [og, canonical, refresh, mapsInBody]) {
    if (!m) continue;
    const raw = unescape(m[1] ?? m[0]).trim();
    try {
      const abs = new URL(raw, baseUrl).toString();
      if (abs !== baseUrl) return abs;
    } catch {
      /* skip malformed */
    }
  }
  return null;
}

/**
 * Follow short links to the real URL. Uses throw:false GETs and parses the
 * Location header manually (up to 3 hops). When a shortlink host answers 200
 * (auto-followed internally or an interstitial), falls back to extracting the
 * target from the body. Returns the final URL plus its HTML when available.
 */
export async function resolveRedirects(url: string): Promise<ResolvedUrl> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop++) {
    const consentTarget = unwrapConsent(current);
    if (consentTarget) {
      current = consentTarget;
      continue;
    }

    let res: RequestUrlResponse;
    try {
      res = await fetchWithTimeout(current, { throw: false, skipBotCheck: true });
    } catch (e) {
      if (hop === 0) throw e;
      // We at least resolved part of the chain — hand back what we have.
      return { finalUrl: current };
    }

    const location = headerOf(res, "location");
    if (REDIRECT_STATUSES.has(res.status) && location) {
      try {
        current = new URL(location, current).toString();
      } catch {
        return { finalUrl: current };
      }
      continue;
    }

    if (res.status >= 400) return { finalUrl: current };

    const body = safeText(res);
    if (body === null) return { finalUrl: current };
    if (BOT_CHECK_RE.test(body)) throw new BotCheckError(current);

    if (isShortlinkHost(current) && hop < MAX_REDIRECT_HOPS) {
      const target = extractTargetFromHtml(body, current);
      if (target !== null) {
        current = target;
        continue;
      }
    }
    return { finalUrl: current, html: body };
  }
  return { finalUrl: current };
}
