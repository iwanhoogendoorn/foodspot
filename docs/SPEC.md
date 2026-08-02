# Food Spot v1.0 — rebuild specification

Restaurant tracker for Obsidian: catalog spots you want to try, log visits with ratings,
browse by country/city/cuisine, pull data + public ratings from Google and restaurant
websites. Rebuilt from the FoodSpots v0.1 prototype to match the feature depth and UI
polish of the WatchLog plugin (see `docs/research/` for both analysis reports).

## Identity

- Plugin id `foodspot`, display name **Food Spot**, version `1.0.0`, icon `utensils`.
- TypeScript source in `src/`, esbuild bundle emitted to `foodspot/` (main.js,
  manifest.json, styles.css). The old compiled `foodspots/` folder stays untouched until
  migration is verified, then is removed.
- Per-module CSS in `styles/*.css`, concatenated to `foodspot/styles.css` by the build.
- One registered `ItemView`, one ribbon icon, ~6 commands. No UI sprawl.

## Storage: one markdown note per restaurant (no JSON data blob)

A note is a Food Spot iff frontmatter `type: foodspot`. Index is built from
`metadataCache` and updated on vault events (create/modify/delete/rename), so external
edits (user, sync, AI tools) are picked up live. Plugin `data.json` holds settings only.

### Location & naming
- Setting `spotsFolder` (default `Food Spots`), optional `organizeByCountry` (default on)
  → `Food Spots/Netherlands/Momiji (Den Haag).md`. Filename = sanitized `Name (City)`,
  numeric suffix on collision. Rename/move of note by user is fine (index follows
  `type: foodspot`, not paths).

### Frontmatter schema
```yaml
type: foodspot
name: Momiji
cuisines: [Japanese, Sushi]
country: Netherlands
city: Den Haag
district: Scheveningen        # optional
address: Full street address   # optional
location: "52.0808,4.2889"     # optional; obsidian-map-view compatible
status: want-to-try | visited
favorite: false
rating: 4.5                    # personal, 0.5–5 half steps; auto = avg of visit ratings unless manually overridden (ratingLocked: true)
price: 2                       # 1–4 tier, optional
url: https://…                 # optional
phone: "+31 …"                 # optional
source: manual | google-maps | tripadvisor | url
source_url: https://…          # optional
google_rating: 4.6             # optional, plus google_rating_count, google_place_id
tripadvisor_rating: 4.0        # optional, plus tripadvisor_rating_count
ratings_updated: 2026-08-02    # when external ratings were last fetched
photo: https://… or vault path # card image; optional
visit_count: 3                 # derived
last_visit: 2026-07-12         # derived
tags: [date-night]
legacy_id: momiji-j1bvm        # only on migrated spots; migration idempotency key
created: 2026-08-02
updated: 2026-08-02
```

### Note body
```markdown
## Notes
free-form text (synced with the detail modal's notes box)

## Visits
- [date:: 2026-07-12] [rating:: 4.5] [spent:: 45] Great omakase, sat at the bar
```
- Visits = bullet lines under `## Visits` with Dataview-style inline fields
  (`date` required ISO, `rating` optional 0.5–5, `spent` optional number, rest of the
  line is the visit note). Human-readable, AI-parsable, Dataview-queryable.
- WRITE DISCIPLINE (mirrors WatchLog): frontmatter writes via
  `app.fileManager.processFrontMatter`; body updates surgically rewrite only the
  `## Notes` and `## Visits` sections and preserve all other user content. Delete goes
  through `fileManager.trashFile` (recoverable), always behind a confirm modal with an
  explicit consequence sentence. Derived fields (`visit_count`, `last_visit`, `rating`
  unless `ratingLocked`) recomputed on visit changes.

### Migration from v0.1 JSON
- Command **"Food Spot: Migrate legacy JSON spots to notes"** + auto-prompt on load when
  `spots[]` found in plugin data. One note per spot; idempotent via `legacy_id`; maps all
  v0.1 fields (visits → visit bullets, notes → `## Notes`, photos → `photo` +
  `## Photos` list, externalRating → google_* fields, status `favorite` →
  `status: visited` + `favorite: true`). `spots` key stripped from data.json only after
  every note is verified written; a backup `data.json.pre-migration.bak` is written
  inside the plugin folder first. Never deletes or overwrites an existing note.

## UI — one view, four tabs (WatchLog shell)

Tab bar with Lucide icons, count badges where meaningful, icon-only + dot badges on
mobile. Tabs: **Dashboard** (`layout-dashboard`), **Spots** (`utensils`), **Places**
(`map-pin`), **Visits** (`history`).

### Shared card builder (the cornerstone — build once, use everywhere)
- Aspect 4/3 photo card: letter placeholder tinted by a deterministic cuisine color while
  loading (first char of name, 3rem/700, pulse), `<img>` opacity 0→1 fade with explicit
  dimensions (zero layout shift), lazy-loaded via IntersectionObserver +
  sequential fetch queue with a `"none"` sentinel for missing photos.
- Status badge top-left (want-to-try amber / visited green), ★ favorite top-right,
  price tier `€€` chip, hover-revealed `⋮` menu (always visible on mobile).
- Bottom gradient scrim: 2-line clamped name, cuisine chips row, meta row = my ★rating +
  `G 4.6 (1.2k)` external rating + "last visit 3 mo ago" / "added 2 w ago".
- Hover lift translateY(-2px)+shadow; selection via `::after` border.
- Card size: 7-step slider (min-widths 100–250px), separate desktop/mobile, body CSS var.
- Card click → detail modal; `⋮` menu: Open note, Edit, Log visit, Toggle favorite,
  Open website, Open in Google Maps, Refresh ratings, Delete (confirm).

### Spots tab
- Toolbar: search box (see query language) + help-circle tips button, Filters dropdown
  (exclusion sets: Status, Cuisine, Country, City, Price, Rating w/ dynamic options +
  "Empty" specials; Favorites independent toggle), active-filter dot + ✕ clear, one
  saved filter preset button, two-level sort (primary+secondary keys: Name, Rating,
  External rating, Price, Date added, Last visit, Visit count; per-key default
  direction), cards/table view toggle, Select mode (bulk: status change, tag add,
  delete w/ confirm), Add button, Import button.
- Card grid virtualized (ResizeObserver + rAF windowing) — must stay smooth at 1000 spots.
- Table view: virtualized rows — Name, Cuisine, City, Price, My ★, Google ★, Visits,
  Last visit.
- Search query language: free terms fuzzy-AND across fields; `cuisine:`, `city:`,
  `country:`, `district:`, `tag:`, `status:`, `dish:` (searches visit notes),
  `price:<=2`, `rating:>=4`, `google:>=4.5`, `visits:>0`, quoted exact, `|` OR,
  `-term` exclude. Fuzzy via bundled Fuse.js (threshold 0.24, weighted fields, name 0.6).
  Tips modal listing this tab's fields with colored token examples. 250ms debounce,
  focus is NEVER lost (incremental render only — no full-view rebuilds on input).

### Dashboard tab
- Top: stat cards (rings or rectangles, setting) — Visited ring (% of all spots),
  Want-to-try count, Favorites, unified strip: total spots · countries · cities ·
  cuisines · visits logged.
- "More statistics" accordion: By Country, By City, By Cuisine (top N + coverage
  visited/total bars), By Price tier, My-rating distribution, Visits per month/year
  (label/value lists + CSS bars — no chart library), Top-rated spots, Most-visited spots.
- Suggestions — "Where do we eat tonight?": Random want-to-try card with 🔀 in-place
  re-roll + optional city dropdown filter; "Longest on the list" (oldest want-to-try);
  "Back for more?" (top-rated visited not visited in >90 days).
- Recently visited + Recently added rows (compact card rows).
- Contextual empty states everywhere, each with a specific sentence and a CTA button
  (first-run: "Add your first spot" / "Import from a URL").

### Places tab
- Location tree Country → City → District that SKIPS missing levels (v0.1 broke here),
  counts per node, visited/total coverage bar per node, click a node → jumps to Spots
  tab with that location filter applied.

### Visits tab
- Virtualized timeline grouped by day: colored rating dot + connector line, spot name
  (click → detail modal), ★rating, spent, note text. "Log visit" button. Badge = visits
  this month.

### Detail modal (per spot)
- Photo header (or tinted placeholder), inline-editable name (click → input,
  Enter/Esc), status control, favorite toggle, star rating widget (half-stars by mouse
  half, hover preview, click-current-to-clear, 5 user-editable tier colors/labels),
  price selector, cuisine + tag chips (click chip → close modal, run that filter in
  Spots), address block with **Open in Google Maps** + **Open website** + copy buttons,
  phone, external ratings row (`G 4.6 · 1,234 reviews · TA 4.0` + Refresh button +
  stale indicator after `staleRatingThresholdDays`), Visits section (list + inline
  add/edit/delete), Notes textarea (two-way sync with `## Notes`), Open note button.

### Add / edit flow
- Add = chooser: **Search online** (Google Places text search when key set), **From
  URL**, **Manual**.
- Online search results as tiles (name, address, rating, price) with duplicate
  detection: existing library indexed by `google_place_id` + normalized name (NFKD,
  diacritics stripped) → "✓ Already saved" badge on matches. Stale responses cancelled
  via a generation counter.
- Manual form: grouped sections (Essentials / Location / Ratings & price / Extra),
  autocomplete from existing values for cuisines, tags, city, district, country;
  "lat, lng" paste support on a single location field; clearing coordinates clears the
  pair; inline per-field validation (no Notice walls).
- Import review modal (when `reviewBeforeSave` on — and the setting actually works):
  editable pre-filled form, confidence styling on parsed fields, duplicate banner
  (name similarity AND distance-aware: same name far apart ≠ duplicate) with
  Merge / Keep as new. `reviewBeforeSave` off → direct save + Notice with Undo button.
  External ratings SURVIVE the save (v0.1 dropped them).

## Import & external data

All network via `requestUrl`, 8s timeout race, per-provider throttle. Bot-check
detection (cf-challenge, recaptcha, "just a moment") on every importer.

1. **Google Maps URL** (`maps.app.goo.gl`, `google.com/maps`): resolve short links
   FIRST (follow redirect), then parse `@lat,lng` + place slug from the resolved URL,
   og:title fallback → Places enrichment when key set.
2. **Google Places** (key in settings, provider card w/ Test button): Text Search from
   the Add modal; Find Place + Details (fields: name, formatted_address,
   address_components, geometry, price_level, rating, user_ratings_total, website,
   international_phone_number, place_id) for URL imports with coords.
3. **TripAdvisor URL**: JSON-LD (`Restaurant`/`FoodEstablishment`/`LocalBusiness` —
   aggregateRating, address, geo, servesCuisine, priceRange) + og: fallback.
4. **Generic URL**: JSON-LD first (most restaurant sites embed schema.org), then
   OpenGraph. Sets `photo` from og:image / JSON-LD image.
5. **Refresh external ratings**: per-spot (⋮ menu / detail modal) and bulk command,
   sequential + throttled, updates `google_*`/`tripadvisor_*` + `ratings_updated`.
   Stale badge on cards/detail after `staleRatingThresholdDays`.

## Widgets — ```foodspot``` code blocks

Line-based `key: value` params. `view: cards | list | table | stat | random |
shortlist`. Filters: `country, city, district, cuisine, status, tag, price, minRating,
favorite, limit, sort, direction`. `random` = one pick + 🔀 re-roll in place;
`shortlist` = compact want-to-try list for a city; `stat` = one stat card
(`stat: visited-ratio | counts | top-cuisines`).
- Insert via command → FuzzySuggestModal of labeled variants → writes a filled example
  fence (never an empty block).
- Live re-render on a `foodspot-data-changed` CustomEvent; registry prunes disconnected
  elements. Unknown keys/values render an inline widget error listing valid options.

## Settings — navigator layout (WatchLog style)

Left-nav sections, `settingsGroup` panels with icon + live status chip, `?` inline help:
- **General**: spots folder, organize-by-country, default country, currency symbol,
  date format, half-star ratings, stale-rating threshold.
- **Data**: migration button + status, regenerate/rewrite note frontmatter, export CSV/
  JSON (written INTO the vault, filtered-vs-all made explicit), backup/restore note.
- **API**: Google Places provider card (masked key, eye toggle, "Get a key" link, Test
  button, Active/Inactive chip, plaintext-storage warning).
- **Customize**: card size sliders (desktop/mobile), card text under/inside, status
  colors, rating tier labels+colors (live preview), cuisine color palette.
- **Import**: duplicate detection toggle + radius, review-before-save (WIRED UP).
- **Widgets**: syntax reference for every widget.
- **Quick info**: collapsible in-app docs (how ratings derive, how visits parse, how
  migration works).

EVERY setting must be read somewhere. No dead controls (v0.1 had four).

## Quality bar
- TypeScript strict; esbuild; only runtime dep bundled is Fuse.js.
- Accent-only theming: all colors from Obsidian CSS vars; never override background/text.
- Mobile: `isDesktopOnly: false` honestly — icon tabs, always-visible menus, collapsing
  toolbar, keyboard-height handling.
- No full-view re-renders on input events, ever. Incremental DOM updates.
- Confirm modal + specific consequence text for every destructive action; deletes are
  trash-recoverable; Notices specific and actionable.
- Contextual empty states for every empty container.
