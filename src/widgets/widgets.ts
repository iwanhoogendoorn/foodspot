/**
 * Food Spot — ```foodspot``` code-block widgets.
 *
 * Line-based `key: value` params. Views: cards / list / table / stat /
 * random / shortlist. Unknown keys or bad values render an inline error
 * listing the valid options. A registry keyed by container element re-renders
 * every connected widget on the "foodspot-data-changed" CustomEvent and
 * prunes disconnected ones.
 */
import { MarkdownRenderChild, Plugin, setIcon } from "obsidian";
import type { FoodSpot, FoodSpotPluginApi, SortKey, SpotStatus } from "../types";
import { CODE_BLOCK_LANG, DATA_CHANGED_EVENT } from "../types";
import { sortSpots } from "../search/query";
import { buildSpotCard, releaseLazyPhotos } from "../ui/components/card";
import { openDetailModal } from "../ui/modals/detail";

type FoodSpotPlugin = Plugin & FoodSpotPluginApi;

const VIEWS = ["cards", "list", "table", "stat", "random", "shortlist"] as const;
type WidgetView = (typeof VIEWS)[number];

const STATS = ["visited-ratio", "counts", "top-cuisines"] as const;
type WidgetStat = (typeof STATS)[number];

const SORT_KEYS: SortKey[] = [
  "name",
  "rating",
  "external-rating",
  "price",
  "date-added",
  "last-visit",
  "visit-count",
];

const VALID_KEYS = [
  "view", "country", "city", "district", "cuisine", "status", "tag",
  "price", "minRating", "favorite", "closed", "limit", "sort", "direction", "stat",
];

interface WidgetParams {
  view: WidgetView;
  country?: string;
  city?: string;
  district?: string;
  cuisine?: string;
  tag?: string;
  status?: SpotStatus;
  price?: number;
  minRating?: number;
  favorite?: boolean;
  /** Permanently closed: true = only closed, false = hide closed. */
  closed?: boolean;
  limit?: number;
  sort?: SortKey;
  direction?: "asc" | "desc";
  stat?: WidgetStat;
}

interface WidgetEntry {
  params: WidgetParams;
  errors: string[];
  state: { randomPath?: string };
}

// ---------------------------------------------------------------------------
// parsing
// ---------------------------------------------------------------------------

function parseSource(source: string): { params: WidgetParams; errors: string[] } {
  const params: WidgetParams = { view: "cards" };
  const errors: string[] = [];
  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) {
      errors.push(`"${line}" is not a "key: value" pair.`);
      continue;
    }
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    switch (key) {
      case "view":
        if ((VIEWS as readonly string[]).includes(value)) params.view = value as WidgetView;
        else errors.push(`view: "${value}" — valid views: ${VIEWS.join(", ")}.`);
        break;
      case "country":
      case "city":
      case "district":
      case "cuisine":
      case "tag":
        if (value) params[key] = value;
        else errors.push(`${key}: needs a value.`);
        break;
      case "status":
        if (value === "want-to-try" || value === "visited") params.status = value;
        else errors.push(`status: "${value}" — valid: want-to-try, visited.`);
        break;
      case "price": {
        const n = Number(value);
        if (Number.isInteger(n) && n >= 1 && n <= 4) params.price = n;
        else errors.push(`price: "${value}" — must be a whole number 1–4.`);
        break;
      }
      case "minRating": {
        const n = Number(value);
        if (!Number.isNaN(n) && n >= 0 && n <= 5) params.minRating = n;
        else errors.push(`minRating: "${value}" — must be a number 0–5.`);
        break;
      }
      case "favorite":
        if (value === "true" || value === "false") params.favorite = value === "true";
        else errors.push(`favorite: "${value}" — must be true or false.`);
        break;
      case "closed":
        if (value === "true" || value === "false") params.closed = value === "true";
        else errors.push(`closed: "${value}" — must be true or false.`);
        break;
      case "limit": {
        const n = Number(value);
        if (Number.isInteger(n) && n > 0) params.limit = n;
        else errors.push(`limit: "${value}" — must be a positive whole number.`);
        break;
      }
      case "sort":
        if ((SORT_KEYS as string[]).includes(value)) params.sort = value as SortKey;
        else errors.push(`sort: "${value}" — valid: ${SORT_KEYS.join(", ")}.`);
        break;
      case "direction":
        if (value === "asc" || value === "desc") params.direction = value;
        else errors.push(`direction: "${value}" — must be asc or desc.`);
        break;
      case "stat":
        if ((STATS as readonly string[]).includes(value)) params.stat = value as WidgetStat;
        else errors.push(`stat: "${value}" — valid: ${STATS.join(", ")}.`);
        break;
      default:
        errors.push(`Unknown key "${key}".`);
    }
  }
  return { params, errors };
}

// ---------------------------------------------------------------------------
// filtering
// ---------------------------------------------------------------------------

function eq(a: string | undefined, b: string): boolean {
  return (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();
}

function applyFilters(spots: FoodSpot[], p: WidgetParams): FoodSpot[] {
  return spots.filter((s) => {
    if (p.country && !eq(s.country, p.country)) return false;
    if (p.city && !eq(s.city, p.city)) return false;
    if (p.district && !eq(s.district, p.district)) return false;
    if (p.cuisine && !s.cuisines.some((c) => eq(c, p.cuisine as string))) return false;
    if (p.tag && !s.tags.some((t) => eq(t, p.tag as string))) return false;
    if (p.status && s.status !== p.status) return false;
    if (p.price !== undefined && s.price !== p.price) return false;
    // Same semantics as the Spots tab (query.ts): unrated spots are NEVER
    // excluded by minRating — coercing them to 0 was v0.1 defect #14.
    if (
      p.minRating !== undefined &&
      p.minRating > 0 &&
      s.rating !== undefined &&
      s.rating < p.minRating
    )
      return false;
    if (p.favorite !== undefined && s.favorite !== p.favorite) return false;
    if (p.closed !== undefined && s.permanentlyClosed !== p.closed) return false;
    return true;
  });
}

function defaultSortKey(view: WidgetView): SortKey {
  return view === "list" || view === "shortlist" || view === "table" ? "name" : "date-added";
}

// ---------------------------------------------------------------------------
// rendering
// ---------------------------------------------------------------------------

function renderError(el: HTMLElement, errors: string[]): void {
  const box = el.createDiv({ cls: "fs-widget-error" });
  const head = box.createDiv({ cls: "fs-widget-error-title" });
  const icon = head.createSpan();
  setIcon(icon, "alert-triangle");
  head.createSpan({ text: "Food Spot widget — invalid block" });
  const ul = box.createEl("ul");
  for (const e of errors) ul.createEl("li", { text: e });
  box.createDiv({
    cls: "fs-widget-error-help",
    text:
      `Valid keys: ${VALID_KEYS.join(", ")}. ` +
      `Views: ${VIEWS.join(", ")}. Stats: ${STATS.join(", ")}. ` +
      `Sort keys: ${SORT_KEYS.join(", ")}.`,
  });
}

function widgetEmpty(el: HTMLElement, text: string): void {
  el.createDiv({ cls: "fs-widget-empty", text });
}

function metaText(s: FoodSpot): string {
  const meta: string[] = [];
  if (s.city) meta.push(s.city);
  if (s.rating !== undefined) meta.push(`★ ${s.rating}`);
  else if (s.external.googleRating !== undefined) meta.push(`G ${s.external.googleRating}`);
  return meta.join(" · ");
}

function renderCards(plugin: FoodSpotPlugin, el: HTMLElement, items: FoodSpot[]): void {
  if (!items.length) {
    widgetEmpty(el, "No spots match this widget's filters.");
    return;
  }
  // view: cards = the real photo card grid (settings doc + SPEC), not rows.
  const grid = el.createDiv({ cls: "fs-widget-cards" });
  for (const s of items) buildSpotCard(grid, s, { plugin });
}

function renderList(plugin: FoodSpotPlugin, el: HTMLElement, items: FoodSpot[]): void {
  if (!items.length) {
    widgetEmpty(el, "No spots match this widget's filters.");
    return;
  }
  const list = el.createDiv({ cls: "fs-widget-list" });
  for (const s of items) {
    const row = list.createDiv({ cls: "fs-widget-list-row" });
    row.createSpan({ cls: "fs-widget-name", text: s.name });
    row.createSpan({ cls: "fs-widget-meta", text: metaText(s) });
    row.onclick = () => openDetailModal(plugin, s.path);
  }
}

function renderTable(plugin: FoodSpotPlugin, el: HTMLElement, items: FoodSpot[]): void {
  if (!items.length) {
    widgetEmpty(el, "No spots match this widget's filters.");
    return;
  }
  const wrap = el.createDiv({ cls: "fs-widget-tablewrap" });
  const table = wrap.createEl("table", { cls: "fs-widget-table" });
  const thr = table.createEl("thead").createEl("tr");
  for (const h of ["Name", "Cuisine", "City", "My ★", "Visits"]) thr.createEl("th", { text: h });
  const tbody = table.createEl("tbody");
  for (const s of items) {
    const tr = tbody.createEl("tr");
    tr.createEl("td", { text: s.name, cls: "fs-widget-name" });
    tr.createEl("td", { text: s.cuisines.join(", ") });
    tr.createEl("td", { text: s.city ?? "" });
    tr.createEl("td", { text: s.rating !== undefined ? String(s.rating) : "—" });
    tr.createEl("td", { text: String(s.visitCount) });
    tr.onclick = () => openDetailModal(plugin, s.path);
  }
}

function renderShortlist(plugin: FoodSpotPlugin, el: HTMLElement, items: FoodSpot[]): void {
  if (!items.length) {
    widgetEmpty(el, "Nothing on this shortlist yet — add matching want-to-try spots.");
    return;
  }
  const box = el.createDiv({ cls: "fs-widget-shortlist" });
  for (const s of items) {
    const row = box.createDiv({ cls: "fs-widget-shortlist-row" });
    const icon = row.createSpan();
    setIcon(icon, s.status === "visited" ? "check-circle-2" : "circle");
    row.createSpan({ cls: "fs-widget-name", text: s.name });
    if (s.city) row.createSpan({ cls: "fs-widget-shortlist-city", text: s.city });
    row.onclick = () => openDetailModal(plugin, s.path);
  }
}

function renderRandom(
  plugin: FoodSpotPlugin,
  el: HTMLElement,
  pool: FoodSpot[],
  entry: WidgetEntry,
): void {
  const wrap = el.createDiv({ cls: "fs-widget-random" });
  const btn = wrap.createEl("button", { cls: "fs-widget-shuffle" });
  const btnIcon = btn.createSpan();
  setIcon(btnIcon, "shuffle");
  btn.createSpan({ text: "Shuffle" });
  const slot = wrap.createDiv({ cls: "fs-widget-random-slot" });

  if (!pool.length) {
    widgetEmpty(slot, "No spots match this widget's filters — nothing to pick from.");
    btn.disabled = true;
    return;
  }
  const show = (s: FoodSpot) => {
    entry.state.randomPath = s.path;
    slot.empty();
    buildSpotCard(slot, s, { plugin, compact: true });
  };
  // Keep the current pick stable across data-changed repaints when possible.
  const current = pool.find((s) => s.path === entry.state.randomPath);
  show(current ?? (pool[Math.floor(Math.random() * pool.length)] as FoodSpot));
  // Re-rolls only replace the card slot — never the whole widget.
  btn.onclick = () => {
    if (pool.length <= 1) return;
    let pick = pool[Math.floor(Math.random() * pool.length)] as FoodSpot;
    if (pick.path === entry.state.randomPath) {
      pick = pool[(pool.indexOf(pick) + 1) % pool.length] as FoodSpot;
    }
    show(pick);
  };
}

const MINI_RING_R = 38;
const MINI_RING_C = 2 * Math.PI * MINI_RING_R;

function renderStat(el: HTMLElement, stat: WidgetStat, items: FoodSpot[]): void {
  const box = el.createDiv({ cls: "fs-widget-stat" });
  if (!items.length) {
    widgetEmpty(box, "No spots match this widget's filters yet.");
    return;
  }
  if (stat === "visited-ratio") {
    const total = items.length;
    const visited = items.filter((s) => s.status === "visited").length;
    const pct = Math.round((visited / total) * 100);
    const wrap = box.createDiv({ cls: "fs-widget-ring-wrap" });
    const svg = wrap.createSvg("svg", {
      attr: { viewBox: "0 0 100 100", width: 100, height: 100 },
    });
    svg.createSvg("circle", {
      cls: "fs-widget-ring-track",
      attr: { cx: 50, cy: 50, r: MINI_RING_R },
    });
    const prog = svg.createSvg("circle", {
      cls: "fs-widget-ring-progress",
      attr: {
        cx: 50,
        cy: 50,
        r: MINI_RING_R,
        transform: "rotate(-90 50 50)",
        "stroke-dasharray": MINI_RING_C.toFixed(2),
        "stroke-dashoffset": MINI_RING_C.toFixed(2),
      },
    });
    const center = wrap.createDiv({ cls: "fs-widget-ring-center" });
    center.createDiv({ cls: "fs-widget-ring-value", text: `${pct}%` });
    const target = (MINI_RING_C * (1 - visited / total)).toFixed(2);
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => prog.setAttribute("stroke-dashoffset", target)),
    );
    box.createDiv({
      cls: "fs-widget-ring-caption",
      text: `${visited} of ${total} visited`,
    });
    return;
  }
  if (stat === "counts") {
    const strip = box.createDiv({ cls: "fs-widget-strip" });
    const seg = (value: number, label: string) => {
      const s = strip.createDiv({ cls: "fs-widget-strip-seg" });
      s.createDiv({ cls: "fs-widget-strip-value", text: String(value) });
      s.createDiv({ cls: "fs-widget-strip-label", text: label });
    };
    seg(items.length, "spots");
    seg(new Set(items.map((s) => s.country.trim()).filter(Boolean)).size, "countries");
    seg(new Set(items.map((s) => (s.city ?? "").trim()).filter(Boolean)).size, "cities");
    seg(
      new Set(items.flatMap((s) => s.cuisines.map((c) => c.trim())).filter(Boolean)).size,
      "cuisines",
    );
    seg(items.reduce((n, s) => n + s.visitCount, 0), "visits");
    return;
  }
  // top-cuisines
  const counts = new Map<string, number>();
  for (const s of items) {
    for (const c of s.cuisines) {
      const key = c.trim();
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  if (!counts.size) {
    widgetEmpty(box, "No cuisines recorded on the matching spots yet.");
    return;
  }
  box.createDiv({ cls: "fs-widget-stat-title", text: "Top cuisines" });
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5);
  const max = Math.max(1, ...top.map(([, n]) => n));
  for (const [label, n] of top) {
    const row = box.createDiv({ cls: "fs-widget-bar-row" });
    row.createSpan({ text: label });
    row.createSpan({ cls: "fs-widget-meta", text: String(n) });
    const track = box.createDiv({ cls: "fs-widget-bar-track" });
    const fill = track.createDiv({ cls: "fs-widget-bar-fill" });
    fill.style.width = `${Math.round((n / max) * 100)}%`;
  }
}

function renderWidget(plugin: FoodSpotPlugin, el: HTMLElement, entry: WidgetEntry): void {
  releaseLazyPhotos(el); // pending lazy photos must leave the shared observer
  el.empty();
  if (entry.errors.length) {
    renderError(el, entry.errors);
    return;
  }
  const p: WidgetParams = { ...entry.params };
  // Shortlist is a want-to-try checklist by default.
  if (p.view === "shortlist" && p.status === undefined) p.status = "want-to-try";

  const all = plugin.store.getSpots();
  let items = applyFilters(all, p);
  const key = p.sort ?? defaultSortKey(p.view);
  const direction = p.direction ?? (key === "name" ? "asc" : "desc");
  items = sortSpots(items, { key, direction });
  const cap = p.limit ?? (p.view === "cards" ? 24 : 50);
  const limited = p.view === "stat" || p.view === "random" ? items : items.slice(0, cap);

  switch (p.view) {
    case "cards": renderCards(plugin, el, limited); break;
    case "list": renderList(plugin, el, limited); break;
    case "table": renderTable(plugin, el, limited); break;
    case "shortlist": renderShortlist(plugin, el, limited); break;
    case "random": renderRandom(plugin, el, items, entry); break;
    case "stat": renderStat(el, p.stat ?? "visited-ratio", items); break;
    default: renderCards(plugin, el, limited);
  }
}

// ---------------------------------------------------------------------------
// registration
// ---------------------------------------------------------------------------

export function registerWidgets(plugin: FoodSpotPlugin): void {
  const registry = new Map<HTMLElement, WidgetEntry>();

  plugin.registerMarkdownCodeBlockProcessor(CODE_BLOCK_LANG, (source, el, ctx) => {
    el.addClass("fs-widget");
    const { params, errors } = parseSource(source);
    const entry: WidgetEntry = { params, errors, state: {} };
    registry.set(el, entry);
    // Per-block lifecycle: Obsidian unloads the child when the rendered block
    // leaves the DOM, releasing the registry entry immediately instead of
    // holding detached widget trees until the next data-changed event.
    const child = new MarkdownRenderChild(el);
    child.onunload = () => {
      registry.delete(el);
      releaseLazyPhotos(el);
    };
    ctx.addChild(child);
    renderWidget(plugin, el, entry);
  });

  // Live re-render on data changes; prune disconnected containers (belt and
  // braces — MarkdownRenderChild unload above is the primary cleanup path).
  plugin.registerDomEvent(
    document,
    DATA_CHANGED_EVENT as keyof DocumentEventMap,
    () => {
      for (const [el, entry] of registry) {
        if (!el.isConnected) {
          registry.delete(el);
          releaseLazyPhotos(el);
          continue;
        }
        renderWidget(plugin, el, entry);
      }
    },
  );
}
