/**
 * Automatic rating-source discovery — 2026 reality edition.
 *
 * Every keyless web-search route to TripAdvisor/Yelp/TheFork/OpenTable is
 * bot-walled server-side (DuckDuckGo html: anomaly page; Bing: consent shell;
 * TripAdvisor typeahead: DataDome; all verified empirically). Guessing URLs
 * would attach wrong restaurants, so those sources are reported as
 * not-auto-discoverable instead of faked.
 *
 * What DOES work: Eet.nu's public JSON API (api.eet.nu/venues?query=…) —
 * name, address, venue URL, 0-100 rating and often a facebook_url. For a
 * Netherlands-centric library that is the highest-value source anyway.
 * Candidates are verified by name AND city before anything is attached.
 */
import type { ExternalRatings, FoodSpot } from "../types";
import { fetchWithTimeout } from "./net";
import { normalizeName } from "./pipeline";

/** PURE: lenient same-restaurant check between spot name and page name. */
export function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;
  const ta = new Set(na.split(" ").filter((t) => t.length > 1));
  const tb = new Set(nb.split(" ").filter((t) => t.length > 1));
  if (ta.size === 0 || tb.size === 0) return false;
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap++;
  return overlap / Math.min(ta.size, tb.size) >= 0.6;
}

/** PURE: eet.nu venue-URL city slug, e.g. "Den Haag" -> "den-haag". */
export function citySlug(city: string): string {
  return city
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface EetnuVenue {
  name?: string;
  rating?: number | null;
  url?: string;
  facebook_url?: string | null;
  website_url?: string | null;
  address?: { city?: string };
}

/** PURE: pick the eet.nu venue that verifiably matches name + city. */
export function pickEetnuVenue(
  venues: EetnuVenue[],
  spotName: string,
  spotCity: string | undefined
): EetnuVenue | null {
  const matches = venues.filter((v) => v.name !== undefined && namesMatch(spotName, v.name));
  if (matches.length === 0) return null;
  if (spotCity !== undefined && spotCity !== "") {
    const slug = citySlug(spotCity);
    const cityLower = spotCity.toLowerCase();
    const inCity = matches.filter(
      (v) =>
        v.address?.city?.toLowerCase() === cityLower ||
        (v.url !== undefined && new RegExp(`/${slug}/`, "i").test(v.url))
    );
    return inCity[0] ?? null;
  }
  // No city on the spot: only trust an unambiguous single match.
  return matches.length === 1 ? matches[0] : null;
}

export interface DiscoveryResult {
  patch: Partial<ExternalRatings>;
  attached: string[];
  skipped: { label: string; reason: string }[];
}

const WALLED = "auto-discovery blocked by the site — use its + chip to paste the link";

/**
 * Discover + attach what can be verified. Eet.nu via its public API (URL,
 * rating, and Facebook link when the venue lists one); bot-walled sources are
 * reported honestly.
 */
export async function discoverSources(
  spot: FoodSpot,
  onProgress?: (label: string) => void
): Promise<DiscoveryResult> {
  const patch: Partial<ExternalRatings> = {};
  const attached: string[] = [];
  const skipped: { label: string; reason: string }[] = [];

  const needsEetnu =
    spot.external.eetnuUrl === undefined || spot.external.eetnuRating === undefined;
  const needsFacebookLink = spot.external.facebookUrl === undefined;

  if (needsEetnu || needsFacebookLink) {
    onProgress?.("Eet.nu");
    try {
      const q = encodeURIComponent(`${spot.name} ${spot.city ?? ""}`.trim());
      const res = await fetchWithTimeout(`https://api.eet.nu/venues?query=${q}`);
      const body = JSON.parse(res.text) as { results?: EetnuVenue[] };
      const venue = pickEetnuVenue(body.results ?? [], spot.name, spot.city);
      if (venue === null) {
        skipped.push({ label: "Eet.nu", reason: "no verified match" });
      } else {
        if (needsEetnu && venue.url !== undefined) {
          patch.eetnuUrl = venue.url;
          if (typeof venue.rating === "number" && venue.rating > 0) {
            // API scale is 0-100; eet.nu displays x.y out of 10.
            patch.eetnuRating = Math.round(venue.rating) / 10;
            attached.push("Eet.nu");
          } else {
            attached.push("Eet.nu (link only)");
          }
        }
        if (
          needsFacebookLink &&
          typeof venue.facebook_url === "string" &&
          venue.facebook_url !== ""
        ) {
          patch.facebookUrl = venue.facebook_url;
          attached.push("Facebook (link only)");
        }
      }
    } catch (e) {
      skipped.push({
        label: "Eet.nu",
        reason: e instanceof Error ? e.message : String(e),
      });
    }
  }

  for (const label of ["TripAdvisor", "Yelp", "TheFork", "OpenTable"]) {
    const rated: Record<string, number | undefined> = {
      TripAdvisor: spot.external.tripadvisorRating,
      Yelp: spot.external.yelpRating,
      TheFork: spot.external.theforkRating,
      OpenTable: spot.external.opentableRating,
    };
    if (rated[label] === undefined) skipped.push({ label, reason: WALLED });
  }

  return { patch, attached, skipped };
}
