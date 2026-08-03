/**
 * Food Spot — the single ItemView shell: tab bar (Dashboard / Spots /
 * Discover / Locations / Map / Visits) with Lucide icons, a visits-this-month badge, icon-only tabs with
 * dot badges on mobile, lazily mounted tabs, store-driven refresh, and
 * persisted active tab.
 */
import { ItemView, Platform, WorkspaceLeaf, setIcon } from "obsidian";
import { DATA_CHANGED_EVENT, PLUGIN_ICON, VIEW_TYPE } from "../types";
import type { FoodSpotPluginApi, TabHandle } from "../types";
import { mountSpotsTab, applySpotsLocation, applySpotsQuery } from "./tabs/spots";
import type { LocationFilter } from "./tabs/spots";
import { mountDiscoverTab } from "./tabs/discover";
import { mountPlacesTab } from "./tabs/places";
import { mountMapTab } from "./tabs/map";
import { mountVisitsTab } from "./tabs/visits";
import { mountDashboardTab } from "./tabs/dashboard";

interface TabDef {
  id: string;
  label: string;
  icon: string;
  mount(container: HTMLElement, plugin: FoodSpotPluginApi): TabHandle;
}

const TABS: TabDef[] = [
  { id: "dashboard", label: "Dashboard", icon: "layout-dashboard", mount: mountDashboardTab },
  { id: "spots", label: "Spots", icon: "utensils", mount: mountSpotsTab },
  { id: "discover", label: "Discover", icon: "compass", mount: mountDiscoverTab },
  { id: "places", label: "Locations", icon: "list-tree", mount: mountPlacesTab },
  { id: "map", label: "Map", icon: "map", mount: mountMapTab },
  { id: "visits", label: "Visits", icon: "history", mount: mountVisitsTab },
];

export class FoodSpotView extends ItemView {
  private plugin: FoodSpotPluginApi;
  private handles = new Map<string, TabHandle>();
  private panes = new Map<string, HTMLElement>();
  private tabButtons = new Map<string, HTMLElement>();
  private badgeEl: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  private activeTab: string | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: FoodSpotPluginApi) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Food Spot";
  }

  getIcon(): string {
    return PLUGIN_ICON;
  }

  async onOpen(): Promise<void> {
    const root = this.contentEl;
    root.empty();
    root.addClass("fs-view");
    if (Platform.isMobile) root.addClass("fs-mobile");

    const bar = root.createDiv({ cls: "fs-tab-bar" });
    const content = root.createDiv({ cls: "fs-tab-content" });

    for (const def of TABS) {
      const btn = bar.createEl("button", {
        cls: "fs-tab",
        attr: { "aria-label": def.label, "data-tab": def.id },
      });
      const ic = btn.createSpan({ cls: "fs-tab-icon" });
      setIcon(ic, def.icon);
      if (!Platform.isMobile) btn.createSpan({ cls: "fs-tab-label", text: def.label });
      if (def.id === "visits") {
        this.badgeEl = btn.createSpan({
          cls: Platform.isMobile ? "fs-tab-dot" : "fs-tab-badge",
        });
      }
      btn.addEventListener("click", () => this.setActiveTab(def.id));
      this.tabButtons.set(def.id, btn);

      const pane = content.createDiv({ cls: "fs-tab-pane is-hidden" });
      this.panes.set(def.id, pane);
    }

    // Register ONCE; unsubscribed in onClose. The store's debounced notify
    // dispatches this same DOM CustomEvent, and the settings tab fires it for
    // render-affecting changes (card size, tier colors, …) — listening here
    // covers both emitters with a single refresh per notify.
    const onEvent = () => this.onDataChanged();
    document.addEventListener(DATA_CHANGED_EVENT, onEvent);
    this.unsubscribe = () => document.removeEventListener(DATA_CHANGED_EVENT, onEvent);
    this.updateBadge();

    const saved = this.plugin.settings.activeTab;
    const initial = TABS.some((t) => t.id === saved) ? saved : "dashboard";
    this.setActiveTab(initial, true);
  }

  async onClose(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = null;
    for (const handle of this.handles.values()) handle.destroy();
    this.handles.clear();
    this.panes.clear();
    this.tabButtons.clear();
    this.badgeEl = null;
    this.contentEl.empty();
  }

  setActiveTab(tab: string, skipPersist = false): void {
    const def = TABS.find((t) => t.id === tab);
    if (!def) return;
    this.activeTab = tab;
    for (const [id, btn] of this.tabButtons) btn.toggleClass("is-active", id === tab);
    for (const [id, pane] of this.panes) pane.toggleClass("is-hidden", id !== tab);
    const pane = this.panes.get(tab);
    if (!pane) return;
    let handle = this.handles.get(tab);
    if (!handle) {
      // Lazy mount on first activation.
      handle = def.mount(pane, this.plugin);
      this.handles.set(tab, handle);
    } else {
      // Catch up on anything that changed while hidden.
      handle.refresh();
    }
    if (!skipPersist && this.plugin.settings.activeTab !== tab) {
      this.plugin.settings.activeTab = tab;
      void this.plugin.saveSettings();
    }
    // Detail-modal chip-click handoff: consume plugin.pendingQuery once the
    // Spots tab is mounted (mount sets the controller synchronously above).
    if (tab === "spots") {
      const carrier = this.plugin as FoodSpotPluginApi & { pendingQuery?: string };
      if (carrier.pendingQuery) {
        const q = carrier.pendingQuery;
        delete carrier.pendingQuery;
        applySpotsQuery(this.plugin, q);
      }
    }
  }

  /** Switch to Spots and narrow it to a location (used by the Locations tab). */
  applyLocationFilter(loc: LocationFilter): void {
    this.setActiveTab("spots");
    applySpotsLocation(this.plugin, loc);
  }

  private onDataChanged(): void {
    this.updateBadge();
    // Only the visible tab pays the render cost; hidden tabs catch up in
    // setActiveTab, which always refreshes an already-mounted tab on re-show.
    if (this.activeTab) this.handles.get(this.activeTab)?.refresh();
  }

  private visitsThisMonth(): number {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let count = 0;
    for (const spot of this.plugin.store.getSpots()) {
      for (const visit of spot.visits) {
        if (visit.date.startsWith(prefix)) count++;
      }
    }
    return count;
  }

  private updateBadge(): void {
    if (!this.badgeEl) return;
    const count = this.visitsThisMonth();
    const btn = this.tabButtons.get("visits");
    if (Platform.isMobile) {
      this.badgeEl.toggleClass("is-visible", count > 0);
      btn?.setAttribute("aria-label", count > 0 ? `Visits (${count} this month)` : "Visits");
    } else {
      this.badgeEl.setText(count > 0 ? String(count) : "");
      this.badgeEl.toggleClass("is-visible", count > 0);
      btn?.setAttribute("title", count > 0 ? `${count} visits this month` : "Visits");
    }
  }
}
