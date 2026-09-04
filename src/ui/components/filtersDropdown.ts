/**
 * Food Spot — filters dropdown (WatchLog exclusion-set model) + the single
 * saved filter preset.
 *
 * Every facet value is ON by default; clicking a chip toggles its membership
 * in the exclusion set. "" (strings) and 0 (price) encode the "Empty"
 * specials. Favorites is an independent toggle; minimum rating never hides
 * unrated spots (enforced in search/query.ts).
 */
import { App, Menu, Modal, Notice, setIcon } from "obsidian";
import type {
  ClosedFilter,
  FoodSpotPluginApi,
  SavedFilterPreset,
  SortSpec,
  SpotFilterState,
} from "../../types";
import { EMPTY_FILTER_STATE } from "../../types";
import { iconButton } from "./toolbar";

const EMPTY_LABEL = "(empty)";

export function cloneFilters(f: SpotFilterState): SpotFilterState {
  return {
    excludedStatuses: [...f.excludedStatuses],
    excludedCuisines: [...f.excludedCuisines],
    excludedCountries: [...f.excludedCountries],
    excludedCities: [...f.excludedCities],
    excludedPrices: [...f.excludedPrices],
    minRating: f.minRating,
    favoritesOnly: f.favoritesOnly,
    // Saved presets and settings written before this facet existed have no
    // `closed` at all — normalize here so every consumer sees a real value.
    closed: f.closed ?? "any",
  };
}

export function isFilterActive(f: SpotFilterState): boolean {
  return (
    f.favoritesOnly ||
    (f.closed ?? "any") !== "any" ||
    f.minRating > 0 ||
    f.excludedStatuses.length > 0 ||
    f.excludedCuisines.length > 0 ||
    f.excludedCountries.length > 0 ||
    f.excludedCities.length > 0 ||
    f.excludedPrices.length > 0
  );
}

export interface FiltersControlOpts {
  getState(): SpotFilterState;
  /** Caller persists the state and re-renders results. */
  setState(next: SpotFilterState): void;
  /**
   * Full-width host for the filter panel (a drawer under the toolbar).
   * Falls back to a narrow popup anchored at the button when absent.
   */
  panelHost?: HTMLElement;
  /** Current query + sort, captured when saving a preset. */
  presetContext(): { query: string; sort: SortSpec; secondarySort?: SortSpec };
  applyPreset(preset: SavedFilterPreset): void;
}

export interface FiltersControl {
  el: HTMLElement;
  /** Update active dot / clear button after external state changes. */
  sync(): void;
  destroy(): void;
}

class PresetNameModal extends Modal {
  private onSubmit: (name: string) => void;

  constructor(app: App, onSubmit: (name: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    this.titleEl.setText("Save filter preset");
    const c = this.contentEl;
    c.createEl("p", {
      cls: "fs-preset-hint",
      text: "Saves the current search, filters and sort as your preset.",
    });
    const input = c.createEl("input", {
      cls: "fs-preset-name-input",
      attr: { type: "text", placeholder: "Preset name" },
    });
    const actions = c.createDiv({ cls: "fs-empty-actions" });
    const save = actions.createEl("button", { cls: "fs-btn fs-btn-accent", text: "Save" });
    const submit = (): void => {
      const name = input.value.trim();
      if (!name) {
        input.addClass("fs-input-invalid");
        input.focus();
        return;
      }
      this.close();
      this.onSubmit(name);
    };
    save.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
    window.setTimeout(() => input.focus(), 0);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export function buildFiltersControl(
  parent: HTMLElement,
  plugin: FoodSpotPluginApi,
  opts: FiltersControlOpts
): FiltersControl {
  const wrap = parent.createDiv({ cls: "fs-filters-wrap" });

  const filterBtn = wrap.createEl("button", {
    cls: "fs-btn fs-filters-btn",
    attr: { "aria-label": "Filters", title: "Filters" },
  });
  const fbIcon = filterBtn.createSpan({ cls: "fs-btn-icon" });
  setIcon(fbIcon, "filter");
  filterBtn.createSpan({ cls: "fs-btn-label", text: "Filters" });
  filterBtn.createSpan({ cls: "fs-filter-dot" });

  const clearBtn = wrap.createEl("button", {
    cls: "fs-btn fs-filter-clear",
    attr: { "aria-label": "Reset filters — show all spots", title: "Reset filters — show all spots" },
  });
  setIcon(clearBtn, "x");

  const presetBtn = iconButton(wrap, {
    icon: "bookmark",
    label: "Filter preset",
    onClick: (e) => openPresetMenu(e),
  });

  let panelEl: HTMLElement | null = null;

  const sync = (): void => {
    const active = isFilterActive(opts.getState());
    filterBtn.toggleClass("has-active", active);
    clearBtn.toggleClass("is-visible", active);
    presetBtn.toggleClass("is-active", !!plugin.settings.savedPreset);
  };

  const commit = (next: SpotFilterState): void => {
    opts.setState(next);
    sync();
  };

  clearBtn.addEventListener("click", () => {
    commit(cloneFilters(EMPTY_FILTER_STATE));
    if (panelEl) rebuildPanel();
  });

  // -- panel ---------------------------------------------------------------

  const onDocPointerDown = (e: PointerEvent): void => {
    const t = e.target as Node;
    if (panelEl && !wrap.contains(t) && !panelEl.contains(t)) closePanel();
  };
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") closePanel();
  };

  function closePanel(): void {
    if (!panelEl) return;
    panelEl.remove();
    panelEl = null;
    document.removeEventListener("pointerdown", onDocPointerDown, true);
    document.removeEventListener("keydown", onKeyDown, true);
  }

  function openPanel(): void {
    if (panelEl) {
      closePanel();
      return;
    }
    buildPanel();
    document.addEventListener("pointerdown", onDocPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
  }

  function rebuildPanel(): void {
    if (!panelEl) return;
    panelEl.remove();
    panelEl = null;
    buildPanel();
  }

  filterBtn.addEventListener("click", () => openPanel());

  interface FacetOpt {
    value: string | number;
    label: string;
  }

  function buildPanel(): void {
    const host = opts.panelHost ?? wrap;
    panelEl = host.createDiv({
      cls: opts.panelHost ? "fs-filter-panel fs-filter-drawer" : "fs-filter-panel",
    });
    const panel = panelEl;

    // Top bar: global starting points. "Show all" = no filtering; "Hide all"
    // = blank slate, then tapping chips builds the list up from nothing.
    const topbar = panel.createDiv({ cls: "fs-filter-topbar" });
    topbar.createSpan({ cls: "fs-filter-topbar-hint", text: "Start from:" });
    const showAllBtn = topbar.createEl("button", { cls: "fs-btn fs-small-btn", text: "Show all" });
    const hideAllBtn = topbar.createEl("button", { cls: "fs-btn fs-small-btn", text: "Hide all" });
    showAllBtn.addEventListener("click", () => {
      const next = cloneFilters(opts.getState());
      next.excludedStatuses = [];
      next.excludedCuisines = [];
      next.excludedCountries = [];
      next.excludedCities = [];
      next.excludedPrices = [];
      commit(next);
      rebuildPanel();
    });
    hideAllBtn.addEventListener("click", () => {
      const next = cloneFilters(opts.getState());
      next.excludedStatuses = ["want-to-try", "visited"];
      next.excludedCuisines = [...plugin.store.distinct("cuisines"), ""];
      next.excludedCountries = [...plugin.store.distinct("country"), ""];
      next.excludedCities = [...plugin.store.distinct("city"), ""];
      next.excludedPrices = [1, 2, 3, 4, 0];
      commit(next);
      rebuildPanel();
    });

    // A filter chip with an explicit check mark — on/off must be obvious.
    const makeChip = (parentEl: HTMLElement, label: string): HTMLElement => {
      const chip = parentEl.createEl("button", { cls: "fs-filter-chip" });
      const check = chip.createSpan({ cls: "fs-chip-check" });
      setIcon(check, "check");
      chip.createSpan({ text: label });
      return chip;
    };

    // Favorites — independent toggle
    const favRow = panel.createDiv({ cls: "fs-filter-favrow" });
    const favChip = favRow.createEl("button", { cls: "fs-filter-chip fs-filter-fav" });
    const favIcon = favChip.createSpan({ cls: "fs-btn-icon" });
    setIcon(favIcon, "star");
    favChip.createSpan({ text: "Favorites only" });
    favChip.toggleClass("is-on", opts.getState().favoritesOnly);
    favChip.addEventListener("click", () => {
      const next = cloneFilters(opts.getState());
      next.favoritesOnly = !next.favoritesOnly;
      commit(next);
      favChip.toggleClass("is-on", next.favoritesOnly);
    });

    // Minimum rating
    const ratingSec = panel.createDiv({ cls: "fs-filter-section" });
    const rHead = ratingSec.createDiv({ cls: "fs-filter-section-head" });
    rHead.createSpan({ text: "Minimum rating" });
    const rChips = ratingSec.createDiv({ cls: "fs-filter-chips" });
    const ratingOptions = plugin.settings.halfStarRatings
      ? [0, 1, 2, 3, 3.5, 4, 4.5, 5]
      : [0, 1, 2, 3, 4, 5];
    const ratingChipEls: HTMLElement[] = [];
    for (const r of ratingOptions) {
      const chip = makeChip(rChips, r === 0 ? "Any" : `${r}+`);
      chip.toggleClass("is-on", opts.getState().minRating === r);
      chip.addEventListener("click", () => {
        const next = cloneFilters(opts.getState());
        next.minRating = r;
        commit(next);
        for (const el of ratingChipEls) el.removeClass("is-on");
        chip.addClass("is-on");
      });
      ratingChipEls.push(chip);
    }
    ratingSec.createDiv({
      cls: "fs-filter-note",
      text: "Unrated spots are always shown.",
    });

    // Permanently closed — single-choice, same shape as Minimum rating. The
    // library keeps closed places on purpose (they are still places you have
    // been), so "Include" is the default and the other two are the views:
    // "where can I eat tonight" and "the graveyard".
    const closedSec = panel.createDiv({ cls: "fs-filter-section" });
    closedSec
      .createDiv({ cls: "fs-filter-section-head" })
      .createSpan({ text: "Permanently closed" });
    const cChips = closedSec.createDiv({ cls: "fs-filter-chips" });
    const closedOptions: { value: ClosedFilter; label: string }[] = [
      { value: "any", label: "Include" },
      { value: "hide", label: "Hide" },
      { value: "only", label: "Only closed" },
    ];
    const closedChipEls: HTMLElement[] = [];
    for (const o of closedOptions) {
      const chip = makeChip(cChips, o.label);
      chip.toggleClass("is-on", (opts.getState().closed ?? "any") === o.value);
      chip.addEventListener("click", () => {
        const next = cloneFilters(opts.getState());
        next.closed = o.value;
        commit(next);
        for (const el of closedChipEls) el.removeClass("is-on");
        chip.addClass("is-on");
      });
      closedChipEls.push(chip);
    }
    closedSec.createDiv({
      cls: "fs-filter-note",
      text: "Marked from Google when a pull finds the listing closed.",
    });

    // Exclusion-set facets
    const facetSection = (
      title: string,
      options: FacetOpt[],
      isExcluded: (v: string | number) => boolean,
      toggle: (v: string | number) => SpotFilterState,
      includeAll: () => SpotFilterState,
      excludeAll: () => SpotFilterState
    ): void => {
      if (options.length === 0) return;
      const sec = panel.createDiv({ cls: "fs-filter-section" });
      const head = sec.createDiv({ cls: "fs-filter-section-head" });
      head.createSpan({ text: title });
      const headBtns = head.createDiv({ cls: "fs-filter-head-btns" });
      const allBtn = headBtns.createEl("button", { cls: "fs-filter-all", text: "Select all" });
      const noneBtn = headBtns.createEl("button", { cls: "fs-filter-all", text: "Deselect all" });
      const chipsEl = sec.createDiv({ cls: "fs-filter-chips" });
      const chipByValue = new Map<string | number, HTMLElement>();
      for (const o of options) {
        const chip = makeChip(chipsEl, o.label);
        chip.toggleClass("is-on", !isExcluded(o.value));
        chip.addEventListener("click", () => {
          commit(toggle(o.value));
          chip.toggleClass("is-on", !isExcluded(o.value));
        });
        chipByValue.set(o.value, chip);
      }
      allBtn.addEventListener("click", () => {
        commit(includeAll());
        for (const chip of chipByValue.values()) chip.addClass("is-on");
      });
      noneBtn.addEventListener("click", () => {
        commit(excludeAll());
        for (const chip of chipByValue.values()) chip.removeClass("is-on");
      });
    };

    const toggleStr = (arr: string[], v: string): string[] =>
      arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
    const toggleNum = (arr: number[], v: number): number[] =>
      arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

    facetSection(
      "Status",
      [
        { value: "want-to-try", label: "Want to try" },
        { value: "visited", label: "Visited" },
      ],
      (v) => opts.getState().excludedStatuses.includes(String(v)),
      (v) => {
        const next = cloneFilters(opts.getState());
        next.excludedStatuses = toggleStr(next.excludedStatuses, String(v));
        return next;
      },
      () => {
        const next = cloneFilters(opts.getState());
        next.excludedStatuses = [];
        return next;
      },
      () => {
        const next = cloneFilters(opts.getState());
        next.excludedStatuses = ["want-to-try", "visited"];
        return next;
      }
    );

    const strFacet = (
      title: string,
      values: string[],
      get: (f: SpotFilterState) => string[],
      set: (f: SpotFilterState, arr: string[]) => void
    ): void => {
      const options: FacetOpt[] = values.map((v) => ({ value: v, label: v }));
      options.push({ value: "", label: EMPTY_LABEL });
      facetSection(
        title,
        options,
        (v) => get(opts.getState()).includes(String(v)),
        (v) => {
          const next = cloneFilters(opts.getState());
          set(next, toggleStr(get(next), String(v)));
          return next;
        },
        () => {
          const next = cloneFilters(opts.getState());
          set(next, []);
          return next;
        },
        () => {
          const next = cloneFilters(opts.getState());
          set(next, [...values, ""]);
          return next;
        }
      );
    };

    strFacet(
      "Cuisine",
      plugin.store.distinct("cuisines"),
      (f) => f.excludedCuisines,
      (f, arr) => {
        f.excludedCuisines = arr;
      }
    );
    strFacet(
      "Country",
      plugin.store.distinct("country"),
      (f) => f.excludedCountries,
      (f, arr) => {
        f.excludedCountries = arr;
      }
    );
    strFacet(
      "City",
      plugin.store.distinct("city"),
      (f) => f.excludedCities,
      (f, arr) => {
        f.excludedCities = arr;
      }
    );

    const symbol = plugin.settings.currencySymbol || "€";
    facetSection(
      "Price",
      [
        { value: 1, label: symbol },
        { value: 2, label: symbol.repeat(2) },
        { value: 3, label: symbol.repeat(3) },
        { value: 4, label: symbol.repeat(4) },
        { value: 0, label: "No price" },
      ],
      (v) => opts.getState().excludedPrices.includes(Number(v)),
      (v) => {
        const next = cloneFilters(opts.getState());
        next.excludedPrices = toggleNum(next.excludedPrices, Number(v));
        return next;
      },
      () => {
        const next = cloneFilters(opts.getState());
        next.excludedPrices = [];
        return next;
      },
      () => {
        const next = cloneFilters(opts.getState());
        next.excludedPrices = [1, 2, 3, 4, 0];
        return next;
      }
    );

    // Footer: clear everything
    const footer = panel.createDiv({ cls: "fs-filter-footer" });
    const clearAll = footer.createEl("button", { cls: "fs-btn", text: "Reset — show all" });
    clearAll.addEventListener("click", () => {
      commit(cloneFilters(EMPTY_FILTER_STATE));
      rebuildPanel();
    });
  }

  // -- preset --------------------------------------------------------------

  async function savePreset(name: string): Promise<void> {
    const ctx = opts.presetContext();
    plugin.settings.savedPreset = {
      name,
      query: ctx.query,
      filters: cloneFilters(opts.getState()),
      sort: { ...ctx.sort },
      secondarySort: ctx.secondarySort ? { ...ctx.secondarySort } : undefined,
    };
    await plugin.saveSettings();
    sync();
    new Notice(`Preset "${name}" saved.`);
  }

  function openPresetMenu(e: MouseEvent): void {
    const menu = new Menu();
    const preset = plugin.settings.savedPreset;
    if (preset) {
      menu.addItem((i) =>
        i
          .setTitle(`Apply "${preset.name}"`)
          .setIcon("bookmark-check")
          .onClick(() => opts.applyPreset(preset))
      );
      menu.addItem((i) =>
        i
          .setTitle("Overwrite with current view")
          .setIcon("save")
          .onClick(() => void savePreset(preset.name))
      );
      menu.addItem((i) =>
        i
          .setTitle("Remove preset")
          .setIcon("bookmark-x")
          .onClick(async () => {
            plugin.settings.savedPreset = undefined;
            await plugin.saveSettings();
            sync();
            new Notice("Preset removed.");
          })
      );
    } else {
      menu.addItem((i) =>
        i
          .setTitle("Save current view as preset…")
          .setIcon("bookmark-plus")
          .onClick(() => new PresetNameModal(plugin.app, (name) => void savePreset(name)).open())
      );
    }
    menu.showAtMouseEvent(e);
  }

  sync();
  return {
    el: wrap,
    sync,
    destroy: () => closePanel(),
  };
}
