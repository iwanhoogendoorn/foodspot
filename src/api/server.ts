/**
 * A small HTTP server so other tools can drive Food Spot. Off unless you
 * switch it on; loopback-only by default, with an opt-in wider bind (the
 * Tailscale address, or all interfaces) chosen in Settings. Every request
 * needs the token from Settings, and callers that are not on this machine
 * are read-only unless the user allows network writes (enforced in
 * routes.ts). Address logic lives in addresses.ts, routing in routes.ts —
 * this file is only plumbing. Mirrors Helm's src/api/server.ts.
 */
import type { ApiHostMode } from "../types";
import {
  bindPlan,
  isLoopbackAddress,
  reachableFromNetwork,
  type BindPlan,
  type InterfaceMap,
} from "./addresses";
import { API_BASE, handle, type ApiDeps } from "./routes";

export type ApiServer = {
  /** Resolves once every listener is closed; open keep-alive sockets are cut. */
  close: () => Promise<void>;
  port: number;
  hosts: string[];
};

const MAX_BODY = 1_000_000; // a spot or a visit is a handful of fields; anything larger is a mistake or an attack

function interfaces(): InterfaceMap {
  // Required at run time so the bundle stays loadable where node is absent.
  const os = require("node:os") as typeof import("node:os");
  return os.networkInterfaces() as InterfaceMap;
}

/** Hosts to bind for a "Listen on" choice, against this machine's interfaces right now. */
export function bindPlanFor(mode: ApiHostMode): BindPlan {
  return bindPlan(mode, interfaces());
}

/** Addresses other devices can use to reach a server bound to `hosts`. */
export function reachableAddresses(hosts: string[]): string[] {
  return reachableFromNetwork(hosts, interfaces());
}

/** Timing-safe enough for a bearer token: compare every byte. */
function sameToken(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function randomToken(): string {
  const bytes = new Uint8Array(24);
  globalThis.crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function startApiServer(opts: {
  hosts: string[];
  port: number;
  token: string;
  deps: ApiDeps;
  log?: (m: string) => void;
}): Promise<ApiServer> {
  // Required at run time so the bundle stays loadable where node's http is not
  // available (Obsidian mobile never reaches this call — the toggle is
  // desktop-only).
  const http = require("node:http") as typeof import("node:http");
  type NodeServer = import("node:http").Server & { closeAllConnections?: () => void };

  const onRequest = (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
  ): void => {
    const send = (status: number, body: unknown): void => {
      const text = JSON.stringify(body ?? null);
      res.writeHead(status, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      });
      res.end(text);
    };
    // Not this machine: read-only unless allowed (routes.ts), and told nothing
    // about what is listening until it authenticates.
    const remote = !isLoopbackAddress(req.socket.remoteAddress);
    try {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      if (!url.pathname.startsWith(API_BASE)) {
        send(404, { error: remote ? "Not found" : `Food Spot serves ${API_BASE}` });
        return;
      }
      const auth = req.headers["authorization"];
      const given =
        typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")
          ? auth.slice(7).trim()
          : "";
      if (opts.token === "" || !sameToken(given, opts.token)) {
        send(401, { error: "Send the Food Spot API token as: Authorization: Bearer <token>" });
        return;
      }

      const chunks: Buffer[] = [];
      let size = 0;
      req.on("data", (c: Buffer) => {
        size += c.length;
        if (size > MAX_BODY) {
          send(413, { error: "Body too large" });
          req.destroy();
          return;
        }
        chunks.push(c);
      });
      req.on("end", () => {
        void (async () => {
          let body: unknown;
          const raw = Buffer.concat(chunks).toString("utf8");
          if (raw.trim() !== "") {
            try {
              body = JSON.parse(raw);
            } catch {
              send(400, { error: "Body must be JSON" });
              return;
            }
          }
          const query: Record<string, string> = {};
          url.searchParams.forEach((v, k) => {
            query[k] = v;
          });
          try {
            const r = await handle(
              {
                method: req.method ?? "GET",
                path: decodeURIComponent(url.pathname.slice(API_BASE.length)),
                query,
                body,
                remote,
              },
              opts.deps,
            );
            send(r.status, r.body);
          } catch (e) {
            opts.log?.(`request failed: ${String(e)}`);
            send(500, { error: e instanceof Error ? e.message : String(e) });
          }
        })();
      });
    } catch (e) {
      send(500, { error: e instanceof Error ? e.message : String(e) });
    }
  };

  const servers: NodeServer[] = [];
  const closeAll = (): Promise<void> =>
    Promise.all(
      servers.map(
        (s) =>
          new Promise<void>((resolve) => {
            s.close(() => resolve());
            // Keep-alive sockets would otherwise hold close() open indefinitely.
            s.closeAllConnections?.();
          }),
      ),
    ).then(() => undefined);

  try {
    for (const host of opts.hosts) {
      const server: NodeServer = http.createServer(onRequest);
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(opts.port, host, () => {
          server.removeListener("error", reject);
          resolve();
        });
      });
      servers.push(server);
    }
  } catch (e) {
    // One address failing (port taken, Tailscale address gone) must not leave
    // the others half-started with nothing holding a handle to them.
    await closeAll();
    throw e;
  }
  for (const host of opts.hosts) opts.log?.(`listening on http://${host}:${opts.port}${API_BASE}`);
  return { close: closeAll, port: opts.port, hosts: [...opts.hosts] };
}
