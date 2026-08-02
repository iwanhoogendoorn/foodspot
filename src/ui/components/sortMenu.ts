/**
 * Food Spot — two-level sort control (primary + secondary keys, per-key
 * default directions; clicking the current key flips its direction).
 */
import { Menu, setIcon } from "obsidian";
import type { SortKey, SortSpec } from "../../types";

export const SORT_KEYS: SortKey[] = [
  "name",
  "rating",
  "external-rating",
  "price",
  "date-added",
  "last-visit",
  "visit-count",
];

export const SORT_LABELS: Record<SortKey, string> = {
  name: "Name",
  rating: "My rating",
  "external-rating": "Public rating",
  price: "Price",
  "date-added": "Date added",
  "last-visit": "Last visit",
  "visit-count": "Visit count",
};

export const SORT_DEFAULT_DIR: Record<SortKey, "asc" | "desc"> = {
  name: "asc",
  rating: "desc",
  "external-rating": "desc",
  price: "asc",
  "date-added": "desc",
  "last-visit": "desc",
  "visit-count": "desc",
};

export interface SortControl {
  el: HTMLElement;
  sync(): void;
}

export function buildSortButton(
  parent: HTMLElement,
  opts: {
    get(): { primary: SortSpec; secondary?: SortSpec };
    set(primary: SortSpec, secondary?: SortSpec): void;
  }
): SortControl {
  const btn = parent.createEl("button", {
    cls: "fs-btn fs-sort-btn",
    attr: { "aria-label": "Sort", title: "Sort" },
  });
  const iconEl = btn.createSpan({ cls: "fs-btn-icon" });
  const labelEl = btn.createSpan({ cls: "fs-btn-label" });

  const sync = (): void => {
    const { primary } = opts.get();
    setIcon(iconEl, primary.direction === "asc" ? "arrow-up-narrow-wide" : "arrow-down-wide-narrow");
    labelEl.setText(SORT_LABELS[primary.key] ?? "Sort");
  };

  const arrow = (spec: SortSpec | undefined, key: SortKey): string => {
    if (!spec || spec.key !== key) return "";
    return spec.direction === "asc" ? "  ↑" : "  ↓";
  };

  btn.addEventListener("click", (e) => {
    const { primary, secondary } = opts.get();
    const menu = new Menu();
    menu.addItem((i) => i.setTitle("Sort by").setDisabled(true));
    for (const key of SORT_KEYS) {
      menu.addItem((i) => {
        const isCurrent = primary.key === key;
        i.setTitle(`${SORT_LABELS[key]}${arrow(primary, key)}`)
          .setChecked(isCurrent)
          .onClick(() => {
            const next: SortSpec = isCurrent
              ? { key, direction: primary.direction === "asc" ? "desc" : "asc" }
              : { key, direction: SORT_DEFAULT_DIR[key] };
            opts.set(next, secondary?.key === key ? undefined : secondary);
            sync();
          });
      });
    }
    menu.addSeparator();
    menu.addItem((i) => i.setTitle("Then by").setDisabled(true));
    menu.addItem((i) =>
      i
        .setTitle("None")
        .setChecked(!secondary)
        .onClick(() => {
          opts.set(primary, undefined);
          sync();
        })
    );
    for (const key of SORT_KEYS) {
      if (key === primary.key) continue;
      menu.addItem((i) => {
        const isCurrent = secondary?.key === key;
        i.setTitle(`${SORT_LABELS[key]}${arrow(secondary, key)}`)
          .setChecked(!!isCurrent)
          .onClick(() => {
            const next: SortSpec =
              isCurrent && secondary
                ? { key, direction: secondary.direction === "asc" ? "desc" : "asc" }
                : { key, direction: SORT_DEFAULT_DIR[key] };
            opts.set(primary, next);
            sync();
          });
      });
    }
    menu.showAtMouseEvent(e);
  });

  sync();
  return { el: btn, sync };
}
