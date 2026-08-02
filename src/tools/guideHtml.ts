/**
 * Printable city guide: a self-contained HTML document with one card per
 * restaurant (cover photo, rating, price, address, phone, website), styled
 * for A4 so the browser/Electron print dialog turns it into a clean PDF.
 *
 * Images arrive as data URIs so the document survives being saved, mailed or
 * printed with no vault access.
 */
import type { FoodSpot } from "../types";

export interface GuideOptions {
  includeWantToTry: boolean;
  currency: string;
  /** spot.photo (vault path) -> data URI. Missing entries render a letter tile. */
  images: Map<string, string>;
  generatedOn: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Filled/half/empty stars for a 0–5 rating. */
function stars(rating: number | undefined): string {
  if (rating === undefined) return "";
  const full = Math.floor(rating);
  const half = rating - full >= 0.25 && rating - full < 0.75;
  const extra = rating - full >= 0.75 ? 1 : 0;
  const filled = "★".repeat(Math.min(5, full + extra));
  const halfChar = half ? "⯨" : "";
  const empty = "☆".repeat(Math.max(0, 5 - full - extra - (half ? 1 : 0)));
  return `${filled}${halfChar}${empty}`;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function card(spot: FoodSpot, o: GuideOptions): string {
  const img = spot.photo ? o.images.get(spot.photo) : undefined;
  const cover = img
    ? `<img class="cover" src="${img}" alt="">`
    : `<div class="cover cover-placeholder">${esc((spot.name.trim()[0] ?? "?").toUpperCase())}</div>`;

  const rows: string[] = [];
  const rating = spot.rating !== undefined
    ? `<span class="stars">${stars(spot.rating)}</span><span class="ratingnum">${spot.rating.toFixed(1)}</span>`
    : "";
  const google = spot.external.googleRating !== undefined
    ? `<span class="google">G ${spot.external.googleRating.toFixed(1)}</span>`
    : "";
  if (rating || google) rows.push(`<div class="ratings">${rating}${google}</div>`);
  if (spot.price !== undefined && spot.price > 0) {
    rows.push(`<div class="price">${esc(o.currency.repeat(Math.min(4, spot.price)))}</div>`);
  }
  if (spot.address) rows.push(`<div class="line addr">${esc(spot.address)}</div>`);
  // A formatted address usually already ends in "City, Country" — only add the
  // parts it doesn't mention instead of repeating them on a second line.
  const addrLower = (spot.address ?? "").toLowerCase();
  const place = [spot.city, spot.country]
    .filter((part): part is string => !!part && !addrLower.includes(part.toLowerCase()))
    .join(", ");
  if (place) rows.push(`<div class="line place">${esc(place)}</div>`);
  if (spot.phone) rows.push(`<div class="line phone">${esc(spot.phone)}</div>`);
  if (spot.url) {
    rows.push(
      `<div class="line web"><a href="${esc(spot.url)}">${esc(hostOf(spot.url))}</a></div>`
    );
  }
  const visited = spot.status === "visited" ? ' <span class="badge">visited</span>' : "";

  return `<article class="card">
  ${cover}
  <div class="body">
    <h2>${esc(spot.name)}${visited}</h2>
    ${rows.join("\n    ")}
  </div>
</article>`;
}

const CSS = `
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 12mm 11mm 14mm;
    width: 210mm;
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1d1f24; background: #fff;
  }
  header { border-bottom: 2px solid #1d1f24; padding-bottom: 10px; margin-bottom: 18px; }
  h1 { margin: 0; font-size: 27px; letter-spacing: -0.4px; }
  .sub { margin-top: 5px; color: #6b7080; font-size: 12.5px; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .card {
    display: flex; gap: 10px; align-items: stretch; min-width: 0;
    border: 1px solid #dfe2e8; border-radius: 10px; padding: 10px;
    break-inside: avoid; page-break-inside: avoid;
  }
  .cover {
    width: 92px; height: 92px; flex: none;
    object-fit: cover; border-radius: 7px; background: #eef0f4;
  }
  .cover-placeholder {
    display: flex; align-items: center; justify-content: center;
    font-size: 34px; font-weight: 700; color: #b6bcc8;
  }
  .body { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  h2 { margin: 0 0 2px; font-size: 15px; line-height: 1.2; }
  .badge {
    font-size: 9px; text-transform: uppercase; letter-spacing: .5px;
    vertical-align: middle; padding: 1px 5px; border-radius: 8px;
    background: #e8f3ec; color: #2f7d4f; font-weight: 600;
  }
  .ratings { display: flex; align-items: baseline; gap: 7px; margin: 1px 0 2px; }
  .stars { color: #e2a33c; font-size: 13px; letter-spacing: 1px; }
  .ratingnum { font-weight: 700; font-size: 12px; }
  .google { color: #6b7080; font-size: 11.5px; }
  .price { font-weight: 700; font-size: 12px; color: #2f7d4f; }
  .line { font-size: 11.5px; color: #4a4f5a; line-height: 1.35; overflow-wrap: anywhere; }
  .line.phone, .line.web { color: #2b5fa8; }
  a { color: inherit; text-decoration: none; }
  footer { margin-top: 20px; color: #8a90a0; font-size: 10.5px; text-align: center; }
  /* printToPDF renders with zero hardware margins; the page padding above is
     the margin, so the layout width matches A4 exactly and nothing overflows. */
  @page { size: A4; margin: 0; }
  @media print {
    .card { border-color: #c9ccd6; }
  }
`;

/** Complete standalone HTML document for one city. */
export function buildGuideHtml(spots: FoodSpot[], city: string, o: GuideOptions): string {
  const inCity = spots
    .filter((s) => (s.city ?? "").trim().toLowerCase() === city.trim().toLowerCase())
    .filter((s) => o.includeWantToTry || s.status === "visited")
    .sort(
      (a, b) =>
        Number(b.status === "visited") - Number(a.status === "visited") ||
        (b.rating ?? 0) - (a.rating ?? 0) ||
        (b.external.googleRating ?? 0) - (a.external.googleRating ?? 0) ||
        a.name.localeCompare(b.name)
    );
  const visited = inCity.filter((s) => s.status === "visited").length;
  const summary = `${inCity.length} ${inCity.length === 1 ? "place" : "places"}${
    visited > 0 ? ` · ${visited} visited` : ""
  }`;
  const body =
    inCity.length > 0
      ? `<div class="grid">\n${inCity.map((s) => card(s, o)).join("\n")}\n</div>`
      : `<p class="sub">No restaurants for this city yet.</p>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Eating in ${esc(city)}</title>
<style>${CSS}</style>
</head><body>
<header>
  <h1>Eating in ${esc(city)}</h1>
  <div class="sub">${esc(summary)}</div>
</header>
${body}
<footer>Food Spot · ${esc(o.generatedOn)}</footer>
</body></html>`;
}

/** Spots of a city that carry a vault photo — the images the guide needs. */
export function guidePhotoPaths(spots: FoodSpot[], city: string, includeWantToTry: boolean): string[] {
  return spots
    .filter((s) => (s.city ?? "").trim().toLowerCase() === city.trim().toLowerCase())
    .filter((s) => includeWantToTry || s.status === "visited")
    .map((s) => s.photo)
    .filter((p): p is string => !!p && !/^https?:\/\//i.test(p));
}
