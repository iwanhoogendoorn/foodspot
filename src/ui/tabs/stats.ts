/**
 * Food Spot — Stats tab: one row per restaurant with logged visits, showing
 * how often, how expensive, and how long the relationship has run — visit
 * count, total / average spend, first and latest entry each with its cost.
 *
 * The dashboard answers "what does the whole library look like"; this tab
 * answers "how does each restaurant compare". Every column header sorts
 * (click again to flip), the search box narrows by name or place, and every
 * row opens the spot's detail modal.
 */
import { setIcon } from "obsidian";
import type { DateFormat, FoodSpot, FoodSpotPluginApi, TabHandle, Visit } from "../../types";
import { buildSearchBox } from "../components/toolbar";
import { openDetailModal } from "../modals/detail";

/** Usable amount on a visit — a missing amount is not a €0 amount. */
function spentOf(v: Visit): number | undefined {
  const n = v.spent;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return undefined;
  return n;
}

interface SpotAgg {
  spot: FoodSpot;
  count: number;
  /** Sum over visits that carry an amount; undefined when none do. */
  total?: number;
  /** total ÷ visits-with-an-amount, so unlogged costs don't drag it down. */
  avg?: number;
  first: Visit;
  last: Visit;
  /** Chronological — the sparkline and the expanded chart both read this. */
  visitsSorted: Visit[];
  /** Count of visits that carry an amount. */
  paidCount: number;
}

function aggregate(spots: FoodSpot[]): SpotAgg[] {
  const rows: SpotAgg[] = [];
  for (const spot of spots) {
    if (spot.visits.length === 0) continue;
    const sorted = [...spot.visits].sort((a, b) => a.date.localeCompare(b.date));
    const amounts = sorted.map(spentOf).filter((n): n is number => n !== undefined);
    const total = amounts.length ? amounts.reduce((s, n) => s + n, 0) : undefined;
    rows.push({
      spot,
      count: sorted.length,
      total,
      avg: total !== undefined ? total / amounts.length : undefined,
      first: sorted[0],
      last: sorted[sorted.length - 1],
      visitsSorted: sorted,
      paidCount: amounts.length,
    });
  }
  return rows;
}

type SortKey = "name" | "count" | "total" | "avg" | "first" | "last";

interface ColumnDef {
  key: SortKey;
  label: string;
  /** Natural first-click direction: text ascending, numbers/dates descending. */
  defaultDir: 1 | -1;
  numeric: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: "name", label: "Restaurant", defaultDir: 1, numeric: false },
  { key: "count", label: "Visits", defaultDir: -1, numeric: true },
  { key: "total", label: "Total", defaultDir: -1, numeric: true },
  { key: "avg", label: "Avg / visit", defaultDir: -1, numeric: true },
  { key: "first", label: "First visit", defaultDir: -1, numeric: true },
  { key: "last", label: "Last visit", defaultDir: -1, numeric: true },
];

/**
 * Ascending comparator per key; the caller applies direction. Rows without an
 * amount sort below rows with one in EITHER direction — "no data" is not a
 * very small number.
 */
function compare(a: SpotAgg, b: SpotAgg, key: SortKey, dir: 1 | -1): number {
  const nameTie = a.spot.name.localeCompare(b.spot.name);
  switch (key) {
    case "name":
      return dir * nameTie;
    case "count":
      return dir * (a.count - b.count) || nameTie;
    case "first":
      return dir * a.first.date.localeCompare(b.first.date) || nameTie;
    case "last":
      return dir * a.last.date.localeCompare(b.last.date) || nameTie;
    case "total":
    case "avg": {
      const av = a[key];
      const bv = b[key];
      if (av === undefined && bv === undefined) return nameTie;
      if (av === undefined) return 1;
      if (bv === undefined) return -1;
      return dir * (av - bv) || nameTie;
    }
  }
}

function fmtDate(iso: string, format: DateFormat): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  switch (format) {
    case "american":
      return `${m}/${d}/${y}`;
    case "iso":
      return iso;
    default:
      return `${d}-${m}-${y}`;
  }
}

/** Two-digit year variant for the expanded chart's axis, where space is tight. */
function shortDate(iso: string, format: DateFormat): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const yy = y.slice(2);
  switch (format) {
    case "american":
      return `${m}/${d}/${yy}`;
    case "iso":
      return `${yy}-${m}-${d}`;
    default:
      return `${d}-${m}-${yy}`;
  }
}

export function mountStatsTab(container: HTMLElement, plugin: FoodSpotPluginApi): TabHandle {
  const root = container.createDiv({ cls: "fs-stats" });

  const header = root.createDiv({ cls: "fs-stats-header" });
  header.createDiv({ cls: "fs-stats-title", text: "Restaurant statistics" });
  const countEl = header.createSpan({ cls: "fs-stats-count" });
  buildSearchBox(header, {
    placeholder: "Filter restaurants…",
    onQuery: (q) => {
      query = q.trim().toLowerCase();
      renderRows();
    },
  });

  const wrap = root.createDiv({ cls: "fs-stats-tablewrap" });
  const table = wrap.createEl("table", { cls: "fs-stats-table" });
  const thead = table.createEl("thead");
  const headRow = thead.createEl("tr");
  const tbody = table.createEl("tbody");

  let query = "";
  let sortKey: SortKey = "count";
  let sortDir: 1 | -1 = -1;
  const headCells = new Map<SortKey, HTMLElement>();
  /** Spot paths whose chart row is unfolded — survives re-renders and sorting. */
  const expanded = new Set<string>();
  /** COLUMNS plus the unsortable sparkline column. */
  const totalCols = COLUMNS.length + 1;

  for (const col of COLUMNS) {
    const th = headRow.createEl("th", {
      cls: col.numeric ? "is-num" : undefined,
      attr: { scope: "col", role: "button", tabindex: "0" },
    });
    th.createSpan({ text: col.label });
    const arrow = th.createSpan({ cls: "fs-stats-arrow" });
    setIcon(arrow, "chevron-down");
    headCells.set(col.key, th);
    const activate = (): void => {
      if (sortKey === col.key) {
        sortDir = sortDir === 1 ? -1 : 1;
      } else {
        sortKey = col.key;
        sortDir = col.defaultDir;
      }
      renderRows();
    };
    th.addEventListener("click", activate);
    th.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    });
    // The sparkline column sits between the money columns and the dates.
    // A shape isn't sortable, so this header takes no listeners.
    if (col.key === "avg") {
      headRow.createEl("th", {
        cls: "is-num fs-stats-sparkhead",
        text: "Spend",
        attr: { scope: "col" },
      });
    }
  }

  const money = (n: number): string => {
    const symbol = plugin.settings.currencySymbol || "€";
    const decimals = Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2;
    return `${symbol}${n.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: 2,
    })}`;
  };

  const visitCell = (tr: HTMLElement, v: Visit): void => {
    const td = tr.createEl("td", { cls: "is-num" });
    td.createDiv({ cls: "fs-stats-date", text: fmtDate(v.date, plugin.settings.dateFormat) });
    const amount = spentOf(v);
    td.createDiv({ cls: "fs-stats-sub", text: amount === undefined ? "—" : money(amount) });
  };

  /**
   * Tiny inline bar chart of the visit amounts in date order. Clicking it
   * unfolds the full chart row below — NOT the detail modal, so the click
   * must never bubble up to the row.
   */
  const sparkCell = (tr: HTMLElement, r: SpotAgg): void => {
    const td = tr.createEl("td", { cls: "is-num fs-stats-sparkcell" });
    if (r.paidCount === 0) {
      td.createSpan({ cls: "fs-stats-sub", text: "—" });
      return;
    }
    const W = 96;
    const H = 26;
    const GAP = 2;
    const n = r.visitsSorted.length;
    const barW = Math.max(1.5, (W - (n - 1) * GAP) / n);
    const max = Math.max(...r.visitsSorted.map((v) => spentOf(v) ?? 0));
    const isOpen = expanded.has(r.spot.path);
    td.setAttr("role", "button");
    td.setAttr("tabindex", "0");
    td.setAttr("aria-expanded", String(isOpen));
    td.setAttr("aria-label", `${isOpen ? "Collapse" : "Expand"} spend chart for ${r.spot.name}`);
    const svg = td.createSvg("svg", {
      cls: "fs-spark",
      attr: { viewBox: `0 0 ${W} ${H}`, width: W, height: H },
    });
    r.visitsSorted.forEach((v, i) => {
      const amount = spentOf(v);
      // A visit without an amount keeps its slot as a faint stub, so the
      // shape still reads as "one bar per visit".
      const h = amount === undefined || max <= 0 ? 2 : Math.max(2, (amount / max) * H);
      svg.createSvg("rect", {
        cls: amount === undefined ? "fs-spark-bar is-empty" : "fs-spark-bar",
        attr: {
          x: (i * (barW + GAP)).toFixed(2),
          y: (H - h).toFixed(2),
          width: barW.toFixed(2),
          height: h.toFixed(2),
          rx: 1,
        },
      });
    });
    const toggle = (e: Event): void => {
      // The row's own handler opens the detail modal — never both.
      e.stopPropagation();
      if (expanded.has(r.spot.path)) expanded.delete(r.spot.path);
      else expanded.add(r.spot.path);
      renderRows();
    };
    td.addEventListener("click", toggle);
    td.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(e);
      }
    });
  };

  /** The unfolded chart: one labelled bar per visit, oldest to newest. */
  const renderChart = (parent: HTMLElement, r: SpotAgg): void => {
    const head = parent.createDiv({ cls: "fs-chart-head" });
    head.setText(
      r.total === undefined
        ? `${r.count} ${r.count === 1 ? "visit" : "visits"} · no amounts logged`
        : `${r.count} ${r.count === 1 ? "visit" : "visits"} · ${money(r.total)} total · ` +
            `${money(r.avg ?? 0)} average` +
            (r.paidCount < r.count ? ` · ${r.count - r.paidCount} without amount` : ""),
    );
    const chart = parent.createDiv({ cls: "fs-chart" });
    const max = Math.max(...r.visitsSorted.map((v) => spentOf(v) ?? 0), 1);
    for (const v of r.visitsSorted) {
      const amount = spentOf(v);
      const col = chart.createDiv({ cls: "fs-chart-col" });
      col.setAttr(
        "aria-label",
        `${fmtDate(v.date, plugin.settings.dateFormat)}: ${amount === undefined ? "no amount" : money(amount)}`,
      );
      col.title = `${fmtDate(v.date, plugin.settings.dateFormat)} · ${amount === undefined ? "no amount" : money(amount)}${v.note ? `\n${v.note}` : ""}`;
      col.createDiv({
        cls: "fs-chart-val",
        text: amount === undefined ? "—" : money(Math.round(amount)),
      });
      const bar = col.createDiv({ cls: "fs-chart-bar" });
      if (amount === undefined) bar.addClass("is-empty");
      bar.style.height = `${amount === undefined ? 3 : Math.max(3, Math.round((amount / max) * 110))}px`;
      col.createDiv({
        cls: "fs-chart-date",
        text: shortDate(v.date, plugin.settings.dateFormat),
      });
    }
  };

  const renderRows = (): void => {
    // Sort indicator lives on exactly one header at a time.
    for (const [key, th] of headCells) {
      th.toggleClass("is-sorted", key === sortKey);
      th.toggleClass("is-asc", key === sortKey && sortDir === 1);
    }

    let rows = aggregate(plugin.store.getSpots());
    if (query) {
      rows = rows.filter((r) => {
        const hay = [r.spot.name, r.spot.city, r.spot.country].filter(Boolean).join(" ");
        return hay.toLowerCase().includes(query);
      });
    }
    rows.sort((a, b) => compare(a, b, sortKey, sortDir));

    const visitSum = rows.reduce((s, r) => s + r.count, 0);
    const spendSum = rows.reduce((s, r) => s + (r.total ?? 0), 0);
    countEl.setText(
      rows.length
        ? `${rows.length} restaurants · ${visitSum} visits · ${money(spendSum)}`
        : "",
    );

    tbody.empty();
    if (!rows.length) {
      const tr = tbody.createEl("tr", { cls: "fs-stats-emptyrow" });
      tr.createEl("td", {
        attr: { colspan: String(totalCols) },
        text: query ? "No restaurants match this filter." : "No visits logged yet.",
      });
      return;
    }

    for (const r of rows) {
      const tr = tbody.createEl("tr", {
        cls: "fs-stats-row",
        attr: { role: "button", tabindex: "0", "aria-label": `Open ${r.spot.name}` },
      });
      const open = (): void => openDetailModal(plugin, r.spot.path);
      tr.addEventListener("click", open);
      tr.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });

      const nameTd = tr.createEl("td", { cls: "fs-stats-namecell" });
      nameTd.createDiv({ cls: "fs-stats-name", text: r.spot.name });
      const where = [r.spot.city, r.spot.country].filter(Boolean).join(", ");
      if (where) nameTd.createDiv({ cls: "fs-stats-sub", text: where });

      tr.createEl("td", { cls: "is-num", text: String(r.count) });
      tr.createEl("td", { cls: "is-num", text: r.total === undefined ? "—" : money(r.total) });
      tr.createEl("td", { cls: "is-num", text: r.avg === undefined ? "—" : money(r.avg) });
      sparkCell(tr, r);
      visitCell(tr, r.first);
      visitCell(tr, r.last);

      if (expanded.has(r.spot.path)) {
        const ex = tbody.createEl("tr", { cls: "fs-stats-expandrow" });
        const td = ex.createEl("td", { attr: { colspan: String(totalCols) } });
        renderChart(td, r);
      }
    }
  };

  renderRows();

  return {
    refresh: renderRows,
    destroy: () => root.remove(),
  };
}
