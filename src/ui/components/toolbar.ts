/**
 * Food Spot — small toolbar building blocks shared by the tabs.
 *
 * The search box is the focus-safety cornerstone: consumers re-render RESULTS
 * on query changes; nothing here (and nothing downstream) may rebuild or blur
 * the input itself.
 */
import { setIcon } from "obsidian";

/** Trailing-edge debounce. */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
): (...args: A) => void {
  let timer: number | null = null;
  return (...args: A) => {
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  };
}

export interface SearchBoxHandle {
  wrapEl: HTMLElement;
  inputEl: HTMLInputElement;
  /** Programmatic value set (presets, location jumps). Does not emit onQuery. */
  setValue(v: string): void;
}

export function buildSearchBox(
  parent: HTMLElement,
  opts: {
    placeholder: string;
    debounceMs?: number;
    onQuery(q: string): void;
  }
): SearchBoxHandle {
  const wrap = parent.createDiv({ cls: "fs-search" });
  const icon = wrap.createSpan({ cls: "fs-search-icon" });
  setIcon(icon, "search");
  const input = wrap.createEl("input", {
    cls: "fs-search-input",
    attr: {
      type: "search",
      placeholder: opts.placeholder,
      spellcheck: "false",
      "aria-label": opts.placeholder,
      enterkeyhint: "search",
    },
  });
  const clear = wrap.createEl("button", {
    cls: "fs-search-clear",
    attr: { "aria-label": "Clear search", tabindex: "-1" },
  });
  setIcon(clear, "x");

  const emit = debounce((q: string) => opts.onQuery(q), opts.debounceMs ?? 250);
  const syncClear = (): void => clear.toggleClass("is-visible", input.value.length > 0);

  input.addEventListener("input", () => {
    syncClear();
    emit(input.value);
  });
  clear.addEventListener("click", (e) => {
    e.preventDefault();
    input.value = "";
    syncClear();
    input.focus();
    opts.onQuery("");
  });
  syncClear();

  return {
    wrapEl: wrap,
    inputEl: input,
    setValue(v: string) {
      input.value = v;
      syncClear();
    },
  };
}

/** Standard toolbar button: icon + optional text label. */
export function iconButton(
  parent: HTMLElement,
  opts: {
    icon: string;
    /** Accessible name (also the tooltip). */
    label: string;
    text?: string;
    cls?: string;
    onClick(e: MouseEvent): void;
  }
): HTMLElement {
  const btn = parent.createEl("button", {
    cls: ["fs-btn", opts.cls ?? ""].join(" ").trim(),
    attr: { "aria-label": opts.label, title: opts.label },
  });
  const ic = btn.createSpan({ cls: "fs-btn-icon" });
  setIcon(ic, opts.icon);
  if (opts.text) btn.createSpan({ cls: "fs-btn-label", text: opts.text });
  btn.addEventListener("click", (e) => opts.onClick(e));
  return btn;
}

/** Swap the icon of a button built by `iconButton`. */
export function setButtonIcon(btn: HTMLElement, icon: string): void {
  const ic = btn.querySelector<HTMLElement>(".fs-btn-icon");
  if (ic) setIcon(ic, icon);
}
