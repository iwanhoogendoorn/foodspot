/**
 * Food Spot — Dashboard tab.
 *
 * Stat cards (rings or rectangles per settings.dashboardCardStyle), unified
 * count strip, "More statistics" accordion, suggestion cards ("Where do we
 * eat tonight?" with in-place shuffle, "Longest on the list", "Back for
 * more"), and Recently visited / Recently added compact card rows.
 */
import { setIcon } from "obsidian";
import type { FoodSpot, FoodSpotPluginApi, TabHandle } from "../../types";
import { buildSpotCard, releaseLazyPhotos } from "../components/card";
import { openDetailModal } from "../modals/detail";
import { openAddChooser } from "../modals/addChooser";
import { openImportModal } from "../modals/importFlow";

const DAY_MS = 86_400_000;
const RING_R = 45;
const RING_C = 2 * Math.PI * RING_R;

/**
 * Neutral dashboard palette (v1.1): the primary Visited card renders in the
 * accent color, secondary cards in muted/faint text tones. Actual colors live
 * in 50-dashboard.css under the fs-tone-* classes — no inline colors here.
 */
type StatTone = "accent" | "muted" | "faint";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function daysSince(iso: string | undefined): number {
  if (!iso) return Infinity;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? Infinity : (Date.now() - t) / DAY_MS;
}

function agoText(iso: string | undefined): string {
  const d = daysSince(iso);
  if (!Number.isFinite(d)) return "never";
  if (d < 1) return "today";
  if (d < 2) return "yesterday";
  if (d < 30) return `${Math.floor(d)} days ago`;
  if (d < 365) return `${Math.floor(d / 30)} mo ago`;
  const y = Math.floor(d / 365);
  return `${y} ${y === 1 ? "year" : "years"} ago`;
}

interface CoverageEntry {
  label: string;
  visited: number;
  total: number;
}

function coverageBy(
  spots: FoodSpot[],
  keys: (s: FoodSpot) => (string | undefined)[],
): CoverageEntry[] {
  const m = new Map<string, { visited: number; total: number }>();
  for (const s of spots) {
    for (const k of keys(s)) {
      const key = (k ?? "").trim();
      if (!key) continue;
      const cur = m.get(key) ?? { visited: 0, total: 0 };
      cur.total++;
      if (s.status === "visited") cur.visited++;
      m.set(key, cur);
    }
  }
  return [...m.entries()]
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

export function mountDashboardTab(
  container: HTMLElement,
  plugin: FoodSpotPluginApi,
): TabHandle {
  const root = container.createDiv({ cls: "fs-dashboard" });

  // UI state preserved across refresh() re-renders.
  let statsOpen = false;
  let suggestionCity = "";
  /** Current "Where do we eat tonight?" pick — survives data-changed repaints. */
  let suggestionPath: string | undefined;

  // -------------------------------------------------------------------------
  // building blocks
  // -------------------------------------------------------------------------

  // Unique gradient ids per mount (SVG gradients are referenced by id).
  let gradSeq = 0;

  const ringCard = (
    parent: HTMLElement,
    o: { frac: number; value: string; label: string; sub: string; tone: StatTone },
  ): void => {
    const card = parent.createDiv({ cls: "fs-stat-card" });
    const wrap = card.createDiv({ cls: "fs-ring-wrap" });
    const svg = wrap.createSvg("svg", {
      cls: "fs-ring",
      attr: { viewBox: "0 0 120 120", width: 120, height: 120 },
    });
    // Gradient stroke: full accent for the primary tone, lighter accent mixes
    // for the secondary tones — one hue, three strengths, never flat grey.
    const gradId = `fs-ring-grad-${Date.now() % 100000}-${gradSeq++}`;
    const mixes: Record<StatTone, [string, string]> = {
      accent: ["var(--interactive-accent)", "var(--interactive-accent-hover, var(--interactive-accent))"],
      muted: [
        "color-mix(in srgb, var(--interactive-accent) 70%, var(--background-primary))",
        "color-mix(in srgb, var(--interactive-accent) 40%, var(--background-primary))",
      ],
      faint: [
        "color-mix(in srgb, var(--interactive-accent) 45%, var(--background-primary))",
        "color-mix(in srgb, var(--interactive-accent) 20%, var(--background-primary))",
      ],
    };
    const defs = svg.createSvg("defs");
    const grad = defs.createSvg("linearGradient", {
      attr: { id: gradId, x1: "0", y1: "0", x2: "1", y2: "1" },
    });
    const [from, to] = mixes[o.tone];
    const s1 = grad.createSvg("stop", { attr: { offset: "0%" } });
    s1.style.setProperty("stop-color", from);
    const s2 = grad.createSvg("stop", { attr: { offset: "100%" } });
    s2.style.setProperty("stop-color", to);

    svg.createSvg("circle", {
      cls: "fs-ring-track",
      attr: { cx: 60, cy: 60, r: RING_R },
    });
    const prog = svg.createSvg("circle", {
      // Array form: createSvg's classList.add rejects space-separated strings.
      cls: ["fs-ring-progress", `fs-tone-${o.tone}`],
      attr: {
        cx: 60,
        cy: 60,
        r: RING_R,
        transform: "rotate(-90 60 60)",
        stroke: `url(#${gradId})`,
        "stroke-dasharray": RING_C.toFixed(2),
        "stroke-dashoffset": RING_C.toFixed(2),
      },
    });
    const center = wrap.createDiv({ cls: "fs-ring-center" });
    center.createDiv({ cls: "fs-ring-value", text: o.value });
    center.createDiv({ cls: "fs-ring-label", text: o.label });
    card.createDiv({ cls: "fs-stat-sub", text: o.sub });
    // Two frames so the initial dashoffset is committed before the transition.
    const target = (RING_C * (1 - clamp01(o.frac))).toFixed(2);
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => prog.setAttribute("stroke-dashoffset", target)),
    );
  };

  /**
   * Two-segment donut: visited arc in full accent, want-to-try remainder in a
   * light accent tone on the same ring — one card for one fact.
   */
  const progressRing = (
    parent: HTMLElement,
    o: { visited: number; wantToTry: number; total: number },
  ): void => {
    const card = parent.createDiv({ cls: "fs-stat-card" });
    const wrap = card.createDiv({ cls: "fs-ring-wrap" });
    const svg = wrap.createSvg("svg", {
      cls: "fs-ring",
      attr: { viewBox: "0 0 120 120", width: 120, height: 120 },
    });
    const gradId = `fs-ring-grad-${Date.now() % 100000}-${gradSeq++}`;
    const defs = svg.createSvg("defs");
    const grad = defs.createSvg("linearGradient", {
      attr: { id: gradId, x1: "0", y1: "0", x2: "1", y2: "1" },
    });
    const g1 = grad.createSvg("stop", { attr: { offset: "0%" } });
    g1.style.setProperty("stop-color", "var(--interactive-accent)");
    const g2 = grad.createSvg("stop", { attr: { offset: "100%" } });
    g2.style.setProperty(
      "stop-color",
      "var(--interactive-accent-hover, var(--interactive-accent))",
    );

    // Remainder segment (want to try): the full ring in a light accent tone.
    const rest = svg.createSvg("circle", {
      // Array form: createSvg's classList.add rejects space-separated strings.
      cls: ["fs-ring-track", "fs-ring-rest"],
      attr: { cx: 60, cy: 60, r: RING_R },
    });
    rest.style.setProperty(
      "stroke",
      "color-mix(in srgb, var(--interactive-accent) 26%, var(--background-modifier-border))",
    );
    // Visited segment on top, animated.
    const frac = clamp01(o.visited / Math.max(1, o.total));
    const prog = svg.createSvg("circle", {
      cls: ["fs-ring-progress", "fs-tone-accent"],
      attr: {
        cx: 60,
        cy: 60,
        r: RING_R,
        transform: "rotate(-90 60 60)",
        stroke: `url(#${gradId})`,
        "stroke-dasharray": RING_C.toFixed(2),
        "stroke-dashoffset": RING_C.toFixed(2),
      },
    });
    const center = wrap.createDiv({ cls: "fs-ring-center" });
    center.createDiv({
      cls: "fs-ring-value",
      text: `${o.visited} / ${o.total}`,
    });
    center.createDiv({ cls: "fs-ring-label", text: "Visited" });
    const sub = card.createDiv({ cls: "fs-stat-sub fs-progress-legend" });
    const leg = (cls: string, text: string) => {
      const item = sub.createSpan({ cls: "fs-legend-item" });
      item.createSpan({ cls: `fs-legend-dot ${cls}` });
      item.createSpan({ text });
    };
    leg("fs-legend-visited", `${o.visited} visited`);
    leg("fs-legend-rest", `${o.wantToTry} want to try`);
    const target = (RING_C * (1 - frac)).toFixed(2);
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => prog.setAttribute("stroke-dashoffset", target)),
    );
  };

  const rectCard = (
    parent: HTMLElement,
    o: { value: string; label: string; sub: string; tone: StatTone },
  ): void => {
    const card = parent.createDiv({ cls: "fs-stat-card fs-stat-rect" });
    card.createDiv({ cls: `fs-rect-value fs-tone-${o.tone}`, text: o.value });
    card.createDiv({ cls: "fs-ring-label", text: o.label });
    card.createDiv({ cls: "fs-stat-sub", text: o.sub });
  };

  const emptyLine = (parent: HTMLElement, text: string): void => {
    parent.createDiv({ cls: "fs-empty", text });
  };

  const cardSlot = (parent: HTMLElement, spot: FoodSpot): void => {
    buildSpotCard(parent, spot, { plugin, compact: true });
  };

  const barRow = (
    parent: HTMLElement,
    label: string,
    valueText: string,
    frac: number,
    onClick?: () => void,
  ): void => {
    const row = parent.createDiv({ cls: "fs-stat-row" + (onClick ? " is-clickable" : "") });
    row.createSpan({ cls: "fs-stat-row-label", text: label });
    row.createSpan({ cls: "fs-stat-row-value", text: valueText });
    if (onClick) row.onclick = onClick;
    const bar = parent.createDiv({ cls: "fs-cov-bar" });
    const fill = bar.createDiv({ cls: "fs-cov-fill" });
    fill.style.width = `${Math.round(clamp01(frac) * 100)}%`;
  };

  const listRow = (
    parent: HTMLElement,
    label: string,
    valueText: string,
    onClick?: () => void,
  ): void => {
    const row = parent.createDiv({ cls: "fs-stat-row" + (onClick ? " is-clickable" : "") });
    row.createSpan({ cls: "fs-stat-row-label", text: label });
    row.createSpan({ cls: "fs-stat-row-value", text: valueText });
    if (onClick) row.onclick = onClick;
  };

  // -------------------------------------------------------------------------
  // sections
  // -------------------------------------------------------------------------

  const renderHero = (): void => {
    const hero = root.createDiv({ cls: "fs-hero" });
    const icon = hero.createDiv({ cls: "fs-hero-icon" });
    setIcon(icon, "utensils");
    hero.createEl("h2", { text: "No food spots yet" });
    hero.createEl("p", {
      text: "Track restaurants you want to try, log visits with ratings, and never wonder where to eat again.",
    });
    const btns = hero.createDiv({ cls: "fs-hero-buttons" });
    const add = btns.createEl("button", { cls: "mod-cta", text: "Add your first spot" });
    add.onclick = () => openAddChooser(plugin);
    const imp = btns.createEl("button", { text: "Import from a URL" });
    imp.onclick = () => openImportModal(plugin);
  };

  const renderStatCards = (spots: FoodSpot[]): void => {
    const total = spots.length;
    const visited = spots.filter((s) => s.status === "visited").length;
    const wantToTry = total - visited;
    const favorites = spots.filter((s) => s.favorite).length;
    const pct = (n: number) => `${Math.round((n / Math.max(1, total)) * 100)}%`;

    const cards = root.createDiv({ cls: "fs-stat-cards" });
    if (plugin.settings.dashboardCardStyle === "rings") {
      // Visited + want-to-try are one fact: a two-segment progress donut.
      progressRing(cards, { visited, wantToTry, total });
      ringCard(cards, {
        frac: favorites / total,
        value: String(favorites),
        label: "Favorites",
        sub: favorites ? `${pct(favorites)} of your list` : "None marked yet",
        tone: "faint",
      });
    } else {
      rectCard(cards, {
        value: `${visited} / ${total}`,
        label: "Visited",
        sub: `${wantToTry} still on the list`,
        tone: "accent",
      });
      rectCard(cards, {
        value: String(favorites),
        label: "Favorites",
        sub: favorites ? `${pct(favorites)} of your list` : "None marked yet",
        tone: "faint",
      });
    }

    // Icon stat chips (replaces the old flat segmented strip).
    const countries = new Set(spots.map((s) => s.country.trim()).filter(Boolean)).size;
    const cities = new Set(spots.map((s) => (s.city ?? "").trim()).filter(Boolean)).size;
    const cuisines = new Set(
      spots.flatMap((s) => s.cuisines.map((c) => c.trim())).filter(Boolean),
    ).size;
    const visitsLogged = spots.reduce((n, s) => n + s.visitCount, 0);
    const chips = root.createDiv({ cls: "fs-chipstats" });
    const chip = (icon: string, value: number, label: string) => {
      const el = chips.createDiv({ cls: "fs-chipstat" });
      const box = el.createDiv({ cls: "fs-chipstat-icon" });
      setIcon(box, icon);
      const txt = el.createDiv({ cls: "fs-chipstat-text" });
      txt.createDiv({ cls: "fs-chipstat-value", text: String(value) });
      txt.createDiv({ cls: "fs-chipstat-label", text: label });
    };
    chip("utensils", total, "spots");
    chip("globe", countries, countries === 1 ? "country" : "countries");
    chip("building-2", cities, cities === 1 ? "city" : "cities");
    chip("chef-hat", cuisines, cuisines === 1 ? "cuisine" : "cuisines");
    chip("calendar-check", visitsLogged, "visits logged");
  };

  const buildStats = (el: HTMLElement, spots: FoodSpot[]): void => {
    const grid = el.createDiv({ cls: "fs-stats-grid" });
    const panel = (title: string): HTMLElement => {
      const p = grid.createDiv({ cls: "fs-stats-panel" });
      p.createDiv({ cls: "fs-stats-panel-title", text: title });
      return p;
    };
    const coveragePanel = (title: string, entries: CoverageEntry[], empty: string) => {
      const p = panel(title);
      if (!entries.length) {
        emptyLine(p, empty);
        return;
      }
      for (const e of entries.slice(0, 10)) {
        barRow(p, e.label, `${e.visited}/${e.total}`, e.total ? e.visited / e.total : 0);
      }
    };

    coveragePanel(
      "By country",
      coverageBy(spots, (s) => [s.country]),
      "No countries yet — spots without a country don't show here.",
    );
    coveragePanel(
      "By city",
      coverageBy(spots, (s) => [s.city]),
      "No cities recorded yet — add a city to your spots to see this.",
    );
    coveragePanel(
      "By cuisine",
      coverageBy(spots, (s) => s.cuisines),
      "No cuisines recorded yet — tag your spots with a cuisine to see this.",
    );

    // By price tier.
    {
      const p = panel("By price");
      const rows: { label: string; count: number }[] = [];
      const symbol = plugin.settings.currencySymbol || "€";
      for (let t = 1; t <= 4; t++) {
        rows.push({
          label: symbol.repeat(t),
          count: spots.filter((s) => s.price === t).length,
        });
      }
      rows.push({
        label: "No price",
        count: spots.filter((s) => s.price === undefined).length,
      });
      const max = Math.max(1, ...rows.map((r) => r.count));
      if (rows.every((r) => r.count === 0 || r.label === "No price")) {
        emptyLine(p, "No price tiers set yet — set a € tier on a spot to see this.");
      } else {
        for (const r of rows) barRow(p, r.label, String(r.count), r.count / max);
      }
    }

    // My-rating distribution: one bar per half-star bucket.
    {
      const p = panel("My ratings");
      const rated = spots.filter((s) => s.rating !== undefined);
      if (!rated.length) {
        emptyLine(p, "No personal ratings yet — rate a spot or log a rated visit.");
      } else {
        const counts = new Map<number, number>();
        for (const s of rated) {
          const bucket = Math.max(0.5, Math.min(5, Math.round((s.rating ?? 0) * 2) / 2));
          counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
        }
        const max = Math.max(1, ...counts.values());
        const dist = p.createDiv({ cls: "fs-dist" });
        for (let i = 1; i <= 10; i++) {
          const v = i / 2;
          const count = counts.get(v) ?? 0;
          const col = dist.createDiv({ cls: "fs-dist-col" });
          col.setAttr("aria-label", `${v}★ — ${count} ${count === 1 ? "spot" : "spots"}`);
          const bar = col.createDiv({ cls: "fs-dist-bar" });
          bar.style.height = `${Math.max(2, Math.round((count / max) * 100))}%`;
          if (!count) bar.style.opacity = "0.25";
          col.createDiv({ cls: "fs-dist-label", text: Number.isInteger(v) ? String(v) : "" });
        }
      }
    }

    // Visits per month (last 12).
    {
      const p = panel("Visits per month");
      const totalVisits = spots.reduce((n, s) => n + s.visitCount, 0);
      if (!totalVisits) {
        emptyLine(p, "No visits logged yet — log a visit to build this timeline.");
      } else {
        const now = new Date();
        const rows: { key: string; label: string; count: number }[] = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          rows.push({
            key,
            label: d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
            count: 0,
          });
        }
        for (const s of spots) {
          for (const v of s.visits) {
            const row = rows.find((r) => v.date.startsWith(r.key));
            if (row) row.count++;
          }
        }
        const max = Math.max(1, ...rows.map((r) => r.count));
        for (const r of rows) barRow(p, r.label, String(r.count), r.count / max);
      }
    }

    // Visits per year.
    {
      const p = panel("Visits per year");
      const byYear = new Map<string, number>();
      for (const s of spots) {
        for (const v of s.visits) {
          const y = v.date.slice(0, 4);
          if (/^\d{4}$/.test(y)) byYear.set(y, (byYear.get(y) ?? 0) + 1);
        }
      }
      if (!byYear.size) {
        emptyLine(p, "No visits logged yet.");
      } else {
        const years = [...byYear.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        const max = Math.max(1, ...years.map(([, n]) => n));
        for (const [y, n] of years) barRow(p, y, String(n), n / max);
      }
    }

    // Top-rated (min 1 visit).
    {
      const p = panel("Top rated");
      const rated = spots
        .filter((s) => s.rating !== undefined && s.visitCount >= 1)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.visitCount - a.visitCount)
        .slice(0, 5);
      if (!rated.length) {
        emptyLine(p, "No rated spots with a logged visit yet.");
      } else {
        for (const s of rated) {
          listRow(p, s.name, `★ ${s.rating}`, () => openDetailModal(plugin, s.path));
        }
      }
    }

    // Most-visited.
    {
      const p = panel("Most visited");
      const top = spots
        .filter((s) => s.visitCount > 0)
        .sort((a, b) => b.visitCount - a.visitCount)
        .slice(0, 5);
      if (!top.length) {
        emptyLine(p, "No visits logged yet — your regulars will show up here.");
      } else {
        for (const s of top) {
          listRow(
            p,
            s.name,
            `${s.visitCount} ${s.visitCount === 1 ? "visit" : "visits"}`,
            () => openDetailModal(plugin, s.path),
          );
        }
      }
    }
  };

  const renderMoreStats = (spots: FoodSpot[]): void => {
    const acc = root.createDiv({ cls: "fs-stats-acc" });
    const header = acc.createDiv({ cls: "fs-stats-toggle" });
    const chev = header.createDiv({ cls: "fs-stats-chevron" });
    setIcon(chev, "chevron-right");
    header.createSpan({ text: "More statistics" });
    const content = acc.createDiv({ cls: "fs-stats-content" });
    const paint = () => {
      acc.toggleClass("is-open", statsOpen);
      content.empty();
      if (statsOpen) buildStats(content, spots);
    };
    header.onclick = () => {
      statsOpen = !statsOpen;
      paint();
    };
    paint();
  };

  const renderSuggestions = (spots: FoodSpot[]): void => {
    root.createDiv({ cls: "fs-dash-section-title", text: "Suggestions" });
    const sug = root.createDiv({ cls: "fs-suggestions" });

    // --- Where do we eat tonight? (random want-to-try, in-place shuffle) ---
    {
      const card = sug.createDiv({ cls: "fs-sug-card" });
      const head = card.createDiv({ cls: "fs-sug-head" });
      head.createSpan({ cls: "fs-sug-title", text: "Where do we eat tonight?" });
      const controls = head.createDiv({ cls: "fs-sug-controls" });

      // EVERY city in the library, not just ones with want-to-try spots — a
      // city where you've been everywhere still deserves a suggestion (it
        // falls back to a revisit below).
      const cities = [
        ...new Set(spots.map((s) => (s.city ?? "").trim()).filter(Boolean)),
      ].sort((a, b) => a.localeCompare(b));
      if (suggestionCity && !cities.includes(suggestionCity)) suggestionCity = "";

      const citySel = controls.createEl("select", { cls: "dropdown fs-sug-city" });
      citySel.createEl("option", { text: "All cities", value: "" });
      for (const c of cities) {
        const opt = citySel.createEl("option", { text: c, value: c });
        if (c === suggestionCity) opt.selected = true;
      }

      const shuffleBtn = controls.createEl("button", {
        cls: "fs-sug-shuffle",
        attr: { "aria-label": "Shuffle suggestion" },
      });
      setIcon(shuffleBtn, "shuffle");

      const slot = card.createDiv({ cls: "fs-sug-slot" });
      const note = card.createDiv({ cls: "fs-sug-sub" });
      const inCity = (s: FoodSpot) =>
        !suggestionCity || (s.city ?? "").trim() === suggestionCity;
      /**
       * Want-to-try first; when a city is fully explored, fall back to
       * revisiting what's there (best-rated first) instead of a dead end.
       */
      const pool = (): { list: FoodSpot[]; revisit: boolean } => {
        const wtt = spots.filter((s) => s.status === "want-to-try" && inCity(s));
        if (wtt.length > 0) return { list: wtt, revisit: false };
        const visited = spots
          .filter((s) => s.status === "visited" && inCity(s))
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        return { list: visited, revisit: true };
      };
      // Re-rolls replace ONLY the card slot — the section is never re-rendered.
      // `suggestionPath` lives at tab level so a data-changed repaint keeps the
      // current pick instead of silently swapping the spot the user is viewing
      // (same pattern as the random widget's entry.state.randomPath).
      const roll = (forceNew: boolean) => {
        slot.empty();
        const { list: p, revisit } = pool();
        note.setText("");
        if (!p.length) {
          suggestionPath = undefined;
          emptyLine(
            slot,
            suggestionCity
              ? `No spots in ${suggestionCity} yet — add one to get a suggestion.`
              : "Your list is empty — add a spot to get a suggestion.",
          );
          return;
        }
        let pick = forceNew ? undefined : p.find((s) => s.path === suggestionPath);
        if (!pick) {
          pick = p[Math.floor(Math.random() * p.length)];
          if (forceNew && p.length > 1 && pick.path === suggestionPath) {
            pick = p[(p.indexOf(pick) + 1) % p.length];
          }
        }
        suggestionPath = pick.path;
        cardSlot(slot, pick);
        if (revisit) {
          note.setText(
            suggestionCity
              ? `You've been everywhere on your list in ${suggestionCity} — worth a return?`
              : "Everything on your list is visited — worth a return?",
          );
        }
      };
      citySel.onchange = () => {
        suggestionCity = citySel.value;
        roll(false);
      };
      shuffleBtn.onclick = () => roll(true);
      roll(false);
    }

    // --- Longest on the list ---
    {
      const card = sug.createDiv({ cls: "fs-sug-card" });
      const head = card.createDiv({ cls: "fs-sug-head" });
      head.createSpan({ cls: "fs-sug-title", text: "Longest on the list" });
      const slot = card.createDiv({ cls: "fs-sug-slot" });
      const oldest = spots
        .filter((s) => s.status === "want-to-try")
        .sort((a, b) => a.created.localeCompare(b.created))[0];
      if (!oldest) {
        emptyLine(slot, "Nothing is waiting on your want-to-try list right now.");
      } else {
        card.createDiv({ cls: "fs-sug-sub", text: `On the list since ${agoText(oldest.created)}` });
        cardSlot(slot, oldest);
      }
    }

    // --- Back for more ---
    {
      const card = sug.createDiv({ cls: "fs-sug-card" });
      const head = card.createDiv({ cls: "fs-sug-head" });
      head.createSpan({ cls: "fs-sug-title", text: "Back for more?" });
      const slot = card.createDiv({ cls: "fs-sug-slot" });
      const candidate = spots
        .filter(
          (s) => s.status === "visited" && (s.rating ?? 0) >= 4 && daysSince(s.lastVisit) > 90,
        )
        .sort((a, b) => daysSince(b.lastVisit) - daysSince(a.lastVisit))[0];
      if (!candidate) {
        emptyLine(
          slot,
          "No 4★+ spots you haven't been back to in over 90 days — you're keeping up.",
        );
      } else {
        card.createDiv({
          cls: "fs-sug-sub",
          text: `Last visit ${agoText(candidate.lastVisit)}`,
        });
        cardSlot(slot, candidate);
      }
    }
  };

  const renderRecentRow = (
    title: string,
    list: FoodSpot[],
    empty: string,
  ): void => {
    const sec = root.createDiv({ cls: "fs-dash-section" });
    sec.createDiv({ cls: "fs-dash-section-title", text: title });
    if (!list.length) {
      emptyLine(sec, empty);
      return;
    }
    // NOT "fs-card-row": that class is the compact card-row component in
    // 20-cards.css — reusing it here made the whole strip inherit row
    // hover/cursor styling.
    const row = sec.createDiv({ cls: "fs-recent-row" });
    for (const s of list) {
      const cell = row.createDiv({ cls: "fs-row-card" });
      buildSpotCard(cell, s, { plugin, mini: true });
    }
  };

  // -------------------------------------------------------------------------
  // render
  // -------------------------------------------------------------------------

  /** A failed section renders an error panel instead of blanking the tab. */
  const section = (label: string, fn: () => void): void => {
    try {
      fn();
    } catch (e) {
      const panel = root.createDiv({ cls: "fs-error-panel" });
      panel.createDiv({ cls: "fs-error-panel-title", text: `${label} failed to render` });
      panel.createDiv({
        cls: "fs-error-panel-msg",
        text: e instanceof Error ? `${e.message}` : String(e),
      });
      console.error(`Food Spot: dashboard section "${label}" failed`, e);
    }
  };

  const render = (): void => {
    releaseLazyPhotos(root); // pending lazy photos must leave the shared observer
    root.empty();
    const spots = plugin.store.getSpots();
    if (!spots.length) {
      renderHero();
      return;
    }
    section("Stats", () => renderStatCards(spots));
    section("More statistics", () => renderMoreStats(spots));
    section("Suggestions", () => renderSuggestions(spots));
    section("Recently visited", () =>
      renderRecentRow(
        "Recently visited",
        spots
          .filter((s) => s.lastVisit)
          .sort((a, b) => (b.lastVisit ?? "").localeCompare(a.lastVisit ?? ""))
          .slice(0, 8),
        "No visits logged yet — open a spot and log your first visit.",
      ),
    );
    section("Recently added", () =>
      renderRecentRow(
        "Recently added",
        [...spots].sort((a, b) => b.created.localeCompare(a.created)).slice(0, 8),
        "Nothing added yet — your newest finds will show up here.",
      ),
    );
  };

  render();

  return {
    refresh: render,
    destroy: () => root.remove(),
  };
}
