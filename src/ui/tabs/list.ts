/**
 * Food Spot — List tab: the whole library as one editable table.
 *
 * Everything you change often is inline here — price, cuisine, your rating,
 * favorite — plus one-click access to the note and Google Maps. Edits write
 * straight to the note; a store change while a control has focus defers the
 * repaint so typing/selecting is never interrupted.
 */
import { Menu, Notice, setIcon } from "obsidian";
import type { FoodSpot, FoodSpotPluginApi, TabHandle } from "../../types";
import { EMPTY_FILTER_STATE } from "../../types";
import { buildSearchBox } from "../components/toolbar";
import { filterSpots } from "../../search/query";
import { starRating } from "../components/starRating";
import { openDetailModal } from "../modals/detail";
import { fmtRating } from "../components/card";

type SortKey = "name" | "city" | "cuisine" | "price" | "rating" | "google";

const CUSTOM = "__custom__";
const NONE = "__none__";

function mapsUrl(spot: FoodSpot): string {
  const q = spot.coordinates
    ? `${spot.coordinates.lat},${spot.coordinates.lng}`
    : [spot.name, spot.city, spot.country].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function mountListTab(container: HTMLElement, plugin: FoodSpotPluginApi): TabHandle {
  const root = container.createDiv({ cls: "fs-list-tab" });

  let query = "";
  let city = "";
  let cuisine = "";
  let status = "";
  let sortKey: SortKey = "name";
  let sortAsc = true;
  let pendingRefresh = false;

  // -- toolbar -------------------------------------------------------------
  const toolbar = root.createDiv({ cls: "fs-toolbar fs-list-toolbar" });
  buildSearchBox(toolbar, {
    placeholder: "Filter the list…",
    onQuery: (q) => {
      query = q;
      renderRows();
    },
  });

  const select = (label: string, onChange: (v: string) => void): HTMLSelectElement => {
    const el = toolbar.createEl("select", { cls: "dropdown fs-list-filter" });
    el.setAttribute("aria-label", label);
    el.addEventListener("change", () => onChange(el.value));
    return el;
  };
  const citySel = select("City", (v) => {
    city = v;
    renderRows();
  });
  const cuisineSel = select("Cuisine", (v) => {
    cuisine = v;
    renderRows();
  });
  const statusSel = select("Status", (v) => {
    status = v;
    renderRows();
  });

  const countEl = toolbar.createSpan({ cls: "fs-list-count" });

  // -- table ---------------------------------------------------------------
  const scroller = root.createDiv({ cls: "fs-list-scroll" });
  const table = scroller.createEl("table", { cls: "fs-list-table" });
  const thead = table.createEl("thead");
  const headRow = thead.createEl("tr");
  const COLS: { key?: SortKey; label: string; cls?: string }[] = [
    { key: "name", label: "Name" },
    { key: "cuisine", label: "Cuisine" },
    { key: "city", label: "City" },
    { key: "price", label: "Price" },
    { key: "rating", label: "My rating" },
    { key: "google", label: "Google" },
    { label: "★", cls: "fs-col-fav" },
    { label: "", cls: "fs-col-actions" },
  ];
  for (const col of COLS) {
    const th = headRow.createEl("th", { cls: col.cls });
    if (!col.key) {
      th.setText(col.label);
      continue;
    }
    const btn = th.createEl("button", { cls: "fs-list-sort", text: col.label });
    btn.type = "button";
    const arrow = btn.createSpan({ cls: "fs-list-arrow" });
    const paint = (): void => {
      arrow.setText(sortKey === col.key ? (sortAsc ? " ↑" : " ↓") : "");
    };
    paint();
    btn.addEventListener("click", () => {
      if (sortKey === col.key) sortAsc = !sortAsc;
      else {
        sortKey = col.key as SortKey;
        sortAsc = col.key === "name" || col.key === "city" || col.key === "cuisine";
      }
      renderRows();
    });
  }
  const tbody = table.createEl("tbody");

  // -- data ----------------------------------------------------------------
  function visible(): FoodSpot[] {
    const all = plugin.store.getSpots();
    let rows = filterSpots(all, query, EMPTY_FILTER_STATE);
    if (city) rows = rows.filter((s) => (s.city ?? "").trim() === city);
    if (cuisine) rows = rows.filter((s) => s.cuisines.includes(cuisine));
    if (status === "favorite") rows = rows.filter((s) => s.favorite);
    else if (status) rows = rows.filter((s) => s.status === status);

    const dir = sortAsc ? 1 : -1;
    const cmp: Record<SortKey, (a: FoodSpot, b: FoodSpot) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      city: (a, b) => (a.city ?? "").localeCompare(b.city ?? "") || a.name.localeCompare(b.name),
      cuisine: (a, b) =>
        (a.cuisines[0] ?? "").localeCompare(b.cuisines[0] ?? "") || a.name.localeCompare(b.name),
      price: (a, b) => (a.price ?? 0) - (b.price ?? 0) || a.name.localeCompare(b.name),
      rating: (a, b) => (a.rating ?? 0) - (b.rating ?? 0) || a.name.localeCompare(b.name),
      google: (a, b) =>
        (a.external.googleRating ?? 0) - (b.external.googleRating ?? 0) ||
        a.name.localeCompare(b.name),
    };
    return [...rows].sort((a, b) => cmp[sortKey](a, b) * dir);
  }

  function syncFilterOptions(): void {
    const fill = (
      el: HTMLSelectElement,
      allLabel: string,
      values: string[],
      current: string
    ): void => {
      const wanted = [allLabel, ...values].join("|");
      if (el.dataset.filled === wanted) {
        el.value = current;
        return;
      }
      el.dataset.filled = wanted;
      el.empty();
      el.createEl("option", { text: allLabel, value: "" });
      for (const v of values) el.createEl("option", { text: v, value: v });
      el.value = current;
    };
    fill(citySel, "All cities", plugin.store.distinct("city"), city);
    fill(cuisineSel, "All cuisines", plugin.store.distinct("cuisines"), cuisine);
    if (statusSel.options.length === 0) {
      statusSel.createEl("option", { text: "All statuses", value: "" });
      statusSel.createEl("option", { text: "Want to try", value: "want-to-try" });
      statusSel.createEl("option", { text: "Visited", value: "visited" });
      statusSel.createEl("option", { text: "Favorites", value: "favorite" });
    }
    statusSel.value = status;
  }

  // -- row rendering -------------------------------------------------------
  function renderRows(): void {
    syncFilterOptions();
    for (const th of Array.from(headRow.querySelectorAll(".fs-list-arrow"))) {
      // Arrows repaint via the header buttons' own closures on click; keep the
      // DOM honest after a programmatic sort change.
      th.setText("");
    }
    const headerButtons = Array.from(headRow.querySelectorAll<HTMLElement>(".fs-list-sort"));
    COLS.filter((c) => c.key).forEach((col, i) => {
      const arrow = headerButtons[i]?.querySelector(".fs-list-arrow");
      if (arrow) arrow.setText(sortKey === col.key ? (sortAsc ? " ↑" : " ↓") : "");
    });

    const rows = visible();
    const total = plugin.store.getSpots().length;
    countEl.setText(`${rows.length} of ${total}`);
    tbody.empty();

    if (rows.length === 0) {
      const tr = tbody.createEl("tr");
      const td = tr.createEl("td", { attr: { colspan: String(COLS.length) } });
      td.createDiv({
        cls: "fs-list-empty",
        text: total === 0 ? "No spots yet." : "Nothing matches these filters.",
      });
      return;
    }
    for (const spot of rows) renderRow(spot);
  }

  function renderRow(spot: FoodSpot): void {
    const tr = tbody.createEl("tr", { cls: "fs-list-row" });

    // Name -> detail modal
    const nameTd = tr.createEl("td", { cls: "fs-list-name" });
    const nameBtn = nameTd.createEl("button", { cls: "fs-list-link", text: spot.name });
    nameBtn.type = "button";
    nameBtn.addEventListener("click", () => openDetailModal(plugin, spot.path));
    if (spot.status === "visited") {
      const dot = nameTd.createSpan({ cls: "fs-status-dot" });
      dot.style.setProperty("--fs-status", plugin.settings.statusColors.visited);
      dot.title = "Visited";
    }

    // Cuisine (primary) dropdown
    const cuisineTd = tr.createEl("td");
    const cSel = cuisineTd.createEl("select", { cls: "dropdown fs-list-cell-select" });
    const known = plugin.store.distinct("cuisines");
    cSel.createEl("option", { text: "—", value: NONE });
    const primary = spot.cuisines[0] ?? "";
    for (const c of known) cSel.createEl("option", { text: c, value: c });
    if (primary && !known.includes(primary)) cSel.createEl("option", { text: primary, value: primary });
    cSel.createEl("option", { text: "Something else…", value: CUSTOM });
    cSel.value = primary || NONE;
    if (spot.cuisines.length > 1) cSel.title = spot.cuisines.join(", ");
    cSel.addEventListener("change", () => {
      const rest = spot.cuisines.slice(1);
      if (cSel.value === CUSTOM) {
        const input = window.prompt("New cuisine", "");
        if (input === null || input.trim() === "") {
          cSel.value = primary || NONE;
          return;
        }
        void save(spot, { cuisines: [input.trim(), ...rest] });
        return;
      }
      const next = cSel.value === NONE ? rest : [cSel.value, ...rest];
      void save(spot, { cuisines: next });
    });

    tr.createEl("td", { cls: "fs-list-city", text: spot.city ?? "" });

    // Price dropdown
    const priceTd = tr.createEl("td");
    const pSel = priceTd.createEl("select", { cls: "dropdown fs-list-cell-select fs-list-price" });
    const symbol = plugin.settings.currencySymbol || "€";
    pSel.createEl("option", { text: "—", value: "" });
    for (let t = 1; t <= 4; t++) pSel.createEl("option", { text: symbol.repeat(t), value: String(t) });
    pSel.value = spot.price ? String(spot.price) : "";
    pSel.addEventListener("change", () => {
      void save(spot, { price: pSel.value === "" ? undefined : Number(pSel.value) });
    });

    // My rating
    const ratingTd = tr.createEl("td", { cls: "fs-list-rating" });
    starRating(ratingTd, {
      value: spot.rating,
      halfSteps: plugin.settings.halfStarRatings,
      tiers: plugin.settings.ratingTiers,
      onChange: (v) => {
        void save(spot, v > 0 ? { rating: v, ratingLocked: true } : { rating: undefined });
      },
    });

    // Google rating (read-only)
    const g = spot.external.googleRating;
    tr.createEl("td", {
      cls: "fs-list-google",
      text: g !== undefined ? fmtRating(g) : "",
    });

    // Favorite
    const favTd = tr.createEl("td", { cls: "fs-col-fav" });
    const fav = favTd.createEl("button", {
      cls: "fs-list-fav",
      attr: { "aria-label": spot.favorite ? "Remove favorite" : "Mark favorite" },
    });
    fav.type = "button";
    setIcon(fav, "star");
    fav.toggleClass("is-active", spot.favorite);
    fav.style.setProperty("--fs-fav", plugin.settings.statusColors.favorite);
    fav.addEventListener("click", () => void save(spot, { favorite: !spot.favorite }));

    // Actions
    const actTd = tr.createEl("td", { cls: "fs-col-actions" });
    const action = (icon: string, label: string, fn: () => void): void => {
      const b = actTd.createEl("button", { cls: "fs-list-action", attr: { "aria-label": label } });
      b.type = "button";
      b.title = label;
      setIcon(b, icon);
      b.addEventListener("click", fn);
    };
    action("file-text", "Open note", () => void plugin.store.openNote(spot.path));
    action("map-pin", "Open in Google Maps", () => window.open(mapsUrl(spot), "_blank"));
    const moreBtn = actTd.createEl("button", {
      cls: "fs-list-action",
      attr: { "aria-label": "More" },
    });
    moreBtn.type = "button";
    moreBtn.title = "More";
    setIcon(moreBtn, "more-vertical");
    moreBtn.addEventListener("click", (ev) => {
      const menu = new Menu();
      menu.addItem((i) =>
        i
          .setTitle(spot.status === "visited" ? "Mark want to try" : "Mark visited")
          .setIcon("check")
          .onClick(() =>
            void save(spot, { status: spot.status === "visited" ? "want-to-try" : "visited" })
          )
      );
      if (spot.url) {
        const url = spot.url;
        menu.addItem((i) =>
          i.setTitle("Open website").setIcon("globe").onClick(() => window.open(url, "_blank"))
        );
      }
      menu.showAtMouseEvent(ev);
    });
  }

  async function save(spot: FoodSpot, patch: Parameters<typeof plugin.store.updateSpot>[1]): Promise<void> {
    try {
      await plugin.store.updateSpot(spot.path, patch);
    } catch (e) {
      new Notice(`Couldn't save — ${e instanceof Error ? e.message : String(e)}`);
      renderRows();
    }
  }

  /** Never repaint under the user's cursor while a control has focus. */
  function busy(): boolean {
    const ae = document.activeElement;
    return (
      ae instanceof HTMLElement &&
      root.contains(ae) &&
      (ae.tagName === "SELECT" || ae.tagName === "INPUT")
    );
  }

  // A deferred repaint lands as soon as the edited control loses focus.
  const onFocusOut = (): void => {
    window.setTimeout(() => {
      if (pendingRefresh && !busy()) {
        pendingRefresh = false;
        renderRows();
      }
    }, 120);
  };
  root.addEventListener("focusout", onFocusOut);

  renderRows();

  return {
    refresh: () => {
      if (busy()) {
        pendingRefresh = true;
        return;
      }
      renderRows();
    },
    destroy: () => {
      root.removeEventListener("focusout", onFocusOut);
      root.remove();
    },
  };
}
