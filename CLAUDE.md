# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Negoziо-app** is an educational mini supermarket application with inventory management, checkout, and QR code generation. It uses PostgreSQL for persistence and supports both local development (Express) and Vercel deployment (serverless functions).

**Stack:**
- Frontend: HTML + CSS + vanilla JavaScript (ES modules not used - scripts loaded via `<script>` tags)
- Local backend: Node.js + Express (`server.js`)
- Vercel deploy: Serverless function (`api/index.js`)
- Database: PostgreSQL (`pg` driver, schema `sedapp`, table `inventario`)
- i18n: Italian/English via JSON (`i18n/messages.json`)
- Icons: OpenMoji via CDN (CDN links in HTML, also available locally via `openmoji` npm package for repair scripts)

## Key Project Structure

```
negozio-app/
├── index.html           # Main combined view (inventory + checkout)
├── inventory.html       # Standalone inventory page
├── checkout.html        # Standalone checkout page
├── negozio-app.css      # All styling (CSS custom properties, grid layout)
├── negozio-app.js       # All frontend logic (inventory, checkout, QR, i18n, CSV import, emoji picker)
├── server.js            # Express server (local dev)
├── api/index.js         # Vercel serverless function
├── vercel.json          # Vercel routing config
├── package.json         # Dependencies + scripts
├── i18n/messages.json   # Italian/English translations
├── vendor/qrcode.min.js # QR code library (vendored)
├── scripts/
│   ├── start-work-branch.js   # Helper to create feature branch from main
│   ├── diagnose-db-icons.js   # Diagnose emoji codepoints in DB
│   └── repair-db-icons.js     # Repair invalid emoji codepoints in DB
└── .env.example         # Example environment variables
```

## Database Schema

```sql
CREATE SCHEMA IF NOT EXISTS sedapp;
CREATE TABLE IF NOT EXISTS sedapp.inventario (
    codice      TEXT PRIMARY KEY,
    prezzo      NUMERIC(12, 2) NOT NULL,
    descrizione TEXT NOT NULL,
    emoji       TEXT NOT NULL DEFAULT '1F6D2',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- Primary key: `codice` (uppercase alphanumeric, e.g., `A7K9M2B5`)
- Emoji stored as OpenMoji codepoints (e.g., `1F34C` for 🍌, or `1F34C-FE0F` with variation selector)
- Connection string supports both `postgresql://...` and `jdbc:postgresql://...` (auto-normalized)

## Standard Commands

```bash
# Install dependencies
npm install

# Run locally (starts Express on PORT, default 3000; auto-retries if port busy)
npm start

# Create a feature branch from main (run from main branch)
npm run start-branch -- "feature/my-feature"

# Database diagnostics (requires .env with DATABASE_URL)
node scripts/diagnose-db-icons.js
node scripts/repair-db-icons.js
```

## API Endpoints (both local and Vercel)

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/health` | Health check (DB connectivity) |
| GET    | `/api/inventario` | List all inventory items (ordered by codice) |
| POST   | `/api/inventario` | Create item (`codice`, `prezzo`, `descrizione`, `emoji?`) |
| PUT    | `/api/inventario/:codice` | Update item (`prezzo`, `descrizione`, `emoji?`) |
| DELETE | `/api/inventario/:codice` | Delete item |

**Response format** (all endpoints return items in this shape):
```json
{
  "codice": "A7K9M2B5",
  "prezzo": 1.50,
  "descrizione": "Banana",
  "emoji": "1F34C"
}
```

**Frontend mapping** (`negozio-app.js`):
- `mapApiItemToUi()` → `{ code, price, description, emoji }`
- `mapUiItemToApi()` → `{ codice, prezzo, descrizione, emoji }`

## Frontend Architecture (`negozio-app.js`)

**State (module-level):**
- `inventory: Item[]` — loaded from `/api/inventario`
- `receipt: Record<string, { code, price, description, emoji, quantity }>` — in-memory checkout
- `editingCode: string|null` — currently editing item code
- `locale: "it" | "en"` — current language (persisted in `localStorage`)

**Key functions:**
| Function | Purpose |
|----------|---------|
| `loadInventory()` | Fetches inventory, updates DB status badge |
| `renderInventoryList()` | Renders grid of item cards with QR codes |
| `addOrUpdateItem()` | Create or update (handles code changes via delete+create) |
| `editItem(index)` | Populates form for editing |
| `deleteItem(index)` | Confirms then deletes |
| `addToReceipt()` | Adds scanned/typed code to receipt |
| `renderReceipt()` | Renders receipt with quantity controls |
| `clearReceipt()` | Confirms then clears receipt |
| `importProductsFromCsv(file)` | Parses CSV, creates/updates items |
| `initEmojiPicker()` | Builds emoji picker from `EMOJI_GROUPS` |
| `setDocumentLanguage(lang)` | Switches i18n, re-renders UI |

**Emoji handling:**
- Stored as OpenMoji codepoints (e.g., `1F34C`)
- `normalizeOpenMojiCodepoint()` converts raw emoji or codepoint strings
- `openMojiUrl()` builds CDN URL: `https://cdn.jsdelivr.net/npm/openmoji@17.0.0/color/svg/{codepoint}.svg`
- `renderEmojiImage()` returns `<img>` tag for inline rendering

**QR codes:** Generated client-side via `vendor/qrcode.min.js` (QRCode.js), rendered into `.qr[data-code]` elements.

**i18n:** `i18n/messages.json` loaded at startup. Keys use dot notation (`app.title`, `errors.missingFields`). `getMessage(key, params)` supports `{placeholder}` substitution.

## Important Conventions (from AGENTS.md)

1. **Keep local and serverless APIs aligned** — Changes to endpoints/validations must be mirrored in both `server.js` and `api/index.js`
2. **Preserve public API field names** — `codice`, `prezzo`, `descrizione`, `emoji` are part of the public contract
3. **Database URL normalization** — Both `server.js` and scripts normalize `jdbc:postgresql://` → `postgresql://`
4. **Port handling** — `server.js` auto-retries on `EADDRINUSE` (up to 10 attempts)
5. **Security** — `x-powered-by` header disabled on both APIs
6. **Small targeted changes** — Avoid broad refactors unless explicitly requested

## Development Workflow

1. **Local dev:** `npm start` → opens `http://localhost:3000` (serves `index.html`)
2. **Feature branch:** `npm run start-branch -- "fix/issue-name"` (must run from `main`)
3. **DB changes:** Update `server.js` `initDb()` and run scripts in `scripts/` if emoji data changes
4. **Translations:** Edit `i18n/messages.json` (both `it` and `en` keys)
5. **Pre-close checklist** (from AGENTS.md):
   - Verify `npm start` works
   - Test core API routes: `GET /api/health`, `GET /api/inventario`, `POST/PUT/DELETE /api/inventario`
   - Run `scripts/diagnose-db-icons.js` and `scripts/repair-db-icons.js` if emoji data changed
   - Update `README.md` if user-facing behavior changes

## Common Tasks

### Add a new inventory field
1. Update DB schema in `server.js` `initDb()` and `api/index.js`
2. Update `mapApiItemToUi` / `mapUiItemToApi` in `negozio-app.js`
3. Update form in `index.html` / `inventory.html`
4. Update CSV import parsing (`parseProductsFromCsv`, `extractCsvIndexes`)
5. Add translations in `i18n/messages.json`

### Fix emoji display issues
1. Run `node scripts/diagnose-db-icons.js` to identify problematic codepoints
2. Run `node scripts/repair-db-icons.js` to fix (normalizes to valid OpenMoji codepoints, falls back to `1F6D2` 🛒)

### Add a new emoji category
1. Add entry to `EMOJI_GROUPS` in `negozio-app.js`
2. Add translation keys in `i18n/messages.json` under `emoji.categories.{key}`

### Modify CSV import format
- Headers are auto-detected (case/diacritic-insensitive): `codice/code/sku`, `prezzo/price/costo`, `descrizione/description/nome/prodotto/product/name`, `emoji/icona/icon`
- Separator auto-detected (comma vs semicolon)
- Edit `parseProductsFromCsv` and related helpers in `negozio-app.js`

## Vercel Deployment

- `vercel.json` routes `/api/*` to `api/index.js`
- `api/index.js` exports a handler compatible with Vercel's Node.js runtime
- Uses same `pg` pool configuration as `server.js` (reads `DATABASE_URL` from Vercel env vars)
- Static files served from project root (Express `express.static(__dirname)` locally, Vercel serves `index.html` etc. automatically)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (supports `jdbc:postgresql://` prefix) | Supabase pooler URL in `server.js` |
| `PORT` | Local server port | `3000` |
| `PGUSER` / `PGPASSWORD` | Optional DB credentials (used by repair scripts) | — |

## Key Files to Reference

- **AGENTS.md** — Operational guidelines for AI agents (this repo's conventions)
- **server.js** — Local Express server + DB init
- **api/index.js** — Vercel serverless handler (mirrors server.js routes)
- **negozio-app.js** — All frontend logic (single file, ~1000 lines)
- **i18n/messages.json** — All user-facing strings (IT/EN)
- **scripts/repair-db-icons.js** — Canonical emoji normalization logic