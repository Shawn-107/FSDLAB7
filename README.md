# Lab Exercise 7 — VulnWatch React SPA CRUD

React + Vite frontend, Node.js + Express REST API, and **both SQLite and MongoDB adapters**. The chosen domain continues the supplied VulnWatch Labs 2–4 reference: dark navy surfaces, blue/teal accents and IBM Plex typography. The module manages manually entered tracked software; it does not claim to scan for vulnerabilities or supply live threat intelligence.

## Quick start — SQLite

Install Node.js **22.13 or newer** (Node 24 LTS recommended). In this project folder:

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. Express runs on port 3001. SQLite is automatically created at `data/vulnwatch.db`; no separate database installation is needed. This project uses Node's built-in `node:sqlite` instead of the slides' `sqlite3` package to avoid native add-on installation; the database is genuine SQLite and uses parameterized SQL.

## MongoDB mode

Install and start MongoDB Community locally, or provide your own Atlas connection string. A database is required; the application never silently falls back to SQLite.

1. Copy `.env.example` to `.env`.
2. Set `MONGO_URI=mongodb://127.0.0.1:27017/vulnwatch` for local MongoDB, or your Atlas URI. Keep credentials only in `.env`.
3. Stop the SQLite app, then run:

```sh
npm run dev:mongo
```

Open the same frontend URL. The header confirms **MongoDB connected**. Records are in database `vulnwatch`, collection `softwares`. Mongoose creates the collection when the first record is saved. Use `mongosh` then `use vulnwatch` and `db.softwares.find()` to inspect it.

The startup scripts explicitly choose a provider. To use the production `npm start` command with MongoDB, set `DB_PROVIDER=mongo` in `.env`. SQLite and MongoDB have independent data; switching does not migrate or synchronize records.

## Build and run as one application

```sh
npm run build
npm start
```

Open http://127.0.0.1:3001. Express serves the built React SPA and the API from the same origin. Development uses Vite's `/api` proxy, so CORS is unnecessary. The service binds to the local computer for classroom use. This is a local teaching application without user authentication.

## Operations

| Operation | Route | Storage action |
| --- | --- | --- |
| Create | `POST /api/software` | SQLite INSERT / MongoDB create |
| Read all | `GET /api/software` | SELECT / find |
| Read one | `GET /api/software/:id` | SELECT WHERE / findById |
| Search | `GET /api/software?q=react` | Case-insensitive literal match over stored records |
| Update | `PUT /api/software/:id` | UPDATE / findByIdAndUpdate |
| Delete | `DELETE /api/software/:id` | DELETE / deleteOne |
| Health | `GET /api/health` | Active provider label |

The React search filters already-loaded records immediately. The API also supports search separately. The full record is supplied for PUT. Successful create/update/delete return 201/200/204. Invalid payloads return 400; missing records return 404. Both databases use UUID string IDs, identical field names and UTC timestamps.

## Form and record schema

Product (1–80 chars), vendor (1–80), version (1–40), category dropdown, environment radio buttons, priority dropdown and notes (0–500). Category: Framework, Runtime, Database, Operating system, Infrastructure. Environment: Production, Staging, Development. Priority: Critical, High, Medium, Low. Priority is a manual review label, not a computed CVSS score. Required inputs, length limits and enum checks run on the server as well as in the browser.

## Tests

```sh
npm test
npm run build
npm run test:ui
```

API tests use a temporary SQLite file and an isolated **real MongoDB process** managed by `mongodb-memory-server`; the first MongoDB test downloads a MongoDB binary into `data/mongodb-binaries`. It does not require your MongoDB service or touch your actual database. MongoDB needs internet on that first run. The tests check HTTP CRUD, search, validation, missing IDs and reopening connections for persistence.

UI tests require Microsoft Edge and start their own backend on port 3001 with `data/ui-test.db`. Stop the app before running them. They test creation, page reload persistence, search, update, cancelled/confirmed delete, JavaScript errors, and a 390px mobile viewport. Screenshots are saved to `docs/screenshots`. They demonstrate SQLite mode; both database modes are exercised by API integration tests.

## Project structure

```text
src/main.jsx         React App, RecordForm, Field, Badge and Inventory
src/style.css        Responsive VulnWatch styling
server/index.js      Startup, provider choice, graceful shutdown
server/app.js        Express routes and error responses
server/store.js      Validation, SQLite SQL and Mongoose adapters
tests/               API integration and browser workflows
docs/LAB-7.md        Lab record, procedure, results and viva/demo guide
docs/screenshots/    Captured CRUD/search/mobile evidence
```

See `docs/TEST-RESULTS.md` for the verification performed with this delivery. `docs/Lab-7-Report.pdf` is a two-page printable lab report; the longer editable lab record and demo guide is in `docs/LAB-7.md`. Delivered `.jpg` screenshots were captured through the in-app browser after the standalone Edge runner failed to launch. No GitHub push or deployment is included.

## References

The supplied MERN and SQLite PDFs are teaching references for the architecture and CRUD flow; their student-record examples were adapted to the existing VulnWatch domain. SQLite is relational, despite an inconsistent slide label. The slides' save-only examples were extended to full CRUD.

- https://react.dev/reference/react/useState
- https://nodejs.org/api/sqlite.html
- https://mongoosejs.com/docs/connections.html
- https://expressjs.com/en/guide/routing.html
