/**
 * Full backup & restore: one self-contained JSON with every spot's complete
 * record (frontmatter fields, visits, notes) AND the referenced media files
 * (cover photos, menu images) base64-embedded. Import recreates notes and
 * media, skipping spots that already exist.
 */
import { Notice, normalizePath } from "obsidian";
import type { FoodSpot, FoodSpotPluginApi, SpotInput } from "../types";
import { normalizeName } from "../import/pipeline";

const BACKUP_VERSION = 1;

interface BackupFile {
  format: "foodspot-backup";
  version: number;
  exportedAt: string;
  spots: FoodSpot[];
  /** vault path -> base64 content for photo/menu files living in the vault. */
  media: Record<string, string>;
}

function base64FromBuffer(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function bufferFromBase64(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function isVaultPath(ref: string | undefined): ref is string {
  return ref !== undefined && ref !== "" && !/^https?:\/\//i.test(ref);
}

/** Build the backup payload without writing anywhere. */
export async function buildBackupJson(
  plugin: FoodSpotPluginApi
): Promise<{ json: string; suggestedName: string }> {
  const spots = plugin.store.getSpots();
  const media: Record<string, string> = {};
  for (const s of spots) {
    for (const ref of [s.photo, s.menu]) {
      if (!isVaultPath(ref) || media[ref] !== undefined) continue;
      const file = plugin.app.vault.getFileByPath(normalizePath(ref));
      if (!file) continue;
      try {
        media[ref] = base64FromBuffer(await plugin.app.vault.readBinary(file));
      } catch {
        // A missing/unreadable image never blocks the backup.
      }
    }
  }
  const payload: BackupFile = {
    format: "foodspot-backup",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    spots,
    media,
  };
  const name = `Food Spot backup ${new Date().toISOString().slice(0, 10)}.json`;
  return { json: JSON.stringify(payload), suggestedName: name };
}


/**
 * Desktop-only: save a string anywhere on disk via the system save dialog.
 * Returns true when the user saved, false on cancel/mobile.
 */
export async function saveToDisk(defaultName: string, content: string): Promise<boolean> {
  const dialog = (window as unknown as {
    electron?: { remote?: { dialog?: { showSaveDialog(o: object): Promise<{ canceled: boolean; filePath?: string }> } } };
  }).electron?.remote?.dialog;
  const nodeRequire = (globalThis as unknown as { require?: (m: string) => { writeFileSync(p: string, c: string, e: string): void } }).require;
  if (!dialog || !nodeRequire) {
    new Notice("Saving outside the vault is only available on desktop.");
    return false;
  }
  const res = await dialog.showSaveDialog({ defaultPath: defaultName });
  if (res.canceled || res.filePath === undefined) return false;
  nodeRequire("fs").writeFileSync(res.filePath, content, "utf8");
  new Notice(`Saved to ${res.filePath}`);
  return true;
}

export interface RestoreSummary {
  created: number;
  skipped: number;
  mediaWritten: number;
  errors: string[];
}

export async function importBackup(
  plugin: FoodSpotPluginApi,
  json: string,
  onProgress?: (done: number, total: number, label: string) => void,
  signal?: { cancelled: boolean }
): Promise<RestoreSummary> {
  let parsed: BackupFile;
  try {
    parsed = JSON.parse(json) as BackupFile;
  } catch {
    throw new Error("Not valid JSON.");
  }
  if (parsed.format !== "foodspot-backup" || !Array.isArray(parsed.spots)) {
    throw new Error("Not a Food Spot backup file.");
  }

  const summary: RestoreSummary = { created: 0, skipped: 0, mediaWritten: 0, errors: [] };
  const mediaEntries = Object.entries(parsed.media ?? {});
  const total = mediaEntries.length + parsed.spots.length;
  let done = 0;

  // Media first, at their original vault paths, so note references stay valid.
  for (const [path, b64] of mediaEntries) {
    if (signal?.cancelled) return summary;
    onProgress?.(done++, total, path.split("/").pop() ?? path);
    const target = normalizePath(path);
    if (plugin.app.vault.getFileByPath(target)) continue;
    try {
      const dir = target.split("/").slice(0, -1).join("/");
      if (dir && plugin.app.vault.getFolderByPath(dir) === null) {
        await plugin.app.vault.createFolder(dir).catch(() => undefined);
      }
      await plugin.app.vault.createBinary(target, bufferFromBase64(b64));
      summary.mediaWritten++;
    } catch (e) {
      summary.errors.push(`media ${path}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Existing spots are matched by normalized name + city — never overwritten.
  const existingKeys = new Set(
    plugin.store.getSpots().map((s) => `${normalizeName(s.name)}|${(s.city ?? "").toLowerCase()}`)
  );
  for (const spot of parsed.spots) {
    if (signal?.cancelled) return summary;
    onProgress?.(done++, total, spot.name ?? "…");
    const key = `${normalizeName(spot.name ?? "")}|${(spot.city ?? "").toLowerCase()}`;
    if (spot.name === undefined || existingKeys.has(key)) {
      summary.skipped++;
      continue;
    }
    try {
      const input: SpotInput = {
        name: spot.name,
        cuisines: spot.cuisines ?? [],
        country: spot.country ?? "",
        city: spot.city,
        district: spot.district,
        address: spot.address,
        coordinates: spot.coordinates,
        status: spot.status === "visited" ? "visited" : "want-to-try",
        favorite: spot.favorite === true,
        rating: spot.rating,
        ratingLocked: spot.ratingLocked === true,
        price: spot.price,
        url: spot.url,
        phone: spot.phone,
        source: spot.source ?? "manual",
        sourceUrl: spot.sourceUrl,
        external: spot.external ?? {},
        photo: spot.photo,
        menu: spot.menu,
        tags: spot.tags ?? [],
        visits: spot.visits ?? [],
        legacyId: spot.legacyId,
        notes: spot.notes ?? "",
        created: spot.created,
      };
      await plugin.store.createSpot(input);
      existingKeys.add(key);
      summary.created++;
    } catch (e) {
      summary.errors.push(`${spot.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  new Notice(
    `Restore: ${summary.created} spots created, ${summary.skipped} already existed, ${summary.mediaWritten} media files written${summary.errors.length ? `, ${summary.errors.length} errors` : ""}.`
  );
  return summary;
}
