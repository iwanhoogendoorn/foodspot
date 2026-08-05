/**
 * Full backup & restore.
 *
 * The backup is content-complete: for every spot it stores the note's RAW
 * markdown — the only representation that also carries custom frontmatter,
 * sections we do not model and raw lines inside `## Visits` — next to the
 * structured `FoodSpot` record (kept so the JSON stays readable and so older
 * readers still work). Every referenced binary is embedded, including dish
 * photos on visit bullets.
 *
 * Restore recreates notes and media. It never overwrites an existing spot, it
 * writes media only inside the configured media folder, and it never reuses an
 * existing file whose bytes differ from the backed-up ones.
 */
import { Notice, TFile, normalizePath } from "obsidian";
import type { App } from "obsidian";
import type { FoodSpot, FoodSpotPluginApi, SpotInput, Visit } from "../types";
import { normalizeName } from "../import/pipeline";
import { spotFileName, spotFolder } from "./legacyMap";
import { availablePath, ensureFolder } from "./noteWriter";
import { embedRefPath } from "./visitsParser";
import { todayIso } from "../util/dates";

/**
 * 1 = spots + photo/menu binaries only.
 * 2 = adds raw note markdown, per-note reference resolution and dish photos.
 */
const BACKUP_VERSION = 2;

/** Everything about one note that the structured record cannot express. */
interface BackupNote {
  /** Vault path in the source vault — ties this entry to its `spots` record. */
  path: string;
  /** Note content, byte for byte. Empty when the note could not be read. */
  markdown: string;
  /**
   * Media reference exactly as written on the note -> the vault path it
   * resolved to. Restore needs both: the key to rewrite in the markdown, the
   * value to find the embedded bytes.
   */
  refs: Record<string, string>;
}

interface BackupFile {
  format: "foodspot-backup";
  version: number;
  exportedAt: string;
  spots: FoodSpot[];
  /** v2+. Absent in version 1 files, which restore falls back to rebuilding. */
  notes?: BackupNote[];
  /** vault path (v2) or reference as written (v1) -> base64 file content. */
  media: Record<string, string>;
  /** v2+. What the export could not include, so restore can repeat it. */
  warnings?: string[];
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

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function isVaultPath(ref: string | undefined): ref is string {
  return ref !== undefined && ref !== "" && !/^https?:\/\//i.test(ref);
}

/** Every in-vault media reference on a spot: cover, menu and dish photos. */
function mediaRefsOf(spot: FoodSpot): string[] {
  const refs = [
    spot.photo,
    spot.menu,
    // Strip the `|alias` suffix an embed may carry: an unstripped ref resolves
    // to nothing and the dish photo would be left out of a "full" backup.
    ...(spot.visits ?? []).flatMap((v) => (v.photos ?? []).map(embedRefPath)),
  ];
  return refs.filter(isVaultPath).map((r) => r.trim()).filter((r) => r !== "");
}

/**
 * A reference may be link text (`cover.jpg`) rather than a vault path, so it
 * has to go through Obsidian's link resolution first — resolving only by
 * literal path silently drops half the library's images.
 */
function resolveRef(app: App, ref: string, sourcePath: string): TFile | null {
  const linked = app.metadataCache.getFirstLinkpathDest(ref, sourcePath);
  if (linked) return linked;
  const direct = app.vault.getAbstractFileByPath(normalizePath(ref));
  return direct instanceof TFile ? direct : null;
}

/** Build the backup payload without writing anywhere. */
export async function buildBackupJson(
  plugin: FoodSpotPluginApi
): Promise<{ json: string; suggestedName: string; warnings: string[] }> {
  const spots = plugin.store.getSpots();
  const media: Record<string, string> = {};
  const notes: BackupNote[] = [];
  const warnings: string[] = [];

  for (const spot of spots) {
    const refs: Record<string, string> = {};
    for (const ref of mediaRefsOf(spot)) {
      if (refs[ref] !== undefined) continue;
      const file = resolveRef(plugin.app, ref, spot.path);
      if (!file) {
        warnings.push(`${spot.name}: "${ref}" is not in the vault — not embedded.`);
        continue;
      }
      refs[ref] = file.path;
      if (media[file.path] !== undefined) continue;
      try {
        media[file.path] = base64FromBuffer(await plugin.app.vault.readBinary(file));
      } catch (e) {
        warnings.push(`${spot.name}: "${file.path}" could not be read (${errMsg(e)}).`);
      }
    }

    let markdown = "";
    const file = plugin.store.fileFor(spot.path);
    if (!file) {
      warnings.push(`${spot.name}: note "${spot.path}" is gone — only its indexed record was saved.`);
    } else {
      try {
        markdown = await plugin.app.vault.read(file);
      } catch (e) {
        warnings.push(
          `${spot.name}: note text could not be read (${errMsg(e)}) — only its indexed record was saved.`
        );
      }
    }
    notes.push({ path: spot.path, markdown, refs });
  }

  const payload: BackupFile = {
    format: "foodspot-backup",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    spots,
    notes,
    media,
    warnings,
  };
  const name = `Food Spot backup ${todayIso()}.json`;

  // A "full" backup that quietly lost files is the worst possible outcome:
  // say exactly what is missing, before the save dialog claims success.
  if (warnings.length > 0) {
    const head = warnings.slice(0, 3).join(" ");
    new Notice(
      `Backup is INCOMPLETE — ${warnings.length} item${warnings.length === 1 ? "" : "s"} could not be included. ${head}${warnings.length > 3 ? " …" : ""}`,
      15000
    );
  }
  return { json: JSON.stringify(payload), suggestedName: name, warnings };
}


/** Where a save lands when there is no system save dialog (mobile). */
export interface VaultSaveTarget {
  app: App;
  /** Vault folder to write into; created when it does not exist yet. */
  folder: string;
}

/** First free `<folder>/<name>`, suffixing " 2", " 3", … before the extension. */
function freeVaultPath(app: App, folder: string, fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  const ext = dot > 0 ? fileName.slice(dot) : "";
  const prefix = folder ? `${normalizePath(folder)}/` : "";
  let candidate = `${prefix}${base}${ext}`;
  let n = 2;
  while (app.vault.getAbstractFileByPath(candidate)) {
    candidate = `${prefix}${base} ${n}${ext}`;
    n += 1;
  }
  return candidate;
}

/**
 * Mobile has no system save dialog and no filesystem outside the vault, so the
 * file goes into the vault itself — from there the OS share sheet, or any sync,
 * can take it anywhere. Never overwrites: a taken name gets a numeric suffix.
 */
async function saveIntoVault(
  target: VaultSaveTarget,
  defaultName: string,
  content: string,
): Promise<boolean> {
  try {
    const folder = normalizePath(target.folder);
    await ensureFolder(target.app, folder);
    const path = freeVaultPath(target.app, folder, defaultName);
    await target.app.vault.create(path, content);
    new Notice(`Saved to ${path} — open it from Files to share or move it.`, 10000);
    return true;
  } catch (e) {
    new Notice(`Couldn't save inside the vault: ${errMsg(e)}`);
    return false;
  }
}

/**
 * Save a string outside the vault via the system save dialog (desktop).
 *
 * Without that dialog — i.e. on mobile — the file is written into the vault at
 * `target.folder` when a target is given, so exports and backups are not a
 * desktop-only feature. Returns true when something was written.
 */
export async function saveToDisk(
  defaultName: string,
  content: string,
  target?: VaultSaveTarget,
): Promise<boolean> {
  const dialog = (window as unknown as {
    electron?: { remote?: { dialog?: { showSaveDialog(o: object): Promise<{ canceled: boolean; filePath?: string }> } } };
  }).electron?.remote?.dialog;
  const nodeRequire = (globalThis as unknown as { require?: (m: string) => { writeFileSync(p: string, c: string, e: string): void } }).require;
  if (!dialog || !nodeRequire) {
    if (target) return saveIntoVault(target, defaultName, content);
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

// ---------------------------------------------------------------------------
// Restore — media placement
// ---------------------------------------------------------------------------

/** Path segments of an untrusted path, or null when it tries to escape. */
function vaultSegments(raw: string): string[] | null {
  const segments = raw
    .replace(/\\/g, "/")
    .split("/")
    .map((s) => s.trim())
    .filter((s) => s !== "" && s !== ".");
  if (segments.some((s) => s === "..")) return null;
  return segments.length > 0 ? segments : null;
}

/**
 * Where a backed-up media file is allowed to land. A backup file is untrusted
 * input — its keys are arbitrary strings — so nothing it names may be written
 * outside the configured media folder: paths pointing elsewhere are relocated
 * into that folder under their file name instead of being honoured.
 */
function mediaTarget(mediaFolder: string, key: string): string | null {
  const segments = vaultSegments(key);
  if (segments === null) return null;
  const folder = vaultSegments(mediaFolder) ?? [];
  const inside =
    folder.length > 0 &&
    segments.length > folder.length &&
    folder.every((seg, i) => segments[i] === seg);
  const relative = inside ? segments.slice(folder.length) : [segments[segments.length - 1]];
  return normalizePath([...folder, ...relative].join("/"));
}

function sameBytes(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) return false;
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
  return true;
}

/** First free `name 2.ext`-style path next to a taken one. */
function availableBinaryPath(app: App, target: string): string {
  const slash = target.lastIndexOf("/");
  const dot = target.lastIndexOf(".");
  const hasExt = dot > slash + 1;
  const base = hasExt ? target.slice(0, dot) : target;
  const ext = hasExt ? target.slice(dot) : "";
  let n = 2;
  let candidate = `${base} ${n}${ext}`;
  while (app.vault.getAbstractFileByPath(candidate)) {
    n += 1;
    candidate = `${base} ${n}${ext}`;
  }
  return candidate;
}

async function ensureParentFolder(app: App, target: string): Promise<void> {
  const dir = target.split("/").slice(0, -1).join("/");
  if (dir && app.vault.getFolderByPath(dir) === null) await ensureFolder(app, dir);
}

/**
 * Write one media file and report where it actually ended up. An existing
 * destination is only reused when its bytes are identical; a same-named but
 * different file keeps its place and the incoming bytes go beside it, so a
 * restored note never silently points at an unrelated image.
 */
async function writeMedia(
  app: App,
  target: string,
  data: ArrayBuffer
): Promise<{ path: string; created: boolean }> {
  const existing = app.vault.getFileByPath(target);
  if (existing) {
    if (sameBytes(await app.vault.readBinary(existing), data)) {
      return { path: existing.path, created: false };
    }
    const alt = availableBinaryPath(app, target);
    await ensureParentFolder(app, alt);
    await app.vault.createBinary(alt, data);
    return { path: alt, created: true };
  }
  await ensureParentFolder(app, target);
  await app.vault.createBinary(target, data);
  return { path: target, created: true };
}

// ---------------------------------------------------------------------------
// Restore — reference rewriting
// ---------------------------------------------------------------------------

const FM_BLOCK = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/;

/**
 * Repoint the note's media references at the paths restore actually used.
 * Only references whose file moved are touched — everything else stays byte
 * for byte as the user wrote it.
 */
function remapReferences(markdown: string, remap: Map<string, string>): string {
  if (remap.size === 0) return markdown;
  const linked = markdown.replace(
    /(!?\[\[)([^\]\n|#^]+)/g,
    (whole, open: string, target: string) => {
      const next = remap.get(target.trim());
      return next === undefined ? whole : `${open}${next}`;
    }
  );
  // Plain frontmatter values are not links, so the wikilink pass misses them.
  // Restricted to the frontmatter block: `photo:` in prose is prose.
  const fm = FM_BLOCK.exec(linked);
  if (!fm) return linked;
  const rewritten = fm[0].replace(
    /^(photo|menu):[ \t]*(.+)$/gm,
    (whole, key: string, value: string) => {
      const raw = value.trim().replace(/^["']|["']$/g, "").trim();
      const next = remap.get(raw);
      return next === undefined ? whole : `${key}: ${next}`;
    }
  );
  return rewritten + linked.slice(fm[0].length);
}

function remapVisits(visits: Visit[], remap: Map<string, string>): Visit[] {
  if (remap.size === 0) return visits;
  return visits.map((v) => {
    if (!v.photos || v.photos.length === 0) return v;
    return { ...v, photos: v.photos.map((p) => remap.get(p.trim()) ?? p) };
  });
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
  for (const w of Array.isArray(parsed.warnings) ? parsed.warnings : []) {
    summary.errors.push(`backup was already incomplete — ${w}`);
  }

  const noteEntries = Array.isArray(parsed.notes) ? parsed.notes : [];
  const notesByPath = new Map<string, BackupNote>();
  for (const entry of noteEntries) {
    if (entry && typeof entry.path === "string") notesByPath.set(entry.path, entry);
  }

  // Media that no spot in this file references is not ours to write anywhere.
  const referenced = new Set<string>();
  for (const spot of parsed.spots) {
    for (const ref of mediaRefsOf(spot)) referenced.add(normalizePath(ref));
  }
  for (const entry of noteEntries) {
    for (const [ref, path] of Object.entries(entry?.refs ?? {})) {
      referenced.add(normalizePath(ref));
      if (typeof path === "string") referenced.add(normalizePath(path));
    }
  }

  const mediaEntries = Object.entries(parsed.media ?? {});
  const total = mediaEntries.length + parsed.spots.length;
  let done = 0;

  // Media first, so the note references written afterwards are already valid.
  const written = new Map<string, string>();
  for (const [key, b64] of mediaEntries) {
    if (signal?.cancelled) return summary;
    onProgress?.(done++, total, key.split("/").pop() ?? key);
    if (!referenced.has(normalizePath(key))) {
      summary.errors.push(`media ${key}: no spot in this backup references it — not restored.`);
      continue;
    }
    const target = mediaTarget(plugin.settings.mediaFolder, key);
    if (target === null) {
      summary.errors.push(`media ${key}: not a usable vault path — not restored.`);
      continue;
    }
    try {
      const result = await writeMedia(plugin.app, target, bufferFromBase64(b64));
      written.set(key, result.path);
      if (result.created) summary.mediaWritten++;
    } catch (e) {
      summary.errors.push(`media ${key}: ${errMsg(e)}`);
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
      const entry = notesByPath.get(spot.path);
      // Reference as written -> where the bytes actually landed. Only files
      // that could NOT be restored to their original path are rewritten; a
      // file back in its old place still resolves from the text as written.
      const remap = new Map<string, string>();
      if (entry) {
        for (const [ref, original] of Object.entries(entry.refs ?? {})) {
          const actual = written.get(original);
          if (actual !== undefined && actual !== normalizePath(original)) remap.set(ref, actual);
        }
      } else {
        for (const ref of mediaRefsOf(spot)) {
          const actual = written.get(ref);
          if (actual !== undefined && actual !== normalizePath(ref)) remap.set(ref, actual);
        }
      }

      if (entry && entry.markdown.trim() !== "") {
        // Raw markdown is the only content-complete form: custom frontmatter,
        // extra sections and raw lines inside `## Visits` all come back.
        const folder = spotFolder(plugin.settings, spot.country ?? "");
        await ensureFolder(plugin.app, folder);
        const path = availablePath(plugin.app, folder, spotFileName(spot.name, spot.city));
        await plugin.app.vault.create(path, remapReferences(entry.markdown, remap));
      } else {
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
          photo: spot.photo === undefined ? undefined : (remap.get(spot.photo.trim()) ?? spot.photo),
          menu: spot.menu === undefined ? undefined : (remap.get(spot.menu.trim()) ?? spot.menu),
          hours: spot.hours,
          tags: spot.tags ?? [],
          visits: remapVisits(spot.visits ?? [], remap),
          legacyId: spot.legacyId,
          notes: spot.notes ?? "",
          created: spot.created,
        };
        await plugin.store.createSpot(input);
      }
      existingKeys.add(key);
      summary.created++;
    } catch (e) {
      summary.errors.push(`${spot.name}: ${errMsg(e)}`);
    }
  }

  new Notice(
    `Restore: ${summary.created} spots created, ${summary.skipped} already existed, ${summary.mediaWritten} media files written${summary.errors.length ? `, ${summary.errors.length} problems (see below)` : ""}.`
  );
  if (summary.errors.length > 0) {
    new Notice(
      `Restore problems: ${summary.errors.slice(0, 3).join(" ")}${summary.errors.length > 3 ? " …" : ""}`,
      15000
    );
  }
  return summary;
}
