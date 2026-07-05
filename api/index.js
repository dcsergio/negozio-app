const { Pool } = require("pg");
const express = require("express");

function normalizeDatabaseUrl(rawValue) {
    const trimmed = String(rawValue || "").trim();
    if (!trimmed) {
        return "";
    }

    if (trimmed.startsWith("jdbc:postgresql://")) {
        return "postgresql://" + trimmed.slice("jdbc:postgresql://".length);
    }

    return trimmed;
}

const DATABASE_URL = normalizeDatabaseUrl(process.env.DATABASE_URL);

if (!DATABASE_URL) {
    throw new Error("Missing DATABASE_URL environment variable");
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const app = express();
app.use(express.json());
app.disable("x-powered-by");

async function initDb() {
    await pool.query("CREATE SCHEMA IF NOT EXISTS sedapp;");
    await pool.query(`
        CREATE TABLE IF NOT EXISTS sedapp.inventario (
            codice TEXT PRIMARY KEY,
            prezzo NUMERIC(12, 2) NOT NULL,
            descrizione TEXT NOT NULL,
            emoji TEXT NOT NULL DEFAULT '1F6D2',
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);
}

let dbInitPromise;

function ensureDbInitialized() {
    if (!dbInitPromise) {
        dbInitPromise = initDb().catch(error => {
            dbInitPromise = undefined;
            throw error;
        });
    }
    return dbInitPromise;
}

app.use(async (_req, _res, next) => {
    try {
        await ensureDbInitialized();
        next();
    } catch (error) {
        next(error);
    }
});

app.get("/api/health", async (_req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ ok: true });
    } catch (error) {
        console.error("Health check error:", error);
        res.status(500).json({ ok: false, message: "Database unreachable" });
    }
});

app.get("/api/inventario", async (_req, res) => {
    try {
        const result = await pool.query(
            "SELECT codice, prezzo::float8 AS prezzo, descrizione, emoji FROM sedapp.inventario ORDER BY codice"
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Inventory read error:", error);
        res.status(500).json({ message: "Inventory loading error" });
    }
});

app.post("/api/inventario", async (req, res) => {
    const { codice: code, prezzo: price, descrizione: description, emoji } = req.body || {};
    if (!code || typeof description !== "string" || !Number.isFinite(Number(price))) {
        res.status(400).json({ message: "Invalid item data" });
        return;
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO sedapp.inventario (codice, prezzo, descrizione, emoji)
            VALUES ($1, $2, $3, COALESCE(NULLIF($4, ''), '1F6D2'))
            RETURNING codice, prezzo::float8 AS prezzo, descrizione, emoji
            `,
            [String(code).toUpperCase(), Number(price), description.trim(), String(emoji || "").trim()]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error?.code === "23505") {
            res.status(409).json({ message: "Code already exists in inventory" });
            return;
        }
        console.error("Item insert error:", error);
        res.status(500).json({ message: "Item save error" });
    }
});

app.put("/api/inventario/:codice", async (req, res) => {
    const codeParam = String(req.params.codice || "").toUpperCase();
    const { prezzo: price, descrizione: description, emoji } = req.body || {};

    if (!codeParam || typeof description !== "string" || !Number.isFinite(Number(price))) {
        res.status(400).json({ message: "Invalid item data" });
        return;
    }

    try {
        const result = await pool.query(
            `
            UPDATE sedapp.inventario
            SET prezzo = $2,
                descrizione = $3,
                emoji = COALESCE(NULLIF($4, ''), '1F6D2'),
                updated_at = NOW()
            WHERE codice = $1
            RETURNING codice, prezzo::float8 AS prezzo, descrizione, emoji
            `,
            [codeParam, Number(price), description.trim(), String(emoji || "").trim()]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ message: "Item not found" });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Item update error:", error);
        res.status(500).json({ message: "Item update error" });
    }
});

app.delete("/api/inventario/:codice", async (req, res) => {
    const codeParam = String(req.params.codice || "").toUpperCase();
    if (!codeParam) {
        res.status(400).json({ message: "Missing code" });
        return;
    }

    try {
        const result = await pool.query(
            "DELETE FROM sedapp.inventario WHERE codice = $1 RETURNING codice",
            [codeParam]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ message: "Item not found" });
            return;
        }

        res.status(204).send();
    } catch (error) {
        console.error("Item delete error:", error);
        res.status(500).json({ message: "Item delete error" });
    }
});

app.use((error, _req, res, _next) => {
    console.error("API error:", error);
    res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
