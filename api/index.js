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

async function initDb() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS inventario (
            codice TEXT PRIMARY KEY,
            prezzo NUMERIC(12, 2) NOT NULL,
            descrizione TEXT NOT NULL,
            emoji TEXT NOT NULL DEFAULT '🛒',
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
        console.error("Errore health check:", error);
        res.status(500).json({ ok: false, message: "Database non raggiungibile" });
    }
});

app.get("/api/inventario", async (_req, res) => {
    try {
        const result = await pool.query(
            "SELECT codice, prezzo::float8 AS prezzo, descrizione, emoji FROM inventario ORDER BY codice"
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Errore lettura inventario:", error);
        res.status(500).json({ message: "Errore caricamento inventario" });
    }
});

app.post("/api/inventario", async (req, res) => {
    const { codice, prezzo, descrizione, emoji } = req.body || {};
    if (!codice || typeof descrizione !== "string" || !Number.isFinite(Number(prezzo))) {
        res.status(400).json({ message: "Dati articolo non validi" });
        return;
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO inventario (codice, prezzo, descrizione, emoji)
            VALUES ($1, $2, $3, COALESCE(NULLIF($4, ''), '🛒'))
            RETURNING codice, prezzo::float8 AS prezzo, descrizione, emoji
            `,
            [String(codice).toUpperCase(), Number(prezzo), descrizione.trim(), String(emoji || "").trim()]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error?.code === "23505") {
            res.status(409).json({ message: "Codice già presente in inventario" });
            return;
        }
        console.error("Errore inserimento articolo:", error);
        res.status(500).json({ message: "Errore salvataggio articolo" });
    }
});

app.put("/api/inventario/:codice", async (req, res) => {
    const codiceParam = String(req.params.codice || "").toUpperCase();
    const { prezzo, descrizione, emoji } = req.body || {};

    if (!codiceParam || typeof descrizione !== "string" || !Number.isFinite(Number(prezzo))) {
        res.status(400).json({ message: "Dati articolo non validi" });
        return;
    }

    try {
        const result = await pool.query(
            `
            UPDATE inventario
            SET prezzo = $2,
                descrizione = $3,
                emoji = COALESCE(NULLIF($4, ''), '🛒'),
                updated_at = NOW()
            WHERE codice = $1
            RETURNING codice, prezzo::float8 AS prezzo, descrizione, emoji
            `,
            [codiceParam, Number(prezzo), descrizione.trim(), String(emoji || "").trim()]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ message: "Articolo non trovato" });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Errore aggiornamento articolo:", error);
        res.status(500).json({ message: "Errore aggiornamento articolo" });
    }
});

app.delete("/api/inventario/:codice", async (req, res) => {
    const codiceParam = String(req.params.codice || "").toUpperCase();
    if (!codiceParam) {
        res.status(400).json({ message: "Codice mancante" });
        return;
    }

    try {
        const result = await pool.query(
            "DELETE FROM inventario WHERE codice = $1 RETURNING codice",
            [codiceParam]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ message: "Articolo non trovato" });
            return;
        }

        res.status(204).send();
    } catch (error) {
        console.error("Errore cancellazione articolo:", error);
        res.status(500).json({ message: "Errore cancellazione articolo" });
    }
});

app.use((error, _req, res, _next) => {
    console.error("Errore API:", error);
    res.status(500).json({ message: "Errore interno server" });
});

module.exports = app;
