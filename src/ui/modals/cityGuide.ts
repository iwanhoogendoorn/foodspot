/**
 * Food Spot — city guide modal.
 *
 * Pick a city, decide whether the want-to-try list travels with it, and watch
 * the markdown build itself in the preview. Exits: the clipboard (paste it into
 * a chat), a note in the vault (`<spotsFolder>/Guides/…`, never overwriting an
 * older guide), and — for everyone who is not an Obsidian user — a PDF via the
 * system save dialog on desktop, or the standalone HTML written into
 * `<spotsFolder>/_exports/` on mobile, where there is no such dialog.
 */
import { Modal, Notice, TFile } from "obsidian";
import type { FoodSpot, FoodSpotPluginApi } from "../../types";
import { buildCityGuide } from "../../tools/cityGuide";
import { buildGuideHtml, guidePhotoPaths } from "../../tools/guideHtml";
import { ensureFolder, availablePath } from "../../store/noteWriter";
import { saveToDisk } from "../../store/backup";
import type { VaultSaveTarget } from "../../store/backup";
import { exportHtmlToPdf, canExportPdf } from "../../tools/pdfExport";

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
const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
};

function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|#^[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

class CityGuideModal extends Modal {
  private city = "";
  private includeWantToTry = true;
  private previewEl!: HTMLIFrameElement;
  private html = "";
  private images = new Map<string, string>();
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

    this.previewEl = body.createEl("iframe", { cls: "fs-guide-preview" });
    this.previewEl.setAttribute("sandbox", "allow-same-origin allow-modals");

    const buttons = body.createDiv({ cls: "fs-modal-buttons fs-guide-buttons" });
    // Rendering HTML to PDF bytes needs Electron's <webview>, which mobile has
    // no equivalent for. Rather than offer a button that can only apologise,
    // mobile gets the standalone HTML written into the vault — from Files its
    // share sheet prints to PDF, which is the same document by another route.
    if (canExportPdf()) {
      const pdf = buttons.createEl("button", { cls: "mod-cta", text: "Save as PDF…" });
      pdf.type = "button";
      pdf.addEventListener("click", () => {
        pdf.disabled = true;
        pdf.setText("Saving…");
        void exportHtmlToPdf(this.html, `${sanitizeFileName(this.noteTitle())}.pdf`)
          .then((outcome) => {
            // Any failure — no save dialog, unwritable temp dir, a printToPDF
            // that exists but throws — still leaves the user with the OS print
            // dialog, which offers "Save as PDF".
            if (outcome === "failed") this.print();
          })
          .catch((e: unknown) => {
            new Notice(`PDF export failed — ${errorMessage(e)}. Use "Save HTML…" instead.`);
          })
          .finally(() => {
            pdf.disabled = false;
            pdf.setText("Save as PDF…");
          });
      });
      const htmlBtn = buttons.createEl("button", { text: "Save HTML…" });
      htmlBtn.type = "button";
      htmlBtn.addEventListener("click", () => {
        void saveToDisk(`${sanitizeFileName(this.noteTitle())}.html`, this.html);
      });
    } else {
      const save = buttons.createEl("button", { cls: "mod-cta", text: "Save guide…" });
      save.type = "button";
      save.addEventListener("click", () => {
        save.disabled = true;
        save.setText("Saving…");
        void saveToDisk(
          `${sanitizeFileName(this.noteTitle())}.html`,
          this.html,
          this.exportTarget(),
        )
          .then((written) => {
            if (written) {
              new Notice(
                "Open the saved guide from Files and use Share → Print → Save as PDF.",
                10000,
              );
            }
          })
          .finally(() => {
            save.disabled = false;
            save.setText("Save guide…");
          });
      });
    }
    const copy = buttons.createEl("button", { text: "Copy markdown" });
    copy.type = "button";
    copy.addEventListener("click", () => {
      void navigator.clipboard
        .writeText(this.markdown())
        .then(() => new Notice(`Guide for ${this.city} copied.`))
        .catch((e: unknown) => new Notice(`Couldn't copy — ${errorMessage(e)}`));
    });
    const save = buttons.createEl("button", { text: "Save as note" });
    save.type = "button";
    save.addEventListener("click", () => void this.saveAsNote());

    this.renderPreview();
  }

  private noteTitle(): string {
    return `Eating in ${this.city}`;
  }

  /**
   * Where a guide lands when there is no system save dialog (mobile): a folder
   * beside the spot notes, so it is reachable from Files and from any sync.
   */
  private exportTarget(): VaultSaveTarget {
    return {
      app: this.app,
      folder: `${this.plugin.settings.spotsFolder}/_exports`,
    };
  }

  private markdown(): string {
    return buildCityGuide(this.plugin.store.getSpots(), this.city, {
      includeWantToTry: this.includeWantToTry,
      currency: this.plugin.settings.currencySymbol,
    });
  }

  /** Vault images -> data URIs so the exported document is standalone. */
  private async loadImages(paths: string[]): Promise<void> {
    for (const p of paths) {
      if (this.images.has(p)) continue;
      const file =
        this.plugin.app.metadataCache.getFirstLinkpathDest(p, "") ??
        this.plugin.app.vault.getAbstractFileByPath(p);
      if (!(file instanceof TFile)) continue;
      try {
        const bytes = new Uint8Array(await this.plugin.app.vault.readBinary(file));
        let bin = "";
        const CHUNK = 0x8000;
        for (let i = 0; i < bytes.length; i += CHUNK) {
          bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
        }
        const mime = MIME[file.extension.toLowerCase()] ?? "image/jpeg";
        this.images.set(p, `data:${mime};base64,${btoa(bin)}`);
      } catch {
        // A broken image just falls back to the letter tile.
      }
    }
  }

  private renderPreview(): void {
    void (async () => {
      const spots = this.plugin.store.getSpots();
      await this.loadImages(guidePhotoPaths(spots, this.city, this.includeWantToTry));
      this.html = buildGuideHtml(spots, this.city, {
        includeWantToTry: this.includeWantToTry,
        currency: this.plugin.settings.currencySymbol || "€",
        images: this.images,
        generatedOn: new Date().toLocaleDateString(),
      });
      this.previewEl.srcdoc = this.html;
    })();
  }

  /** Print the preview: the OS dialog offers "Save as PDF". */
  private print(): void {
    const win = this.previewEl.contentWindow;
    if (!win) {
      new Notice("Preview isn't ready yet — try again in a second.");
      return;
    }
    try {
      win.focus();
      win.print();
    } catch (e) {
      new Notice(`Couldn't open the print dialog — ${errorMessage(e)}. Use "Save HTML…" instead.`);
    }
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
