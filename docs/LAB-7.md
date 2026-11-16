# Lab Exercise 7: React SPA — CRUD Operations using SQLite and MongoDB

**Application:** VulnWatch — Tracked Software Inventory  
**Student name / register number:** ____________________  
**Class / date:** ____________________

## Aim

Develop a responsive React single-page application that performs Create, Read, Update and Delete operations through a Node.js/Express API, with selectable SQLite and MongoDB persistence, continuing the VulnWatch domain from the earlier HTML/CSS/JavaScript work.

## Requirements and architecture

Node.js 22.13+, npm, a modern browser, and MongoDB Community or Atlas for MongoDB mode. SQLite requires no separate database service. The frontend uses functional components, JSX, useState, useEffect, reusable components, controlled inputs, radio buttons, dropdowns and event handling.

```text
React SPA → HTTP /api/software → Express routes → selected database adapter
                                                 ├─ SQLite: data/vulnwatch.db
                                                 └─ Mongoose → MongoDB: vulnwatch.softwares
```

Only one provider is active per server process. Both implement the same API and schema. Each has independent records. Switching the provider requires restarting the backend. SQLite is a relational, file-based database; MongoDB is a document database. Mongoose defines the document schema for MongoDB. Node's built-in SQLite module replaces the slides' sqlite3 package while preserving SQL-based CRUD.

## Data design

Each record contains a UUID id, product, vendor, version, category, environment, priority, notes, createdAt and updatedAt. Product, vendor and version are mandatory strings. Category and priority use dropdowns; environment uses radio buttons. SQLite stores rows in `software`; MongoDB stores documents in `softwares`. Both retain records across backend connection restarts. Values are validated before storage; SQLite queries bind values as parameters.

## Procedure

1. Extract the project, open its folder in a terminal and run `npm install`.
2. Run `npm run dev`; open `http://127.0.0.1:5173`. Confirm **SQLite connected**.
3. Enter a product, vendor, installed version, category, environment, review priority and optional notes. Click **Add software**. Check the new inventory card and success message.
4. Reload the page to demonstrate persistence. Search by product, vendor or environment; clear the query to display all records.
5. Click **Edit**, change the version or another field, and click **Save changes**. Verify the modified card. Use **Cancel edit** to abandon an unsaved edit.
6. Click **Delete**. First choose **Keep record** to demonstrate cancellation. Repeat and choose **Delete record**; confirm removal and feedback.
7. Stop the app. Start your MongoDB service, copy `.env.example` to `.env`, configure MONGO_URI, and run `npm run dev:mongo`.
8. Confirm **MongoDB connected**. Repeat Create, Read, Search, Update and Delete. The SQLite entries do not appear because this is a separate database.
9. Inspect `data/vulnwatch.db` in DB Browser for SQLite (software table), or `vulnwatch.softwares` in MongoDB Compass/mongosh.
10. Run `npm test`, `npm run build` and `npm run test:ui`. Review the supplied test-results record and screenshots.

## Implementation and algorithm

On load, React fetches records and the active provider status. The form holds field values in state. Submit sends JSON with POST for a new record or PUT for an existing UUID. Express checks required fields, lengths and allowed values, then calls the selected adapter. Successful responses update the React state without a document reload. Search filters the loaded list as the user types; the API also provides a query endpoint. Confirmed deletion sends DELETE and removes the matching card only after the backend succeeds. API failures retain the form and display an error. Empty and loading states are handled explicitly.

| CRUD | HTTP route | SQLite | MongoDB / Mongoose |
| --- | --- | --- | --- |
| Create | POST /api/software | INSERT | create |
| Read | GET /api/software | SELECT | find |
| Update | PUT /api/software/:id | UPDATE WHERE id | findByIdAndUpdate |
| Delete | DELETE /api/software/:id | DELETE WHERE id | deleteOne |

## Output and result

The completed SPA provides persistent tracked-software CRUD with SQLite and MongoDB, responsive VulnWatch styling, dynamic search, validation, confirmation before deletion and clear operation feedback. Priority values are manually assigned review labels. This module does not perform live vulnerability scanning. Refer to TEST-RESULTS.md for executed checks and screenshots for the SQLite browser workflow.

## 5–7 minute demonstration

- **0:00–1:00:** Explain the VulnWatch domain and React → Express → database architecture.
- **1:00–2:30:** Add a software record, show its card, reload and search.
- **2:30–3:30:** Update the version; cancel and then confirm deletion.
- **3:30–5:00:** Restart with MongoDB, show the provider badge and repeat key CRUD actions.
- **5:00–6:00:** Show database records and explain the common adapter interface.
- **6:00–7:00:** Show test results and mobile layout; explain validation and independent database storage.

## Viva preparation

**Why SPA?** React updates the interface from state without navigating to a new document for each operation.  
**Why Express?** Browser code calls HTTP endpoints; Express validates requests and accesses the database.  
**SQLite vs MongoDB?** SQLite stores structured relational tables in a local file; MongoDB stores documents in a database service.  
**What does useState do?** It retains component values and requests a render when they change.  
**Why server validation?** API callers can bypass browser form validation.  
**Do both databases synchronize?** No. They are independently selectable implementations of the same storage contract.
