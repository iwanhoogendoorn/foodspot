/**
 * Food Spot — lightweight autocomplete dropdown for text inputs.
 *
 * Fed by a suggestion getter (typically `plugin.store.distinct(...)`), so the
 * list is always current at open time. `multi` enables comma-separated
 * multi-value mode (cuisines / tags): only the token after the last comma is
 * completed, already-entered tokens are excluded from suggestions.
 *
 * Keyboard: ArrowUp/ArrowDown move the highlight, Enter accepts, Esc closes
 * (and swallows the event so the surrounding modal stays open).
 */
export interface AutocompleteOptions {
  getSuggestions(): string[];
  /** Comma-separated multi-value mode (cuisines, tags). */
  multi?: boolean;
  /** Max items shown; default 8. */
  maxItems?: number;
}

export interface AutocompleteHandle {
  destroy(): void;
}

export function attachAutocomplete(
  inputEl: HTMLInputElement,
  opts: AutocompleteOptions
): AutocompleteHandle {
  const maxItems = opts.maxItems ?? 8;
  const host = inputEl.parentElement ?? inputEl.ownerDocument.body;
  host.addClass("fs-ac-host");
  const dropdown = host.createDiv({ cls: "fs-ac-dropdown" });

  let open = false;
  let items: string[] = [];
  let active = -1;
  let blurTimer: number | undefined;

  const tokens = (): string[] =>
    opts.multi ? inputEl.value.split(",").map((t) => t.trim()) : [inputEl.value.trim()];

  const currentToken = (): string => {
    const t = tokens();
    return (t[t.length - 1] ?? "").toLowerCase();
  };

  const close = (): void => {
    open = false;
    active = -1;
    dropdown.removeClass("fs-open");
    dropdown.empty();
  };

  const select = (idx: number): void => {
    const chosen = items[idx];
    if (chosen === undefined) return;
    if (opts.multi) {
      const t = tokens();
      t[t.length - 1] = chosen;
      inputEl.value = t.filter(Boolean).join(", ");
    } else {
      inputEl.value = chosen;
    }
    close();
    inputEl.focus();
    inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const paintActive = (): void => {
    dropdown.querySelectorAll(".fs-ac-item").forEach((el, i) => {
      (el as HTMLElement).toggleClass("fs-ac-active", i === active);
    });
  };

  const update = (): void => {
    const token = currentToken();
    const taken = new Set(
      opts.multi ? tokens().slice(0, -1).map((t) => t.toLowerCase()).filter(Boolean) : []
    );
    items = opts
      .getSuggestions()
      .filter((s) => !taken.has(s.toLowerCase()))
      .filter((s) => token === "" || s.toLowerCase().includes(token))
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(token) ? 0 : 1;
        const bStarts = b.toLowerCase().startsWith(token) ? 0 : 1;
        return aStarts - bStarts || a.localeCompare(b);
      })
      .slice(0, maxItems);
    // Don't offer the exact value already typed as the only suggestion.
    if (items.length === 1 && items[0]?.toLowerCase() === token) items = [];
    if (items.length === 0) {
      close();
      return;
    }
    open = true;
    active = 0;
    dropdown.addClass("fs-open");
    dropdown.empty();
    items.forEach((s, i) => {
      const item = dropdown.createDiv({ cls: "fs-ac-item", text: s });
      if (i === active) item.addClass("fs-ac-active");
      item.addEventListener("mousedown", (ev) => ev.preventDefault()); // keep input focus
      item.addEventListener("click", () => select(i));
    });
  };

  const onInput = (): void => update();
  const onFocus = (): void => update();
  const onBlur = (): void => {
    window.clearTimeout(blurTimer);
    blurTimer = window.setTimeout(close, 120);
  };
  const onKeydown = (ev: KeyboardEvent): void => {
    if (ev.key === "ArrowDown") {
      if (!open) {
        update();
      } else {
        active = (active + 1) % items.length;
        paintActive();
      }
      if (open) ev.preventDefault();
    } else if (ev.key === "ArrowUp") {
      if (!open) return;
      active = (active - 1 + items.length) % items.length;
      paintActive();
      ev.preventDefault();
    } else if (ev.key === "Enter") {
      if (!open || active < 0) return;
      ev.preventDefault();
      ev.stopPropagation();
      select(active);
    } else if (ev.key === "Escape") {
      if (!open) return;
      // Swallow so the surrounding modal doesn't close.
      ev.preventDefault();
      ev.stopPropagation();
      close();
    }
  };

  inputEl.addEventListener("input", onInput);
  inputEl.addEventListener("focus", onFocus);
  inputEl.addEventListener("blur", onBlur);
  inputEl.addEventListener("keydown", onKeydown);

  return {
    destroy(): void {
      window.clearTimeout(blurTimer);
      inputEl.removeEventListener("input", onInput);
      inputEl.removeEventListener("focus", onFocus);
      inputEl.removeEventListener("blur", onBlur);
      inputEl.removeEventListener("keydown", onKeydown);
      dropdown.remove();
    },
  };
}
