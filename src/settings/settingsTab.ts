/**
 * Food Spot — settings tab (WatchLog-style navigator layout).
 *
 * Left nav: General / Data / API / Customize / Import / Widgets / Quick info.
 * Right body: settingsGroup panels with icon, subtitle and live status chip,
 * `?` inline-help toggles. Every control reads AND writes a real settings
 * field; render-affecting changes dispatch "foodspot-data-changed".
 */
import {
  AbstractInputSuggest,
  App,
  Modal,
  Notice,
  Platform,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  TFolder,
  normalizePath,
  setIcon,
} from "obsidian";
import type { FoodSpot, FoodSpotPluginApi, FoodSpotSettings } from "../types";
import { DATA_CHANGED_EVENT } from "../types";
import { confirmModal } from "../ui/modals/confirm";
import { openDuplicatesModal } from "../ui/modals/duplicates";
import { starRating } from "../ui/components/starRating";
import { buildBackupJson, importBackup, saveToDisk } from "../store/backup";
import type { VaultSaveTarget } from "../store/backup";
import { sanitizeFileName } from "../import/pipeline";
import { embedRefPath } from "../store/visitsParser";
import { todayIso } from "../util/dates";
import { ProgressModal } from "../ui/modals/progress";

type FoodSpotPlugin = Plugin & FoodSpotPluginApi;

type ChipTone = "ok" | "warn" | "pending";

interface GroupHandle {
  content: HTMLElement;
  setChip(text: string, tone: ChipTone): void;
}

interface NavSection {
  id: string;
  label: string;
  icon: string;
}

const NAV_SECTIONS: NavSection[] = [
  { id: "general", label: "General", icon: "settings" },
  { id: "data", label: "Data", icon: "database" },
  { id: "api", label: "API", icon: "key-round" },
  { id: "customize", label: "Customize", icon: "palette" },
  { id: "import", label: "Import", icon: "download" },
  { id: "widgets", label: "Widgets", icon: "code" },
  { id: "info", label: "Quick info", icon: "info" },
];

/** 7-step card size slider value (-3..3) → min-width px (WatchLog mapping). */
const CARD_WIDTHS = [100, 120, 140, 160, 185, 215, 250];

const GOOGLE_KEY_URL =
  "https://developers.google.com/maps/documentation/places/web-service/get-api-key";

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function csvCell(v: string | number | boolean | undefined): string {
  if (v === undefined) return "";
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function spotsToCsv(spots: FoodSpot[]): string {
  const header = [
    "name", "status", "favorite", "country", "city", "district", "address",
    "cuisines", "tags", "price", "rating", "google_rating", "google_rating_count",
    "tripadvisor_rating", "visit_count", "last_visit", "url", "phone",
    "created", "updated", "path",
  ];
  const lines = [header.join(",")];
  for (const s of spots) {
    lines.push(
      [
        csvCell(s.name), csvCell(s.status), csvCell(s.favorite), csvCell(s.country),
        csvCell(s.city), csvCell(s.district), csvCell(s.address),
        csvCell(s.cuisines.join("; ")), csvCell(s.tags.join("; ")), csvCell(s.price),
        csvCell(s.rating), csvCell(s.external.googleRating),
        csvCell(s.external.googleRatingCount), csvCell(s.external.tripadvisorRating),
        csvCell(s.visitCount), csvCell(s.lastVisit), csvCell(s.url), csvCell(s.phone),
        csvCell(s.created), csvCell(s.updated), csvCell(s.path),
      ].join(","),
    );
  }
  return lines.join("\n") + "\n";
}

/** Result of deciding which files inside the media folder Food Spot may trash. */
interface MediaOwnership {
  /** Every file in the media subtree Food Spot can prove it owns. */
  owned: TFile[];
  /** Files deliberately spared, with the reason shown to the user. */
  leftAlone: { file: TFile; reason: string }[];
  /** Vault paths a spot note references right now (resolved through links). */
  referenced: Set<string>;
  /** True when the media folder sits inside the spots folder (plugin's own). */
  dedicated: boolean;
  folderPath: string;
}

/** Dish imports name files "<spot> <YYYY-MM-DD> <n>" — our own fingerprint. */
const DISH_FILE_SUFFIX = /\s\d{4}-\d{2}-\d{2}(\s\d+)?$/;

/**
 * Decide what Food Spot is allowed to trash inside `settings.mediaFolder`.
 *
 * The folder is user-configurable and may well be a shared attachment folder,
 * so nothing is trashed on location alone: a file must either be referenced by
 * a spot right now, carry a name this plugin generates, or live in a media
 * folder nested inside the spots folder (which is ours by construction). A
 * file any non-spot note links to is never ours, whatever its name.
 *
 * Callers must classify BEFORE deleting notes — a trashed note can no longer
 * vouch for the photo it referenced.
 */
function classifyMediaFolder(
  app: App,
  settings: FoodSpotSettings,
  spots: FoodSpot[],
): MediaOwnership | null {
  const folderPath = normalizePath(settings.mediaFolder);
  const folder = app.vault.getFolderByPath(folderPath);
  if (!folder) return null;
  const spotsRoot = normalizePath(settings.spotsFolder);
  const dedicated = folderPath !== spotsRoot && folderPath.startsWith(`${spotsRoot}/`);

  const spotPaths = new Set(spots.map((s) => s.path));
  const referenced = new Set<string>();
  for (const spot of spots) {
    const refs = [
      spot.photo,
      spot.menu,
      // Dish photos are embed targets and may carry a `|300` display alias —
      // an unstripped ref resolves to nothing, and the file behind it would
      // then be classed as unreferenced and trashed by the sweep below.
      ...spot.visits.flatMap((v) => (v.photos ?? []).map(embedRefPath)),
    ];
    for (const ref of refs) {
      if (!ref || /^https?:\/\//i.test(ref)) continue;
      const f =
        app.metadataCache.getFirstLinkpathDest(ref, spot.path) ??
        app.vault.getAbstractFileByPath(normalizePath(ref));
      referenced.add(f instanceof TFile ? f.path : normalizePath(ref));
    }
  }

  // Anything the rest of the vault links to belongs to that note, not to us.
  const linkedElsewhere = new Set<string>();
  for (const [source, targets] of Object.entries(app.metadataCache.resolvedLinks)) {
    if (spotPaths.has(source)) continue;
    for (const target of Object.keys(targets)) linkedElsewhere.add(target);
  }

  const dishDir = `${folderPath}/dishes`;
  const spotBases = new Set<string>();
  for (const spot of spots) {
    const name = spot.name.trim().toLowerCase();
    if (name) spotBases.add(name);
    const sanitized = sanitizeFileName(spot.name).trim().toLowerCase();
    if (sanitized) spotBases.add(sanitized);
  }
  const pluginNamed = (file: TFile): boolean => {
    if (file.parent?.path === dishDir) return DISH_FILE_SUFFIX.test(file.basename);
    const base = file.basename.trim().toLowerCase();
    return spotBases.has(base) || spotBases.has(base.replace(/\s+\d+$/, "").trim());
  };

  const owned: TFile[] = [];
  const leftAlone: { file: TFile; reason: string }[] = [];
  const walk = (dir: TFolder): void => {
    for (const child of dir.children) {
      if (child instanceof TFolder) {
        walk(child);
        continue;
      }
      if (!(child instanceof TFile)) continue;
      if (linkedElsewhere.has(child.path)) {
        leftAlone.push({ file: child, reason: "linked from another note" });
      } else if (referenced.has(child.path) || dedicated || pluginNamed(child)) {
        owned.push(child);
      } else {
        leftAlone.push({ file: child, reason: "not created by Food Spot" });
      }
    }
  };
  walk(folder);
  return { owned, leftAlone, referenced, dedicated, folderPath };
}

/** "3 files" / "1 file" */
function plural(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

export class FoodSpotSettingTab extends PluginSettingTab {
  private plugin: FoodSpotPlugin;
  private active = "general";
  private bodyEl!: HTMLElement;
  private navEl!: HTMLElement;
  private dispatchTimer: number | null = null;

  constructor(app: App, plugin: FoodSpotPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // -------------------------------------------------------------------------
  // helpers
  // -------------------------------------------------------------------------

  private async save(): Promise<void> {
    await this.plugin.saveSettings();
  }

  /** Debounced "something visual changed — repaint views/widgets". */
  private touch(): void {
    if (this.dispatchTimer !== null) window.clearTimeout(this.dispatchTimer);
    this.dispatchTimer = window.setTimeout(() => {
      this.dispatchTimer = null;
      document.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
    }, 250);
  }

  /** WatchLog settingsGroup(): titled panel with icon, subtitle, status chip. */
  private group(
    parent: HTMLElement,
    o: { icon: string; title: string; subtitle: string; chip?: { text: string; tone: ChipTone } },
  ): GroupHandle {
    const box = parent.createDiv({ cls: "fs-sgroup" });
    const head = box.createDiv({ cls: "fs-sgroup-head" });
    const icon = head.createDiv({ cls: "fs-sgroup-icon" });
    setIcon(icon, o.icon);
    const titles = head.createDiv({ cls: "fs-sgroup-titles" });
    titles.createDiv({ cls: "fs-sgroup-title", text: o.title });
    titles.createDiv({ cls: "fs-sgroup-sub", text: o.subtitle });
    const chip = head.createSpan({ cls: "fs-chip" });
    chip.hide();
    const setChip = (text: string, tone: ChipTone) => {
      chip.show();
      chip.setText(text);
      chip.removeClass("fs-chip-ok", "fs-chip-warn", "fs-chip-pending");
      chip.addClass(`fs-chip-${tone}`);
    };
    if (o.chip) setChip(o.chip.text, o.chip.tone);
    return { content: box.createDiv({ cls: "fs-sgroup-body" }), setChip };
  }

  /** `?` inline-help toggle on a Setting row. */
  private addHelp(setting: Setting, text: string): void {
    let helpEl: HTMLElement | null = null;
    setting.addExtraButton((b) =>
      b
        .setIcon("help-circle")
        .setTooltip("What does this do?")
        .onClick(() => {
          if (helpEl) {
            helpEl.remove();
            helpEl = null;
            return;
          }
          helpEl = createDiv({ cls: "fs-setting-help", text });
          setting.settingEl.insertAdjacentElement("afterend", helpEl);
        }),
    );
  }

  /**
   * Fallback location for exports and backups on mobile, where there is no
   * system save dialog: a folder next to the spot notes. Ignored on desktop —
   * saveToDisk only reaches for it when the dialog is missing.
   */
  private exportTarget(): VaultSaveTarget {
    return {
      app: this.app,
      folder: `${this.plugin.settings.spotsFolder}/_exports`,
    };
  }

  private spots(): FoodSpot[] {
    try {
      return this.plugin.store.getSpots();
    } catch {
      return [];
    }
  }

  // -------------------------------------------------------------------------
  // shell
  // -------------------------------------------------------------------------

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("fs-settings");
    // 80-mobile.css keys off these. Two classes, not one: a tablet is wide
    // enough to keep the desktop nav rail and Obsidian's own row layout, so
    // only the phone gets the section grid and the stacked controls. The names
    // are namespaced on purpose — a bare `is-mobile` on this element would
    // collide with Obsidian's own `.is-mobile` rules.
    containerEl.toggleClass("fs-settings-mobile", Platform.isMobile);
    containerEl.toggleClass("fs-settings-phone", Platform.isPhone);

    this.navEl = containerEl.createDiv({ cls: "fs-settings-nav" });
    this.bodyEl = containerEl.createDiv({ cls: "fs-settings-body" });

    for (const sec of NAV_SECTIONS) {
      const btn = this.navEl.createEl("button", { cls: "fs-settings-nav-item" });
      const icon = btn.createSpan({ cls: "fs-settings-nav-icon" });
      setIcon(icon, sec.icon);
      btn.createSpan({ text: sec.label });
      btn.toggleClass("is-active", sec.id === this.active);
      btn.onclick = () => {
        this.active = sec.id;
        this.navEl
          .findAll(".fs-settings-nav-item")
          .forEach((el) => el.removeClass("is-active"));
        btn.addClass("is-active");
        this.renderBody();
        // On a phone the grid fills the screen, so a freshly picked section
        // would render below the fold. Bring it up.
        if (Platform.isMobile) {
          this.bodyEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };
    }
    this.renderBody();
  }

  hide(): void {
    this.containerEl.removeClass("fs-settings", "fs-settings-mobile", "fs-settings-phone");
    super.hide();
  }

  private renderBody(): void {
    const body = this.bodyEl;
    body.empty();
    switch (this.active) {
      case "general": this.renderGeneral(body); break;
      case "data": this.renderData(body); break;
      case "api": this.renderApi(body); break;
      case "customize": this.renderCustomize(body); break;
      case "import": this.renderImport(body); break;
      case "widgets": this.renderWidgets(body); break;
      case "info": this.renderInfo(body); break;
      default: this.renderGeneral(body);
    }
  }

  // -------------------------------------------------------------------------
  // General
  // -------------------------------------------------------------------------

  private renderGeneral(body: HTMLElement): void {
    const s = this.plugin.settings;
    const g = this.group(body, {
      icon: "settings",
      title: "General",
      subtitle: "Storage location, formats and rating behavior",
      chip: { text: `Media → ${s.mediaFolder}`, tone: "ok" },
    });
    const c = g.content;

    const folder = new Setting(c)
      .setName("Spots folder")
      .setDesc("Vault folder where spot notes are created. Type to search existing folders.")
      .addText((t) => {
        t.setPlaceholder("Food Spot")
          .setValue(s.spotsFolder)
          .onChange(async (v) => {
            s.spotsFolder = v.trim() || "Food Spot";
            await this.save();
          });
        new FolderSuggest(this.app, t.inputEl);
      });
    this.addHelp(
      folder,
      "New spot notes are written here. Existing notes can live anywhere — the index follows the 'type: foodspot' frontmatter, not the folder.",
    );

    const org = new Setting(c)
      .setName("Organize by country")
      .setDesc("Create a per-country subfolder, e.g. Food Spots/Netherlands/.")
      .addToggle((t) =>
        t.setValue(s.organizeByCountry).onChange(async (v) => {
          s.organizeByCountry = v;
          await this.save();
        }),
      );
    this.addHelp(org, "Only affects newly created notes. Moving a note never breaks it.");

    const relocate = new Setting(c)
      .setName("Apply folder layout to existing notes")
      .setDesc(
        "Moves every spot note into the folder configured above (with per-country subfolders when enabled). Wiki-links keep working; subfolders of the spots folder that end up empty are cleaned up.",
      );
    relocate.addButton((b) =>
      b.setButtonText("Relocate notes").onClick(async () => {
        b.setDisabled(true);
        try {
          const res = await this.relocateNotes();
          new Notice(
            `Relocated ${res.moved} notes; ${res.kept} were already in place${res.failed > 0 ? `; ${res.failed} failed` : ""}.`,
            8000,
          );
        } catch (e) {
          new Notice(`Relocation failed: ${errMsg(e)}`);
        } finally {
          b.setDisabled(false);
        }
      }),
    );
    this.addHelp(
      relocate,
      "Use this after changing the spots folder or the per-country toggle. Notes are moved with Obsidian's rename (links and backlinks update automatically); nothing is copied or deleted. Folders outside the spots folder are never trashed, even when they end up empty.",
    );

    const media = new Setting(c)
      .setName("Media folder")
      .setDesc("Vault folder where photos fetched by Google enrichment are saved. Type to search existing folders.")
      .addText((t) => {
        t.setPlaceholder("Food Spot/_media")
          .setValue(s.mediaFolder)
          .onChange(async (v) => {
            s.mediaFolder = v.trim() || "Food Spot/_media";
            g.setChip(`Media → ${s.mediaFolder}`, "ok");
            await this.save();
          });
        new FolderSuggest(this.app, t.inputEl);
      });
    this.addHelp(
      media,
      "Enrichment downloads a spot's top Google photo as a .jpg into this folder and links it as the card image. The folder is created on first download; changing it later never moves already-saved files.",
    );

    new Setting(c)
      .setName("Default country")
      .setDesc("Pre-filled in the add form for new spots.")
      .addDropdown((d) => {
        d.addOption("", "— none —");
        // Countries already in the library first, then the world list.
        const inLibrary = this.plugin.store.distinct("country");
        const seen = new Set<string>();
        for (const cty of [...inLibrary, ...COUNTRIES]) {
          if (!cty || seen.has(cty)) continue;
          seen.add(cty);
          d.addOption(cty, cty);
        }
        // A stored custom value must stay selectable.
        if (s.defaultCountry && !seen.has(s.defaultCountry))
          d.addOption(s.defaultCountry, s.defaultCountry);
        d.setValue(s.defaultCountry).onChange(async (v) => {
          s.defaultCountry = v;
          await this.save();
        });
      });

    new Setting(c)
      .setName("Currency")
      .setDesc("Symbol shown for price tiers and amounts spent on visits.")
      .addDropdown((d) => {
        for (const [sym, label] of CURRENCIES) d.addOption(sym, label);
        if (!CURRENCIES.some(([sym]) => sym === s.currencySymbol))
          d.addOption(s.currencySymbol, s.currencySymbol);
        d.setValue(s.currencySymbol).onChange(async (v) => {
          s.currencySymbol = v || "€";
          await this.save();
          this.touch();
        });
      });

    new Setting(c)
      .setName("Date format")
      .setDesc("How dates are displayed across the plugin.")
      .addDropdown((d) =>
        d
          .addOption("european", "European (31-12-2026)")
          .addOption("american", "American (12/31/2026)")
          .addOption("iso", "ISO (2026-12-31)")
          .setValue(s.dateFormat)
          .onChange(async (v) => {
            s.dateFormat = v as typeof s.dateFormat;
            await this.save();
            this.touch();
          }),
      );

    const half = new Setting(c)
      .setName("Half-star ratings")
      .setDesc("Allow 0.5 steps when rating spots and visits.")
      .addToggle((t) =>
        t.setValue(s.halfStarRatings).onChange(async (v) => {
          s.halfStarRatings = v;
          await this.save();
          this.touch();
        }),
      );
    this.addHelp(half, "Existing half-star values are kept either way — this only changes the rating input.");

    const stale = new Setting(c)
      .setName("Stale rating threshold")
      .setDesc(`External ratings older than ${s.staleRatingThresholdDays} days get a stale badge.`)
      .addSlider((sl) =>
        sl
          .setLimits(30, 720, 30)
          .setValue(s.staleRatingThresholdDays)
          .setDynamicTooltip()
          .onChange(async (v) => {
            s.staleRatingThresholdDays = v;
            stale.setDesc(`External ratings older than ${v} days get a stale badge.`);
            await this.save();
            this.touch();
          }),
      );
    this.addHelp(
      stale,
      "Google/TripAdvisor ratings are only refreshed when you ask (per spot or via the bulk command). The badge reminds you when a number is old.",
    );
  }

  // -------------------------------------------------------------------------
  // Data
  // -------------------------------------------------------------------------

  private renderData(body: HTMLElement): void {
    const spots = this.spots();
    const g = this.group(body, {
      icon: "database",
      title: "Data",
      subtitle: "Maintenance and exports",
      chip: { text: `${spots.length} spots indexed`, tone: spots.length ? "ok" : "pending" },
    });
    const c = g.content;


    // --- Bulk Google enrichment ---
    const enrich = new Setting(c)
      .setName("Enrich all spots from Google")
      .setDesc("Fetch missing photos, ratings, coordinates and addresses for your spots in one run. An options dialog lets you pick what to fill and which spots to include.")
      .addButton((b) =>
        b.setButtonText("Enrich from Google").onClick(() => {
          const open = (this.plugin as unknown as { openEnrichModal?: () => void })
            .openEnrichModal;
          if (typeof open === "function") open.call(this.plugin);
          else new Notice("Food Spot: bulk enrichment is not available yet.");
        }),
      );
    this.addHelp(
      enrich,
      "Uses the Google Places key from the API section at roughly 3 API calls per spot (lookup, details, photo download). Large libraries can eat into your Google quota — scope the run to missing-data-only in the options dialog to keep it cheap. By default only empty fields are filled; nothing you typed is overwritten.",
    );

    // --- Export ---
    const exp = new Setting(c)
      .setName("Export spots")
      .setDesc(
        Platform.isMobile
          ? "Writes all spots into a file inside your vault, ready to share from Files."
          : "Opens the system save dialog and writes all spots wherever you choose.",
      );
    exp.settingEl.addClass("fs-setting-stack");
    exp.addButton((b) =>
      b.setButtonText("Export CSV…").onClick(async () => {
        const date = todayIso();
        await saveToDisk(
          `Food Spot export ${date}.csv`,
          spotsToCsv(this.spots()),
          this.exportTarget(),
        );
      }),
    );
    exp.addButton((b) =>
      b.setButtonText("Export JSON…").onClick(async () => {
        const date = todayIso();
        await saveToDisk(
          `Food Spot export ${date}.json`,
          JSON.stringify(this.spots(), null, 2),
          this.exportTarget(),
        );
      }),
    );
    this.addHelp(
      exp,
      `The export always contains every spot, regardless of any filters active in the Spots tab. On desktop it uses the system save dialog; on mobile there is none, so the file is written to ${this.plugin.settings.spotsFolder}/_exports inside your vault.`,
    );

    // --- Full backup & restore (metadata + embedded photos/menus) ---
    const bak = new Setting(c)
      .setName("Backup & restore")
      .setDesc(
        "Full backup: every field, visits, notes AND the actual photo/menu files, embedded in one JSON. Restore recreates notes and images; existing spots are never overwritten.",
      );
    bak.settingEl.addClass("fs-setting-stack");
    bak.addButton((b) =>
      b.setButtonText("Export backup…").onClick(async () => {
        b.setDisabled(true);
        try {
          const { json, suggestedName } = await buildBackupJson(this.plugin);
          await saveToDisk(suggestedName, json, this.exportTarget());
        } catch (e) {
          new Notice(`Backup failed: ${errMsg(e)}`);
        } finally {
          b.setDisabled(false);
        }
      }),
    );
    bak.addButton((b) => {
      const input = createEl("input", {
        type: "file",
        attr: { accept: ".json,application/json", style: "display: none" },
      });
      bak.settingEl.appendChild(input);
      input.addEventListener("change", async () => {
        const file = input.files?.[0];
        input.value = "";
        if (!file) return;
        b.setDisabled(true);
        const signal = { cancelled: false };
        const progress = new ProgressModal(this.app, "Restoring backup…", signal);
        progress.open();
        try {
          await importBackup(
            this.plugin,
            await file.text(),
            (done, total, label) => progress.update(done, total, label),
            signal,
          );
        } catch (e) {
          new Notice(`Restore failed: ${errMsg(e)}`);
        } finally {
          progress.finish();
          b.setDisabled(false);
        }
      });
      b.setButtonText("Import backup…").onClick(() => input.click());
    });
    this.addHelp(
      bak,
      `Export opens the system save dialog on desktop — put the file anywhere (it can get large: photos are embedded). On mobile it lands in ${this.plugin.settings.spotsFolder}/_exports inside your vault instead. To restore on another vault: install Food Spot there, then Import backup and pick the file. Media files are recreated at their original vault paths.`,
    );

    // --- Duplicate finder ---
    const dupes = new Setting(c)
      .setName("Find duplicate spots")
      .setDesc(
        "Finds spots that are the same restaurant — the same Google place, the same name within one city, or nearly identical coordinates — and lets you merge a pair into one note.",
      );
    dupes.addButton((b) =>
      b.setButtonText("Scan for duplicates").onClick(() => {
        try {
          openDuplicatesModal(this.plugin);
        } catch (e) {
          new Notice(`Duplicate scan failed: ${errMsg(e)}`);
        }
      }),
    );
    this.addHelp(
      dupes,
      "Nothing is merged without asking. Each pair shows why it matched and what is on both notes; you pick which note survives, and the other one's visits, ratings, photos, cuisines and tags are folded into it before it goes to the trash. 'Not a duplicate' hides a pair until the next scan.",
    );

    // --- Unused media cleanup ---
    const sweep = new Setting(c)
      .setName("Clean up unused media")
      .setDesc(
        "Trashes files anywhere in the media folder (including dish photos) that no spot references any more — e.g. leftovers from deleted restaurants.",
      );
    sweep.addButton((b) =>
      b.setButtonText("Find unused files").onClick(async () => {
        b.setDisabled(true);
        try {
          // Ownership first: the media folder can be shared with the rest of
          // the vault, so a sweep must never reach past what Food Spot made.
          const plan = classifyMediaFolder(this.app, this.plugin.settings, this.spots());
          if (!plan) {
            new Notice("No media folder yet — nothing to clean up.");
            return;
          }
          const spared = plan.leftAlone.length;
          const sparedNote =
            spared > 0
              ? ` ${plural(spared, "other file")} in ${plan.folderPath} ${spared === 1 ? "is" : "are"} linked from other notes or not created by Food Spot — left alone.`
              : "";
          const orphans = plan.owned.filter((f) => !plan.referenced.has(f.path));
          if (orphans.length === 0) {
            new Notice(
              spared > 0
                ? `No unused Food Spot media.${sparedNote}`
                : "No unused media files — the folder is tidy.",
              spared > 0 ? 8000 : undefined,
            );
            return;
          }
          const names = orphans.slice(0, 8).map((f) => f.name).join(", ");
          const ok = await confirmModal(this.app, {
            title: `Trash ${plural(orphans.length, "unused file")}?`,
            body: `${names}${orphans.length > 8 ? `, and ${orphans.length - 8} more` : ""}. No spot references ${orphans.length === 1 ? "it" : "them"} any more. Files go to the trash and can be restored.${sparedNote}`,
            cta: "Trash them",
            danger: true,
          });
          if (!ok) return;
          let n = 0;
          const failed: string[] = [];
          for (const f of orphans) {
            try {
              await this.app.fileManager.trashFile(f);
              n++;
            } catch {
              failed.push(f.name);
            }
          }
          const problem =
            failed.length > 0
              ? ` ${plural(failed.length, "file")} couldn't be trashed (${failed.slice(0, 5).join(", ")}) — they may be open elsewhere or read-only.`
              : "";
          new Notice(
            `Trashed ${plural(n, "unused media file")}.${problem}${sparedNote}`,
            failed.length > 0 || spared > 0 ? 10000 : undefined,
          );
        } catch (e) {
          new Notice(`Cleanup failed: ${errMsg(e)}`);
        } finally {
          b.setDisabled(false);
        }
      }),
    );
    this.addHelp(
      sweep,
      "Cover photos, menu files and every dish photo embedded on a visit count as referenced — only genuinely orphaned files are listed. A file any other note in your vault links to, or that Food Spot cannot show it created, is never trashed — so pointing the media folder at a shared attachments folder is safe. Deleting a restaurant leaves its photo in place on purpose, so a mis-click never costs you an image; this sweeps the leftovers when you want the space back.",
    );

    // --- Danger zone ---
    const danger = new Setting(c)
      .setName("Delete all restaurant data")
      .setDesc(
        "Trashes every spot note (recoverable from the trash). Consider exporting a full backup first.",
      );
    danger.settingEl.addClass("fs-danger-setting");
    danger.addButton((b) => {
      b.setButtonText("Delete all…").setWarning();
      b.onClick(() => new DeleteAllModal(this.app, this.plugin).open());
    });
  }

  /** Move every spot note to the settings-configured folder layout. */
  private async relocateNotes(): Promise<{ moved: number; kept: number; failed: number }> {
    const s = this.plugin.settings;
    const res = { moved: 0, kept: 0, failed: 0 };
    const sourceParents = new Set<string>();
    // Media first: rewriting a note's photo/menu path goes through the store,
    // which only knows notes at their currently indexed path. Renaming notes
    // first would drop them from the index until the debounced re-index lands,
    // and their references would silently stay behind in the old folder.
    await this.relocateMedia();
    for (const spot of this.spots()) {
      const file = this.plugin.store.fileFor(spot.path);
      if (!file) {
        res.failed++;
        continue;
      }
      const countrySeg =
        s.organizeByCountry && spot.country.trim() !== ""
          ? `/${sanitizeFileName(spot.country)}`
          : "";
      const dir = normalizePath(`${s.spotsFolder}${countrySeg}`);
      const target = normalizePath(`${dir}/${file.name}`);
      if (file.path === target) {
        res.kept++;
        continue;
      }
      try {
        if (this.app.vault.getFolderByPath(dir) === null) {
          await this.app.vault.createFolder(dir).catch(() => undefined);
        }
        if (this.app.vault.getAbstractFileByPath(target) !== null) {
          res.failed++; // a different file already sits at the target
          continue;
        }
        if (file.parent) sourceParents.add(file.parent.path);
        await this.app.fileManager.renameFile(file, target);
        res.moved++;
      } catch {
        res.failed++;
      }
    }
    await this.sweepEmptyFolders(sourceParents);
    return res;
  }

  /**
   * If the media folder lives OUTSIDE the spots folder (typical after the
   * spots folder was changed), bring it along: move every file (including
   * `dishes/` and any other subfolder), rewrite the photo/menu references of
   * the files that actually moved, and update the setting — one folder, not
   * two. A file whose destination is taken stays put AND keeps its reference:
   * repointing a note at a same-named stranger is worse than not moving.
   */
  private async relocateMedia(): Promise<void> {
    const s = this.plugin.settings;
    const media = normalizePath(s.mediaFolder);
    const spotsRoot = normalizePath(s.spotsFolder);
    if (media === spotsRoot || media.startsWith(`${spotsRoot}/`)) return;
    const oldFolder = this.app.vault.getFolderByPath(media);
    const newMedia = normalizePath(`${spotsRoot}/_media`);

    if (oldFolder) {
      // The reference rewrite must run against the spots as they were when
      // the files moved, not against a live index read afterwards.
      const before = this.spots().map((spot) => ({
        path: spot.path,
        photo: spot.photo,
        menu: spot.menu,
      }));
      const moved = new Map<string, string>();
      const blocked: string[] = [];
      const moveInto = async (dir: TFolder, relative: string): Promise<void> => {
        const targetDir = normalizePath(relative ? `${newMedia}/${relative}` : newMedia);
        if (this.app.vault.getFolderByPath(targetDir) === null) {
          await this.app.vault.createFolder(targetDir).catch(() => undefined);
        }
        for (const child of [...dir.children]) {
          if (child instanceof TFolder) {
            await moveInto(child, relative ? `${relative}/${child.name}` : child.name);
            continue;
          }
          if (!(child instanceof TFile)) continue;
          const from = child.path;
          const target = normalizePath(`${targetDir}/${child.name}`);
          if (this.app.vault.getAbstractFileByPath(target) !== null) {
            blocked.push(child.name);
            continue;
          }
          try {
            await this.app.fileManager.renameFile(child, target);
            moved.set(from, target);
          } catch {
            blocked.push(child.name);
          }
        }
      };
      await moveInto(oldFolder, "");

      // Plain-string frontmatter refs don't follow renames — rewrite them,
      // but only where the file behind the ref really landed somewhere new.
      const rewriteFailures: string[] = [];
      for (const rec of before) {
        const patch: { photo?: string; menu?: string } = {};
        const photoTarget = rec.photo ? moved.get(normalizePath(rec.photo)) : undefined;
        const menuTarget = rec.menu ? moved.get(normalizePath(rec.menu)) : undefined;
        if (photoTarget) patch.photo = photoTarget;
        if (menuTarget) patch.menu = menuTarget;
        if (Object.keys(patch).length === 0) continue;
        try {
          await this.plugin.store.updateSpot(rec.path, patch);
        } catch {
          rewriteFailures.push(rec.path);
        }
      }
      if (blocked.length > 0) {
        new Notice(
          `${plural(blocked.length, "media file")} stayed in ${media} — a file with the same name already exists in ${newMedia} (${blocked.slice(0, 5).join(", ")}). Their notes still point at the old folder.`,
          10000,
        );
      }
      if (rewriteFailures.length > 0) {
        new Notice(
          `${plural(rewriteFailures.length, "note")} kept a photo/menu path in ${media}: ${rewriteFailures.slice(0, 5).join(", ")}. Fix the path in the note or run the relocation again.`,
          10000,
        );
      }
      // The emptied old media folder is left standing on purpose: it sits
      // outside the spots folder, so it may well be a folder the user made
      // (and shares with the rest of the vault).
    }
    s.mediaFolder = newMedia;
    await this.save();
    new Notice(`Media folder moved to ${newMedia}.`);
  }

  /**
   * Trash folders that relocation emptied — bounded to the configured spots
   * and media subtrees. Walking up unconditionally could reach folders Food
   * Spot never created (an indexed note may live anywhere in the vault), and
   * the configured roots themselves are never candidates.
   */
  private async sweepEmptyFolders(candidates: Set<string>): Promise<void> {
    const s = this.plugin.settings;
    const roots = [normalizePath(s.spotsFolder), normalizePath(s.mediaFolder)];
    const inside = (path: string): boolean =>
      roots.some((root) => path !== root && path.startsWith(`${root}/`));
    for (const parentPath of candidates) {
      if (!inside(parentPath)) continue;
      let folder = this.app.vault.getFolderByPath(parentPath);
      while (folder && inside(folder.path) && folder.children.length === 0) {
        const above = folder.parent;
        await this.app.fileManager.trashFile(folder).catch(() => undefined);
        folder = above ? this.app.vault.getFolderByPath(above.path) : null;
      }
    }
  }


  // -------------------------------------------------------------------------
  // API
  // -------------------------------------------------------------------------

  private renderApi(body: HTMLElement): void {
    const s = this.plugin.settings;
    const hasKey = () => !!(s.apiKeys.googlePlaces ?? "").trim();
    const g = this.group(body, {
      icon: "key-round",
      title: "API",
      subtitle: "External data providers",
      chip: {
        text: hasKey() ? "Google Places — key set" : "Google Places — no key",
        tone: hasKey() ? "ok" : "warn",
      },
    });
    const c = g.content;

    const card = c.createDiv({ cls: "fs-provider-card" });
    const head = card.createDiv({ cls: "fs-provider-head" });
    head.createDiv({ cls: "fs-provider-avatar", text: "G" });
    const titles = head.createDiv({ cls: "fs-provider-titles" });
    titles.createDiv({ cls: "fs-provider-name", text: "Google Places API" });
    titles.createDiv({
      cls: "fs-provider-desc",
      text: "Powers online search, Google Maps URL enrichment and rating refresh.",
    });
    const badge = head.createDiv({ cls: "fs-provider-badge" });
    const paintBadge = () => {
      badge.setText(hasKey() ? "Active" : "Inactive");
      badge.toggleClass("is-active", hasKey());
      g.setChip(
        hasKey() ? "Google Places — key set" : "Google Places — no key",
        hasKey() ? "ok" : "warn",
      );
    };
    paintBadge();

    const row = card.createDiv({ cls: "fs-provider-keyrow" });
    const input = row.createEl("input", {
      cls: "fs-provider-key",
      type: "password",
      attr: { placeholder: "API key", spellcheck: "false", autocomplete: "off" },
    });
    input.value = s.apiKeys.googlePlaces ?? "";
    // Debounced: one data.json round-trip per pause, not one per keystroke
    // (typing a 39-char key fired dozens of overlapping read-modify-writes).
    let keySaveTimer: number | null = null;
    input.addEventListener("input", () => {
      const v = input.value.trim();
      s.apiKeys.googlePlaces = v || undefined;
      paintBadge();
      if (keySaveTimer !== null) window.clearTimeout(keySaveTimer);
      keySaveTimer = window.setTimeout(() => {
        keySaveTimer = null;
        void this.save();
      }, 500);
    });
    input.addEventListener("blur", () => {
      if (keySaveTimer !== null) {
        window.clearTimeout(keySaveTimer);
        keySaveTimer = null;
        void this.save();
      }
    });

    const eye = row.createEl("button", {
      cls: "fs-provider-eye",
      attr: { "aria-label": "Show or hide key" },
    });
    setIcon(eye, "eye");
    eye.onclick = () => {
      const hidden = input.type === "password";
      input.type = hidden ? "text" : "password";
      setIcon(eye, hidden ? "eye-off" : "eye");
    };

    const testBtn = row.createEl("button", { text: "Test" });
    testBtn.onclick = async () => {
      if (!hasKey()) {
        g.setChip("Google Places — no key to test", "warn");
        return;
      }
      testBtn.disabled = true;
      g.setChip("Testing…", "pending");
      try {
        const results = await this.plugin.importer.searchPlaces("pizza amsterdam");
        const first = results[0];
        if (first) g.setChip(`Test passed — "${first.name}"`, "ok");
        else g.setChip("Test failed — no results returned", "warn");
      } catch (e) {
        g.setChip(`Test failed — ${errMsg(e)}`, "warn");
      } finally {
        testBtn.disabled = false;
      }
    };

    const links = card.createDiv({ cls: "fs-provider-links" });
    links.createEl("a", { text: "Get a key", href: GOOGLE_KEY_URL });

    const warn = card.createDiv({ cls: "fs-provider-warning" });
    const warnIcon = warn.createSpan();
    setIcon(warnIcon, "alert-triangle");
    warn.createSpan({
      text: "The key is stored in plain text in this vault's plugin data.json. Anyone (or anything) with access to your vault files can read it.",
    });

    this.renderHttpApi(body);
  }

  /** Local HTTP API — the Helm pattern: loopback-only, bearer token, off by default. */
  private renderHttpApi(body: HTMLElement): void {
    const s = this.plugin.settings;
    const chip = (): { text: string; tone: ChipTone } => {
      if (!s.apiEnabled) return { text: "Off", tone: "pending" };
      if (this.plugin.api) return { text: `Running on 127.0.0.1:${this.plugin.api.port}`, tone: "ok" };
      return { text: this.plugin.apiError ?? "not running", tone: "warn" };
    };
    const g = this.group(body, {
      icon: "radio-tower",
      title: "Local HTTP API",
      subtitle: "Drive Food Spot from scripts and tools on this machine",
      chip: chip(),
    });
    const c = g.content;
    if (Platform.isMobile) {
      c.createEl("p", {
        cls: "fs-api-hint",
        text: "The HTTP API is desktop-only — mobile Obsidian has no local server.",
      });
      return;
    }
    c.createEl("p", {
      cls: "fs-api-hint",
      text: "Food Spot serves JSON on 127.0.0.1 only — never a network interface — and every request must carry the token below. Calls go through the same store code the views use, so visit counts, derived fields and change events stay consistent.",
    });
    new Setting(c)
      .setName("Serve the API")
      .setDesc("Starts when you switch it on, and whenever Obsidian starts.")
      .addToggle((t) =>
        t.setValue(s.apiEnabled).onChange((v) =>
          void (async () => {
            if (v && s.apiToken === "") s.apiToken = this.plugin.newApiToken();
            s.apiEnabled = v;
            await this.save();
            await this.plugin.restartApi();
            this.renderBody();
          })(),
        ),
      );
    new Setting(c)
      .setName("Port")
      .setDesc("Change it if something else already uses this one. Helm sits on 27125.")
      .addText((t) =>
        t
          .setPlaceholder("27126")
          .setValue(String(s.apiPort))
          .onChange((v) =>
            void (async () => {
              const n = Number(v);
              if (!Number.isInteger(n) || n < 1024 || n > 65535) return;
              s.apiPort = n;
              await this.save();
              await this.plugin.restartApi();
              g.setChip(chip().text, chip().tone);
            })(),
          ),
      );
    new Setting(c)
      .setName("Token")
      .setDesc("Send it as “Authorization: Bearer <token>”. Treat it like a password.")
      .addText((t) => {
        t.setValue(s.apiToken).setDisabled(true);
        t.inputEl.type = "password";
        t.inputEl.addClass("fs-api-token");
      })
      .addButton((b) =>
        b.setButtonText("Copy").onClick(() => {
          if (s.apiToken === "") {
            new Notice("No token yet — enable the API first.");
            return;
          }
          void navigator.clipboard.writeText(s.apiToken);
          new Notice("Token copied.");
        }),
      )
      .addButton((b) =>
        b
          .setButtonText("New token")
          .setWarning()
          .onClick(() =>
            void (async () => {
              this.plugin.settings.apiToken = this.plugin.newApiToken();
              await this.save();
              await this.plugin.restartApi();
              this.renderBody();
              new Notice("New token — anything using the old one has to be updated.");
            })(),
          ),
      );
    const base = `http://127.0.0.1:${this.plugin.api?.port ?? s.apiPort}/foodspot/v1`;
    c.createEl("p", { cls: "fs-api-hint", text: "Try it from a terminal:" });
    c.createEl("pre", {
      cls: "fs-api-example",
      text: [
        `TOKEN=<copy it with the button above>`,
        `curl -s ${base}/health -H "Authorization: Bearer $TOKEN"`,
        `curl -s "${base}/spots?status=visited&country=Netherlands&limit=5" -H "Authorization: Bearer $TOKEN"`,
        `curl -s -X POST "${base}/spots/Harput/visits" -H "Authorization: Bearer $TOKEN" \\`,
        `  -H 'content-type: application/json' -d '{"spent": 47.5, "rating": 4}'`,
      ].join("\n"),
    });
    c.createEl("p", { cls: "fs-api-hint", text: "Every route is listed in docs/api.md in the Food Spot repository." });
  }

  // -------------------------------------------------------------------------
  // Customize
  // -------------------------------------------------------------------------

  private renderCustomize(body: HTMLElement): void {
    const s = this.plugin.settings;

    // --- Cards ---
    const cards = this.group(body, {
      icon: "layout-grid",
      title: "Cards",
      subtitle: "Card size and text placement",
    });
    const cc = cards.content;

    let desktopSwatch!: HTMLElement;
    let mobileSwatch!: HTMLElement;
    const paintSwatches = () => {
      const dw = CARD_WIDTHS[s.cardSizeDesktop + 3] ?? 160;
      const mw = CARD_WIDTHS[s.cardSizeMobile + 3] ?? 140;
      // On the desktop the swatch's own width IS the readout. A phone has no
      // room for that — two boxes of up to 250px do not fit beside each other
      // in a 358px panel — so there the number carries it and 80-mobile.css
      // splits the row into two equal cells. Setting no inline width is what
      // lets that rule apply without an !important.
      if (!Platform.isPhone) {
        desktopSwatch.style.width = `${dw}px`;
        mobileSwatch.style.width = `${mw}px`;
      }
      desktopSwatch.setText(`${dw}px`);
      mobileSwatch.setText(`${mw}px`);
    };

    new Setting(cc)
      .setName("Card size — desktop")
      .setDesc("Minimum card width in the grid (7 steps).")
      .addSlider((sl) =>
        sl
          .setLimits(-3, 3, 1)
          .setValue(s.cardSizeDesktop)
          .setDynamicTooltip()
          .onChange(async (v) => {
            s.cardSizeDesktop = v;
            await this.save();
            paintSwatches();
            this.touch();
          }),
      );
    new Setting(cc)
      .setName("Card size — mobile")
      .setDesc("Separate size used on phones and tablets.")
      .addSlider((sl) =>
        sl
          .setLimits(-3, 3, 1)
          .setValue(s.cardSizeMobile)
          .setDynamicTooltip()
          .onChange(async (v) => {
            s.cardSizeMobile = v;
            await this.save();
            paintSwatches();
            this.touch();
          }),
      );

    const preview = cc.createDiv({ cls: "fs-size-preview" });
    const dItem = preview.createDiv({ cls: "fs-size-preview-item" });
    dItem.createSpan({ text: "Desktop" });
    desktopSwatch = dItem.createDiv({ cls: "fs-size-swatch" });
    const mItem = preview.createDiv({ cls: "fs-size-preview-item" });
    mItem.createSpan({ text: "Mobile" });
    mobileSwatch = mItem.createDiv({ cls: "fs-size-swatch" });
    paintSwatches();

    new Setting(cc)
      .setName("Card text placement")
      .setDesc("Name and meta inside the photo (gradient scrim) or underneath it.")
      .addDropdown((d) =>
        d
          .addOption("inside", "Inside the photo")
          .addOption("under", "Under the photo")
          .setValue(s.cardTextPlacement)
          .onChange(async (v) => {
            s.cardTextPlacement = v as typeof s.cardTextPlacement;
            await this.save();
            this.touch();
          }),
      );

    new Setting(cc)
      .setName("Dashboard stat cards")
      .setDesc("Animated rings or plain rectangles on the Dashboard tab.")
      .addDropdown((d) =>
        d
          .addOption("rings", "Rings")
          .addOption("rectangles", "Rectangles")
          .setValue(s.dashboardCardStyle)
          .onChange(async (v) => {
            s.dashboardCardStyle = v as typeof s.dashboardCardStyle;
            await this.save();
            this.touch();
          }),
      );

    // --- Colors ---
    const colors = this.group(body, {
      icon: "palette",
      title: "Colors",
      subtitle: "Status colors and rating tiers",
    });
    const col = colors.content;

    new Setting(col)
      .setName("Want-to-try color")
      .setDesc("Status badges and dots on cards and suggestions.")
      .addColorPicker((cp) =>
        cp.setValue(s.statusColors.wantToTry).onChange(async (v) => {
          s.statusColors.wantToTry = v;
          await this.save();
          this.touch();
        }),
      );
    new Setting(col)
      .setName("Visited color")
      .setDesc("Status badges and dots on cards and suggestions.")
      .addColorPicker((cp) =>
        cp.setValue(s.statusColors.visited).onChange(async (v) => {
          s.statusColors.visited = v;
          await this.save();
          this.touch();
        }),
      );
    new Setting(col)
      .setName("Favorite color")
      .setDesc("The ★ favorite marker.")
      .addColorPicker((cp) =>
        cp.setValue(s.statusColors.favorite).onChange(async (v) => {
          s.statusColors.favorite = v;
          await this.save();
          this.touch();
        }),
      );

    const tiersSetting = new Setting(col)
      .setName("Rating tiers")
      .setDesc("Label and color for each star level, with a live preview.");
    this.addHelp(
      tiersSetting,
      "Tier 1 colors ratings up to 1★, tier 2 up to 2★, and so on. Labels show next to the stars wherever ratings are displayed.",
    );
    const editor = col.createDiv({ cls: "fs-tier-editor" });
    s.ratingTiers.forEach((tier, i) => {
      const rowEl = editor.createDiv({ cls: "fs-tier-row" });
      const colorInput = rowEl.createEl("input", { cls: "fs-tier-color", type: "color" });
      colorInput.value = tier.color;
      const labelInput = rowEl.createEl("input", {
        cls: "fs-tier-label",
        type: "text",
        attr: { placeholder: `Tier ${i + 1}` },
      });
      labelInput.value = tier.label;
      const previewEl = rowEl.createDiv({ cls: "fs-tier-preview" });
      const paintPreview = () => {
        previewEl.empty();
        starRating(previewEl, {
          value: i + 1,
          halfSteps: false,
          tiers: s.ratingTiers,
          readOnly: true,
          showLabel: true,
        });
      };
      colorInput.addEventListener("input", async () => {
        tier.color = colorInput.value;
        await this.save();
        paintPreview();
        this.touch();
      });
      labelInput.addEventListener("input", async () => {
        tier.label = labelInput.value;
        await this.save();
        paintPreview();
        this.touch();
      });
      paintPreview();
    });
  }

  // -------------------------------------------------------------------------
  // Import
  // -------------------------------------------------------------------------

  private renderImport(body: HTMLElement): void {
    const s = this.plugin.settings;
    const g = this.group(body, {
      icon: "download",
      title: "Import",
      subtitle: "Duplicate detection and review behavior",
      chip: {
        text: s.reviewBeforeSave ? "Review before save — on" : "Direct save",
        tone: "ok",
      },
    });
    const c = g.content;

    const dup = new Setting(c)
      .setName("Duplicate detection")
      .setDesc("Warn when an imported spot looks like one already in your library.")
      .addToggle((t) =>
        t.setValue(s.duplicateDetectionEnabled).onChange(async (v) => {
          s.duplicateDetectionEnabled = v;
          await this.save();
        }),
      );
    this.addHelp(
      dup,
      "Matching is name-similarity AND distance aware: two branches of the same chain in different cities are not flagged as duplicates.",
    );

    const radius = new Setting(c)
      .setName("Duplicate radius")
      .setDesc(`Spots within ${s.duplicateDetectionRadiusMeters} m of each other can be duplicates.`)
      .addSlider((sl) =>
        sl
          .setLimits(10, 500, 5)
          .setValue(s.duplicateDetectionRadiusMeters)
          .setDynamicTooltip()
          .onChange(async (v) => {
            s.duplicateDetectionRadiusMeters = v;
            radius.setDesc(`Spots within ${v} m of each other can be duplicates.`);
            await this.save();
          }),
      );

    const review = new Setting(c)
      .setName("Review before save")
      .setDesc("Show an editable review form for every import before the note is created.")
      .addToggle((t) =>
        t.setValue(s.reviewBeforeSave).onChange(async (v) => {
          s.reviewBeforeSave = v;
          await this.save();
          g.setChip(v ? "Review before save — on" : "Direct save", "ok");
        }),
      );
    this.addHelp(
      review,
      "When off, imports save immediately and show a Notice with an Undo button instead.",
    );
  }

  // -------------------------------------------------------------------------
  // Widgets (syntax reference)
  // -------------------------------------------------------------------------

  private renderWidgets(body: HTMLElement): void {
    const g = this.group(body, {
      icon: "code",
      title: "Widget syntax",
      subtitle: "Embed live Food Spot blocks in any note",
    });
    const c = g.content;
    c.addClass("fs-widget-doc");

    c.createEl("p", {
      text: 'Add a code block with language "foodspot". One "key: value" per line; blank lines and lines starting with # are ignored. Copy an example below straight into any note, or use the "Insert widget" command.',
    });

    // Copy-paste example gallery. Cities are taken from the user's own
    // library when available so examples work as-is.
    const topCity = (() => {
      const counts = new Map<string, number>();
      for (const s of this.spots()) {
        const city = (s.city ?? "").trim();
        if (city) counts.set(city, (counts.get(city) ?? 0) + 1);
      }
      return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Amsterdam";
    })();
    const topCuisine = (() => {
      const counts = new Map<string, number>();
      for (const s of this.spots())
        for (const cu of s.cuisines) counts.set(cu, (counts.get(cu) ?? 0) + 1);
      return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Italian";
    })();

    const example = (title: string, block: string) => {
      const card = c.createDiv({ cls: "fs-example-card" });
      const head = card.createDiv({ cls: "fs-example-head" });
      head.createSpan({ cls: "fs-example-title", text: title });
      const copy = head.createEl("button", { cls: "fs-btn fs-small-btn" });
      const ic = copy.createSpan({ cls: "fs-btn-icon" });
      setIcon(ic, "copy");
      copy.createSpan({ text: " Copy" });
      copy.addEventListener("click", () => {
        void navigator.clipboard.writeText(block + "\n").then(() => {
          new Notice(`Copied "${title}" — paste it into any note.`);
        });
      });
      card.createEl("pre", { text: block });
    };

    example(
      "Wishlist cards for a city",
      "```foodspot\nview: cards\nstatus: want-to-try\ncity: " + topCity + "\nsort: date-added\ndirection: desc\nlimit: 12\n```",
    );
    example(
      "Where do we eat tonight?",
      "```foodspot\nview: random\nstatus: want-to-try\ncity: " + topCity + "\n```",
    );
    example(
      "Top rated table",
      "```foodspot\nview: table\nsort: rating\ndirection: desc\nlimit: 10\n```",
    );
    example(
      "City checklist",
      "```foodspot\nview: shortlist\ncity: " + topCity + "\nlimit: 15\n```",
    );
    example(
      "One cuisine, everywhere",
      "```foodspot\nview: list\ncuisine: " + topCuisine + "\nsort: rating\ndirection: desc\n```",
    );
    example(
      "Visited ratio stat",
      "```foodspot\nview: stat\nstat: visited-ratio\n```",
    );

    const views = c.createDiv({ cls: "fs-doc-list" });
    const docRow = (parent: HTMLElement, term: string, desc: string) => {
      const row = parent.createDiv({ cls: "fs-doc-row" });
      row.createEl("code", { text: term });
      row.createSpan({ text: desc });
    };
    c.createEl("h4", { text: "Views" });
    docRow(views, "view: cards", "Photo card grid.");
    docRow(views, "view: list", "Compact clickable name list.");
    docRow(views, "view: table", "Name / cuisine / city / rating / visits table.");
    docRow(views, "view: stat", "One stat card — see stat values below.");
    docRow(views, "view: random", "One random pick with an in-place shuffle button.");
    docRow(views, "view: shortlist", "Compact want-to-try checklist (great per city).");

    c.createEl("h4", { text: "Filters" });
    const filters = c.createDiv({ cls: "fs-doc-list" });
    docRow(filters, "country / city / district / cuisine / tag", "Match a single value (case-insensitive).");
    docRow(filters, "status", "want-to-try or visited.");
    docRow(filters, "price", "Tier 1–4.");
    docRow(filters, "minRating", "Minimum personal rating, 0–5 (half steps allowed). Unrated spots are always shown.");
    docRow(filters, "favorite", "true or false.");
    docRow(filters, "limit", "Maximum number of results.");
    docRow(filters, "sort", "name, rating, external-rating, price, date-added, last-visit, visit-count.");
    docRow(filters, "direction", "asc or desc.");

    c.createEl("h4", { text: "Stat values" });
    const stats = c.createDiv({ cls: "fs-doc-list" });
    docRow(stats, "stat: visited-ratio", "Ring with visited percentage.");
    docRow(stats, "stat: counts", "Spots · countries · cities · cuisines · visits strip.");
    docRow(stats, "stat: top-cuisines", "Your five most common cuisines.");

    c.createEl("p", {
      cls: "fs-doc-note",
      text: "Widgets re-render live whenever your spots change. Invalid keys or values show an inline error listing the valid options.",
    });
  }

  // -------------------------------------------------------------------------
  // Quick info
  // -------------------------------------------------------------------------

  private renderInfo(body: HTMLElement): void {
    const g = this.group(body, {
      icon: "info",
      title: "Quick info",
      subtitle: "How Food Spot works under the hood",
    });
    const c = g.content;

    const collapsible = (title: string, paragraphs: string[]) => {
      const box = c.createDiv({ cls: "fs-qi" });
      const head = box.createDiv({ cls: "fs-qi-head" });
      const chev = head.createDiv({ cls: "fs-qi-chev" });
      setIcon(chev, "chevron-right");
      head.createSpan({ text: title });
      const bodyEl = box.createDiv({ cls: "fs-qi-body" });
      for (const p of paragraphs) bodyEl.createEl("p", { text: p });
      head.onclick = () => box.toggleClass("is-open", !box.hasClass("is-open"));
    };

    collapsible("How spots are stored", [
      "Every spot is a normal markdown note with 'type: foodspot' in its frontmatter. The plugin's data.json only stores settings.",
      "You can rename, move, edit or sync the notes freely — the index follows the frontmatter type, not the file path, and picks up external edits live.",
    ]);
    collapsible("How ratings are derived", [
      "Your personal rating is the average of your visit ratings, rounded to half stars.",
      "If you set a rating manually, it is locked (ratingLocked: true) and no longer recomputed from visits.",
      "External ratings (Google, TripAdvisor, Yelp, TheFork) are snapshots — refresh them per spot from the ⋮ menu or in bulk via the command palette. A stale badge appears after the threshold set in General.",
    ]);
    collapsible("Where external ratings come from", [
      "Google: fetched from the Places API and needs the key set in the API section. Enrichment and rating refresh both use it.",
      "TripAdvisor, Yelp and TheFork: no API needed — paste the spot's public page URL into the matching field in the edit modal (Ratings & price section). Refresh then reads the rating from the page's structured data (JSON-LD).",
      "Shortcut: pasting a TripAdvisor/Yelp/TheFork URL into the importer for a spot you already have offers \"Attach as rating source\" instead of creating a duplicate — it stores the URL and fetches the rating in one step.",
      "TheFork rates on a 10-point scale. Values are stored raw and always shown as /10 — never silently converted to a 5-star number.",
      "Some sites occasionally answer with a bot check. That source is skipped with a warning for the run and picked up again on the next refresh.",
    ]);
    collapsible("How visits are parsed", [
      "Visits are bullet lines under the '## Visits' heading, using Dataview-style inline fields:",
      "- [date:: 2026-07-12] [rating:: 4.5] [spent:: 45] Great omakase, sat at the bar",
      "date is required (ISO); rating and spent are optional; the rest of the line is the visit note. You can add or edit these by hand — they stay Dataview-queryable.",
    ]);
  }
}

// ---------------------------------------------------------------------------
// Pickers: vault-folder autocomplete + country/currency option lists
// ---------------------------------------------------------------------------

/** Autocomplete over existing vault folders for folder-path settings. */
class FolderSuggest extends AbstractInputSuggest<TFolder> {
  constructor(app: App, private inputEl: HTMLInputElement) {
    super(app, inputEl);
  }

  getSuggestions(query: string): TFolder[] {
    const q = query.toLowerCase();
    const folders: TFolder[] = [];
    const walk = (f: TFolder): void => {
      for (const child of f.children) {
        if (child instanceof TFolder) {
          if (child.path.toLowerCase().includes(q)) folders.push(child);
          walk(child);
        }
      }
    };
    walk(this.app.vault.getRoot());
    return folders.slice(0, 60);
  }

  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.setText(folder.path);
  }

  selectSuggestion(folder: TFolder): void {
    this.inputEl.value = folder.path;
    this.inputEl.trigger("input");
    this.close();
  }
}

const COUNTRIES: string[] = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada",
  "Cape Verde","Chad","Chile","China","Colombia","Comoros","Costa Rica","Croatia","Cuba","Curaçao","Cyprus","Czechia",
  "Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Estonia","Eswatini","Ethiopia",
  "Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guyana",
  "Haiti","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Ivory Coast",
  "Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia",
  "Libya","Liechtenstein","Lithuania","Luxembourg","Macau","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta",
  "Mauritania","Mauritius","Mexico","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar",
  "Namibia","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Macedonia","Norway","Oman",
  "Pakistan","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda",
  "San Marino","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Somalia",
  "South Africa","South Korea","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan",
  "Tanzania","Thailand","Togo","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Uganda","Ukraine",
  "United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

const CURRENCIES: [string, string][] = [
  ["€", "€ Euro"],
  ["$", "$ US Dollar"],
  ["£", "£ British Pound"],
  ["¥", "¥ Yen / Yuan"],
  ["₹", "₹ Indian Rupee"],
  ["CHF", "CHF Swiss Franc"],
  ["kr", "kr Krona/Krone"],
  ["zł", "zł Polish Złoty"],
  ["Kč", "Kč Czech Koruna"],
  ["฿", "฿ Thai Baht"],
  ["₫", "₫ Vietnamese Dong"],
  ["₩", "₩ Korean Won"],
  ["Rp", "Rp Indonesian Rupiah"],
  ["RM", "RM Malaysian Ringgit"],
  ["S$", "S$ Singapore Dollar"],
  ["HK$", "HK$ Hong Kong Dollar"],
  ["A$", "A$ Australian Dollar"],
  ["C$", "C$ Canadian Dollar"],
  ["R$", "R$ Brazilian Real"],
  ["₺", "₺ Turkish Lira"],
  ["د.إ", "د.إ UAE Dirham"],
];

/**
 * Type-to-confirm guard for wiping the library: requires literally typing
 * DELETE, shows the exact blast radius, trashes (never hard-deletes) notes,
 * and optionally the media files Food Spot itself owns. Cancelling stops the
 * whole run — notes, media and folder cleanup alike.
 */
class DeleteAllModal extends Modal {
  private alsoMedia = false;

  constructor(app: App, private plugin: FoodSpotPlugin) {
    super(app);
  }

  override onOpen(): void {
    const { contentEl, titleEl } = this;
    this.modalEl.addClass("fs-modal");
    const spots = this.plugin.store.getSpots();
    titleEl.setText(`Delete all ${spots.length} spots?`);
    contentEl.createEl("p", {
      cls: "fs-confirm-body",
      text: `Every spot note (${spots.length}) is moved to the trash and can be restored from there. Visits and notes go with them.`,
    });

    const mediaLabel = contentEl.createEl("label", { cls: "fs-checkbox-label" });
    const mediaCb = mediaLabel.createEl("input", { type: "checkbox" });
    mediaLabel.createSpan({
      text: ` Also trash downloaded photos/menus in ${this.plugin.settings.mediaFolder}`,
    });
    const mediaNote = contentEl.createDiv({ cls: "fs-provider-warning" });
    mediaNote.hide();
    mediaCb.addEventListener("change", () => {
      this.alsoMedia = mediaCb.checked;
      if (!this.alsoMedia) {
        mediaNote.hide();
        return;
      }
      // Spell out the blast radius before the user types DELETE: the media
      // folder can be shared, and then most of it is off limits.
      const plan = classifyMediaFolder(this.app, this.plugin.settings, spots);
      mediaNote.empty();
      const icon = mediaNote.createSpan();
      setIcon(icon, "alert-triangle");
      let text: string;
      if (!plan) {
        text = `No ${this.plugin.settings.mediaFolder} folder yet — there is nothing to trash.`;
      } else {
        const spared =
          plan.leftAlone.length > 0
            ? ` ${plural(plan.leftAlone.length, "other file")} there ${plan.leftAlone.length === 1 ? "is" : "are"} linked from another note or not created by Food Spot — left alone.`
            : "";
        const shared = plan.dedicated
          ? ""
          : ` ${plan.folderPath} is not a Food Spot-only folder, so only files this plugin can prove it owns are touched.`;
        text = `${plural(plan.owned.length, "file")} in ${plan.folderPath} (including subfolders) will be trashed.${spared}${shared}`;
      }
      mediaNote.createSpan({ text });
      mediaNote.show();
    });

    contentEl.createEl("p", {
      cls: "fs-preset-hint",
      text: "Type DELETE to enable the button.",
    });
    const input = contentEl.createEl("input", {
      type: "text",
      cls: "fs-preset-name-input",
      attr: { placeholder: "DELETE" },
    });

    const buttons = contentEl.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    const go = buttons.createEl("button", { cls: "mod-warning", text: "Delete everything" });
    go.type = "button";
    go.disabled = true;
    input.addEventListener("input", () => {
      go.disabled = input.value.trim() !== "DELETE";
    });

    go.addEventListener("click", () => {
      go.disabled = true;
      cancel.disabled = true;
      const signal = { cancelled: false };
      const progress = new ProgressModal(this.app, "Deleting all spots…", signal);
      const all = this.plugin.store.getSpots();
      // Ownership has to be settled while the notes still exist: a trashed
      // note can no longer vouch for the photo it referenced.
      const plan = this.alsoMedia
        ? classifyMediaFolder(this.app, this.plugin.settings, all)
        : null;
      this.close();
      progress.open();
      void (async () => {
        const media = plan?.owned ?? [];
        const totalWork = all.length + media.length;
        let trashed = 0;
        let mediaTrashed = 0;
        const failedNotes: string[] = [];
        const failedMedia: string[] = [];

        let cancelled = false;
        for (const spot of all) {
          if (signal.cancelled) {
            cancelled = true;
            break;
          }
          progress.update(trashed, totalWork, spot.name);
          try {
            await this.plugin.store.deleteSpot(spot.path);
            trashed++;
          } catch {
            failedNotes.push(spot.name);
          }
        }
        // Cancelling means the whole operation stops: no media, no folder
        // sweep. Half a wipe the user asked to abort is not a lesser wipe.
        if (cancelled) {
          progress.finish();
          new Notice(
            `Cancelled after ${trashed} of ${all.length} spot notes — nothing else was touched.`,
            10000,
          );
          return;
        }

        for (const file of media) {
          if (signal.cancelled) {
            cancelled = true;
            break;
          }
          progress.update(trashed + mediaTrashed, totalWork, file.name);
          try {
            await this.app.fileManager.trashFile(file);
            mediaTrashed++;
          } catch {
            failedMedia.push(file.name);
          }
        }
        if (cancelled) {
          progress.finish();
          new Notice(
            `Cancelled after ${trashed} spot notes and ${mediaTrashed} of ${media.length} media files — the folder cleanup was skipped.`,
            10000,
          );
          return;
        }

        // Emptied subfolders (per-country dirs, the media dir) go too — but
        // ONLY empty ones, so anything else living in the tree survives. The
        // spots root folder itself is kept.
        const root = this.app.vault.getFolderByPath(
          normalizePath(this.plugin.settings.spotsFolder),
        );
        if (root) {
          const sweep = async (folder: TFolder): Promise<void> => {
            for (const child of [...folder.children]) {
              if (child instanceof TFolder) await sweep(child);
            }
            if (folder !== root && folder.children.length === 0) {
              await this.app.fileManager.trashFile(folder).catch(() => undefined);
            }
          };
          await sweep(root);
        }
        progress.finish();

        let message = `Deleted ${plural(trashed, "spot note")}${
          this.alsoMedia ? ` and ${plural(mediaTrashed, "media file")}` : ""
        } — all recoverable from the trash.`;
        if (failedNotes.length > 0) {
          message += ` ${plural(failedNotes.length, "note")} couldn't be trashed: ${failedNotes.slice(0, 5).join(", ")}.`;
        }
        if (failedMedia.length > 0) {
          message += ` ${plural(failedMedia.length, "media file")} couldn't be trashed: ${failedMedia.slice(0, 5).join(", ")}.`;
        }
        if (plan && plan.leftAlone.length > 0) {
          message += ` ${plural(plan.leftAlone.length, "file")} in ${plan.folderPath} ${plan.leftAlone.length === 1 ? "was" : "were"} left alone — linked from another note or not created by Food Spot.`;
        }
        new Notice(message, 10000);
      })();
    });
    window.setTimeout(() => input.focus(), 0);
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}
