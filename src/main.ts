import { Notice, Plugin, WorkspaceLeaf } from "obsidian";
import {
  DEFAULT_SETTINGS,
  FoodSpotPluginApi,
  FoodSpotSettings,
  PLUGIN_ICON,
  VIEW_TYPE,
} from "./types";
import { SpotStore } from "./store/spotStore";
import { ImportPipeline } from "./import/pipeline";
import { FoodSpotView } from "./ui/view";
import { FoodSpotSettingTab } from "./settings/settingsTab";
import { registerWidgets } from "./widgets/widgets";
import { openWidgetPalette } from "./widgets/insertPalette";
import { openAddChooser } from "./ui/modals/addChooser";
import { openLogVisitPicker } from "./ui/modals/logVisit";
import { importFromClipboard } from "./ui/modals/importFlow";
import { openListImportModal } from "./ui/modals/listImport";
import { registerEnrichEntry } from "./ui/modals/enrich";
import { openCityGuideModal } from "./ui/modals/cityGuide";
import { openGalleryModal } from "./ui/modals/gallery";
import { disposePhotoObserver } from "./ui/components/card";
import { ensureFolder } from "./store/noteWriter";
import { dumpDashboardDiagnostics } from "./diagnostics";
import { bindPlanFor, randomToken, startApiServer, type ApiServer } from "./api/server";
import { todayISO } from "./store/legacyMap";

/** How often Tailscale mode looks for the tailnet address while it is not up. */
const API_RETRY_MS = 30_000;

export default class FoodSpotPlugin extends Plugin implements FoodSpotPluginApi {
  settings: FoodSpotSettings = { ...DEFAULT_SETTINGS };
  store!: SpotStore;
  importer!: ImportPipeline;
  /** The local HTTP server, when settings.apiEnabled and the start succeeded. */
  api?: ApiServer;
  /** Why the API is not (fully) running, for the settings screen. */
  apiError?: string;
  private storeReady = false;
  private unloaded = false;
  /** Tail of the serialized API (re)start chain. */
  private apiChain: Promise<void> = Promise.resolve();
  private apiRetryTimer: number | undefined;

  async onload() {
    await this.loadSettings();

    this.store = new SpotStore(this);
    this.importer = new ImportPipeline(this);

    this.registerView(VIEW_TYPE, (leaf: WorkspaceLeaf) => new FoodSpotView(leaf, this));
    this.addRibbonIcon(PLUGIN_ICON, "Open Food Spot", () => this.activateView());
    this.addSettingTab(new FoodSpotSettingTab(this.app, this));
    registerWidgets(this);
    registerEnrichEntry(this);

    this.addCommand({
      id: "open-view",
      name: "Open Food Spot",
      callback: () => this.activateView(),
    });
    this.addCommand({
      id: "add-spot",
      name: "Add spot",
      callback: () => openAddChooser(this),
    });
    this.addCommand({
      id: "log-visit",
      name: "Log a visit",
      callback: () => openLogVisitPicker(this),
    });
    this.addCommand({
      id: "import-from-clipboard-url",
      name: "Import spot from clipboard URL",
      callback: () => importFromClipboard(this),
    });
    this.addCommand({
      id: "import-list",
      name: "Import a list of restaurant names",
      callback: () => openListImportModal(this),
    });
    this.addCommand({
      id: "city-guide",
      name: "Create a city guide",
      callback: () => openCityGuideModal(this),
    });
    this.addCommand({
      id: "dish-gallery",
      name: "Browse dish photos",
      callback: () => openGalleryModal(this),
    });
    this.addCommand({
      id: "insert-widget",
      name: "Insert widget",
      editorCallback: (editor) => openWidgetPalette(this, editor),
    });
    this.addCommand({
      id: "enrich-all",
      name: "Enrich all spots from Google",
      callback: () =>
        (this as unknown as { openEnrichModal?: () => void }).openEnrichModal?.(),
    });
    this.addCommand({
      id: "discover-sources-all",
      name: "Discover rating sources for all spots",
      callback: () => void this.discoverSourcesForAll(),
    });
    this.addCommand({
      id: "dump-dashboard-diagnostics",
      name: "Dump dashboard diagnostics",
      callback: () => void dumpDashboardDiagnostics(this),
    });

    this.app.workspace.onLayoutReady(async () => {
      await this.store.initialize();
      this.storeReady = true;
      await this.restartApi();
    });
  }

  async onunload() {
    this.unloaded = true;
    this.clearApiRetry();
    void this.api?.close();
    this.api = undefined;
    this.store?.dispose();
    // Module-level lazy-photo observer would otherwise outlive the plugin.
    disposePhotoObserver();
  }

  /** A fresh API token. The caller stores it in settings and saves. */
  newApiToken(): string {
    return randomToken();
  }

  /**
   * (Re)start the local HTTP API from current settings — or stop it when
   * disabled. Serialized: the port field restarts on every keystroke, and two
   * overlapping starts would orphan a listening server nothing can close.
   */
  restartApi(): Promise<void> {
    this.apiChain = this.apiChain
      .catch(() => undefined)
      .then(() => this.applyApiSettings());
    return this.apiChain;
  }

  private async applyApiSettings(): Promise<void> {
    this.clearApiRetry();
    const old = this.api;
    this.api = undefined;
    this.apiError = undefined;
    await old?.close();
    if (this.unloaded || !this.settings.apiEnabled) return;
    if (this.settings.apiToken === "") {
      this.apiError = "no token";
      return;
    }
    const plan = bindPlanFor(this.settings.apiHost);
    const port = this.settings.apiPort;
    try {
      const server = await startApiServer({
        hosts: plan.hosts,
        port,
        token: this.settings.apiToken,
        log: (m) => console.log(`[foodspot/api] ${m}`),
        deps: {
          store: this.store,
          settings: () => this.settings,
          today: () => todayISO(),
          version: this.manifest.version,
          ready: () => this.storeReady,
          allowRemoteWrites: () => this.settings.apiAllowRemoteWrites,
        },
      });
      if (this.unloaded) {
        await server.close();
        return;
      }
      this.api = server;
      if (plan.waitingForTailscale) {
        // Tailscale is often not up yet when Obsidian starts. Serve this Mac
        // meanwhile and add the tailnet address once it appears.
        this.apiError = "Tailscale is not up yet — this Mac only for now, retrying";
        this.scheduleTailscaleRetry();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.apiError = /EADDRINUSE/.test(msg)
        ? `port ${port} is taken`
        : /EADDRNOTAVAIL/.test(msg)
          ? `cannot listen on ${plan.hosts.join(", ")}`
          : "could not start";
      console.error("[foodspot/api]", e);
      new Notice(`Food Spot API: ${this.apiError}.`);
    }
  }

  private scheduleTailscaleRetry(): void {
    this.apiRetryTimer = window.setTimeout(() => {
      this.apiRetryTimer = undefined;
      if (this.unloaded || !this.settings.apiEnabled || this.settings.apiHost !== "tailscale") return;
      // Restart only once there is something new to bind — a restart cuts
      // this Mac's open connections.
      if (bindPlanFor("tailscale").waitingForTailscale) this.scheduleTailscaleRetry();
      else void this.restartApi();
    }, API_RETRY_MS);
  }

  private clearApiRetry(): void {
    if (this.apiRetryTimer !== undefined) {
      window.clearTimeout(this.apiRetryTimer);
      this.apiRetryTimer = undefined;
    }
  }

  async loadSettings() {
    const raw = (await this.loadData()) ?? {};
    // Settings may live beside a legacy `spots` array in data.json — never drop it here.
    const stored = raw.settings ?? raw;
    // v1.3.4 brightened the default status palette; carry users who never
    // customized the old defaults along instead of pinning them to the past.
    const OLD_STATUS_DEFAULTS: Record<string, string> = {
      wantToTry: "#e0a83c",
      visited: "#4caf7d",
      favorite: "#e5484d",
    };
    const storedColors: Record<string, string> = { ...(stored.statusColors ?? {}) };
    for (const [k, oldHex] of Object.entries(OLD_STATUS_DEFAULTS)) {
      if ((storedColors[k] ?? "").toLowerCase() === oldHex) delete storedColors[k];
    }
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...stored,
      apiKeys: { ...DEFAULT_SETTINGS.apiKeys, ...(stored.apiKeys ?? {}) },
      statusColors: { ...DEFAULT_SETTINGS.statusColors, ...storedColors },
      filterState: { ...DEFAULT_SETTINGS.filterState, ...(stored.filterState ?? {}) },
      ratingTiers: Array.isArray(stored.ratingTiers) && stored.ratingTiers.length === 5
        ? stored.ratingTiers
        : DEFAULT_SETTINGS.ratingTiers,
    };
  }

  /**
   * Serialized: each save's loadData→saveData read-modify-write runs after
   * the previous one finished. Interleaved cycles could resurrect stale
   * data.json content (e.g. the legacy `spots` blob migration just removed).
   */
  private saveChain: Promise<void> = Promise.resolve();

  async saveSettings() {
    this.saveChain = this.saveChain
      .catch(() => undefined) // a failed save must not wedge the chain
      .then(async () => {
        const raw = (await this.loadData()) ?? {};
        raw.settings = this.settings;
        await this.saveData(raw);
      });
    return this.saveChain;
  }

  private discoveringAll = false;

  /** Sequential source discovery over the whole library, with progress Notices. */
  async discoverSourcesForAll(): Promise<void> {
    if (this.discoveringAll) {
      new Notice("Source discovery is already running.");
      return;
    }
    this.discoveringAll = true;
    const log: string[] = [`# Food Spot — source discovery run ${new Date().toISOString()}`];
    try {
      // Right after app start the index may still be filling — wait for it.
      let waited = 0;
      while (this.store.getSpots().length === 0 && waited < 20000) {
        await new Promise((r) => setTimeout(r, 500));
        waited += 500;
      }
      const spots = this.store.getSpots();
      if (spots.length === 0) {
        new Notice("No spots indexed yet — open the Food Spot view first, then retry.");
        log.push("Aborted: index was empty after 20s.");
        return;
      }
      let attachedCount = 0;
      let done = 0;
      new Notice(`Discovering rating sources for ${spots.length} spots…`);
      for (const spot of spots) {
        try {
          const res = await this.importer.discoverSources(spot);
          if (Object.keys(res.patch).length > 0) {
            await this.store.updateSpot(spot.path, {
              external: { ...spot.external, ...res.patch },
            });
            attachedCount++;
          }
          const skips = res.skipped
            .filter((s) => s.label === "Eet.nu")
            .map((s) => `${s.label}: ${s.reason}`)
            .join("; ");
          log.push(
            `- ${spot.name}: ${res.attached.length > 0 ? `attached ${res.attached.join(", ")}` : skips || "nothing to do"}`,
          );
        } catch (e) {
          log.push(`- ${spot.name}: ERROR ${e instanceof Error ? e.message : String(e)}`);
        }
        done++;
        if (done % 20 === 0)
          new Notice(`Source discovery: ${done}/${spots.length} (${attachedCount} updated)…`);
        await new Promise((r) => setTimeout(r, 700));
      }
      log.splice(1, 0, `${attachedCount} of ${spots.length} spots updated.`);
      new Notice(
        `Source discovery finished: ${attachedCount} of ${spots.length} spots got new sources.`,
        10000,
      );
    } finally {
      this.discoveringAll = false;
      const folder = this.settings.spotsFolder || "Food Spot";
      await ensureFolder(this.app, folder);
      const path = `${folder}/foodspot-discovery-log.md`;
      const existing = this.app.vault.getFileByPath(path);
      const content = log.join("\n");
      if (existing) await this.app.vault.modify(existing, content);
      else await this.app.vault.create(path, content).catch(() => undefined);
    }
  }

  async activateView(tab?: string) {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
    if (tab) {
      const view = leaf.view;
      if (view instanceof FoodSpotView) view.setActiveTab(tab);
    }
  }
}
