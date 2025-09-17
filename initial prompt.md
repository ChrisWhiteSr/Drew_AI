# ROLE

You are a senior full-stack AI engineer building a small, production-bound web app, using “vibe coding” with fast plan→build→verify loops. You will:

1. Sketch an ASCII plan (no code yet),
2. Generate a minimal scaffold,
3. Implement vertical slices end-to-end,
4. Self-test with runnable scripts,
5. Stop after each slice with a short checklist of what to try next.

# PROJECT ONE-LINER

“Steam Arbitrage”: fetch a user’s Steam inventory, price it across third-party marketplaces, compute net payout after fees, and recommend where to sell each item for the most money.

# TARGET STACK & HOSTING

- Framework: Next.js (App Router) + TypeScript
- UI: Tailwind + shadcn/ui (minimal)
- Runtime/Host: Vercel
- DB: Supabase Postgres (optional for v1; can start in-memory)
- Jobs: Vercel Cron / serverless functions
- Lang: TypeScript everywhere
- Testing: Vitest + Playwright (smoke)
- Lint/Format: ESLint + Prettier
- Package: pnpm

# GUARDED PRACTICES (MUST FOLLOW)

- Respect Steam and marketplace Terms of Service. Prefer official/public APIs; only scrape if explicitly allowed and within rate limits. No bypassing captchas/anti-bot/proxies.
- Store only necessary user data. Provide logout + data deletion.
- Secrets via environment variables; never commit them.
- Instrument logging and graceful error messages (no leaking secrets).
- Add a “Data Sources & TOS” page listing APIs used and links to their docs.

# CORE USER FLOWS (MVP)

A) Connect Steam → Fetch Inventory

- Allow sign-in via “Sign in through Steam” (OpenID) OR accept a SteamID64 field for quick demo.
- Fetch inventory for one appId (start with CS2 730 / Dota2 570; configurable).
  B) Price Compare Across Sites
- Query 2+ marketplaces first (modular adapters). Compute:
  net_payout = price * (1 - fee%) - withdrawal_fee (if any)
- Convert to user currency; show fees & formulas transparently.
  C) Recommend Best Venue
- For each item: show top 3 venues with net payout, link to listing page, and a “Sell there” CTA (external).
  D) Save/Reload (optional)
- Persist last run, user settings, and cached quotes (ttl).

# ADAPTER-BASED MARKETPLACE DESIGN

Implement a pluggable interface so we can add/remove providers easily.

```ts
// /lib/marketplaces/types.ts
export type Quote = {
  marketplace: string
  itemName: string
  askPrice: number       // in marketplace quote currency
  currency: string
  feePct: number         // 0–1
  withdrawalFee?: number // flat in quote currency
  url?: string
};

export interface MarketplaceAdapter {
  id: string;
  displayName: string;
  // Return best current sellable price (or recent sales floor) for item
  priceItem: (args: { itemName: string; appId: number; contextId?: number; }) => Promise<Quote | null>;
}
```

Start with two adapters that have public or easily accessible APIs (examples: Skinport, DMarket). Build with feature flags so additional marketplaces (e.g., Buff163, Bitskins, CS.Money, SkinBaron) can be toggled in later.

# DATA SOURCES (GUIDANCE)

- Steam inventory JSON endpoint per user/app/context (respect pagination/count). Allow language param `l=en`.
- Marketplaces: use documented/public endpoints where available. If an API key is required, make it optional and degrade gracefully.
- FX rates: simple free source (e.g., ECB or other free FX API). Cache rates daily.

# ENV & SECRETS (.env.example)

```env
NEXT_PUBLIC_APP_NAME=SteamArbitrage
STEAM_PARTNER_API_KEY=
STEAM_OPENID_REALM_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
FX_API_BASE=
FX_API_KEY=
# Marketplace keys (optional; leave blank if not needed)
SKINPORT_API_KEY=
DMARKET_API_KEY=
```

# SUPABASE SCHEMA (OPTIONAL FOR MVP)

```sql
-- users, settings, inventory cache, quotes, runs
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  steamid64 text unique,
  created_at timestamp default now()
);

create table if not exists user_settings (
  user_id uuid references users(id) on delete cascade,
  currency text default 'USD',
  marketplaces jsonb default '[]'::jsonb,
  primary key (user_id)
);

create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  app_id int not null,
  requested_currency text not null,
  created_at timestamp default now()
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  app_id int not null,
  context_id int not null,
  item_name text not null,
  classid text,
  icon_url text
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  item_name text not null,
  marketplace text not null,
  ask_price numeric not null,
  currency text not null,
  fee_pct numeric not null,
  withdrawal_fee numeric,
  net_payout numeric not null,
  url text
);
```

# FILE STRUCTURE (INITIAL)

```
/app
  /(marketing)/page.tsx
  /dashboard/page.tsx
  /api/inventory/route.ts
  /api/quote/route.ts
  /api/quote/run/route.ts
/components
  ItemTable.tsx
  MarketBadge.tsx
/lib
  /steam/inventory.ts
  /fx/index.ts
  /marketplaces/types.ts
  /marketplaces/skinport.ts
  /marketplaces/dmarket.ts
  math.ts
/scripts
  price-scan.ts      # CLI to run a quotes pass for a given steamid64
  seed.ts
.env.example
```

# VERTICAL SLICE 1 (NO DB, NO AUTH)

Goal: Demo works in 5–10 minutes end-to-end using a hardcoded SteamID64 and appId.

1. Fetch inventory via /api/inventory?steamid64=&appId=730
2. For the first 25 items, call adapters (Skinport, DMarket) to get a quote each (mock responses if access blocked).
3. Convert to USD (mock FX if needed).
4. Compute net payout per adapter, choose best, return array [{itemName, bestMarketplace, net, breakdown}]
5. Render a table with filters (search by itemName), and export CSV.

# VERTICAL SLICE 2 (CONFIG + FX + FEES)

- Add real FX fetch with 24h cache.
- Externalize adapter fees/withdrawal costs per marketplace; expose in a JSON config with sane defaults and an admin UI form.

# VERTICAL SLICE 3 (OPTIONAL PERSISTENCE)

- Connect Supabase and persist runs, items, and quotes.
- “Re-price” button that re-queries adapters only for top N items or any stale > X minutes.

# API CONTRACTS

**GET /api/inventory**

- query: steamid64 (string), appId (number), contextId (number, default 2)
- returns: `{ items: [{ itemName, appId, contextId, classid, iconUrl }] }`

**POST /api/quote/run**

- body: `{ steamid64, appId, currency, marketplaces?: string[] }`
- returns: `{ quotes: [{ itemName, recommendations: [ { marketplace, price, feePct, withdrawalFee, net, url } ] }] }`

# UI REQUIREMENTS (MINIMAL)

- Header with app name + “Data Sources & TOS”
- Form: steamid64, appId dropdown (730/570), desired currency
- Table: Item, Best Marketplace (badge), Net, Gross, Fees, View Links
- CSV export, simple pagination, loading states, failure states

# TESTS & DX

- Vitest for pure functions in /lib/math.ts (net payout calc)
- Playwright smoke: load dashboard, run a mock pricing pass, see populated table
- pnpm scripts:
  - dev, build, start
  - test, test:ui
  - scan: `tsx ./scripts/price-scan.ts --steamid64=... --appId=730 --currency=USD`

# CONFIG-FIRST, CODE-SECOND (ASCII → CODE)

Before writing code, produce:

1. ASCII task list and dependency graph for Slice 1
2. A .env.example
3. MarketplaceAdapter interface + two stub adapters
4. A small math.ts with `netPayout(gross, feePct, withdrawalFee=0)` and unit tests
  THEN generate the Next.js scaffold and the three API routes above.

# ACCEPTANCE CRITERIA (MVP)

- Given a public SteamID64 and appId, the app returns a table of items with at least one marketplace quote per item (real or clearly marked mock when API unavailable).
- Net payout is correct and shown with fee breakdown and link to the marketplace item page.
- No secrets in repo; .env.example provided; app builds on Vercel.
- If any adapter 429s or fails, the run still returns partial data with per-adapter errors captured.

# RATE LIMITS & CACHING

- Cache Steam inventory response per (steamid64, appId) for 5 minutes.
- Cache FX rates daily.
- For each marketplace adapter, implement backoff and jitter; respect vendor limits.
- Add “dryRun=true” mode to adapters to return synthetic data when keys are missing.

# NEXT STEPS (AFTER MVP)

- Steam OpenID login, user settings persistence
- More adapters with feature flags
- Historical charts of best venue over time
- “What if” fee tuning, and auto-routing suggestions

# PROMPT EXECUTION NOTES

- Ask for any missing secrets once; otherwise proceed with mocks.
- Print the ASCII plan first. Wait for confirmation token “SHIP IT”.
- After confirmation, scaffold the repo and print:
  - commands to run locally,
  - how to add .env,
  - a short README snippet.

# OUT OF SCOPE / DO NOT DO

- No account creation on marketplaces
- No automated listing or botting
- No captcha bypassing or scraping against TOS