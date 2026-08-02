/**
 * Food Spot — pure HTML metadata extraction (no Obsidian imports).
 *
 * `extractJsonLd` parses every `<script type="application/ld+json">` block
 * (tolerant of arrays and @graph), finds the best Restaurant /
 * FoodEstablishment / LocalBusiness node and maps it to draft-friendly
 * fields. `extractOpenGraph` pulls og: meta tags with a <title> fallback.
 */

export interface JsonLdAddress {
  street?: string;
  city?: string;
  district?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  /** Best-effort single-line address. */
  full?: string;
}

export interface JsonLdRestaurant {
  name?: string;
  address?: JsonLdAddress;
  lat?: number;
  lng?: number;
  cuisines?: string[];
  /** Price tier 1–4 derived from priceRange currency-symbol count. */
  price?: number;
  /** aggregateRating value normalized to a 5-scale. */
  rating?: number;
  /** aggregateRating value as published, NOT normalized (TheFork uses a 10-scale). */
  ratingRaw?: number;
  /** bestRating as published, when present. */
  ratingBest?: number;
  ratingCount?: number;
  image?: string;
  phone?: string;
  url?: string;
}

export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

type LdNode = Record<string, unknown>;

const FOOD_TYPES = new Set([
  "restaurant",
  "foodestablishment",
  "cafeorcoffeeshop",
  "bakery",
  "barorpub",
  "brewery",
  "fastfoodrestaurant",
  "icecreamshop",
  "winery",
  "distillery",
]);
const BUSINESS_TYPES = new Set(["localbusiness"]);

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function isObj(v: unknown): v is LdNode {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return undefined;
}

function cleanStr(v: unknown): string | undefined {
  const s = asString(v);
  if (s === undefined) return undefined;
  const out = decodeEntities(s).replace(/\s+/g, " ").trim();
  return out === "" ? undefined : out;
}

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v.replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCharCode(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function tolerantParse(raw: string): unknown {
  const attempts = [
    raw,
    raw
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/^\s*\/\/<!\[CDATA\[/, "")
      .replace(/\/\/\]\]>\s*$/, "")
      .replace(/;\s*$/, "")
      .trim(),
  ];
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch {
      /* try next */
    }
  }
  return undefined;
}

function collectNodes(value: unknown, out: LdNode[], depth = 0): void {
  if (depth > 4 || value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (const item of value) collectNodes(item, out, depth + 1);
    return;
  }
  if (!isObj(value)) return;
  out.push(value);
  collectNodes(value["@graph"], out, depth + 1);
  collectNodes(value["mainEntity"], out, depth + 1);
}

function typeScore(node: LdNode): number {
  const t = node["@type"];
  const types = (Array.isArray(t) ? t : [t])
    .map((x) => (typeof x === "string" ? x.toLowerCase().trim() : ""))
    .filter((x) => x !== "");
  if (types.some((x) => FOOD_TYPES.has(x))) return 2;
  if (types.some((x) => BUSINESS_TYPES.has(x))) return 1;
  return 0;
}

function pickFoodNode(nodes: LdNode[]): LdNode | null {
  let best: LdNode | null = null;
  let bestScore = 0;
  for (const node of nodes) {
    const score = typeScore(node);
    if (score > bestScore) {
      best = node;
      bestScore = score;
      if (score === 2) break;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Field mapping
// ---------------------------------------------------------------------------

/** "$$" / "€€€" / "$$ - $$$" → 1..4 (count of the first currency-symbol run). */
export function parsePriceRange(v: string): number | undefined {
  const runs = v.match(/[$€£¥]+/g);
  if (!runs || runs.length === 0) return undefined;
  const first = runs[0];
  return Math.min(Math.max(first.length, 1), 4);
}

function mapImage(v: unknown): string | undefined {
  if (typeof v === "string") return cleanStr(v);
  if (Array.isArray(v)) {
    for (const item of v) {
      const found = mapImage(item);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (isObj(v)) return cleanStr(v["url"] ?? v["contentUrl"]);
  return undefined;
}

function mapCuisines(v: unknown): string[] | undefined {
  const raw: string[] = [];
  const push = (s: unknown): void => {
    const c = cleanStr(s);
    if (c !== undefined) {
      for (const part of c.split(/[,·]/)) {
        const p = part.trim();
        if (p !== "") raw.push(p);
      }
    }
  };
  if (Array.isArray(v)) for (const item of v) push(item);
  else push(v);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of raw) {
    const key = c.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(c);
    }
  }
  return out.length > 0 ? out.slice(0, 8) : undefined;
}

function mapAddress(addr: unknown): JsonLdAddress | undefined {
  if (typeof addr === "string") {
    const full = cleanStr(addr);
    return full !== undefined ? { full } : undefined;
  }
  if (!isObj(addr)) return undefined;
  const a: JsonLdAddress = {};
  a.street = cleanStr(addr["streetAddress"]);
  a.city = cleanStr(addr["addressLocality"]);
  a.region = cleanStr(addr["addressRegion"]);
  a.postalCode = cleanStr(addr["postalCode"]);
  const c = addr["addressCountry"];
  a.country = isObj(c) ? cleanStr(c["name"]) : cleanStr(c);
  const parts = [a.street, a.city].filter((x): x is string => x !== undefined);
  if (parts.length > 0) a.full = parts.join(", ");
  return Object.values(a).some((x) => x !== undefined) ? a : undefined;
}

interface MappedRating {
  rating?: number;
  ratingRaw?: number;
  ratingBest?: number;
  ratingCount?: number;
}

function mapRating(node: LdNode): MappedRating {
  const agg = node["aggregateRating"];
  if (!isObj(agg)) return {};
  const raw = num(agg["ratingValue"]);
  let rating = raw;
  const best = num(agg["bestRating"]);
  if (rating !== undefined) {
    if (best === 10) rating = rating / 2;
    else if (best === 100) rating = rating / 20;
    rating = Math.round(rating * 10) / 10;
    if (rating < 0 || rating > 5) rating = undefined;
  }
  const ratingCount = num(agg["ratingCount"]) ?? num(agg["reviewCount"]);
  const out: MappedRating = {};
  if (rating !== undefined) out.rating = rating;
  if (raw !== undefined && raw >= 0) out.ratingRaw = raw;
  if (best !== undefined) out.ratingBest = best;
  if (ratingCount !== undefined && ratingCount >= 0) out.ratingCount = Math.round(ratingCount);
  return out;
}

/**
 * TheFork publishes on a 10-scale, but some locale pages emit a 5-scale
 * aggregateRating (bestRating: 5). Normalize to the 10-scale the UI displays
 * ("x/10"); genuine 10-scale values pass through unchanged.
 */
export function theforkRating10(ld: JsonLdRestaurant): number | undefined {
  if (ld.ratingRaw === undefined) return undefined;
  const best = ld.ratingBest;
  if (best === undefined || best === 10) return ld.ratingRaw;
  if (best <= 0) return undefined;
  return Math.round(((ld.ratingRaw * 10) / best) * 10) / 10;
}

function mapNode(node: LdNode): JsonLdRestaurant {
  const out: JsonLdRestaurant = {};
  out.name = cleanStr(node["name"]);
  out.address = mapAddress(node["address"]);

  const geo = node["geo"];
  if (isObj(geo)) {
    const lat = num(geo["latitude"]);
    const lng = num(geo["longitude"]);
    if (
      lat !== undefined &&
      lng !== undefined &&
      !(lat === 0 && lng === 0) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180
    ) {
      out.lat = lat;
      out.lng = lng;
    }
  }

  out.cuisines = mapCuisines(node["servesCuisine"]);

  const priceRange = asString(node["priceRange"]);
  if (priceRange !== undefined) out.price = parsePriceRange(priceRange);

  const { rating, ratingRaw, ratingBest, ratingCount } = mapRating(node);
  out.rating = rating;
  out.ratingRaw = ratingRaw;
  out.ratingBest = ratingBest;
  out.ratingCount = ratingCount;

  out.image = mapImage(node["image"] ?? node["photo"]);
  out.phone = cleanStr(node["telephone"]);
  out.url = cleanStr(node["url"]);
  return out;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function extractJsonLd(html: string): JsonLdRestaurant | null {
  const nodes: LdNode[] = [];
  const re = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const parsed = tolerantParse(m[1]);
    if (parsed !== undefined) collectNodes(parsed, nodes);
  }
  const node = pickFoodNode(nodes);
  return node !== null ? mapNode(node) : null;
}

function metaContent(html: string, prop: string): string | undefined {
  const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tagRe = new RegExp(
    `<meta\\s[^>]*(?:property|name)\\s*=\\s*["']${escaped}["'][^>]*>`,
    "i",
  );
  const tag = html.match(tagRe);
  if (!tag) return undefined;
  const content = tag[0].match(/content\s*=\s*["']([^"']*)["']/i);
  if (!content) return undefined;
  const value = decodeEntities(content[1]).replace(/\s+/g, " ").trim();
  return value === "" ? undefined : value;
}

export function extractOpenGraph(html: string): OpenGraphData {
  const out: OpenGraphData = {};
  out.title = metaContent(html, "og:title");
  out.description = metaContent(html, "og:description") ?? metaContent(html, "description");
  out.image = metaContent(html, "og:image");
  out.url = metaContent(html, "og:url");
  if (out.title === undefined) {
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (title) {
      const t = decodeEntities(title[1]).replace(/\s+/g, " ").trim();
      if (t !== "") out.title = t;
    }
  }
  return out;
}
