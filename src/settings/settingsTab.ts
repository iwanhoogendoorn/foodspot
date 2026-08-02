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
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  TFolder,
  normalizePath,
  setIcon,
} from "obsidian";
import type { FoodSpot, FoodSpotPluginApi } from "../types";
import { DATA_CHANGED_EVENT } from "../types";
import { confirmModal } from "../ui/modals/confirm";
import { starRating } from "../ui/components/starRating";
import { buildBackupJson, importBackup, saveToDisk } from "../store/backup";
import { sanitizeFileName } from "../import/pipeline";
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
      };
    }
    this.renderBody();
  }

  hide(): void {
    this.containerEl.removeClass("fs-settings");
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
        "Moves every spot note into the folder configured above (with per-country subfolders when enabled). Wiki-links keep working; emptied old folders are cleaned up.",
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
      "Use this after changing the spots folder or the per-country toggle. Notes are moved with Obsidian's rename (links and backlinks update automatically); nothing is copied or deleted.",
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
      .setDesc("Opens the system save dialog and writes all spots wherever you choose.");
    exp.settingEl.addClass("fs-setting-stack");
    exp.addButton((b) =>
      b.setButtonText("Export CSV…").onClick(async () => {
        const date = new Date().toISOString().slice(0, 10);
        await saveToDisk(`Food Spot export ${date}.csv`, spotsToCsv(this.spots()));
      }),
    );
    exp.addButton((b) =>
      b.setButtonText("Export JSON…").onClick(async () => {
        const date = new Date().toISOString().slice(0, 10);
        await saveToDisk(
          `Food Spot export ${date}.json`,
          JSON.stringify(this.spots(), null, 2),
        );
      }),
    );
    this.addHelp(
      exp,
      "The export always contains every spot, regardless of any filters active in the Spots tab. Exports use the system save dialog (desktop only).",
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
          await saveToDisk(suggestedName, json);
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
      "Export opens the system save dialog — put the file anywhere (it can get large: photos are embedded). To restore on another vault: install Food Spot there, then Import backup and pick the file. Media files are recreated at their original vault paths.",
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
    // If the media folder lives OUTSIDE the spots folder (typical after the
    // spots folder was changed), bring it along: move the files, rewrite the
    // photo/menu references, and update the setting — one folder, not two.
    const media = normalizePath(s.mediaFolder);
    const spotsRoot = normalizePath(s.spotsFolder);
    if (media !== spotsRoot && !media.startsWith(`${spotsRoot}/`)) {
      const oldFolder = this.app.vault.getFolderByPath(media);
      const newMedia = `${spotsRoot}/_media`;
      if (oldFolder) {
        if (this.app.vault.getFolderByPath(newMedia) === null) {
          await this.app.vault.createFolder(newMedia).catch(() => undefined);
        }
        for (const child of [...oldFolder.children]) {
          if (!(child instanceof TFile)) continue;
          const target = normalizePath(`${newMedia}/${child.name}`);
          if (this.app.vault.getAbstractFileByPath(target) !== null) continue;
          await this.app.fileManager.renameFile(child, target).catch(() => undefined);
        }
        // Plain-string frontmatter refs don't follow renames — rewrite them.
        for (const spot of this.spots()) {
          const patch: { photo?: string; menu?: string } = {};
          if (spot.photo?.startsWith(`${media}/`))
            patch.photo = spot.photo.replace(`${media}/`, `${newMedia}/`);
          if (spot.menu?.startsWith(`${media}/`))
            patch.menu = spot.menu.replace(`${media}/`, `${newMedia}/`);
          if (Object.keys(patch).length > 0) {
            await this.plugin.store.updateSpot(spot.path, patch).catch(() => undefined);
          }
        }
        if (oldFolder.children.length === 0) {
          await this.app.fileManager.trashFile(oldFolder).catch(() => undefined);
        }
        if (oldFolder.parent) sourceParents.add(oldFolder.parent.path);
      }
      s.mediaFolder = newMedia;
      await this.save();
      new Notice(`Media folder moved to ${newMedia}.`);
    }

    // Trash source folders that became empty (walk up while empty).
    for (const parentPath of sourceParents) {
      let folder = this.app.vault.getFolderByPath(parentPath);
      while (folder && folder.path !== "/" && folder.children.length === 0) {
        const above = folder.parent;
        await this.app.fileManager.trashFile(folder).catch(() => undefined);
        folder = above && above.path !== "/" ? this.app.vault.getFolderByPath(above.path) : null;
      }
    }
    return res;
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
      desktopSwatch.style.width = `${dw}px`;
      desktopSwatch.setText(`${dw}px`);
      mobileSwatch.style.width = `${mw}px`;
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
 * and optionally the downloaded media files.
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
    mediaCb.addEventListener("change", () => {
      this.alsoMedia = mediaCb.checked;
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
      this.close();
      progress.open();
      void (async () => {
        let trashed = 0;
        const all = this.plugin.store.getSpots();
        const totalWork = all.length;
        for (const spot of all) {
          if (signal.cancelled) break;
          progress.update(trashed, totalWork, spot.name);
          try {
            await this.plugin.store.deleteSpot(spot.path);
            trashed++;
          } catch {
            // keep going; report totals below
          }
        }
        let mediaTrashed = 0;
        if (this.alsoMedia) {
          const folder = this.app.vault.getFolderByPath(
            normalizePath(this.plugin.settings.mediaFolder),
          );
          if (folder) {
            for (const child of [...folder.children]) {
              if (child instanceof TFile) {
                try {
                  await this.app.fileManager.trashFile(child);
                  mediaTrashed++;
                } catch {
                  // best effort
                }
              }
            }
          }
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
        new Notice(
          `Deleted ${trashed} spot notes${this.alsoMedia ? ` and ${mediaTrashed} media files` : ""} — all recoverable from the trash.`,
          10000,
        );
        progress.finish();
      })();
    });
    window.setTimeout(() => input.focus(), 0);
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}
