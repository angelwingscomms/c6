# c6 — Site Ledger (construction site material & progress tracker)

Web app for small residential developers: track materials ordered → received → used per site, engineer benchmarks (e.g. bags of cement per 100 blocks), automatic discrepancy flags, drawing storage, progress milestones. SvelteKit on Cloudflare Workers; ALL data in Qdrant; files in R2; LLM/embeddings via OpenRouter.

## Code Style

- Naming: always snake_case for vars/functions; db payload, type defs, request JSON and page load return value keys always single letters.
- Conciseness: no vars for single-use; code minimally.
- never start the dev server
- fonts go in static/fonts

## Env

- **ALWAYS use `.env` in this project root for all local env vars/secrets — NEVER `.dev.vars`.** SvelteKit reads `.env` via `$env/dynamic/private`; in production Workers bindings arrive via `event.platform!.env` (secrets store bindings may be objects with async `.get()` — always unwrap with `get_secret()` from `$lib/server/qdrant`).
- Keys: QDRANT_URL, QDRANT_KEY, OPENROUTER_KEY, SECRET, GOOGLE_ID, GOOGLE_SECRET.

## Build / Deploy

- Build command: `pnpm build` → `vite build` only. NEVER put `wrangler types` in the build script — breaks Workers Builds CI.
- Deploy = push to GitHub (`angelwingscomms/c6`) → Cloudflare Workers Builds. **NEVER run `wrangler deploy`.**

## Data model — Qdrant

Single collection **`c6`**, vectors 4096-dim cosine (`qwen/qwen3-embedding-8b` via OpenRouter). Points that don't need semantic search use zero vector `ZV`. Point IDs are UUIDs (`crypto.randomUUID()`); users use `uuid_from(google_sub)` (deterministic SHA-256 → UUID) so lookups by google sub need no search.

Payload field `s` = kind discriminator. All fields single letters:

| kind | s | fields |
|------|---|--------|
| user | `u` | `g` google sub, `n` name, `m` email, `p` picture, `d` created ts |
| project (site) | `p` | `n` name, `l` location, `o` owner uid, `a` member uids [], `i` invite code, `d` ts |
| material | `m` | `j` project id, `n` name, `u` unit (bags/pcs/m), `c` category, `d` ts |
| order | `o` | `j`, `t` material id, `q` qty, `v` supplier, `d` date ts, `x` note, `b` by uid |
| receipt | `r` | `j`, `t`, `q` qty received, `d` ts, `f` photo r2 key, `x` note, `b` by |
| usage | `g` | `j`, `t`, `q` qty used, `w` work desc, `k` work qty (e.g. 200 blocks), `d` ts, `x` note, `b` by |
| benchmark | `k` | `j`, `t` material id, `w` work unit label (e.g. "blocks laid"), `q` material qty per 1 work unit, `e` tolerance % , `b` by |
| drawing | `f` | `j`, `n` title, `f` r2 key, `y` content type, `d` ts, `b` by |
| milestone | `l` | `j`, `n` title, `c` percent 0-100, `f` photo r2 key, `x` note, `d` ts, `b` by |

Usage/receipt/order points get a real embedding of their text (`w`/`x`/material name) when OPENROUTER_KEY present; else ZV. Payload keyword indexes exist on `s`, `j`, `t`, `g`, `i`.

Access rule: every entity read/write checks the acting user is in project `a` (or owner `o`). Owner-only: delete, benchmarks, invite regen, material create.

## API surface (all JSON keys single-letter)

- `GET /login/google` → OAuth start · `GET /google` → callback · `POST /logout`
- `POST /api/project` `{n,l}` → `{i}` · `GET /api/project` → my sites
- `GET /api/project/[id]` → `{p, m[], s{mat:stock}, f[] flags, r[] recent}`
- `POST /api/join` `{c}` → join by invite code
- `POST /api/project/[id]/material|order|receipt|usage|benchmark|milestone` — create (fields per schema)
- `GET /api/project/[id]/ledger?t=<mat>` → `{o[],r[],g[]}` sorted desc
- `GET /api/project/[id]/flags` → computed discrepancies
- `POST /api/upload?j=<id>` multipart `file` → `{k}` (R2 key `j/<project>/<uuid>`)
- `GET /f/<key>` → stream R2 (member-checked via key prefix)
- `POST /api/ai` `{j,q}` → `{a}` — grounded answer over recent site records
- `DELETE /api/project/[id]/item/[pid]` — owner only

## Pages

`/` landing · `/login` · `/app` sites · `/app/new` · `/app/[id]` dashboard · `/app/[id]/ledger` · `/app/[id]/drawings` · `/app/[id]/progress` · `/app/[id]/settings`

## Design

Premium "field ledger" aesthetic: near-black `#0C0C0B`, safety-amber accent `#F5A623`, hairline borders (`rgba(255,255,255,.08)`), blueprint grid hints, Fraunces (display serif) + Space Grotesk (UI/numerals, tabular), uppercase micro-labels w/ wide tracking, big numerals, staggered fade-up motion, count-up numbers. Fonts self-hosted in `static/fonts`.
