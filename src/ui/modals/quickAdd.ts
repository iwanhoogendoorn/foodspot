/**
 * Quick-add options for a Discover result: save it as want-to-try, or mark it
 * visited with a rating, price and (optionally) a first logged visit — without
 * opening the full edit form.
 *
 * A rating on a visited spot is stored as a real visit, so the derived rating,
 * visit count and last-visit date all follow the normal rules.
 */
import { Modal, Notice, setIcon } from "obsidian";
import type { FoodSpotPluginApi, SpotInput, SpotStatus } from "../../types";
import { starRating } from "../components/starRating";

export interface QuickAddResult {
  status: SpotStatus;
  rating?: number;
  price?: number;
  visit?: { date: string; spent?: number; note: string };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

class QuickAddModal extends Modal {
  private status: SpotStatus = "want-to-try";
  private rating = 0;
  private price?: number;
  private resolved = false;

  constructor(
    private readonly plugin: FoodSpotPluginApi,
    private readonly spotName: string,
    private readonly suggestedPrice: number | undefined,
    private readonly resolve: (r: QuickAddResult | null) => void
  ) {
    super(plugin.app);
    this.price = suggestedPrice;
  }

  override onOpen(): void {
    const { contentEl } = this;
    this.modalEl.addClass("fs-modal", "fs-quickadd-modal");
    this.titleEl.setText(`Add ${this.spotName}`);

    // --- status ---
    const statusRow = contentEl.createDiv({ cls: "fs-quickadd-row" });
    statusRow.createSpan({ cls: "fs-field-label", text: "Status" });
    const seg = statusRow.createDiv({ cls: "fs-segmented" });
    const buttons: Partial<Record<SpotStatus, HTMLButtonElement>> = {};
    const setStatus = (s: SpotStatus): void => {
      this.status = s;
      for (const [key, btn] of Object.entries(buttons)) {
        btn?.toggleClass("fs-active", key === s);
        if (key === s) {
          btn?.style.setProperty(
            "--fs-seg-active-color",
            s === "visited"
              ? this.plugin.settings.statusColors.visited
              : this.plugin.settings.statusColors.wantToTry
          );
        }
      }
      visitBox.toggleClass("is-hidden", s !== "visited");
    };
    for (const [value, label] of [
      ["want-to-try", "Want to try"],
      ["visited", "Been there"],
    ] as [SpotStatus, string][]) {
      const b = seg.createEl("button", { cls: "fs-seg-btn", text: label });
      b.type = "button";
      buttons[value] = b;
      b.addEventListener("click", () => setStatus(value));
    }

    // --- rating ---
    const ratingRow = contentEl.createDiv({ cls: "fs-quickadd-row" });
    ratingRow.createSpan({ cls: "fs-field-label", text: "Your rating" });
    starRating(ratingRow, {
      value: 0,
      halfSteps: this.plugin.settings.halfStarRatings,
      tiers: this.plugin.settings.ratingTiers,
      showLabel: true,
      onChange: (v) => {
        this.rating = v;
        if (v > 0 && this.status !== "visited") setStatus("visited");
      },
    });

    // --- price ---
    const priceRow = contentEl.createDiv({ cls: "fs-quickadd-row" });
    priceRow.createSpan({ cls: "fs-field-label", text: "Price" });
    const priceSeg = priceRow.createDiv({ cls: "fs-segmented fs-price-seg" });
    const symbol = this.plugin.settings.currencySymbol || "€";
    const priceBtns: HTMLButtonElement[] = [];
    const paintPrice = (): void => {
      priceBtns.forEach((b, i) => b.toggleClass("fs-active", this.price === i + 1));
    };
    for (let tier = 1; tier <= 4; tier++) {
      const b = priceSeg.createEl("button", { cls: "fs-seg-btn", text: symbol.repeat(tier) });
      b.type = "button";
      priceBtns.push(b);
      b.addEventListener("click", () => {
        this.price = this.price === tier ? undefined : tier; // click again clears
        paintPrice();
      });
    }
    paintPrice();
    if (this.suggestedPrice !== undefined) {
      priceRow.createSpan({ cls: "fs-field-hint", text: " from Google" });
    }

    // --- optional first visit (only meaningful once visited) ---
    const visitBox = contentEl.createDiv({ cls: "fs-quickadd-visit is-hidden" });
    visitBox.createDiv({ cls: "fs-field-label", text: "Log this visit (optional)" });
    const visitRow = visitBox.createDiv({ cls: "fs-quickadd-row" });
    const dateInput = visitRow.createEl("input", { type: "date" });
    dateInput.value = todayIso();
    const spentInput = visitRow.createEl("input", {
      type: "number",
      cls: "fs-visit-spent-input",
      attr: { min: "0", step: "0.01", placeholder: symbol },
    });
    const noteInput = visitBox.createEl("input", {
      type: "text",
      cls: "fs-visit-note-input",
      attr: { placeholder: "What did you eat?" },
    });

    // --- buttons ---
    const buttonsRow = contentEl.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttonsRow.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    const save = buttonsRow.createEl("button", { cls: "mod-cta" });
    save.type = "button";
    setIcon(save.createSpan({ cls: "fs-btn-icon" }), "plus");
    save.createSpan({ text: " Add spot" });
    save.addEventListener("click", () => {
      const spentRaw = spentInput.value.trim();
      const spent = spentRaw === "" ? undefined : Number(spentRaw);
      const result: QuickAddResult = { status: this.status };
      if (this.rating > 0) result.rating = this.rating;
      if (this.price !== undefined) result.price = this.price;
      if (this.status === "visited" && dateInput.value) {
        result.visit = {
          date: dateInput.value,
          spent: spent !== undefined && !Number.isNaN(spent) ? spent : undefined,
          note: noteInput.value.trim(),
        };
      }
      this.resolved = true;
      this.resolve(result);
      this.close();
    });

    setStatus("want-to-try");
  }

  override onClose(): void {
    this.contentEl.empty();
    if (!this.resolved) {
      this.resolved = true;
      this.resolve(null);
    }
  }
}

/** Resolves to the chosen options, or null when cancelled. */
export function openQuickAdd(
  plugin: FoodSpotPluginApi,
  spotName: string,
  suggestedPrice?: number
): Promise<QuickAddResult | null> {
  return new Promise((resolve) => {
    new QuickAddModal(plugin, spotName, suggestedPrice, resolve).open();
  });
}

/**
 * Apply quick-add choices to a prepared SpotInput and persist. A rating on a
 * visited spot becomes a real visit so derived fields stay consistent.
 */
export async function createWithQuickAdd(
  plugin: FoodSpotPluginApi,
  input: SpotInput,
  choice: QuickAddResult
): Promise<string> {
  const enriched: SpotInput = { ...input, status: choice.status };
  if (choice.price !== undefined) enriched.price = choice.price;
  // A rating without a visit is a manual override; with a visit it's derived.
  if (choice.rating !== undefined && choice.visit === undefined) {
    enriched.rating = choice.rating;
    enriched.ratingLocked = true;
  }
  const spot = await plugin.store.createSpot(enriched);
  if (choice.visit) {
    await plugin.store.addVisit(spot.path, {
      date: choice.visit.date,
      rating: choice.rating,
      spent: choice.visit.spent,
      note: choice.visit.note,
    });
  }
  new Notice(
    `Added ${spot.name} — ${choice.status === "visited" ? "visited" : "want to try"}${
      choice.rating ? ` · ${choice.rating}★` : ""
    }`
  );
  return spot.path;
}
