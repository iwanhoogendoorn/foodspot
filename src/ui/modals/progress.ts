/**
 * Generic progress modal: bar + "n / total" + current-item label + Cancel.
 * Closing the modal (Esc/backdrop) flips the shared cancel signal — a bulk
 * operation must never keep running invisibly.
 */
import { Modal } from "obsidian";
import type { App } from "obsidian";

export class ProgressModal extends Modal {
  private fillEl!: HTMLElement;
  private countEl!: HTMLElement;
  private nameEl!: HTMLElement;
  private cancelBtn!: HTMLButtonElement;
  private finished = false;

  constructor(
    app: App,
    private readonly title: string,
    private readonly signal: { cancelled: boolean }
  ) {
    super(app);
  }

  override onOpen(): void {
    this.modalEl.addClass("fs-modal", "fs-enrich-progress-modal");
    this.titleEl.setText(this.title);
    const track = this.contentEl.createDiv({ cls: "fs-progress-track" });
    this.fillEl = track.createDiv({ cls: "fs-progress-fill" });
    const meta = this.contentEl.createDiv({ cls: "fs-enrich-progress-meta" });
    this.countEl = meta.createSpan({ cls: "fs-enrich-count", text: "0 / 0" });
    this.nameEl = meta.createSpan({ cls: "fs-enrich-current" });
    const buttons = this.contentEl.createDiv({ cls: "fs-modal-buttons" });
    this.cancelBtn = buttons.createEl("button", { text: "Cancel" });
    this.cancelBtn.type = "button";
    this.cancelBtn.addEventListener("click", () => {
      this.signal.cancelled = true;
      this.cancelBtn.disabled = true;
      this.cancelBtn.setText("Cancelling…");
    });
  }

  update(done: number, total: number, current: string): void {
    if (!this.fillEl) return;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    this.fillEl.style.width = `${pct}%`;
    this.countEl.setText(`${done} / ${total}`);
    this.nameEl.setText(current);
  }

  /** Close without treating it as a user cancel. */
  finish(): void {
    this.finished = true;
    this.close();
  }

  override onClose(): void {
    if (!this.finished) this.signal.cancelled = true;
    this.contentEl.empty();
  }
}
