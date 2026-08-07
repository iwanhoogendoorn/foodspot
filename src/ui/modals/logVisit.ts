/**
 * Food Spot — "Log visit" flow.
 *
 * `openLogVisitPicker(plugin)` without a path shows a FuzzySuggestModal over
 * all spots (name + city), then the visit form. With a path it jumps straight
 * to the form. Saving a visit on a want-to-try spot flips it to visited.
 *
 * Up to MAX_VISIT_PHOTOS dish photos can ride along with the visit; they are
 * imported into the vault only when the visit is saved, and reviewed later in
 * the Visits tab, the spot's detail modal, or the dish gallery.
 */
import { FuzzySuggestModal, Modal, Notice, setIcon } from "obsidian";
import type { FoodSpot, FoodSpotPluginApi, Visit } from "../../types";
import { starRating } from "../components/starRating";
import {
  MAX_VISIT_PHOTOS,
  capIncoming,
  importDishPhotos,
  pickImageFiles,
  renderPendingThumbs,
} from "../components/dishPhotos";
import { todayIso } from "../../util/dates";

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
  private photoRow!: HTMLElement;
  private rating = 0;
  private saving = false;
  /**
   * Picked but not yet imported. Files stay in memory until the visit is saved
   * so a cancelled form never leaves stray images in the media folder.
   */
  private photoFiles: File[] = [];
  private disposeThumbs: (() => void) | null = null;

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
    this.dateInput.addEventListener("input", () => this.clearFieldError(this.dateInput));

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
    spentField.createDiv({ cls: "fs-field-msg" });
    this.spentInput.addEventListener("input", () => this.clearFieldError(this.spentInput));

    const noteField = form.createDiv({ cls: "fs-field" });
    noteField.createEl("label", { cls: "fs-field-label", text: "Note" });
    this.noteInput = noteField.createEl("input", {
      type: "text",
      placeholder: "What did you eat? How was it?",
    });
    this.noteInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") void this.save();
    });

    const photoField = form.createDiv({ cls: "fs-field" });
    photoField.createEl("label", { cls: "fs-field-label", text: "Photos" });
    this.photoRow = photoField.createDiv({ cls: "fs-visit-photos" });
    this.renderPhotos();

    // Drag & drop straight onto the form, matching the detail modal's visit
    // editor. Desktop only in practice; the button covers every platform.
    form.addEventListener("dragover", (e) => {
      e.preventDefault();
      form.addClass("fs-drop-active");
    });
    form.addEventListener("dragleave", () => form.removeClass("fs-drop-active"));
    form.addEventListener("drop", (e) => {
      e.preventDefault();
      form.removeClass("fs-drop-active");
      const dropped = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (dropped.length === 0) return;
      this.addPhotos(dropped);
    });

    const buttons = this.contentEl.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    const save = buttons.createEl("button", { text: "Log visit", cls: "mod-cta" });
    save.type = "button";
    save.addEventListener("click", () => void this.save());
  }

  private addPhotos(files: File[]): void {
    const picked = capIncoming(this.photoFiles.length, files);
    if (picked.length === 0) return;
    this.photoFiles = [...this.photoFiles, ...picked];
    this.renderPhotos();
  }

  private renderPhotos(): void {
    // Revoke before the strip is torn down; the disposer belongs to the thumbs
    // this call is about to replace.
    this.disposeThumbs?.();
    this.disposeThumbs = null;
    this.photoRow.empty();

    const room = MAX_VISIT_PHOTOS - this.photoFiles.length;
    const add = this.photoRow.createEl("button", { cls: "fs-btn fs-small-btn" });
    add.type = "button";
    setIcon(add.createSpan({ cls: "fs-btn-icon" }), "image-plus");
    add.createSpan({
      text: this.photoFiles.length === 0 ? " Add photos" : ` Add more (${room} left)`,
    });
    add.disabled = room <= 0;
    add.addEventListener("click", () => {
      void (async () => {
        this.addPhotos(await pickImageFiles());
      })();
    });

    this.disposeThumbs = renderPendingThumbs(this.photoRow, this.photoFiles, (i) => {
      this.photoFiles = this.photoFiles.filter((_, n) => n !== i);
      this.renderPhotos();
    });
  }

  /** Inline, per-field feedback — this form never throws a Notice wall. */
  private setFieldError(input: HTMLInputElement, msg: string): void {
    const wrap = input.parentElement;
    wrap?.addClass("fs-field-error");
    wrap?.querySelector(".fs-field-msg")?.setText(msg);
    input.focus();
  }

  private clearFieldError(input: HTMLInputElement): void {
    const wrap = input.parentElement;
    wrap?.removeClass("fs-field-error");
    wrap?.querySelector(".fs-field-msg")?.setText("");
  }

  private async save(): Promise<void> {
    if (this.saving) return;
    this.clearFieldError(this.dateInput);
    this.clearFieldError(this.spentInput);

    const date = this.dateInput.value;
    if (!date) {
      this.setFieldError(this.dateInput, "Pick a date for the visit.");
      return;
    }
    // min="0" is a hint the browser only enforces on native form submit, so a
    // pasted or typed "-5" reaches us intact and would be written to the note.
    const spentRaw = this.spentInput.value.trim();
    let spent: number | undefined;
    if (spentRaw !== "") {
      const parsed = Number(spentRaw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        this.setFieldError(this.spentInput, "Enter an amount of 0 or more, or leave it empty.");
        return;
      }
      spent = parsed;
    }
    this.saving = true;
    try {
      const before = this.plugin.store.getByPath(this.path);
      const wasWantToTry = before?.status === "want-to-try";
      // Import only now that the visit is definitely being written, so a
      // cancelled form leaves the media folder untouched.
      let photos: string[] | undefined;
      if (this.photoFiles.length > 0 && before) {
        const saved = await importDishPhotos(this.plugin, before, date, this.photoFiles);
        if (saved.length > 0) photos = saved;
      }
      const visit: Visit = {
        date,
        rating: this.rating > 0 ? this.rating : undefined,
        spent,
        note: this.noteInput.value.trim(),
        photos,
      };
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
    this.disposeThumbs?.();
    this.disposeThumbs = null;
    this.contentEl.empty();
  }
}


function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
