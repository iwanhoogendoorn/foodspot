/**
 * Food Spot — duplicate finder / merge review modal.
 *
 * Scans the whole library with the pure rules in tools/duplicates.ts and shows
 * one row per suspected pair: why they matched, a compact summary of each side,
 * and a merge button per direction so the user picks which note survives.
 *
 * Safety: every merge is confirmed with its consequence spelled out, the store
 * writes are wrapped individually, and a failed write always says which spot
 * was (or was not) changed — the library is never left half-merged in silence.
 * "Not a duplicate" only hides the row for this session; nothing is persisted.
 */
import { Modal, Notice, setIcon } from "obsidian";
import type { FoodSpot, FoodSpotPluginApi } from "../../types";
import { confirmModal } from "./confirm";
import type { DupPair, DupReason } from "../../tools/duplicates";
import { findDuplicates, pairDistance, pairKey, planMerge } from "../../tools/duplicates";

export function openDuplicatesModal(plugin: FoodSpotPluginApi): void {
  new DuplicatesModal(plugin).open();
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

const REASON_ICON: Record<DupReason, string> = {
  "place-id": "map-pin",
  "name-city": "type",
  proximity: "move-horizontal",
};

/** Human "why did these match" label; proximity carries the real distance. */
function reasonLabel(pair: DupPair): string {
  switch (pair.reason) {
    case "place-id":
      return "same Google place";
    case "name-city":
      return "same name & city";
    case "proximity": {
      const dist = pairDistance(pair.a, pair.b);
      return dist === undefined ? "nearly the same spot" : `${Math.round(dist)} m apart`;
    }
  }
}

/** One-line "what is on this note" summary shown under each name. */
function summaryOf(spot: FoodSpot): string {
  const parts: string[] = [];
  parts.push(spot.rating !== undefined ? `${spot.rating}★` : "no rating");
  parts.push(`${spot.visitCount} visit${spot.visitCount === 1 ? "" : "s"}`);
  if (spot.photo) parts.push("photo");
  if (spot.external.googleRating !== undefined)
    parts.push(`Google ${spot.external.googleRating}`);
  return parts.join(" · ");
}

function locationOf(spot: FoodSpot): string {
  return [spot.city, spot.country].filter((v) => (v ?? "").trim() !== "").join(", ");
}

class DuplicatesModal extends Modal {
  private pairs: DupPair[] = [];
  /** Pairs the user called a false positive — this session only. */
  private readonly dismissed = new Set<string>();
  /** Notes already trashed by a merge, before the index catches up. */
  private readonly gone = new Set<string>();
  private busy = false;
  private listEl!: HTMLElement;
  private countEl!: HTMLElement;

  constructor(private readonly plugin: FoodSpotPluginApi) {
    super(plugin.app);
  }

  override onOpen(): void {
    this.modalEl.addClass("fs-modal", "fs-duplicates-modal");
    this.titleEl.setText("Duplicate spots");
    this.countEl = this.contentEl.createDiv({ cls: "fs-dupfind-count" });
    this.listEl = this.contentEl.createDiv({ cls: "fs-dupfind-list" });

    const buttons = this.contentEl.createDiv({ cls: "fs-modal-buttons" });
    const close = buttons.createEl("button", { text: "Close" });
    close.type = "button";
    close.addEventListener("click", () => this.close());

    this.rescan();
  }

  override onClose(): void {
    this.contentEl.empty();
  }

  /** Re-run detection against the live index and repaint the list. */
  private rescan(): void {
    let all: DupPair[];
    try {
      all = findDuplicates(this.plugin.store.getSpots());
    } catch (e) {
      all = [];
      new Notice(`Duplicate scan failed: ${errMsg(e)}`);
    }
    this.pairs = all.filter(
      (p) =>
        !this.dismissed.has(pairKey(p.a, p.b)) &&
        !this.gone.has(p.a.path) &&
        !this.gone.has(p.b.path),
    );
    this.render();
  }

  private render(): void {
    this.listEl.empty();
    if (this.pairs.length === 0) {
      this.countEl.setText("");
      this.listEl.createDiv({
        cls: "fs-empty-state",
        text: "No duplicates found — your library is clean.",
      });
      return;
    }
    this.countEl.setText(
      `${this.pairs.length} possible duplicate${this.pairs.length === 1 ? "" : "s"}. Merging keeps one note and combines everything from the other.`,
    );
    for (const pair of this.pairs) this.renderRow(pair);
  }

  private renderRow(pair: DupPair): void {
    const row = this.listEl.createDiv({ cls: "fs-dupfind-row" });

    const badge = row.createDiv({ cls: `fs-dupfind-badge fs-dupfind-${pair.reason}` });
    const icon = badge.createSpan({ cls: "fs-dupfind-badge-icon" });
    setIcon(icon, REASON_ICON[pair.reason]);
    badge.createSpan({ text: reasonLabel(pair) });

    const sides = row.createDiv({ cls: "fs-dupfind-sides" });
    for (const spot of [pair.a, pair.b]) {
      const side = sides.createDiv({ cls: "fs-dupfind-side" });
      side.createDiv({ cls: "fs-dupfind-name", text: spot.name });
      const where = locationOf(spot);
      if (where !== "") side.createDiv({ cls: "fs-dupfind-where", text: where });
      side.createDiv({ cls: "fs-dupfind-meta", text: summaryOf(spot) });
    }

    const actions = row.createDiv({ cls: "fs-dupfind-actions" });
    const buttons: HTMLButtonElement[] = [];
    const mergeBtn = (keep: FoodSpot, drop: FoodSpot): void => {
      const btn = actions.createEl("button", {
        cls: "fs-small-btn",
        text: `Merge → keep ${keep.name}`,
      });
      btn.type = "button";
      btn.addEventListener("click", () => void this.merge(pair, keep, drop, buttons));
      buttons.push(btn);
    };
    mergeBtn(pair.a, pair.b);
    mergeBtn(pair.b, pair.a);

    const notDup = actions.createEl("button", { cls: "fs-small-btn", text: "Not a duplicate" });
    notDup.type = "button";
    notDup.addEventListener("click", () => {
      if (this.busy) return;
      this.dismissed.add(pairKey(pair.a, pair.b));
      this.pairs = this.pairs.filter((p) => p !== pair);
      this.render();
    });
    buttons.push(notDup);
  }

  private async merge(
    pair: DupPair,
    keep: FoodSpot,
    drop: FoodSpot,
    buttons: HTMLButtonElement[],
  ): Promise<void> {
    if (this.busy) return;
    const ok = await confirmModal(this.app, {
      title: `Merge "${drop.name}" into "${keep.name}"?`,
      body: `"${drop.name}" is merged into "${keep.name}" and its note moves to the trash. Visits, ratings and photos are combined.`,
      cta: `Merge into ${keep.name}`,
      danger: true,
    });
    if (!ok) return;

    this.busy = true;
    for (const b of buttons) b.disabled = true;
    try {
      try {
        await this.plugin.store.updateSpot(keep.path, planMerge(keep, drop));
      } catch (e) {
        new Notice(
          `Merge failed — "${keep.name}" was not changed and "${drop.name}" is still there: ${errMsg(e)}`,
          10000,
        );
        for (const b of buttons) b.disabled = false;
        return;
      }
      try {
        await this.plugin.store.deleteSpot(drop.path);
      } catch (e) {
        new Notice(
          `"${keep.name}" now holds the combined data, but "${drop.name}" could not be trashed (${errMsg(e)}) — delete that note by hand.`,
          10000,
        );
        this.rescan();
        return;
      }
      this.gone.add(drop.path);
      this.dismissed.add(pairKey(pair.a, pair.b));
      new Notice(
        `Merged "${drop.name}" into "${keep.name}" — its note is in the trash.`,
        8000,
      );
      this.rescan();
    } finally {
      this.busy = false;
    }
  }
}
