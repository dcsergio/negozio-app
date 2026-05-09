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

function salvaInventario() {
    localStorage.setItem("inventario-mini-market", JSON.stringify(inventario));
}

function caricaInventario() {
    const salvato = localStorage.getItem("inventario-mini-market");
    if (salvato) {
        try {
            inventario = JSON.parse(salvato);
        } catch (e) {
            console.warn("Inventario salvato non valido, ripristino prodotti base.", e);
            inventario = [...prodottiBase];
        }
    } else {
        inventario = [...prodottiBase];
        salvaInventario();
    }
}

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

function aggiungiArticolo() {
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
    salvaInventario();
    aggiornaListaArticoli();
    pulisciCampiInventario();
    document.getElementById("codice").focus();
}

function modificaArticolo(index) {
    const articolo = inventario[index];
    document.getElementById("codice").value = articolo.codice;
    document.getElementById("prezzo").value = articolo.prezzo;
    document.getElementById("descrizione").value = articolo.descrizione;
    document.getElementById("emoji").value = articolo.emoji || "";
    inventario.splice(index, 1);
    salvaInventario();
    aggiornaListaArticoli();
    document.getElementById("codice").focus();
}

function cancellaArticolo(index) {
    inventario.splice(index, 1);
    salvaInventario();
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

window.addEventListener("load", function() {
    caricaInventario();
    aggiornaListaArticoli();
    aggiornaScontrino();
    inizializzaEmojiPicker();
    document.getElementById("codiceCassa").focus();
});
