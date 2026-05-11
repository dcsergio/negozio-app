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
let codiceInModifica = null;

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

// === PostgreSQL Database (via API backend) ===

function aggiornaBadgeDB(stato, dettaglio) {
    const statusDiv = document.getElementById("dbStatus");
    const statusText = document.getElementById("dbStatusText");
    statusDiv.className = "db-status db-" + stato;

    if (stato === "connected") {
        statusText.textContent = "✅ PostgreSQL connesso";
        return;
    }

    if (stato === "pending") {
        statusText.textContent = "⏳ Connessione a PostgreSQL...";
        return;
    }

    if (dettaglio) {
        statusText.textContent = "❌ " + dettaglio;
        return;
    }

    statusText.textContent = "Database PostgreSQL non connesso";
}

async function apiRequest(path, options = {}) {
    const risposta = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...options
    });

    if (!risposta.ok) {
        let messaggio = "Errore API";
        try {
            const payload = await risposta.json();
            messaggio = payload.message || messaggio;
        } catch {
            // Risposta senza body JSON.
        }
        throw new Error(messaggio);
    }

    if (risposta.status === 204) {
        return null;
    }

    return risposta.json();
}

async function caricaInventario() {
    aggiornaBadgeDB("pending");
    try {
        inventario = await apiRequest("/api/inventario", { method: "GET" });
        aggiornaBadgeDB("connected");
    } catch (e) {
        console.error("Errore caricamento inventario:", e);
        inventario = [];
        aggiornaBadgeDB("disconnected", e.message);
    }
}

async function creaArticoloDB(articolo) {
    await apiRequest("/api/inventario", {
        method: "POST",
        body: JSON.stringify(articolo)
    });
}

async function aggiornaArticoloDB(codice, articolo) {
    await apiRequest(`/api/inventario/${encodeURIComponent(codice)}`, {
        method: "PUT",
        body: JSON.stringify(articolo)
    });
}

async function eliminaArticoloDB(codice) {
    await apiRequest(`/api/inventario/${encodeURIComponent(codice)}`, {
        method: "DELETE"
    });
}

// === Fine PostgreSQL Database ===

function formatEuro(valore) {
    return Number(valore).toFixed(2);
}

function normalizzaNomeColonna(nome) {
    return String(nome || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "");
}

function parseCsvLine(linea, separatore) {
    const campi = [];
    let corrente = "";
    let dentroVirgolette = false;

    for (let i = 0; i < linea.length; i += 1) {
        const carattere = linea[i];
        const prossimo = linea[i + 1];

        if (carattere === '"') {
            if (dentroVirgolette && prossimo === '"') {
                corrente += '"';
                i += 1;
            } else {
                dentroVirgolette = !dentroVirgolette;
            }
            continue;
        }

        if (carattere === separatore && !dentroVirgolette) {
            campi.push(corrente.trim());
            corrente = "";
            continue;
        }

        corrente += carattere;
    }

    campi.push(corrente.trim());
    return campi;
}

function convertiPrezzoCsv(valore) {
    const pulito = String(valore || "")
        .replaceAll(/\s+/g, "")
        .replace("€", "")
        .replace(",", ".");
    return Number.parseFloat(pulito);
}

function rilevaSeparatoreCsv(riga) {
    return (riga.match(/;/g) || []).length > (riga.match(/,/g) || []).length ? ";" : ",";
}

function estraiIndiciCsv(intestazioni) {
    const mappeCampi = {
        codice: ["codice", "code", "sku"],
        prezzo: ["prezzo", "price", "costo"],
        descrizione: ["descrizione", "description", "nome", "prodotto"],
        emoji: ["emoji", "icona", "icon"]
    };

    return {
        codice: intestazioni.findIndex(col => mappeCampi.codice.includes(col)),
        prezzo: intestazioni.findIndex(col => mappeCampi.prezzo.includes(col)),
        descrizione: intestazioni.findIndex(col => mappeCampi.descrizione.includes(col)),
        emoji: intestazioni.findIndex(col => mappeCampi.emoji.includes(col))
    };
}

function estraiValoreColonna(colonne, indice, fallback) {
    if (indice >= 0) {
        return colonne[indice];
    }
    return colonne[fallback];
}

function parseRigaProdottoCsv(colonne, numeroRiga, usaIntestazioni, indici) {
    const codiceRaw = estraiValoreColonna(colonne, usaIntestazioni ? indici.codice : -1, 0);
    const prezzoRaw = estraiValoreColonna(colonne, usaIntestazioni ? indici.prezzo : -1, 1);
    const descrizioneRaw = estraiValoreColonna(colonne, usaIntestazioni ? indici.descrizione : -1, 2);
    const emojiRaw = estraiValoreColonna(colonne, usaIntestazioni ? indici.emoji : -1, 3);

    const codice = String(codiceRaw || "").trim().toUpperCase();
    const prezzo = convertiPrezzoCsv(prezzoRaw);
    const descrizione = String(descrizioneRaw || "").trim();
    const emoji = String(emojiRaw || "").trim() || "🛒";

    if (!codice && !descrizione && Number.isNaN(prezzo)) {
        return null;
    }

    if (!codice || !descrizione || Number.isNaN(prezzo)) {
        throw new Error(`Dati non validi alla riga ${numeroRiga}.`);
    }

    return { codice, prezzo, descrizione, emoji };
}

function parseProdottiDaCsv(testoCsv) {
    const testo = String(testoCsv || "").replace(/^\uFEFF/, "");
    const righe = testo
        .split(/\r?\n/)
        .map(riga => riga.trim())
        .filter(Boolean);

    if (righe.length === 0) {
        throw new Error("Il file CSV è vuoto.");
    }

    const primaRiga = righe[0];
    const separatore = rilevaSeparatoreCsv(primaRiga);
    const intestazioni = parseCsvLine(primaRiga, separatore).map(normalizzaNomeColonna);

    const indicePerCampo = estraiIndiciCsv(intestazioni);

    const haIntestazioniValide = indicePerCampo.codice >= 0 && indicePerCampo.prezzo >= 0 && indicePerCampo.descrizione >= 0;
    const rigaInizioDati = haIntestazioniValide ? 1 : 0;

    const prodotti = [];
    for (let i = rigaInizioDati; i < righe.length; i += 1) {
        const numeroRiga = i + 1;
        const colonne = parseCsvLine(righe[i], separatore);
        const prodotto = parseRigaProdottoCsv(colonne, numeroRiga, haIntestazioniValide, indicePerCampo);
        if (prodotto) {
            prodotti.push(prodotto);
        }
    }

    if (prodotti.length === 0) {
        throw new Error("Nessun prodotto valido trovato nel CSV.");
    }

    const unici = new Map();
    prodotti.forEach(prodotto => {
        unici.set(prodotto.codice, prodotto);
    });

    return Array.from(unici.values());
}

function apriSelettoreImportCsv() {
    const inputFile = document.getElementById("fileImportCsv");
    if (!inputFile) {
        return;
    }

    // Reset value so selecting the same file twice still triggers "change".
    inputFile.value = "";
    inputFile.click();
}

async function importaProdottiDaCsv(fileSelezionato) {
    const inputFile = document.getElementById("fileImportCsv");
    const bottone = document.getElementById("btnImportCsv");
    const file = fileSelezionato || inputFile?.files?.[0];

    if (!file) {
        return;
    }

    bottone.disabled = true;
    bottone.textContent = "⏳ Import in corso...";

    try {
        const contenutoCsv = await file.text();
        const prodottiDaImportare = parseProdottiDaCsv(contenutoCsv);

        const esistenti = new Set(inventario.map(a => a.codice));
        let creati = 0;
        let aggiornati = 0;

        for (const prodotto of prodottiDaImportare) {
            if (esistenti.has(prodotto.codice)) {
                await aggiornaArticoloDB(prodotto.codice, {
                    prezzo: prodotto.prezzo,
                    descrizione: prodotto.descrizione,
                    emoji: prodotto.emoji
                });
                aggiornati += 1;
            } else {
                await creaArticoloDB(prodotto);
                esistenti.add(prodotto.codice);
                creati += 1;
            }
        }

        await caricaInventario();
        aggiornaListaArticoli();
        alert(`Import completato. Creati: ${creati}, aggiornati: ${aggiornati}.`);
        inputFile.value = "";
    } catch (e) {
        alert(e.message || "Errore durante l'import CSV.");
    } finally {
        bottone.disabled = false;
        bottone.textContent = "📥 Importa CSV";
    }
}

function pulisciCampiInventario() {
    document.getElementById("codice").value = "";
    document.getElementById("prezzo").value = "";
    document.getElementById("descrizione").value = "";
    document.getElementById("emoji").value = "";
}

function resetModificaArticolo() {
    codiceInModifica = null;
    document.getElementById("btnAggiungi").textContent = "➕ Aggiungi";
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

    const esisteInLista = inventario.some(a => a.codice === codice);
    const inModifica = codiceInModifica !== null;
    if (inModifica === false && esisteInLista) {
        alert("Codice già presente in inventario.");
        document.getElementById("codice").focus();
        return;
    }

    try {
        if (inModifica) {
            if (codice === codiceInModifica) {
                await aggiornaArticoloDB(codiceInModifica, { prezzo, descrizione, emoji });
            } else {
                if (esisteInLista) {
                    alert("Codice già presente in inventario.");
                    document.getElementById("codice").focus();
                    return;
                }

                await eliminaArticoloDB(codiceInModifica);
                await creaArticoloDB({ codice, prezzo, descrizione, emoji });
            }
        } else {
            await creaArticoloDB({ codice, prezzo, descrizione, emoji });
        }

        await caricaInventario();
        aggiornaListaArticoli();
        pulisciCampiInventario();
        resetModificaArticolo();
        document.getElementById("codice").focus();
    } catch (e) {
        alert(e.message || "Errore durante il salvataggio.");
    }
}

async function modificaArticolo(index) {
    const articolo = inventario[index];
    document.getElementById("codice").value = articolo.codice;
    document.getElementById("prezzo").value = articolo.prezzo;
    document.getElementById("descrizione").value = articolo.descrizione;
    document.getElementById("emoji").value = articolo.emoji || "";
    codiceInModifica = articolo.codice;
    document.getElementById("btnAggiungi").textContent = "💾 Salva modifica";
    document.getElementById("codice").focus();
}

async function cancellaArticolo(index) {
    const articolo = inventario[index];
    if (!articolo) {
        return;
    }

    try {
        await eliminaArticoloDB(articolo.codice);
        if (codiceInModifica === articolo.codice) {
            pulisciCampiInventario();
            resetModificaArticolo();
        }
        await caricaInventario();
        aggiornaListaArticoli();
    } catch (e) {
        alert(e.message || "Errore durante la cancellazione.");
    }
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

function aumentaQuantita(codice) {
    if (scontrino[codice]) {
        scontrino[codice].quantita += 1;
        aggiornaScontrino();
    }
}

function riduciQuantita(codice) {
    if (!scontrino[codice]) {
        return;
    }
    scontrino[codice].quantita -= 1;
    if (scontrino[codice].quantita <= 0) {
        delete scontrino[codice];
    }
    aggiornaScontrino();
}

function aggiornaScontrino() {
    const scontrinoDiv = document.getElementById("scontrino");
    const righe = Object.values(scontrino);

    if (righe.length === 0) {
        scontrinoDiv.innerHTML = "<p>Scontrino vuoto.</p>";
        document.getElementById("totale").textContent = "0.00";
        return;
    }

    let totale = 0;
    scontrinoDiv.innerHTML = righe.map(articolo => {
        const subtotale = articolo.prezzo * articolo.quantita;
        totale += subtotale;
        return `
            <div class="rice-item">
                <span class="rice-item-label">${articolo.emoji || "🛒"} ${articolo.descrizione}</span>
                <div class="rice-item-controls">
                    <button class="qty-btn qty-minus" onclick="riduciQuantita('${articolo.codice}')" title="Riduci quantità">−</button>
                    <span class="qty-value">${articolo.quantita}</span>
                    <button class="qty-btn qty-plus" onclick="aumentaQuantita('${articolo.codice}')" title="Aumenta quantità">+</button>
                    <strong class="rice-item-price">€${formatEuro(subtotale)}</strong>
                </div>
            </div>
        `;
    }).join("");

    document.getElementById("totale").textContent = formatEuro(totale);
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
    const inputFileImport = document.getElementById("fileImportCsv");
    if (inputFileImport) {
        inputFileImport.addEventListener("change", function() {
            const file = inputFileImport.files?.[0];
            if (file) {
                importaProdottiDaCsv(file);
            }
        });
    }

    await caricaInventario();
    aggiornaListaArticoli();
    aggiornaScontrino();
    inizializzaEmojiPicker();
    document.getElementById("codiceCassa").focus();
});
