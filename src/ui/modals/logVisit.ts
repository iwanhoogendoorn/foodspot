/**
 * Food Spot — "Log visit" flow.
 *
 * `openLogVisitPicker(plugin)` without a path shows a FuzzySuggestModal over
 * all spots (name + city), then the visit form. With a path it jumps straight
 * to the form. Saving a visit on a want-to-try spot flips it to visited.
 */
import { FuzzySuggestModal, Modal, Notice } from "obsidian";
import type { FoodSpot, FoodSpotPluginApi, Visit } from "../../types";
import { starRating } from "../components/starRating";

export function openLogVisitPicker(plugin: FoodSpotPluginApi, path?: string): void {
  if (path) {
    new VisitModal(plugin, path).open();
    return;
  }
  const spots = plugin.store.getSpots();
  if (spots.length === 0) {
    new Notice("No food spots yet — add one before logging a visit.");
    return;
  }
  new SpotPickerModal(plugin, spots).open();
}

class SpotPickerModal extends FuzzySuggestModal<FoodSpot> {
  constructor(
    private readonly plugin: FoodSpotPluginApi,
    private readonly spots: FoodSpot[]
  ) {
    super(plugin.app);
    this.setPlaceholder("Which spot did you visit?");
  }

  getItems(): FoodSpot[] {
    return this.spots;
  }

  getItemText(spot: FoodSpot): string {
    return spot.city ? `${spot.name} — ${spot.city}` : spot.name;
  }

  onChooseItem(spot: FoodSpot): void {
    new VisitModal(this.plugin, spot.path).open();
  }
}

class VisitModal extends Modal {
  private dateInput!: HTMLInputElement;
  private spentInput!: HTMLInputElement;
  private noteInput!: HTMLInputElement;
  private rating = 0;
  private saving = false;

  constructor(
    private readonly plugin: FoodSpotPluginApi,
    private readonly path: string
  ) {
    super(plugin.app);
  }

  override onOpen(): void {
    const spot = this.plugin.store.getByPath(this.path);
    if (!spot) {
      new Notice("That spot no longer exists.");
      this.close();
      return;
    }
    this.modalEl.addClass("fs-modal", "fs-visit-modal");
    this.titleEl.setText(`Log a visit — ${spot.name}`);

    const form = this.contentEl.createDiv({ cls: "fs-visit-form" });

    const dateField = form.createDiv({ cls: "fs-field" });
    dateField.createEl("label", { cls: "fs-field-label", text: "Date" });
    this.dateInput = dateField.createEl("input", { type: "date" });
    this.dateInput.value = todayIso();
    dateField.createDiv({ cls: "fs-field-msg" });

    const ratingField = form.createDiv({ cls: "fs-field" });
    ratingField.createEl("label", { cls: "fs-field-label", text: "Rating" });
    starRating(ratingField, {
      halfSteps: this.plugin.settings.halfStarRatings,
      tiers: this.plugin.settings.ratingTiers,
      showLabel: true,
      onChange: (v) => {
        this.rating = v;
      },
    });

    const spentField = form.createDiv({ cls: "fs-field" });
    spentField.createEl("label", {
      cls: "fs-field-label",
      text: `Spent (${this.plugin.settings.currencySymbol})`,
    });
    this.spentInput = spentField.createEl("input", {
      type: "number",
      placeholder: "45",
    });
    this.spentInput.min = "0";
    this.spentInput.step = "0.01";

    const noteField = form.createDiv({ cls: "fs-field" });
    noteField.createEl("label", { cls: "fs-field-label", text: "Note" });
    this.noteInput = noteField.createEl("input", {
      type: "text",
      placeholder: "What did you eat? How was it?",
    });
    this.noteInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") void this.save();
    });

    const buttons = this.contentEl.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    const save = buttons.createEl("button", { text: "Log visit", cls: "mod-cta" });
    save.type = "button";
    save.addEventListener("click", () => void this.save());
  }

  private async save(): Promise<void> {
    if (this.saving) return;
    const date = this.dateInput.value;
    if (!date) {
      const wrap = this.dateInput.parentElement;
      wrap?.addClass("fs-field-error");
      wrap?.querySelector(".fs-field-msg")?.setText("Pick a date for the visit.");
      return;
    }
    const spentRaw = this.spentInput.value.trim();
    const spent = spentRaw === "" ? undefined : Number(spentRaw);
    const visit: Visit = {
      date,
      rating: this.rating > 0 ? this.rating : undefined,
      spent: spent !== undefined && !Number.isNaN(spent) ? spent : undefined,
      note: this.noteInput.value.trim(),
    };
    this.saving = true;
    try {
      const before = this.plugin.store.getByPath(this.path);
      const wasWantToTry = before?.status === "want-to-try";
      await this.plugin.store.addVisit(this.path, visit);
      if (wasWantToTry) {
        await this.plugin.store.updateSpot(this.path, { status: "visited" });
        new Notice(`Visit logged — “${before?.name ?? "spot"}” marked as visited.`);
      } else {
        new Notice("Visit logged.");
      }
      this.close();
    } catch (e) {
      this.saving = false;
      new Notice(`Food Spot: couldn't log the visit — ${errorMessage(e)}`);
    }
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}

function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
