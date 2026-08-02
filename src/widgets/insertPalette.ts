/**
 * Food Spot — widget insert palette.
 *
 * FuzzySuggestModal of labeled widget variants; each inserts a FILLED example
 * fence at the cursor, using real values from the user's library (most common
 * city / cuisine) when available.
 */
import { Editor, FuzzySuggestModal, Plugin } from "obsidian";
import type { FoodSpotPluginApi } from "../types";

type FoodSpotPlugin = Plugin & FoodSpotPluginApi;

interface VariantCtx {
  city: string;
  cuisine: string;
}

interface WidgetVariant {
  label: string;
  make(ctx: VariantCtx): string;
}

function mostCommon(values: string[], fallback: string): string {
  const counts = new Map<string, number>();
  for (const v of values) {
    const k = v.trim();
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let best = fallback;
  let bestN = 0;
  for (const [k, n] of counts) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  return best;
}

function fence(lines: string[]): string {
  return "```foodspot\n" + lines.join("\n") + "\n```\n";
}

const VARIANTS: WidgetVariant[] = [
  {
    label: "Cards — want-to-try in a city",
    make: (c) =>
      fence([
        "view: cards",
        "status: want-to-try",
        `city: ${c.city}`,
        "sort: date-added",
        "direction: desc",
        "limit: 12",
      ]),
  },
  {
    label: "Random — where do we eat tonight?",
    make: () => fence(["view: random", "status: want-to-try"]),
  },
  {
    label: "Stat — visited ratio",
    make: () => fence(["view: stat", "stat: visited-ratio"]),
  },
  {
    label: "Table — top rated",
    make: () =>
      fence([
        "view: table",
        "status: visited",
        "minRating: 4",
        "sort: rating",
        "direction: desc",
        "limit: 10",
      ]),
  },
  {
    label: "Shortlist — city wishlist",
    make: (c) => fence(["view: shortlist", `city: ${c.city}`, "limit: 15"]),
  },
  {
    label: "List — by cuisine",
    make: (c) =>
      fence(["view: list", `cuisine: ${c.cuisine}`, "sort: name", "direction: asc"]),
  },
];

class WidgetPaletteModal extends FuzzySuggestModal<WidgetVariant> {
  constructor(
    private plugin: FoodSpotPlugin,
    private editor: Editor,
  ) {
    super(plugin.app);
    this.setPlaceholder("Insert a Food Spot widget…");
  }

  getItems(): WidgetVariant[] {
    return VARIANTS;
  }

  getItemText(item: WidgetVariant): string {
    return item.label;
  }

  onChooseItem(item: WidgetVariant): void {
    let spots: { city?: string; cuisines: string[] }[] = [];
    try {
      spots = this.plugin.store.getSpots();
    } catch {
      // Store not ready — fall back to defaults below.
    }
    const ctx: VariantCtx = {
      city: mostCommon(spots.map((s) => s.city ?? ""), "Amsterdam"),
      cuisine: mostCommon(spots.flatMap((s) => s.cuisines), "Italian"),
    };
    this.editor.replaceSelection(item.make(ctx));
  }
}

export function openWidgetPalette(plugin: FoodSpotPlugin, editor: Editor): void {
  new WidgetPaletteModal(plugin, editor).open();
}
