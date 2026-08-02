/**
 * v0.1 legacy JSON -> markdown notes migration.
 *
 * Safety order:
 * 1. Backup `data.json.pre-migration.bak` written into the plugin folder
 *    BEFORE anything else.
 * 2. One note per legacy spot; idempotent via `legacy_id` (already-migrated
 *    spots are skipped); filename collisions get a numeric suffix — an
 *    existing note is NEVER overwritten.
 * 3. The `spots` key is stripped from data.json ONLY when every spot
 *    migrated without error; on any error the legacy data stays intact.
 */
import { Notice } from "obsidian";
import type FoodSpotPlugin from "../main";
import { legacySpotToNote } from "./legacyMap";
import { createSpotNote } from "./noteWriter";

export interface MigrationResult {
  created: number;
  skipped: number;
  errors: string[];
}

/** True when plugin data.json holds a non-empty legacy `spots` array. */
export async function detectLegacySpots(plugin: FoodSpotPlugin): Promise<boolean> {
  const raw = (await plugin.loadData()) as Record<string, unknown> | null;
  return !!raw && Array.isArray(raw.spots) && raw.spots.length > 0;
}

export async function runLegacyMigration(
  plugin: FoodSpotPlugin,
  opts: { interactive: boolean },
): Promise<MigrationResult> {
  const result: MigrationResult = { created: 0, skipped: 0, errors: [] };
  const notify = (msg: string, timeout?: number) => {
    if (opts.interactive) new Notice(msg, timeout);
  };

  const raw = ((await plugin.loadData()) ?? {}) as Record<string, unknown>;
  const spots: unknown[] = Array.isArray(raw.spots) ? raw.spots : [];

  if (spots.length === 0) {
    plugin.settings.legacyMigrationDone = true;
    await plugin.saveSettings();
    notify("Food Spot: no legacy JSON spots found — nothing to migrate.");
    return result;
  }

  // 1. Backup into the plugin folder, before any write.
  const pluginDir = plugin.manifest.dir;
  if (!pluginDir) {
    result.errors.push("Plugin folder unknown (manifest.dir missing) — backup impossible, migration aborted.");
    notify("Food Spot: migration aborted — could not locate the plugin folder for the backup.");
    return result;
  }
  try {
    await plugin.app.vault.adapter.write(
      `${pluginDir}/data.json.pre-migration.bak`,
      JSON.stringify(raw, null, 2),
    );
  } catch (e) {
    result.errors.push(`Backup failed: ${messageOf(e)} — migration aborted.`);
    notify("Food Spot: migration aborted — writing data.json.pre-migration.bak failed.");
    return result;
  }

  notify(`Food Spot: migrating ${spots.length} legacy spots to notes…`);

  // 2. Idempotency: legacy_ids already present in the note index — PLUS an
  // index-independent scan. The live index can lag (store still initializing,
  // or notes created seconds ago that metadataCache hasn't resolved yet);
  // relying on it alone re-created already-migrated spots as " 2" duplicates.
  const migratedIds = new Set<string>();
  for (const spot of plugin.store.getSpots()) {
    if (spot.legacyId) migratedIds.add(spot.legacyId);
  }
  for (const file of plugin.app.vault.getMarkdownFiles()) {
    const cache = plugin.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter as Record<string, unknown> | undefined;
    if (fm) {
      const id = fm.legacy_id ?? fm.legacyId;
      if (typeof id === "string" && id) migratedIds.add(id);
      continue;
    }
    if (cache) continue; // indexed and no frontmatter — nothing to find
    // Not yet in metadataCache (e.g. created by a partial run moments ago):
    // read the frontmatter block directly.
    try {
      const head = (await plugin.app.vault.cachedRead(file)).slice(0, 4000);
      if (!head.startsWith("---")) continue;
      const close = head.indexOf("\n---", 3);
      const block = close === -1 ? head : head.slice(0, close);
      const m = /^legacy_id:\s*["']?([^"'\r\n]+?)["']?\s*$/m.exec(block);
      if (m?.[1]) migratedIds.add(m[1].trim());
    } catch {
      // unreadable file — ignore
    }
  }

  for (let i = 0; i < spots.length; i++) {
    const legacy = spots[i] as Record<string, unknown>;
    const label =
      (typeof legacy?.name === "string" && legacy.name) ||
      (typeof legacy?.id === "string" && legacy.id) ||
      `spot #${i + 1}`;
    try {
      const legacyId = typeof legacy?.id === "string" ? legacy.id : undefined;
      if (legacyId && migratedIds.has(legacyId)) {
        result.skipped += 1;
        continue;
      }
      const plan = legacySpotToNote(legacy, plugin.settings);
      await createSpotNote(
        plugin.app,
        plan.folder,
        plan.fileName,
        plan.frontmatter,
        plan.body,
      );
      if (legacyId) migratedIds.add(legacyId);
      result.created += 1;
      if (opts.interactive && result.created % 25 === 0) {
        notify(`Food Spot: migrated ${result.created}/${spots.length}…`, 3000);
      }
    } catch (e) {
      result.errors.push(`${label}: ${messageOf(e)}`);
    }
  }

  // 3. Strip `spots` from data.json only after a fully clean run.
  if (result.errors.length === 0) {
    const fresh = ((await plugin.loadData()) ?? {}) as Record<string, unknown>;
    delete fresh.spots;
    plugin.settings.legacyMigrationDone = true;
    fresh.settings = plugin.settings;
    await plugin.saveData(fresh);
    notify(
      `Food Spot: migration complete — ${result.created} notes created, ${result.skipped} already migrated. Backup: ${pluginDir}/data.json.pre-migration.bak`,
      10000,
    );
  } else {
    notify(
      `Food Spot: migration finished with ${result.errors.length} errors (${result.created} created, ${result.skipped} skipped). Legacy data kept intact — fix and re-run. First error: ${result.errors[0]}`,
      15000,
    );
  }

  return result;
}

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
