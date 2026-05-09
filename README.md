# Mini Supermercato - Gioco didattico da cassiere con QR

Mini Supermercato e una web app pensata come gioco educativo per bambini.
L'obiettivo e simulare una piccola esperienza di cassa: si crea un inventario di prodotti, si leggono i codici (anche tramite lettore QR), si aggiungono articoli allo scontrino e si calcola il totale.

## Finalita ludica e didattica

Il progetto nasce per un uso ludico in classe, a casa o in laboratorio:

- Gioco di ruolo: bambino cassiere e bambino cliente.
- Familiarizzazione con prezzi, quantita e totale.
- Allenamento di attenzione, ordine e sequenze operative.
- Introduzione pratica all'uso di codici e QR nel mondo reale.

Scenario tipico:

1. L'adulto prepara o aggiorna l'inventario.
2. Si stampano o mostrano i QR prodotto.
3. Il bambino-cassiere usa un lettore QR (o inserisce il codice a mano).
4. La cassa aggiorna lo scontrino in tempo reale.

## Funzionalita principali

- Gestione inventario con persistenza PostgreSQL.
- Creazione, modifica ed eliminazione articoli.
- Generazione QR locale per ogni prodotto.
- Import prodotti da CSV con aggiornamento automatico dei codici esistenti.
- Cassa con scontrino e calcolo totale.
- Selettore emoji per rendere i prodotti riconoscibili anche ai piu piccoli.

## Stack tecnico

- Frontend: HTML, CSS, JavaScript vanilla.
- Backend: Node.js + Express.
- Database: PostgreSQL (driver pg).

## Requisiti

- Node.js 18+ (consigliato 20+).
- Database PostgreSQL raggiungibile.
- Opzionale: lettore QR USB in modalita keyboard wedge (si comporta come tastiera).

## Avvio rapido

1. Installa dipendenze:

```bash
npm install
```

2. Crea il file ambiente partendo dall'esempio:

Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

3. Configura almeno queste variabili in .env:

- DATABASE_URL=postgresql://user:password@host:5432/dbname
- PORT=3000

4. Avvia il server:

```bash
npm start
```

5. Apri il browser su:

- http://localhost:3000

## Formato CSV per import

L'app importa CSV con o senza intestazioni.

Campi supportati:

- codice (obbligatorio)
- prezzo (obbligatorio)
- descrizione (obbligatorio)
- emoji (opzionale)

Intestazioni riconosciute anche in varianti comuni:

- codice: codice, code, sku
- prezzo: prezzo, price, costo
- descrizione: descrizione, description, nome, prodotto
- emoji: emoji, icona, icon

Esempio:

```csv
codice,prezzo,descrizione,emoji
BANANA-01,0.90,Banana,🍌
LATTE-04,1.20,Latte,🥛
```

Nota: se un codice esiste gia, viene aggiornato; se non esiste, viene creato.

## API backend (sintesi)

- GET /api/health
- GET /api/inventario
- POST /api/inventario
- PUT /api/inventario/:codice
- DELETE /api/inventario/:codice

## Suggerimenti per uso con bambini

- Inizia con 5-10 prodotti per partite rapide.
- Usa descrizioni semplici e emoji molto visibili.
- Assegna ruoli a turno: cassiere, cliente, controllo totale.
- Aumenta difficolta gradualmente con piu articoli o prezzi decimali.

## Deploy su Vercel

Questa repository e configurata per Vercel con:

- frontend statico servito da root progetto
- API serverless in api/index.js
- routing definito in vercel.json

Passaggi:

1. Importa la repo su Vercel.
2. In Project Settings > Environment Variables, imposta almeno:
   - DATABASE_URL=postgresql://user:password@host:5432/dbname
3. Esegui il deploy.

Note importanti:

- La route / serve automaticamente index.html.
- Le chiamate frontend verso /api/* sono gia compatibili con Vercel.
- In produzione Vercel non viene letto il file .env locale.

## Struttura progetto

- index.html: interfaccia principale.
- negozio-app.css: stile UI.
- negozio-app.js: logica inventario, cassa, QR, import CSV.
- api/index.js: API serverless per Vercel.
- server.js: server Express locale (sviluppo).
- vercel.json: configurazione routing/build Vercel.
- vendor/qrcode.min.js: libreria QR lato client.

## Licenza

Vedi file LICENSE.
