# c6 — Site Ledger

Material & progress control for small residential builders. Track every material from
**order → delivery → usage**, hold the site to engineer benchmarks, and surface
discrepancies (negative stock, over-delivery, waste) the moment they happen — plus
drawings, milestones and a grounded AI site assistant.

Built as a single **SvelteKit** app on **Cloudflare Workers**.

## Stack

- **SvelteKit** (Svelte 5 runes) + Cloudflare adapter → Cloudflare Workers
- **Qdrant** — the only datastore. One collection (`c6`), single-character payload fields,
  kind discriminator `s`. Semantic search over order/receipt/usage notes.
- **Cloudflare R2** — drawings & site photos (`c6-files` bucket)
- **OpenRouter** — `qwen/qwen3-embedding-8b` embeddings + chat for the AI assistant
- **Google OAuth** (arctic) — sign-in; HMAC-signed session cookie
- Secrets via **Cloudflare Secrets Store** in production, `.env` locally

## Develop

```sh
pnpm install
pnpm build      # vite build — this is what CI runs
pnpm check      # types
```

Local secrets live in `.env` (see `.env.example`). Never commit `.env`.

## Deploy

Push to `main` → **Cloudflare Workers Builds** builds (`pnpm build`) and deploys.
**Never run `wrangler deploy`.** Bindings (R2, secrets store) are declared in `wrangler.jsonc`.

## Architecture

- `src/lib/server/*` — Qdrant helpers, access guards, R2, OpenRouter, and the
  feature logic (`projects.ts`, `ledger.ts`, `ai.ts`).
- `src/routes/api/**` — thin JSON endpoints (single-letter keys) over that logic.
- `src/routes/app/**` — the authenticated app (dashboard, ledger, drawings, progress, settings).
- `src/lib/components/*` — the "Field Ledger" design system.

See `AGENTS.md` for the full data model and conventions.
