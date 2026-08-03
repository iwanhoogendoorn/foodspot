/**
 * Food Spot — THE shared card builder (SPEC "Shared card builder").
 *
 * One builder used by the Spots grid, dashboard rows (compact) and widgets:
 *  - 4/3 photo card, letter placeholder tinted by a deterministic cuisine
 *    hash color mixed with the theme accent, pulsing only while a photo loads.
 *  - Lazy photos via ONE shared IntersectionObserver + `data-needs-photo`;
 *    a module-level Map caches resolved srcs with a "none" sentinel so
 *    missing/broken photos are never re-fetched.
 *  - Status badge (settings.statusColors), favorite star toggle, price chip,
 *    gradient scrim (clamped name, cuisine chips, meta row), stale-ratings
 *    dot, hover-revealed ⋮ menu (always visible on mobile via CSS).
 */
import { Menu, Notice, TFile, normalizePath, setIcon } from "obsidian";
import type {
  ExternalRatings,
  FoodSpot,
  FoodSpotPluginApi,
  RatingTier,
} from "../../types";
import { localClockApplies, openState } from "./hours";
import { daysSinceCalendar } from "../../util/dates";
import { EnrichStepError } from "../../import/pipeline";
import { openDetailModal } from "../modals/detail";
import { openEditModal } from "../modals/addEdit";
import { openLogVisitPicker } from "../modals/logVisit";
import { openGalleryModal } from "../modals/gallery";
import { confirmModalWithOption } from "../modals/confirm";

// ---------------------------------------------------------------------------
// Formatting helpers (shared by my tabs)
// ---------------------------------------------------------------------------

/**
 * "3 mo ago" style relative time from a calendar date. Counted in whole
 * calendar days, not elapsed milliseconds: a visit logged this evening reads
 * "today" everywhere on earth, never "yesterday".
 */
export function relTime(iso: string): string {
  const days = daysSinceCalendar(iso);
  if (Number.isNaN(days)) return "";
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} d ago`;
  if (days < 31) return `${Math.max(1, Math.round(days / 7))} w ago`;
  if (days < 365) return `${Math.max(1, Math.round(days / 30.44))} mo ago`;
  return `${Math.max(1, Math.round(days / 365.25))} y ago`;
}

export function fmtRating(v: number): string {
  return (Math.round(v * 10) / 10).toFixed(1);
}

function fmtCount(n: number): string {
  return n >= 1000 ? `${(Math.round(n / 100) / 10).toFixed(1)}k` : String(n);
}

/** Tier for a 0.5–5 rating (tiers[0] = 0–1 stars … tiers[4] = 4–5 stars). */
export function tierFor(rating: number, tiers: RatingTier[]): RatingTier | undefined {
  if (tiers.length === 0) return undefined;
  const idx = Math.min(tiers.length - 1, Math.max(0, Math.ceil(rating) - 1));
  return tiers[idx];
}

/**
 * Neutral placeholder tint: a whisper of accent over the card surface, with
 * only the mix strength (not the hue) varying per cuisine. Keeps cards calm
 * in both themes — the old hue-rotated tint read as random mud.
 */
export function cuisineTint(spot: FoodSpot): string {
  const seed = spot.cuisines[0] ?? spot.name;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const strength = 6 + (((h % 4) + 4) % 4) * 3; // 6 | 9 | 12 | 15 %
  return `color-mix(in srgb, var(--interactive-accent) ${strength}%, var(--background-secondary))`;
}

/**
 * THE stale-ratings semantic, shared by cards and the detail modal: a missing
 * or unparsable fetch date counts as stale (we have a rating but no idea how
 * old it is).
 */
export function isStaleRatings(plugin: FoodSpotPluginApi, ext: ExternalRatings): boolean {
  if (!ext.ratingsUpdated) return true;
  const days = daysSinceCalendar(ext.ratingsUpdated);
  if (Number.isNaN(days)) return true;
  return days > plugin.settings.staleRatingThresholdDays;
}

/**
 * SPEC-v1.1 §5 card meta: the single best-covered non-Google source (most
 * reviews wins). TheFork rates on a 10-scale — shown "/10", never converted.
 */
function bestOtherSource(
  ext: ExternalRatings
): { label: string; rating: number; count: number; scale10: boolean } | null {
  const candidates = [
    { label: "TA", rating: ext.tripadvisorRating, count: ext.tripadvisorRatingCount ?? 0, scale10: false },
    { label: "Yelp", rating: ext.yelpRating, count: ext.yelpRatingCount ?? 0, scale10: false },
    { label: "TheFork", rating: ext.theforkRating, count: ext.theforkRatingCount ?? 0, scale10: true },
  ].filter(
    (c): c is { label: string; rating: number; count: number; scale10: boolean } =>
      c.rating !== undefined
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.count - a.count);
  return candidates[0] ?? null;
}

function mapsUrl(spot: FoodSpot): string {
  const q = spot.coordinates
    ? `${spot.coordinates.lat},${spot.coordinates.lng}`
    : [spot.name, spot.city, spot.country].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

// ---------------------------------------------------------------------------
// Lazy photo loading (one shared IntersectionObserver, "none" sentinel)
// ---------------------------------------------------------------------------

const NONE = "none";
/** cache key -> resolved src, or "none" for known-missing/broken photos. */
const photoCache = new Map<string, string>();
const pendingLoaders = new WeakMap<Element, () => void>();
let sharedObserver: IntersectionObserver | null = null;

function observer(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          sharedObserver?.unobserve(entry.target);
          const load = pendingLoaders.get(entry.target);
          pendingLoaders.delete(entry.target);
          load?.();
        }
      },
      { rootMargin: "200px" }
    );
  }
  return sharedObserver;
}

function cacheKey(spot: FoodSpot): string {
  return `${spot.path}|${spot.photo ?? ""}`;
}

function resolveSrc(plugin: FoodSpotPluginApi, spot: FoodSpot): string {
  const key = cacheKey(spot);
  const cached = photoCache.get(key);
  if (cached !== undefined) return cached;
  const raw = spot.photo?.trim();
  let src = NONE;
  if (raw) {
    if (/^https?:\/\//i.test(raw)) {
      src = raw;
    } else {
      // Same resolution as the detail modal: link-style short paths
      // ("momiji.jpg") resolve through metadataCache first.
      try {
        const file =
          plugin.app.metadataCache.getFirstLinkpathDest(raw, spot.path) ??
          plugin.app.vault.getAbstractFileByPath(raw);
        src = file instanceof TFile ? plugin.app.vault.getResourcePath(file) : NONE;
      } catch {
        src = NONE;
      }
    }
  }
  photoCache.set(key, src);
  return src;
}

/**
 * Unregister every pending lazy photo inside `root` from the shared
 * IntersectionObserver. MUST be called before removing card DOM wholesale
 * (virtualized cells, dashboard/widget re-renders) — the observer holds
 * strong references to its targets, so skipping this leaks the whole card
 * subtree until plugin unload.
 */
export function releaseLazyPhotos(root: HTMLElement): void {
  if (!sharedObserver) return;
  const targets = root.querySelectorAll<HTMLElement>("[data-needs-photo]");
  for (const t of Array.from(targets)) {
    sharedObserver.unobserve(t);
    pendingLoaders.delete(t);
  }
  if (root.dataset.needsPhoto) {
    sharedObserver.unobserve(root);
    pendingLoaders.delete(root);
  }
}

/** Full teardown for plugin unload: observer + photo cache. */
export function disposePhotoObserver(): void {
  sharedObserver?.disconnect();
  sharedObserver = null;
  photoCache.clear();
}

/**
 * Marks `photoEl` with data-needs-photo and registers it with the shared
 * observer; the photo only loads when the card scrolls into view. `hostEl`
 * receives the `has-photo` class on successful load (drives the img fade-in).
 */
function attachLazyPhoto(
  photoEl: HTMLElement,
  plugin: FoodSpotPluginApi,
  spot: FoodSpot,
  hostEl: HTMLElement
): void {
  if (!spot.photo) return;
  if (photoCache.get(cacheKey(spot)) === NONE) return;
  photoEl.dataset.needsPhoto = "true";
  pendingLoaders.set(photoEl, () => {
    const src = resolveSrc(plugin, spot);
    if (src === NONE) {
      delete photoEl.dataset.needsPhoto;
      return;
    }
    const img = photoEl.createEl("img", { cls: "fs-card-img" });
    // Explicit dimensions: zero layout shift (container is aspect-locked;
    // these keep the intrinsic ratio hint honest).
    img.setAttribute("width", "400");
    img.setAttribute("height", "300");
    img.setAttribute("alt", "");
    img.decoding = "async";
    img.onload = () => {
      delete photoEl.dataset.needsPhoto;
      img.addClass("is-loaded");
      hostEl.addClass("has-photo");
    };
    img.onerror = () => {
      delete photoEl.dataset.needsPhoto;
      photoCache.set(cacheKey(spot), NONE);
      img.remove();
      hostEl.removeClass("has-photo");
    };
    img.src = src;
  });
  observer().observe(photoEl);
}

// ---------------------------------------------------------------------------
// Spot actions (menu shared by card, compact row and table consumers)
// ---------------------------------------------------------------------------

export async function refreshSpotRatings(
  plugin: FoodSpotPluginApi,
  spot: FoodSpot
): Promise<void> {
  try {
    const updated = await plugin.importer.refreshRatings(spot, (msg) => new Notice(msg, 8000));
    if (updated) {
      await plugin.store.updateSpot(spot.path, {
        external: { ...spot.external, ...updated },
      });
      new Notice(`Ratings refreshed for "${spot.name}".`);
    } else {
      new Notice(`No fresh ratings found for "${spot.name}".`);
    }
  } catch (e) {
    new Notice(`Rating refresh failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** True when a spot is missing the data a Google pull can fill. */
export function isUnderfilled(spot: FoodSpot): boolean {
  return (
    !spot.photo ||
    spot.external.googleRating === undefined ||
    !spot.coordinates ||
    !spot.address
  );
}

/** Single-spot "force pull": photo, ratings, coords, address, menu — gaps only. */
export async function pullSpotInfo(
  plugin: FoodSpotPluginApi,
  spot: FoodSpot
): Promise<void> {
  if (!plugin.importer.hasGoogleKey()) {
    new Notice("Add a Google Places API key in Settings → Food Spot → API first.");
    return;
  }
  try {
    const patch = await plugin.importer.enrichSpot(spot, {
      photo: true,
      ratings: true,
      coords: true,
      address: true,
      menu: true,
    });
    if (patch && Object.keys(patch).length > 0) {
      await plugin.store.updateSpot(spot.path, patch);
      new Notice(`Pulled Google info for "${spot.name}".`);
    } else {
      new Notice(`Nothing new found for "${spot.name}".`);
    }
  } catch (e) {
    // A step the user asked for failed, but the run may still have gathered
    // ratings/address/coordinates. Persist that before reporting the failure —
    // throwing the partial away would be a silent regression on the path that
    // used to save everything except the photo.
    if (e instanceof EnrichStepError && e.partial && Object.keys(e.partial).length > 0) {
      try {
        await plugin.store.updateSpot(spot.path, e.partial);
        new Notice(`Pull partly failed for "${spot.name}": ${e.message} The rest was saved.`, 10000);
        return;
      } catch (writeError) {
        new Notice(
          `Pull failed for "${spot.name}": ${e.message} Saving what was found also failed — ${writeError instanceof Error ? writeError.message : String(writeError)}`,
          10000,
        );
        return;
      }
    }
    new Notice(`Pull failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** Vault-stored media this spot references (photo/menu), if any. */
export function spotMediaFiles(plugin: FoodSpotPluginApi, spot: FoodSpot): TFile[] {
  const out: TFile[] = [];
  for (const ref of [spot.photo, spot.menu]) {
    if (!ref || /^https?:\/\//i.test(ref)) continue;
    const f = plugin.app.vault.getFileByPath(normalizePath(ref));
    if (f && !out.includes(f)) out.push(f);
  }
  return out;
}

export async function deleteWithConfirm(
  plugin: FoodSpotPluginApi,
  spot: FoodSpot
): Promise<void> {
  const visits =
    spot.visitCount > 0
      ? ` Its ${spot.visitCount} logged visit${spot.visitCount === 1 ? "" : "s"} and notes go with it.`
      : "";
  const media = spotMediaFiles(plugin, spot);
  const { confirmed, checked } = await confirmModalWithOption(plugin.app, {
    title: `Delete "${spot.name}"?`,
    body: `The note "${spot.path}" is moved to the trash and can be restored from there.${visits}`,
    cta: "Delete",
    danger: true,
    checkbox:
      media.length > 0
        ? {
            label: `Also trash its ${media.length === 1 ? "cover photo" : "photo and menu files"} (${media
              .map((f) => f.name)
              .join(", ")})`,
            default: false,
          }
        : undefined,
  });
  if (!confirmed) return;
  await plugin.store.deleteSpot(spot.path);
  let trashed = 0;
  if (checked) {
    for (const f of media) {
      try {
        await plugin.app.fileManager.trashFile(f);
        trashed++;
      } catch {
        // A locked/synced file never blocks the spot deletion.
      }
    }
  }
  new Notice(
    `Deleted "${spot.name}"${trashed > 0 ? ` and ${trashed} media file${trashed === 1 ? "" : "s"}` : ""} — recoverable from the trash.`
  );
}

export function spotMenu(plugin: FoodSpotPluginApi, spot: FoodSpot): Menu {
  const menu = new Menu();
  menu.addItem((i) =>
    i.setTitle("Open note").setIcon("file-text").onClick(() => void plugin.store.openNote(spot.path))
  );
  menu.addItem((i) =>
    i.setTitle("Edit").setIcon("pencil").onClick(() => openEditModal(plugin, spot.path))
  );
  menu.addItem((i) =>
    i.setTitle("Log visit").setIcon("calendar-plus").onClick(() => openLogVisitPicker(plugin, spot.path))
  );
  menu.addItem((i) =>
    i
      .setTitle(spot.favorite ? "Remove favorite" : "Mark favorite")
      .setIcon(spot.favorite ? "star-off" : "star")
      .onClick(() => void plugin.store.updateSpot(spot.path, { favorite: !spot.favorite }))
  );
  menu.addSeparator();
  if (spot.url) {
    const url = spot.url;
    menu.addItem((i) =>
      i.setTitle("Open website").setIcon("globe").onClick(() => window.open(url, "_blank"))
    );
  }
  if (spot.menu) {
    const target = spot.menu;
    menu.addItem((i) =>
      i.setTitle("Open menu").setIcon("book-open").onClick(() => {
        // External URL in the browser; vault path (image/PDF) in Obsidian.
        if (/^https?:\/\//i.test(target)) window.open(target, "_blank");
        else void plugin.app.workspace.openLinkText(target, spot.path);
      })
    );
  }
  menu.addItem((i) =>
    i
      .setTitle("Open in Google Maps")
      .setIcon("map-pin")
      .onClick(() => window.open(mapsUrl(spot), "_blank"))
  );
  const dishCount = spot.visits.reduce((n, v) => n + (v.photos?.length ?? 0), 0);
  if (dishCount > 0) {
    menu.addItem((i) =>
      i
        .setTitle(`Dish photos (${dishCount})`)
        .setIcon("images")
        .onClick(() => openGalleryModal(plugin, spot.path))
    );
  }
  menu.addItem((i) =>
    i
      .setTitle("Pull info from Google")
      .setIcon("cloud-download")
      .onClick(() => void pullSpotInfo(plugin, spot))
  );
  menu.addItem((i) =>
    i
      .setTitle("Refresh ratings")
      .setIcon("refresh-cw")
      .onClick(() => void refreshSpotRatings(plugin, spot))
  );
  menu.addSeparator();
  menu.addItem((i) =>
    i
      .setTitle("Delete")
      .setIcon("trash-2")
      .setWarning(true)
      .onClick(() => void deleteWithConfirm(plugin, spot))
  );
  return menu;
}

// ---------------------------------------------------------------------------
// Card builder
// ---------------------------------------------------------------------------

/**
 * Mini poster card for dashboard shelves: photo on top, name + sub below,
 * status dot / rating badge over the photo, hover menu. WatchLog-shelf shape.
 */
function buildMiniCard(
  parent: HTMLElement,
  spot: FoodSpot,
  plugin: FoodSpotPluginApi
): HTMLElement {
  const card = parent.createDiv({ cls: "fs-mini-card" });
  card.dataset.path = spot.path;
  card.setAttribute("role", "button");
  card.tabIndex = 0;
  card.setAttribute("aria-label", spot.name);

  const photo = card.createDiv({ cls: "fs-mini-photo" });
  photo.style.setProperty("--fs-cuisine-tint", cuisineTint(spot));
  photo.createSpan({ cls: "fs-card-letter", text: (spot.name[0] ?? "?").toUpperCase() });
  attachLazyPhoto(photo, plugin, spot, card);

  const dot = photo.createSpan({
    cls: "fs-mini-dot",
    attr: { title: spot.status === "visited" ? "Visited" : "Want to try" },
  });
  dot.style.setProperty(
    "--fs-status",
    spot.status === "visited"
      ? plugin.settings.statusColors.visited
      : plugin.settings.statusColors.wantToTry
  );
  if (spot.rating !== undefined) {
    const badge = photo.createSpan({ cls: "fs-mini-rating" });
    const star = badge.createSpan({ cls: "fs-star-icon" });
    setIcon(star, "star");
    badge.createSpan({ text: fmtRating(spot.rating) });
    const tier = tierFor(spot.rating, plugin.settings.ratingTiers);
    if (tier) badge.style.setProperty("--fs-tier", tier.color);
  }

  const menuBtn = card.createEl("button", {
    cls: "fs-card-menu fs-mini-menu",
    attr: { "aria-label": "More actions" },
  });
  setIcon(menuBtn, "more-vertical");
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    spotMenu(plugin, spot).showAtMouseEvent(e);
  });

  const body = card.createDiv({ cls: "fs-mini-body" });
  body.createDiv({ cls: "fs-mini-name", text: spot.name });
  const sub = [spot.city, spot.cuisines[0]].filter(Boolean).join(" · ");
  if (sub) body.createDiv({ cls: "fs-mini-sub", text: sub });

  card.addEventListener("click", () => openDetailModal(plugin, spot.path));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter") openDetailModal(plugin, spot.path);
  });
  return card;
}

export function buildSpotCard(
  parent: HTMLElement,
  spot: FoodSpot,
  ctx: { plugin: any; compact?: boolean; mini?: boolean }
): HTMLElement {
  const plugin = ctx.plugin as FoodSpotPluginApi;
  if (ctx.mini) return buildMiniCard(parent, spot, plugin);
  return ctx.compact
    ? buildCompactRow(parent, spot, plugin)
    : buildFullCard(parent, spot, plugin);
}

function buildFullCard(
  parent: HTMLElement,
  spot: FoodSpot,
  plugin: FoodSpotPluginApi
): HTMLElement {
  const card = parent.createDiv({ cls: "fs-card" });
  // Settings → Customize → "Card text placement": under = name/chips/meta
  // below the photo instead of on the gradient scrim.
  if (plugin.settings.cardTextPlacement === "under") card.addClass("fs-card-text-under");
  card.dataset.path = spot.path;
  card.setAttribute("role", "button");
  card.tabIndex = 0;
  card.setAttribute("aria-label", spot.name);

  // Photo / placeholder. Without a photo the card is a themed surface, not a
  // dark poster — fs-card-nophoto flips the scrim/text to theme colors.
  if (!spot.photo) card.addClass("fs-card-nophoto");
  const photo = card.createDiv({ cls: "fs-card-photo" });
  photo.style.setProperty("--fs-cuisine-tint", cuisineTint(spot));
  photo.createDiv({ cls: "fs-card-letter", text: (spot.name[0] ?? "?").toUpperCase() });
  attachLazyPhoto(photo, plugin, spot, card);

  // Missing cover/info: an in-card button to force a single-spot Google pull.
  if (isUnderfilled(spot)) {
    const pull = card.createEl("button", {
      cls: "fs-card-pull",
      attr: { "aria-label": "Pull photo & info from Google", title: "Pull photo & info from Google" },
    });
    const pullIcon = pull.createSpan({ cls: "fs-btn-icon" });
    setIcon(pullIcon, "cloud-download");
    pull.createSpan({ cls: "fs-card-pull-label", text: "Pull info" });
    pull.addEventListener("click", (e) => {
      e.stopPropagation();
      pull.addClass("fs-loading");
      pull.disabled = true;
      setIcon(pullIcon, "loader-2");
      void pullSpotInfo(plugin, spot).finally(() => {
        // The store change re-renders the card; this is just belt-and-braces
        // for the no-change path.
        pull.removeClass("fs-loading");
        pull.disabled = false;
        setIcon(pullIcon, "cloud-download");
      });
    });
  }

  // Status badge (top-left): colored dot + quiet label, not a solid pill.
  const badge = card.createDiv({ cls: "fs-card-status" });
  badge.createSpan({ cls: "fs-card-status-dot" });
  badge.createSpan({
    cls: "fs-card-status-label",
    text: spot.status === "visited" ? "Visited" : "Want to try",
  });
  badge.style.setProperty(
    "--fs-status",
    spot.status === "visited"
      ? plugin.settings.statusColors.visited
      : plugin.settings.statusColors.wantToTry
  );

  // Price chip (below badge)
  if (spot.price && spot.price > 0) {
    card.createDiv({
      cls: "fs-card-price",
      text: plugin.settings.currencySymbol.repeat(Math.min(4, spot.price)),
    });
  }

  // Favorite toggle (top-right)
  const fav = card.createEl("button", {
    cls: "fs-card-fav",
    attr: { "aria-label": spot.favorite ? "Remove from favorites" : "Add to favorites" },
  });
  setIcon(fav, "star");
  fav.toggleClass("is-active", spot.favorite);
  fav.style.setProperty("--fs-fav", plugin.settings.statusColors.favorite);
  fav.addEventListener("click", (e) => {
    e.stopPropagation();
    void plugin.store.updateSpot(spot.path, { favorite: !spot.favorite });
  });

  // ⋮ menu (hover-revealed; always visible on mobile via CSS)
  const menuBtn = card.createEl("button", {
    cls: "fs-card-menu",
    attr: { "aria-label": "More actions" },
  });
  setIcon(menuBtn, "more-vertical");
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    spotMenu(plugin, spot).showAtMouseEvent(e);
  });
  card.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    spotMenu(plugin, spot).showAtMouseEvent(e);
  });

  // Gradient scrim: name, cuisine chips, meta row
  const scrim = card.createDiv({ cls: "fs-card-scrim" });
  scrim.createDiv({ cls: "fs-card-name", text: spot.name });
  if (spot.cuisines.length > 0) {
    const chips = scrim.createDiv({ cls: "fs-card-chips" });
    for (const c of spot.cuisines.slice(0, 3)) chips.createSpan({ cls: "fs-chip", text: c });
    if (spot.cuisines.length > 3) {
      chips.createSpan({ cls: "fs-chip fs-chip-more", text: `+${spot.cuisines.length - 3}` });
    }
  }
  const meta = scrim.createDiv({ cls: "fs-card-meta" });
  if (spot.rating !== undefined) {
    const mine = meta.createSpan({ cls: "fs-meta-stars" });
    const star = mine.createSpan({ cls: "fs-star-icon" });
    setIcon(star, "star");
    mine.createSpan({ text: fmtRating(spot.rating) });
    const tier = tierFor(spot.rating, plugin.settings.ratingTiers);
    if (tier) mine.style.setProperty("--fs-tier", tier.color);
  }
  if (spot.external.googleRating !== undefined) {
    const g = meta.createSpan({ cls: "fs-meta-google" });
    g.createSpan({ cls: "fs-meta-g", text: "G" });
    const count = spot.external.googleRatingCount;
    g.createSpan({
      text: ` ${fmtRating(spot.external.googleRating)}${count ? ` (${fmtCount(count)})` : ""}`,
    });
    if (isStaleRatings(plugin, spot.external)) {
      g.createSpan({
        cls: "fs-stale-dot",
        attr: { "aria-label": "Ratings may be outdated", title: "Ratings may be outdated" },
      });
    }
  }
  // Best-covered non-Google source, compactly: "G 4.6 · TA 4.5" (v1.1 §5).
  const other = bestOtherSource(spot.external);
  if (other) {
    const o = meta.createSpan({ cls: "fs-meta-google" });
    o.createSpan({ cls: "fs-meta-g", text: other.label });
    o.createSpan({ text: ` ${fmtRating(other.rating)}${other.scale10 ? "/10" : ""}` });
  }
  // Open-now chip — only for spots whose hours we can actually read; unknown
  // hours leave the meta row exactly as it was. Spots in another country are
  // judged by this machine's clock, so they get no open/closed claim at all.
  const hours = localClockApplies(spot.country, plugin.settings.defaultCountry)
    ? openState(spot.hours, new Date())
    : null;
  if (hours) {
    const chip = meta.createSpan({
      cls: `fs-open-chip ${hours.open ? "is-open" : "is-closed"}`,
      attr: { title: hours.label, "aria-label": hours.label },
    });
    if (hours.open) chip.style.setProperty("--fs-open", plugin.settings.statusColors.visited);
    chip.createSpan({ text: hours.open ? "Open" : "Closed" });
  }
  const when = spot.lastVisit
    ? relTime(spot.lastVisit)
    : spot.created
      ? `added ${relTime(spot.created)}`
      : "";
  if (when) meta.createSpan({ cls: "fs-meta-time", text: when });

  card.addEventListener("click", () => openDetailModal(plugin, spot.path));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDetailModal(plugin, spot.path);
    }
  });
  return card;
}

/** Dense row variant for dashboard lists (`compact: true`). */
function buildCompactRow(
  parent: HTMLElement,
  spot: FoodSpot,
  plugin: FoodSpotPluginApi
): HTMLElement {
  const row = parent.createDiv({ cls: "fs-card-row" });
  row.dataset.path = spot.path;
  row.setAttribute("role", "button");
  row.tabIndex = 0;
  row.setAttribute("aria-label", spot.name);

  const thumb = row.createDiv({ cls: "fs-card-row-thumb" });
  thumb.style.setProperty("--fs-cuisine-tint", cuisineTint(spot));
  thumb.createSpan({ cls: "fs-card-letter", text: (spot.name[0] ?? "?").toUpperCase() });
  attachLazyPhoto(thumb, plugin, spot, row);

  const body = row.createDiv({ cls: "fs-card-row-body" });
  body.createDiv({ cls: "fs-card-row-name", text: spot.name });
  const sub = [spot.city, spot.cuisines[0]].filter(Boolean).join(" · ");
  if (sub) body.createDiv({ cls: "fs-card-row-sub", text: sub });

  const right = row.createDiv({ cls: "fs-card-row-meta" });
  if (spot.rating !== undefined) {
    const mine = right.createSpan({ cls: "fs-meta-stars" });
    const star = mine.createSpan({ cls: "fs-star-icon" });
    setIcon(star, "star");
    mine.createSpan({ text: fmtRating(spot.rating) });
    const tier = tierFor(spot.rating, plugin.settings.ratingTiers);
    if (tier) mine.style.setProperty("--fs-tier", tier.color);
  } else {
    const dot = right.createSpan({
      cls: "fs-status-dot",
      attr: { title: spot.status === "visited" ? "Visited" : "Want to try" },
    });
    dot.style.setProperty(
      "--fs-status",
      spot.status === "visited"
        ? plugin.settings.statusColors.visited
        : plugin.settings.statusColors.wantToTry
    );
  }
  const menuBtn = row.createEl("button", {
    cls: "fs-card-menu fs-card-row-menu",
    attr: { "aria-label": "More actions" },
  });
  setIcon(menuBtn, "more-vertical");
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    spotMenu(plugin, spot).showAtMouseEvent(e);
  });

  row.addEventListener("click", () => openDetailModal(plugin, spot.path));
  row.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDetailModal(plugin, spot.path);
    }
  });
  return row;
}
