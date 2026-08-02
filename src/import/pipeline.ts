/**
 * Food Spot — import pipeline (ImportPipelineApi).
 *
 * Orchestrates: URL resolution → importer dispatch → Google Places
 * enrichment; Places text search + details for the Add modal; external
 * rating refresh (Google API + TripAdvisor/Yelp/TheFork page JSON-LD);
 * single-spot + bulk enrichment (photo download, menu discovery);
 * distance-aware duplicate detection.
 */
import type {
  Coordinates,
  EnrichOptions,
  ExternalRatings,
  FoodSpot,
  FoodSpotPluginApi,
  ImportPipelineApi,
  ImportedSpotDraft,
  PlaceCandidate,
  SpotInput,
} from "../types";
import { BotCheckError, fetchWithTimeout, resolveRedirects } from "./net";
import { extractJsonLd, theforkRating10, type JsonLdRestaurant } from "./jsonld";
import { mergeExternal, pickImporter, setDraftField } from "./importers";
import { findMenuUrl } from "./menuDiscovery";
import { discoverSources as discoverRatingSources } from "./sourceDiscovery";
import { PlacesClient, type PlaceDetails } from "./places";
import { ensureFolder } from "../store/noteWriter";

const ENRICH_BIAS_RADIUS_METERS = 200;
/** Min pause between spots in a bulk enrichment run. */
const BULK_THROTTLE_MS = 400;
const PHOTO_MAX_WIDTH = 640;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

interface SourceFailure {
  label: string;
  e: unknown;
}

/** Human explanation per failed source — bot walls get the honest version. */
function describeSourceFailure(f: SourceFailure): string {
  const msg = errMsg(f.e);
  if (f.e instanceof BotCheckError || /\b403\b/.test(msg)) {
    const key = f.label.toLowerCase().replace(/[^a-z]/g, "");
    return `${f.label} blocks automated fetches — the rating can\u2019t be pulled. You can type it into the note yourself (e.g. "${key}_rating: 4.5").`;
  }
  return `${f.label}: ${msg}`;
}

function isTripadvisorUrl(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().includes("tripadvisor.");
  } catch {
    return false;
  }
}

function isBlank(v: string | undefined): boolean {
  return v === undefined || v.trim() === "";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Strip characters Obsidian rejects in file names; collapse whitespace. */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|#^[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** NFKD-normalize, strip diacritics and punctuation, collapse whitespace. */
export function normalizeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Great-circle distance between two coordinates, in meters. */
export function haversineMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export class ImportPipeline implements ImportPipelineApi {
  private readonly places: PlacesClient;

  constructor(private readonly plugin: FoodSpotPluginApi) {
    this.places = new PlacesClient(plugin);
  }

  hasGoogleKey(): boolean {
    return this.places.hasKey();
  }

  discoverSources(
    spot: FoodSpot,
    onProgress?: (sourceLabel: string) => void,
  ): ReturnType<ImportPipelineApi["discoverSources"]> {
    return discoverRatingSources(spot, onProgress);
  }

  // -------------------------------------------------------------------------
  // URL import
  // -------------------------------------------------------------------------

  async importFromUrl(url: string): Promise<ImportedSpotDraft> {
    const trimmed = url.trim();
    // Resolve short links FIRST — v0.1 parsed coords off the unresolved
    // share link, so maps.app.goo.gl imports never enriched.
    const resolved = await resolveRedirects(trimmed);
    const importer = pickImporter(resolved.finalUrl);

    let html: string | null = resolved.html ?? null;
    let botChecked = false;
    if (html === null) {
      try {
        const res = await fetchWithTimeout(resolved.finalUrl, { throw: false });
        html = res.status < 400 && typeof res.text === "string" ? res.text : null;
      } catch (e) {
        if (e instanceof BotCheckError) {
          // Google Maps / TripAdvisor URLs still carry name + coords in the
          // URL itself — degrade gracefully. Generic pages have nothing left.
          if (importer.kind === "generic") throw e;
          botChecked = true;
        }
        html = null;
      }
    }

    const draft = importer.parse(resolved.finalUrl, html);
    if (botChecked) {
      draft.warnings.push(
        "The site showed a bot-check page — parsed what was possible from the URL alone.",
      );
    } else if (html === null) {
      draft.warnings.push("Could not load the page body — parsed from the URL alone.");
    }

    await this.enrich(draft);
    return draft;
  }

  /** Google Places enrichment: Find Place (biased 200m when coords) → Details. */
  private async enrich(draft: ImportedSpotDraft): Promise<void> {
    if (!this.hasGoogleKey()) return;
    const name = draft.fields.name;
    const coords = draft.fields.coordinates;
    if (name === undefined && coords === undefined) return;
    if (name === undefined) {
      draft.warnings.push(
        "Coordinates found but no name — skipped Google Places enrichment.",
      );
      return;
    }
    try {
      const candidates = await this.places.findPlace(name, coords, ENRICH_BIAS_RADIUS_METERS);
      const first = candidates[0];
      if (first === undefined) {
        draft.warnings.push(`Google Places found no match for "${name}".`);
        return;
      }
      const details = await this.places.details(first.placeId);
      this.mergeDetails(draft, details);
    } catch (e) {
      draft.warnings.push(`Google Places enrichment failed: ${errMsg(e)}`);
    }
  }

  /** Fold Place Details into a draft: high confidence, never clobbers existing high fields. */
  private mergeDetails(draft: ImportedSpotDraft, details: PlaceDetails): void {
    setDraftField(draft, "name", details.name, "high");
    setDraftField(draft, "address", details.address, "high");
    setDraftField(draft, "country", details.country, "high");
    setDraftField(draft, "city", details.city, "high");
    setDraftField(draft, "district", details.district, "high");
    setDraftField(draft, "coordinates", details.location, "high");
    setDraftField(draft, "price", details.priceLevel, "high");
    setDraftField(draft, "url", details.website, "high");
    setDraftField(draft, "phone", details.phone, "high");
    // Fresh external ratings always win (v0.1 dropped these on save).
    mergeExternal(draft, {
      googlePlaceId: details.placeId,
      googleRating: details.rating,
      googleRatingCount: details.ratingCount,
      ratingsUpdated: todayIso(),
    });
  }

  // -------------------------------------------------------------------------
  // Places search (Add modal)
  // -------------------------------------------------------------------------

  async searchPlaces(query: string, near?: Coordinates): Promise<PlaceCandidate[]> {
    return this.places.textSearch(query, near);
  }

  async placeDetails(placeId: string): Promise<ImportedSpotDraft> {
    const details = await this.places.details(placeId);
    const sourceUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    const draft: ImportedSpotDraft = {
      fields: { source: "google-maps", sourceUrl },
      confidence: { source: "high", sourceUrl: "high" },
      importerKind: "google-maps",
      sourceUrl,
      warnings: [],
    };
    this.mergeDetails(draft, details);
    return draft;
  }

  // -------------------------------------------------------------------------
  // Rating refresh (Google API + TripAdvisor/Yelp/TheFork page JSON-LD)
  // -------------------------------------------------------------------------

  /** Resolve a spot to Place Details: stored place_id else Find Place ("name city"). */
  private async resolveDetails(spot: FoodSpot): Promise<PlaceDetails | null> {
    let placeId = spot.external.googlePlaceId;
    if (placeId === undefined) {
      const query = [spot.name, spot.city].filter((x) => x !== undefined && x !== "").join(" ");
      const candidates = await this.places.findPlace(
        query,
        spot.coordinates,
        ENRICH_BIAS_RADIUS_METERS,
      );
      placeId = candidates[0]?.placeId;
    }
    if (placeId === undefined) return null;
    return this.places.details(placeId);
  }

  /** Fetch a rating-source page and extract its JSON-LD (BotCheckError propagates). */
  private async fetchPageJsonLd(url: string): Promise<JsonLdRestaurant | null> {
    const res = await fetchWithTimeout(url);
    return typeof res.text === "string" ? extractJsonLd(res.text) : null;
  }

  async refreshRatings(
    spot: FoodSpot,
    onWarning?: (message: string) => void,
  ): Promise<Partial<ExternalRatings> | null> {
    const out: Partial<ExternalRatings> = {};
    // Per-source failures (bot-check, timeout) skip that source; each is
    // surfaced through onWarning so a stonewalled site never fails silently.
    const errors: SourceFailure[] = [];

    if (this.hasGoogleKey()) {
      try {
        const details = await this.resolveDetails(spot);
        if (details !== null) {
          out.googlePlaceId = details.placeId;
          if (details.rating !== undefined) out.googleRating = details.rating;
          if (details.ratingCount !== undefined) out.googleRatingCount = details.ratingCount;
        }
      } catch (e) {
        errors.push({ label: "Google", e });
      }
    }

    Object.assign(out, await this.fetchSourceRatings(spot, errors));

    for (const f of errors) onWarning?.(describeSourceFailure(f));
    if (Object.keys(out).length === 0) {
      if (errors.length > 0 && onWarning === undefined) throw errors[0].e;
      return null;
    }
    out.ratingsUpdated = todayIso();
    return out;
  }

  /**
   * Fetch every linked rating-source page (TripAdvisor / Yelp / TheFork) and
   * extract its JSON-LD rating. Per-source failures land in `errors` and skip
   * that source only. Shared by refreshRatings and enrichSpot.
   */
  private async fetchSourceRatings(
    spot: FoodSpot,
    errors: SourceFailure[],
  ): Promise<Partial<ExternalRatings>> {
    const out: Partial<ExternalRatings> = {};

    const sourceUrl = spot.sourceUrl ?? "";
    const tripadvisorUrl =
      spot.external.tripadvisorUrl ?? (isTripadvisorUrl(sourceUrl) ? sourceUrl : undefined);
    if (tripadvisorUrl !== undefined) {
      try {
        const ld = await this.fetchPageJsonLd(tripadvisorUrl);
        if (ld !== null && ld.rating !== undefined) {
          out.tripadvisorRating = ld.rating;
          if (ld.ratingCount !== undefined) out.tripadvisorRatingCount = ld.ratingCount;
          if (spot.external.tripadvisorUrl === undefined) out.tripadvisorUrl = tripadvisorUrl;
        }
      } catch (e) {
        errors.push({ label: "TripAdvisor", e });
      }
    }

    if (spot.external.yelpUrl !== undefined) {
      try {
        const ld = await this.fetchPageJsonLd(spot.external.yelpUrl);
        if (ld !== null && ld.rating !== undefined) {
          out.yelpRating = ld.rating;
          if (ld.ratingCount !== undefined) out.yelpRatingCount = ld.ratingCount;
        }
      } catch (e) {
        errors.push({ label: "Yelp", e });
      }
    }

    if (spot.external.theforkUrl !== undefined) {
      try {
        const ld = await this.fetchPageJsonLd(spot.external.theforkUrl);
        // TheFork rates on a 10-scale — store the raw 10-scale value (pages
        // publishing a 5-scale bestRating are normalized TO the 10-scale).
        const thefork10 = ld !== null ? theforkRating10(ld) : undefined;
        if (ld !== null && thefork10 !== undefined) {
          out.theforkRating = thefork10;
          if (ld.ratingCount !== undefined) out.theforkRatingCount = ld.ratingCount;
        }
      } catch (e) {
        errors.push({ label: "TheFork", e });
      }
    }

    // JSON-LD sources with plain 5-scale ratings (Facebook is best-effort:
    // public pages sometimes expose aggregateRating, logged-out walls don't).
    if (spot.external.facebookUrl !== undefined) {
      try {
        const ld = await this.fetchPageJsonLd(spot.external.facebookUrl);
        if (ld !== null && ld.rating !== undefined) {
          out.facebookRating = ld.rating;
          if (ld.ratingCount !== undefined) out.facebookRatingCount = ld.ratingCount;
        }
      } catch (e) {
        errors.push({ label: "Facebook", e });
      }
    }

    if (spot.external.opentableUrl !== undefined) {
      try {
        const ld = await this.fetchPageJsonLd(spot.external.opentableUrl);
        if (ld !== null && ld.rating !== undefined) {
          out.opentableRating = ld.rating;
          if (ld.ratingCount !== undefined) out.opentableRatingCount = ld.ratingCount;
        }
      } catch (e) {
        errors.push({ label: "OpenTable", e });
      }
    }

    // Eet.nu (NL) rates on a 10-scale — same treatment as TheFork.
    if (spot.external.eetnuUrl !== undefined) {
      try {
        const ld = await this.fetchPageJsonLd(spot.external.eetnuUrl);
        const eetnu10 = ld !== null ? theforkRating10(ld) : undefined;
        if (ld !== null && eetnu10 !== undefined) {
          out.eetnuRating = eetnu10;
          if (ld.ratingCount !== undefined) out.eetnuRatingCount = ld.ratingCount;
        }
      } catch (e) {
        errors.push({ label: "Eet.nu", e });
      }
    }

    return out;
  }

  // -------------------------------------------------------------------------
  // Enrichment (single spot + bulk)
  // -------------------------------------------------------------------------

  /**
   * Fill-gaps-only single-spot enrichment (see ImportPipelineApi contract).
   * Google fields come from one Details call; the photo is downloaded into
   * settings.mediaFolder; the menu URL is discovered on the spot's website.
   */
  async enrichSpot(spot: FoodSpot, opts: EnrichOptions): Promise<Partial<SpotInput> | null> {
    const overwrite = opts.overwrite === true;
    const out: Partial<SpotInput> = {};
    const ext: Partial<ExternalRatings> = {};

    const wantsGoogle = opts.photo || opts.ratings || opts.coords || opts.address;
    let details: PlaceDetails | null = null;
    if (wantsGoogle && this.hasGoogleKey()) {
      details = await this.resolveDetails(spot);
    }

    if (details !== null) {
      if (spot.external.googlePlaceId !== details.placeId) ext.googlePlaceId = details.placeId;
      if (opts.coords && details.location !== undefined && (overwrite || spot.coordinates === undefined)) {
        out.coordinates = details.location;
      }
      if (opts.address) {
        if (details.address !== undefined && (overwrite || isBlank(spot.address))) {
          out.address = details.address;
        }
        if (details.city !== undefined && (overwrite || isBlank(spot.city))) out.city = details.city;
        if (details.district !== undefined && (overwrite || isBlank(spot.district))) {
          out.district = details.district;
        }
        if (details.country !== undefined && (overwrite || isBlank(spot.country))) {
          out.country = details.country;
        }
      }
      // Price / website / phone ride along fill-gaps-ONLY (spec §2 "also
      // updates"): no options checkbox governs them, so the overwrite toggle
      // — which only widens the fields the user checked — never applies here.
      if (details.priceLevel !== undefined && spot.price === undefined) {
        out.price = details.priceLevel;
      }
      if (details.website !== undefined && isBlank(spot.url)) out.url = details.website;
      if (details.phone !== undefined && isBlank(spot.phone)) out.phone = details.phone;
      if (opts.ratings) {
        if (details.rating !== undefined) ext.googleRating = details.rating;
        if (details.ratingCount !== undefined) ext.googleRatingCount = details.ratingCount;
      }
      if (opts.photo && details.photoReference !== undefined && (overwrite || isBlank(spot.photo))) {
        try {
          out.photo = await this.downloadPhoto(spot.name, details.photoReference);
        } catch {
          // Photo failure never aborts the rest of the enrichment.
        }
      }
    }

    // The ratings checkbox promises "Google + linked rating sources" — also
    // refresh TripAdvisor / Yelp / TheFork from their pages' JSON-LD.
    // Per-source failures (bot-check, timeout) skip that source only.
    if (opts.ratings) {
      Object.assign(ext, await this.fetchSourceRatings(spot, []));
    }

    if (opts.menu && (overwrite || isBlank(spot.menu))) {
      const website = out.url ?? spot.url;
      if (!isBlank(website)) {
        const menu = await this.discoverMenu(website as string);
        if (menu !== null) out.menu = menu;
      }
    }

    // Auto-discover rating-source pages (opt-in — 6 web searches per spot).
    if (opts.discoverSources === true) {
      try {
        const found = await discoverRatingSources(spot);
        Object.assign(ext, found.patch);
      } catch {
        // Discovery is best-effort by contract; Google results still count.
      }
    }

    if (Object.keys(ext).length > 0) {
      const external: ExternalRatings = { ...spot.external, ...ext };
      // Only stamp freshness when a rating VALUE was actually fetched — a
      // bare place_id update must not clear the stale-ratings indicator.
      const fetchedRating =
        ext.googleRating !== undefined ||
        ext.tripadvisorRating !== undefined ||
        ext.yelpRating !== undefined ||
        ext.theforkRating !== undefined ||
        ext.opentableRating !== undefined ||
        ext.eetnuRating !== undefined ||
        ext.facebookRating !== undefined;
      if (fetchedRating) external.ratingsUpdated = todayIso();
      out.external = external;
    }
    return Object.keys(out).length > 0 ? out : null;
  }

  async bulkEnrich(
    spots: FoodSpot[],
    opts: EnrichOptions,
    onProgress: (done: number, total: number, current: string) => void,
    signal: { cancelled: boolean },
  ): Promise<{ updated: number; skipped: number; failed: string[] }> {
    let updated = 0;
    let skipped = 0;
    const failed: string[] = [];
    let done = 0;
    for (const spot of spots) {
      if (signal.cancelled) break;
      onProgress(done, spots.length, spot.name);
      try {
        // Enrich from the CURRENT store record, not the snapshot taken when
        // the run started — a long run must never revert mid-run user edits
        // (external is replaced wholesale on update). Deleted spots skip.
        const fresh = this.plugin.store.getByPath(spot.path);
        if (fresh === undefined) {
          skipped += 1;
        } else {
          const partial = await this.enrichSpot(fresh, opts);
          if (partial !== null) {
            await this.plugin.store.updateSpot(fresh.path, partial);
            updated += 1;
          } else {
            skipped += 1;
          }
        }
      } catch {
        // One failing spot never aborts the run.
        failed.push(spot.name);
      }
      done += 1;
      onProgress(done, spots.length, spot.name);
      if (signal.cancelled) break;
      if (done < spots.length) await sleep(BULK_THROTTLE_MS);
    }
    return { updated, skipped, failed };
  }

  /** Download the place photo into settings.mediaFolder; returns the vault path. */
  private async downloadPhoto(spotName: string, photoReference: string): Promise<string> {
    const { data, ext } = await this.places.fetchPlacePhoto(photoReference, PHOTO_MAX_WIDTH);
    const app = this.plugin.app;
    const folder = this.plugin.settings.mediaFolder.replace(/^\/+|\/+$/g, "");
    await ensureFolder(app, folder);
    const base = sanitizeFileName(spotName) || "spot";
    const prefix = folder ? `${folder}/` : "";
    let candidate = `${prefix}${base}.${ext}`;
    let n = 2;
    while (app.vault.getAbstractFileByPath(candidate)) {
      candidate = `${prefix}${base} ${n}.${ext}`;
      n += 1;
    }
    await app.vault.createBinary(candidate, data);
    return candidate;
  }

  /** Best-effort menu-link discovery on the spot's website; null on any failure. */
  private async discoverMenu(websiteUrl: string): Promise<string | null> {
    try {
      const res = await fetchWithTimeout(websiteUrl, { throw: false });
      if (res.status >= 400 || typeof res.text !== "string") return null;
      return findMenuUrl(res.text, websiteUrl);
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Duplicate detection
  // -------------------------------------------------------------------------

  /**
   * Normalized-name equality AND-ed with distance: when both sides have
   * coordinates the spot must be within the configured radius (same name far
   * apart = a chain, NOT a duplicate — v0.1 got this wrong). When either side
   * lacks coordinates, a name match still flags, ordered after
   * distance-confirmed hits (closest first). place_id equality ranks first.
   */
  findDuplicates(draft: Partial<SpotInput>, spots: FoodSpot[]): FoodSpot[] {
    if (!this.plugin.settings.duplicateDetectionEnabled) return [];
    const radius = this.plugin.settings.duplicateDetectionRadiusMeters;
    const draftPlaceId = draft.external?.googlePlaceId;
    const draftName = draft.name !== undefined ? normalizeName(draft.name) : "";
    const draftCoords = draft.coordinates;

    interface Hit {
      spot: FoodSpot;
      rank: number;
      dist: number;
    }
    const hits: Hit[] = [];

    for (const spot of spots) {
      if (draftPlaceId !== undefined && spot.external.googlePlaceId === draftPlaceId) {
        hits.push({ spot, rank: 0, dist: 0 });
        continue;
      }
      if (draftName === "" || normalizeName(spot.name) !== draftName) continue;
      if (draftCoords !== undefined && spot.coordinates !== undefined) {
        const dist = haversineMeters(draftCoords, spot.coordinates);
        if (dist <= radius) hits.push({ spot, rank: 1, dist });
        // else: same name, too far apart — different branch, not a duplicate.
      } else {
        hits.push({ spot, rank: 2, dist: Number.POSITIVE_INFINITY });
      }
    }

    hits.sort((a, b) => a.rank - b.rank || a.dist - b.dist);
    const seen = new Set<string>();
    const result: FoodSpot[] = [];
    for (const hit of hits) {
      if (!seen.has(hit.spot.path)) {
        seen.add(hit.spot.path);
        result.push(hit.spot);
      }
    }
    return result;
  }
}
