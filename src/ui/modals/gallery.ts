/**
 * Food Spot — dish photo gallery.
 *
 * Every dish photo you ever logged, newest visit first, as a square grid.
 * Whole-library mode captions each tile with the spot and the visit date and
 * opens the spot on click; single-spot mode (`path`) captions with the date
 * only and opens the image itself.
 *
 * Images load through ONE IntersectionObserver that is disconnected on close
 * — a library with hundreds of dishes must not decode them all up front, and
 * an observer must never outlive the modal that made it.
 */
import { Modal } from "obsidian";
import type { DateFormat, FoodSpot, FoodSpotPluginApi } from "../../types";
import { resolveDishFile } from "../components/dishPhotos";
import { openLightbox } from "../components/lightbox";
import type { LightboxItem } from "../components/lightbox";

export function openGalleryModal(plugin: FoodSpotPluginApi, path?: string): void {
  new GalleryModal(plugin, path).open();
}

/** One photo, flattened out of the visit it belongs to. */
interface DishEntry {
  ref: string;
  /** The note the ref was written in — link resolution is relative to it. */
  sourcePath: string;
  spotName: string;
  date: string;
}

function collect(spots: FoodSpot[]): DishEntry[] {
  const entries: DishEntry[] = [];
  for (const spot of spots) {
    for (const visit of spot.visits) {
      for (const ref of visit.photos ?? []) {
        entries.push({ ref, sourcePath: spot.path, spotName: spot.name, date: visit.date });
      }
    }
  }
  // Newest visit first; photos within one visit keep the order they were added.
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

function formatDate(iso: string, fmt: DateFormat): string {
  const parts = iso.split("T")[0]?.split("-");
  if (!parts || parts.length !== 3) return iso;
  const [y, m, d] = parts;
  switch (fmt) {
    case "european":
      return `${d}-${m}-${y}`;
    case "american":
      return `${m}/${d}/${y}`;
    default:
      return `${y}-${m}-${d}`;
  }
}

class GalleryModal extends Modal {
  private observer: IntersectionObserver | null = null;
  /** Tile -> "load me now", consumed once the tile scrolls into view. */
  private readonly loaders = new WeakMap<Element, () => void>();
  /** The rendered set, in display order — the viewer pages through it. */
  private entries: DishEntry[] = [];

  constructor(
    private readonly plugin: FoodSpotPluginApi,
    private readonly path?: string,
  ) {
    super(plugin.app);
  }

  override onOpen(): void {
    this.modalEl.addClass("fs-modal", "fs-gallery-modal");
    const spot =
      this.path === undefined ? undefined : this.plugin.store.getByPath(this.path);
    this.titleEl.setText(spot ? `Dish photos — ${spot.name}` : "Dish photos");

    const entries = collect(spot ? [spot] : this.plugin.store.getSpots());
    this.entries = entries;
    const body = this.contentEl;
    if (entries.length === 0) {
      body.createDiv({
        cls: "fs-empty-state",
        text: "No dish photos yet — add them when you log a visit.",
      });
      return;
    }

    body.createDiv({
      cls: "fs-gallery-count",
      text: `${entries.length} photo${entries.length === 1 ? "" : "s"}`,
    });
    const grid = body.createDiv({ cls: "fs-gallery-grid" });
    this.observer = new IntersectionObserver(
      (observed) => {
        for (const entry of observed) {
          if (!entry.isIntersecting) continue;
          this.observer?.unobserve(entry.target);
          const load = this.loaders.get(entry.target);
          this.loaders.delete(entry.target);
          load?.();
        }
      },
      { root: grid, rootMargin: "200px" },
    );
    for (const entry of entries) this.renderTile(grid, entry, spot === undefined);
  }

  private renderTile(grid: HTMLElement, entry: DishEntry, showSpotName: boolean): void {
    const tile = grid.createDiv({ cls: "fs-gallery-tile" });
    const frame = tile.createDiv({ cls: "fs-gallery-frame" });
    const date = formatDate(entry.date, this.plugin.settings.dateFormat);
    tile.createDiv({
      cls: "fs-gallery-caption",
      text: showSpotName ? `${entry.spotName} · ${date}` : date,
    });

    const file = resolveDishFile(this.plugin, entry.ref, entry.sourcePath);
    if (!file) {
      frame.addClass("fs-gallery-missing");
      frame.setText("?");
      frame.title = `Missing: ${entry.ref}`;
      return;
    }

    tile.title = showSpotName ? `${entry.spotName} — ${file.name}` : file.name;
    this.loaders.set(frame, () => {
      const img = frame.createEl("img", { cls: "fs-gallery-img" });
      img.src = this.plugin.app.vault.getResourcePath(file);
      img.alt = file.basename;
      img.loading = "lazy";
    });
    this.observer?.observe(frame);

    tile.addEventListener("click", () => this.openViewer(entry));
  }

  /**
   * Open the zoomable viewer on the whole gallery, positioned at the tapped
   * photo, so it pages through the set rather than showing one dead-end image.
   *
   * Previously a tile either jumped to the spot's detail modal or handed the
   * file to `openLinkText`, which opens it as a document tab: no zoom at all.
   */
  private openViewer(entry: DishEntry): void {
    const items: LightboxItem[] = [];
    let start = 0;
    for (const e of this.entries) {
      const f = resolveDishFile(this.plugin, e.ref, e.sourcePath);
      if (!f) continue;
      if (e === entry) start = items.length;
      items.push({
        file: f,
        caption: `${e.spotName} · ${formatDate(e.date, this.plugin.settings.dateFormat)}`,
      });
    }
    openLightbox(this.plugin, items, start);
  }

  override onClose(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.contentEl.empty();
  }
}
