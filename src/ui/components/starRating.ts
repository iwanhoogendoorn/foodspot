/**
 * Food Spot — 5-star rating widget (WatchLog `Ge` pattern).
 *
 * - Half-stars by mouse half when `halfSteps` is on.
 * - Hover preview repaint; mouseleave restores the committed value.
 * - Clicking the current value clears it (onChange receives 0).
 * - Tier color exposed as `--fs-rating-color` (tier = ceil(value), from the
 *   user-configurable `ratingTiers` palette); optional tier label.
 * - `readOnly` renders a static display (no listeners, no pointer cursor).
 */
import { setIcon } from "obsidian";
import type { RatingTier } from "../../types";

export interface StarRatingOptions {
  value?: number;
  halfSteps: boolean;
  tiers: RatingTier[];
  readOnly?: boolean;
  showLabel?: boolean;
  onChange?: (v: number) => void;
}

export interface StarRatingHandle {
  set(v?: number): void;
}

const STAR_COUNT = 5;

export function starRating(parent: HTMLElement, opts: StarRatingOptions): StarRatingHandle {
  const root = parent.createDiv({ cls: "fs-star-rating" });
  if (opts.readOnly) root.addClass("fs-readonly");
  root.setAttribute("role", opts.readOnly ? "img" : "slider");

  const starsEl = root.createDiv({ cls: "fs-stars" });
  const starEls: HTMLElement[] = [];
  const fillEls: HTMLElement[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const star = starsEl.createDiv({ cls: "fs-star" });
    const bg = star.createDiv({ cls: "fs-star-bg" });
    setIcon(bg, "star");
    const fill = star.createDiv({ cls: "fs-star-fill" });
    setIcon(fill, "star");
    starEls.push(star);
    fillEls.push(fill);
  }
  const labelEl = opts.showLabel ? root.createSpan({ cls: "fs-star-tier-label" }) : null;

  let value = clampValue(opts.value);

  const tierFor = (v: number): RatingTier | undefined => {
    if (v <= 0 || opts.tiers.length === 0) return undefined;
    const idx = Math.min(opts.tiers.length - 1, Math.max(0, Math.ceil(v) - 1));
    return opts.tiers[idx];
  };

  const paint = (v: number, preview = false): void => {
    const tier = tierFor(v);
    root.style.setProperty("--fs-rating-color", tier ? tier.color : "var(--text-faint)");
    root.toggleClass("fs-previewing", preview);
    for (let i = 0; i < STAR_COUNT; i++) {
      const pct = Math.max(0, Math.min(1, v - i)) * 100;
      const fill = fillEls[i];
      if (fill) fill.style.width = `${pct}%`;
    }
    if (labelEl) labelEl.setText(tier ? tier.label : "");
    root.setAttribute("aria-label", v > 0 ? `${v} out of 5 stars` : "Not rated");
    if (!opts.readOnly) root.setAttribute("aria-valuenow", String(v));
  };

  paint(value);

  if (!opts.readOnly) {
    root.setAttribute("aria-valuemin", "0");
    root.setAttribute("aria-valuemax", "5");
    root.setAttribute("tabindex", "0");

    const valueAt = (starIndex: number, ev: MouseEvent): number => {
      const star = starEls[starIndex];
      if (!star) return starIndex + 1;
      if (!opts.halfSteps) return starIndex + 1;
      const rect = star.getBoundingClientRect();
      const half = ev.clientX - rect.left < rect.width / 2;
      return half ? starIndex + 0.5 : starIndex + 1;
    };

    starEls.forEach((star, i) => {
      star.addEventListener("mousemove", (ev) => paint(valueAt(i, ev), true));
      star.addEventListener("click", (ev) => {
        const v = valueAt(i, ev);
        // Clicking the current value clears the rating.
        value = Math.abs(v - value) < 0.001 ? 0 : v;
        paint(value);
        opts.onChange?.(value);
      });
    });
    starsEl.addEventListener("mouseleave", () => paint(value));

    // Keyboard: arrows adjust, Backspace/Delete clears.
    root.addEventListener("keydown", (ev) => {
      const step = opts.halfSteps ? 0.5 : 1;
      let next: number | null = null;
      if (ev.key === "ArrowRight" || ev.key === "ArrowUp") next = Math.min(5, value + step);
      else if (ev.key === "ArrowLeft" || ev.key === "ArrowDown") next = Math.max(0, value - step);
      else if (ev.key === "Backspace" || ev.key === "Delete") next = 0;
      if (next === null || next === value) return;
      ev.preventDefault();
      value = next;
      paint(value);
      opts.onChange?.(value);
    });
  }

  return {
    set(v?: number): void {
      value = clampValue(v);
      paint(value);
    },
  };
}

function clampValue(v: number | undefined): number {
  if (v === undefined || Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(5, v));
}
