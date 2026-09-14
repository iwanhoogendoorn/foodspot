# Food Spot — local HTTP API

The same pattern as Helm's API: an HTTP server inside Obsidian, off by
default, loopback-only unless you choose otherwise, every request
authenticated with a bearer token. It exists so
scripts and tools on this machine can read the library and log visits without
touching markdown by hand — every write goes through the same `SpotStore`
mutations the UI uses, so derived fields (`visit_count`, `last_visit`, rating
derivation) and change events stay consistent.

## Switching it on

Settings → Food Spot → **API** → *Local HTTP API*. Enabling it the first time
generates a token (stored in the plugin's `data.json`, like the Google key —
treat it like a password; it is never logged and must never be committed).

- **Listen on** (default *This Mac only*):
  - *This Mac only* binds 127.0.0.1. Nothing on the network can connect.
  - *This Mac + Tailscale address* binds 127.0.0.1 **and** this machine's
    tailnet address (100.64.0.0/10), so local scripts keep working and the
    tailnet traffic is encrypted by WireGuard. If Tailscale isn't up when
    Obsidian starts, the API serves 127.0.0.1 and checks again every 30 s.
  - *All interfaces* binds 0.0.0.0. **This is plain HTTP**: on a network you
    don't control, anyone watching traffic can copy the token. Settings shows
    a red warning and keeps the status chip amber while it runs this way.
- **Other devices are read-only** by default. A request whose TCP peer is not
  loopback gets `403` for any method other than `GET`/`HEAD`, unless *Allow
  writes from other devices* is on. Requests from this Mac are never limited,
  and the toggle applies immediately. A remote caller that hits a path outside
  `/foodspot/v1` gets a bare `404`, with no hint about what is listening.
- Default port **27126** (Helm sits on 27125); configurable.
- Runs only while Obsidian is open and the toggle is on; torn down on unload.
- Desktop only — mobile Obsidian has no `node:http`.

## Requests

- Base path: `http://127.0.0.1:27126/foodspot/v1`
- Auth: `Authorization: Bearer <token>` on every request → `401` otherwise.
- Bodies are JSON. Errors are JSON: `{ "error": "message" }` with `400`
  (invalid input), `403` (write from another device while network writes
  are off), `404` (no such spot/route), `405`, `413`, `500`.

A spot is referenced by, in order of resolution: its vault path
(`60 FOOD/Food Spot/Netherlands/Harput (Den Haag).md`), its path relative to
the spots folder (`Netherlands/Harput (Den Haag).md`, `.md` optional), its
note basename (`Harput (Den Haag)`), or its **unique** name (`Harput`). An
ambiguous name is a `400` listing the candidate paths. URL-encode as usual —
spaces and parens are fine.

## Routes

| Method + path | What it does |
| --- | --- |
| `GET /health` | `{ ok, version, ready, today, counts: { spots, visited, wantToTry, visits, countries } }` |
| `GET /stats` | Library totals: spots/visited/wantToTry/favorites, visits, totalSpent, countries, cities, byCountry, top-10 most visited |
| `GET /spots` | List (no visit bullets). Filters: `status=visited\|want-to-try\|all`, `country`, `city`, `cuisine`, `tag`, `favorite=true`, `minRating`, `q` (substring on name/city/country/cuisine), `limit` (default 500, max 1000) |
| `POST /spots` | Create. Body: `name` (required), `country` (default: settings default country), `city`, `cuisines` (string or array), `status` (default `want-to-try`), `favorite`, `rating`, `price` 1–4, `address`, `location` `{lat,lng}`, `url`, `phone`, `menu`, `tags`, `notes` → `201 { spot }` |
| `GET /spots/<ref>` | Full spot, visits included |
| `PATCH /spots/<ref>` | Update any of the POST fields plus `district`. `rating` locks the personal rating; `rating: null` unlocks it (back to visit-derived). Nullable fields clear with `null`. Renaming changes frontmatter only — the file path (the identity) stays |
| `DELETE /spots/<ref>` | Trash-deletes the note → `{ deleted: path }` |
| `GET /spots/<ref>/visits` | Just the visits |
| `POST /spots/<ref>/visits` | Log a visit: `date` (default today), `spent` ≥ 0, `rating` 0.5–5 in half steps, `note` → `201` |
| `GET /visits` | Flat visit list across all spots, newest first. Filters: `from`, `to` (ISO dates), `limit` (default 100) |

## Examples

```sh
TOKEN=…   # Settings → API → Local HTTP API → Copy
BASE=http://127.0.0.1:27126/foodspot/v1

curl -s $BASE/health -H "Authorization: Bearer $TOKEN"

# Where have I not been yet in Rotterdam?
curl -s "$BASE/spots?status=want-to-try&city=Rotterdam" -H "Authorization: Bearer $TOKEN"

# Log tonight's dinner
curl -s -X POST "$BASE/spots/Harput/visits" \
  -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"spent": 47.5, "rating": 4, "note": "iskender"}'

# A new place to try
curl -s -X POST $BASE/spots \
  -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"name": "Ramen Ya", "city": "Rotterdam", "cuisines": ["Japanese"]}'
```

## Source

- `src/api/server.ts` — plumbing: bind, auth, body limits (mirrors Helm's).
- `src/api/addresses.ts` — pure bind plan and loopback/Tailscale detection;
  tested in `tests/smoke.test.mjs` (group 18).
- `src/api/routes.ts` — the routes, a pure function; tested in
  `tests/smoke.test.mjs` (group 17).
