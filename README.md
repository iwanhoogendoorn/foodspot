# Food Spot

An Obsidian plugin for tracking restaurants across countries: keep a wishlist, log
visits with ratings and spend, and see your own scores next to Google and TripAdvisor
ratings — all stored as plain markdown notes in your vault.

Created by **Iwan Hoogendoorn** and **Gaurav Mahadew**.

## Why notes, not a database

Every restaurant is one markdown note with frontmatter (`type: foodspot`), so your data
works with Obsidian search, Dataview, Bases, graph view, obsidian-map-view
(`location` field), sync, and any AI tool that can read markdown. Visits are readable
bullet lines with inline fields:

```markdown
## Visits
- [date:: 2026-07-12] [rating:: 4.5] [spent:: 45] Great omakase, sat at the bar
```

The plugin's `data.json` holds settings only.

## Features

- **One view, four tabs** — Dashboard (ring stats, "Where do we eat tonight?"
  suggestions, recents), Spots (card grid / table), Places (country → city → district
  tree with coverage bars), Visits (timeline).
- **Search query language** — `cuisine:sushi city:rotterdam rating:>=4 -tag:chain`,
  quoted exacts, `|` OR, numeric comparators, fuzzy free text. Built-in syntax tips.
- **Exclusion-set filters** with a saved preset, two-level sorting, bulk select mode.
- **Import from URL** — Google Maps links (short links resolved), TripAdvisor, or any
  restaurant site with schema.org/OpenGraph markup. Optional Google Places enrichment
  (API key): address, price tier, public rating + review count.
- **External ratings alongside yours**, with staleness indicator and refresh.
- **Duplicate detection** — distance-aware, on both import and manual add.
- **Embeddable widgets** — ```` ```foodspot ```` code blocks (cards / list / table /
  stat / random pick / city shortlist) that live-update, inserted via a fuzzy palette.
- **Safe by design** — deletes go to trash behind a confirm, note edits rewrite only
  the managed sections, migration backs up before touching anything.

## Development

```bash
npm install
npm run build    # tsc strict + esbuild → foodspot/
node tests/smoke.test.mjs
```

Source in `src/`, per-module CSS in `styles/` (concatenated at build). The compiled
plugin is `foodspot/` — copy or symlink it into `<vault>/.obsidian/plugins/foodspot/`.

The v0.1 prototype and its one-time JSON→notes migration are retired; both
remain available in git history if ever needed.

Design docs: `docs/SPEC.md`, research in `docs/research/`.
