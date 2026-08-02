# WatchLog — Feature & UI Inventory (from watchlog-analyst)

Reference for the Food Spot rebuild. Patterns to mirror; line refs are to watchlog-main.pretty.js in this directory.

## Structure
- ONE registered ItemView, 8 tabs via .wl-tab-bar; one ribbon icon; 4 commands total (open-panel, add-title, insert-widget, search-title). Tab badges with counts; icon-only tabs on mobile with dot badges.
- Three virtualization systems: grid virtual scroller (ResizeObserver + rAF, column count from container width), binary-search windowed table rows, windowed timeline. IntersectionObserver triggers poster fetches only when a card scrolls into view.

## Card design (single shared builder `ze` @9766, CSS 7153–7440)
- .wl-card: aspect-ratio poster, border-radius 8, overflow hidden.
- Letter placeholder (title's first char, 3rem/700, white 0.85, text-shadow) on type-color background, pulsing while loading.
- <img> opacity 0→1 fade (0.2s) with explicit width/height attrs = zero layout shift.
- Status badge abs top-left (status color), flag badge top-right, ⋮ menu button opacity 0→1 on hover (always visible on mobile), bottom gradient scrim (transparent → rgba(0,0,0,0.85), padding-top 40px) with 2-line clamped title, meta row, progress bar.
- Hover lift: translateY(-2px) + shadow, 0.15s. Selection via ::after border (outline gets painted over).
- Group cards: collage of vertical poster strips with 2px gaps.
- Card text "under" or "inside" per tab (setting). Card size: 7-step slider mapping to min widths [100,120,140,160,185,215,250], separate desktop/mobile, applied as body CSS var --wl-card-min-width.

## Search query language (Ft @7443, regex @7381)
- terms AND across fields; `field:value` scoped; `"exact"` quoted; `a | b` OR; `-term` exclude; numeric `year:>2020`, `rating:>=4`. Fuse.js 7.3 bundled, threshold 0.24, ignoreLocation, per-field weights (title 0.6…). Aliases (dir→director, actor→cast).
- Search-tips modal attached via help-circle button next to every search box: colored token spans, live chip list of this tab's searchable fields. Debounce 200–250ms, fading × clear button.

## Filters & sort
- Custom dropdown panel; EXCLUSION sets (all on by default, switch off). Sections per facet; dynamic options (half-star rating options only if used). "Specials": exclusive/independent pseudo-filters (✦ Recently arrived, Empty, ◇ Groups only, Favorites).
- .wl-filter-dot on the Filters button when active + separate ✕ clear button. One saved filter preset with an active-highlight toolbar button.
- Sorting: primary + secondary key, each with direction; per-key sensible default direction.
- Selection mode: toolbar toggle, bulk delete (confirm), bulk status select, bulk add-to-group with inline create-new flow.
- Mobile: toolbar collapses into two swappable panes behind a chevron.
- All filter/sort state persists to settings.

## Stats (no chart library)
- Tier 1: ring (hand-built SVG, 120×120, r45, stroke-dasharray animated, rotate(-90)) or rectangle cards per type + a unified segmented strip. Dropped/unreleased excluded from ratio math (documented in-app).
- Tier 2: "More statistics" accordion with a multi-select source filter bar; metric rows; sorted label/value lists (Added Over Time, By Status, By Type, By Year with decade/year toggle, Time by Year, Top credits with configurable count).
- Suggestions: "Don't know what to watch next?" cards incl. Random with 🔀 in-place re-roll. Recently watched/added rows.

## Data entry
- Add = chooser modal (API search | from URL). URL flow: extract IMDb id, resolve, pre-fill.
- Add modal: type select re-routes to per-type API; 600ms debounced search; result tiles; DUPLICATE DETECTION in results: library indexed by external IDs + normalized title (NFKD, diacritics stripped) → `.is-in-library` + "✓ Watchlist" badge.
- searchGeneration counter cancels stale responses.
- Star rating widget (Ge @9702): half-stars by mouse half, hover preview repaint, click-current-value clears, user-editable 5 tier colors+labels, --wl-rating-color.
- Detail modal: inline-editable title (click h2 → input, Enter/Esc), clickable chips (click person → close modal, re-search library by them), notes textarea synced to note file, episode grid with per-season collapse + fill/clear-all.

## Widgets (6 processors, registry re-renders on `watchlog-data-changed` CustomEvent, prunes disconnected)
- wl-todo (title line, optional `mini`), wl-stat (watched/completed/remaining/time/…), wl-upcoming, wl-nowwatching, wl-now-next, legacy id-based.
- Insert palette: FuzzySuggestModal of 9 labeled variants → chained second fuzzy modal to pick title → replaceSelection.
- Inline .wl-widget-error with actionable text listing valid values. Settings section lists all syntaxes.

## Settings as product (gt/Os @29484)
- 9-section left-nav (not one scroll): General, API, Customize, Watchlist, Drafts, Custom Lists, Reading, Widgets, Quick Info.
- settingsGroup(): titled panel w/ icon, subtitle, live status chip ("OMDb · key set", ok/warn/pending tones).
- sgCard(): labeled card with ? toggle for inline help.
- apiProvider(): provider card — initials avatar, Active/Inactive badge, masked key fields with eye toggle, "Get a free key" external link, Test button that live-checks and repaints chip.
- Customize: theme swatch cards (accent-only theming: data-theme overrides 4 CSS vars, never background/text), card-size sliders, color pickers for every palette, rating tier editor with live preview.
- Quick Info: collapsible long-form in-app docs.

## Network layer
- ALL via requestUrl; 8s timeout race; per-provider throttle queues; poster fetch = single sequential queue with per-provider delay, manual override, "none" sentinel for known-missing. Lazy backfill of missing fields on detail-open guarded by in-flight Set.

## Vault integration (the storage model to mirror)
- Note per entry at {rootFolder}/{Type}/{sanitized}.md; generated frontmatter + `## Notes` section.
- Updates surgically rewrite ONLY frontmatter block + Notes section, preserving all other user content (rebuildWithFrontmatter @1786, replaceNotesSection @1822).
- Rename trashes old path, creates new. Delete via fileManager.trashFile. Watches external file changes and reads notes back.

## Flourishes
- Only 3 keyframes (poster pulse, chip pulse, spin); the rest transitions. Shelf scrollbars appear on hover. Contextual empty states everywhere (specific sentence per container). Hint banners w/ global disable. Status-bar count deep-links into a tab (desktop only). 60s scheduler fires Notices. Import progress bar with live count + Cancel. Confirm modal for every destructive action with explicit consequence string. 105 specific, actionable Notices. Mobile: keyboard-height latch via ResizeObserver, focus-in latches smallest height, releases 250ms after blur.
