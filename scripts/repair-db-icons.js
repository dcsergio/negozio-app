const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

function loadEnvFile() {
    const envPath = path.join(__dirname, "..", ".env");
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

function emojiToOpenMojiCodepoint(emoji) {
    return Array.from(String(emoji || "").trim())
        .map(char => char.codePointAt(0).toString(16).toUpperCase())
        .join("-");
}

function normalizeOpenMojiCodepoint(value) {
    const raw = String(value || "").trim();
    if (!raw) {
        return "";
    }

    if (/^[0-9A-Fa-f]+(?:-[0-9A-Fa-f]+)*$/.test(raw)) {
        return raw.toUpperCase();
    }

    return emojiToOpenMojiCodepoint(raw);
}

function iconFileExists(codepoint) {
    if (!codepoint) {
        return false;
    }

    const iconPath = path.join(__dirname, "..", "node_modules", "openmoji", "color", "svg", `${codepoint}.svg`);
    return fs.existsSync(iconPath);
}

function sanitizeCodepoint(codepoint) {
    const normalized = normalizeOpenMojiCodepoint(codepoint);
    if (!normalized) {
        return "1F6D2";
    }

    if (iconFileExists(normalized)) {
        return normalized;
    }

    const withoutVariation = normalized
        .split("-")
        .filter(part => part !== "FE0F")
        .join("-");

    if (withoutVariation && iconFileExists(withoutVariation)) {
        return withoutVariation;
    }

    return "1F6D2";
}

async function main() {
    loadEnvFile();
    const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
    if (!databaseUrl) {
        throw new Error("DATABASE_URL is not configured.");
    }

    const pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD
    });

    try {
        const { rows } = await pool.query("SELECT codice, descrizione, emoji FROM inventario ORDER BY codice");

        const updates = [];
        for (const row of rows) {
            const current = String(row.emoji || "").trim();
            const next = sanitizeCodepoint(current);
            if (current !== next) {
                updates.push({ codice: row.codice, descrizione: row.descrizione, from: current, to: next });
            }
        }

        for (const upd of updates) {
            await pool.query("UPDATE inventario SET emoji = $2, updated_at = NOW() WHERE codice = $1", [upd.codice, upd.to]);
        }

        console.log(`Analyzed records: ${rows.length}`);
        console.log(`Updated records: ${updates.length}`);
        if (updates.length > 0) {
            console.table(updates);
        }
    } finally {
        await pool.end();
    }
}

main().catch(error => {
    console.error("DB icon repair error:", error.message);
    process.exit(1);
});
