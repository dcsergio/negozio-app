function generateRandomCode(length = 8) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < length; i += 1) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

let inventory = [];
let receipt = {};
let editingCode = null;
let toastTimerId = 0;
let confirmResolver = null;
let locale = "en";
let messages = { it: {}, en: {} };

const EMOJI_GROUPS = [
    { categoryKey: "emoji.categories.fruit", emoji: ["1F34E", "1F34C", "1F34A", "1F34B", "1F349", "1F353", "1F352", "1F351", "1F95D", "1F350", "1F34D", "1F96D", "1F348"] },
    { categoryKey: "emoji.categories.vegetables", emoji: ["1F955", "1F954", "1F9C5", "1F9C4", "1F96C", "1F966", "1F33D", "1F345", "1F952", "1F336-FE0F", "1FAD1", "1FAD2"] },
    { categoryKey: "emoji.categories.groceries", emoji: ["1F35E", "1F950", "1F956", "1F968", "1F373", "1F95A", "1F9C0", "1F95B", "1F37C", "1F35D", "1F35A", "1F35B", "1F35C", "1F372"] },
    { categoryKey: "emoji.categories.meatFish", emoji: ["1F357", "1F356", "1F969", "1F953", "1F41F", "1F420", "1F990", "1F99E", "1F980", "1F419", "1F991", "1F9AA"] },
    { categoryKey: "emoji.categories.snacks", emoji: ["1F355", "1F354", "1F35F", "1F32D", "1F32E", "1F32F", "1F959", "1F957", "1F36A", "1F370", "1F382", "1F9C1", "1F36B", "1F36C"] },
    { categoryKey: "emoji.categories.drinks", emoji: ["1F964", "1F9C3", "1F9C9", "2615", "1F375", "1F376", "1F37E", "1F377", "1F378", "1F379", "1F37A", "1F37B"] },
    { categoryKey: "emoji.categories.homeHygiene", emoji: ["1F9F4", "1F9FC", "1F9FB", "1F9FD", "1F9F9", "1F9FA", "1FAA5", "1FA92", "1F56F-FE0F", "1F4A1", "1F50B", "1F50C", "1F9F0"] },
    { categoryKey: "emoji.categories.cleaning", emoji: ["1F9F9", "1F9FA", "1FAA3", "1FAA0", "1F9FD", "1F9F4", "1F9FC", "1F9FB"] },
    { categoryKey: "emoji.categories.school", emoji: ["270F-FE0F", "1F58A-FE0F", "1F58D-FE0F", "2712-FE0F", "1F58C-FE0F", "1F4DD", "1F4D3", "1F4D4", "1F4D2", "1F4D5", "1F4D7", "1F4D8", "1F4D9", "1F5C2-FE0F", "1F4CE", "1F4CF", "1F4D0", "2702-FE0F", "1F587-FE0F"] },
    { categoryKey: "emoji.categories.books", emoji: ["1F4DA", "1F4D6", "1F4D5", "1F4D7", "1F4D8", "1F4D9", "1F393", "1F4F0", "1F5DE-FE0F", "1F4D1"] },
    { categoryKey: "emoji.categories.toys", emoji: ["1F9F8", "1FA80", "1F3AF", "1F9E9", "1FA86", "1F3B2", "1F3AE", "1F3B0", "1F697", "1F695", "1F699", "1F68C", "1F68E", "1F3CE-FE0F"] },
    { categoryKey: "emoji.categories.sports", emoji: ["26BD", "1F3C0", "1F3C8", "26BE", "1F94E", "1F3BE", "1F3D0", "1F3C9", "1F94F", "1F3B3", "26F3", "1F3A3", "1F3BD", "1F3BF"] },
    { categoryKey: "emoji.categories.accessories", emoji: ["1F452", "231A", "1F453", "1F576-FE0F", "1F484", "1F48D", "1F45C", "1F392", "1F45D", "1F9E3", "1F9E4", "1F9E5", "1F9E6", "1F45F"] },
    { categoryKey: "emoji.categories.technology", emoji: ["1F4F1", "1F4BB", "2328-FE0F", "1F5A5-FE0F", "1F5A8-FE0F", "1F4F7", "1F4F9", "1F4FD-FE0F", "1F3A5", "1F3AC", "1F4FA", "1F4FB", "1F4DE"] },
    { categoryKey: "emoji.categories.natureAnimals", emoji: ["1F333", "1F332", "1F334", "1F331", "1F33F", "1F340", "1F33E", "1F33B", "1F337", "1F339", "1F940", "1F490", "1F33A", "1F436", "1F431", "1F42D", "1F439", "1F430"] }
];

function getMessage(key, params = {}) {
    const selected = messages[locale] || {};
    const fallback = messages.en || {};
    const value = key
        .split(".")
        .reduce((obj, part) => (obj && part in obj ? obj[part] : undefined), selected)
        ?? key.split(".").reduce((obj, part) => (obj && part in obj ? obj[part] : undefined), fallback)
        ?? key;

    if (typeof value !== "string") {
        return key;
    }

    return value.replaceAll(/\{(\w+)\}/g, (full, name) => {
        if (!(name in params)) {
            return full;
        }
        return String(params[name]);
    });
}

async function loadTranslations() {
    const response = await fetch("/i18n/messages.json", { cache: "no-store" });
    if (!response.ok) {
        throw new Error("Unable to load i18n/messages.json");
    }
    messages = await response.json();
}

function setDocumentLanguage(lang) {
    locale = lang === "it" ? "it" : "en";
    localStorage.setItem("negozio.lang", locale);
    document.documentElement.lang = locale;

    const btnIt = document.getElementById("langIt");
    const btnEn = document.getElementById("langEn");
    btnIt?.classList.toggle("active", locale === "it");
    btnEn?.classList.toggle("active", locale === "en");

    applyStaticTranslations();
    updateDbBadge(currentDbStatus.state, currentDbStatus.detail);
    resetItemEditState();
    renderInventoryList();
    renderReceipt();
    initEmojiPicker();
}

function applyStaticTranslations() {
    document.title = getMessage("app.title");

    document.querySelectorAll("[data-i18n]").forEach(node => {
        const key = node.getAttribute("data-i18n");
        if (key) {
            node.textContent = getMessage(key);
        }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(node => {
        const key = node.getAttribute("data-i18n-placeholder");
        if (key) {
            node.setAttribute("placeholder", getMessage(key));
        }
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach(node => {
        const key = node.getAttribute("data-i18n-aria-label");
        if (key) {
            node.setAttribute("aria-label", getMessage(key));
        }
    });
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

    const normalizeParts = codepoint => codepoint
        .split("-")
        .filter(part => part !== "FE0F")
        .join("-");

    if (/^[0-9A-Fa-f]+(?:-[0-9A-Fa-f]+)*$/.test(raw)) {
        return normalizeParts(raw.toUpperCase());
    }

    return normalizeParts(emojiToOpenMojiCodepoint(raw));
}

function openMojiUrl(emoji) {
    const codepoint = normalizeOpenMojiCodepoint(emoji);
    if (!codepoint) {
        return "";
    }
    return `https://cdn.jsdelivr.net/npm/openmoji@17.0.0/color/svg/${codepoint}.svg`;
}

function renderEmojiImage(emoji, alt = "icon", className = "emoji-img") {
    const symbol = String(emoji || "").trim() || "1F6D2";
    const src = openMojiUrl(symbol);
    if (!src) {
        return "";
    }
    return `<img class="${className}" src="${src}" alt="${alt}" width="20" height="20">`;
}

function resolveConfirm(result) {
    if (confirmResolver) {
        confirmResolver(result);
        confirmResolver = null;
    }
}

function showToast(message, type = "warning", duration = 3600) {
    const container = document.getElementById("popupContainer");
    if (!container) {
        return;
    }

    const icons = { success: "2705", warning: "26A0-FE0F", error: "274C" };
    const noticeType = icons[type] ? type : "warning";
    const id = `popup-${toastTimerId}`;
    toastTimerId += 1;

    const toast = document.createElement("div");
    toast.className = `popup popup-${noticeType}`;
    toast.dataset.popupId = id;
    toast.setAttribute("role", noticeType === "error" ? "alert" : "status");
    toast.innerHTML = `
        <span class="popup-icon" aria-hidden="true">${renderEmojiImage(icons[noticeType], getMessage("a11y.notification"), "emoji-img popup-emoji")}</span>
        <span class="popup-message">${message}</span>
        <button type="button" class="popup-close" aria-label="${getMessage("a11y.closeNotification")}">✕</button>
    `;

    function closeToast() {
        toast.classList.remove("show");
        globalThis.setTimeout(() => {
            toast.remove();
        }, 190);
    }

    toast.querySelector(".popup-close")?.addEventListener("click", closeToast);

    container.appendChild(toast);
    globalThis.requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    if (container.children.length > 4) {
        container.firstElementChild?.remove();
    }

    globalThis.setTimeout(closeToast, duration);
}

function initConfirmModal() {
    const modal = document.getElementById("confirmModal");
    const card = modal?.querySelector(".confirm-modal-card");
    const cancelButton = document.getElementById("confirmModalCancel");
    const confirmButton = document.getElementById("confirmModalConfirm");

    if (!modal || !card || !cancelButton || !confirmButton) {
        return;
    }

    cancelButton.addEventListener("click", () => {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        card.removeAttribute("open");
        resolveConfirm(false);
    });

    confirmButton.addEventListener("click", () => {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        card.removeAttribute("open");
        resolveConfirm(true);
    });

    modal.addEventListener("click", event => {
        const closingArea = event.target.closest("[data-modal-close='true']");
        if (!closingArea) {
            return;
        }
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        card.removeAttribute("open");
        resolveConfirm(false);
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && modal.classList.contains("open")) {
            modal.classList.remove("open");
            modal.setAttribute("aria-hidden", "true");
            card.removeAttribute("open");
            resolveConfirm(false);
        }
    });
}

function showConfirm({ title, message, confirmLabel, variant = "danger" }) {
    const modal = document.getElementById("confirmModal");
    const card = modal?.querySelector(".confirm-modal-card");
    const titleNode = document.getElementById("confirmModalTitle");
    const messageNode = document.getElementById("confirmModalMessage");
    const confirmButton = document.getElementById("confirmModalConfirm");
    const cancelButton = document.getElementById("confirmModalCancel");

    if (!modal || !card || !titleNode || !messageNode || !confirmButton || !cancelButton) {
        return Promise.resolve(false);
    }

    titleNode.textContent = title || getMessage("modal.confirmTitle");
    messageNode.textContent = message || getMessage("modal.confirmMessage");
    confirmButton.textContent = confirmLabel || getMessage("actions.confirm");
    cancelButton.textContent = getMessage("actions.cancel");

    confirmButton.classList.remove("confirm-btn-danger", "confirm-btn-safe");
    confirmButton.classList.add(variant === "safe" ? "confirm-btn-safe" : "confirm-btn-danger");

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    card.setAttribute("open", "");
    cancelButton.focus();

    return new Promise(resolve => {
        confirmResolver = resolve;
    });
}

function generateLocalQrs() {
    const qrNodes = document.querySelectorAll(".qr[data-code]");
    const containerSize = 94;
    const quietZone = 6;
    const qrSize = containerSize - (quietZone * 2);

    qrNodes.forEach(node => {
        const code = node.dataset.code || "";
        node.innerHTML = "";

        if (!code || typeof QRCode === "undefined") {
            node.textContent = getMessage("inventory.qrUnavailable");
            return;
        }

        const qrCode = new QRCode(node, {
            text: code,
            width: qrSize,
            height: qrSize,
            colorDark: "#121212",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });

        qrCode.makeImage();
    });
}

const currentDbStatus = { state: "disconnected", detail: "" };

function updateDbBadge(state, detail) {
    const statusDiv = document.getElementById("dbStatus");
    const statusText = document.getElementById("dbStatusText");
    if (!statusDiv || !statusText) {
        return;
    }

    currentDbStatus.state = state;
    currentDbStatus.detail = detail || "";
    statusDiv.className = `db-status db-${state}`;

    if (state === "connected") {
        statusText.innerHTML = `${renderEmojiImage("2705", getMessage("a11y.connected"), "emoji-img status-emoji")} ${getMessage("db.connected")}`;
        return;
    }

    if (state === "pending") {
        statusText.innerHTML = `${renderEmojiImage("23F3", getMessage("a11y.pending"), "emoji-img status-emoji")} ${getMessage("db.connecting")}`;
        return;
    }

    if (detail) {
        statusText.innerHTML = `${renderEmojiImage("274C", getMessage("a11y.error"), "emoji-img status-emoji")} ${detail}`;
        return;
    }

    statusText.textContent = getMessage("db.disconnected");
}

function mapApiItemToUi(apiItem) {
    return {
        code: apiItem.codice,
        price: Number(apiItem.prezzo),
        description: apiItem.descrizione,
        emoji: apiItem.emoji
    };
}

function mapUiItemToApi(uiItem) {
    return {
        codice: uiItem.code,
        prezzo: uiItem.price,
        descrizione: uiItem.description,
        emoji: uiItem.emoji
    };
}

async function apiRequest(path, options = {}) {
    const response = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...options
    });

    if (!response.ok) {
        let message = getMessage("errors.apiError");
        try {
            const payload = await response.json();
            message = payload.message || message;
        } catch {
            // Response had no JSON body.
        }
        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

async function loadInventory() {
    updateDbBadge("pending");
    try {
        const apiItems = await apiRequest("/api/inventario", { method: "GET" });
        inventory = apiItems.map(mapApiItemToUi);
        updateDbBadge("connected");
    } catch (error) {
        console.error("Inventory loading error:", error);
        inventory = [];
        updateDbBadge("disconnected", error.message);
    }
}

async function createItemDb(item) {
    await apiRequest("/api/inventario", {
        method: "POST",
        body: JSON.stringify(mapUiItemToApi(item))
    });
}

async function updateItemDb(code, item) {
    await apiRequest(`/api/inventario/${encodeURIComponent(code)}`, {
        method: "PUT",
        body: JSON.stringify(mapUiItemToApi(item))
    });
}

async function deleteItemDb(code) {
    await apiRequest(`/api/inventario/${encodeURIComponent(code)}`, {
        method: "DELETE"
    });
}

function formatEuro(value) {
    return Number(value).toFixed(2);
}

function normalizeHeaderName(name) {
    return String(name || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replaceAll(/[\u0300-\u036f]/g, "");
}

function parseCsvLine(line, separator) {
    const fields = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        const next = line[i + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === separator && !inQuotes) {
            fields.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    fields.push(current.trim());
    return fields;
}

function parseCsvPrice(value) {
    const clean = String(value || "")
        .replaceAll(/\s+/g, "")
        .replace("€", "")
        .replace(",", ".");
    return Number.parseFloat(clean);
}

function detectCsvSeparator(line) {
    return (line.match(/;/g) || []).length > (line.match(/,/g) || []).length ? ";" : ",";
}

function extractCsvIndexes(headers) {
    const fieldMaps = {
        code: ["codice", "code", "sku"],
        price: ["prezzo", "price", "costo"],
        description: ["descrizione", "description", "nome", "prodotto", "product", "name"],
        emoji: ["emoji", "icona", "icon"]
    };

    return {
        code: headers.findIndex(col => fieldMaps.code.includes(col)),
        price: headers.findIndex(col => fieldMaps.price.includes(col)),
        description: headers.findIndex(col => fieldMaps.description.includes(col)),
        emoji: headers.findIndex(col => fieldMaps.emoji.includes(col))
    };
}

function extractColumnValue(columns, index, fallback) {
    if (index >= 0) {
        return columns[index];
    }
    return columns[fallback];
}

function parseCsvProductRow(columns, rowNumber, useHeaders, indexes) {
    const codeRaw = extractColumnValue(columns, useHeaders ? indexes.code : -1, 0);
    const priceRaw = extractColumnValue(columns, useHeaders ? indexes.price : -1, 1);
    const descriptionRaw = extractColumnValue(columns, useHeaders ? indexes.description : -1, 2);
    const emojiRaw = extractColumnValue(columns, useHeaders ? indexes.emoji : -1, 3);

    const code = String(codeRaw || "").trim().toUpperCase();
    const price = parseCsvPrice(priceRaw);
    const description = String(descriptionRaw || "").trim();
    const emoji = normalizeOpenMojiCodepoint(String(emojiRaw || "").trim()) || "1F6D2";

    if (!code && !description && Number.isNaN(price)) {
        return null;
    }

    if (!code || !description || Number.isNaN(price)) {
        throw new Error(getMessage("errors.invalidCsvRow", { row: rowNumber }));
    }

    return { code, price, description, emoji };
}

function parseProductsFromCsv(csvText) {
    const text = String(csvText || "").replace(/^\uFEFF/, "");
    const rows = text
        .split(/\r?\n/)
        .map(row => row.trim())
        .filter(Boolean);

    if (rows.length === 0) {
        throw new Error(getMessage("errors.emptyCsv"));
    }

    const firstRow = rows[0];
    const separator = detectCsvSeparator(firstRow);
    const headers = parseCsvLine(firstRow, separator).map(normalizeHeaderName);

    const indexes = extractCsvIndexes(headers);
    const validHeaders = indexes.code >= 0 && indexes.price >= 0 && indexes.description >= 0;
    const firstDataRow = validHeaders ? 1 : 0;

    const parsed = [];
    for (let i = firstDataRow; i < rows.length; i += 1) {
        const rowNumber = i + 1;
        const columns = parseCsvLine(rows[i], separator);
        const product = parseCsvProductRow(columns, rowNumber, validHeaders, indexes);
        if (product) {
            parsed.push(product);
        }
    }

    if (parsed.length === 0) {
        throw new Error(getMessage("errors.noValidCsvItems"));
    }

    const unique = new Map();
    parsed.forEach(product => {
        unique.set(product.code, product);
    });

    return Array.from(unique.values());
}

function openCsvImportPicker() {
    const fileInput = document.getElementById("csvImportFile");
    if (!fileInput) {
        return;
    }

    fileInput.value = "";
    fileInput.click();
}

async function importProductsFromCsv(selectedFile) {
    const fileInput = document.getElementById("csvImportFile");
    const importButton = document.getElementById("btnImportCsv");
    const file = selectedFile || fileInput?.files?.[0];

    if (!file || !importButton || !fileInput) {
        return;
    }

    importButton.disabled = true;
    importButton.innerHTML = `${renderEmojiImage("23F3", getMessage("a11y.pending"))} ${getMessage("actions.importing")}`;

    try {
        const csvContent = await file.text();
        const productsToImport = parseProductsFromCsv(csvContent);

        const existingCodes = new Set(inventory.map(item => item.code));
        let created = 0;
        let updated = 0;

        for (const product of productsToImport) {
            if (existingCodes.has(product.code)) {
                await updateItemDb(product.code, product);
                updated += 1;
            } else {
                await createItemDb(product);
                existingCodes.add(product.code);
                created += 1;
            }
        }

        await loadInventory();
        renderInventoryList();
        showToast(getMessage("messages.importCompleted", { created, updated }), "success");
        fileInput.value = "";
    } catch (error) {
        showToast(error.message || getMessage("errors.importCsv"), "error");
    } finally {
        importButton.disabled = false;
        importButton.innerHTML = `${renderEmojiImage("1F4E5", getMessage("a11y.import"))} ${getMessage("actions.importCsv")}`;
    }
}

function clearInventoryFields() {
    document.getElementById("code").value = "";
    document.getElementById("price").value = "";
    document.getElementById("description").value = "";
    document.getElementById("emoji").value = "";
}

function resetItemEditState() {
    editingCode = null;
    const addButton = document.getElementById("btnAddItem");
    if (addButton) {
        addButton.innerHTML = `${renderEmojiImage("2795", getMessage("a11y.add"))} ${getMessage("actions.add")}`;
    }
}

function generateUniqueCode() {
    let code = generateRandomCode(8);
    while (inventory.some(item => item.code === code)) {
        code = generateRandomCode(8);
    }
    return code;
}

async function addOrUpdateItem() {
    const codeInput = document.getElementById("code");
    let code = codeInput.value.trim().toUpperCase();
    const price = Number.parseFloat(document.getElementById("price").value);
    const description = document.getElementById("description").value.trim();
    const emoji = normalizeOpenMojiCodepoint(document.getElementById("emoji").value.trim()) || "1F6D2";

    if (!code) {
        code = generateUniqueCode();
        codeInput.value = code;
    }

    if (!code || Number.isNaN(price) || !description) {
        showToast(getMessage("errors.missingFields"), "warning");
        return;
    }

    const alreadyExists = inventory.some(item => item.code === code);
    const isEditing = editingCode !== null;

    if (!isEditing && alreadyExists) {
        showToast(getMessage("errors.codeAlreadyExists"), "warning");
        document.getElementById("code").focus();
        return;
    }

    const payload = { code, price, description, emoji };

    try {
        if (isEditing) {
            if (code === editingCode) {
                await updateItemDb(editingCode, payload);
                showToast(getMessage("messages.itemUpdated"), "success");
            } else {
                if (alreadyExists) {
                    showToast(getMessage("errors.codeAlreadyExists"), "warning");
                    document.getElementById("code").focus();
                    return;
                }
                await deleteItemDb(editingCode);
                await createItemDb(payload);
                showToast(getMessage("messages.itemUpdatedWithNewCode"), "success");
            }
        } else {
            await createItemDb(payload);
            showToast(getMessage("messages.itemAdded"), "success");
        }

        await loadInventory();
        renderInventoryList();
        clearInventoryFields();
        resetItemEditState();
        document.getElementById("code").focus();
    } catch (error) {
        showToast(error.message || getMessage("errors.saveItem"), "error");
    }
}

async function editItem(index) {
    const item = inventory[index];
    if (!item) {
        return;
    }

    document.getElementById("code").value = item.code;
    document.getElementById("price").value = item.price;
    document.getElementById("description").value = item.description;
    document.getElementById("emoji").value = normalizeOpenMojiCodepoint(item.emoji) || "";

    editingCode = item.code;

    const addButton = document.getElementById("btnAddItem");
    if (addButton) {
        addButton.innerHTML = `${renderEmojiImage("1F4BE", getMessage("a11y.save"))} ${getMessage("actions.saveChanges")}`;
    }

    document.getElementById("code").focus();
}

async function deleteItem(index) {
    const item = inventory[index];
    if (!item) {
        return;
    }

    const confirmed = await showConfirm({
        title: getMessage("modal.confirmDeleteTitle"),
        message: getMessage("modal.confirmDeleteItem", { description: item.description, code: item.code }),
        confirmLabel: getMessage("actions.delete"),
        variant: "danger"
    });

    if (!confirmed) {
        return;
    }

    try {
        await deleteItemDb(item.code);
        if (editingCode === item.code) {
            clearInventoryFields();
            resetItemEditState();
        }
        await loadInventory();
        renderInventoryList();
        showToast(getMessage("messages.itemDeleted"), "success");
    } catch (error) {
        showToast(error.message || getMessage("errors.deleteItem"), "error");
    }
}

function sendCodeToCheckout(code) {
    const field = document.getElementById("checkoutCode");
    field.value = code;
    addToReceipt();
}

function renderInventoryList() {
    const list = document.getElementById("itemList");
    if (!list) {
        return;
    }

    if (inventory.length === 0) {
        list.innerHTML = `<p>${getMessage("inventory.empty")}</p>`;
        return;
    }

    list.innerHTML = inventory.map((item, index) => `
        <article class="item-card">
            <div class="emoji">${renderEmojiImage(item.emoji || "1F6D2", item.description, "emoji-img item-emoji")}</div>
            <div class="item-main">
                <p class="item-title">${item.description}</p>
                <p class="item-code">${getMessage("inventory.code")}: ${item.code}</p>
                <p class="item-price">€${formatEuro(item.price)}</p>
            </div>
            <div class="qr" data-code="${item.code}" aria-label="QR ${item.code}"></div>
            <div class="actions">
                <button class="mini-btn add-btn" onclick="sendCodeToCheckout('${item.code}')">${getMessage("actions.add")}</button>
                <button class="mini-btn edit-btn" onclick="editItem(${index})">${getMessage("actions.edit")}</button>
                <button class="mini-btn delete-btn" onclick="deleteItem(${index})">${getMessage("actions.delete")}</button>
            </div>
        </article>
    `).join("");

    generateLocalQrs();
}

function addToReceipt() {
    const code = document.getElementById("checkoutCode").value.trim().toUpperCase();
    if (!code) {
        return;
    }

    const item = inventory.find(entry => entry.code === code);
    if (!item) {
        showToast(getMessage("errors.codeNotFound"), "warning");
        document.getElementById("checkoutCode").focus();
        return;
    }

    if (receipt[code]) {
        receipt[code].quantity += 1;
    } else {
        receipt[code] = { ...item, quantity: 1 };
    }

    renderReceipt();
    document.getElementById("checkoutCode").value = "";
    document.getElementById("checkoutCode").focus();
}

function increaseQuantity(code) {
    if (receipt[code]) {
        receipt[code].quantity += 1;
        renderReceipt();
    }
}

function decreaseQuantity(code) {
    if (!receipt[code]) {
        return;
    }
    receipt[code].quantity -= 1;
    if (receipt[code].quantity <= 0) {
        delete receipt[code];
    }
    renderReceipt();
}

function renderReceipt() {
    const receiptDiv = document.getElementById("receipt");
    const rows = Object.values(receipt);

    if (!receiptDiv) {
        return;
    }

    if (rows.length === 0) {
        receiptDiv.innerHTML = `<p>${getMessage("checkout.empty")}</p>`;
        document.getElementById("total").textContent = "0.00";
        return;
    }

    let total = 0;
    receiptDiv.innerHTML = rows.map(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;

        return `
            <div class="rice-item">
                <span class="rice-item-label">${renderEmojiImage(item.emoji || "1F6D2", item.description, "emoji-img rice-emoji")} ${item.description}</span>
                <div class="rice-item-controls">
                    <strong class="rice-item-price">€${formatEuro(subtotal)}</strong>
                    <button class="qty-btn qty-minus" onclick="decreaseQuantity('${item.code}')" title="${getMessage("actions.decreaseQuantity")}">−</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn qty-plus" onclick="increaseQuantity('${item.code}')" title="${getMessage("actions.increaseQuantity")}">+</button>
                </div>
            </div>
        `;
    }).join("");

    document.getElementById("total").textContent = formatEuro(total);
}

async function clearReceipt() {
    if (Object.keys(receipt).length === 0) {
        showToast(getMessage("messages.receiptAlreadyEmpty"), "warning");
        document.getElementById("checkoutCode").focus();
        return;
    }

    const confirmed = await showConfirm({
        title: getMessage("modal.clearReceiptTitle"),
        message: getMessage("modal.clearReceiptMessage"),
        confirmLabel: getMessage("actions.clear"),
        variant: "danger"
    });

    if (!confirmed) {
        document.getElementById("checkoutCode").focus();
        return;
    }

    receipt = {};
    renderReceipt();
    showToast(getMessage("messages.receiptCleared"), "success");
    document.getElementById("checkoutCode").focus();
}

function initEmojiPicker() {
    const emojiField = document.getElementById("emoji");
    const emojiToggle = document.getElementById("emojiToggle");
    const picker = document.getElementById("emojiPicker");

    if (!emojiField || !emojiToggle || !picker) {
        return;
    }

    picker.innerHTML = EMOJI_GROUPS
        .map(group => `
            <section class="emoji-category">
                <h3 class="emoji-category-title">${getMessage(group.categoryKey)}</h3>
                <div class="emoji-grid">
                    ${group.emoji
                        .map(emoji => `<button type="button" class="emoji-option" data-emoji="${emoji}" aria-label="${getMessage("actions.chooseIcon")}">${renderEmojiImage(emoji, getMessage("a11y.emoji"), "emoji-img picker-emoji")}</button>`)
                        .join("")}
                </div>
            </section>
        `)
        .join("");

    function openPicker() {
        picker.classList.add("open");
    }

    function closePicker() {
        picker.classList.remove("open");
    }

    emojiToggle.onclick = () => {
        if (picker.classList.contains("open")) {
            closePicker();
        } else {
            openPicker();
            emojiField.focus();
        }
    };

    emojiField.onfocus = openPicker;
    emojiField.onclick = openPicker;

    picker.onclick = event => {
        const button = event.target.closest(".emoji-option");
        if (!button) {
            return;
        }
        emojiField.value = button.dataset.emoji || "";
        closePicker();
        emojiField.focus();
    };

    document.onclick = event => {
        const insidePicker = event.target.closest(".emoji-field");
        if (!insidePicker) {
            closePicker();
        }
    };
}

function setLanguage(lang) {
    setDocumentLanguage(lang);
}

document.getElementById("checkoutCode")?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        addToReceipt();
    }
});

document.getElementById("emoji")?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        addOrUpdateItem();
    }
});

window.addEventListener("load", async () => {
    try {
        await loadTranslations();
    } catch (error) {
        console.error("Translation loading error:", error);
    }

    const preferred = localStorage.getItem("negozio.lang") || "en";
    setDocumentLanguage(preferred);

    const importFileInput = document.getElementById("csvImportFile");
    if (importFileInput) {
        importFileInput.addEventListener("change", () => {
            const file = importFileInput.files?.[0];
            if (file) {
                importProductsFromCsv(file);
            }
        });
    }

    initConfirmModal();
    await loadInventory();
    renderInventoryList();
    renderReceipt();
    initEmojiPicker();
    document.getElementById("checkoutCode")?.focus();
});

window.loadInventory = loadInventory;
window.addOrUpdateItem = addOrUpdateItem;
window.openCsvImportPicker = openCsvImportPicker;
window.clearReceipt = clearReceipt;
window.sendCodeToCheckout = sendCodeToCheckout;
window.editItem = editItem;
window.deleteItem = deleteItem;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.setLanguage = setLanguage;
