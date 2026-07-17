# c6 — Site Ledger · FROZEN CONTRACT (read fully before writing code)

App: construction-site material & progress tracker. SvelteKit → Cloudflare Workers.
ALL data in Qdrant (single collection `c6`), files in R2, LLM/embeddings via OpenRouter.
Spec of record: `AGENTS.md`. This file is the interface contract for parallel builders.

## Golden rules

1. **snake_case** for all vars/functions. **Single-letter** keys for every DB payload,
   type def, request JSON, and page-load return value. `s` = kind discriminator.
2. Minimal code. No vars for single-use values. No abstractions beyond the task.
3. Never start a dev server. Never `wrangler deploy`. Build = `vite build`.
4. Every entity read/write MUST authorize: acting user in project `a[]` or owner `o`.
   Owner-only: delete, benchmark create, material create, invite regen.
5. Do NOT change any exported signature below. If one is wrong, flag it — don't edit it.

## Env access (server only)

`event.platform!.env` has secrets-store bindings (unwrap with `get_secret`) + R2 `R2`.
Locally, SvelteKit reads `.env` via `$env/dynamic/private`. Always build the env object
with `platform_env(event)` from `$lib/server/env` — it merges platform + dynamic and is
the ONLY way to read secrets. Never touch `process.env`.

Keys: QDRANT_URL, QDRANT_KEY, OPENROUTER_KEY, SECRET, GOOGLE_ID, GOOGLE_SECRET.
R2 binding: `R2` (bucket `c6-files`).

## Qdrant (see `$lib/server/qdrant.ts`)

- collection `C = 'c6'`, 4096-dim cosine. Zero vector `ZV` for non-searchable points.
- `qc(env)` → client. `ensure(env)` → create collection + payload indexes (idempotent).
- `uuid_from(sub)` deterministic user id. `new_id()` = crypto.randomUUID().
- helpers: `scroll(env, filter, limit?)`, `retrieve_one(env, id)`, `search(env, vector, filter, limit)`.
- Filter builder `f(...conds)` where cond = `eq('s','o')`, `eq('j', project_id)`, etc.

## Payload schema (all single-letter) — from AGENTS.md, authoritative

user `s:'u'` {g sub, n name, m email, p picture, d ts}
project `s:'p'` {n, l location, o owner_uid, a member_uids[] (INCLUDES owner), i invite_code, d ts}
  → membership query is simply `scroll(f(eq('s','p'), eq('a', uid)))` (Qdrant matches array-contains)
material `s:'m'` {j project_id, n, u unit, c category, d ts}
order `s:'o'` {j, t material_id, q qty, v supplier, d date_ts, x note, b by_uid}
receipt `s:'r'` {j, t, q qty, d ts, f r2_key, x note, b by}
usage `s:'g'` {j, t, q qty, w work_desc, k work_qty, d ts, x note, b by}
benchmark `s:'k'` {j, t material_id, w work_unit_label, q qty_per_1_work, e tolerance_pct, b by}
drawing `s:'f'` {j, n title, f r2_key, y content_type, d ts, b by}
milestone `s:'l'` {j, n title, c percent_0_100, f photo_key, x note, d ts, b by}

Indexes on: `s`, `j`, `t`, `g`, `i` (keyword).

## Server logic libs — FROZEN SIGNATURES (implemented by Worker A)

`$lib/server/projects.ts`
- `create_project(env, uid, n, l?) : Promise<{i:string, id:string}>`  (i = invite code)
- `my_projects(env, uid) : Promise<{id:string, n:string, l?:string, o:string, c:number}[]>`  (c = member count)
- `get_dashboard(env, id) : Promise<{p:Project&{id:string}, m:Mat[], s:Stock[], f:Flag[], r:Recent[]}>`
- `join_by_code(env, uid, c) : Promise<{id:string} | null>`
- `regen_invite(env, id) : Promise<{i:string}>`   (owner checked by caller)

`$lib/server/ledger.ts`
- `add_material(env, id, uid, {n,u,c?}) : Promise<{id:string}>`
- `add_order(env, id, uid, {t,q,v?,x?,d?}) : Promise<{id:string}>`
- `add_receipt(env, id, uid, {t,q,f?,x?}) : Promise<{id:string}>`
- `add_usage(env, id, uid, {t,q,w?,k?,x?}) : Promise<{id:string}>`
- `add_benchmark(env, id, uid, {t,w,q,e}) : Promise<{id:string}>`
- `add_milestone(env, id, uid, {n,c,f?,x?}) : Promise<{id:string}>`
- `ledger(env, id, t) : Promise<{o:Row[], r:Row[], g:Row[]}>`  (desc by d)
- `stock(env, id) : Promise<Stock[]>`  (per material: ordered/received/used/on-hand)
- `flags(env, id) : Promise<Flag[]>`   (discrepancies vs benchmarks & stock)
- `list_drawings(env, id) : Promise<Drawing&{id:string}[]>`
- `add_drawing(env, id, uid, {n,f,y}) : Promise<{id:string}>`
- `list_milestones(env, id) : Promise<(Milestone&{id:string})[]>`
- `delete_item(env, id, pid) : Promise<void>`  (owner checked by caller)

`$lib/server/ai.ts`
- `answer(env, id, q) : Promise<string>`  (grounded over recent site records via chat())

`$lib/server/r2.ts`
- `put_file(env, key, body, content_type) : Promise<void>`
- `get_file(env, key) : Promise<{body:ReadableStream, type:string, size:number} | null>`
- `file_key(project_id) : string`  → `p/<project_id>/<uuid>`

`$lib/server/access.ts`  (BUILT BY FABLE — frozen, do not edit)
- `get_project(env, id) : Promise<(Project&{id:string}) | null>`
- `require_member(env, id, uid) : Promise<Project&{id:string}>`  (throws 403 error otherwise)
- `require_owner(env, id, uid) : Promise<Project&{id:string}>`
- `member_of_key(key, uid) : boolean` — R2 key prefix guard placeholder (use require_member on `j`)

## API routes (Worker B) — thin wrappers over libs. All JSON keys single-letter.

Each POST/DELETE reads `event.locals.user` (401 if absent), parses `await request.json()`,
authorizes via access.ts, calls the lib fn, returns `json(result)`.
- `POST /api/project` {n,l} → {i,id} · `GET /api/project` → {p:[my_projects]}
- `GET /api/project/[id]` → get_dashboard
- `POST /api/join` {c} → {id} | 404
- `POST /api/project/[id]/material|order|receipt|usage|benchmark|milestone` → {id}
- `POST /api/project/[id]/drawing` {n,f,y} → {id}
- `POST /api/project/[id]/invite` → {i}  (owner)
- `GET  /api/project/[id]/ledger?t=<mat>` → {o,r,g}
- `GET  /api/project/[id]/flags` → {f:Flag[]}
- `DELETE /api/project/[id]/item/[pid]` → {ok:true}  (owner)
- `POST /api/upload?j=<id>` multipart `file` → {k}  (member; put to R2, key from file_key)
- `GET  /f/[...key]` → stream R2 (guard: user is member of project in key `p/<id>/..`)
- `POST /api/ai` {j,q} → {a}

## Pages (Worker C) — use $lib/components + design tokens. SSR via +page.server.ts load.

Load functions call the libs directly (server) and return single-letter keys.
Mutations POST to /api/** then `await invalidateAll()`.
- `/` landing (Fable) · `/login` (Fable) · `/app` sites list · `/app/new` create
- `/app/[id]` dashboard (Fable exemplar) · `/app/[id]/ledger` · `/app/[id]/drawings`
- `/app/[id]/progress` · `/app/[id]/settings`
Guard: `/app/**` requires `locals.user` (redirect to /login) — done in each load via `require_user`.

## Design language (see layout.css tokens)

"Field ledger": near-black `#0C0C0B`, safety-amber `#F5A623`, hairline borders
`rgba(255,255,255,.08)`, blueprint grid hints, Fraunces (display) + Space Grotesk (UI,
tabular numerals), uppercase micro-labels wide tracking, big numerals, staggered fade-up,
count-up numbers. Components: Nav, Shell, Card, Stat, Field, Btn, Modal, Toast, Empty,
Grid backdrop, count_up action, reveal action.

## Dispatch log
(orchestrator appends worker results here)

Worker D: created drawings, progress, settings — all 6 files under `src/routes/app/[id]/{drawings,progress,settings}/`, no other files touched. `+page.server.ts` for each just calls the frozen `list_drawings`/`list_milestones` lib fns (settings has none, relies on parent layout data). Drawings: crop-mark card grid (auto-fill 220px), image thumbs vs file-icon tiles for non-images, hidden `<input type=file>` + amber Upload Btn using the shared `upload_file`→`post` flow, owner-only ✕ delete. Progress: Stat+amber progress-bar header card (pct = max of milestone `c`), Modal-driven "Add milestone" with optional photo attach, vertical timeline (hairline + dot nodes) newest-first with percent badge/photo thumb/owner delete. Settings: three stacked Cards (Details, Invite w/ copy+owner-only regenerate, Team member count) with hairline dividers. All three use the `ago()` relative-time helper copied from the dashboard, `reveal`-staggered entrances, and existing components only (Card/Btn/Stat/Field/Modal/Empty/Icon) — no edits to any component, lib, or layout. Verified line lengths against `prettier.config.js` (printWidth 100, useTabs) by hand since local `npx prettier` output was unreliable in this shell (rtk proxy intercepts `find`/tool output); only over-length lines left are single unsplittable JSX-string attributes, matching existing precedent in `[id]/+page.svelte`. No dev/build run.

Worker A: implemented projects.ts, ledger.ts, ai.ts — no frozen signatures changed. Notes: added two extra (non-frozen) exports `compute_stock` and `compute_flags` to ledger.ts so `get_dashboard` in projects.ts can share the exact same stock/flag math instead of duplicating it (ledger.ts's own `stock()`/`flags()` wrappers just fetch + call these); `add_material` intentionally omits a `b` (by_uid) field since the frozen material payload schema `{j,n,u,c?,d}` has no `b` — matches AGENTS.md's field list exactly; invite code generator draws from `crypto.getRandomValues(new Uint8Array(6))` mapped mod alphabet.length over `'ABCDEFGHJKMNPQRSTUVWXYZ23456789'`; `ai.ts:answer` builds context from `stock()`+`flags()` (from ledger.ts) plus its own scroll of the 10 most recent orders/receipts/usages across the whole project, falls back to "The AI assistant isn't configured yet." only on empty string from `chat()` (a thrown `ai_unavailable` error from `chat()` on non-OK HTTP still propagates, per frozen `Promise<string>` — not swallowed, since spec didn't request a catch). No files touched other than the three stubs plus this log entry.

Worker B: created 17 API/file routes — all `+server.ts` under `src/routes/api/**`, `src/routes/f/[...key]/`. Each authorizes via `require_member`/`require_owner` from access.ts (404/403 thrown there) and 401s locally if `event.locals.user` missing, per RequestHandler pattern importing from `./$types`. Notes: `/api/upload` and `/api/ai` read the project id from the query string / body (`j`) since they have no `[id]` param, and both guard against a missing `j` with `error(400,'no_j')` before calling `require_member` (spec pseudocode passed `j` straight through, but it can be `null` from `searchParams.get`/an untyped body). `/f/[...key]` and `/api/project/[id]/ledger` follow the spec literally (`error(400)`/`error(404)` with no message on the file route; `error(400,'no_t')` when `t` query param is absent on ledger). No files touched outside `src/routes/**`; no dev/build run.

Worker C: created /app, /app/new, /app/[id]/ledger — matched the dashboard's design language (Shell, Card crop-marks, staggered `use:reveal`, hairline stock table, badge states, seg-control log-entry modal copied verbatim from `[id]/+page.svelte`). Notes: (1) `my_projects`/`ProjectCard` (frozen in projects.ts/types.ts) returns `{id,n,l,o,c}` with no `i` invite code, so the spec'd "amber invite chip (icon copy + p.i)" on each `/app` site card was dropped rather than editing the frozen lib/type — flagging per the golden rules instead of touching Worker A's signatures. (2) The icon set has no trash/delete glyph, so ledger detail-row delete buttons use a plain "✕" text button styled like `Modal.svelte`'s own close button, not an `<Icon>`. (3) Ledger page's stock rows are `<button class="tr">` (not `<a>`) that set local `sel` state and lazy-fetch `/api/project/[id]/ledger?t=` on select, auto-selecting from `?t=` in the URL on first load; re-fetches the open detail after a log-entry submit or delete targeting the selected material. No components/libs/other pages edited; did not run dev/build.
