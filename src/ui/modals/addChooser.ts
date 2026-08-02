/**
 * Food Spot — "Add a spot" chooser (WatchLog add-chooser pattern).
 *
 * Five entry points: Search online (Google Places — disabled with a hint when
 * no API key is configured), Discover restaurants (jumps to the Discover
 * tab, same key requirement), Paste a list (bulk import — works without a key
 * too, it just skips the lookup), From URL, and Manual.
 */
import { Modal, setIcon } from "obsidian";
import type { FoodSpotPluginApi } from "../../types";
import { openAddModal } from "./addEdit";
import { openImportModal } from "./importFlow";
import { openListImportModal } from "./listImport";

export function openAddChooser(plugin: FoodSpotPluginApi): void {
  new AddChooserModal(plugin).open();
}

class AddChooserModal extends Modal {
  constructor(private readonly plugin: FoodSpotPluginApi) {
    super(plugin.app);
  }

  override onOpen(): void {
    this.modalEl.addClass("fs-modal", "fs-chooser-modal");
    this.titleEl.setText("Add a food spot");
    const list = this.contentEl.createDiv({ cls: "fs-chooser-list" });

    const hasKey = this.plugin.importer.hasGoogleKey();
    this.option(list, {
      icon: "search",
      title: "Search online",
      desc: hasKey
        ? "Find the restaurant on Google Places and prefill everything."
        : "Add a Google Places API key in settings to enable online search.",
      disabled: !hasKey,
      onPick: () => openAddModal(this.plugin, undefined, { focusSearch: true }),
    });
    this.option(list, {
      icon: "compass",
      title: "Discover restaurants",
      desc: hasKey
        ? "Browse restaurants near a city or area that aren't in your library yet."
        : "Add a Google Places API key in settings to enable discovery.",
      disabled: !hasKey,
      onPick: () => void this.plugin.activateView("discover"),
    });
    this.option(list, {
      icon: "clipboard-list",
      title: "Paste a list",
      desc: hasKey
        ? "Paste restaurant names from a chat and look them all up at once."
        : "Paste restaurant names from a chat and add them as want-to-try spots.",
      onPick: () => openListImportModal(this.plugin),
    });
    this.option(list, {
      icon: "link",
      title: "From URL",
      desc: "Paste a Google Maps, TripAdvisor, or restaurant website link.",
      onPick: () => openImportModal(this.plugin),
    });
    this.option(list, {
      icon: "pencil",
      title: "Manual",
      desc: "Type the details yourself.",
      onPick: () => openAddModal(this.plugin),
    });
  }

  private option(
    parent: HTMLElement,
    opts: {
      icon: string;
      title: string;
      desc: string;
      disabled?: boolean;
      onPick: () => void;
    }
  ): void {
    const btn = parent.createEl("button", { cls: "fs-chooser-option" });
    btn.type = "button";
    if (opts.disabled) {
      btn.addClass("fs-disabled");
      btn.disabled = true;
    }
    const icon = btn.createSpan({ cls: "fs-chooser-icon" });
    setIcon(icon, opts.icon);
    const text = btn.createDiv({ cls: "fs-chooser-text" });
    text.createDiv({ cls: "fs-chooser-title", text: opts.title });
    text.createDiv({ cls: "fs-chooser-desc", text: opts.desc });
    if (!opts.disabled) {
      btn.addEventListener("click", () => {
        this.close();
        opts.onPick();
      });
    }
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}
