/**
 * Food Spot — Visits tab: virtualized timeline grouped by day. Rating-colored
 * dot + connector line per visit, spot name → detail modal, stars, spent
 * (currency symbol from settings), note text. "Log visit" button on top.
 */
import { setIcon } from "obsidian";
import type {
  DateFormat,
  FoodSpot,
  FoodSpotPluginApi,
  TabHandle,
  Visit,
} from "../../types";
import { fmtRating, relTime, tierFor } from "../components/card";
import { createVirtualList } from "../components/virtualGrid";
import type { VirtualHandle } from "../components/virtualGrid";
import { iconButton } from "../components/toolbar";
import { renderDishThumbs } from "../components/dishPhotos";
import { openDetailModal } from "../modals/detail";
import { openLogVisitPicker } from "../modals/logVisit";

type TimelineItem =
  | { kind: "day"; date: string; count: number }
  | { kind: "visit"; spot: FoodSpot; visit: Visit };

const DAY_ROW_HEIGHT = 44;
const VISIT_ROW_HEIGHT = 76;

function fmtDate(iso: string, format: DateFormat): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  switch (format) {
    case "american":
      return `${m}/${d}/${y}`;
    case "iso":
      return iso;
    default:
      return `${d}-${m}-${y}`;
  }
}

export function mountVisitsTab(container: HTMLElement, plugin: FoodSpotPluginApi): TabHandle {
  const root = container.createDiv({ cls: "fs-visits" });

  const header = root.createDiv({ cls: "fs-visits-header" });
  header.createDiv({ cls: "fs-visits-title", text: "Visit timeline" });
  const countEl = header.createSpan({ cls: "fs-visits-count" });
  iconButton(header, {
    icon: "calendar-plus",
    label: "Log visit",
    text: "Log visit",
    cls: "fs-btn-accent fs-visits-log",
    onClick: () => openLogVisitPicker(plugin),
  });

  let emptyEl: HTMLElement | null = null;

  const list: VirtualHandle<TimelineItem> = createVirtualList<TimelineItem>(root, {
    itemHeight: (item) => (item.kind === "day" ? DAY_ROW_HEIGHT : VISIT_ROW_HEIGHT),
    render: (item, rowEl) => {
      if (item.kind === "day") {
        rowEl.addClass("fs-tl-day");
        rowEl.createSpan({
          cls: "fs-tl-day-date",
          text: fmtDate(item.date, plugin.settings.dateFormat),
        });
        rowEl.createSpan({ cls: "fs-tl-day-ago", text: relTime(item.date) });
        if (item.count > 1) {
          rowEl.createSpan({
            cls: "fs-tl-day-count",
            text: `${item.count} visits`,
          });
        }
        return;
      }
      const { spot, visit } = item;
      rowEl.addClass("fs-tl-row");
      const rail = rowEl.createDiv({ cls: "fs-tl-rail" });
      const dot = rail.createDiv({ cls: "fs-tl-dot" });
      if (visit.rating !== undefined) {
        const tier = tierFor(visit.rating, plugin.settings.ratingTiers);
        if (tier) dot.style.setProperty("--fs-tier", tier.color);
        dot.addClass("has-rating");
      }
      const body = rowEl.createDiv({ cls: "fs-tl-body" });
      const top = body.createDiv({ cls: "fs-tl-top" });
      const name = top.createEl("button", {
        cls: "fs-tl-name",
        text: spot.name,
        attr: { "aria-label": `Open ${spot.name}` },
      });
      name.addEventListener("click", (e) => {
        e.stopPropagation();
        openDetailModal(plugin, spot.path);
      });
      if (visit.rating !== undefined) {
        const stars = top.createSpan({ cls: "fs-tl-stars" });
        const star = stars.createSpan({ cls: "fs-star-icon" });
        setIcon(star, "star");
        stars.createSpan({ text: fmtRating(visit.rating) });
        const tier = tierFor(visit.rating, plugin.settings.ratingTiers);
        if (tier) stars.style.setProperty("--fs-tier", tier.color);
      }
      if (visit.spent !== undefined) {
        top.createSpan({
          cls: "fs-tl-spent",
          text: `${plugin.settings.currencySymbol}${visit.spent}`,
        });
      }
      if (visit.note) {
        body.createDiv({ cls: "fs-tl-note", text: visit.note });
      }
      renderDishThumbs(body, plugin, visit.photos ?? [], spot.path);
    },
  });

  function collect(): { items: TimelineItem[]; total: number } {
    const entries: { spot: FoodSpot; visit: Visit }[] = [];
    for (const spot of plugin.store.getSpots()) {
      for (const visit of spot.visits) {
        if (visit.date) entries.push({ spot, visit });
      }
    }
    entries.sort(
      (a, b) =>
        b.visit.date.localeCompare(a.visit.date) || a.spot.name.localeCompare(b.spot.name)
    );
    const items: TimelineItem[] = [];
    let day: { kind: "day"; date: string; count: number } | null = null;
    for (const e of entries) {
      if (!day || day.date !== e.visit.date) {
        day = { kind: "day", date: e.visit.date, count: 0 };
        items.push(day);
      }
      day.count++;
      items.push({ kind: "visit", spot: e.spot, visit: e.visit });
    }
    return { items, total: entries.length };
  }

  function render(): void {
    const { items, total } = collect();
    countEl.setText(total > 0 ? `${total} visit${total === 1 ? "" : "s"}` : "");
    if (emptyEl) {
      emptyEl.remove();
      emptyEl = null;
    }
    list.el.toggleClass("is-hidden", total === 0);
    if (total === 0) {
      list.setItems([]);
      emptyEl = root.createDiv({ cls: "fs-empty" });
      const ic = emptyEl.createDiv({ cls: "fs-empty-icon" });
      setIcon(ic, "history");
      emptyEl.createDiv({ cls: "fs-empty-title", text: "No visits logged yet" });
      emptyEl.createDiv({
        cls: "fs-empty-text",
        text: "Log a visit and it lands on this timeline — with your rating, what you spent and what you ate.",
      });
      const actions = emptyEl.createDiv({ cls: "fs-empty-actions" });
      iconButton(actions, {
        icon: "calendar-plus",
        label: "Log your first visit",
        text: "Log your first visit",
        cls: "fs-btn-accent",
        onClick: () => openLogVisitPicker(plugin),
      });
      return;
    }
    list.setItems(items);
  }

  render();

  return {
    refresh: () => render(),
    destroy: () => {
      list.destroy();
      root.remove();
    },
  };
}
