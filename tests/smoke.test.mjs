/**
 * Food Spot — pure-module smoke tests.
 *
 * Bundles the four pure modules (no obsidian imports) with esbuild into a
 * temp file, then runs node:assert checks:
 *   1. visits round-trip (parse + serialize preserves data and unknown lines)
 *   2. legacySpotToNote on real spots from foodspots/data.json
 *   3. search query parser (field scopes, numeric comparators, exclusions, quoted)
 *   4. JSON-LD extraction on an inline schema.org Restaurant fixture
 *   5. menu-link discovery (findMenuUrl: absolute/relative, same-host pref,
 *      gift-card exclusion, strong-token ranking)
 *   6. frontmatter round-trip of the v1.1 keys (menu, tripadvisor_url,
 *      yelp_*, thefork_*) via frontmatterFromInput -> buildSpot
 *   7. TheFork 10-scale JSON-LD (ratingRaw preserved; theforkRating10
 *      normalizes 5-scale pages TO the 10-scale)
 *   8. source guard: spotStore.updateSpot's merged literal carries `menu`
 *      (the v1.1 field a Partial merge silently drops when omitted)
 *   9. pasted-list name parser (bullets, numbering, emoji, dedupe, URL and
 *      long-line dropping, the 100-name cap)
 *  10. managed-section fence scanning (CommonMark closers only, so a code
 *      sample containing ```not-a-close never ends the block early and a
 *      heading inside it is not mistaken for a section boundary)
 *  11. visit embed refs keep their `|alias` display suffix through a
 *      parse/serialize round-trip; embedRefPath strips it for link resolution
 *  12. duplicate-merge visit dedupe keys on every typed field, so two visits
 *      on the same date with a different spend both survive
 *  13. opening hours: 24:30 is unparseable, 24:00 is midnight, and an
 *      overnight range is open after midnight
 *  14. exported guide HTML renders only http(s)/mailto/tel in an href; a
 *      javascript: URL is escaped plain text
 *  15. calendar-date helpers are LOCAL, asserted under several TZs — the
 *      UTC-based idioms they replaced shifted the day by one
 *  16. source guard: spotStore.updateSpot's merged literal carries `menu` and
 *      `hours`, and keeps its compile-time CompleteSpotInput gate
 *
 * noteWriter.ts imports `obsidian` for types only, so the bundle aliases
 * `obsidian` to an empty stub — the tested fns are pure.
 *
 * Run: node tests/smoke.test.mjs
 */
import { strict as assert } from "node:assert";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import esbuild from "esbuild";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const tmp = mkdtempSync(join(tmpdir(), "foodspot-smoke-"));

// -- bundle the pure modules -------------------------------------------------

const entry = join(tmp, "entry.mjs");
writeFileSync(
  entry,
  [
    `export * from ${JSON.stringify(join(root, "src/store/visitsParser.ts"))};`,
    `export * from ${JSON.stringify(join(root, "src/store/legacyMap.ts"))};`,
    `export * from ${JSON.stringify(join(root, "src/search/query.ts"))};`,
    `export * from ${JSON.stringify(join(root, "src/import/jsonld.ts"))};`,
    `export * from ${JSON.stringify(join(root, "src/import/menuDiscovery.ts"))};`,
    `export * from ${JSON.stringify(join(root, "src/import/listParse.ts"))};`,
    `export * from ${JSON.stringify(join(root, "src/tools/duplicates.ts"))};`,
    `export * from ${JSON.stringify(join(root, "src/ui/components/hours.ts"))};`,
    `export * from ${JSON.stringify(join(root, "src/util/dates.ts"))};`,
    `export { buildGuideHtml } from ${JSON.stringify(join(root, "src/tools/guideHtml.ts"))};`,
    `export { frontmatterFromInput, buildSpot, computeDerived, extractSection, replaceSection } from ${JSON.stringify(join(root, "src/store/noteWriter.ts"))};`,
    `export { DEFAULT_SETTINGS, EMPTY_FILTER_STATE } from ${JSON.stringify(join(root, "src/types.ts"))};`,
  ].join("\n"),
);

// noteWriter's `obsidian` import is type-only at runtime for the fns we test,
// and duplicates.ts reaches pipeline.ts (for haversineMeters/normalizeName),
// which drags the network layer in. None of it runs: the stub only has to
// satisfy esbuild's import resolution, so every runtime member throws.
const obsidianStub = join(tmp, "obsidian-stub.mjs");
writeFileSync(
  obsidianStub,
  [
    "export class App {}",
    "export class TFile {}",
    "export class TFolder {}",
    "export class Notice {}",
    "export class Modal {}",
    "export class Plugin {}",
    "export class PluginSettingTab {}",
    "export class Setting {}",
    "export class FuzzySuggestModal {}",
    "export const Platform = { isDesktopApp: false, isMobile: false };",
    "export function normalizePath(p) { return p; }",
    "export function setIcon() {}",
    "export function requestUrl() {",
    "  throw new Error('smoke bundle: no network');",
    "}",
    "",
  ].join("\n"),
);

const outfile = join(tmp, "bundle.mjs");
await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "es2020",
  outfile,
  logLevel: "silent",
  absWorkingDir: root,
  alias: { obsidian: obsidianStub },
});

const mod = await import(pathToFileURL(outfile).href);
const {
  parseVisitsSection,
  parseVisitLine,
  parseVisitLines,
  serializeVisits,
  serializeVisit,
  serializeVisitLines,
  legacySpotToNote,
  filterSpots,
  sortSpots,
  extractJsonLd,
  theforkRating10,
  findMenuUrl,
  parseNameList,
  parseNameListVerbose,
  MAX_NAMES,
  frontmatterFromInput,
  buildSpot,
  computeDerived,
  extractSection,
  replaceSection,
  embedRefPath,
  planMerge,
  parseHours,
  openState,
  localClockApplies,
  buildGuideHtml,
  todayIso,
  parseCalendarDate,
  formatCalendarDate,
  daysBetweenCalendar,
  DEFAULT_SETTINGS,
  EMPTY_FILTER_STATE,
} = mod;

let passed = 0;
function ok(name, fn) {
  fn();
  passed++;
  console.log(`  ok - ${name}`);
}

// ---------------------------------------------------------------------------
console.log("visits round-trip");
// ---------------------------------------------------------------------------

const visitsSection = [
  "- [date:: 2026-07-12] [rating:: 4.5] [spent:: 45] Great omakase, sat at the bar",
  "Some stray user note that is not a visit",
  "- [spent:: 12] [date:: 2026-07-20] cheap lunch, fields out of order",
  "- [date:: 2026-08-01] no rating or spent",
  "- not a visit bullet at all",
].join("\n");

ok("parses only lines with a valid date field, in document order", () => {
  const visits = parseVisitsSection(visitsSection);
  assert.equal(visits.length, 3);
  assert.deepEqual(visits[0], {
    date: "2026-07-12",
    rating: 4.5,
    spent: 45,
    note: "Great omakase, sat at the bar",
  });
  assert.deepEqual(visits[1], {
    date: "2026-07-20",
    spent: 12,
    note: "cheap lunch, fields out of order",
  });
  assert.deepEqual(visits[2], { date: "2026-08-01", note: "no rating or spent" });
});

ok("line-model round-trip preserves visits AND unknown raw lines", () => {
  const lines = parseVisitLines(visitsSection);
  assert.equal(lines.filter((l) => l.kind === "visit").length, 3);
  assert.equal(lines.filter((l) => l.kind === "raw").length, 2);
  const text = serializeVisitLines(lines);
  assert.match(text, /Some stray user note that is not a visit/);
  assert.match(text, /- not a visit bullet at all/);
  // Idempotence: a second parse+serialize cycle is a fixed point.
  const again = serializeVisitLines(parseVisitLines(text));
  assert.equal(again, text);
});

ok("serializeVisits(parse(x)) preserves every modeled field", () => {
  const visits = parseVisitsSection(visitsSection);
  const text = serializeVisits(visits);
  assert.deepEqual(parseVisitsSection(text), visits);
  assert.equal(
    text.split("\n")[0],
    "- [date:: 2026-07-12] [rating:: 4.5] [spent:: 45] Great omakase, sat at the bar",
  );
});

ok("dish photo embeds round-trip and stay out of the note text", () => {
  const line =
    "- [date:: 2026-08-03] [rating:: 4.5] [spent:: 62] Lamb karahi ![[60 FOOD/Food Spot/_media/dishes/Sarban 2026-08-03 1.jpg]] ![[dishes/second.png]]";
  const v = parseVisitLine(line);
  assert.equal(v.date, "2026-08-03");
  assert.equal(v.rating, 4.5);
  assert.equal(v.spent, 62);
  assert.equal(v.note, "Lamb karahi", "embeds must not leak into the note text");
  assert.deepEqual(v.photos, [
    "60 FOOD/Food Spot/_media/dishes/Sarban 2026-08-03 1.jpg",
    "dishes/second.png",
  ]);
  const round = parseVisitLine(serializeVisit(v));
  assert.deepEqual(round.photos, v.photos, "photos survive a serialize/parse cycle");
  assert.equal(round.note, "Lamb karahi");
  assert.equal(serializeVisit({ date: "2026-08-03", note: "" }).includes("![["), false,
    "a visit without photos gets no embeds");
});

// ---------------------------------------------------------------------------
console.log("legacySpotToNote on real v0.1 spots");
// ---------------------------------------------------------------------------

// Inlined fixtures — verbatim records from the (since removed) legacy
// foodspots/data.json, so the migration mapping stays regression-tested.
const momiji = {
  id: "momiji-j1bvm",
  name: "Momiji",
  cuisines: ["Japanese", "Sushi"],
  country: "Netherlands",
  city: "Den Haag",
  source: "manual",
  sourceUrl: "https://momiji-sushi.nl",
  status: "want-to-try",
  visits: [],
  tags: ["favorites"],
  notes: "",
  photos: [],
  createdAt: "2026-08-02T11:06:53.176Z",
  updatedAt: "2026-08-02T11:06:53.176Z",
};
const littleV = {
  id: "little-v-oiyeb",
  name: "Little V",
  cuisines: ["Vietnamese"],
  country: "Netherlands",
  city: "Rotterdam",
  district: "Grotekerkplein",
  source: "manual",
  sourceUrl: "https://littlev.nl",
  status: "want-to-try",
  visits: [],
  tags: ["favorites"],
  notes: "",
  photos: [],
  createdAt: "2026-08-02T11:06:53.176Z",
  updatedAt: "2026-08-02T11:06:53.176Z",
};
const third = {
  id: "moong-d0l29",
  name: "Moong",
  cuisines: ["Indian"],
  country: "Netherlands",
  city: "Rotterdam",
  source: "manual",
  status: "want-to-try",
  visits: [],
  tags: ["favorites"],
  notes: "",
  photos: [],
  createdAt: "2026-08-02T11:06:53.176Z",
  updatedAt: "2026-08-02T11:06:53.176Z",
};

ok("real spot #1 (Momiji): identity, source_url->url for manual, filename", () => {
  const plan = legacySpotToNote(momiji, DEFAULT_SETTINGS);
  assert.equal(plan.fileName, "Momiji (Den Haag).md");
  assert.equal(plan.folder, "Food Spot/Netherlands");
  const fm = plan.frontmatter;
  assert.equal(fm.type, "foodspot");
  assert.equal(fm.name, "Momiji");
  assert.deepEqual(fm.cuisines, ["Japanese", "Sushi"]);
  assert.equal(fm.country, "Netherlands");
  assert.equal(fm.city, "Den Haag");
  assert.equal(fm.status, "want-to-try");
  assert.equal(fm.favorite, false);
  assert.equal(fm.source, "manual");
  assert.equal(fm.source_url, "https://momiji-sushi.nl");
  // v0.1 manual spots kept the restaurant website in sourceUrl.
  assert.equal(fm.url, "https://momiji-sushi.nl");
  assert.equal(fm.legacy_id, "momiji-j1bvm");
  assert.equal(fm.visit_count, 0);
  assert.equal(fm.created, "2026-08-02");
  assert.deepEqual(fm.tags, ["favorites"]);
});

ok("real spot #2 (Little V): district survives", () => {
  const plan = legacySpotToNote(littleV, DEFAULT_SETTINGS);
  const fm = plan.frontmatter;
  assert.equal(fm.district, "Grotekerkplein");
  assert.equal(fm.city, "Rotterdam");
  assert.equal(fm.status, "want-to-try");
  assert.equal(fm.legacy_id, "little-v-oiyeb");
});

ok("real spot #3 (Moong): no sourceUrl -> no url; body has Notes+Visits sections", () => {
  const plan = legacySpotToNote(third, DEFAULT_SETTINGS);
  const fm = plan.frontmatter;
  assert.equal(fm.name, "Moong");
  assert.equal(fm.url, undefined);
  assert.match(plan.body, /^## Notes\n/);
  assert.match(plan.body, /## Visits\n/);
});

ok("favorite STATUS maps to visited + favorite:true (spot variant with visits)", () => {
  // The live library has no favorite-status spot left, so exercise the mapping
  // on a real spot flipped to the legacy "favorite" status with visits.
  const legacy = {
    ...momiji,
    id: "momiji-fav-test",
    status: "favorite",
    personalRating: 4,
    visits: [
      { date: "2026-07-12T18:00:00.000Z", rating: 5, notes: "amazing" },
      { date: "2026-06-01", rating: 4, notes: "" },
    ],
  };
  const plan = legacySpotToNote(legacy, DEFAULT_SETTINGS);
  const fm = plan.frontmatter;
  assert.equal(fm.status, "visited");
  assert.equal(fm.favorite, true);
  // personalRating was manual -> locked, not overwritten by the visit average.
  assert.equal(fm.rating, 4);
  assert.equal(fm.rating_locked, true);
  assert.equal(fm.visit_count, 2);
  assert.equal(fm.last_visit, "2026-07-12");
  // Visits land as parseable bullets in the body.
  const visitsPart = plan.body.split("## Visits")[1];
  const parsed = parseVisitsSection(visitsPart);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].date, "2026-07-12");
  assert.equal(parsed[0].rating, 5);
});

// ---------------------------------------------------------------------------
console.log("search query parser");
// ---------------------------------------------------------------------------

function spot(over = {}) {
  return {
    path: over.path ?? `${over.name ?? "x"}.md`,
    name: "Spot",
    cuisines: [],
    country: "Netherlands",
    status: "want-to-try",
    favorite: false,
    ratingLocked: false,
    source: "manual",
    external: {},
    tags: [],
    visits: [],
    visitCount: 0,
    created: "2026-01-01",
    updated: "2026-01-01",
    notes: "",
    ...over,
  };
}

const spots = [
  spot({ name: "Momiji", cuisines: ["Japanese", "Sushi"], city: "Den Haag", rating: 4.5, price: 3, external: { googleRating: 4.6 }, visits: [{ date: "2026-07-12", note: "omakase" }], visitCount: 1 }),
  spot({ name: "Little V", cuisines: ["Vietnamese"], city: "Rotterdam", rating: 3, price: 2 }),
  spot({ name: "Moong", cuisines: ["Indian"], city: "Rotterdam", tags: ["date-night"] }),
  spot({ name: "Sushi Ran", cuisines: ["Japanese"], city: "Amsterdam", rating: 5, external: { googleRating: 4.2 } }),
];
const F = EMPTY_FILTER_STATE;

ok("field scopes: cuisine:/city:/tag: narrow correctly", () => {
  assert.deepEqual(filterSpots(spots, "cuisine:japanese", F).map((s) => s.name).sort(), ["Momiji", "Sushi Ran"]);
  assert.deepEqual(filterSpots(spots, "city:rotterdam", F).map((s) => s.name).sort(), ["Little V", "Moong"]);
  assert.deepEqual(filterSpots(spots, "tag:date-night", F).map((s) => s.name), ["Moong"]);
});

ok("quoted field tokens (detail-modal chip handoff shape)", () => {
  assert.deepEqual(filterSpots(spots, 'cuisine:"Vietnamese"', F).map((s) => s.name), ["Little V"]);
  assert.deepEqual(filterSpots(spots, 'tag:"date-night"', F).map((s) => s.name), ["Moong"]);
});

ok("numeric comparators: rating:>=4, google:>=4.5, price:<=2, visits:>0", () => {
  assert.deepEqual(filterSpots(spots, "rating:>=4", F).map((s) => s.name).sort(), ["Momiji", "Sushi Ran"]);
  assert.deepEqual(filterSpots(spots, "google:>=4.5", F).map((s) => s.name), ["Momiji"]);
  assert.deepEqual(filterSpots(spots, "price:<=2", F).map((s) => s.name), ["Little V"]);
  assert.deepEqual(filterSpots(spots, "visits:>0", F).map((s) => s.name), ["Momiji"]);
});

ok("exclusions and quoted exact substrings", () => {
  const names = filterSpots(spots, "-rotterdam", F).map((s) => s.name).sort();
  assert.deepEqual(names, ["Momiji", "Sushi Ran"]);
  assert.deepEqual(filterSpots(spots, '"little v"', F).map((s) => s.name), ["Little V"]);
  assert.deepEqual(filterSpots(spots, '"little x"', F), []);
});

ok("OR groups and AND terms combine", () => {
  const names = filterSpots(spots, "city:amsterdam | tag:date-night", F).map((s) => s.name).sort();
  assert.deepEqual(names, ["Moong", "Sushi Ran"]);
  assert.deepEqual(filterSpots(spots, "cuisine:japanese city:amsterdam", F).map((s) => s.name), ["Sushi Ran"]);
});

ok("filter state applies; minRating never excludes unrated; sort undefined-last", () => {
  const filters = { ...EMPTY_FILTER_STATE, minRating: 4 };
  const names = filterSpots(spots, "", filters).map((s) => s.name).sort();
  // Moong has NO rating -> stays; Little V (3) drops.
  assert.deepEqual(names, ["Momiji", "Moong", "Sushi Ran"]);
  const sorted = sortSpots(spots, { key: "rating", direction: "desc" });
  assert.deepEqual(sorted.map((s) => s.name), ["Sushi Ran", "Momiji", "Little V", "Moong"]);
});

// ---------------------------------------------------------------------------
console.log("JSON-LD extraction");
// ---------------------------------------------------------------------------

const html = `<!doctype html><html><head>
<title>Momiji — best sushi</title>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Momiji Den Haag",
  "servesCuisine": ["Japanese", "Sushi"],
  "priceRange": "$$$",
  "telephone": "+31 70 123 4567",
  "url": "https://momiji-sushi.nl",
  "image": "https://momiji-sushi.nl/cover.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Frederikstraat 969",
    "addressLocality": "Den Haag",
    "postalCode": "2514 LN",
    "addressCountry": "NL"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": 52.0808, "longitude": 4.3117 },
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.6", "reviewCount": "312" }
}
</scr` + `ipt></head><body></body></html>`;

ok("schema.org Restaurant: name/address/geo/cuisines/price/rating extracted", () => {
  const r = extractJsonLd(html);
  assert.ok(r, "extractJsonLd returned a restaurant");
  assert.equal(r.name, "Momiji Den Haag");
  assert.deepEqual(r.cuisines, ["Japanese", "Sushi"]);
  assert.equal(r.price, 3);
  assert.equal(r.phone, "+31 70 123 4567");
  assert.equal(r.image, "https://momiji-sushi.nl/cover.jpg");
  assert.equal(r.address?.street, "Frederikstraat 969");
  assert.equal(r.address?.city, "Den Haag");
  assert.equal(r.lat, 52.0808);
  assert.equal(r.lng, 4.3117);
  assert.equal(r.rating, 4.6);
  assert.equal(r.ratingCount, 312);
});

ok("no JSON-LD -> null", () => {
  assert.equal(extractJsonLd("<html><body>plain page</body></html>"), null);
});

// ---------------------------------------------------------------------------
console.log("menu-link discovery (findMenuUrl)");
// ---------------------------------------------------------------------------

ok("absolute same-host link preferred over earlier off-host match", () => {
  const page = [
    '<a href="https://www.ubereats.com/nl/store/resto/menu">Order on UberEats</a>',
    '<a href="https://resto.nl/menukaart.pdf">Menukaart</a>',
  ].join("\n");
  assert.equal(
    findMenuUrl(page, "https://resto.nl/"),
    "https://resto.nl/menukaart.pdf",
  );
});

ok("relative href resolves against the base URL (text match: Speisekarte)", () => {
  const page = '<nav><a href="/eten">Speisekarte</a></nav>';
  assert.equal(findMenuUrl(page, "https://resto.de/home"), "https://resto.de/eten");
});

ok("off-host match returned when no same-host link exists", () => {
  const page = '<a href="https://drive.google.com/menu.pdf">Our menu</a>';
  assert.equal(findMenuUrl(page, "https://resto.nl/"), "https://drive.google.com/menu.pdf");
});

ok("gift-card 'Cadeaukaart' skipped; Menukaart wins even when listed later", () => {
  const page = [
    '<a href="/cadeaukaart">Cadeaukaart</a>',
    '<a href="/menukaart">Menukaart</a>',
  ].join("\n");
  assert.equal(findMenuUrl(page, "https://resto.nl/"), "https://resto.nl/menukaart");
  // A page with ONLY the gift-card link finds nothing.
  assert.equal(
    findMenuUrl('<a href="/cadeaukaart">Cadeaukaart</a>', "https://resto.nl/"),
    null,
  );
});

ok("strong menu token outranks an earlier bare-'kaart' link on the same host", () => {
  const page = [
    '<a href="/kaartjes">Kaartjes bestellen</a>',
    '<a href="/menu">Menu</a>',
  ].join("\n");
  assert.equal(findMenuUrl(page, "https://resto.nl/"), "https://resto.nl/menu");
  // A weak match still wins when it is all the page offers (spec pattern).
  assert.equal(
    findMenuUrl('<a href="/kaart">Onze kaart</a>', "https://resto.nl/"),
    "https://resto.nl/kaart",
  );
});

ok("no menu-ish anchor -> null; #/javascript:/mailto: hrefs skipped", () => {
  assert.equal(findMenuUrl("<a href='/about'>About us</a>", "https://resto.nl/"), null);
  assert.equal(findMenuUrl("", "https://resto.nl/"), null);
  const junk = [
    '<a href="#menu">Menu</a>',
    "<a href=\"javascript:openMenu()\">Menu</a>",
    '<a href="mailto:menu@resto.nl">Menu</a>',
  ].join("\n");
  assert.equal(findMenuUrl(junk, "https://resto.nl/"), null);
});

// ---------------------------------------------------------------------------
console.log("pasted-list name parser (parseNameList)");
// ---------------------------------------------------------------------------

ok("bullets, numbering and stray markers are stripped off the front", () => {
  const text = [
    "- Momiji",
    "* Little V",
    "• Bokaal",
    "> Fitzgerald",
    "1. Cervejaria Ramiro",
    "2) Time Out Market",
    "3 - Belcanto",
    "1. - Moong",
  ].join("\n");
  assert.deepEqual(parseNameList(text), [
    "Momiji",
    "Little V",
    "Bokaal",
    "Fitzgerald",
    "Cervejaria Ramiro",
    "Time Out Market",
    "Belcanto",
    "Moong",
  ]);
});

ok("emoji, invisible marks and surrounding punctuation are removed", () => {
  assert.deepEqual(parseNameList("🍣 Momiji 🍣"), ["Momiji"]);
  assert.deepEqual(parseNameList("🇵🇹 Belcanto"), ["Belcanto"]);
  assert.deepEqual(parseNameList('  "Little V",  '), ["Little V"]);
  assert.deepEqual(parseNameList("\u200eMoong\u202c"), ["Moong"]);
  // Inner whitespace collapses; a name is never re-wrapped or re-cased.
  assert.deepEqual(parseNameList("De   Matroos   en  Het Meisje"), [
    "De Matroos en Het Meisje",
  ]);
});

ok("names with legitimate inner punctuation survive intact", () => {
  assert.deepEqual(
    parseNameList(["Ron Gastrobar - Oriental", "St.Louis Diner", "5-Star Diner"].join("\n")),
    ["Ron Gastrobar - Oriental", "St.Louis Diner", "5-Star Diner"],
  );
});

ok("dedupe is case-insensitive and keeps the FIRST spelling", () => {
  const text = ["Momiji", "momiji", "- MOMIJI", "Little V"].join("\n");
  assert.deepEqual(parseNameList(text), ["Momiji", "Little V"]);
});

ok("URLs, bare domains, empty lines and prose lines are dropped", () => {
  const long = "x".repeat(81);
  const text = [
    "Momiji",
    "",
    "   ",
    "https://maps.app.goo.gl/abc123",
    "www.momiji-sushi.nl",
    "momiji-sushi.nl",
    "1.",
    "42",
    long,
    "Little V",
  ].join("\n");
  assert.deepEqual(parseNameList(text), ["Momiji", "Little V"]);
  // 80 chars is still a name; 81 is prose.
  assert.deepEqual(parseNameList("y".repeat(80)), ["y".repeat(80)]);
  // Dropping a non-name is not "dropping data" — only the cap reports.
  assert.equal(parseNameListVerbose(text).dropped, 0);
});

ok(`the list is capped at ${MAX_NAMES} with the overflow counted`, () => {
  const names = Array.from({ length: MAX_NAMES + 7 }, (_, i) => `Resto ${i + 1}`);
  const r = parseNameListVerbose(names.join("\n"));
  assert.equal(r.names.length, MAX_NAMES);
  assert.equal(r.dropped, 7);
  assert.equal(r.names[0], "Resto 1");
  assert.equal(r.names[MAX_NAMES - 1], `Resto ${MAX_NAMES}`);
  // Duplicates past the cap are deduped first, so they never count as dropped.
  assert.equal(parseNameListVerbose([...names.slice(0, MAX_NAMES), "Resto 1"].join("\n")).dropped, 0);
});

ok("a real WhatsApp-shaped paste yields exactly the restaurant names", () => {
  const whatsapp = [
    "Hey! Here are the Rotterdam places I promised 🍜",
    "1. Little V",
    "2. Momiji 🍣",
    "- Fitzgerald",
    "• Bokaal",
    "https://maps.app.goo.gl/xyz",
    "Let me know which ones you end up trying!!",
    "",
    "momiji",
  ].join("\r\n");
  // Both prose lines are under 80 chars, so they parse as names — the cheap
  // rules stay predictable rather than guessing at sentences.
  assert.deepEqual(parseNameList(whatsapp), [
    "Hey! Here are the Rotterdam places I promised",
    "Little V",
    "Momiji",
    "Fitzgerald",
    "Bokaal",
    "Let me know which ones you end up trying",
  ]);
});

// ---------------------------------------------------------------------------
console.log("v1.1 frontmatter round-trip (menu + rating-source keys)");
// ---------------------------------------------------------------------------

const v11Input = {
  name: "Momiji",
  cuisines: ["Japanese"],
  country: "Netherlands",
  city: "Den Haag",
  status: "visited",
  favorite: false,
  ratingLocked: false,
  source: "manual",
  external: {
    googleRating: 4.6,
    googleRatingCount: 1200,
    tripadvisorRating: 4.5,
    tripadvisorRatingCount: 210,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-momiji.html",
    yelpRating: 4,
    yelpRatingCount: 88,
    yelpUrl: "https://www.yelp.com/biz/momiji-den-haag",
    theforkRating: 9.2, // raw 10-scale, stored unchanged
    theforkRatingCount: 145,
    theforkUrl: "https://www.thefork.nl/restaurant/momiji-r12345",
    ratingsUpdated: "2026-08-02",
  },
  menu: "https://momiji-sushi.nl/menukaart.pdf",
  tags: [],
  visits: [],
  notes: "",
};

ok("frontmatterFromInput writes every new snake_case key", () => {
  const derived = computeDerived([], false, undefined);
  const fm = frontmatterFromInput(v11Input, derived, {
    created: "2026-08-02",
    updated: "2026-08-02",
  });
  assert.equal(fm.menu, "https://momiji-sushi.nl/menukaart.pdf");
  assert.equal(fm.tripadvisor_url, "https://www.tripadvisor.com/Restaurant_Review-momiji.html");
  assert.equal(fm.yelp_rating, 4);
  assert.equal(fm.yelp_rating_count, 88);
  assert.equal(fm.yelp_url, "https://www.yelp.com/biz/momiji-den-haag");
  assert.equal(fm.thefork_rating, 9.2);
  assert.equal(fm.thefork_rating_count, 145);
  assert.equal(fm.thefork_url, "https://www.thefork.nl/restaurant/momiji-r12345");
});

ok("buildSpot(frontmatterFromInput(x)) round-trips the new fields", () => {
  const derived = computeDerived([], false, undefined);
  const fm = frontmatterFromInput(v11Input, derived, {
    created: "2026-08-02",
    updated: "2026-08-02",
  });
  const spot = buildSpot("Food Spot/Netherlands/Momiji.md", fm, "");
  assert.equal(spot.menu, v11Input.menu);
  // Per-key: buildSpot also carries explicit `undefined` entries (e.g.
  // googlePlaceId), which strict deepEqual would count as a difference.
  for (const [key, value] of Object.entries(v11Input.external)) {
    assert.equal(spot.external[key], value, `external.${key}`);
  }
  // TheFork stays raw 10-scale — never converted.
  assert.equal(spot.external.theforkRating, 9.2);
});

ok("absent optional keys stay undefined both directions", () => {
  const bare = { ...v11Input, menu: undefined, external: {} };
  const derived = computeDerived([], false, undefined);
  const fm = frontmatterFromInput(bare, derived, {
    created: "2026-08-02",
    updated: "2026-08-02",
  });
  assert.equal(fm.menu, undefined);
  assert.equal(fm.yelp_url, undefined);
  assert.equal(fm.thefork_rating, undefined);
  const spot = buildSpot("x.md", fm, "");
  assert.equal(spot.menu, undefined);
  assert.equal(spot.external.yelpRating, undefined);
  assert.equal(spot.external.theforkUrl, undefined);
});

// ---------------------------------------------------------------------------
console.log("TheFork 10-scale JSON-LD");
// ---------------------------------------------------------------------------

const theforkHtml = `<html><head><script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Momiji",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "9.2",
    "bestRating": "10",
    "ratingCount": "145"
  }
}
</scr` + `ipt></head><body></body></html>`;

ok("ratingRaw preserves 9.2 unchanged; rating normalized to 4.6; best 10", () => {
  const r = extractJsonLd(theforkHtml);
  assert.ok(r, "extractJsonLd returned a restaurant");
  assert.equal(r.ratingRaw, 9.2);
  assert.equal(r.ratingBest, 10);
  assert.equal(r.rating, 4.6);
  assert.equal(r.ratingCount, 145);
});

ok("theforkRating10: 10-scale passes through; 5-scale normalized TO 10-scale", () => {
  // Genuine 10-scale (bestRating 10 or absent) is stored unchanged.
  assert.equal(theforkRating10({ ratingRaw: 9.2, ratingBest: 10 }), 9.2);
  assert.equal(theforkRating10({ ratingRaw: 9.2 }), 9.2);
  // A LaFourchette page publishing a 5-scale must not render as "4.5/10".
  assert.equal(theforkRating10({ ratingRaw: 4.5, ratingBest: 5 }), 9);
  assert.equal(theforkRating10({ ratingRaw: 92, ratingBest: 100 }), 9.2);
  assert.equal(theforkRating10({}), undefined);
  assert.equal(theforkRating10({ ratingRaw: 3, ratingBest: 0 }), undefined);
});

// ---------------------------------------------------------------------------
console.log("managed-section fence scanning (finding 10)");
// ---------------------------------------------------------------------------

/** A three-backtick fence, kept out of the literals so they stay readable. */
const BT = "```";

// A note whose FIRST "## Notes" heading sits inside a fenced code sample. The
// opener is BT + "markdown"; the line BT + "not-a-close" carries an info string,
// which CommonMark forbids on a CLOSING fence, so it does not end the block.
// The scanner that treated any backtick run as a closer ended the fence there,
// found the fake heading, and rewrote the user's code sample as the managed
// section.
const fencedNote = [
  "---",
  "name: Momiji",
  "---",
  "Here is how the plugin lays a note out:",
  "",
  BT + "markdown",
  BT + "not-a-close",
  "## Notes",
  "fake notes body that must never be treated as a section",
  "## Visits",
  "- [date:: 1999-01-01] fake visit",
  BT,
  "",
  "## Notes",
  "",
  "real notes body",
  "",
  "## Visits",
  "",
  "- [date:: 2026-08-01] real visit",
  "",
].join("\n");

ok("a code sample containing " + BT + "not-a-close is not a section boundary", () => {
  // The real section is the one OUTSIDE the fence, not the sample's heading.
  assert.equal(extractSection(fencedNote, "## Notes"), "real notes body");
  assert.equal(
    extractSection(fencedNote, "## Visits"),
    "- [date:: 2026-08-01] real visit",
  );
});

ok("rewriting a managed section leaves the fenced sample byte-for-byte intact", () => {
  const out = replaceSection(fencedNote, "## Notes", "brand new notes");
  assert.match(out, /brand new notes/);
  // Everything inside the fence survives: the fake headings, the fake visit
  // bullet and the not-a-close line itself.
  assert.match(out, new RegExp(BT + "markdown"));
  assert.match(out, new RegExp(BT + "not-a-close"));
  assert.match(out, /fake notes body that must never be treated as a section/);
  assert.match(out, /- \[date:: 1999-01-01\] fake visit/);
  // ...and the real visit section is untouched.
  assert.match(out, /- \[date:: 2026-08-01\] real visit/);
});

ok("a PROPER closing fence still closes: the heading after it is a boundary", () => {
  const note = [
    "---",
    "name: X",
    "---",
    "## Notes",
    "",
    BT,
    "not a heading: ## Visits",
    BT,
    "",
    "## Visits",
    "",
    "- [date:: 2026-08-02] real",
    "",
  ].join("\n");
  assert.equal(extractSection(note, "## Visits"), "- [date:: 2026-08-02] real");
  assert.match(extractSection(note, "## Notes"), /not a heading: ## Visits/);
});

ok("a closer must be at least as long as its opener, and match its character", () => {
  const note = [
    "---",
    "name: X",
    "---",
    "## Notes",
    "",
    BT + BT.slice(0, 1), // four backticks open
    "~~~",               // wrong character: not a closer
    BT,                  // too short: not a closer
    "## Visits",         // still inside the fence
    BT + BT.slice(0, 1), // four backticks close
    "",
    "## Visits",
    "",
    "- [date:: 2026-08-02] real",
    "",
  ].join("\n");
  assert.equal(extractSection(note, "## Visits"), "- [date:: 2026-08-02] real");
  assert.match(extractSection(note, "## Notes"), /## Visits/);
});

// ---------------------------------------------------------------------------
console.log("visit embed alias round-trip (finding 20)");
// ---------------------------------------------------------------------------

ok("![[dish.jpg|300]] keeps its alias through parse + serialize", () => {
  const line = "- [date:: 2026-08-01] [rating:: 4] ramen ![[dishes/ramen.jpg|300]] ![[side.jpg]]";
  const visit = parseVisitLine(line);
  assert.ok(visit, "line parsed as a visit");
  assert.deepEqual(visit.photos, ["dishes/ramen.jpg|300", "side.jpg"]);
  // The alias is display width the user typed — rewriting it away on the next
  // edit silently changes their note.
  const out = serializeVisit(visit);
  assert.match(out, /!\[\[dishes\/ramen\.jpg\|300\]\]/);
  assert.match(out, /!\[\[side\.jpg\]\]/);
  // And it is a fixed point: a second cycle changes nothing.
  assert.equal(serializeVisit(parseVisitLine(out)), out);
});

ok("embedRefPath strips the alias so link resolution can find the file", () => {
  assert.equal(embedRefPath("dishes/ramen.jpg|300"), "dishes/ramen.jpg");
  assert.equal(embedRefPath("dish.jpg"), "dish.jpg");
  assert.equal(embedRefPath("  dish.jpg | left of bar  "), "dish.jpg");
});

// ---------------------------------------------------------------------------
console.log("duplicate-merge visit dedupe (finding 11)");
// ---------------------------------------------------------------------------

ok("two visits on the same date with a different spend both survive a merge", () => {
  const keep = spot({
    name: "Momiji",
    path: "keep.md",
    visits: [{ date: "2026-08-03", spent: 20, note: "lunch" }],
    visitCount: 1,
  });
  const drop = spot({
    name: "Momiji",
    path: "drop.md",
    visits: [{ date: "2026-08-03", spent: 80, note: "dinner" }],
    visitCount: 1,
  });
  const merged = planMerge(keep, drop).visits;
  assert.equal(merged.length, 2, "same day, different spend = two evenings");
  assert.deepEqual(
    merged.map((v) => v.spent).sort((a, b) => a - b),
    [20, 80],
  );
});

ok("a different rating on the same date also survives", () => {
  const keep = spot({ path: "a.md", visits: [{ date: "2026-08-03", rating: 3, note: "" }] });
  const drop = spot({ path: "b.md", visits: [{ date: "2026-08-03", rating: 5, note: "" }] });
  assert.equal(planMerge(keep, drop).visits.length, 2);
});

ok("a genuinely identical visit collapses to one, unioning its photos", () => {
  const keep = spot({
    path: "a.md",
    visits: [{ date: "2026-08-03", spent: 20, note: "Lunch", photos: ["a.jpg"] }],
  });
  const drop = spot({
    path: "b.md",
    visits: [{ date: "2026-08-03", spent: 20, note: "lunch", photos: ["b.jpg|300"] }],
  });
  const merged = planMerge(keep, drop).visits;
  assert.equal(merged.length, 1, "same evening logged twice is one bullet");
  assert.deepEqual(merged[0].photos, ["a.jpg", "b.jpg|300"]);
});

// ---------------------------------------------------------------------------
console.log("opening hours (findings 26, 16)");
// ---------------------------------------------------------------------------

ok("24:30 is unparseable; 24:00 is accepted as midnight", () => {
  // "24:30" folded to 00:30 and rendered back as a plausible time, so an
  // invalid line looked like a real one.
  assert.deepEqual(parseHours(["Mon 10:00-24:30"]), [{ day: 1, ranges: [] }]);
  assert.deepEqual(parseHours(["Mon 24:30-25:00"]), [{ day: 1, ranges: [] }]);
  // 24:00 is the one legal hour-24 notation and means midnight (0 minutes).
  assert.deepEqual(parseHours(["Mon 10:00-24:00"]), [
    { day: 1, ranges: [{ open: 600, close: 0 }] },
  ]);
  // A minute overflow is rejected too.
  assert.deepEqual(parseHours(["Mon 10:00-10:70"]), [{ day: 1, ranges: [] }]);
});

// A Tuesday, chosen so "yesterday" is the Monday the hours line names.
const tuesday0130 = new Date(2026, 7, 4, 1, 30);
const tuesday2300 = new Date(2026, 7, 4, 23, 0);
assert.equal(tuesday0130.getDay(), 2, "fixture date really is a Tuesday");

ok("an overnight range is open at 01:30 the next morning", () => {
  const state = openState(["Mon 22:00-02:00"], tuesday0130);
  assert.ok(state, "hours parsed");
  assert.equal(state.open, true, "Monday's after-midnight tail covers Tue 01:30");
  // The same clock time on a day with no overnight tail is closed, not open.
  const closed = openState(["Mon 12:00-14:00"], tuesday0130);
  assert.ok(closed);
  assert.equal(closed.open, false);
});

ok("a 10:00-24:00 range is open at 23:00 and unknown hours give no claim", () => {
  const state = openState(["Tue 10:00-24:00"], tuesday2300);
  assert.ok(state);
  assert.equal(state.open, true);
  // Nothing parseable at all -> null, so the UI shows no indicator rather
  // than a confident "Closed".
  assert.equal(openState(undefined, tuesday2300), null);
  assert.equal(openState([], tuesday2300), null);
  assert.equal(openState(["nonsense line"], tuesday2300), null);
  // An unusable IANA zone must not fall back to the machine clock.
  assert.equal(openState(["Tue 10:00-24:00"], tuesday2300, "Mars/Olympus_Mons"), null);
});

ok("a known IANA zone is read instead of the machine clock", () => {
  // 2026-08-04T23:00:00Z is Wednesday 09:00 in Sydney, still Tuesday in UTC.
  const instant = new Date("2026-08-04T23:00:00Z");
  const sydney = openState(["Wed 08:00-11:00"], instant, "Australia/Sydney");
  assert.ok(sydney);
  assert.equal(sydney.open, true);
  const utc = openState(["Wed 08:00-11:00"], instant, "UTC");
  assert.ok(utc);
  assert.equal(utc.open, false, "still Tuesday 23:00 in UTC");
});

ok("localClockApplies: only same-country spots may use the machine clock", () => {
  assert.equal(localClockApplies("Netherlands", "Netherlands"), true);
  assert.equal(localClockApplies("netherlands ", "Netherlands"), true);
  assert.equal(localClockApplies("United States", "Netherlands"), false);
  // Unknown on either side falls back to "local" on purpose.
  assert.equal(localClockApplies(undefined, "Netherlands"), true);
  assert.equal(localClockApplies("Japan", undefined), true);
});

// ---------------------------------------------------------------------------
console.log("exported guide HTML link safety (finding 18)");
// ---------------------------------------------------------------------------

const guideOpts = {
  includeWantToTry: true,
  currency: "€",
  images: new Map(),
  generatedOn: "2026-08-03",
};

ok("a javascript: URL is escaped text, never an href", () => {
  const html = buildGuideHtml(
    [spot({ name: "Evil", city: "Den Haag", url: "javascript:alert(document.cookie)" })],
    "Den Haag",
    guideOpts,
  );
  assert.doesNotMatch(html, /href="javascript:/i);
  assert.doesNotMatch(html, /<a [^>]*javascript:/i);
  // Still shown, so the user can see what is in the field — as plain text.
  assert.match(html, /javascript:alert\(document\.cookie\)/);
});

ok("data: and vbscript: are refused too; http(s)/mailto/tel are linked", () => {
  const bad = buildGuideHtml(
    [
      spot({ name: "A", city: "X", url: "data:text/html,<script>alert(1)</script>" }),
      spot({ name: "B", city: "X", url: " VBScript:msgbox(1)" }),
    ],
    "X",
    guideOpts,
  );
  assert.doesNotMatch(bad, /href="data:/i);
  assert.doesNotMatch(bad, /href="\s*vbscript:/i);
  // The escaped text must not reopen the hole either.
  assert.doesNotMatch(bad, /<script>/i);

  const good = buildGuideHtml(
    [
      spot({ name: "C", city: "X", url: "https://momiji.example/menu" }),
      spot({ name: "D", city: "X", url: "mailto:table@momiji.example" }),
    ],
    "X",
    guideOpts,
  );
  assert.match(good, /<a href="https:\/\/momiji\.example\/menu">momiji\.example<\/a>/);
  assert.match(good, /<a href="mailto:table@momiji\.example">/);
});

// ---------------------------------------------------------------------------
console.log("calendar dates are local, not UTC (finding 17)");
// ---------------------------------------------------------------------------

// The helpers read the process timezone at call time, so the whole group runs
// under several zones. Node resets its timezone cache when process.env.TZ is
// reassigned; if a runtime ever stops doing that, the guard below turns the
// zone-specific asserts into a plain local-semantics check instead of passing
// vacuously.
const originalTz = process.env.TZ;
function underTz(tz, fn) {
  process.env.TZ = tz;
  try {
    fn(new Date(2026, 7, 2).getTimezoneOffset());
  } finally {
    process.env.TZ = originalTz;
  }
}
process.env.TZ = "America/Los_Angeles";
const laOffset = new Date(2026, 7, 2).getTimezoneOffset();
process.env.TZ = "Australia/Sydney";
const sydneyOffset = new Date(2026, 7, 2).getTimezoneOffset();
process.env.TZ = originalTz;
const tzSwitchWorks = laOffset !== sydneyOffset;

ok("formatCalendarDate reads the LOCAL day, west and east of Greenwich", () => {
  // 2026-08-03T04:00Z is still 2026-08-02 in Los Angeles, and already
  // 2026-08-03 in Sydney. toISOString().slice(0, 10) says "2026-08-03" for
  // both — that is exactly the bug.
  const instant = new Date("2026-08-03T04:00:00Z");
  assert.equal(instant.toISOString().slice(0, 10), "2026-08-03");
  if (!tzSwitchWorks) {
    // Fallback: prove the helper does not use UTC semantics at all.
    const local = `${instant.getFullYear()}-${String(instant.getMonth() + 1).padStart(2, "0")}-${String(instant.getDate()).padStart(2, "0")}`;
    assert.equal(formatCalendarDate(instant), local);
    return;
  }
  underTz("America/Los_Angeles", () => {
    assert.equal(formatCalendarDate(instant), "2026-08-02");
  });
  underTz("Australia/Sydney", () => {
    assert.equal(formatCalendarDate(instant), "2026-08-03");
  });
  underTz("UTC", () => {
    assert.equal(formatCalendarDate(instant), "2026-08-03");
  });
});

ok("parseCalendarDate is LOCAL midnight in every zone (new Date(iso) is not)", () => {
  for (const tz of ["America/Los_Angeles", "Australia/Sydney", "UTC", "Europe/Amsterdam"]) {
    underTz(tz, () => {
      const d = parseCalendarDate("2026-08-02");
      assert.ok(d, `${tz}: parsed`);
      assert.equal(d.getFullYear(), 2026, `${tz}: year`);
      assert.equal(d.getMonth(), 7, `${tz}: month`);
      assert.equal(d.getDate(), 2, `${tz}: day`);
      assert.equal(d.getHours(), 0, `${tz}: local midnight`);
      assert.equal(d.getMinutes(), 0, `${tz}: local midnight`);
      // Round-trip is the invariant the whole plugin leans on.
      assert.equal(formatCalendarDate(d), "2026-08-02", `${tz}: round-trip`);
    });
  }
});

ok("todayIso round-trips and always equals the local calendar day", () => {
  for (const tz of ["America/Los_Angeles", "Australia/Sydney", "UTC", "Pacific/Kiritimati"]) {
    underTz(tz, () => {
      const iso = todayIso();
      assert.match(iso, /^\d{4}-\d{2}-\d{2}$/, `${tz}: shape`);
      const now = new Date();
      const local = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      assert.equal(iso, local, `${tz}: matches the local clock`);
      assert.equal(formatCalendarDate(parseCalendarDate(iso)), iso, `${tz}: round-trip`);
    });
  }
});

ok("parseCalendarDate rejects overflow dates instead of rolling them forward", () => {
  assert.equal(parseCalendarDate("2026-02-31"), null);
  assert.equal(parseCalendarDate("2026-13-01"), null);
  assert.equal(parseCalendarDate("not a date"), null);
  // A leap day that really exists is kept.
  assert.equal(formatCalendarDate(parseCalendarDate("2028-02-29")), "2028-02-29");
});

ok("daysBetweenCalendar counts whole days across a DST transition", () => {
  underTz("America/Los_Angeles", () => {
    // 2026-03-08 is the US spring-forward: that day is only 23 hours long, so
    // a raw ms division would report 1.958 -> 1 day.
    assert.equal(daysBetweenCalendar("2026-03-07", "2026-03-09"), 2);
    assert.equal(daysBetweenCalendar("2026-03-08", "2026-03-09"), 1);
    // Autumn fall-back (25-hour day).
    assert.equal(daysBetweenCalendar("2026-11-01", "2026-11-02"), 1);
    assert.equal(daysBetweenCalendar("2026-08-03", "2026-08-03"), 0);
    assert.equal(daysBetweenCalendar("2026-08-04", "2026-08-03"), -1);
    assert.ok(Number.isNaN(daysBetweenCalendar("nope", "2026-08-03")));
  });
});

// ---------------------------------------------------------------------------
console.log("spotStore.updateSpot merged-literal guard");
// ---------------------------------------------------------------------------

ok("updateSpot's merged SpotInput carries every optional field, `hours` included", () => {
  // spotStore imports live Obsidian APIs, so it can't run in this bundle —
  // guard the source instead: the merged literal enumerates every field of the
  // contract by hand, and omitting one makes every updateSpot call write it as
  // undefined, which applyFrontmatter DELETES from the note. `hours` was the
  // field that went missing: any favorite toggle wiped the opening hours.
  const src = readFileSync(join(root, "src/store/spotStore.ts"), "utf8");
  const merged = src.match(
    /const merged: SpotInput = \{([\s\S]*?)\n\s*\} satisfies CompleteSpotInput;/,
  );
  assert.ok(merged, "found updateSpot's merged literal, gated by `satisfies`");
  for (const key of [
    "name",
    "cuisines",
    "country",
    "city",
    "district",
    "address",
    "coordinates",
    "status",
    "favorite",
    "rating",
    "ratingLocked",
    "price",
    "url",
    "phone",
    "source",
    "sourceUrl",
    "external",
    "photo",
    "menu",
    "hours",
    "tags",
    "visits",
    "legacyId",
    "notes",
    "ctime",
    "created",
  ]) {
    assert.match(merged[1], new RegExp(`\\b${key}:`), `merged literal carries ${key}`);
  }
  // The compile-time half of the guard: a new SpotInput field must break the
  // build here rather than vanish at runtime.
  assert.match(
    src,
    /type CompleteSpotInput = SpotInput & Record<keyof SpotInput, unknown>/,
    "CompleteSpotInput gate is still declared",
  );
});

console.log(`\nall ${passed} asserts groups passed`);
