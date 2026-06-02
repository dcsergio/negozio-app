# CONTINUE.md - Project Guide for negozio-app

Welcome to the `negozio-app` developer guide. This document provides an overview of the project's architecture, development workflow, and technical conventions.

## 1. Project Overview
`negozio-app` is an educational mini-supermarket application designed for managing inventory, performing checkouts, and generating QR codes for products.

- **Stack**:
    - **Frontend**: Vanilla HTML5, CSS3, and JavaScript.
    - **Backend (Local)**: Node.js with Express.
    - **Backend (Production)**: Vercel Serverless Functions.
    - **Database**: PostgreSQL.
- **Key Features**: Product management (CRUD), CSV Import/Export, QR Code generation, and mobile-friendly UI.

## 2. Getting Started
### Prerequisites
- Node.js (v14+)
- PostgreSQL database instance
- npm

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in a `.env` file:
   ```env
   DATABASE_URL=your_postgresql_url
   PORT=3000
   ```

### Running Locally
To start the local Express server:
```bash
npm start
```
The app will be available at `http://localhost:3000`.

## 3. Project Structure
- `index.html`: The main entry point for the UI.
- `negozio-app.js`: Core frontend logic, including API calls and DOM manipulation.
- `negozio-app.css`: Styles for the application.
- `server.js`: Local Express server and API endpoints.
- `api/index.js`: Serverless function entry point for Vercel deployment.
- `scripts/`: Maintenance scripts (e.g., `diagnose-db-icons.js`, `repair-db-icons.js`).
- `vendor/`: External client-side libraries (like `qrcode.min.js`).
- `vercel.json`: Deployment configuration for Vercel.

## 4. Development Workflow
### Coding Standards
- **Vanilla JS**: Avoid adding heavy frontend frameworks. Keep logic in `negozio-app.js`.
- **API Parity**: Ensure any changes to `server.js` are reflected in `api/index.js` to maintain compatibility between local and production environments.
- **Database**: Use the `pg` library for queries. Always handle connection pooling/closing properly.

### Common Commands
- `npm start`: Start the local server.
- `node scripts/diagnose-db-icons.js`: Check for emoji encoding issues in the DB.

## 5. Key Concepts
- **Product Schema**: The core data object consists of `codice` (unique ID/EAN), `descrizione` (name), `prezzo` (price), and `emoji` (visual representation).
- **Environment Agnosticism**: The app detects if it is running on Vercel or locally to resolve API paths appropriately.

## 6. Common Tasks
### Adding a New API Endpoint
1. Add the route and logic to `server.js` for local development.
2. Add the same route logic to `api/index.js` for Vercel.
3. Update `negozio-app.js` to call the new `/api/<endpoint>`.

### Troubleshooting DB Icons
If product emojis appear as question marks:
1. Run `node scripts/diagnose-db-icons.js` to identify the issue.
2. Run `node scripts/repair-db-icons.js` to attempt a programmatic fix.

## 7. References
- [Express.js Documentation](https://expressjs.com/)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---
*Note: This file is automatically loaded by the Continue extension to provide context for AI-assisted development.*