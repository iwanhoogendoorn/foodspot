/**
 * Food Spot — Map tab: Leaflet + OpenStreetMap over the library. Markers are
 * L.divIcon colored dots (status colors, favorites get a ring), popups carry
 * an Open button into the detail modal, and a toolbar offers World/Country/
 * City scope dropdowns (fit bounds, maxZoom 15), status filter chips, and an
 * unmapped-spots line wired into the Google enrich flow.
 *
 * The map instance is created ONCE; refresh() diffs markers by path and never
 * recreates the map — pan/zoom state and the toolbar survive every render.
 */
import L from "leaflet";
import { Notice, setIcon } from "obsidian";
import type {
  Coordinates,
  FoodSpot,
  FoodSpotPluginApi,
  SpotStatus,
  TabHandle,
} from "../../types";
import { fmtRating } from "../components/card";
import { iconButton } from "../components/toolbar";
import { openDetailModal } from "../modals/detail";

const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

type MappedSpot = FoodSpot & { coordinates: Coordinates };

/** Status colors are user-set and end up inside divIcon HTML — hex only. */
function safeColor(c: string): string {
  return /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : "var(--interactive-accent)";
}

function fmtCount(n: number): string {
  return n >= 1000 ? `${(Math.round(n / 100) / 10).toFixed(1)}k` : String(n);
}

export function mountMapTab(container: HTMLElement, plugin: FoodSpotPluginApi): TabHandle {
  const root = container.createDiv({ cls: "fs-map" });

  // -- state ---------------------------------------------------------------

  let scopeCountry = ""; // "" = World
  let scopeCity = ""; // "" = all cities in scope
  const hiddenStatuses = new Set<SpotStatus>();
  let favoritesOnly = false;
  let didInitialFit = false;
  let countryOptionsKey = "";
  let cityOptionsKey = "";

  const mappedSpots = (): MappedSpot[] =>
    plugin.store.getSpots().filter((s): s is MappedSpot => !!s.coordinates);

  const inScope = (spot: FoodSpot): boolean =>
    (!scopeCountry || spot.country.trim() === scopeCountry) &&
    (!scopeCity || (spot.city ?? "").trim() === scopeCity);

  const passesFilters = (spot: FoodSpot): boolean => {
    if (hiddenStatuses.has(spot.status)) return false;
    if (favoritesOnly && !spot.favorite) return false;
    return true;
  };

  const openEnrich = (): void => {
    // The modals module attaches openEnrichModal to the plugin; degrade to a
    // pointer at the command when this tab loads without it.
    const carrier = plugin as FoodSpotPluginApi & {
      openEnrichModal?: (opts: { scope: string }) => void;
    };
    if (carrier.openEnrichModal) {
      carrier.openEnrichModal({ scope: "missing-coords" });
    } else {
      new Notice(
        'Run the "Enrich all spots from Google" command to fill in missing coordinates.'
      );
    }
  };

  // -- toolbar (built ONCE — refresh only re-syncs option lists) -----------

  const toolbar = root.createDiv({ cls: "fs-toolbar fs-map-toolbar" });

  const countrySel = toolbar.createEl("select", {
    cls: "dropdown fs-map-scope",
    attr: { "aria-label": "Map scope: country" },
  });
  const citySel = toolbar.createEl("select", {
    cls: "dropdown fs-map-scope",
    attr: { "aria-label": "Map scope: city" },
  });
  countrySel.addEventListener("change", () => {
    scopeCountry = countrySel.value;
    scopeCity = "";
    syncScopeOptions();
    fitScope();
  });
  citySel.addEventListener("change", () => {
    scopeCity = citySel.value;
    fitScope();
  });

  const chips = toolbar.createDiv({ cls: "fs-map-chips" });
  const chipDots: { el: HTMLElement; color: () => string }[] = [];

  const chip = (
    label: string,
    color: () => string,
    initialOn: boolean,
    toggle: (nowOn: boolean) => void
  ): void => {
    const btn = chips.createEl("button", {
      cls: "fs-filter-chip fs-map-chip" + (initialOn ? " is-on" : ""),
      attr: {
        "aria-label": `Toggle ${label}`,
        "aria-pressed": String(initialOn),
      },
    });
    const dot = btn.createSpan({ cls: "fs-map-chip-dot" });
    chipDots.push({ el: dot, color });
    btn.createSpan({ text: label });
    btn.addEventListener("click", () => {
      const nowOn = !btn.hasClass("is-on");
      btn.toggleClass("is-on", nowOn);
      btn.setAttribute("aria-pressed", String(nowOn));
      toggle(nowOn);
      syncMarkers();
    });
  };

  chip("Want to try", () => plugin.settings.statusColors.wantToTry, true, (on) => {
    if (on) hiddenStatuses.delete("want-to-try");
    else hiddenStatuses.add("want-to-try");
  });
  chip("Visited", () => plugin.settings.statusColors.visited, true, (on) => {
    if (on) hiddenStatuses.delete("visited");
    else hiddenStatuses.add("visited");
  });
  chip("Favorites", () => plugin.settings.statusColors.favorite, false, (on) => {
    favoritesOnly = on;
  });

  toolbar.createDiv({ cls: "fs-toolbar-spacer" });
  const unmapped = toolbar.createDiv({ cls: "fs-map-unmapped is-hidden" });

  // -- map -----------------------------------------------------------------

  const body = root.createDiv({ cls: "fs-map-body" });
  const canvas = body.createDiv({ cls: "fs-map-canvas" });
  const emptyEl = body.createDiv({ cls: "fs-map-empty is-hidden" });

  const map = L.map(canvas, { worldCopyJump: true });
  L.tileLayer(OSM_URL, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map);
  map.setView([24, 8], 2);

  const markers = new Map<string, { marker: L.Marker; sig: string }>();

  function pinIcon(spot: FoodSpot): L.DivIcon {
    const sc = plugin.settings.statusColors;
    const color = safeColor(spot.status === "visited" ? sc.visited : sc.wantToTry);
    const ring = safeColor(sc.favorite);
    const cls = spot.favorite ? "fs-map-pin is-fav" : "fs-map-pin";
    return L.divIcon({
      className: "fs-map-pin-wrap",
      html: `<div class="${cls}" style="--fs-status: ${color}; --fs-fav: ${ring};"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
      popupAnchor: [0, -10],
    });
  }

  /** Popup content is built lazily from FRESH store state on every open. */
  function buildPopup(path: string): HTMLElement {
    const el = createDiv({ cls: "fs-map-popup" });
    const spot = plugin.store.getByPath(path);
    if (!spot) return el;
    el.createDiv({ cls: "fs-map-popup-name", text: spot.name });
    const place = [spot.city, spot.country].filter(Boolean).join(", ");
    if (place) el.createDiv({ cls: "fs-map-popup-place", text: place });
    const parts: string[] = [];
    if (spot.rating !== undefined) parts.push(`★ ${fmtRating(spot.rating)}`);
    const g = spot.external.googleRating;
    if (g !== undefined) {
      const count = spot.external.googleRatingCount;
      parts.push(`G ${fmtRating(g)}${count ? ` (${fmtCount(count)})` : ""}`);
    }
    if (parts.length > 0) {
      el.createDiv({ cls: "fs-map-popup-rating", text: parts.join(" · ") });
    }
    const open = el.createEl("button", { cls: "fs-btn fs-map-popup-open", text: "Open" });
    open.addEventListener("click", () => {
      map.closePopup();
      openDetailModal(plugin, path);
    });
    return el;
  }

  /**
   * Position per path, nudging exact-overlap markers apart in a tiny circle
   * (deterministic by path order — no spiderfy needed at this scale).
   */
  function positions(spots: MappedSpot[]): Map<string, [number, number]> {
    const buckets = new Map<string, MappedSpot[]>();
    for (const s of spots) {
      const key = `${s.coordinates.lat.toFixed(5)},${s.coordinates.lng.toFixed(5)}`;
      const group = buckets.get(key);
      if (group) group.push(s);
      else buckets.set(key, [s]);
    }
    const out = new Map<string, [number, number]>();
    for (const group of buckets.values()) {
      group.sort((a, b) => a.path.localeCompare(b.path));
      group.forEach((s, i) => {
        if (i === 0) {
          out.set(s.path, [s.coordinates.lat, s.coordinates.lng]);
          return;
        }
        const angle = (2 * Math.PI * i) / group.length;
        const r = 0.00018;
        out.set(s.path, [
          s.coordinates.lat + r * Math.cos(angle),
          s.coordinates.lng + r * Math.sin(angle),
        ]);
      });
    }
    return out;
  }

  /** Incremental marker sync: diff by path, re-create only what changed. */
  function syncMarkers(): void {
    const mapped = mappedSpots();
    const visible = mapped.filter(passesFilters);
    const pos = positions(visible);
    const sc = plugin.settings.statusColors;
    const seen = new Set<string>();
    for (const spot of visible) {
      const at = pos.get(spot.path);
      if (!at) continue;
      seen.add(spot.path);
      const sig = [
        at[0],
        at[1],
        spot.status,
        spot.favorite ? 1 : 0,
        sc.wantToTry,
        sc.visited,
        sc.favorite,
        spot.name,
      ].join("|");
      const existing = markers.get(spot.path);
      if (existing && existing.sig === sig) continue;
      existing?.marker.remove();
      const marker = L.marker(at, { icon: pinIcon(spot), title: spot.name });
      marker.bindPopup(() => buildPopup(spot.path));
      marker.addTo(map);
      markers.set(spot.path, { marker, sig });
    }
    for (const [path, entry] of markers) {
      if (!seen.has(path)) {
        entry.marker.remove();
        markers.delete(path);
      }
    }
    syncEmptyState(mapped.length, visible.length);
  }

  /**
   * Contextual empty state: no spots at all, no coordinates yet, or —
   * distinctly — mapped spots that the status/favorite chips hide (empty ≠
   * over-filtered, v0.1 autopsy defect class #12).
   */
  function syncEmptyState(mappedCount: number, visibleCount: number): void {
    const show = visibleCount === 0;
    emptyEl.toggleClass("is-hidden", !show);
    if (!show) return;
    emptyEl.empty();
    const total = plugin.store.getSpots().length;
    const box = emptyEl.createDiv({ cls: "fs-empty" });
    const ic = box.createDiv({ cls: "fs-empty-icon" });
    setIcon(ic, "map");
    if (mappedCount > 0) {
      // Over-filtered: the chips hide every mapped spot.
      box.createDiv({ cls: "fs-empty-title", text: "All spots filtered out" });
      box.createDiv({
        cls: "fs-empty-text",
        text: `Your filters hide all ${mappedCount} mapped spot${mappedCount === 1 ? "" : "s"}. Turn a status chip back on${favoritesOnly ? " or switch Favorites off" : ""} to see them.`,
      });
      return;
    }
    if (total === 0) {
      box.createDiv({ cls: "fs-empty-title", text: "No spots yet" });
      box.createDiv({
        cls: "fs-empty-text",
        text: "Add a spot and it will show up on the map once it has coordinates.",
      });
    } else {
      box.createDiv({ cls: "fs-empty-title", text: "No coordinates yet" });
      box.createDiv({
        cls: "fs-empty-text",
        text:
          total === 1
            ? "Your spot has no coordinates. Enrich from Google to place it on the map."
            : `None of your ${total} spots have coordinates. Enrich from Google to place them on the map.`,
      });
      const actions = box.createDiv({ cls: "fs-empty-actions" });
      const btn = actions.createEl("button", {
        cls: "fs-btn fs-btn-accent",
        text: "Enrich from Google",
      });
      btn.addEventListener("click", openEnrich);
    }
  }

  /** Rebuild dropdown options only when the underlying lists changed. */
  function syncScopeOptions(): void {
    const spots = plugin.store.getSpots();
    const countries = [...new Set(spots.map((s) => s.country.trim()).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b)
    );
    if (scopeCountry && !countries.includes(scopeCountry)) {
      scopeCountry = "";
      scopeCity = "";
    }
    const cities = [
      ...new Set(
        spots
          .filter((s) => !scopeCountry || s.country.trim() === scopeCountry)
          .map((s) => (s.city ?? "").trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));
    if (scopeCity && !cities.includes(scopeCity)) scopeCity = "";

    const cKey = countries.join(" ");
    if (cKey !== countryOptionsKey) {
      countryOptionsKey = cKey;
      countrySel.empty();
      countrySel.createEl("option", { text: "World", value: "" });
      for (const c of countries) countrySel.createEl("option", { text: c, value: c });
    }
    countrySel.value = scopeCountry;

    const tKey = `${scopeCountry} ${cities.join(" ")}`;
    if (tKey !== cityOptionsKey) {
      cityOptionsKey = tKey;
      citySel.empty();
      citySel.createEl("option", { text: "All cities", value: "" });
      for (const c of cities) citySel.createEl("option", { text: c, value: c });
    }
    citySel.value = scopeCity;
  }

  /** Fit the view over every mapped spot in the current scope, maxZoom 15. */
  function fitScope(): void {
    const match = mappedSpots().filter(inScope);
    if (match.length === 0) {
      // Selecting a scope must never look dead — say why nothing moved.
      if (scopeCountry || scopeCity) {
        const label = scopeCity || scopeCountry;
        new Notice(`No spots in ${label} have coordinates yet.`);
      }
      return;
    }
    const bounds = L.latLngBounds(
      match.map((s) => [s.coordinates.lat, s.coordinates.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
  }

  function syncUnmapped(): void {
    const count = plugin.store.getSpots().filter((s) => !s.coordinates).length;
    unmapped.empty();
    unmapped.toggleClass("is-hidden", count === 0);
    if (count === 0) return;
    unmapped.createSpan({
      cls: "fs-map-unmapped-text",
      text: `${count} ${count === 1 ? "spot has" : "spots have"} no coordinates`,
    });
    iconButton(unmapped, {
      icon: "sparkles",
      label: "Enrich spots missing coordinates from Google",
      text: "Enrich from Google",
      onClick: openEnrich,
    });
  }

  function refresh(): void {
    for (const { el, color } of chipDots) {
      el.style.setProperty("--fs-status", safeColor(color()));
    }
    syncScopeOptions();
    syncUnmapped();
    syncMarkers();
    // The view refreshes this tab on every activation — the pane is only
    // measurable now, so Leaflet must re-read its container size.
    map.invalidateSize();
    if (!didInitialFit && markers.size > 0) {
      didInitialFit = true;
      fitScope();
    }
  }

  const resizeObserver = new ResizeObserver(() => map.invalidateSize());
  resizeObserver.observe(body);

  refresh();
  window.requestAnimationFrame(() => map.invalidateSize());

  return {
    refresh,
    destroy: () => {
      resizeObserver.disconnect();
      map.remove();
      markers.clear();
      root.remove();
    },
  };
}
