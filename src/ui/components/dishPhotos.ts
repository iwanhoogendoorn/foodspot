/**
 * Dish photos for visits: import image files into the vault's media folder
 * and render thumbnail strips.
 *
 * Files land in `<mediaFolder>/dishes/` named after the spot + visit date, so
 * a note's own embeds stay readable and the cleanup sweep can reason about
 * them like any other media file.
 */
import { Notice, Platform, TFile, normalizePath } from "obsidian";
import type { FoodSpot, FoodSpotPluginApi } from "../../types";
import { ensureFolder } from "../../store/noteWriter";
import { embedRefPath } from "../../store/visitsParser";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|avif)$/i;

/**
 * Photos one visit may hold. Enough for a course-by-course meal, few enough
 * that the note's visit bullet stays readable as plain markdown.
 */
export const MAX_VISIT_PHOTOS = 10;

/**
 * Trim a prospective batch to whatever room is left, saying what was dropped.
 *
 * Applied to the picked files rather than the saved paths, so the cap can only
 * ever undershoot — `importDishPhotos` skips non-images, and a silent overshoot
 * past the limit would be the worse failure.
 */
export function capIncoming<T>(existing: number, incoming: T[]): T[] {
  const room = Math.max(0, MAX_VISIT_PHOTOS - existing);
  if (incoming.length <= room) return incoming;
  new Notice(
    room === 0
      ? `A visit holds at most ${MAX_VISIT_PHOTOS} photos — remove one to add another.`
      : `Only ${room} more photo${room === 1 ? "" : "s"} fit; a visit holds at most ${MAX_VISIT_PHOTOS}.`,
  );
  return incoming.slice(0, room);
}

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

/**
 * Open a native file picker for images; resolves to the chosen files.
 *
 * `accept="image/*"` with no `capture` is deliberate: iOS and Android both
 * offer "Take Photo" alongside the library for it, so the camera is reachable
 * without locking the picker to it.
 */
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
    // Always re-read the input rather than assuming a cancel.
    const settle = (): void => finish(Array.from(input.files ?? []));
    input.addEventListener("change", settle);
    // Modern webviews announce a dismissed picker; Electron does not.
    input.addEventListener("cancel", settle);
    // Electron's picker fires no event at all when cancelled, so on desktop a
    // refocus fallback is the only way to release the promise.
    //
    // Mobile must NOT have that fallback. Choosing "Take Photo" backgrounds the
    // app for however long it takes to compose the shot, and iOS can fire focus
    // on the way *into* the camera — so any timer risks settling the picker
    // empty while the user is still framing, throwing the photo away on arrival.
    // `cancel` covers a dismissed picker instead; if a webview is too old to
    // send it, the worst case is a button that did nothing, which beats losing
    // a photo that cannot be retaken.
    if (!Platform.isMobile) {
      window.addEventListener("focus", () => window.setTimeout(settle, 400), {
        once: true,
      });
    }
    input.click();
  });
}

/**
 * Thumbnail strip for photos chosen but not yet written to the vault.
 *
 * Log-a-visit holds the picked files in memory until the visit is actually
 * saved, so abandoning the form leaves no orphans in the media folder. Previews
 * come from object URLs; the returned disposer revokes them, and callers must
 * run it before re-rendering or closing or the blobs leak.
 */
export function renderPendingThumbs(
  parent: HTMLElement,
  files: File[],
  onRemove: (index: number) => void,
): () => void {
  if (files.length === 0) return () => undefined;
  const urls: string[] = [];
  const strip = parent.createDiv({ cls: "fs-dish-strip" });
  files.forEach((file, i) => {
    const cell = strip.createDiv({ cls: "fs-dish-thumb" });
    const url = URL.createObjectURL(file);
    urls.push(url);
    const img = cell.createEl("img", { cls: "fs-dish-img" });
    img.src = url;
    img.alt = file.name;
    cell.title = file.name;
    const rm = cell.createEl("button", {
      cls: "fs-dish-remove",
      attr: { "aria-label": `Remove ${file.name}` },
    });
    rm.type = "button";
    rm.setText("×");
    rm.addEventListener("click", (e) => {
      e.stopPropagation();
      onRemove(i);
    });
  });
  return () => {
    for (const u of urls) URL.revokeObjectURL(u);
  };
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
