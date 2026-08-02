/**
 * Food Spot — Places tab: location tree Country → City → District that SKIPS
 * missing levels (v0.1 defect #2: never `break` on an empty level — a spot
 * with a district but no city hangs the district straight off the country).
 *
 * Each node shows its spot count and a visited/total coverage bar; clicking a
 * node jumps to the Spots tab with that location filter applied.
 */
import { setIcon } from "obsidian";
import { VIEW_TYPE } from "../../types";
import type { FoodSpot, FoodSpotPluginApi, TabHandle } from "../../types";
import type { LocationFilter } from "./spots";

interface LocNode {
  key: string;
  label: string;
  loc: LocationFilter;
  total: number;
  visited: number;
  children: Map<string, LocNode>;
}

export function mountPlacesTab(container: HTMLElement, plugin: FoodSpotPluginApi): TabHandle {
  const root = container.createDiv({ cls: "fs-places" });
  const expanded = new Set<string>();
  let expansionSeeded = false;

  const bump = (node: LocNode, spot: FoodSpot): void => {
    node.total++;
    if (spot.status === "visited") node.visited++;
  };

  const child = (parent: Map<string, LocNode>, key: string, label: string, loc: LocationFilter): LocNode => {
    let node = parent.get(key);
    if (!node) {
      node = { key, label, loc, total: 0, visited: 0, children: new Map() };
      parent.set(key, node);
    }
    return node;
  };

  function buildTree(): LocNode[] {
    const countries = new Map<string, LocNode>();
    for (const spot of plugin.store.getSpots()) {
      const country = spot.country?.trim() || "Unknown";
      const city = spot.city?.trim() || "";
      const district = spot.district?.trim() || "";
      const cNode = child(countries, `c:${country}`, country, { country });
      bump(cNode, spot);
      let parent = cNode;
      // Skip the city level when absent — never stop descending early.
      if (city) {
        const cityNode = child(cNode.children, `c:${country}|t:${city}`, city, {
          country,
          city,
        });
        bump(cityNode, spot);
        parent = cityNode;
      }
      if (district) {
        const dNode = child(
          parent.children,
          `${parent.key}|d:${district}`,
          district,
          { country, city: city || undefined, district }
        );
        bump(dNode, spot);
      }
    }
    return sortNodes([...countries.values()]);
  }

  function sortNodes(nodes: LocNode[]): LocNode[] {
    return nodes.sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  }

  function openInSpots(loc: LocationFilter): void {
    const leaf = plugin.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    const view = leaf?.view as unknown as
      | { applyLocationFilter?: (loc: LocationFilter) => void }
      | undefined;
    view?.applyLocationFilter?.(loc);
  }

  function renderNode(parent: HTMLElement, node: LocNode, depth: number): void {
    const row = parent.createDiv({ cls: "fs-place-row" });
    row.style.setProperty("--fs-depth", String(depth));
    const hasChildren = node.children.size > 0;
    if (hasChildren && expanded.has(node.key)) row.addClass("is-expanded");

    const chevron = row.createEl("button", {
      cls: "fs-place-chevron",
      attr: { "aria-label": expanded.has(node.key) ? "Collapse" : "Expand" },
    });
    if (hasChildren) {
      setIcon(chevron, "chevron-right");
      chevron.addEventListener("click", (e) => {
        e.stopPropagation();
        if (expanded.has(node.key)) expanded.delete(node.key);
        else expanded.add(node.key);
        render();
      });
    } else {
      chevron.addClass("is-leaf");
      chevron.tabIndex = -1;
    }

    const label = row.createEl("button", {
      cls: "fs-place-label",
      attr: { "aria-label": `Show spots in ${node.label}` },
    });
    label.createSpan({ cls: "fs-place-name", text: node.label });
    label.createSpan({ cls: "fs-place-count", text: String(node.total) });
    const coverage = label.createDiv({
      cls: "fs-coverage",
      attr: { title: `${node.visited}/${node.total} visited` },
    });
    const pct = node.total > 0 ? Math.round((node.visited / node.total) * 100) : 0;
    coverage.createDiv({ cls: "fs-coverage-fill" }).style.width = `${pct}%`;
    label.addEventListener("click", () => openInSpots(node.loc));

    if (hasChildren && expanded.has(node.key)) {
      for (const c of sortNodes([...node.children.values()])) {
        renderNode(parent, c, depth + 1);
      }
    }
  }

  /** Full rebuild is safe here — this tab holds no text inputs. */
  function render(): void {
    root.empty();
    const tree = buildTree();
    if (tree.length === 0) {
      const empty = root.createDiv({ cls: "fs-empty" });
      const ic = empty.createDiv({ cls: "fs-empty-icon" });
      setIcon(ic, "map-pin");
      empty.createDiv({ cls: "fs-empty-title", text: "No places yet" });
      empty.createDiv({
        cls: "fs-empty-text",
        text: "Spots you add appear here, grouped by country, city and district.",
      });
      return;
    }
    if (!expansionSeeded) {
      expansionSeeded = true;
      if (tree.length <= 8) for (const n of tree) expanded.add(n.key);
    }
    const list = root.createDiv({ cls: "fs-place-tree" });
    for (const node of tree) renderNode(list, node, 0);
  }

  render();

  return {
    refresh: () => render(),
    destroy: () => root.remove(),
  };
}
