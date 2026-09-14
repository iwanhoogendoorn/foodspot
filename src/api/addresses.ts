/**
 * Pure address logic for the local API: which interfaces to bind for a
 * "Listen on" choice, and whether a caller is on this machine. No node
 * imports — the interface list is passed in (server.ts supplies
 * os.networkInterfaces()), so all of it is unit-tested in the smoke suite.
 */
import type { ApiHostMode } from "../types";

/** The slice of os.networkInterfaces() used here. Node < 18.4 spelled family as 4. */
export type InterfaceMap = Record<
  string,
  { address: string; family: string | number; internal: boolean }[] | undefined
>;

const LOOPBACK = "127.0.0.1";
const ALL = "0.0.0.0";

const isIPv4 = (family: string | number): boolean => family === "IPv4" || family === 4;

/**
 * True for 127.0.0.0/8 and ::1, in plain or IPv4-mapped IPv6 spelling. An
 * unknown peer address is NOT loopback: the write guard fails closed.
 */
export function isLoopbackAddress(addr: string | undefined): boolean {
  if (addr === undefined || addr === "") return false;
  const a = addr.toLowerCase().startsWith("::ffff:") ? addr.slice(7) : addr;
  return a === "::1" || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(a);
}

/** Tailscale assigns IPv4 addresses from the CGNAT block 100.64.0.0/10. */
export function isTailscaleAddress(ip: string): boolean {
  const m = /^100\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(ip);
  if (m === null) return false;
  const second = Number(m[1]);
  return second >= 64 && second <= 127;
}

/** This machine's Tailscale IPv4 address, if the tailnet interface is up. */
export function pickTailscaleAddress(ifaces: InterfaceMap): string | undefined {
  for (const list of Object.values(ifaces)) {
    for (const i of list ?? []) {
      if (!i.internal && isIPv4(i.family) && isTailscaleAddress(i.address)) return i.address;
    }
  }
  return undefined;
}

/** Every non-internal IPv4 address — what a 0.0.0.0 bind is reachable on. */
export function externalIPv4(ifaces: InterfaceMap): string[] {
  const out: string[] = [];
  for (const list of Object.values(ifaces)) {
    for (const i of list ?? []) {
      if (!i.internal && isIPv4(i.family) && !out.includes(i.address)) out.push(i.address);
    }
  }
  return out;
}

export interface BindPlan {
  /** Addresses to listen on — one server each, same port. */
  hosts: string[];
  /** Tailscale mode, but no tailnet address yet: serving loopback meanwhile. */
  waitingForTailscale: boolean;
}

/**
 * Hosts for a "Listen on" choice. Tailscale mode binds loopback TOO, so
 * scripts on this Mac keep using 127.0.0.1 — and keep working while the
 * tailnet is still coming up. An unrecognized mode falls back to loopback.
 */
export function bindPlan(mode: ApiHostMode | string, ifaces: InterfaceMap): BindPlan {
  if (mode === "all") return { hosts: [ALL], waitingForTailscale: false };
  if (mode === "tailscale") {
    const ts = pickTailscaleAddress(ifaces);
    return ts === undefined
      ? { hosts: [LOOPBACK], waitingForTailscale: true }
      : { hosts: [LOOPBACK, ts], waitingForTailscale: false };
  }
  return { hosts: [LOOPBACK], waitingForTailscale: false };
}

/** Where OTHER devices can reach a running server, for the settings examples. */
export function reachableFromNetwork(hosts: string[], ifaces: InterfaceMap): string[] {
  const out: string[] = [];
  for (const h of hosts) {
    const candidates = h === ALL ? externalIPv4(ifaces) : isLoopbackAddress(h) ? [] : [h];
    for (const c of candidates) if (!out.includes(c)) out.push(c);
  }
  return out;
}
