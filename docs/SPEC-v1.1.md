# Food Spot v1.1 — feature wave spec

Five user-requested changes on top of v1.0 (docs/SPEC.md still authoritative for
everything not amended here). Contracts already updated in src/types.ts:
`ExternalRatings` (yelp/thefork/urls), `FoodSpot.menu`, `settings.mediaFolder`,
`EnrichOptions`, `ImportPipelineApi.enrichSpot/bulkEnrich`, `RATING_SOURCES`.

## 1. Neutral dashboard palette
The dashboard currently paints rings/strips in green/amber/red. Requirement: neutral.
- Rings/rectangles: single-hue — track stays `--background-modifier-border`, progress
  stroke `--interactive-accent` for the primary (Visited) ring and
  `--text-faint`/`--text-muted` tones for secondary cards (Want-to-try, Favorites).
  No green/amber/red anywhere in the dashboard.
- Coverage/dist bars: accent only. Rating-distribution bars: `--text-faint`.
- Status dots inside suggestion rows may keep the (user-configurable) status colors —
  they are data encoding, not decoration. Card badges elsewhere unchanged.

## 2. Bulk Google enrichment (photos + ratings + coords + address in one go)
- `enrichSpot`: resolve place via `google_place_id` else Find Place ("name city"),
  Details fields += `photos`. Download the FIRST photo via the Place Photo endpoint
  (maxwidth 640, follow redirect, arrayBuffer) → `vault.createBinary` into
  `settings.mediaFolder` as `<sanitized-name>.jpg` (suffix on collision) → set
  `photo` to that vault path. Fill-gaps-only unless `opts.overwrite`. Also updates
  google rating/count/place_id, coords, address, price, website, phone.
- Menu discovery (opts.menu): fetch the spot's website HTML, find the first
  `<a>` whose href or text matches /menu|menukaart|kaart|carte|speisekarte/i
  (same-host preferred), store absolute URL in `menu`.
- `bulkEnrich`: sequential, ≥400ms between spots, per-spot try/catch (one failure
  never aborts the run), progress callback + cancellation flag.
- UI: command **"Enrich all spots from Google"** + button in Settings → Data.
  Options modal first (checkboxes photo/ratings/coords/address/menu, overwrite
  toggle, spot-scope: all / missing-data-only / current-filter) with an explicit
  quota note ("~3 Google API calls per spot"). Progress rendered as a bar in the
  Spots toolbar area (count, current name, Cancel), matching WatchLog's import bar.
  Summary Notice at the end (updated / skipped / failed with names).

## 3. Map tab
- New 5th tab **Map** (icon `map`) between Places and Visits. Leaflet (bundled from
  npm; ships in dependencies) + OpenStreetMap tiles
  (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, attribution required).
- Markers: `L.divIcon` colored dots (status colors; favorite = ring outline) — no
  Leaflet default icon PNGs (they don't bundle). Popup: name, city, rating line,
  "Open" button → detail modal. Marker clustering NOT required at this scale;
  overlapping markers offset slightly (spiderfy not needed).
- Scope controls in a small toolbar: dropdowns **World / Country / City** built from
  the index (country list, city list); selecting fits bounds to matching spots
  (`map.fitBounds`, maxZoom 15). Status filter chips (want-to-try / visited /
  favorites). Count of unmapped spots shown: "12 spots have no coordinates —
  Enrich from Google" (button opens the enrich flow scoped to missing-coords).
- Leaflet CSS: esbuild concatStyles must append `node_modules/leaflet/dist/leaflet.css`
  before the fs styles. Dark-theme friendliness: apply a subtle
  `filter: brightness(0.9)` on tiles ONLY when body has `.theme-dark`.
- Map must handle: 0 spots with coords (empty state + CTA), resize (invalidateSize
  on tab activation + ResizeObserver), view destroy (map.remove()).

## 4. Menu
- `menu` frontmatter field (URL or vault path).
- Detail modal: Menu row in the info block — external URL → "Open menu" link;
  vault path (image/pdf) → inline preview (image embed / "Open in Obsidian").
- `## Menu` body section: preserved user content like Notes (NOT rewritten by the
  plugin — extend noteWriter's protected-section awareness only insofar as it
  already preserves unknown sections; no managed rewriting of ## Menu).
- Edit modal: menu field in Extra section. Enrichment fills it per §2.
- Card ⋮ menu gains "Open menu" when set.

## 5. Multi-source ratings (TripAdvisor / Yelp / TheFork)
- Frontmatter: `tripadvisor_url`, `yelp_url`, `thefork_url` (+ `yelp_rating`,
  `yelp_rating_count`, `thefork_rating`, `thefork_rating_count`).
- `refreshRatings` fetches, for each source URL present, the page via requestUrl and
  parses JSON-LD aggregateRating (existing jsonld.ts; bot-check detector applies —
  a bot-blocked source is skipped with a warning, not an error). Google via API as
  before. One `ratings_updated` stamp.
- URL auto-detection: importing/pasting a TripAdvisor/Yelp/TheFork URL on an
  existing-duplicate spot offers "Attach as rating source" (sets the url field +
  fetches rating) instead of creating a duplicate.
- Edit modal: Ratings & price section gains the three URL fields (with paste-URL
  hint). Detail modal external row lists ALL sources with values:
  `G 4.6 (1.2k) · TA 4.5 (210) · Yelp 4.0 (88) · TheFork 9.2 (145)` + Refresh.
  NOTE: TheFork rates on a 10-scale — store raw value, display "/10", never
  convert silently.
- Card meta: show Google + the single best-covered other source compactly.
- Settings → Quick info documents the sources and the URL-attach workflow.

## Constraints
- All v1.0 quality rules hold (accent-only theming, incremental renders, requestUrl
  only, confirm-before-destructive, contextual empty states, no dead settings).
- `npm run build` and `node tests/smoke.test.mjs` must stay green; smoke tests get
  new asserts for menu-link discovery (pure fn) and TheFork 10-scale handling.
