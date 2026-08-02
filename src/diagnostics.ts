import { Notice, normalizePath } from "obsidian";
import type FoodSpotPlugin from "./main";

/**
 * Writes a live-DOM diagnostic snapshot of the dashboard into the vault so
 * rendering issues can be debugged without opening devtools: element counts,
 * computed styles of the layout-critical nodes, stylesheet presence, and a
 * truncated DOM dump.
 */
export async function dumpDashboardDiagnostics(plugin: FoodSpotPlugin): Promise<void> {
  const lines: string[] = [];
  const push = (s: string) => lines.push(s);

  push(`# Food Spot dashboard diagnostics`);
  push(`- generated: ${new Date().toISOString()}`);
  // @ts-expect-error apiVersion is untyped but present
  push(`- obsidian: ${plugin.app.apiVersion ?? "unknown"} · plugin: ${plugin.manifest.version}`);
  push(`- platform DPR: ${window.devicePixelRatio}`);

  const dashes = Array.from(document.querySelectorAll(".fs-dashboard"));
  const views = Array.from(document.querySelectorAll(".fs-view"));
  push(`- .fs-view count: ${views.length} · .fs-dashboard count: ${dashes.length}`);

  const sheetHits = Array.from(document.styleSheets).filter((ss) => {
    try {
      return Array.from(ss.cssRules).some(
        (r) => r.cssText.includes(".fs-stat-cards") || r.cssText.includes(".fs-ring-wrap"),
      );
    } catch {
      return false;
    }
  });
  push(`- stylesheets containing .fs-stat-cards/.fs-ring-wrap rules: ${sheetHits.length}`);
  for (const ss of sheetHits) {
    const owner = ss.ownerNode instanceof HTMLElement ? ss.ownerNode : null;
    let ruleText = "";
    try {
      ruleText =
        Array.from(ss.cssRules)
          .filter((r) => r.cssText.startsWith(".fs-stat-cards") || r.cssText.startsWith(".fs-ring-wrap"))
          .map((r) => r.cssText)
          .join(" | ") || "(rules present but not top-level)";
    } catch {
      ruleText = "(unreadable)";
    }
    push(`  - sheet owner: <${owner?.tagName.toLowerCase() ?? "?"}${owner?.id ? "#" + owner.id : ""}> rules: ${ruleText.slice(0, 400)}`);
  }

  const probe = (sel: string, props: string[]): void => {
    const el = document.querySelector(sel);
    if (!el) {
      push(`- ${sel}: NOT IN DOM`);
      return;
    }
    const cs = getComputedStyle(el);
    const vals = props.map((p) => `${p}=${cs.getPropertyValue(p)}`).join(" · ");
    const rect = (el as HTMLElement).getBoundingClientRect();
    push(`- ${sel}: ${vals} · rect=${Math.round(rect.width)}x${Math.round(rect.height)}`);
  };

  probe(".fs-dashboard", ["display", "overflow-y", "flex"]);
  probe(".fs-stat-cards", ["display", "grid-template-columns", "gap"]);
  probe(".fs-stat-card", ["display", "flex-direction", "align-items", "height"]);
  probe(".fs-ring-wrap", ["position", "width", "height"]);
  probe(".fs-ring", ["display", "width", "height"]);
  probe(".fs-ring-center", ["position", "inset", "display"]);
  probe(".fs-error-panel", ["display"]);

  const errPanels = Array.from(document.querySelectorAll(".fs-error-panel"));
  push(`- error panels visible: ${errPanels.length}`);
  for (const p of errPanels) push(`  - ${p.textContent?.slice(0, 200)}`);

  const dash = dashes[0] ?? views[0];
  push(``);
  push(`## DOM dump (${dashes[0] ? ".fs-dashboard" : "fallback: whole .fs-view"}, truncated 30k)`);
  push("```html");
  push(dash ? dash.outerHTML.slice(0, 30000) : "(no .fs-view in DOM)");
  push("```");

  const path = normalizePath("foodspot-diagnostics.md");
  const existing = plugin.app.vault.getFileByPath(path);
  if (existing) await plugin.app.vault.modify(existing, lines.join("\n"));
  else await plugin.app.vault.create(path, lines.join("\n"));
  new Notice(`Food Spot: diagnostics written to ${path}`);
}
