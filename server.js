const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const { Pool } = require("pg");

function loadEnvFile() {
    const envPath = path.join(__dirname, ".env");
    if (!fs.existsSync(envPath)) {
        return;
    }

    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }

        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex <= 0) {
            continue;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();
        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
}

loadEnvFile();

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

const DATABASE_URL = normalizeDatabaseUrl(
    process.env.DATABASE_URL || "jdbc:postgresql://aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
);
const PORT = Number(process.env.PORT || 3000);
const MAX_PORT_RETRIES = 10;

function isValidPort(port) {
    return Number.isInteger(port) && port > 0 && port <= 65535;
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const app = express();
app.use(express.json());
app.use(express.static(__dirname));
app.disable("x-powered-by");

async function initDb() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS inventario (
            codice TEXT PRIMARY KEY,
            prezzo NUMERIC(12, 2) NOT NULL,
            descrizione TEXT NOT NULL,
            emoji TEXT NOT NULL DEFAULT '1F6D2',
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);
}

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
            "SELECT codice, prezzo::float8 AS prezzo, descrizione, emoji FROM inventario ORDER BY codice"
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
            INSERT INTO inventario (codice, prezzo, descrizione, emoji)
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
            UPDATE inventario
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
            "DELETE FROM inventario WHERE codice = $1 RETURNING codice",
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

app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

function startServer(port, retries = 0) {
    const server = app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });

    server.on("error", error => {
        if (error?.code === "EADDRINUSE" && retries < MAX_PORT_RETRIES) {
            const nextPort = port + 1;
            console.warn(`Port ${port} is in use, retrying on port ${nextPort}...`);
            startServer(nextPort, retries + 1);
            return;
        }

        if (error?.code === "EADDRINUSE") {
            console.error(`No available ports between ${port} and ${port + MAX_PORT_RETRIES}.`);
            console.error("Set PORT in .env to a free port and restart the app.");
        } else {
            console.error("Server startup error:", error);
        }

        process.exit(1);
    });
}

initDb()
    .then(() => {
        if (!isValidPort(PORT)) {
            console.error(`Invalid PORT value: ${process.env.PORT}`);
            process.exit(1);
        }

        startServer(PORT);
    })
    .catch(error => {
        console.error("DB initialization error:", error);
        process.exit(1);
    });
