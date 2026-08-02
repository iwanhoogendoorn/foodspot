/**
 * Food Spot — windowed rendering primitives.
 *
 * Three renderers share one pattern (WatchLog: ResizeObserver + rAF windowing):
 *  - createVirtualGrid: card grid, column count derived from container width
 *    and the card min-width step map.
 *  - createVirtualList: vertical list with static per-item heights (prefix
 *    sums + binary search) — powers the visits timeline.
 *  - createVirtualTable: sticky header + uniform-height windowed rows.
 *
 * All stay smooth at 1000+ items: only visible rows (+overscan) exist in DOM.
 */
import { Platform } from "obsidian";
import type { FoodSpotSettings } from "../../types";

/** 7-step card size map (WatchLog), indexed by setting -3..3. */
export const CARD_SIZE_STEPS: readonly number[] = [100, 120, 140, 160, 185, 215, 250];

export function cardMinWidth(settings: FoodSpotSettings): number {
  const step = Platform.isMobile ? settings.cardSizeMobile : settings.cardSizeDesktop;
  const idx = Math.max(0, Math.min(CARD_SIZE_STEPS.length - 1, step + 3));
  return CARD_SIZE_STEPS[idx];
}

export interface VirtualHandle<T> {
  readonly el: HTMLElement;
  setItems(items: T[]): void;
  /** Recompute layout + remount visible cells (item data changed in place). */
  refresh(): void;
  destroy(): void;
}

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

export interface VirtualGridOpts<T> {
  /** Read live (settings may change between refreshes). */
  minItemWidth(): number;
  /** Cell height for a computed column width. */
  itemHeight(colWidth: number): number;
  render(item: T, cell: HTMLElement, index: number): void;
  /** Called right before a mounted cell is removed (unhook observers, …). */
  onUnmount?(cell: HTMLElement): void;
  gap?: number;
  overscanRows?: number;
}

export function createVirtualGrid<T>(
  parent: HTMLElement,
  opts: VirtualGridOpts<T>
): VirtualHandle<T> {
  const gap = opts.gap ?? 12;
  const overscan = opts.overscanRows ?? 2;
  const scroller = parent.createDiv({ cls: "fs-vscroll fs-vgrid" });
  const sizer = scroller.createDiv({ cls: "fs-vsizer" });

  let items: T[] = [];
  let cols = 1;
  let colWidth = 0;
  let itemH = 0;
  let rowStride = 0;
  const mounted = new Map<number, HTMLElement>();
  let raf = 0;
  let destroyed = false;

  const layout = (): void => {
    const width = sizer.clientWidth || scroller.clientWidth;
    if (width <= 0) return;
    const minW = Math.max(60, opts.minItemWidth());
    cols = Math.max(1, Math.floor((width + gap) / (minW + gap)));
    colWidth = Math.floor((width - gap * (cols - 1)) / cols);
    itemH = Math.max(1, Math.round(opts.itemHeight(colWidth)));
    rowStride = itemH + gap;
    const rows = Math.ceil(items.length / cols);
    sizer.style.height = `${rows > 0 ? rows * rowStride - gap : 0}px`;
  };

  const unmount = (el: HTMLElement): void => {
    opts.onUnmount?.(el);
    el.remove();
  };

  const clearMounted = (): void => {
    for (const el of mounted.values()) unmount(el);
    mounted.clear();
  };

  const update = (): void => {
    raf = 0;
    if (destroyed) return;
    if (items.length === 0 || rowStride <= 0) {
      clearMounted();
      return;
    }
    const top = scroller.scrollTop;
    const height = scroller.clientHeight || 600;
    const totalRows = Math.ceil(items.length / cols);
    const firstRow = Math.max(0, Math.floor(top / rowStride) - overscan);
    const lastRow = Math.min(totalRows - 1, Math.floor((top + height) / rowStride) + overscan);
    const first = firstRow * cols;
    const last = Math.min(items.length - 1, (lastRow + 1) * cols - 1);
    for (const [i, el] of mounted) {
      if (i < first || i > last) {
        unmount(el);
        mounted.delete(i);
      }
    }
    for (let i = first; i <= last; i++) {
      if (mounted.has(i)) continue;
      const cell = sizer.createDiv({ cls: "fs-vcell" });
      cell.style.width = `${colWidth}px`;
      cell.style.height = `${itemH}px`;
      cell.style.transform = `translate(${(i % cols) * (colWidth + gap)}px, ${
        Math.floor(i / cols) * rowStride
      }px)`;
      opts.render(items[i], cell, i);
      mounted.set(i, cell);
    }
  };

  const schedule = (): void => {
    if (!raf) raf = requestAnimationFrame(update);
  };

  scroller.addEventListener("scroll", schedule, { passive: true });
  const ro = new ResizeObserver(() => {
    if (destroyed) return;
    const prevCols = cols;
    const prevW = colWidth;
    layout();
    if (cols !== prevCols || colWidth !== prevW) clearMounted();
    schedule();
  });
  ro.observe(scroller);
  layout();
  schedule();

  return {
    el: scroller,
    setItems(next: T[]) {
      items = next;
      layout();
      clearMounted();
      schedule();
    },
    refresh() {
      layout();
      clearMounted();
      schedule();
    },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      scroller.removeEventListener("scroll", schedule);
      clearMounted();
      scroller.remove();
    },
  };
}

// ---------------------------------------------------------------------------
// List (static per-item heights)
// ---------------------------------------------------------------------------

export interface VirtualListOpts<T> {
  itemHeight(item: T, index: number): number;
  render(item: T, rowEl: HTMLElement, index: number): void;
  /** Called right before a mounted row is removed (unhook observers, …). */
  onUnmount?(rowEl: HTMLElement): void;
  overscanPx?: number;
}

export function createVirtualList<T>(
  parent: HTMLElement,
  opts: VirtualListOpts<T>
): VirtualHandle<T> {
  const overscan = opts.overscanPx ?? 300;
  const scroller = parent.createDiv({ cls: "fs-vscroll fs-vlist" });
  const sizer = scroller.createDiv({ cls: "fs-vsizer" });

  let items: T[] = [];
  /** offsets[i] = top of item i; offsets[items.length] = total height. */
  let offsets: number[] = [0];
  const mounted = new Map<number, HTMLElement>();
  let raf = 0;
  let destroyed = false;

  const layout = (): void => {
    offsets = new Array<number>(items.length + 1);
    offsets[0] = 0;
    for (let i = 0; i < items.length; i++) {
      offsets[i + 1] = offsets[i] + Math.max(1, opts.itemHeight(items[i], i));
    }
    sizer.style.height = `${offsets[items.length]}px`;
  };

  const unmount = (el: HTMLElement): void => {
    opts.onUnmount?.(el);
    el.remove();
  };

  const clearMounted = (): void => {
    for (const el of mounted.values()) unmount(el);
    mounted.clear();
  };

  /** Largest index i with offsets[i] <= y. */
  const indexAt = (y: number): number => {
    let lo = 0;
    let hi = items.length - 1;
    let ans = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (offsets[mid] <= y) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return ans;
  };

  const update = (): void => {
    raf = 0;
    if (destroyed) return;
    if (items.length === 0) {
      clearMounted();
      return;
    }
    const top = Math.max(0, scroller.scrollTop - overscan);
    const bottom = scroller.scrollTop + (scroller.clientHeight || 600) + overscan;
    const first = indexAt(top);
    const last = indexAt(bottom);
    for (const [i, el] of mounted) {
      if (i < first || i > last) {
        unmount(el);
        mounted.delete(i);
      }
    }
    for (let i = first; i <= last; i++) {
      if (mounted.has(i)) continue;
      const row = sizer.createDiv({ cls: "fs-vrow" });
      row.style.top = `${offsets[i]}px`;
      row.style.height = `${offsets[i + 1] - offsets[i]}px`;
      opts.render(items[i], row, i);
      mounted.set(i, row);
    }
  };

  const schedule = (): void => {
    if (!raf) raf = requestAnimationFrame(update);
  };

  scroller.addEventListener("scroll", schedule, { passive: true });
  const ro = new ResizeObserver(() => {
    if (!destroyed) schedule();
  });
  ro.observe(scroller);
  layout();
  schedule();

  return {
    el: scroller,
    setItems(next: T[]) {
      items = next;
      layout();
      clearMounted();
      schedule();
    },
    refresh() {
      layout();
      clearMounted();
      schedule();
    },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      scroller.removeEventListener("scroll", schedule);
      clearMounted();
      scroller.remove();
    },
  };
}

// ---------------------------------------------------------------------------
// Table (uniform row height + sticky header)
// ---------------------------------------------------------------------------

export interface VirtualTableOpts<T> {
  columns: { label: string; cls?: string }[];
  rowHeight: number;
  renderRow(item: T, rowEl: HTMLElement, index: number): void;
  onRowClick?(item: T, evt: MouseEvent): void;
}

export function createVirtualTable<T>(
  parent: HTMLElement,
  opts: VirtualTableOpts<T>
): VirtualHandle<T> {
  const wrap = parent.createDiv({ cls: "fs-vtable" });
  const header = wrap.createDiv({ cls: "fs-vtable-header" });
  for (const col of opts.columns) {
    header.createDiv({
      cls: ["fs-vtable-cell", col.cls ?? ""].join(" ").trim(),
      text: col.label,
    });
  }
  const list = createVirtualList<T>(wrap, {
    itemHeight: () => opts.rowHeight,
    render: (item, rowEl, index) => {
      rowEl.addClass("fs-vtable-row");
      if (opts.onRowClick) {
        rowEl.addEventListener("click", (e) => opts.onRowClick?.(item, e));
      }
      opts.renderRow(item, rowEl, index);
    },
  });
  return {
    el: wrap,
    setItems: (items) => list.setItems(items),
    refresh: () => list.refresh(),
    destroy: () => {
      list.destroy();
      wrap.remove();
    },
  };
}
