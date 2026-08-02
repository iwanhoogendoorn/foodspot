/**
 * Food Spot — search syntax tips.
 *
 * `attachSearchTips` decorates a button element with a help-circle icon that
 * opens a modal documenting the query language (WatchLog pattern: colored
 * token spans + a chip list of this tab's searchable fields).
 */
import { App, Modal, setIcon } from "obsidian";
import type { FoodSpotPluginApi } from "../types";

const FIELDS = [
  "name",
  "cuisine",
  "city",
  "country",
  "district",
  "tag",
  "status",
  "dish",
  "rating",
  "google",
  "price",
  "visits",
];

class SearchTipsModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("fs-tips-modal");
    this.titleEl.setText("Search syntax");
    const c = this.contentEl;

    const tok = (parent: HTMLElement, text: string, cls: string): void => {
      parent.createSpan({ cls: `fs-qtok ${cls}`, text });
    };
    const row = (desc: string, build: (t: HTMLElement) => void): void => {
      const r = c.createDiv({ cls: "fs-tips-row" });
      const ex = r.createSpan({ cls: "fs-tips-example" });
      build(ex);
      r.createSpan({ cls: "fs-tips-desc", text: desc });
    };

    row("Fuzzy-matches name, cuisine, city, tags and notes", (p) => {
      tok(p, "momiji sushi", "fs-qtok-value");
    });
    row("Exact text with quotes", (p) => {
      tok(p, '"den haag"', "fs-qtok-quote");
    });
    row("Limit a word to one field", (p) => {
      tok(p, "cuisine:", "fs-qtok-field");
      tok(p, "japanese", "fs-qtok-value");
    });
    row("Search dishes in your visit notes", (p) => {
      tok(p, "dish:", "fs-qtok-field");
      tok(p, "omakase", "fs-qtok-value");
    });
    row("Compare numbers with >, >=, <, <= or =", (p) => {
      tok(p, "rating:", "fs-qtok-field");
      tok(p, ">=4", "fs-qtok-op");
    });
    row("Public rating, price tier and visit count too", (p) => {
      tok(p, "google:", "fs-qtok-field");
      tok(p, ">=4.5", "fs-qtok-op");
      tok(p, "price:", "fs-qtok-field");
      tok(p, "<=2", "fs-qtok-op");
      tok(p, "visits:", "fs-qtok-field");
      tok(p, ">0", "fs-qtok-op");
    });
    row("Exclude a term with a leading minus", (p) => {
      tok(p, "-sushi", "fs-qtok-neg");
    });
    row("Either side of a pipe matches", (p) => {
      tok(p, "ramen", "fs-qtok-value");
      tok(p, "|", "fs-qtok-op");
      tok(p, "sushi", "fs-qtok-value");
    });

    c.createDiv({ cls: "fs-tips-fields-title", text: "Searchable fields" });
    const chips = c.createDiv({ cls: "fs-tips-fields" });
    for (const f of FIELDS) chips.createSpan({ cls: "fs-qtok fs-qtok-field", text: `${f}:` });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

/** Turn `anchorEl` into a help button that opens the syntax tips modal. */
export function attachSearchTips(plugin: FoodSpotPluginApi, anchorEl: HTMLElement): void {
  anchorEl.addClass("fs-search-tips-btn");
  setIcon(anchorEl, "help-circle");
  if (!anchorEl.getAttribute("aria-label")) {
    anchorEl.setAttribute("aria-label", "Search syntax");
  }
  anchorEl.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    new SearchTipsModal(plugin.app).open();
  });
}
