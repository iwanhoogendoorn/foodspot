/**
 * Direct PDF export (desktop only).
 *
 * `window.print()` always hands off to the OS print dialog. Electron's
 * <webview> exposes printToPDF(), which renders straight to bytes — so the
 * guide is loaded into an offscreen webview, printed to a PDF buffer, and
 * written wherever the save dialog points. Falls back to the print dialog
 * when any of that is unavailable (older builds, mobile).
 */
import { Notice } from "obsidian";

interface SaveDialogResult {
  canceled: boolean;
  filePath?: string;
}

interface ElectronBits {
  showSaveDialog(opts: object): Promise<SaveDialogResult>;
  writeFile(path: string, data: Uint8Array): void;
  tmpFile(name: string, content: string): string;
  removeFile(path: string): void;
  openPath?(path: string): void;
}

/** Outcome of a PDF export; `failed` is the caller's cue to offer printing. */
export type PdfExportOutcome = "saved" | "cancelled" | "failed";

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Electron/node handles, or null when we're not on desktop. */
function electron(): ElectronBits | null {
  const req = (globalThis as unknown as { require?: (m: string) => unknown }).require;
  if (typeof req !== "function") return null;
  try {
    const el = req("electron") as {
      remote?: { dialog?: { showSaveDialog(o: object): Promise<SaveDialogResult> }; shell?: { openPath(p: string): void } };
    };
    const fs = req("fs") as {
      writeFileSync(p: string, d: Uint8Array | string): void;
      unlinkSync(p: string): void;
    };
    const os = req("os") as { tmpdir(): string };
    const path = req("path") as { join(...p: string[]): string };
    const dialog = el.remote?.dialog;
    if (!dialog || !fs || !os) return null;
    return {
      showSaveDialog: (o) => dialog.showSaveDialog(o),
      writeFile: (p, d) => fs.writeFileSync(p, d),
      tmpFile: (name, content) => {
        const p = path.join(os.tmpdir(), name);
        fs.writeFileSync(p, content);
        return p;
      },
      removeFile: (p) => fs.unlinkSync(p),
      openPath: el.remote?.shell ? (p: string) => el.remote?.shell?.openPath(p) : undefined,
    };
  } catch {
    return null;
  }
}

export function canExportPdf(): boolean {
  return electron() !== null;
}

/** Electron's <webview> tag with the printToPDF extension we rely on. */
interface PrintableWebview extends HTMLElement {
  src: string;
  printToPDF(options: object): Promise<Uint8Array>;
}

/**
 * Render `html` to a PDF file chosen in the save dialog.
 *
 * Never rejects: every failure shows its own Notice and resolves "failed" so
 * the caller can offer the print dialog instead. The guide carries the user's
 * restaurants and base64 photos, so the temp file it is rendered from is
 * deleted on every exit — success, failure and timeout alike.
 */
export async function exportHtmlToPdf(
  html: string,
  suggestedName: string,
): Promise<PdfExportOutcome> {
  const bits = electron();
  if (!bits) {
    new Notice("Direct PDF export needs the desktop app — opening the print dialog instead.");
    return "failed";
  }

  let res: SaveDialogResult;
  try {
    res = await bits.showSaveDialog({
      defaultPath: suggestedName,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
  } catch (e) {
    new Notice(`Couldn't open the save dialog — ${errorText(e)}`);
    return "failed";
  }
  if (res.canceled || !res.filePath) return "cancelled";
  const target = res.filePath;

  // The document is self-contained (data-URI images), so a temp file loaded
  // over file:// needs no vault or network access.
  let tmpPath: string;
  try {
    tmpPath = bits.tmpFile(`foodspot-guide-${Date.now()}.html`, html);
  } catch (e) {
    new Notice(`Couldn't prepare the guide for printing — ${errorText(e)}`);
    return "failed";
  }

  const view = document.createElement("webview") as PrintableWebview;
  view.setAttribute("nodeintegration", "false");
  view.style.cssText =
    // 794x1123 = A4 at 96dpi, so CSS layout == printed page.
    "position:fixed;left:-10000px;top:0;width:794px;height:1123px;opacity:0;pointer-events:none;";
  view.src = `file://${tmpPath}`;

  return new Promise<PdfExportOutcome>((resolve) => {
    let settled = false;
    let timeoutId = 0;
    const cleanup = (): void => {
      window.clearTimeout(timeoutId);
      view.remove();
      try {
        bits.removeFile(tmpPath);
      } catch (e) {
        // A file the OS still holds open survives here; it contains the whole
        // guide, so tell the user where it is instead of leaving it quietly.
        new Notice(
          `Couldn't remove the temporary guide file — delete ${tmpPath} yourself (${errorText(e)}).`,
          10000,
        );
      }
    };
    const fail = (msg: string): void => {
      if (settled) return;
      settled = true;
      cleanup();
      new Notice(msg);
      resolve("failed");
    };

    const onReady = (): void => {
      // A frame after load so fonts/images are painted before capture.
      window.setTimeout(() => {
        void (async () => {
          try {
            const data = await view.printToPDF({
              pageSize: "A4",
              printBackground: true,
              // Margins live in the document's own page padding.
              margins: { marginType: "none" },
            });
            bits.writeFile(target, data);
            settled = true;
            cleanup();
            new Notice(`PDF saved to ${target}`);
            bits.openPath?.(target);
            resolve("saved");
          } catch (e) {
            fail(`Couldn't write the PDF — ${errorText(e)}`);
          }
        })();
      }, 350);
    };

    view.addEventListener("did-finish-load", onReady, { once: true });
    view.addEventListener(
      "did-fail-load",
      () => fail("The guide couldn't be rendered for PDF export."),
      { once: true }
    );
    timeoutId = window.setTimeout(() => fail("PDF export timed out."), 20000);
    document.body.appendChild(view);
  });
}
