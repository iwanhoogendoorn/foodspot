/**
 * Food Spot — shared confirm modal for destructive actions.
 *
 * Every destructive flow goes through here with an explicit consequence
 * sentence in `body`. Resolves `true` only when the CTA is clicked; closing
 * the modal any other way resolves `false`.
 */
import { App, Modal } from "obsidian";

export interface ConfirmOptions {
  title: string;
  body: string;
  cta: string;
  danger?: boolean;
  /** Optional extra opt-in shown above the buttons (e.g. "also delete photo"). */
  checkbox?: { label: string; default?: boolean };
}

export function confirmModal(app: App, opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    new ConfirmModal(app, opts, (r) => resolve(r.confirmed)).open();
  });
}

export interface ConfirmResult {
  confirmed: boolean;
  checked: boolean;
}

/** Same modal, but reports the extra checkbox's state alongside the answer. */
export function confirmModalWithOption(app: App, opts: ConfirmOptions): Promise<ConfirmResult> {
  return new Promise((resolve) => {
    new ConfirmModal(app, opts, resolve).open();
  });
}

class ConfirmModal extends Modal {
  private resolved = false;
  private checked = false;

  constructor(
    app: App,
    private readonly opts: ConfirmOptions,
    private readonly resolve: (v: ConfirmResult) => void
  ) {
    super(app);
  }

  override onOpen(): void {
    this.modalEl.addClass("fs-modal", "fs-confirm-modal");
    this.titleEl.setText(this.opts.title);
    this.contentEl.createEl("p", { cls: "fs-confirm-body", text: this.opts.body });

    if (this.opts.checkbox) {
      this.checked = this.opts.checkbox.default === true;
      const label = this.contentEl.createEl("label", { cls: "fs-checkbox-label" });
      const cb = label.createEl("input", { type: "checkbox" });
      cb.checked = this.checked;
      label.createSpan({ text: ` ${this.opts.checkbox.label}` });
      cb.addEventListener("change", () => {
        this.checked = cb.checked;
      });
    }

    const buttons = this.contentEl.createDiv({ cls: "fs-modal-buttons" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());

    const cta = buttons.createEl("button", {
      text: this.opts.cta,
      cls: this.opts.danger ? "mod-warning" : "mod-cta",
    });
    cta.type = "button";
    cta.addEventListener("click", () => {
      this.resolved = true;
      this.resolve({ confirmed: true, checked: this.checked });
      this.close();
    });
    cta.focus();
  }

  override onClose(): void {
    this.contentEl.empty();
    if (!this.resolved) {
      this.resolved = true;
      this.resolve({ confirmed: false, checked: false });
    }
  }
}
