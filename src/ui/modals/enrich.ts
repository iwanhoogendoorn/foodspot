/**
 * Food Spot — bulk Google enrichment flow (SPEC-v1.1 §2).
 *
 * Options modal (field checkboxes, overwrite toggle, spot scope, explicit
 * quota note). Progress renders as a non-blocking bar in the Spots toolbar
 * area (count, current name, Cancel) via the `mountEnrichProgress` hook the
 * Spots tab registers; a progress modal is the fallback when that tab is not
 * mounted. The pipeline persists each spot via store.updateSpot as it
 * completes, so a cancelled or failed run keeps everything finished so far.
 * Summary Notice at the end.
 *
 * Google-backed fields are disabled (with a hint) when no API key is set —
 * menu-link discovery only fetches the spot's own website and stays usable.
 */
import { Modal, Notice, setIcon } from "obsidian";
import type { EnrichOptions, FoodSpot, FoodSpotPluginApi } from "../../types";

export type EnrichScope = "all" | "missing" | "filter" | "missing-coords";

/** Inline progress bar handle returned by the Spots tab's mount hook. */
export interface EnrichProgressHandle {
  update(done: number, total: number, current: string): void;
  finish(): void;
}

/**
 * Registered on the plugin by the Spots tab while mounted. Returns null when
 * a bar cannot be shown right now (e.g. another run's bar is active).
 */
export type MountEnrichProgress = (signal: {
  cancelled: boolean;
}) => EnrichProgressHandle | null;

export interface EnrichPreset {
  scope?: EnrichScope;
  /**
   * Overrides the default field selection. The Spots toolbar's "Enrich"
   * button uses it to open on exactly the fields its badge counted, so the
   * number on the button and the number on Start can never disagree.
   */
  fields?: Partial<Omit<EnrichOptions, "overwrite">>;
}

/**
 * The Google-backed fields that make a spot "filled in". Menu links and
 * source discovery are deliberately out: plenty of restaurants simply have
 * no menu URL, so counting them would leave the badge permanently lit.
 */
export const CORE_ENRICH_FIELDS: Omit<EnrichOptions, "overwrite"> = {
  photo: true,
  ratings: true,
  coords: true,
  address: true,
  menu: false,
  discoverSources: false,
};

/** True when `s` lacks at least one of the requested fields. */
export function missingAnyOf(
  s: FoodSpot,
  f: Partial<Omit<EnrichOptions, "overwrite">>
): boolean {
  return (
    (f.photo === true && !s.photo) ||
    (f.ratings === true && s.external.googleRating === undefined) ||
    (f.coords === true && !s.coordinates) ||
    (f.address === true && !s.address) ||
    (f.menu === true && !s.menu) ||
    (f.discoverSources === true &&
      (s.external.tripadvisorRating === undefined ||
        s.external.theforkRating === undefined))
  );
}

/** How many spots the toolbar's "Enrich" button would work on. */
export function countNeedingEnrichment(spots: FoodSpot[]): number {
  let n = 0;
  for (const s of spots) if (missingAnyOf(s, CORE_ENRICH_FIELDS)) n++;
  return n;
}

export function openEnrichModal(plugin: FoodSpotPluginApi, preset?: EnrichPreset): void {
  new EnrichOptionsModal(plugin, preset).open();
}

/**
 * Init hook: exposes the modal on the plugin instance so entry points that
 * must not import UI modules (command palette wiring, settings button, map
 * tab CTA) can call `(plugin as any).openEnrichModal({ scope })`.
 */
export function registerEnrichEntry(plugin: FoodSpotPluginApi): void {
  (plugin as unknown as { openEnrichModal?: (p?: EnrichPreset) => void }).openEnrichModal = (
    p?: EnrichPreset
  ) => openEnrichModal(plugin, p);
}

const FIELD_LABELS: Record<keyof Omit<EnrichOptions, "overwrite">, string> = {
  photo: "Photo (first Google photo, saved into the media folder)",
  ratings: "Public ratings (Google + linked rating sources)",
  coords: "Coordinates",
  address: "Address",
  menu: "Menu link (discovered on the spot's website)",
  discoverSources:
    "Discover rating sources (Eet.nu rating + Facebook link via the Eet.nu API — no key needed)",
};

const SCOPE_LABELS: Record<EnrichScope, string> = {
  all: "All spots",
  missing: "Only spots missing a selected field",
  filter: "Current Spots-tab filter",
  "missing-coords": "Only spots without coordinates",
};

const SCOPE_ORDER: EnrichScope[] = ["all", "missing", "filter", "missing-coords"];

class EnrichOptionsModal extends Modal {
  private fields: Omit<EnrichOptions, "overwrite">;
  private overwrite = false;
  private spotScope: EnrichScope;
  private readonly hasKey: boolean;
  private readonly hasFilterHook: boolean;
  private startBtn!: HTMLButtonElement;
  private msgEl!: HTMLElement;

  constructor(
    private readonly plugin: FoodSpotPluginApi,
    preset?: EnrichPreset
  ) {
    super(plugin.app);
    this.hasKey = plugin.importer.hasGoogleKey();
    // Menu-link discovery needs no Google key — keyless sessions start with
    // only that field on (the Google-backed checkboxes are disabled anyway).
    this.fields = {
      photo: this.hasKey,
      ratings: this.hasKey,
      coords: this.hasKey,
      address: this.hasKey,
      menu: true,
      // Off by default: 6 web searches per spot is a deliberate opt-in.
      discoverSources: false,
      ...preset?.fields,
    };
    // A preset can only ask for fields the session can actually fetch.
    if (!this.hasKey) {
      this.fields.photo = false;
      this.fields.ratings = false;
      this.fields.coords = false;
      this.fields.address = false;
    }
    this.hasFilterHook =
      typeof (this.plugin as unknown as { getCurrentFilteredPaths?: unknown })
        .getCurrentFilteredPaths === "function";
    const preferred = preset?.scope ?? "all";
    // Never resolve "filter" silently to ALL spots — when the Spots tab is
    // closed the option is disabled and the scope falls back to "all".
    this.spotScope = preferred === "filter" && !this.hasFilterHook ? "all" : preferred;
  }

  override onOpen(): void {
    this.modalEl.addClass("fs-modal", "fs-enrich-modal");
    this.titleEl.setText("Enrich from Google");

    if (!this.hasKey) {
      const banner = this.contentEl.createDiv({ cls: "fs-import-warnings" });
      const icon = banner.createSpan({ cls: "fs-dup-icon" });
      setIcon(icon, "key-round");
      banner.createDiv({
        cls: "fs-import-warning",
        text: "The Google-backed fields need a Places API key — add one under Settings → Food Spot → Import. Menu-link discovery reads each spot's own website and works without a key.",
      });
    } else {
      this.contentEl.createEl("p", {
        cls: "fs-import-hint",
        text: "Fetches the selected fields from Google Places for every spot in scope. Existing values are kept unless you enable overwrite.",
      });
    }

    // Field checkboxes
    const fieldsWrap = this.contentEl.createDiv({ cls: "fs-enrich-fields" });
    for (const key of Object.keys(FIELD_LABELS) as (keyof typeof FIELD_LABELS)[]) {
      const label = fieldsWrap.createEl("label", { cls: "fs-checkbox-label" });
      const cb = label.createEl("input", { type: "checkbox" });
      cb.checked = this.fields[key] === true;
      // Menu + source discovery fetch public pages — key-independent.
      cb.disabled = !this.hasKey && key !== "menu" && key !== "discoverSources";
      label.createSpan({ text: FIELD_LABELS[key] });
      cb.addEventListener("change", () => {
        this.fields[key] = cb.checked;
        this.updateStart();
      });
    }

    // Overwrite toggle
    const owLabel = this.contentEl.createEl("label", {
      cls: "fs-checkbox-label fs-enrich-overwrite",
    });
    const owCb = owLabel.createEl("input", { type: "checkbox" });
    owCb.checked = this.overwrite;
    owLabel.createSpan({ text: "Overwrite existing values (default: fill gaps only)" });
    owCb.addEventListener("change", () => {
      this.overwrite = owCb.checked;
    });

    // Scope select
    const scopeWrap = this.contentEl.createDiv({ cls: "fs-field fs-enrich-scope" });
    scopeWrap.createEl("label", { cls: "fs-field-label", text: "Which spots" });
    const select = scopeWrap.createEl("select", { cls: "dropdown" });
    for (const scope of SCOPE_ORDER) {
      const filterUnavailable = scope === "filter" && !this.hasFilterHook;
      const opt = select.createEl("option", {
        text: filterUnavailable
          ? `${SCOPE_LABELS[scope]} (open the Spots tab first)`
          : SCOPE_LABELS[scope],
      });
      opt.value = scope;
      opt.disabled = filterUnavailable;
      if (scope === this.spotScope) opt.selected = true;
    }
    select.addEventListener("change", () => {
      this.spotScope = select.value as EnrichScope;
      this.updateStart();
    });

    // Explicit quota note (SPEC-v1.1 §2) — only relevant when a key is set.
    if (this.hasKey) {
      const quota = this.contentEl.createDiv({ cls: "fs-enrich-quota" });
      const qIcon = quota.createSpan({ cls: "fs-info-icon" });
      setIcon(qIcon, "info");
      quota.createSpan({
        text: "Uses your Google API quota — roughly 3 Google API calls per spot.",
      });
    }

    this.msgEl = this.contentEl.createDiv({ cls: "fs-field-msg" });

    const buttons = this.contentEl.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    this.startBtn = buttons.createEl("button", { cls: "mod-cta" });
    this.startBtn.type = "button";
    this.startBtn.addEventListener("click", () => this.start());
    this.updateStart();
  }

  /** Spots in the selected scope, given the currently selected fields. */
  private resolveSpots(): FoodSpot[] {
    const all = this.plugin.store.getSpots();
    switch (this.spotScope) {
      case "all":
        return all;
      case "missing-coords":
        return all.filter((s) => !s.coordinates);
      case "missing":
        return all.filter((s) => this.missingAny(s));
      case "filter": {
        // Handoff from the Spots tab; falls back to all when the hook is
        // absent (view closed / not wired yet).
        const paths = (
          this.plugin as unknown as { getCurrentFilteredPaths?: () => string[] }
        ).getCurrentFilteredPaths?.();
        if (!paths) return all;
        const wanted = new Set(paths);
        return all.filter((s) => wanted.has(s.path));
      }
    }
  }

  /** True when the spot lacks at least one of the REQUESTED fields. */
  private missingAny(s: FoodSpot): boolean {
    return missingAnyOf(s, this.fields);
  }

  private updateStart(): void {
    const anyField = Object.values(this.fields).some(Boolean);
    // Keyless runs are fine as long as only key-independent fields (menu)
    // are selected — the Google checkboxes are disabled in that state.
    const f = this.fields;
    const keyBlocked = !this.hasKey && (f.photo || f.ratings || f.coords || f.address);
    const n = anyField ? this.resolveSpots().length : 0;
    this.startBtn.setText(`Enrich ${n} spot${n === 1 ? "" : "s"}`);
    this.startBtn.disabled = keyBlocked || !anyField || n === 0;
    if (keyBlocked) {
      this.startBtn.title = "Add a Google Places API key first.";
      this.msgEl.setText("");
    } else if (!anyField) {
      this.msgEl.setText("Pick at least one field to fetch.");
    } else if (n === 0) {
      this.msgEl.setText("No spots match this scope — nothing to enrich.");
    } else {
      this.startBtn.title = "";
      this.msgEl.setText("");
    }
  }

  private start(): void {
    const spots = this.resolveSpots();
    if (spots.length === 0 || !Object.values(this.fields).some(Boolean)) return;
    const opts: EnrichOptions = { ...this.fields, overwrite: this.overwrite };
    this.close();
    void runBulkEnrich(this.plugin, spots, opts);
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}

// ---------------------------------------------------------------- progress

/**
 * Fallback progress UI, used only when the Spots tab (and with it the
 * spec's toolbar progress bar) is not mounted.
 */
class EnrichProgressModal extends Modal {
  private fillEl!: HTMLElement;
  private countEl!: HTMLElement;
  private nameEl!: HTMLElement;
  private cancelBtn!: HTMLButtonElement;

  constructor(
    plugin: FoodSpotPluginApi,
    private readonly total: number,
    /** Shared with bulkEnrich — flipping it stops after the current spot. */
    private readonly signal: { cancelled: boolean }
  ) {
    super(plugin.app);
  }

  override onOpen(): void {
    this.modalEl.addClass("fs-modal", "fs-enrich-progress-modal");
    this.titleEl.setText("Enriching from Google…");
    const track = this.contentEl.createDiv({ cls: "fs-progress-track" });
    this.fillEl = track.createDiv({ cls: "fs-progress-fill" });
    const meta = this.contentEl.createDiv({ cls: "fs-enrich-progress-meta" });
    this.countEl = meta.createSpan({ cls: "fs-enrich-count", text: `0 / ${this.total}` });
    this.nameEl = meta.createSpan({ cls: "fs-enrich-current" });

    const buttons = this.contentEl.createDiv({ cls: "fs-modal-buttons" });
    this.cancelBtn = buttons.createEl("button", { text: "Cancel" });
    this.cancelBtn.type = "button";
    this.cancelBtn.addEventListener("click", () => {
      this.signal.cancelled = true;
      this.cancelBtn.disabled = true;
      this.cancelBtn.setText("Cancelling…");
    });
  }

  update(done: number, total: number, current: string): void {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    this.fillEl.style.width = `${pct}%`;
    this.countEl.setText(`${done} / ${total}`);
    this.nameEl.setText(current);
  }

  override onClose(): void {
    // Closing the modal (Esc, backdrop) counts as cancelling — the run must
    // never continue invisibly in the background.
    this.signal.cancelled = true;
    this.contentEl.empty();
  }
}

async function runBulkEnrich(
  plugin: FoodSpotPluginApi,
  spots: FoodSpot[],
  opts: EnrichOptions
): Promise<void> {
  const signal = { cancelled: false };
  // SPEC-v1.1 §2: progress renders as a non-blocking bar in the Spots
  // toolbar area. The Spots tab registers the mount hook while mounted; the
  // blocking modal is only the fallback when no bar can be shown.
  const mount = (plugin as unknown as { mountEnrichProgress?: MountEnrichProgress })
    .mountEnrichProgress;
  const inline = mount?.(signal) ?? null;
  let modal: EnrichProgressModal | null = null;
  if (inline === null) {
    modal = new EnrichProgressModal(plugin, spots.length, signal);
    modal.open();
  }
  const onProgress = (done: number, total: number, current: string): void => {
    inline?.update(done, total, current);
    modal?.update(done, total, current);
  };
  let result: { updated: number; skipped: number; failed: string[] };
  try {
    // bulkEnrich writes each finished spot through store.updateSpot before
    // moving on — progress is durable across cancel/quit.
    result = await plugin.importer.bulkEnrich(spots, opts, onProgress, signal);
  } catch (e) {
    inline?.finish();
    modal?.close();
    new Notice(`Enrichment failed — ${errorMessage(e)}`);
    return;
  }
  const cancelled = signal.cancelled;
  inline?.finish();
  modal?.close();
  const parts = [`${result.updated} updated`, `${result.skipped} skipped`];
  if (result.failed.length > 0) {
    const names = result.failed.slice(0, 5).join(", ");
    parts.push(`${result.failed.length} failed (${names}${result.failed.length > 5 ? ", …" : ""})`);
  }
  new Notice(
    `${cancelled ? "Enrichment cancelled" : "Enrichment done"} — ${parts.join(" · ")}.`,
    10000
  );
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
