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
}

export function confirmModal(app: App, opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    new ConfirmModal(app, opts, resolve).open();
  });
}

class ConfirmModal extends Modal {
  private resolved = false;

  constructor(
    app: App,
    private readonly opts: ConfirmOptions,
    private readonly resolve: (v: boolean) => void
  ) {
    super(app);
  }

  override onOpen(): void {
    this.modalEl.addClass("fs-modal", "fs-confirm-modal");
    this.titleEl.setText(this.opts.title);
    this.contentEl.createEl("p", { cls: "fs-confirm-body", text: this.opts.body });

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
      this.resolve(true);
      this.close();
    });
    cta.focus();
  }

  override onClose(): void {
    this.contentEl.empty();
    if (!this.resolved) {
      this.resolved = true;
      this.resolve(false);
    }
  }
}
