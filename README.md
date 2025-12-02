# MSP Entelligence Backend (apline-dairy)

Node/Express API with PostgreSQL and simple migration runner.

## Stack
- Node.js + Express
- PostgreSQL (`pg`)
- TypeScript + ts-node
- File-based SQL migrations (custom runner)

## Setup
1) `cd apline-dairy`
2) Install deps: `npm install`
3) Copy env template: `cp .env.example .env` (or create manually) and set values:
   - `JWT_SECRET` (required)
   - `FRONTEND_ORIGIN` (for CORS allowlist, e.g. `http://localhost:5173`)
   - `PG*` connection settings
   - `PORT` (default 4000)
4) (Optional) Start Postgres via Docker: `docker compose up -d`
5) Run migrations + seeds: `npm run migrate`
6) Start dev server (auto-reload): `npm run dev` -> http://localhost:4000

## Env vars (`.env`)
- `PORT` (default 4000)
- `JWT_SECRET` (**required**)
- `FRONTEND_ORIGIN` (CORS allowlist; leave empty to allow all in dev)
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

## Scripts
- `npm run dev` – nodemon + ts-node on `src/server.ts`
- `npm run migrate` – applies every `migrations/*.sql` not yet recorded in `schema_migrations`
- `npm run build` / `npm start` – compile to `dist` and run

## Migrations
Files in `src/migrations/` are applied alphabetically and tracked in table `schema_migrations`.
- `0001_init.sql` – tables: users, teams, user_teams, tasks + triggers for updated_at
- `0002_seed_data.sql` – sample teams/users/tasks (password hashes are placeholders)
- `0003_multitenant.sql` – tenants, sites, mt_users, actions (multi-tenant seed)

Add new migrations by creating a new `YYYYMMDDHHMM_description.sql` file in `migrations/`, then run `npm run migrate`.

## API (current)
- `GET /test` – service status
- `GET /test/db` – DB connectivity check
- `POST /api/auth/login` – returns JWT (seed users below)
- `GET /health` – health + DB ping
- `GET /api/actions` – list actions scoped to tenant + site (manager sees all in site; operator sees own/assigned), supports `limit`/`offset` (default 50, max 100)
- `GET /api/actions/:id` – scoped fetch
- `POST /api/actions` – create action (operator can only assign to self)
- `PATCH /api/actions/:id` – update status/assignment/details within scope

## Structure
- `src/app.ts` – Express app factory and middleware
- `src/server.ts` – bootstraps the server
- `src/config/env.ts` – env loader
- `src/config/db.ts` – Postgres pool + query helper
- `src/middleware/auth.ts` – JWT auth + context
- `src/routes` – route registrations and handlers
- `src/migrate.ts` – migration runner
- `src/migrations/` – SQL files applied in order

Note: legacy tables in `0001/0002` are unused for the MSP test; multi-tenant tables/seeds are in `0003_multitenant.sql`.

## Seed users (password: `password`)
- john@gippsland.com (operator, tenant NeoRosetta, site Gippsland)
- sarah@gippsland.com (manager, tenant NeoRosetta, site Gippsland)
- ahmed@adelaide.com (manager, tenant NeoRosetta, site Adelaide)

## Notes
- Replace `password_hash` with real hashed secrets for production.
- All action queries are scoped to tenant + site to enforce isolation.
