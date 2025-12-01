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
3) Copy env template: `cp .env.example .env` (or create manually) and set Postgres values.
4) (Optional) Start Postgres via Docker: `docker compose up -d`
5) Run migrations + seeds: `npm run migrate`
6) Start dev server (auto-reload): `npm run dev` -> http://localhost:4000

## Env vars (`.env`)
- `PORT` (default 4000)
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

## Scripts
- `npm run dev` – nodemon + ts-node on `src/server.ts`
- `npm run migrate` – applies every `migrations/*.sql` not yet recorded in `schema_migrations`
- `npm run build` / `npm start` – compile to `dist` and run

## Migrations
Files in `src/migrations/` are applied alphabetically and tracked in table `schema_migrations`.
- `0001_init.sql` – tables: users, teams, user_teams, tasks + triggers for updated_at
- `0002_seed_data.sql` – sample teams/users/tasks (password hashes are placeholders)

Add new migrations by creating a new `YYYYMMDDHHMM_description.sql` file in `migrations/`, then run `npm run migrate`.

## API (initial)
- `GET /health` – service status
- `GET /health/db` – DB connectivity check
- `GET /api/users` – list users
- `POST /api/users` – create user `{ email, fullName, role?, passwordHash }`
- `GET /api/tasks` – list tasks (with assigned/teams)
- `POST /api/tasks` – create task `{ title, description?, status?, dueDate?, assignedTo?, teamId? }`

## Structure
- `src/app.ts` – Express app factory and middleware
- `src/server.ts` – bootstraps the server
- `src/config/env.ts` – env loader
- `src/config/db.ts` – Postgres pool + query helper
- `src/routes` – route registrations and handlers
- `src/migrate.ts` – migration runner
- `src/migrations/` – SQL files applied in order

## Notes
- Replace `password_hash` with a real hashed value (bcrypt/argon2) before using in production.
- Extend routes/controllers as you map the frontend screens to API endpoints.
