/**
 * Food Spot — stat drill-down.
 *
 * Every bar in the dashboard's "More statistics" grid is an aggregate of
 * something: a month of visits, a city's spend, the spots at one price tier.
 * This modal shows what a bar is actually made of, and every row from here
 * opens the spot itself — so the grid stops being a dead end.
 *
 * Two shapes go in, one list comes out:
 * - VISIT rows (a month, a year, a city's spend) lead with the date.
 * - SPOT rows (a country, a cuisine, a price tier) lead with the name.
 *
 * The modal is a snapshot. It reads the spots it was handed and does not
 * subscribe to store changes: editing a spot from here and coming back to a
 * stale list would be worse than a list that plainly belongs to the moment
 * it was opened.
 */
import { Modal, setIcon } from "obsidian";
import type { FoodSpot, FoodSpotPluginApi, Visit } from "../../types";
import { openDetailModal } from "./detail";

export interface DrillVisit {
  spot: FoodSpot;
  visit: Visit;
}

export interface DrillSpec {
  /** Panel name and bucket, e.g. "Spend by month · May 26". */
  title: string;
  /** Visit-level rows, newest first. Mutually exclusive with `spots`. */
  visits?: DrillVisit[];
  /** Spot-level rows. Mutually exclusive with `visits`. */
  spots?: FoodSpot[];
  /** Overrides the computed summary line (count + total). */
  summary?: string;
}

export function openStatDrill(plugin: FoodSpotPluginApi, spec: DrillSpec): void {
  new StatDrillModal(plugin, spec).open();
}

/** Usable amount on a visit — a missing amount is not a €0 amount. */
function spentOf(v: Visit): number | undefined {
  const n = v.spent;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return undefined;
  return n;
}

/**
 * What to show on the right of a spot row.
 *
 * `visitCount` counts DATED visit bullets; `status` is the flag on the note.
 * They are independent — a spot can be marked visited with nothing logged
 * (every spot imported before visit history existed looks like that). Reading
 * the count as the status labelled those "Want to try" while the panel header,
 * which counts by status, called them visited.
 */
function statusLabel(s: FoodSpot): string {
  if (s.visitCount > 0) {
    return `${s.visitCount} ${s.visitCount === 1 ? "visit" : "visits"}`;
  }
  return s.status === "visited" ? "Visited" : "Want to try";
}

class StatDrillModal extends Modal {
  constructor(
    private readonly plugin: FoodSpotPluginApi,
    private readonly spec: DrillSpec,
  ) {
    super(plugin.app);
  }

  private money(n: number): string {
    const symbol = this.plugin.settings.currencySymbol || "€";
    const decimals = Number.isInteger(n) ? 0 : 2;
    return `${symbol}${n.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }

  private date(iso: string): string {
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return iso;
    switch (this.plugin.settings.dateFormat) {
      case "american":
        return `${m}/${d}/${y}`;
      case "iso":
        return iso;
      default:
        return `${d}-${m}-${y}`;
    }
  }

  /** Close this modal before opening the spot, so they never stack up. */
  private goToSpot(path: string): void {
    this.close();
    openDetailModal(this.plugin, path);
  }

  private row(
    parent: HTMLElement,
    o: { lead: string; sub?: string; value?: string; meta?: string; path: string },
  ): void {
    const row = parent.createDiv({ cls: "fs-drill-row" });
    const main = row.createDiv({ cls: "fs-drill-main" });
    main.createDiv({ cls: "fs-drill-lead", text: o.lead });
    if (o.sub) main.createDiv({ cls: "fs-drill-sub", text: o.sub });
    const right = row.createDiv({ cls: "fs-drill-right" });
    if (o.value) right.createDiv({ cls: "fs-drill-value", text: o.value });
    if (o.meta) right.createDiv({ cls: "fs-drill-meta", text: o.meta });
    row.onclick = () => this.goToSpot(o.path);
    row.setAttr("role", "button");
    row.setAttr("tabindex", "0");
    row.onkeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.goToSpot(o.path);
      }
    };
  }

  override onOpen(): void {
    this.modalEl.addClass("fs-modal", "fs-drill-modal");
    this.titleEl.setText(this.spec.title);
    const { visits, spots } = this.spec;

    const head = this.contentEl.createDiv({ cls: "fs-drill-summary" });
    const body = this.contentEl.createDiv({ cls: "fs-drill-list" });

    if (visits && visits.length) {
      // Newest first: the recent end of a bucket is the interesting end.
      const sorted = [...visits].sort((a, b) => b.visit.date.localeCompare(a.visit.date));
      const amounts = sorted
        .map((r) => spentOf(r.visit))
        .filter((n): n is number => n !== undefined);
      const total = amounts.reduce((n, a) => n + a, 0);
      head.setText(
        this.spec.summary ??
          `${sorted.length} ${sorted.length === 1 ? "visit" : "visits"}` +
            (amounts.length ? ` · ${this.money(total)}` : ""),
      );
      for (const r of sorted) {
        const amount = spentOf(r.visit);
        this.row(body, {
          lead: this.date(r.visit.date),
          sub: r.spot.city ? `${r.spot.name} · ${r.spot.city}` : r.spot.name,
          value: amount === undefined ? "—" : this.money(amount),
          meta: r.visit.rating !== undefined ? `★ ${r.visit.rating}` : undefined,
          path: r.spot.path,
        });
      }
      return;
    }

    if (spots && spots.length) {
      // Most-logged first, then the ones marked visited but never logged,
      // then the wishlist — so the order agrees with the labels.
      const rank = (s: FoodSpot) => (s.status === "visited" ? 0 : 1);
      const sorted = [...spots].sort(
        (a, b) =>
          b.visitCount - a.visitCount ||
          rank(a) - rank(b) ||
          a.name.localeCompare(b.name),
      );
      const visited = sorted.filter((s) => s.status === "visited").length;
      head.setText(
        this.spec.summary ??
          `${sorted.length} ${sorted.length === 1 ? "spot" : "spots"} · ${visited} visited`,
      );
      for (const s of sorted) {
        const where = [s.city, s.country].filter(Boolean).join(", ");
        this.row(body, {
          lead: s.name,
          sub: where || undefined,
          value: statusLabel(s),
          meta: s.rating !== undefined ? `★ ${s.rating}` : undefined,
          path: s.path,
        });
      }
      return;
    }

    // Reachable when a bucket is empty (a month with no visits, say) — the
    // bar is still clickable, so say plainly that there is nothing behind it.
    const empty = this.contentEl.createDiv({ cls: "fs-drill-empty" });
    const icon = empty.createSpan({ cls: "fs-drill-empty-icon" });
    setIcon(icon, "utensils-crossed");
    empty.createSpan({ text: "Nothing in this bucket yet." });
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}
