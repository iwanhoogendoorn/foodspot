/**
 * Food Spot — Google Places Web Service client.
 *
 * Text Search (Add modal "Search online"), Find Place (URL-import
 * enrichment, biased to a circle around parsed coordinates) and Place
 * Details with a fixed field mask. Address components are mapped to
 * country / city / district. API errors surface verbatim.
 */
import type { Coordinates, FoodSpotPluginApi, PlaceCandidate } from "../types";
import { fetchWithTimeout } from "./net";

const BASE = "https://maps.googleapis.com/maps/api/place";

/** Google (v1) place types -> the cuisine words this plugin writes. */
const CUISINE_BY_TYPE: Record<string, string> = {
  seafood_restaurant: "Seafood", chinese_restaurant: "Chinese", thai_restaurant: "Thai",
  indian_restaurant: "Indian", italian_restaurant: "Italian", japanese_restaurant: "Japanese",
  sushi_restaurant: "Sushi", french_restaurant: "French", mexican_restaurant: "Mexican",
  korean_restaurant: "Korean", vietnamese_restaurant: "Vietnamese", turkish_restaurant: "Turkish",
  greek_restaurant: "Greek", spanish_restaurant: "Spanish", american_restaurant: "American",
  brazilian_restaurant: "Brazilian", lebanese_restaurant: "Lebanese",
  middle_eastern_restaurant: "Middle Eastern", mediterranean_restaurant: "Mediterranean",
  asian_restaurant: "Asian", ramen_restaurant: "Ramen", pizza_restaurant: "Pizza",
  hamburger_restaurant: "Burgers", steak_house: "Steakhouse", barbecue_restaurant: "BBQ",
  vegetarian_restaurant: "Vegetarian", vegan_restaurant: "Vegan",
  breakfast_restaurant: "Breakfast", brunch_restaurant: "Brunch", cafe: "Café",
  coffee_shop: "Coffee", bakery: "Bakery", bar: "Bar", wine_bar: "Wine bar", pub: "Pub",
  fine_dining_restaurant: "Fine dining", buffet_restaurant: "Buffet",
  fast_food_restaurant: "Fast food", dessert_shop: "Desserts", ice_cream_shop: "Ice cream",
  sandwich_shop: "Sandwiches", african_restaurant: "African",
  indonesian_restaurant: "Indonesian", afghani_restaurant: "Afghan", tapas_restaurant: "Tapas",
  persian_restaurant: "Persian", sushi_bar: "Sushi", bar_and_grill: "Grill",
  bagel_shop: "Bagels", donut_shop: "Donuts", juice_shop: "Juice", tea_house: "Tea",
  chocolate_shop: "Chocolate", candy_store: "Sweets", deli: "Deli", diner: "Diner",
};

const DETAILS_FIELDS = [
  "name",
  "formatted_address",
  "address_component",
  "geometry",
  "price_level",
  "rating",
  "user_ratings_total",
  "website",
  "international_phone_number",
  "place_id",
  "photo",
  "opening_hours",
].join(",");

const FIND_PLACE_FIELDS = [
  "place_id",
  "name",
  "formatted_address",
  "geometry",
  "rating",
  "user_ratings_total",
  "price_level",
].join(",");

export class PlacesError extends Error {
  constructor(
    message: string,
    readonly status?: string,
  ) {
    super(message);
    this.name = "PlacesError";
  }
}

export interface PlaceDetails {
  placeId: string;
  name?: string;
  address?: string;
  country?: string;
  city?: string;
  district?: string;
  location?: Coordinates;
  /** 1–4 tier (Google price_level clamped). */
  priceLevel?: number;
  rating?: number;
  ratingCount?: number;
  website?: string;
  phone?: string;
  /** photo_reference of the first place photo, for `fetchPlacePhoto`. */
  photoReference?: string;
  /** Cuisine words derived from the place's Google types (v1 API). */
  cuisines?: string[];
  /** Opening hours as readable per-day lines (see ui/components/hours.ts). */
  hours?: string[];
}

interface RawAddressComponent {
  long_name?: string;
  short_name?: string;
  types?: string[];
}

interface RawPlace {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  vicinity?: string;
  geometry?: { location?: { lat?: number; lng?: number } };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  address_components?: RawAddressComponent[];
  website?: string;
  international_phone_number?: string;
  photos?: { photo_reference?: string }[];
  opening_hours?: { periods?: RawPeriod[] };
}

interface RawPeriod {
  /** day: 0 = Sunday … 6 = Saturday; time: "HHMM" local. */
  open?: { day?: number; time?: string };
  close?: { day?: number; time?: string };
}

interface PlacesResponse {
  status?: string;
  error_message?: string;
  results?: RawPlace[];
  candidates?: RawPlace[];
  result?: RawPlace;
  next_page_token?: string;
}

/**
 * A text-search candidate plus the first photo reference. PlaceCandidate is a
 * frozen contract in types.ts, so the photo travels as an intersection type
 * that only the paged search (Discover tab) returns.
 */
export type PhotoCandidate = PlaceCandidate & { photoRef?: string };

export interface PagedCandidates {
  candidates: PhotoCandidate[];
  /** Present when Google has another page; valid only after NEXT_PAGE_DELAY_MS. */
  nextPageToken?: string;
}

/**
 * Google rejects a next_page_token with INVALID_REQUEST until it has been
 * activated server-side — roughly two seconds after the page that issued it.
 */
export const NEXT_PAGE_DELAY_MS = 2000;

function componentValue(
  comps: RawAddressComponent[],
  ...types: string[]
): string | undefined {
  for (const wanted of types) {
    for (const comp of comps) {
      if (comp.types?.includes(wanted) === true) {
        const v = comp.long_name ?? comp.short_name;
        if (v !== undefined && v.trim() !== "") return v.trim();
      }
    }
  }
  return undefined;
}

function mapLocation(raw: RawPlace): Coordinates | undefined {
  const loc = raw.geometry?.location;
  if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
    return { lat: loc.lat, lng: loc.lng };
  }
  return undefined;
}

function mapPriceLevel(level: number | undefined): number | undefined {
  if (level === undefined || level < 1) return undefined;
  return Math.min(level, 4);
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** Monday-first output order — how the lines read in the note. */
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Google "HHMM" -> "HH:MM"; anything else is unusable. */
function mapClockTime(time: string | undefined): string | undefined {
  if (typeof time !== "string" || !/^\d{4}$/.test(time)) return undefined;
  return `${time.slice(0, 2)}:${time.slice(2)}`;
}

/**
 * Map `opening_hours.periods` into the stored line format (one line per day,
 * "Mon 17:00-22:00" / "Sat 12:00-14:30,17:00-23:00" / "Tue closed").
 * Ranges closing after midnight keep their raw times — the parser reads a
 * close earlier than the open as "runs into the next day".
 * A lone period without a close is Google's "always open" marker.
 */
function mapOpeningHours(raw: RawPlace): string[] | undefined {
  const periods = raw.opening_hours?.periods;
  if (periods === undefined || periods.length === 0) return undefined;
  if (periods.length === 1 && periods[0].close === undefined) {
    return DAY_ORDER.map((d) => `${DAY_LABELS[d]} 00:00-23:59`);
  }

  const byDay = new Map<number, string[]>();
  for (const period of periods) {
    const day = period.open?.day;
    if (typeof day !== "number" || day < 0 || day > 6) continue;
    const open = mapClockTime(period.open?.time);
    const close = mapClockTime(period.close?.time);
    // A period we can't express as a range would silently become "closed" —
    // drop the whole mapping instead of publishing a wrong day line.
    if (open === undefined || close === undefined) return undefined;
    const ranges = byDay.get(day) ?? [];
    ranges.push(`${open}-${close}`);
    byDay.set(day, ranges);
  }
  if (byDay.size === 0) return undefined;

  return DAY_ORDER.map((day) => {
    const ranges = byDay.get(day);
    return ranges === undefined || ranges.length === 0
      ? `${DAY_LABELS[day]} closed`
      : `${DAY_LABELS[day]} ${ranges.sort().join(",")}`;
  });
}

function toCandidate(raw: RawPlace): PlaceCandidate | null {
  if (raw.place_id === undefined || raw.name === undefined) return null;
  const candidate: PlaceCandidate = {
    placeId: raw.place_id,
    name: raw.name,
    address: raw.formatted_address ?? raw.vicinity ?? "",
  };
  if (typeof raw.rating === "number") candidate.rating = raw.rating;
  if (typeof raw.user_ratings_total === "number") candidate.ratingCount = raw.user_ratings_total;
  const price = mapPriceLevel(raw.price_level);
  if (price !== undefined) candidate.priceLevel = price;
  const location = mapLocation(raw);
  if (location) candidate.location = location;
  return candidate;
}

function toPhotoCandidate(raw: RawPlace): PhotoCandidate | null {
  const base = toCandidate(raw);
  if (base === null) return null;
  const ref = raw.photos?.[0]?.photo_reference;
  if (typeof ref !== "string" || ref === "") return base;
  return { ...base, photoRef: ref };
}

function toPaged(data: PlacesResponse): PagedCandidates {
  const out: PagedCandidates = {
    candidates: (data.results ?? [])
      .map(toPhotoCandidate)
      .filter((c): c is PhotoCandidate => c !== null),
  };
  const token = data.next_page_token;
  if (typeof token === "string" && token !== "") out.nextPageToken = token;
  return out;
}

export class PlacesClient {
  constructor(private readonly plugin: FoodSpotPluginApi) {}

  hasKey(): boolean {
    const key = this.plugin.settings.apiKeys.googlePlaces;
    return key !== undefined && key.trim() !== "";
  }

  private key(): string {
    const key = this.plugin.settings.apiKeys.googlePlaces?.trim();
    if (key === undefined || key === "") {
      throw new PlacesError(
        "No Google Places API key configured. Add one under Settings → Food Spot → API.",
      );
    }
    return key;
  }

  private async call(path: string, params: Record<string, string>): Promise<PlacesResponse> {
    const qs = new URLSearchParams({ ...params, key: this.key() });
    const url = `${BASE}/${path}/json?${qs.toString()}`;
    const res = await fetchWithTimeout(url, {
      throw: false,
      skipBotCheck: true,
      headers: { accept: "application/json" },
    });
    let data: PlacesResponse;
    try {
      data = res.json as PlacesResponse;
      if (typeof data !== "object" || data === null) throw new Error("not an object");
    } catch {
      throw new PlacesError(`Google Places returned an unreadable response (HTTP ${res.status}).`);
    }
    const status = data.status ?? "";
    if (status === "OK" || status === "ZERO_RESULTS") return data;
    // REQUEST_DENIED / OVER_QUERY_LIMIT / INVALID_REQUEST etc. — surface verbatim.
    const detail = data.error_message !== undefined ? ` — ${data.error_message}` : "";
    throw new PlacesError(`Google Places error: ${status}${detail}`, status);
  }

  /** Text Search — Add modal "Search online". */
  async textSearch(query: string, near?: Coordinates): Promise<PlaceCandidate[]> {
    const params: Record<string, string> = { query };
    if (near) {
      params.location = `${near.lat},${near.lng}`;
      params.radius = "2000";
    }
    const data = await this.call("textsearch", params);
    return (data.results ?? [])
      .map(toCandidate)
      .filter((c): c is PlaceCandidate => c !== null);
  }

  /**
   * Text Search keeping Google's pagination cursor — Discover tab. Photo
   * references ride along so tiles can pull a thumbnail on demand.
   */
  async textSearchPaged(query: string): Promise<PagedCandidates> {
    return toPaged(await this.call("textsearch", { query }));
  }

  /**
   * Fetch the next page of a `textSearchPaged` run. The caller MUST wait
   * NEXT_PAGE_DELAY_MS after receiving the token — an early call comes back
   * INVALID_REQUEST, which surfaces verbatim like any other Places error.
   */
  async textSearchNextPage(token: string): Promise<PagedCandidates> {
    return toPaged(await this.call("textsearch", { pagetoken: token }));
  }

  /** Find Place from text, optionally biased to a circle around coordinates. */
  async findPlace(
    input: string,
    near?: Coordinates,
    radiusMeters = 200,
  ): Promise<PlaceCandidate[]> {
    const params: Record<string, string> = {
      input,
      inputtype: "textquery",
      fields: FIND_PLACE_FIELDS,
    };
    if (near) params.locationbias = `circle:${radiusMeters}@${near.lat},${near.lng}`;
    const data = await this.call("findplacefromtext", params);
    return (data.candidates ?? [])
      .map(toCandidate)
      .filter((c): c is PlaceCandidate => c !== null);
  }

  /** Place Details with the fixed field mask; maps address components. */
  /**
   * Cuisines from the Places API (New): the legacy details endpoint only
   * reports generic types ("restaurant", "food"), while v1 exposes real ones
   * ("seafood_restaurant"). Best-effort — never throws, empty on failure.
   */
  async cuisinesFor(placeId: string): Promise<string[]> {
    if (!this.hasKey()) return [];
    const key = this.key();
    try {
      const res = await fetchWithTimeout(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?fields=types,primaryTypeDisplayName`,
        { headers: { "X-Goog-Api-Key": key }, throw: false },
      );
      if (res.status >= 400) return [];
      const body = JSON.parse(res.text) as {
        types?: string[];
        primaryTypeDisplayName?: { text?: string };
      };
      const out: string[] = [];
      for (const t of body.types ?? []) {
        const name = CUISINE_BY_TYPE[t];
        if (name !== undefined && !out.includes(name)) out.push(name);
      }
      if (out.length === 0) {
        const primary = (body.primaryTypeDisplayName?.text ?? "")
          .replace(/\s*Restaurant$/i, "")
          .trim();
        if (primary !== "" && primary.toLowerCase() !== "restaurant") out.push(primary);
      }
      return out.slice(0, 3);
    } catch {
      return [];
    }
  }

  async details(placeId: string): Promise<PlaceDetails> {
    const data = await this.call("details", {
      place_id: placeId,
      fields: DETAILS_FIELDS,
    });
    const raw = data.result;
    if (raw === undefined) {
      throw new PlacesError(`Google Places returned no details for place ${placeId}.`);
    }
    const comps = raw.address_components ?? [];
    const details: PlaceDetails = {
      placeId: raw.place_id ?? placeId,
      name: raw.name,
      address: raw.formatted_address,
      country: componentValue(comps, "country"),
      city: componentValue(comps, "locality", "postal_town"),
      district: componentValue(comps, "sublocality_level_1", "sublocality", "neighborhood"),
      location: mapLocation(raw),
      priceLevel: mapPriceLevel(raw.price_level),
      website: raw.website,
      phone: raw.international_phone_number,
    };
    if (typeof raw.rating === "number") details.rating = raw.rating;
    if (typeof raw.user_ratings_total === "number") details.ratingCount = raw.user_ratings_total;
    const photoRef = raw.photos?.[0]?.photo_reference;
    if (typeof photoRef === "string" && photoRef !== "") details.photoReference = photoRef;
    const hours = mapOpeningHours(raw);
    if (hours !== undefined) details.hours = hours;
    return details;
  }

  /**
   * Download a place photo via the Place Photo endpoint. requestUrl follows
   * the redirect to the image internally; non-2xx statuses surface as errors.
   * The body is validated (non-empty, image/* content type) so an HTML error
   * page or empty response never lands in the vault as a corrupt "photo";
   * the file extension is derived from the content type.
   */
  async fetchPlacePhoto(
    photoReference: string,
    maxWidth = 640,
  ): Promise<{ data: ArrayBuffer; ext: string }> {
    const qs = new URLSearchParams({
      maxwidth: String(maxWidth),
      photo_reference: photoReference,
      key: this.key(),
    });
    const url = `${BASE}/photo?${qs.toString()}`;
    const res = await fetchWithTimeout(url, {
      throw: false,
      skipBotCheck: true,
      headers: { accept: "image/*" },
    });
    if (res.status >= 400) {
      throw new PlacesError(`Google Place Photo request failed (HTTP ${res.status}).`);
    }
    const headers = res.headers ?? {};
    let contentType = "";
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === "content-type") {
        contentType = (headers[key] ?? "").split(";")[0].trim().toLowerCase();
        break;
      }
    }
    if (!contentType.startsWith("image/")) {
      throw new PlacesError(
        `Google Place Photo returned ${contentType === "" ? "no content type" : contentType} instead of an image.`,
      );
    }
    const data = res.arrayBuffer;
    if (!data || data.byteLength === 0) {
      throw new PlacesError("Google Place Photo returned an empty body.");
    }
    const EXT_BY_TYPE: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/avif": "avif",
    };
    return { data, ext: EXT_BY_TYPE[contentType] ?? "jpg" };
  }
}
