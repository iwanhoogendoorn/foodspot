/**
 * Food Spot — full-screen photo viewer with pinch zoom.
 *
 * Tapping a dish photo used to hand the file to `openLinkText`, which opens it
 * as a document tab: no zoom, and on a phone it buries the modal you came from.
 * This is a self-contained viewer instead — pinch or double-tap to zoom, drag
 * to pan, swipe or arrow between the photos in a set.
 *
 * Gestures are built on pointer events so one code path serves mouse, touch and
 * pen. The stage takes `touch-action: none` (see 63-lightbox.css) because the
 * browser would otherwise claim the pinch for page zoom before we see it.
 */
import { Modal, TFile, setIcon } from "obsidian";
import type { FoodSpotPluginApi } from "../../types";

export interface LightboxItem {
  file: TFile;
  /** Shown under the image: spot name, date, whatever the caller knows. */
  caption?: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;
/** Scale a double-tap jumps to when the image is currently unzoomed. */
const DOUBLE_TAP_SCALE = 2.5;
/** Below this, a pointer up counts as a tap rather than a drag. */
const TAP_SLOP_PX = 8;
const DOUBLE_TAP_MS = 300;
/** Horizontal travel that flips to the next photo when not zoomed in. */
const SWIPE_PX = 60;

interface Point {
  x: number;
  y: number;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

class LightboxModal extends Modal {
  private index: number;
  private stage!: HTMLElement;
  private img!: HTMLImageElement;
  private captionEl!: HTMLElement;
  private counterEl!: HTMLElement;

  private scale = 1;
  private tx = 0;
  private ty = 0;

  /** Live pointers by id — two of them means a pinch is in progress. */
  private pointers = new Map<number, Point>();
  private startDistance = 0;
  private startScale = 1;
  private startMid: Point = { x: 0, y: 0 };
  private startTx = 0;
  private startTy = 0;
  private panFrom: Point | null = null;
  private downAt: Point | null = null;
  private lastTapTime = 0;
  private moved = false;

  constructor(
    private readonly plugin: FoodSpotPluginApi,
    private readonly items: LightboxItem[],
    startIndex: number,
  ) {
    super(plugin.app);
    this.index = Math.min(Math.max(0, startIndex), Math.max(0, items.length - 1));
  }

  override onOpen(): void {
    this.modalEl.addClass("fs-modal", "fs-lightbox-modal");
    // The chrome Obsidian gives a modal (title bar, padding) would eat the
    // screen this viewer exists to use.
    this.titleEl.remove();
    this.contentEl.addClass("fs-lightbox");

    const bar = this.contentEl.createDiv({ cls: "fs-lightbox-bar" });
    this.counterEl = bar.createSpan({ cls: "fs-lightbox-counter" });
    const close = bar.createEl("button", {
      cls: "fs-lightbox-close",
      attr: { "aria-label": "Close" },
    });
    close.type = "button";
    setIcon(close, "x");
    close.addEventListener("click", () => this.close());

    this.stage = this.contentEl.createDiv({ cls: "fs-lightbox-stage" });
    this.img = this.stage.createEl("img", { cls: "fs-lightbox-img" });
    this.img.draggable = false;

    const foot = this.contentEl.createDiv({ cls: "fs-lightbox-foot" });
    this.captionEl = foot.createDiv({ cls: "fs-lightbox-caption" });

    if (this.items.length > 1) {
      const prev = this.navButton(this.stage, "chevron-left", "Previous photo", -1);
      const next = this.navButton(this.stage, "chevron-right", "Next photo", 1);
      prev.addClass("fs-lightbox-prev");
      next.addClass("fs-lightbox-next");
    }

    this.bindGestures();
    this.show();

    this.scope.register([], "ArrowLeft", () => {
      this.step(-1);
      return false;
    });
    this.scope.register([], "ArrowRight", () => {
      this.step(1);
      return false;
    });
  }

  private navButton(parent: HTMLElement, icon: string, label: string, delta: number): HTMLElement {
    const btn = parent.createEl("button", {
      cls: "fs-lightbox-nav",
      attr: { "aria-label": label },
    });
    btn.type = "button";
    setIcon(btn, icon);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.step(delta);
    });
    return btn;
  }

  private show(): void {
    const item = this.items[this.index];
    if (!item) return;
    this.img.src = this.plugin.app.vault.getResourcePath(item.file);
    this.img.alt = item.file.basename;
    this.captionEl.setText(item.caption ?? item.file.basename);
    this.counterEl.setText(
      this.items.length > 1 ? `${this.index + 1} / ${this.items.length}` : "",
    );
    this.reset();
  }

  /** Back to fit-the-screen; every photo starts unzoomed. */
  private reset(): void {
    this.scale = 1;
    this.tx = 0;
    this.ty = 0;
    this.apply();
  }

  private apply(): void {
    this.img.style.transform = `translate(${this.tx}px, ${this.ty}px) scale(${this.scale})`;
    this.stage.toggleClass("is-zoomed", this.scale > 1.01);
  }

  private step(delta: number): void {
    if (this.items.length < 2) return;
    this.index = (this.index + delta + this.items.length) % this.items.length;
    this.show();
  }

  /**
   * Keep the image from being flung off-screen: at 1x it stays centred, and
   * when zoomed it may travel only as far as its own overflow.
   */
  private clamp(): void {
    if (this.scale <= 1.01) {
      this.tx = 0;
      this.ty = 0;
      return;
    }
    const stage = this.stage.getBoundingClientRect();
    const w = this.img.clientWidth * this.scale;
    const h = this.img.clientHeight * this.scale;
    const maxX = Math.max(0, (w - stage.width) / 2);
    const maxY = Math.max(0, (h - stage.height) / 2);
    this.tx = Math.min(maxX, Math.max(-maxX, this.tx));
    this.ty = Math.min(maxY, Math.max(-maxY, this.ty));
  }

  /** Zoom about a screen point, so the pixel under the fingers stays put. */
  private zoomTo(next: number, focus: Point): void {
    const stage = this.stage.getBoundingClientRect();
    const cx = focus.x - stage.left - stage.width / 2;
    const cy = focus.y - stage.top - stage.height / 2;
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    const ratio = clamped / this.scale;
    this.tx = cx - (cx - this.tx) * ratio;
    this.ty = cy - (cy - this.ty) * ratio;
    this.scale = clamped;
    this.clamp();
    this.apply();
  }

  private bindGestures(): void {
    const stage = this.stage;

    stage.addEventListener("pointerdown", (ev) => {
      // Buttons layered on the stage keep their own clicks.
      if ((ev.target as HTMLElement).closest(".fs-lightbox-nav")) return;
      this.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      this.downAt = { x: ev.clientX, y: ev.clientY };
      this.moved = false;
      // Record the pointer first, and never let capture failing take the
      // gesture with it: capture only keeps events coming when a finger
      // strays outside the stage, so losing it degrades the drag rather than
      // breaking it. Throwing here would skip all the bookkeeping below and
      // leave the viewer unresponsive.
      try {
        stage.setPointerCapture(ev.pointerId);
      } catch {
        // no capture available for this pointer; gestures still work in-bounds
      }

      const pts = [...this.pointers.values()];
      if (pts.length === 2 && pts[0] && pts[1]) {
        this.startDistance = distance(pts[0], pts[1]);
        this.startScale = this.scale;
        this.startMid = midpoint(pts[0], pts[1]);
        this.startTx = this.tx;
        this.startTy = this.ty;
        this.panFrom = null;
      } else {
        this.panFrom = { x: ev.clientX, y: ev.clientY };
        this.startTx = this.tx;
        this.startTy = this.ty;
      }
    });

    stage.addEventListener("pointermove", (ev) => {
      if (!this.pointers.has(ev.pointerId)) return;
      this.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      const pts = [...this.pointers.values()];

      if (pts.length >= 2 && pts[0] && pts[1]) {
        // Pinch: scale by how far the fingers spread, and follow their midpoint
        // so the image tracks the gesture instead of the screen centre.
        this.moved = true;
        if (this.startDistance <= 0) return;
        const next = this.startScale * (distance(pts[0], pts[1]) / this.startDistance);
        const mid = midpoint(pts[0], pts[1]);
        this.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
        const ratio = this.scale / this.startScale;
        const stageRect = stage.getBoundingClientRect();
        const cx = this.startMid.x - stageRect.left - stageRect.width / 2;
        const cy = this.startMid.y - stageRect.top - stageRect.height / 2;
        this.tx = cx - (cx - this.startTx) * ratio + (mid.x - this.startMid.x);
        this.ty = cy - (cy - this.startTy) * ratio + (mid.y - this.startMid.y);
        this.clamp();
        this.apply();
        return;
      }

      if (!this.panFrom || !this.downAt) return;
      const dx = ev.clientX - this.panFrom.x;
      const dy = ev.clientY - this.panFrom.y;
      if (Math.hypot(ev.clientX - this.downAt.x, ev.clientY - this.downAt.y) > TAP_SLOP_PX) {
        this.moved = true;
      }
      // Dragging only moves the image once there is something to see off-edge;
      // unzoomed, a horizontal drag is a swipe between photos instead.
      if (this.scale > 1.01) {
        this.tx = this.startTx + dx;
        this.ty = this.startTy + dy;
        this.clamp();
        this.apply();
      }
    });

    const release = (ev: PointerEvent): void => {
      if (!this.pointers.has(ev.pointerId)) return;
      const down = this.downAt;
      this.pointers.delete(ev.pointerId);
      if (stage.hasPointerCapture(ev.pointerId)) stage.releasePointerCapture(ev.pointerId);

      // Still pinching with the other finger — don't interpret anything yet.
      if (this.pointers.size > 0) {
        this.panFrom = null;
        return;
      }

      const dx = down ? ev.clientX - down.x : 0;
      const dy = down ? ev.clientY - down.y : 0;

      if (!this.moved) {
        const now = Date.now();
        if (now - this.lastTapTime < DOUBLE_TAP_MS) {
          this.lastTapTime = 0;
          // Double tap toggles between fit and a useful magnification.
          this.zoomTo(this.scale > 1.01 ? 1 : DOUBLE_TAP_SCALE, {
            x: ev.clientX,
            y: ev.clientY,
          });
        } else {
          this.lastTapTime = now;
        }
      } else if (
        this.scale <= 1.01 &&
        Math.abs(dx) > SWIPE_PX &&
        Math.abs(dx) > Math.abs(dy)
      ) {
        this.step(dx < 0 ? 1 : -1);
      }

      this.panFrom = null;
      this.downAt = null;
      this.moved = false;
    };

    stage.addEventListener("pointerup", release);
    stage.addEventListener("pointercancel", release);

    // Desktop: wheel zooms about the cursor, which is what a mouse expects.
    stage.addEventListener(
      "wheel",
      (ev) => {
        ev.preventDefault();
        const factor = Math.exp(-ev.deltaY / 400);
        this.zoomTo(this.scale * factor, { x: ev.clientX, y: ev.clientY });
      },
      { passive: false },
    );

    // A single tap on the backdrop (not the photo) closes, as phones expect.
    stage.addEventListener("click", (ev) => {
      if (ev.target === stage && this.scale <= 1.01) this.close();
    });
  }

  override onClose(): void {
    this.pointers.clear();
    this.contentEl.empty();
  }
}

/** Open the viewer on `items`, starting at `startIndex`. */
export function openLightbox(
  plugin: FoodSpotPluginApi,
  items: LightboxItem[],
  startIndex = 0,
): void {
  if (items.length === 0) return;
  new LightboxModal(plugin, items, startIndex).open();
}
