# Food Spot

An Obsidian plugin for tracking restaurants across countries: keep a wishlist, log
visits with ratings and spend, and see your own scores next to Google and TripAdvisor
ratings — all stored as plain markdown notes in your vault.

Created by **Iwan Hoogendoorn** and **Gaurav Mahadew**.

## Install

### With BRAT (recommended)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from the
   community plugins browser.
2. **BRAT → Add a beta plugin**, and paste `iwanhoogendoorn/foodspot`.
3. Enable **Food Spot** in Settings → Community plugins.

BRAT then keeps it up to date with each release.

### By hand

Download `main.js`, `manifest.json` and `styles.css` from the
[latest release](https://github.com/iwanhoogendoorn/foodspot/releases/latest) and
drop them in `<vault>/.obsidian/plugins/foodspot/`.

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
npm run dev            # watch build
npm run build          # type-check, then bundle
npm test               # pure-module smoke tests
npm run install-local  # copy the build into a vault, to try it before releasing
```

Source in `src/`, per-module CSS in `styles/`, concatenated at build in filename
order (Leaflet's stylesheet first, so every `fs-` rule can override it).

The repo root **is** the plugin folder: `manifest.json`, `main.js` and
`styles.css` sit there, which is the layout Obsidian loads and BRAT publishes.
`main.js` and `styles.css` are generated and gitignored — they ship as release
assets rather than being committed, so history does not carry a 1 MB bundle per
version. `manifest.json` is tracked, because it is the source of truth for the
plugin's id and version.

`npm run install-local` writes only those three files; your `data.json` —
settings, including the Google API key — is never touched.

Design docs: `docs/SPEC.md`, research in `docs/research/`. The v0.1 prototype and
its one-time JSON→notes migration are retired, and remain in git history.

## Releasing a new version

Two commands. The first moves the version, the second publishes it.

```bash
npm run bump -- minor   # patch | minor | major, or an exact version like 2.4.1
git commit -am "Release 2.2.0"
git push
npm run release
```

**Pick the level by what changed**, since this is the one part no script should
guess:

| Level | Use it for | Example |
| --- | --- | --- |
| `patch` | a fix, no new surface | star ratings would not set by touch |
| `minor` | new features, still compatible | dish photos on a visit, the photo viewer |
| `major` | a break — data shape, a removed setting | notes stored a different way |

`npm run bump` moves **all three** places the version is stated — `manifest.json`,
`package.json` and `versions.json` — in one step, because they had previously
drifted apart by being edited at different times. `versions.json` gains an entry
mapping the new version to the Obsidian version it needs, so an older app is
never offered a build it cannot run.

`npm run release` then refuses to publish unless the work is real: the tree must
be clean, commits pushed, and the tag must not already exist. It rebuilds from
scratch every time and re-reads the manifest afterwards, so a release can never
ship assets older than its own version number — the failure where users hit bugs
that were fixed weeks earlier. It publishes a GitHub release tagged with the
version, carrying `main.js`, `manifest.json` and `styles.css`.

Those tags are what BRAT installs: users on the latest get the update
automatically, and anyone who wants to stay put can pin a specific release.

The build refuses to run at all while `manifest.json` and `package.json`
disagree, so a half-finished bump fails loudly instead of shipping a build whose
version number is a lie.
