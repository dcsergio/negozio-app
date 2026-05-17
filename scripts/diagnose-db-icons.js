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
        const result = await pool.query(
            "SELECT codice, descrizione, emoji FROM inventario ORDER BY codice"
        );

        const rows = result.rows;
        const problematic = [];

        for (const row of rows) {
            const raw = row.emoji;
            const normalized = normalizeOpenMojiCodepoint(raw);
            const isBlank = !String(raw || "").trim();
            const isCodepointFormat = /^[0-9A-F]+(?:-[0-9A-F]+)*$/.test(normalized);
            const exists = iconFileExists(normalized);

            if (isBlank || !isCodepointFormat || !exists) {
                problematic.push({
                    codice: row.codice,
                    descrizione: row.descrizione,
                    emoji_raw: raw,
                    emoji_normalized: normalized,
                    has_icon_file: exists
                });
            }
        }

        console.log(`Total items: ${rows.length}`);
        console.log(`Items with problematic icon: ${problematic.length}`);

        if (problematic.length > 0) {
            console.table(problematic);
        }

        const oldStyle = rows.filter(r => {
            const raw = String(r.emoji || "").trim();
            return raw && !/^[0-9A-Fa-f]+(?:-[0-9A-Fa-f]+)*$/.test(raw);
        });

        console.log(`Items with legacy emoji (non-codepoint): ${oldStyle.length}`);
    } finally {
        await pool.end();
    }
}

main().catch(error => {
    console.error("DB icon diagnostics error:", error.message);
    process.exit(1);
});
