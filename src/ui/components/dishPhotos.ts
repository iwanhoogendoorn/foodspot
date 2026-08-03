/**
 * Dish photos for visits: import image files into the vault's media folder
 * and render thumbnail strips.
 *
 * Files land in `<mediaFolder>/dishes/` named after the spot + visit date, so
 * a note's own embeds stay readable and the cleanup sweep can reason about
 * them like any other media file.
 */
import { Notice, TFile, normalizePath } from "obsidian";
import type { FoodSpot, FoodSpotPluginApi } from "../../types";
import { ensureFolder } from "../../store/noteWriter";
import { embedRefPath } from "../../store/visitsParser";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|avif)$/i;

function sanitize(name: string): string {
  return name
    .replace(/[\\/:*?"<>|#^[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Resolve a stored photo ref (vault path or link text) to a real file. */
export function resolveDishFile(
  plugin: FoodSpotPluginApi,
  ref: string,
  sourcePath: string
): TFile | null {
  // A stored ref keeps its embed suffix ("dishes/x.jpg|300") so the note
  // round-trips; only the path before the pipe addresses a file.
  const raw = embedRefPath(ref);
  if (!raw || /^https?:\/\//i.test(raw)) return null;
  const direct = plugin.app.metadataCache.getFirstLinkpathDest(raw, sourcePath);
  if (direct) return direct;
  const byPath = plugin.app.vault.getAbstractFileByPath(normalizePath(raw));
  return byPath instanceof TFile ? byPath : null;
}

/**
 * Copy picked image files into `<mediaFolder>/dishes/` and return their vault
 * paths. Non-images are skipped; name collisions get a numeric suffix.
 */
export async function importDishPhotos(
  plugin: FoodSpotPluginApi,
  spot: FoodSpot,
  date: string,
  files: File[]
): Promise<string[]> {
  const dir = normalizePath(`${plugin.settings.mediaFolder}/dishes`);
  await ensureFolder(plugin.app, dir);
  const saved: string[] = [];
  let index = 1;
  for (const file of files) {
    if (!IMAGE_EXT.test(file.name) && !file.type.startsWith("image/")) {
      new Notice(`Skipped "${file.name}" — not an image.`);
      continue;
    }
    const ext = (IMAGE_EXT.exec(file.name)?.[0] ?? ".jpg").toLowerCase();
    const base = `${sanitize(spot.name)} ${date}`;
    let candidate = `${dir}/${base} ${index}${ext}`;
    while (plugin.app.vault.getAbstractFileByPath(candidate) !== null) {
      index++;
      candidate = `${dir}/${base} ${index}${ext}`;
    }
    try {
      await plugin.app.vault.createBinary(candidate, await file.arrayBuffer());
      saved.push(candidate);
      index++;
    } catch (e) {
      new Notice(`Couldn't save "${file.name}": ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return saved;
}

/** Open a native file picker for images; resolves to the chosen files. */
export function pickImageFiles(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = createEl("input", {
      type: "file",
      attr: { accept: "image/*", multiple: "true", style: "display: none" },
    });
    document.body.appendChild(input);
    let settled = false;
    const finish = (files: File[]): void => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(files);
    };
    input.addEventListener("change", () => finish(Array.from(input.files ?? [])));
    // A cancelled picker fires no event in Electron — release on refocus.
    window.addEventListener("focus", () => window.setTimeout(() => finish([]), 400), {
      once: true,
    });
    input.click();
  });
}

/**
 * Thumbnail strip for a visit's dish photos. `onRemove` makes them editable
 * (shows an × per thumb); without it they're display-only and open on click.
 */
export function renderDishThumbs(
  parent: HTMLElement,
  plugin: FoodSpotPluginApi,
  photos: string[],
  sourcePath: string,
  onRemove?: (ref: string) => void
): void {
  if (photos.length === 0) return;
  const strip = parent.createDiv({ cls: "fs-dish-strip" });
  for (const ref of photos) {
    const cell = strip.createDiv({ cls: "fs-dish-thumb" });
    const file = resolveDishFile(plugin, ref, sourcePath);
    if (file) {
      const img = cell.createEl("img", { cls: "fs-dish-img" });
      img.src = plugin.app.vault.getResourcePath(file);
      img.alt = file.basename;
      cell.title = file.name;
      cell.addEventListener("click", () => {
        void plugin.app.workspace.openLinkText(file.path, sourcePath);
      });
    } else {
      cell.addClass("fs-dish-missing");
      cell.setText("?");
      cell.title = `Missing: ${ref}`;
    }
    if (onRemove) {
      const rm = cell.createEl("button", {
        cls: "fs-dish-remove",
        attr: { "aria-label": "Remove photo" },
      });
      rm.type = "button";
      rm.setText("×");
      rm.addEventListener("click", (e) => {
        e.stopPropagation();
        onRemove(ref);
      });
    }
  }
}
