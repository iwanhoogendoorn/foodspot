# Changelog

All notable changes to Food Spot are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Releases before this file existed are summarised from their release commits.

## [Unreleased]

## [2.7.0] — 2026-10-26

### Added

- Visits are now full CRUD over the local HTTP API. Every visit carries a
  stable `id` in `GET /visits`, `GET /spots/<ref>/visits` and `GET /spots/<ref>`,
  and three new routes act on it: `GET /visits/<id>` reads one,
  `PATCH /visits/<id>` edits `date`, `spent`, `rating` or `note`, and
  `DELETE /visits/<id>` removes one. Unknown fields are refused with `400`
  rather than ignored, and unknown ids answer `404`.
- `src/api/visitIds.ts`: visits have no id of their own in the markdown, so one
  is derived from the spot path, the date and which visit that day it is. An id
  survives new visits being logged; editing a visit's date mints a new one,
  which comes back in the reply.

### Changed

- `PATCH /visits/<id>` merges into the existing visit instead of replacing it,
  so dish photos and untouched fields survive a partial edit. `spent` and
  `rating` accept `null` to clear them.

## [2.6.0] — 2026-09-14

### Added

- **Listen on** setting for the local HTTP API: *This Mac only* (default,
  unchanged behaviour), *This Mac + Tailscale address*, or *All interfaces*.
  The Tailscale choice also binds `127.0.0.1`, so local scripts keep working,
  and serves this Mac while the tailnet comes up, rechecking every 30 seconds.
- **Allow writes from other devices** setting, off by default: a non-`GET`
  request from a non-loopback peer answers `403`. The toggle applies live, an
  unknown peer counts as remote, and a remote caller outside `/foodspot/v1`
  gets a bare `404`. Requests from the host machine are never limited.

### Fixed

- API restarts are serialized and wait for the previous server to close, so
  rapid port edits can no longer orphan a listening server. A failed bind on
  one address now closes the others.

## [2.5.1] — 2026-09-04

### Added

- Google's `business_status` is stored as `permanently_closed`. A closed
  restaurant stays in the library and stays pullable — the tool records where
  you have been — but the card shows "Permanently closed" instead of a
  clock-based "Closed", and the pull notice explains an empty result.
- Street View façade fallback for listings with no place photos, queried by
  address and restricted to official Google imagery.
- Three-way **Permanently closed** filter (Include / Hide / Only closed), a
  `closed:yes|no` search token and a `closed:` widget key.

## [2.5.0] — 2026-09-02

### Added

- Local HTTP API on `127.0.0.1:27126` under `/foodspot/v1`, off by default and
  authenticated with a bearer token: health, stats, spot list/create/patch/
  delete with filters, visit logging, and a flat visit feed. See `docs/api.md`.

## [2.4.0] — 2026-08-19

### Added

- Stats tab: a sortable per-restaurant table with visit counts, totals,
  averages and first/last visits, plus sparklines that expand into a full
  spend chart per restaurant.

## [2.3.0] — 2026-08-12

### Added

- Drill-down modals on dashboard statistics.

## [2.2.0] — 2026-08-12

### Added

- Bulk enrichment from the toolbar and a Milestones panel.

## [2.1.0] — 2026-08-07

### Added

- Mobile support, visit photos and the photo viewer.

[Unreleased]: https://github.com/iwanhoogendoorn/foodspot/compare/2.7.0...HEAD
[2.7.0]: https://github.com/iwanhoogendoorn/foodspot/releases/tag/2.7.0
[2.6.0]: https://github.com/iwanhoogendoorn/foodspot/releases/tag/2.6.0
[2.5.1]: https://github.com/iwanhoogendoorn/foodspot/releases/tag/2.5.1
[2.5.0]: https://github.com/iwanhoogendoorn/foodspot/releases/tag/2.5.0
[2.4.0]: https://github.com/iwanhoogendoorn/foodspot/releases/tag/2.4.0
[2.3.0]: https://github.com/iwanhoogendoorn/foodspot/releases/tag/2.3.0
[2.2.0]: https://github.com/iwanhoogendoorn/foodspot/releases/tag/2.2.0
[2.1.0]: https://github.com/iwanhoogendoorn/foodspot/releases/tag/2.1.0
