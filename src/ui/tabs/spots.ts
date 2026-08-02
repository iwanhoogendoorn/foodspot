/**
 * Food Spot — Spots tab: toolbar (search + tips, filters, preset, sort, view
 * toggle, select mode, Add, Import), virtualized card grid / table, bulk
 * actions, contextual empty states.
 *
 * FOCUS RULE (v0.1 defect #1): typing in the search box re-renders ONLY the
 * results area. The toolbar — and the input — are built once and never
 * touched by refresh().
 */
import { Menu, Notice, setIcon } from "obsidian";
import type {
  FoodSpot,
  FoodSpotPluginApi,
  SavedFilterPreset,
  SpotStatus,
  TabHandle,
} from "../../types";
import { EMPTY_FILTER_STATE } from "../../types";
import { filterSpots, sortSpots } from "../../search/query";
import { attachSearchTips } from "../../search/searchTips";
import { buildSpotCard, fmtRating, relTime, releaseLazyPhotos } from "../components/card";
import { buildSearchBox, debounce, iconButton, setButtonIcon } from "../components/toolbar";
import { buildFiltersControl, cloneFilters } from "../components/filtersDropdown";
import { buildSortButton } from "../components/sortMenu";
import {
  cardMinWidth,
  createVirtualGrid,
  createVirtualTable,
} from "../components/virtualGrid";
import type { VirtualHandle } from "../components/virtualGrid";
import type { MountEnrichProgress } from "../modals/enrich";
import { openAddChooser } from "../modals/addChooser";
import { openImportModal } from "../modals/importFlow";
import { openDetailModal } from "../modals/detail";
import { confirmModal } from "../modals/confirm";

export interface LocationFilter {
  country?: string;
  city?: string;
  district?: string;
}

interface SpotsController {
  applyLocation(loc: LocationFilter): void;
  setQuery(query: string): void;
}

/**
 * The mounted Spots tab registers itself here so the view (and the Places
 * tab, via the view) can push a location filter into it. SpotFilterState has
 * no district facet, so districts travel as a `district:"…"` query token.
 */
let activeController: SpotsController | null = null;

export function applySpotsLocation(_plugin: FoodSpotPluginApi, loc: LocationFilter): void {
  activeController?.applyLocation(loc);
}

/**
 * Push a search query into the mounted Spots tab (detail-modal chip clicks:
 * `cuisine:"X"` / `tag:"X"`). Filters are reset so the query shows ALL
 * matching spots — a chip click means "show me everything like this".
 */
export function applySpotsQuery(_plugin: FoodSpotPluginApi, query: string): void {
  activeController?.setQuery(query);
}

export function mountSpotsTab(container: HTMLElement, plugin: FoodSpotPluginApi): TabHandle {
  const root = container.createDiv({ cls: "fs-spots" });

  let query = "";
  let viewMode = plugin.settings.spotViewMode;
  let selectMode = false;
  const selected = new Set<string>();
  let renderer: VirtualHandle<FoodSpot> | null = null;
  let currentResults: FoodSpot[] = [];
  let emptyEl: HTMLElement | null = null;

  const persist = debounce(() => void plugin.saveSettings(), 600);

  // -- toolbar (built ONCE) ------------------------------------------------

  const toolbar = root.createDiv({ cls: "fs-toolbar" });

  const search = buildSearchBox(toolbar, {
    placeholder: "Search spots…",
    debounceMs: 250,
    onQuery: (q) => {
      query = q;
      renderResults();
    },
  });
  const tipsBtn = search.wrapEl.createEl("button", { cls: "fs-search-tips" });
  attachSearchTips(plugin, tipsBtn);

  // Full-width drawer host for the filter panel, directly under the toolbar.
  const filterDrawerHost = root.createDiv({ cls: "fs-filter-drawer-host" });

  const filtersCtl = buildFiltersControl(toolbar, plugin, {
    panelHost: filterDrawerHost,
    getState: () => plugin.settings.filterState,
    setState: (next) => {
      plugin.settings.filterState = next;
      persist();
      renderResults();
    },
    presetContext: () => ({
      query,
      sort: plugin.settings.sort,
      secondarySort: plugin.settings.secondarySort,
    }),
    applyPreset: (p: SavedFilterPreset) => {
      plugin.settings.filterState = cloneFilters(p.filters);
      plugin.settings.sort = { ...p.sort };
      plugin.settings.secondarySort = p.secondarySort ? { ...p.secondarySort } : undefined;
      query = p.query;
      search.setValue(p.query);
      sortCtl.sync();
      filtersCtl.sync();
      persist();
      renderResults();
    },
  });

  const sortCtl = buildSortButton(toolbar, {
    get: () => ({ primary: plugin.settings.sort, secondary: plugin.settings.secondarySort }),
    set: (primary, secondary) => {
      plugin.settings.sort = primary;
      plugin.settings.secondarySort = secondary;
      persist();
      renderResults();
    },
  });

  const viewBtn = iconButton(toolbar, {
    icon: viewMode === "cards" ? "table-2" : "layout-grid",
    label: "Toggle cards / table view",
    onClick: () => {
      viewMode = viewMode === "cards" ? "table" : "cards";
      plugin.settings.spotViewMode = viewMode;
      persist();
      setButtonIcon(viewBtn, viewMode === "cards" ? "table-2" : "layout-grid");
      renderer?.destroy();
      renderer = null;
      renderResults();
    },
  });

  const selectBtn = iconButton(toolbar, {
    icon: "copy-check",
    label: "Select spots",
    onClick: () => toggleSelectMode(),
  });

  toolbar.createDiv({ cls: "fs-toolbar-spacer" });

  iconButton(toolbar, {
    icon: "link",
    label: "Import from URL",
    text: "Import",
    onClick: () => openImportModal(plugin),
  });
  iconButton(toolbar, {
    icon: "plus",
    label: "Add spot",
    text: "Add",
    cls: "fs-btn-accent",
    onClick: () => openAddChooser(plugin),
  });

  // Bulk-enrich progress bar host (hidden until a run mounts into it).
  const enrichBar = root.createDiv({ cls: "fs-enrich-bar is-hidden" });

  // -- bulk bar ------------------------------------------------------------

  const bulkBar = root.createDiv({ cls: "fs-bulk-bar is-hidden" });
  const bulkCount = bulkBar.createSpan({ cls: "fs-bulk-count", text: "0 selected" });
  iconButton(bulkBar, {
    icon: "check-check",
    label: "Select all results",
    text: "All",
    onClick: () => {
      for (const s of currentResults) selected.add(s.path);
      syncSelection();
    },
  });
  iconButton(bulkBar, {
    icon: "flag",
    label: "Set status",
    text: "Status",
    onClick: (e) => {
      if (selected.size === 0) return;
      const menu = new Menu();
      const statuses: { st: SpotStatus; label: string }[] = [
        { st: "want-to-try", label: "Want to try" },
        { st: "visited", label: "Visited" },
      ];
      for (const { st, label } of statuses) {
        menu.addItem((i) => i.setTitle(label).onClick(() => void bulkStatus(st)));
      }
      menu.showAtMouseEvent(e);
    },
  });
  iconButton(bulkBar, {
    icon: "tag",
    label: "Add tag",
    text: "Tag",
    onClick: () => {
      if (selected.size === 0) return;
      tagInput.addClass("is-visible");
      tagInput.focus();
    },
  });
  const tagInput = bulkBar.createEl("input", {
    cls: "fs-bulk-tag-input",
    attr: { type: "text", placeholder: "Tag name, Enter to apply" },
  });
  tagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const tag = tagInput.value.trim();
      tagInput.value = "";
      tagInput.removeClass("is-visible");
      if (tag) void bulkTag(tag);
    } else if (e.key === "Escape") {
      tagInput.value = "";
      tagInput.removeClass("is-visible");
    }
  });
  iconButton(bulkBar, {
    icon: "trash-2",
    label: "Delete selected",
    text: "Delete",
    cls: "fs-bulk-danger",
    onClick: () => void bulkDelete(),
  });
  iconButton(bulkBar, {
    icon: "x",
    label: "Exit select mode",
    text: "Done",
    onClick: () => toggleSelectMode(),
  });

  // -- results -------------------------------------------------------------

  const resultsInfo = root.createDiv({ cls: "fs-results-info" });
  const bodyEl = root.createDiv({ cls: "fs-spots-body" });

  const onBodyClickCapture = (e: MouseEvent): void => {
    if (!selectMode) return;
    const target = e.target as HTMLElement;
    const cell = target.closest<HTMLElement>(".fs-vcell, .fs-vtable-row");
    if (!cell?.dataset.path) return;
    e.preventDefault();
    e.stopPropagation();
    const path = cell.dataset.path;
    if (selected.has(path)) selected.delete(path);
    else selected.add(path);
    cell.toggleClass("is-selected", selected.has(path));
    syncSelection();
  };
  bodyEl.addEventListener("click", onBodyClickCapture, { capture: true });

  function buildRenderer(): VirtualHandle<FoodSpot> {
    if (viewMode === "table") {
      const table = createVirtualTable<FoodSpot>(bodyEl, {
        columns: [
          { label: "Name", cls: "fs-col-name" },
          { label: "Cuisine" },
          { label: "City" },
          { label: "Price" },
          { label: "My ★" },
          { label: "Google ★" },
          { label: "Visits" },
          { label: "Last visit" },
        ],
        rowHeight: 40,
        renderRow: (spot, row) => {
          row.dataset.path = spot.path;
          if (selected.has(spot.path)) row.addClass("is-selected");
          const cell = (text: string, cls?: string): void => {
            row.createDiv({ cls: ["fs-vtable-cell", cls ?? ""].join(" ").trim(), text });
          };
          cell(spot.name, "fs-col-name");
          cell(spot.cuisines.join(", ") || "—");
          cell(spot.city ?? "—");
          cell(
            spot.price
              ? plugin.settings.currencySymbol.repeat(Math.min(4, spot.price))
              : "—"
          );
          cell(spot.rating !== undefined ? `★ ${fmtRating(spot.rating)}` : "—");
          cell(
            spot.external.googleRating !== undefined
              ? `G ${fmtRating(spot.external.googleRating)}`
              : "—"
          );
          cell(String(spot.visitCount));
          cell(spot.lastVisit ? relTime(spot.lastVisit) : "—");
        },
        onRowClick: (spot) => {
          if (!selectMode) openDetailModal(plugin, spot.path);
        },
      });
      table.el.style.setProperty(
        "--fs-table-cols",
        "minmax(140px, 2fr) 1.4fr 1fr 64px 72px 84px 56px 90px"
      );
      return table;
    }
    const grid = createVirtualGrid<FoodSpot>(bodyEl, {
      minItemWidth: () => cardMinWidth(plugin.settings),
      itemHeight: (colWidth) =>
        Math.round(colWidth * 0.75) +
        (plugin.settings.cardTextPlacement === "under" ? 64 : 0),
      render: (spot, cell) => {
        cell.dataset.path = spot.path;
        if (selected.has(spot.path)) cell.addClass("is-selected");
        buildSpotCard(cell, spot, { plugin });
      },
      // Cells scrolled out before their photo loaded must leave the shared
      // IntersectionObserver, or the whole card subtree leaks.
      onUnmount: (cell) => releaseLazyPhotos(cell),
    });
    grid.el.style.setProperty("--fs-card-min-width", `${cardMinWidth(plugin.settings)}px`);
    return grid;
  }

  function showEmpty(kind: "first-run" | "no-match" | null): void {
    if (emptyEl) {
      emptyEl.remove();
      emptyEl = null;
    }
    renderer?.el.toggleClass("is-hidden", kind !== null);
    if (!kind) return;
    emptyEl = bodyEl.createDiv({ cls: "fs-empty" });
    const ic = emptyEl.createDiv({ cls: "fs-empty-icon" });
    setIcon(ic, kind === "first-run" ? "utensils" : "search-x");
    if (kind === "first-run") {
      emptyEl.createDiv({ cls: "fs-empty-title", text: "No food spots yet" });
      emptyEl.createDiv({
        cls: "fs-empty-text",
        text: "Save restaurants you want to try and log your visits — every spot is a note in your vault.",
      });
      const actions = emptyEl.createDiv({ cls: "fs-empty-actions" });
      iconButton(actions, {
        icon: "plus",
        label: "Add your first spot",
        text: "Add your first spot",
        cls: "fs-btn-accent",
        onClick: () => openAddChooser(plugin),
      });
      iconButton(actions, {
        icon: "link",
        label: "Import from a URL",
        text: "Import from a URL",
        onClick: () => openImportModal(plugin),
      });
    } else {
      emptyEl.createDiv({ cls: "fs-empty-title", text: "No spots match" });
      emptyEl.createDiv({
        cls: "fs-empty-text",
        text: "Your search or filters exclude every spot in the library.",
      });
      const actions = emptyEl.createDiv({ cls: "fs-empty-actions" });
      iconButton(actions, {
        icon: "x",
        label: "Clear search and filters",
        text: "Clear search & filters",
        onClick: () => {
          query = "";
          search.setValue("");
          plugin.settings.filterState = cloneFilters(EMPTY_FILTER_STATE);
          filtersCtl.sync();
          persist();
          renderResults();
        },
      });
    }
  }

  /** Incremental: touches the results area + info line only. Never the input. */
  function renderResults(): void {
    const all = plugin.store.getSpots();
    currentResults = sortSpots(
      filterSpots(all, query, plugin.settings.filterState),
      plugin.settings.sort,
      plugin.settings.secondarySort
    );
    filtersCtl.sync();
    if (all.length === 0) {
      resultsInfo.setText("");
      renderer?.setItems([]);
      showEmpty("first-run");
      return;
    }
    if (currentResults.length === 0) {
      resultsInfo.setText(`0 of ${all.length} spots`);
      renderer?.setItems([]);
      showEmpty("no-match");
      return;
    }
    showEmpty(null);
    if (!renderer) renderer = buildRenderer();
    renderer.el.removeClass("is-hidden");
    renderer.setItems(currentResults);
    resultsInfo.setText(
      currentResults.length === all.length
        ? `${all.length} spot${all.length === 1 ? "" : "s"}`
        : `${currentResults.length} of ${all.length} spots`
    );
  }

  // -- selection / bulk ----------------------------------------------------

  function syncSelection(): void {
    bulkCount.setText(`${selected.size} selected`);
    bodyEl.querySelectorAll<HTMLElement>("[data-path]").forEach((el) => {
      const path = el.dataset.path;
      if (path !== undefined) el.toggleClass("is-selected", selectMode && selected.has(path));
    });
  }

  function toggleSelectMode(): void {
    selectMode = !selectMode;
    selected.clear();
    selectBtn.toggleClass("is-active", selectMode);
    bulkBar.toggleClass("is-hidden", !selectMode);
    root.toggleClass("fs-select-mode", selectMode);
    if (!selectMode) {
      tagInput.value = "";
      tagInput.removeClass("is-visible");
    }
    syncSelection();
  }

  async function bulkStatus(status: SpotStatus): Promise<void> {
    const paths = [...selected];
    let n = 0;
    for (const path of paths) {
      try {
        await plugin.store.updateSpot(path, { status });
        n++;
      } catch {
        /* keep going; store change events re-render as we go */
      }
    }
    new Notice(`Status set on ${n} spot${n === 1 ? "" : "s"}.`);
  }

  async function bulkTag(tag: string): Promise<void> {
    let n = 0;
    for (const path of [...selected]) {
      const spot = plugin.store.getByPath(path);
      if (!spot || spot.tags.includes(tag)) continue;
      try {
        await plugin.store.updateSpot(path, { tags: [...spot.tags, tag] });
        n++;
      } catch {
        /* keep going */
      }
    }
    new Notice(`Tag "${tag}" added to ${n} spot${n === 1 ? "" : "s"}.`);
  }

  async function bulkDelete(): Promise<void> {
    const n = selected.size;
    if (n === 0) return;
    const ok = await confirmModal(plugin.app, {
      title: `Delete ${n} spot${n === 1 ? "" : "s"}?`,
      body: `${n} note${n === 1 ? " is" : "s are"} moved to the trash and can be restored from there. Logged visits and notes go with them.`,
      cta: "Delete",
      danger: true,
    });
    if (!ok) return;
    let deleted = 0;
    for (const path of [...selected]) {
      try {
        await plugin.store.deleteSpot(path);
        deleted++;
      } catch {
        /* keep going */
      }
    }
    selected.clear();
    syncSelection();
    new Notice(`Deleted ${deleted} spot${deleted === 1 ? "" : "s"} — recoverable from the trash.`);
  }

  // -- location filter entry point (Places tab / view) ----------------------

  const controller: SpotsController = {
    applyLocation(loc: LocationFilter) {
      // A Places-node click means "show me EVERYTHING in this location" —
      // start from a clean slate so stale status/cuisine/favorite filters
      // can't make the result count disagree with the node badge.
      const next = cloneFilters(EMPTY_FILTER_STATE);
      next.excludedCountries = loc.country
        ? plugin.store.distinct("country").filter((c) => c !== loc.country)
        : [];
      next.excludedCities = loc.city
        ? ["", ...plugin.store.distinct("city").filter((c) => c !== loc.city)]
        : [];
      plugin.settings.filterState = next;
      query = loc.district ? `district:"${loc.district}"` : "";
      search.setValue(query);
      filtersCtl.sync();
      persist();
      renderResults();
    },
    setQuery(q: string) {
      plugin.settings.filterState = cloneFilters(EMPTY_FILTER_STATE);
      query = q;
      search.setValue(q);
      filtersCtl.sync();
      persist();
      renderResults();
    },
  };
  activeController = controller;

  // Handoff for the enrich modal's "Current Spots-tab filter" scope — reads
  // the live filtered result set. Removed on destroy so a closed view never
  // serves stale paths (the modal falls back to all spots when absent).
  const pathsCarrier = plugin as FoodSpotPluginApi & {
    getCurrentFilteredPaths?: () => string[];
  };
  const getFilteredPaths = (): string[] => currentResults.map((s) => s.path);
  pathsCarrier.getCurrentFilteredPaths = getFilteredPaths;

  // -- bulk-enrich progress bar (SPEC-v1.1 §2: bar in the Spots toolbar) ----
  // The enrich flow calls this hook to mount a non-blocking progress bar
  // (count, current name, Cancel) under the toolbar. Removed on destroy;
  // destroying the tab mid-run cancels the run so it never continues
  // invisibly.
  let activeEnrichSignal: { cancelled: boolean } | null = null;
  const enrichCarrier = plugin as FoodSpotPluginApi & {
    mountEnrichProgress?: MountEnrichProgress;
  };
  const mountEnrichProgress: MountEnrichProgress = (signal) => {
    if (activeEnrichSignal !== null) return null; // one bar at a time
    activeEnrichSignal = signal;
    enrichBar.empty();
    enrichBar.removeClass("is-hidden");
    const track = enrichBar.createDiv({ cls: "fs-progress-track" });
    const fill = track.createDiv({ cls: "fs-progress-fill" });
    const meta = enrichBar.createDiv({ cls: "fs-enrich-progress-meta" });
    const count = meta.createSpan({ cls: "fs-enrich-count" });
    const name = meta.createSpan({ cls: "fs-enrich-current" });
    const cancel = enrichBar.createEl("button", { cls: "fs-btn", text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => {
      signal.cancelled = true;
      cancel.disabled = true;
      cancel.setText("Cancelling…");
    });
    return {
      update(done, total, current) {
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        fill.style.width = `${pct}%`;
        count.setText(`Enriching ${done} / ${total}`);
        name.setText(current);
      },
      finish() {
        if (activeEnrichSignal === signal) activeEnrichSignal = null;
        enrichBar.addClass("is-hidden");
        enrichBar.empty();
      },
    };
  };
  enrichCarrier.mountEnrichProgress = mountEnrichProgress;

  renderResults();

  return {
    refresh: () => renderResults(),
    destroy: () => {
      if (activeController === controller) activeController = null;
      if (pathsCarrier.getCurrentFilteredPaths === getFilteredPaths) {
        delete pathsCarrier.getCurrentFilteredPaths;
      }
      if (enrichCarrier.mountEnrichProgress === mountEnrichProgress) {
        delete enrichCarrier.mountEnrichProgress;
      }
      // A run whose bar lives here must not keep going with no visible UI.
      if (activeEnrichSignal !== null) {
        activeEnrichSignal.cancelled = true;
        activeEnrichSignal = null;
      }
      filtersCtl.destroy();
      renderer?.destroy();
      renderer = null;
      bodyEl.removeEventListener("click", onBodyClickCapture, { capture: true });
      void plugin.saveSettings();
      root.remove();
    },
  };
}
