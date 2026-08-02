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
  openPath?(path: string): void;
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
 * Render `html` to a PDF file chosen in the save dialog. Resolves true when a
 * file was written, false when the user cancelled or the platform can't.
 */
export async function exportHtmlToPdf(html: string, suggestedName: string): Promise<boolean> {
  const bits = electron();
  if (!bits) {
    new Notice("Direct PDF export is only available on desktop.");
    return false;
  }

  const res = await bits.showSaveDialog({
    defaultPath: suggestedName,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (res.canceled || !res.filePath) return false;

  // The document is self-contained (data-URI images), so a temp file loaded
  // over file:// needs no vault or network access.
  const tmpPath = bits.tmpFile(`foodspot-guide-${Date.now()}.html`, html);
  const view = document.createElement("webview") as PrintableWebview;
  view.setAttribute("nodeintegration", "false");
  view.style.cssText =
    "position:fixed;left:-10000px;top:0;width:900px;height:1200px;opacity:0;pointer-events:none;";
  view.src = `file://${tmpPath}`;

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const cleanup = (): void => {
      view.remove();
    };
    const fail = (msg: string): void => {
      if (settled) return;
      settled = true;
      cleanup();
      new Notice(msg);
      resolve(false);
    };

    const onReady = (): void => {
      // A frame after load so fonts/images are painted before capture.
      window.setTimeout(() => {
        void (async () => {
          try {
            const data = await view.printToPDF({
              pageSize: "A4",
              printBackground: true,
              margins: { marginType: "custom", top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 },
            });
            bits.writeFile(res.filePath as string, data);
            settled = true;
            cleanup();
            new Notice(`PDF saved to ${res.filePath}`);
            bits.openPath?.(res.filePath as string);
            resolve(true);
          } catch (e) {
            fail(`Couldn't write the PDF — ${e instanceof Error ? e.message : String(e)}`);
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
    window.setTimeout(() => fail("PDF export timed out."), 20000);
    document.body.appendChild(view);
  });
}
