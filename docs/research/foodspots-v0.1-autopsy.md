# FoodSpots v0.1 — autopsy (what the rebuild must not repeat)

Compiled plugin lives in `foodspots/` (untouched until migration verified). Real user
data: `foodspots/data.json` — 102 spots, all Netherlands, all `want-to-try`,
all `source: manual`; 81 have `sourceUrl`; districts on 72 (57 distinct); cuisines 52
distinct (needs autocomplete, not free text); tags: `favorites` (14),
`multiple-locations` (4); one duplicate name ("Ted's"). No visits, ratings, coords,
addresses, or photos anywhere.

## Legacy JSON spot schema (migration input)
`id` (slug+random), `name`, `cuisines[]`, `priceTier?` (1–4), `country`, `region?`,
`city?`, `district?`, `address?`, `coordinates? {lat,lng}`, `source`
(manual|google-maps|tripadvisor|yelp|other), `sourceUrl?`, `status`
(want-to-try|visited|favorite — favorite is a STATUS here; migrate to
`status: visited` + `favorite: true`), `personalRating?` (0.5–5),
`visits[] {date, notes?, rating?}`, `tags[]`, `notes` (string),
`photos[] {path, isLocal, caption?}`, `externalRating? {rating, scale, reviewCount?,
fetchedAt, source}`, `createdAt`/`updatedAt` ISO.

## Confirmed defects (never reintroduce)
1. Search input rebuilt the whole view per keystroke → focus lost every character.
2. Location tree `break`s at first empty hierarchy level → one-node tree on real data.
3. Imported `externalRating` dropped on new-spot save (form state lacked the key).
4. Coords parsed from the un-resolved URL → `maps.app.goo.gl` share links never enrich.
5. Dead settings: `uiDensity`, `staleRatingThresholdDays`, `dataFilename`,
   `reviewBeforeSave` — written, never read.
6. Photos collectable but rendered nowhere.
7. `sourceUrl` never rendered as a link; only location affordance was "Copy coordinates".
8. Cards: four grey text lines, no tags/visit count/photo/notes preview.
9. Modal: flat 17-row Setting stack; clearing one coordinate box wrote `0` (spot
   relocates to the Gulf of Guinea); validation = multi-error Notice wall.
10. Delete: one click, no confirm, permanent.
11. Free text everywhere → 52 cuisine chips rendered as a wall.
12. Empty state identical for "no data" and "over-filtered".
13. Widget errors only in console; empty starter block; widgets never re-render.
14. Filter semantics inconsistent (cuisine OR, tags AND); min-rating silently excluded
    unrated spots.
15. Export via Blob+a.click (broken on mobile); toolbar export = filtered,
    command export = all, same label.
16. Duplicate name-match ignored distance (chains always flagged); bot-check detection
    only on Yelp importer.
17. Debounced save not awaited on unload → possible loss of last edit.
