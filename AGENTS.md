# AGENTS

Operational guidelines for AI agents and collaborators editing this repository.

## Project context
- Name: `negozio-app`
- Goal: educational mini supermarket with inventory, checkout, and QR.
- Stack:
	- Frontend: HTML + CSS + vanilla JavaScript.
	- Local backend: Node.js + Express (`server.js`).
	- Vercel deploy backend: serverless function (`api/index.js`).
	- Database: PostgreSQL (`pg`).

## Main agent
- Name: `GitHub Copilot`
- Role: support for development, refactoring, debugging, maintenance, and documentation.

## Key project structure
- `index.html`: main UI.
- `negozio-app.css`: interface styling.
- `negozio-app.js`: frontend logic (inventory, checkout, QR, CSV import).
- `server.js`: Express server for local runtime.
- `api/index.js`: serverless API used on Vercel deploy.
- `vercel.json`: deploy routing/configuration.
- `scripts/diagnose-db-icons.js`: DB emoji/code diagnostics.
- `scripts/repair-db-icons.js`: DB emoji/code repair.
- `vendor/qrcode.min.js`: client-side QR library.

## Operational rules
- Apply small, targeted changes for the requested requirement.
- Do not introduce broad refactors unless explicitly requested.
- Keep local API (`server.js`) and serverless API (`api/index.js`) aligned when changing endpoints or validations.
- Preserve frontend compatibility with `/api/*` routes.
- Avoid unnecessary new dependencies; if needed, justify them and update `package.json`.
- Do not change public API field names (`codice`, `prezzo`, `descrizione`, `emoji`) unless explicitly requested.

## Technical conventions
- Database URL:
	- Supports `postgresql://...` format.
	- Supports normalization from `jdbc:postgresql://...`.
- Local port:
	- `PORT` variable (default 3000).
	- If busy, incremental retry is handled by `server.js`.
- Header security:
	- `x-powered-by` is disabled on APIs.

## Standard commands
- Install dependencies: `npm install`
- Run locally: `npm start`

## Pre-close checklist
- Verify the app starts locally with `npm start` (if the task touches backend/runtime).
- Verify core API routes respond:
	- `GET /api/health`
	- `GET /api/inventario`
	- `POST/PUT/DELETE /api/inventario`
- If DB or emoji data is touched, run/validate scripts in `scripts/` when relevant.
- Update `README.md` if user behavior, setup, or deploy flow changes.

## Scope of changes
- Prefer updates in files directly involved in the task.
- Avoid unrelated cosmetic changes in non-related files.
- Keep documentation language and tone consistent with current project docs.
