function generaCodiceRandom(lunghezza = 8) {
    const caratteri = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let codice = "";
    for (let i = 0; i < lunghezza; i++) {
        codice += caratteri.charAt(Math.floor(Math.random() * caratteri.length));
    }
    return codice;
}

const prodottiBase = [
    { codice: "A7K9M2B5", prezzo: 0.9, descrizione: "Banana", emoji: "🍌" },
    { codice: "P4X8R1N6", prezzo: 1.5, descrizione: "Pane", emoji: "🍞" },
    { codice: "Q3T7L2Y9", prezzo: 9.9, descrizione: "Automobile giocattolo", emoji: "🚗" },
    { codice: "D5Z1K8V3", prezzo: 1.2, descrizione: "Latte", emoji: "🥛" },
    { codice: "M6H4P0S7", prezzo: 0.8, descrizione: "Mela", emoji: "🍎" },
    { codice: "F2J9W5C1", prezzo: 4.5, descrizione: "Pizza", emoji: "🍕" }
];

let inventario = [];
let scontrino = {};

const SCONTRINO_COOKIE = "negozio_scontrino";
const SCONTRINO_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;

function salvaScontrinoSuCookie() {
    const righe = Object.values(scontrino);

    if (righe.length === 0) {
        document.cookie = `${SCONTRINO_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
        return;
    }

    const valore = encodeURIComponent(JSON.stringify(scontrino));
    document.cookie = `${SCONTRINO_COOKIE}=${valore}; Max-Age=${SCONTRINO_COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
}

function caricaScontrinoDaCookie() {
    const prefisso = `${SCONTRINO_COOKIE}=`;
    const cookie = document.cookie
        .split(";")
        .map(c => c.trim())
        .find(c => c.startsWith(prefisso));

    if (!cookie) {
        return;
    }

    const valore = cookie.substring(prefisso.length);
    if (!valore) {
        return;
    }

    try {
        const parsed = JSON.parse(decodeURIComponent(valore));
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            scontrino = parsed;
        }
    } catch (error) {
        console.warn("Cookie scontrino non valido:", error);
        document.cookie = `${SCONTRINO_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
    }
}

const emojiProdottiPerCategoria = [
    {
        categoria: "Frutta",
        emoji: ["🍎", "🍌", "🍊", "🍋", "🍌", "🍉", "🍓", "🍒", "🍑", "🥝", "🍐", "🍍", "🥭", "🍈"]
    },
    {
        categoria: "Verdura e Ortaggi",
        emoji: ["🥕", "🥔", "🧅", "🧄", "🥬", "🥦", "🌽", "🍅", "🥒", "🌶️", "🫑", "🫒", "🥬", "🥬"]
    },
    {
        categoria: "Alimentari e Pane",
        emoji: ["🍞", "🥐", "🥖", "🥨", "🍳", "🥚", "🧀", "🥛", "🍼", "🍝", "🍚", "🍛", "🍜", "🍲"]
    },
    {
        categoria: "Carne e Pesce",
        emoji: ["🍗", "🍖", "🥩", "🥓", "🐟", "🐠", "🦐", "🦞", "🦀", "🐙", "🦑", "🦪"]
    },
    {
        categoria: "Snack e Dolci",
        emoji: ["🍕", "🍔", "🍟", "🌭", "🌮", "🌯", "🥙", "🥗", "🍪", "🍰", "🎂", "🧁", "🍫", "🍬"]
    },
    {
        categoria: "Bevande",
        emoji: ["🥤", "🧃", "🧉", "☕", "🍵", "🍶", "🍾", "🍷", "🍸", "🍹", "🍺", "🍻"]
    },
    {
        categoria: "Casa e Igiene",
        emoji: ["🧴", "🧼", "🧻", "🧽", "🧹", "🧺", "🪥", "🪒", "🧼", "🕯️", "💡", "🔋", "🔌", "🧰"]
    },
    {
        categoria: "Pulizia",
        emoji: ["🧹", "🧺", "🪣", "🪠", "🧽", "🧴", "🧼", "🧻"]
    },
    {
        categoria: "Articoli Scolastici",
        emoji: ["✏️", "🖊️", "🖍️", "✒️", "🖌️", "📝", "📓", "📔", "📒", "📕", "📗", "📘", "📙", "🗂️", "📎", "📏", "📐", "✂️", "🖇️"]
    },
    {
        categoria: "Libri e Media",
        emoji: ["📚", "📖", "📕", "📗", "📘", "📙", "📚", "📕", "📗", "📘", "📙", "🎓", "📰", "🗞️", "📑"]
    },
    {
        categoria: "Giocattoli",
        emoji: ["🧸", "🪀", "🎯", "🧩", "🪆", "🎲", "🎮", "🎰", "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️"]
    },
    {
        categoria: "Sport e Tempo Libero",
        emoji: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎳", "⛳", "🎣", "🎽", "🎿"]
    },
    {
        categoria: "Accessori",
        emoji: ["👒", "⌚", "👓", "🕶️", "💄", "💍", "👜", "🎒", "👝", "🧣", "🧤", "🧥", "🧦", "👟"]
    },
    {
        categoria: "Tecnologia",
        emoji: ["📱", "💻", "⌨️", "🖥️", "🖨️", "📷", "📹", "📽️", "🎥", "🎬", "📺", "📻", "📞"]
    },
    {
        categoria: "Natura e Animali",
        emoji: ["🌳", "🌲", "🌴", "🌱", "🌿", "🍀", "🌾", "🌻", "🌷", "🌹", "🥀", "💐", "🌺", "🐶", "🐱", "🐭", "🐹", "🐰"]
    }
];

function generaQrLocali() {
    const qrNodi = document.querySelectorAll(".qr[data-codice]");
    const dimensioneContenitore = 94;
    const quietZone = 6;
    const dimensioneQr = dimensioneContenitore - (quietZone * 2);

    qrNodi.forEach(function(nodo) {
        const codice = nodo.dataset.codice || "";
        nodo.innerHTML = "";

        if (!codice || typeof QRCode === "undefined") {
            nodo.textContent = "QR non disponibile";
            return;
        }

        const codiceQr = new QRCode(nodo, {
            text: codice,
            width: dimensioneQr,
            height: dimensioneQr,
            colorDark: "#121212",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });

        codiceQr.makeImage();
    });
}

// === CSV Database ===

let dbFileHandle = null;

const IDB_NAME = "negozio-app-db";
const IDB_STORE = "file-handles";
const IDB_KEY = "csv-handle";

function apriIndexedDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject(e.target.error);
    });
}

async function salvaHandleInIDB(handle) {
    try {
        const db = await apriIndexedDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, "readwrite");
            tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
            tx.oncomplete = resolve;
            tx.onerror = e => reject(e.target.error);
        });
    } catch (e) {
        console.warn("Impossibile salvare handle in IndexedDB:", e);
    }
}

async function caricaHandleDaIDB() {
    try {
        const db = await apriIndexedDB();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, "readonly");
            const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
            req.onsuccess = e => resolve(e.target.result || null);
            req.onerror = e => reject(e.target.error);
        });
    } catch (e) {
        console.warn("Impossibile leggere handle da IndexedDB:", e);
        return null;
    }
}

function inventarioToCSV() {
    const intestazione = "codice,prezzo,descrizione,emoji";
    const righe = inventario.map(p => {
        const desc = `"${String(p.descrizione || "").replace(/"/g, '""')}"`;
        const em = `"${String(p.emoji || "").replace(/"/g, '""')}"`;
        return [p.codice, p.prezzo, desc, em].join(",");
    });
    return [intestazione, ...righe].join("\r\n");
}

function parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === "," && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

function csvToInventario(csv) {
    const righe = csv.replace(/\r/g, "").split("\n").filter(r => r.trim() !== "");
    if (righe.length < 2) return [];
    return righe.slice(1).map(riga => {
        const campi = parseCSVLine(riga);
        if (campi.length < 3) return null;
        const prezzo = parseFloat(campi[1]);
        if (isNaN(prezzo)) return null;
        return {
            codice: campi[0].trim(),
            prezzo,
            descrizione: campi[2].trim(),
            emoji: (campi[3] || "").trim() || "🛒"
        };
    }).filter(Boolean);
}

function aggiornaBadgeDB(stato, nomeFile) {
    const statusDiv = document.getElementById("dbStatus");
    const statusText = document.getElementById("dbStatusText");
    const btnRiconnetti = document.getElementById("btnRiconnetti");
    const btnApriCSV = document.getElementById("btnApriCSV");
    const btnCreaCSV = document.getElementById("btnCreaCSV");

    statusDiv.className = "db-status db-" + stato;

    if (stato === "connected") {
        statusText.textContent = "✅ " + nomeFile;
        btnRiconnetti.style.display = "none";
        btnApriCSV.style.display = "";
        btnCreaCSV.style.display = "";
    } else if (stato === "pending") {
        statusText.textContent = "⏳ Permesso richiesto: " + nomeFile;
        btnRiconnetti.style.display = "";
        btnApriCSV.style.display = "";
        btnCreaCSV.style.display = "";
    } else {
        statusText.textContent = "Nessun database CSV caricato";
        btnRiconnetti.style.display = "none";
        btnApriCSV.style.display = "";
        btnCreaCSV.style.display = "";
    }
}

function caricaDaLocalStorage() {
    const salvato = localStorage.getItem("inventario-mini-market");
    if (salvato) {
        try {
            inventario = JSON.parse(salvato);
        } catch (e) {
            console.warn("Inventario localStorage non valido, ripristino prodotti base.", e);
            inventario = [...prodottiBase];
        }
    } else {
        inventario = [...prodottiBase];
    }
}

async function leggiDaCSV() {
    if (!dbFileHandle) return;
    const file = await dbFileHandle.getFile();
    const testo = await file.text();
    const letto = csvToInventario(testo);
    if (letto.length === 0) {
        inventario = [...prodottiBase];
        await scriviCSV();
    } else {
        inventario = letto;
    }
}

async function scriviCSV() {
    if (!dbFileHandle) return;
    const writable = await dbFileHandle.createWritable();
    await writable.write(inventarioToCSV());
    await writable.close();
}

async function salvaInventario() {
    if (dbFileHandle) {
        try {
            await scriviCSV();
        } catch (e) {
            console.error("Errore salvataggio CSV:", e);
        }
    } else {
        localStorage.setItem("inventario-mini-market", JSON.stringify(inventario));
    }
}

async function caricaInventario() {
    if (!("showOpenFilePicker" in window)) {
        caricaDaLocalStorage();
        document.getElementById("dbStatus").style.display = "none";
        return;
    }

    const handle = await caricaHandleDaIDB();
    if (!handle) {
        caricaDaLocalStorage();
        aggiornaBadgeDB("disconnected", null);
        return;
    }

    const permesso = await handle.queryPermission({ mode: "readwrite" });
    if (permesso === "granted") {
        dbFileHandle = handle;
        await leggiDaCSV();
        aggiornaBadgeDB("connected", handle.name);
    } else {
        dbFileHandle = handle;
        caricaDaLocalStorage();
        aggiornaBadgeDB("pending", handle.name);
    }
}

async function apriFileCSV() {
    if (!("showOpenFilePicker" in window)) {
        alert("Il tuo browser non supporta la File System Access API. Usa Chrome o Edge.");
        return;
    }
    try {
        const [handle] = await window.showOpenFilePicker({
            types: [{ description: "File CSV", accept: { "text/csv": [".csv"] } }],
            multiple: false
        });
        dbFileHandle = handle;
        await salvaHandleInIDB(handle);
        await leggiDaCSV();
        aggiornaListaArticoli();
        aggiornaBadgeDB("connected", handle.name);
    } catch (e) {
        if (e.name !== "AbortError") {
            console.error("Errore apertura file CSV:", e);
        }
    }
}

async function creaFileCSV() {
    if (!("showSaveFilePicker" in window)) {
        alert("Il tuo browser non supporta la File System Access API. Usa Chrome o Edge.");
        return;
    }
    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: "inventario.csv",
            types: [{ description: "File CSV", accept: { "text/csv": [".csv"] } }]
        });
        dbFileHandle = handle;
        await salvaHandleInIDB(handle);
        await scriviCSV();
        aggiornaBadgeDB("connected", handle.name);
    } catch (e) {
        if (e.name !== "AbortError") {
            console.error("Errore creazione file CSV:", e);
        }
    }
}

async function riconnectiCSV() {
    if (!dbFileHandle) return;
    try {
        const permesso = await dbFileHandle.requestPermission({ mode: "readwrite" });
        if (permesso === "granted") {
            await leggiDaCSV();
            aggiornaListaArticoli();
            aggiornaBadgeDB("connected", dbFileHandle.name);
        }
    } catch (e) {
        console.error("Errore riconnessione CSV:", e);
    }
}

// === Fine CSV Database ===

function formatEuro(valore) {
    return Number(valore).toFixed(2);
}

function pulisciCampiInventario() {
    document.getElementById("codice").value = "";
    document.getElementById("prezzo").value = "";
    document.getElementById("descrizione").value = "";
    document.getElementById("emoji").value = "";
}

function generaCodiceUnico() {
    let codice = generaCodiceRandom(8);
    while (inventario.some(a => a.codice === codice)) {
        codice = generaCodiceRandom(8);
    }
    return codice;
}

async function aggiungiArticolo() {
    const codiceInput = document.getElementById("codice");
    let codice = codiceInput.value.trim().toUpperCase();
    const prezzo = Number.parseFloat(document.getElementById("prezzo").value);
    const descrizione = document.getElementById("descrizione").value.trim();
    const emoji = document.getElementById("emoji").value.trim() || "🛒";

    if (!codice) {
        codice = generaCodiceUnico();
        codiceInput.value = codice;
    }

    if (!codice || Number.isNaN(prezzo) || !descrizione) {
        alert("Inserisci codice, prezzo e descrizione.");
        return;
    }

    if (inventario.some(a => a.codice === codice)) {
        alert("Codice già presente in inventario.");
        document.getElementById("codice").focus();
        return;
    }

    inventario.push({ codice, prezzo, descrizione, emoji });
    await salvaInventario();
    aggiornaListaArticoli();
    pulisciCampiInventario();
    document.getElementById("codice").focus();
}

async function modificaArticolo(index) {
    const articolo = inventario[index];
    document.getElementById("codice").value = articolo.codice;
    document.getElementById("prezzo").value = articolo.prezzo;
    document.getElementById("descrizione").value = articolo.descrizione;
    document.getElementById("emoji").value = articolo.emoji || "";
    inventario.splice(index, 1);
    await salvaInventario();
    aggiornaListaArticoli();
    document.getElementById("codice").focus();
}

async function cancellaArticolo(index) {
    inventario.splice(index, 1);
    await salvaInventario();
    aggiornaListaArticoli();
}

function inviaCodiceInCassa(codice) {
    const campo = document.getElementById("codiceCassa");
    campo.value = codice;
    aggiungiAlloScontrino();
}

function aggiornaListaArticoli() {
    const lista = document.getElementById("listaArticoli");

    if (inventario.length === 0) {
        lista.innerHTML = "<p>Nessun prodotto disponibile.</p>";
        return;
    }

    lista.innerHTML = inventario.map((articolo, index) => `
        <article class="item-card">
            <div class="emoji">${articolo.emoji || "🛒"}</div>
            <div class="item-main">
                <p class="item-title">${articolo.descrizione}</p>
                <p class="item-code">Codice: ${articolo.codice}</p>
                <p class="item-price">€${formatEuro(articolo.prezzo)}</p>
            </div>
            <div class="qr" data-codice="${articolo.codice}" aria-label="QR ${articolo.codice}"></div>
            <div class="actions">
                <button class="mini-btn add-btn" onclick="inviaCodiceInCassa('${articolo.codice}')">Aggiungi</button>
                <button class="mini-btn edit-btn" onclick="modificaArticolo(${index})">Modifica</button>
                <button class="mini-btn delete-btn" onclick="cancellaArticolo(${index})">Elimina</button>
            </div>
        </article>
    `).join("");

    generaQrLocali();
}

function aggiungiAlloScontrino() {
    const codice = document.getElementById("codiceCassa").value.trim().toUpperCase();
    if (!codice) {
        return;
    }

    const articolo = inventario.find(a => a.codice === codice);
    if (!articolo) {
        alert("Codice non trovato in inventario.");
        document.getElementById("codiceCassa").focus();
        return;
    }

    if (scontrino[codice]) {
        scontrino[codice].quantita += 1;
    } else {
        scontrino[codice] = { ...articolo, quantita: 1 };
    }

    aggiornaScontrino();
    document.getElementById("codiceCassa").value = "";
    document.getElementById("codiceCassa").focus();
}

function aggiornaScontrino() {
    const scontrinoDiv = document.getElementById("scontrino");
    const righe = Object.values(scontrino);

    if (righe.length === 0) {
        scontrinoDiv.innerHTML = "<p>Scontrino vuoto.</p>";
        document.getElementById("totale").textContent = "0.00";
        salvaScontrinoSuCookie();
        return;
    }

    let totale = 0;
    scontrinoDiv.innerHTML = righe.map(articolo => {
        const subtotale = articolo.prezzo * articolo.quantita;
        totale += subtotale;
        return `
            <div class="rice-item">
                <span>${articolo.emoji || "🛒"} ${articolo.quantita} x ${articolo.descrizione}</span>
                <strong>€${formatEuro(subtotale)}</strong>
            </div>
        `;
    }).join("");

    document.getElementById("totale").textContent = formatEuro(totale);
    salvaScontrinoSuCookie();
}

function azzeraScontrino() {
    scontrino = {};
    aggiornaScontrino();
    document.getElementById("codiceCassa").focus();
}

function inizializzaEmojiPicker() {
    const campoEmoji = document.getElementById("emoji");
    const toggleEmoji = document.getElementById("emojiToggle");
    const picker = document.getElementById("emojiPicker");

    if (!campoEmoji || !toggleEmoji || !picker) {
        return;
    }

    picker.innerHTML = emojiProdottiPerCategoria
        .map(gruppo => `
            <section class="emoji-category">
                <h3 class="emoji-category-title">${gruppo.categoria}</h3>
                <div class="emoji-grid">
                    ${gruppo.emoji
                        .map(emoji => `<button type="button" class="emoji-option" data-emoji="${emoji}" aria-label="Seleziona ${emoji}">${emoji}</button>`)
                        .join("")}
                </div>
            </section>
        `)
        .join("");

    function apriPicker() {
        picker.classList.add("open");
    }

    function chiudiPicker() {
        picker.classList.remove("open");
    }

    toggleEmoji.addEventListener("click", function() {
        if (picker.classList.contains("open")) {
            chiudiPicker();
        } else {
            apriPicker();
            campoEmoji.focus();
        }
    });

    campoEmoji.addEventListener("focus", apriPicker);
    campoEmoji.addEventListener("click", apriPicker);

    picker.addEventListener("click", function(event) {
        const bottone = event.target.closest(".emoji-option");
        if (!bottone) {
            return;
        }
        campoEmoji.value = bottone.dataset.emoji || "";
        chiudiPicker();
        campoEmoji.focus();
    });

    document.addEventListener("click", function(event) {
        const dentroPicker = event.target.closest(".emoji-field");
        if (!dentroPicker) {
            chiudiPicker();
        }
    });
}

document.getElementById("codiceCassa").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        aggiungiAlloScontrino();
    }
});

document.getElementById("emoji").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        aggiungiArticolo();
    }
});

window.addEventListener("load", async function() {
    await caricaInventario();
    caricaScontrinoDaCookie();
    aggiornaListaArticoli();
    aggiornaScontrino();
    inizializzaEmojiPicker();
    document.getElementById("codiceCassa").focus();
});
