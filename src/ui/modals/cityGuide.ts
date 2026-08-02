/**
 * Food Spot — city guide modal.
 *
 * Pick a city, decide whether the want-to-try list travels with it, and watch
 * the markdown build itself in the preview. Three exits: the clipboard (paste
 * it into a chat), a note in the vault (`<spotsFolder>/Guides/…`, never
 * overwriting an older guide), and the system save dialog for everyone who is
 * not an Obsidian user.
 */
import { Modal, Notice, TFile } from "obsidian";
import type { FoodSpot, FoodSpotPluginApi } from "../../types";
import { buildCityGuide } from "../../tools/cityGuide";
import { ensureFolder, availablePath } from "../../store/noteWriter";
import { saveToDisk } from "../../store/backup";

export function openCityGuideModal(plugin: FoodSpotPluginApi, city?: string): void {
  new CityGuideModal(plugin, city).open();
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Cities in the library, most spots first. */
function cityOptions(spots: FoodSpot[]): { city: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const spot of spots) {
    const city = (spot.city ?? "").trim();
    if (city === "") continue;
    counts.set(city, (counts.get(city) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
}

/** A guide filename still has to be a legal vault filename. */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|#^[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

class CityGuideModal extends Modal {
  private city = "";
  private includeWantToTry = true;
  private previewEl!: HTMLElement;
  private cities: { city: string; count: number }[] = [];

  constructor(
    private readonly plugin: FoodSpotPluginApi,
    /** Preselected city (Places tree entry point); falls back to the busiest. */
    private readonly preselect?: string,
  ) {
    super(plugin.app);
  }

  override onOpen(): void {
    this.modalEl.addClass("fs-modal", "fs-city-guide-modal");
    this.titleEl.setText("Create a city guide");
    const body = this.contentEl;

    this.cities = cityOptions(this.plugin.store.getSpots());
    if (this.cities.length === 0) {
      body.createDiv({
        cls: "fs-empty-state",
        text: "No spots with a city yet — add a city to a spot and the guide can be built from it.",
      });
      const buttons = body.createDiv({ cls: "fs-modal-buttons" });
      const close = buttons.createEl("button", { text: "Close" });
      close.type = "button";
      close.addEventListener("click", () => this.close());
      return;
    }
    // Preselected city wins when it exists in the library.
    this.city =
      this.preselect && this.cities.some((c) => c.city === this.preselect)
        ? this.preselect
        : this.cities[0].city;

    const controls = body.createDiv({ cls: "fs-guide-controls" });
    const cityField = controls.createDiv({ cls: "fs-field" });
    cityField.createEl("label", { cls: "fs-field-label", text: "City" });
    const select = cityField.createEl("select", { cls: "dropdown fs-guide-city" });
    select.setAttribute("aria-label", "City to write a guide for");
    for (const { city, count } of this.cities) {
      const opt = select.createEl("option", { text: `${city} (${count})` });
      opt.value = city;
      if (city === this.city) opt.selected = true;
    }
    select.addEventListener("change", () => {
      this.city = select.value;
      this.renderPreview();
    });

    const wantLabel = controls.createEl("label", { cls: "fs-guide-check" });
    const wantBox = wantLabel.createEl("input", { type: "checkbox" });
    wantBox.checked = this.includeWantToTry;
    wantLabel.createSpan({ text: "Include want-to-try spots" });
    wantBox.addEventListener("change", () => {
      this.includeWantToTry = wantBox.checked;
      this.renderPreview();
    });

    this.previewEl = body.createEl("pre", { cls: "fs-guide-preview" });

    const buttons = body.createDiv({ cls: "fs-modal-buttons" });
    const copy = buttons.createEl("button", { text: "Copy to clipboard" });
    copy.type = "button";
    copy.addEventListener("click", () => {
      void navigator.clipboard
        .writeText(this.markdown())
        .then(() => new Notice(`Guide for ${this.city} copied.`))
        .catch((e: unknown) => new Notice(`Couldn't copy — ${errorMessage(e)}`));
    });
    const disk = buttons.createEl("button", { text: "Save to disk…" });
    disk.type = "button";
    disk.addEventListener("click", () => {
      void saveToDisk(`${sanitizeFileName(this.noteTitle())}.md`, this.markdown());
    });
    const save = buttons.createEl("button", {
      cls: "mod-cta",
      text: "Save as note in vault",
    });
    save.type = "button";
    save.addEventListener("click", () => void this.saveAsNote());

    this.renderPreview();
  }

  private noteTitle(): string {
    return `Eating in ${this.city}`;
  }

  private markdown(): string {
    return buildCityGuide(this.plugin.store.getSpots(), this.city, {
      includeWantToTry: this.includeWantToTry,
      currency: this.plugin.settings.currencySymbol,
    });
  }

  private renderPreview(): void {
    this.previewEl.setText(this.markdown());
    this.previewEl.scrollTop = 0;
  }

  private async saveAsNote(): Promise<void> {
    const folder = `${this.plugin.settings.spotsFolder}/Guides`;
    const markdown = this.markdown();
    try {
      await ensureFolder(this.plugin.app, folder);
      const path = availablePath(
        this.plugin.app,
        folder,
        `${sanitizeFileName(this.noteTitle())}.md`,
      );
      const file = await this.plugin.app.vault.create(path, markdown);
      this.close();
      new Notice(`Guide saved to ${path}`);
      if (file instanceof TFile) {
        await this.plugin.app.workspace.getLeaf("tab").openFile(file);
      }
    } catch (e) {
      new Notice(`Couldn't save the guide — ${errorMessage(e)}`);
    }
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}
