/**
 * SpotStore — live index of every note with frontmatter `type: foodspot`,
 * anywhere in the vault. Built from metadataCache, kept fresh via vault +
 * metadataCache events (external edits, sync, AI tools are picked up live).
 *
 * All writes go through noteWriter (processFrontMatter + surgical section
 * replacement). Every index update notifies onChange subscribers and
 * dispatches the "foodspot-data-changed" DOM CustomEvent, debounced ~100ms.
 */
import { TAbstractFile, TFile } from "obsidian";
import type FoodSpotPlugin from "../main";
import {
  DATA_CHANGED_EVENT,
  FoodSpot,
  FRONTMATTER_TYPE,
  SpotInput,
  SpotStoreApi,
  Visit,
} from "../types";
import {
  spotFileName,
  spotFolder,
  todayISO,
} from "./legacyMap";
import {
  buildNoteBody,
  buildSpot,
  computeDerived,
  createSpotNote,
  frontmatterFromInput,
  mutateVisitLines,
  writeNotesSection,
  writeSpotFrontmatter,
} from "./noteWriter";

const FILE_DEBOUNCE_MS = 150;
const NOTIFY_DEBOUNCE_MS = 100;

export class SpotStore implements SpotStoreApi {
  private plugin: FoodSpotPlugin;
  private byPath = new Map<string, FoodSpot>();
  /** Stable array identity until the next index change. */
  private list: FoodSpot[] = [];
  private listeners = new Set<() => void>();
  private fileTimers = new Map<string, number>();
  private notifyTimer: number | null = null;
  private disposed = false;

  constructor(plugin: FoodSpotPlugin) {
    this.plugin = plugin;
  }

  /** Full scan (only here) + event subscriptions. Call once, on layout ready. */
  async initialize(): Promise<void> {
    const { app } = this.plugin;
    for (const file of app.vault.getMarkdownFiles()) {
      await this.indexFile(file);
    }
    this.rebuildList();
    this.notifyChange();

    this.plugin.registerEvent(
      app.metadataCache.on("changed", (file) => this.scheduleReindex(file.path)),
    );
    this.plugin.registerEvent(
      app.vault.on("create", (file) => {
        if (this.isMarkdown(file)) this.scheduleReindex(file.path);
      }),
    );
    this.plugin.registerEvent(
      app.vault.on("delete", (file) => this.removeFromIndex(file.path)),
    );
    this.plugin.registerEvent(
      app.vault.on("rename", (file, oldPath) => {
        this.removeFromIndex(oldPath);
        if (this.isMarkdown(file)) this.scheduleReindex(file.path);
      }),
    );
  }

  dispose(): void {
    this.disposed = true;
    for (const timer of this.fileTimers.values()) window.clearTimeout(timer);
    this.fileTimers.clear();
    if (this.notifyTimer !== null) {
      window.clearTimeout(this.notifyTimer);
      this.notifyTimer = null;
    }
    this.listeners.clear();
    // Vault/metadataCache subscriptions are released by plugin.registerEvent.
  }

  // -------------------------------------------------------------------------
  // SpotStoreApi — reads
  // -------------------------------------------------------------------------

  getSpots(): FoodSpot[] {
    return this.list;
  }

  getByPath(path: string): FoodSpot | undefined {
    return this.byPath.get(path);
  }

  distinct(field: "cuisines" | "tags" | "city" | "district" | "country"): string[] {
    const values = new Set<string>();
    for (const spot of this.byPath.values()) {
      if (field === "cuisines" || field === "tags") {
        for (const v of spot[field]) if (v) values.add(v);
      } else {
        const v = spot[field];
        if (v) values.add(v);
      }
    }
    return [...values].sort((a, b) => a.localeCompare(b));
  }

  fileFor(path: string): TFile | null {
    const file = this.plugin.app.vault.getAbstractFileByPath(path);
    return file instanceof TFile ? file : null;
  }

  onChange(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  // -------------------------------------------------------------------------
  // SpotStoreApi — writes
  // -------------------------------------------------------------------------

  async createSpot(input: SpotInput): Promise<FoodSpot> {
    const { app, settings } = this.plugin;
    const created = input.created ?? todayISO();
    const updated = todayISO();
    const derived = computeDerived(input.visits, input.ratingLocked, input.rating);
    const folder = spotFolder(settings, input.country);
    const fileName = spotFileName(input.name, input.city);
    const file = await createSpotNote(
      app,
      folder,
      fileName,
      frontmatterFromInput(input, derived, { created, updated }),
      buildNoteBody(input.notes, input.visits),
    );

    const spot: FoodSpot = {
      ...input,
      path: file.path,
      visitCount: derived.visitCount,
      lastVisit: derived.lastVisit,
      rating: derived.rating,
      created,
      updated,
    };
    this.setSpot(spot);
    return spot;
  }

  async updateSpot(path: string, input: Partial<SpotInput>): Promise<FoodSpot> {
    const existing = this.requireSpot(path);
    const file = this.requireFile(path);
    const merged: SpotInput = {
      name: input.name ?? existing.name,
      cuisines: input.cuisines ?? existing.cuisines,
      country: input.country ?? existing.country,
      city: "city" in input ? input.city : existing.city,
      district: "district" in input ? input.district : existing.district,
      address: "address" in input ? input.address : existing.address,
      coordinates: "coordinates" in input ? input.coordinates : existing.coordinates,
      status: input.status ?? existing.status,
      favorite: input.favorite ?? existing.favorite,
      rating: "rating" in input ? input.rating : existing.rating,
      ratingLocked: input.ratingLocked ?? existing.ratingLocked,
      price: "price" in input ? input.price : existing.price,
      url: "url" in input ? input.url : existing.url,
      phone: "phone" in input ? input.phone : existing.phone,
      source: input.source ?? existing.source,
      sourceUrl: "sourceUrl" in input ? input.sourceUrl : existing.sourceUrl,
      external: input.external ?? existing.external,
      photo: "photo" in input ? input.photo : existing.photo,
      menu: "menu" in input ? input.menu : existing.menu,
      tags: input.tags ?? existing.tags,
      visits: input.visits ?? existing.visits,
      legacyId: existing.legacyId,
      notes: input.notes ?? existing.notes,
    };
    const updated = todayISO();
    const derived = computeDerived(merged.visits, merged.ratingLocked, merged.rating);

    await writeSpotFrontmatter(
      this.plugin.app,
      file,
      frontmatterFromInput(merged, derived, { created: existing.created, updated }),
    );
    if (input.notes !== undefined && input.notes !== existing.notes) {
      await writeNotesSection(this.plugin.app, file, input.notes);
    }
    if (input.visits !== undefined) {
      // Replace the visit bullets through the raw line model so non-visit
      // lines the user wrote inside `## Visits` survive verbatim.
      const nextVisits = input.visits;
      await mutateVisitLines(this.plugin.app, file, (lines) => {
        let vi = 0;
        const out: typeof lines = [];
        for (const line of lines) {
          if (line.kind === "raw") {
            out.push(line);
            continue;
          }
          if (vi < nextVisits.length) {
            out.push({ kind: "visit", visit: nextVisits[vi] });
            vi += 1;
          }
        }
        for (; vi < nextVisits.length; vi += 1) {
          out.push({ kind: "visit", visit: nextVisits[vi] });
        }
        return out;
      });
    }

    const spot: FoodSpot = {
      ...merged,
      path,
      visitCount: derived.visitCount,
      lastVisit: derived.lastVisit,
      rating: derived.rating,
      created: existing.created,
      updated,
    };
    this.setSpot(spot);
    return spot;
  }

  async addVisit(path: string, visit: Visit): Promise<FoodSpot> {
    return this.mutateVisits(path, (lines) => [
      ...lines,
      { kind: "visit", visit },
    ]);
  }

  async updateVisit(path: string, index: number, visit: Visit): Promise<FoodSpot> {
    return this.mutateVisits(path, (lines) => {
      let seen = -1;
      return lines.map((line) => {
        if (line.kind !== "visit") return line;
        seen += 1;
        return seen === index ? { kind: "visit" as const, visit } : line;
      });
    });
  }

  async deleteVisit(path: string, index: number): Promise<FoodSpot> {
    return this.mutateVisits(path, (lines) => {
      let seen = -1;
      return lines.filter((line) => {
        if (line.kind !== "visit") return true;
        seen += 1;
        return seen !== index;
      });
    });
  }

  async deleteSpot(path: string): Promise<void> {
    const file = this.requireFile(path);
    await this.plugin.app.fileManager.trashFile(file);
    this.removeFromIndex(path);
  }

  async setNotes(path: string, notes: string): Promise<void> {
    const file = this.requireFile(path);
    await writeNotesSection(this.plugin.app, file, notes);
    const existing = this.byPath.get(path);
    if (existing) this.setSpot({ ...existing, notes: notes.trim() });
  }

  async openNote(path: string): Promise<void> {
    const file = this.requireFile(path);
    const leaf = this.plugin.app.workspace.getLeaf("tab");
    await leaf.openFile(file);
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  /** Shared visit mutation: raw-line-safe body rewrite + derived frontmatter. */
  private async mutateVisits(
    path: string,
    mutate: Parameters<typeof mutateVisitLines>[2],
  ): Promise<FoodSpot> {
    const existing = this.requireSpot(path);
    const file = this.requireFile(path);
    const visits = await mutateVisitLines(this.plugin.app, file, mutate);
    const derived = computeDerived(visits, existing.ratingLocked, existing.rating);
    const updated = todayISO();
    await writeSpotFrontmatter(this.plugin.app, file, {
      rating: derived.rating,
      visit_count: derived.visitCount,
      last_visit: derived.lastVisit,
      updated,
    });
    const spot: FoodSpot = {
      ...existing,
      visits,
      visitCount: derived.visitCount,
      lastVisit: derived.lastVisit,
      rating: derived.rating,
      updated,
    };
    this.setSpot(spot);
    return spot;
  }

  private isMarkdown(file: TAbstractFile): file is TFile {
    return file instanceof TFile && file.extension === "md";
  }

  private requireSpot(path: string): FoodSpot {
    const spot = this.byPath.get(path);
    if (!spot) throw new Error(`Food Spot: no spot indexed at "${path}"`);
    return spot;
  }

  private requireFile(path: string): TFile {
    const file = this.fileFor(path);
    if (!file) throw new Error(`Food Spot: note not found at "${path}"`);
    return file;
  }

  /** Debounced per-file re-index (metadataCache "changed" can burst). */
  private scheduleReindex(path: string): void {
    if (this.disposed) return;
    const pending = this.fileTimers.get(path);
    if (pending !== undefined) window.clearTimeout(pending);
    this.fileTimers.set(
      path,
      window.setTimeout(() => {
        this.fileTimers.delete(path);
        void this.reindexPath(path);
      }, FILE_DEBOUNCE_MS),
    );
  }

  private async reindexPath(path: string): Promise<void> {
    if (this.disposed) return;
    const file = this.fileFor(path);
    if (!file) {
      this.removeFromIndex(path);
      return;
    }
    const changed = await this.indexFile(file);
    if (changed) {
      this.rebuildList();
      this.notifyChange();
    }
  }

  /**
   * (Re)index one file from metadataCache + body. Returns true when the
   * index changed. Files without `type: foodspot` are removed if present.
   */
  private async indexFile(file: TFile): Promise<boolean> {
    const cache = this.plugin.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter as Record<string, unknown> | undefined;
    if (!fm || fm.type !== FRONTMATTER_TYPE) {
      return this.byPath.delete(file.path);
    }
    const body = await this.plugin.app.vault.cachedRead(file);
    this.byPath.set(file.path, buildSpot(file.path, fm, body));
    return true;
  }

  private removeFromIndex(path: string): void {
    if (this.byPath.delete(path)) {
      this.rebuildList();
      this.notifyChange();
    }
  }

  /** Insert/replace a spot we just wrote, without waiting for cache events. */
  private setSpot(spot: FoodSpot): void {
    this.byPath.set(spot.path, spot);
    this.rebuildList();
    this.notifyChange();
  }

  private rebuildList(): void {
    this.list = [...this.byPath.values()];
  }

  /** Debounced ~100ms: listeners + workspace trigger + DOM CustomEvent. */
  private notifyChange(): void {
    if (this.disposed) return;
    if (this.notifyTimer !== null) window.clearTimeout(this.notifyTimer);
    this.notifyTimer = window.setTimeout(() => {
      this.notifyTimer = null;
      for (const cb of [...this.listeners]) {
        try {
          cb();
        } catch (e) {
          console.error("Food Spot: onChange listener failed", e);
        }
      }
      this.plugin.app.workspace.trigger(DATA_CHANGED_EVENT);
      document.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
    }, NOTIFY_DEBOUNCE_MS);
  }
}
