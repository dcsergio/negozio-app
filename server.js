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

app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

function startServer(port, retries = 0) {
    const server = app.listen(port, () => {
        console.log(`Server avviato su http://localhost:${port}`);
    });

    server.on("error", error => {
        if (error?.code === "EADDRINUSE" && retries < MAX_PORT_RETRIES) {
            const nextPort = port + 1;
            console.warn(`Porta ${port} occupata, riprovo sulla porta ${nextPort}...`);
            startServer(nextPort, retries + 1);
            return;
        }

        if (error?.code === "EADDRINUSE") {
            console.error(`Nessuna porta disponibile tra ${port} e ${port + MAX_PORT_RETRIES}.`);
            console.error("Imposta PORT in .env con una porta libera e riavvia l'app.");
        } else {
            console.error("Errore avvio server:", error);
        }

        process.exit(1);
    });
}

initDb()
    .then(() => {
        if (!isValidPort(PORT)) {
            console.error(`Valore PORT non valido: ${process.env.PORT}`);
            process.exit(1);
        }

        startServer(PORT);
    })
    .catch(error => {
        console.error("Errore inizializzazione DB:", error);
        process.exit(1);
    });
