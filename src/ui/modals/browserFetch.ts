/**
 * Embedded-browser rating fetch (desktop only). Bot-walled sites (TripAdvisor,
 * Yelp, …) block plain requests but serve a real Chromium just fine — so we
 * load the page in an Electron <webview>, poll its DOM for JSON-LD, and save
 * the rating automatically. If the site shows a captcha, the user solves it
 * in the modal and extraction continues.
 */
import { Modal, Notice, Platform } from "obsidian";
import type { ExternalRatings, FoodSpotPluginApi } from "../../types";
import { extractJsonLd, theforkRating10, type JsonLdRestaurant } from "../../import/jsonld";
import { detectRatingSource } from "../../import/importers";

export function canBrowserFetch(): boolean {
  return Platform.isDesktopApp;
}

const POLL_MS = 1500;
const TIMEOUT_MS = 120000;

/** Map an extracted rating onto the right external fields for the URL's source. */
function mapToExternal(url: string, ld: JsonLdRestaurant): Partial<ExternalRatings> {
  const source = detectRatingSource(url);
  const out: Partial<ExternalRatings> = {};
  if (ld.rating === undefined || source === null) return out;
  switch (source) {
    case "tripadvisor":
      out.tripadvisorRating = ld.rating;
      if (ld.ratingCount !== undefined) out.tripadvisorRatingCount = ld.ratingCount;
      out.tripadvisorUrl = url;
      break;
    case "yelp":
      out.yelpRating = ld.rating;
      if (ld.ratingCount !== undefined) out.yelpRatingCount = ld.ratingCount;
      out.yelpUrl = url;
      break;
    case "facebook":
      out.facebookRating = ld.rating;
      if (ld.ratingCount !== undefined) out.facebookRatingCount = ld.ratingCount;
      out.facebookUrl = url;
      break;
    case "opentable":
      out.opentableRating = ld.rating;
      if (ld.ratingCount !== undefined) out.opentableRatingCount = ld.ratingCount;
      out.opentableUrl = url;
      break;
    case "thefork": {
      const v = theforkRating10(ld);
      if (v !== undefined) {
        out.theforkRating = v;
        if (ld.ratingCount !== undefined) out.theforkRatingCount = ld.ratingCount;
        out.theforkUrl = url;
      }
      break;
    }
    case "eetnu": {
      const v = theforkRating10(ld);
      if (v !== undefined) {
        out.eetnuRating = v;
        if (ld.ratingCount !== undefined) out.eetnuRatingCount = ld.ratingCount;
        out.eetnuUrl = url;
      }
      break;
    }
    case "google":
      break;
  }
  return out;
}

class BrowserFetchModal extends Modal {
  private timer: number | null = null;
  private done = false;

  constructor(
    private readonly plugin: FoodSpotPluginApi,
    private readonly path: string,
    private readonly url: string,
    private readonly onFinished: (found: boolean) => void
  ) {
    super(plugin.app);
  }

  override onOpen(): void {
    this.modalEl.addClass("fs-modal", "fs-browser-fetch-modal");
    let host = "the page";
    try {
      host = new URL(this.url).hostname.replace(/^www\./, "");
    } catch {
      // keep fallback label
    }
    this.titleEl.setText(`Fetching rating from ${host}…`);
    const status = this.contentEl.createDiv({
      cls: "fs-import-status",
      text: "Loading the real page — the rating is saved automatically. If a captcha appears, solve it here and I'll take it from there.",
    });

    // Electron webview: a real Chromium page, which bot walls accept.
    const wv = this.contentEl.createEl("webview" as keyof HTMLElementTagNameMap, {
      attr: { src: this.url },
      cls: "fs-browser-webview",
    }) as HTMLElement & {
      executeJavaScript?: (code: string) => Promise<string>;
    };

    const started = Date.now();
    const EXTRACT =
      "JSON.stringify(Array.from(document.querySelectorAll('script[type=\"application/ld+json\"]')).map(s => s.textContent || ''))";

    const poll = async (): Promise<void> => {
      if (this.done) return;
      if (Date.now() - started > TIMEOUT_MS) {
        status.setText("Timed out — the page never produced a rating. You can retry or close.");
        return;
      }
      try {
        const raw = await wv.executeJavaScript?.(EXTRACT);
        if (typeof raw === "string") {
          const scripts = JSON.parse(raw) as string[];
          const html = scripts
            .map((t) => `<script type="application/ld+json">${t}</script>`)
            .join("\n");
          const ld = extractJsonLd(html);
          if (ld !== null && ld.rating !== undefined) {
            const patch = mapToExternal(this.url, ld);
            if (Object.keys(patch).length > 0) {
              this.done = true;
              const spot = this.plugin.store.getByPath(this.path);
              if (spot) {
                patch.ratingsUpdated = new Date().toISOString().slice(0, 10);
                await this.plugin.store.updateSpot(this.path, {
                  external: { ...spot.external, ...patch },
                });
              }
              new Notice(`Rating fetched from ${host} and saved.`);
              this.close();
              this.onFinished(true);
              return;
            }
          }
        }
      } catch {
        // Page still loading / webview not ready — keep polling.
      }
      this.timer = window.setTimeout(() => void poll(), POLL_MS);
    };
    this.timer = window.setTimeout(() => void poll(), POLL_MS);
  }

  override onClose(): void {
    if (this.timer !== null) window.clearTimeout(this.timer);
    const finished = this.done;
    this.done = true;
    this.contentEl.empty();
    if (!finished) this.onFinished(false);
  }
}

/**
 * Fetch ratings for several bot-walled source URLs, one modal after another.
 */
export function openBrowserFetchQueue(
  plugin: FoodSpotPluginApi,
  path: string,
  urls: string[]
): void {
  if (!canBrowserFetch()) {
    new Notice("Browser fetch is only available on desktop.");
    return;
  }
  const [head, ...rest] = urls;
  if (head === undefined) return;
  new BrowserFetchModal(plugin, path, head, () => {
    if (rest.length > 0) openBrowserFetchQueue(plugin, path, rest);
  }).open();
}
