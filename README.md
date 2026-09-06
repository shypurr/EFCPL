# EFCPL Manufacturing Execution System (MES) & Inventory Management Platform

> **Exotic Food Processing Private Limited (EFCPL)** — Food Processing, Cold-Chain Inventory & Operations Pipeline.

A production-grade web application built with **Next.js 16 (App Router)**, **React 19**, **Prisma ORM v7**, **Tailwind CSS v4**, and **TypeScript 5**.

---

## 🌟 Key Features & Functional Modules

### 📦 1. Inventory Management (Discrete Batch Model)
* **Raw Materials (RM)**:
  * **Master SKU vs. Physical Batch Arrivals**: Registering a material in the catalog (*+ Add Raw Material*) creates a master template row (`isMaster: true`, `stock: 0`, `batchNumber: ''`, `expiryDate: null`). Stock exists only when an inward arrival is logged (*Log Inward / Arrived RM*).
  * **Discrete Batch Logging**: Every incoming shipment creates a separate `RawMaterial` row (`isMaster: false`) with lot number, supplier, arrival timestamp, and expiry date. Rows are never merged.
  * **Chronological Sorting**: Reverse-chronological table display (`createdAt: desc`), latest shipments on top.
  * **Material-Level Aggregation (server side)**: `getRawMaterials` sums `stock` per code and attaches `materialStock` / `isLowStock` to each row; `syncRawMaterialStatusByCode` writes a single material-level `status` across every row of a code. See the [known drift](docs/03_SYSTEM_ARCHITECTURE_AND_DESIGN.md#5-known-drift-between-the-stock-model-and-its-consumers) — the dashboard, RM table and alerts still read per-row `stock`.
* **Packaged Materials (PM)**:
  * Single-row-per-SKU tracking (`code` is unique) for glass jars, bottles, caps, pouches, cartons. Inward logging **increments** the existing row rather than creating a new one.

### ⚙️ 2. Operations Pipelines (5 Standalone Workflows)
1. **RM Issue**: Deduct raw commodities from a specific batch row to a production run, with a dynamic Target Finished Good (FG) selector. Rejects issues larger than the selected batch's stock.
2. **Production Log**: Record completed manufacturing runs (batch count, output, wastage, MFG/expiry, operator) with **automatic Finished Goods stock incrementation** — creates the FG SKU if it does not exist yet.
3. **Packaging Issue**: Issue packaging supplies against a target FG production run, atomically decrementing PM stock.
4. **Finished Goods (FG)**: Cold room / warehouse inventory with **auto-calculated shelf life** (`expiryDate − mfgDate`, floored at 0 days).
5. **Dispatch Log**: Customer / distributor shipments with batch codes, delivery locations, and CoA status, with **automatic FG stock deduction** (`Out of Stock` when the balance hits zero).

All five write paths run inside `prisma.$transaction`, so a failed stock check rolls the log entry back.

### 📋 3. Master Catalog Hub & Safe Archival System
* **2-Level Interactive Catalog Panel** ([MasterCatalogPanel.tsx](src/components/MasterCatalogPanel.tsx)):
  * **Level 1**: Category cards for Raw Materials (RM), Packaging Materials (PM), and Finished Goods (FG) with live active-item counts.
  * **Level 2**: Catalog tables with codes/SKUs, descriptions, units, reorder levels, max stock, current total stock, batch counts, default suppliers and locations.
* **Batch Multi-Select & Single-Item Deletion**: Search filtering, select-all / individual checkboxes, and single-item delete actions.
* **Safe Soft-Deletion / Archival (`isArchived`)**:
  * Deleting catalog items flags them `isArchived: true` and `status: 'Archived'` instead of dropping rows.
  * Preserves relational integrity and history (past RM issues, packaging issues, production logs, dispatches).
  * Hides archived items from active views and blocks new inward/issue/dispatch operations against them.
* **Inline Catalog Editor** ([EditMaterialModal.tsx](src/components/Modals/EditMaterialModal.tsx)): Edits material-level settings and resyncs recomputed status across all batches of a code. Codes and SKUs are read-only — history references them.

### 📊 4. Factory Intelligence, PO Suggestions & Reports
* **Purchase Order suggestion engine** ([po-suggestions.ts](src/actions/po-suggestions.ts)): flags RM and PM rows at or below their reorder level and suggests `max(0, target − stock)`, where `target = maxStock ?? (reorderLevel > 0 ? reorderLevel × 3 : 100)`.
* **Factory Floor Alerts**: Alerts panel with a "Generate PO" shortcut per under-stocked material.
* **Factory Reports & Inventory Aging** ([reports.ts](src/actions/reports.ts)): RM / PM / FG stock summaries, the 100 most recent dispatches, and FG aging (`ageDays` since MFG, `daysLeft` to expiry, in-stock SKUs sorted most-urgent-first).

### 🛡️ 5. Role-Based Access Control (RBAC) & Security
* **Discord-style roles & permissions**: 28 seeded permission keys across four modules — `Inventory`, `Operations`, `Add Materials`, `Administration` — toggled through a matrix editor with per-role color tags.
* **Staff user provisioning**: create accounts with hashed credentials and role assignment (default password `efcpl123` when none is supplied).
* **Authentication**: PBKDF2-HMAC-SHA512 password hashing (16-byte salt, 1 000 iterations, 64-byte key, stored as `salt:hash`) and an HTTP-only, 7-day `efcpl_session_user` session cookie.
* ⚠️ **Permissions are not yet enforced server-side.** Server actions do not check the session, and the UI does not gate panels on `permissions`. Treat RBAC as configuration-only for now.

### 🛡️ 6. Data Integrity & Usability Safeguards
* **Non-negative numeric inputs**: numeric fields carry `min="0"` and reject negative values in their change handlers.
* **Positive-quantity server guards**: inward, issue, production and dispatch actions reject `qty <= 0` and insufficient stock.
* **Changeable unit dropdowns**: units prefill from the master catalog and stay editable (`KG`, `Units`, `Boxes`, `GM`, `LTR`, `ML`, `BAGS`).
* **Inline unit badges** on quantity inputs to prevent clipping on narrow viewports.
* **Streamlined entry forms**: free-text *Remarks* fields are removed from every entry modal; all write paths persist `remarks: null`.
* **Responsive dark UI**: desktop sidebar, tablet topbar, mobile bottom navigation ([MobileNav](src/components/MobileNav.tsx)), slide-out drawer, and horizontal-scroll data tables.

---

## 🛠️ Tech Stack

| Layer | Choice |
| :--- | :--- |
| Frontend | Next.js 16.3.0 (App Router), React 19.2.8, Tailwind CSS v4, Lucide React |
| Backend | Next.js Server Actions (`src/actions/*`), `revalidatePath('/')` |
| ORM | Prisma ORM 7.9.x with the `@prisma/adapter-pg` driver adapter |
| Database | PostgreSQL on **Neon** (serverless) |
| Hosting | Render (web service) + Neon (database) |
| Language | TypeScript 5 (strict) |

> **Unused dependencies** currently declared in `package.json`: `zod`, `clsx`, `tailwind-merge`, `date-fns`, `better-sqlite3`, `@prisma/adapter-better-sqlite3`, `@types/better-sqlite3`. Nothing imports them.

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and set your Neon PostgreSQL connection string:
```env
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
NODE_ENV="production"
```
[src/lib/prisma.ts](src/lib/prisma.ts) throws at client construction if `DATABASE_URL` is missing, and enables TLS automatically for any host that is not `localhost`.

### 3. Database Sync & Seeding
```bash
npx prisma db push      # Sync schema to PostgreSQL (no migrations directory is committed)
npx prisma generate     # Regenerate the typed client (also runs on postinstall)
npx prisma db seed      # Seed permissions, roles, users & sample inventory
```

The seed creates two logins — change them before any real deployment:

| Username | Password | Role |
| :--- | :--- | :--- |
| `admin` | `admin123` | System Admin (all 28 permissions) |
| `manager` | `manager123` | Store Manager |

It also seeds 3 roles, sample RM masters + arrivals (`RM001`, `RM002`), one PM (`PM001`) and one FG (`FGPRO001`). It does **not** seed `SystemLookup` or `StorageLocation` rows.

### 4. Start Development Server
```bash
npm run dev     # next dev
npm run build   # next build
npm start       # next start
npm run lint    # eslint
```
Open [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Directory Structure

```
├── docs/                               # Architecture & system documentation
│   ├── 01_PROJECT_SUMMARY.md           # Project context, business goals & modules
│   ├── 02_TECH_STACK.md                # Technology matrix, data flows & drivers
│   ├── 03_SYSTEM_ARCHITECTURE_AND_DESIGN.md # UI/UX design, stock model & known drift
│   ├── 04_DATABASE_SCHEMA_AND_MODELS.md # Prisma schema, models & query surface
│   ├── 05_DEVELOPMENT_ROADMAP.md       # Milestones, completed phases & open backlog
│   └── legacy/                         # Pre-Next.js single-file HTML prototype
├── prisma/
│   ├── schema.prisma                   # Prisma 7 PostgreSQL schema (14 models)
│   ├── seed.ts                         # Permissions, roles, users & sample inventory
│   └── dev.db                          # ⚠️ Stale SQLite file from the pre-Postgres era
├── public/
│   ├── manifest.json                   # PWA manifest (icon-192.png / icon-512.png are missing)
│   └── *.svg                           # Create-Next-App default assets
├── src/
│   ├── actions/                        # Next.js Server Actions ('use server')
│   │   ├── inventory.ts                # RM & PM CRUD, inward logging, archiving, master edit
│   │   ├── operations.ts               # 5 pipelines: RM issue, production, PM issue, FG, dispatch
│   │   ├── rbac.ts                     # Roles, permissions, users, login/session
│   │   ├── raw-materials.ts            # Thin re-export proxy over inventory.ts
│   │   ├── packaging.ts                # Thin re-export proxy over inventory.ts
│   │   ├── finished-goods.ts           # Thin re-export proxy over operations.ts
│   │   ├── movements.ts                # Thin re-export proxy over operations.ts
│   │   ├── auth.ts                     # Thin re-export proxy over rbac.ts
│   │   ├── roles.ts                    # Thin re-export proxy over rbac.ts
│   │   ├── reports.ts                  # Inventory summary & FG aging
│   │   ├── po-suggestions.ts           # Purchase-order suggestion engine
│   │   ├── lookups.ts                  # SystemLookup & StorageLocation (⚠️ no live caller)
│   │   └── csv-import.ts               # Bulk CSV importer (⚠️ no UI entry point)
│   ├── app/
│   │   ├── globals.css                 # Tailwind v4 import, CSS variables, scrollbars, fonts
│   │   ├── layout.tsx                  # Root layout, metadata, PWA manifest link, viewport
│   │   └── page.tsx                    # Single client component hosting all 14 panels
│   ├── components/
│   │   ├── MasterCatalogPanel.tsx      # 2-level RM/PM/FG catalog management & archiving
│   │   ├── Sidebar.tsx                 # Desktop persistent navigation (14 items, 5 sections)
│   │   ├── Topbar.tsx                  # Desktop/tablet topbar: alerts, refresh, session
│   │   ├── MobileNav.tsx               # Mobile bottom bar (5 tabs) + full slide-out drawer
│   │   ├── LoginModal.tsx              # Two-step sign-in (identify → password)
│   │   ├── Admin/
│   │   │   ├── RoleManagerModal.tsx    # Permission matrix editor & role builder
│   │   │   └── UserManagerModal.tsx    # Staff user provisioning
│   │   └── Modals/                     # Operational & catalog dialogs
│   │       ├── AddRawMaterialModal.tsx     # RM master SKU registration
│   │       ├── InwardRawMaterialModal.tsx  # RM physical arrival batch logging
│   │       ├── AddPackagingModal.tsx       # PM master item registration
│   │       ├── InwardPackagingModal.tsx    # PM inward (increments existing row)
│   │       ├── AddFinishedGoodModal.tsx    # FG SKU master registration
│   │       ├── InwardFinishedGoodModal.tsx # FG batch production/inward logging
│   │       ├── EditMaterialModal.tsx       # Unified RM/PM/FG catalog editor
│   │       ├── IssueModal.tsx              # RM issue to production
│   │       ├── ProductionModal.tsx         # Production run logging & auto-FG addition
│   │       ├── PackagingIssueModal.tsx     # Packaging supply issue to production
│   │       ├── DispatchModal.tsx           # Sales dispatch & auto-FG stock deduction
│   │       ├── GRNModal.tsx                # ⚠️ Not imported anywhere (dead code)
│   │       └── AddLookupModal.tsx          # ⚠️ Not imported anywhere (dead code)
│   └── lib/
│       ├── prisma.ts                   # PrismaClient singleton over @prisma/adapter-pg
│       ├── inventory-utils.ts          # Material-level stock aggregation & status rules
│       └── auth-utils.ts               # PBKDF2-SHA512 password hashing & verification
├── patch2.js                           # ⚠️ Stale one-off codemod; never applied to operations.ts
├── AGENTS.md / CLAUDE.md               # Agent instructions (auto-maintained by `next dev`)
└── skills-lock.json                    # Prisma agent-skills lockfile (.agents/skills)
```

---

## ⚠️ Known Gaps

Verified against the current tree — see [docs/05_DEVELOPMENT_ROADMAP.md](docs/05_DEVELOPMENT_ROADMAP.md) for the tracked backlog.

1. **RBAC is not enforced.** No server action checks the session cookie or permission keys; panel visibility is not gated.
2. **Material-level stock is computed but unused by the UI.** `materialStock` / `isLowStock` have no consumer; tables and alerts read per-row `stock`.
3. **`createRMIssue` does not call `syncRawMaterialStatusByCode`,** so it writes a per-row status that can contradict the material total.
4. **`po-suggestions.ts` and `reports.ts` query `rawMaterial.findMany()` unfiltered,** so archived rows and zero-stock master rows are included.
5. **PWA is half-wired.** `public/manifest.json` exists and is linked from `layout.tsx`, but `icon-192.png` / `icon-512.png` do not exist and no service worker is registered.
6. **`AuditLog` is never written to.** The model and relation exist; no action creates a row.
7. **No automated tests** of any kind.
8. **Dead code**: `GRNModal.tsx`, `AddLookupModal.tsx`, `src/actions/csv-import.ts`, `src/actions/lookups.ts`, `patch2.js`, `prisma/dev.db`, and 7 unused dependencies.
