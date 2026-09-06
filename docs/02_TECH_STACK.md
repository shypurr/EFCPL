# 02. Technical Stack Specification — EFCPL MES & Inventory System

## 1. Overview
This document specifies the runtime, frameworks, libraries, database drivers, and infrastructure powering the EFCPL MES & Inventory Management Platform. Versions are the ones pinned in [`package.json`](../package.json).

---

## 2. Technology Stack Matrix

| Layer | Technology | Version | Rationale & Capabilities |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | 16.3.0 | Server Components, Server Actions, streaming SSR. A single route (`/`) is served. |
| **UI Library** | React | 19.2.8 | Concurrent rendering and hooks. The whole app is one `'use client'` tree under `page.tsx`. |
| **Type System** | TypeScript | 5.x (strict) | End-to-end typing. Note: most action payloads and component props are still `any`. |
| **Styling & Theme** | Tailwind CSS | 4.x | `@import "tailwindcss"` in `globals.css`; CSS custom properties define the navy/teal dark palette. |
| **Fonts** | DM Sans / DM Mono | — | Loaded from Google Fonts via `@import url(...)` at the top of `globals.css`. |
| **Iconography** | Lucide React | 1.29.x | The only runtime UI dependency besides React/Next. |
| **Database ORM** | Prisma ORM | 7.9.x | Schema-driven modelling and a type-safe client. |
| **Driver Adapter** | `@prisma/adapter-pg` + `pg` | 7.9.x / 8.22.x | Prisma 7 driver adapter over a `pg` connection `Pool`. |
| **Database Engine** | PostgreSQL (Neon) | 16+ | Serverless Postgres. Pooled connection string (`-pooler` host). |
| **Deployment Target** | Render (web service) + Neon | — | `postinstall: prisma generate` regenerates the client on every deploy build. |
| **Backend Mutations** | Next.js Server Actions | Native | Type-safe RPC with `revalidatePath('/')` after every write. No REST/GraphQL layer exists. |
| **Auth & RBAC** | Node `crypto` PBKDF2 + role matrix | Custom | 28 permission keys, 3 seeded roles, HTTP-only session cookie. **Not enforced yet.** |
| **Linting** | ESLint 9 + `eslint-config-next` | 16.3.0 | Flat config (`eslint.config.mjs`) composing `core-web-vitals` and `typescript` presets. |
| **Seeding** | `tsx` | 4.23.x | `prisma.seed` runs `npx tsx prisma/seed.ts`. |

### Declared but unused
Nothing in `src/` or `prisma/` imports these; they can be removed:

| Package | Note |
| :--- | :--- |
| `zod` | No schema validation layer exists. Server actions validate with hand-written `if` checks. |
| `clsx`, `tailwind-merge` | Class names are composed with template literals throughout. |
| `date-fns` | Date math is done with raw `Date` arithmetic (`getTime()` deltas / `86400000`). |
| `better-sqlite3`, `@prisma/adapter-better-sqlite3`, `@types/better-sqlite3` | Left over from the pre-Neon SQLite setup, alongside the unused `prisma/dev.db` file. |

---

## 3. System Data Flow Architecture

```
+-----------------------------------------------------------------------------+
|                            CLIENT BROWSER / TABLET                          |
|  - React 19 UI, dark theme, one client component (src/app/page.tsx)          |
|  - Responsive nav: Sidebar (desktop) / Topbar / MobileNav (bottom + drawer)  |
|  - 14 panels: Dashboard, Alerts, RM, PM, 5 Ops, Master Hub, 2 Admin,         |
|    Reports, PO Suggestions                                                   |
|  - MasterCatalogPanel (2-level catalog + multi-archive)                      |
|  - 14 wired dialogs: 11 under Modals/ + LoginModal + Role/UserManagerModal   |
|    (GRNModal.tsx and AddLookupModal.tsx exist but are imported by nothing)   |
+-------------------------------------+---------------------------------------+
                                      |
                                      | Next.js Server Action RPC
                                      v
+-------------------------------------+---------------------------------------+
|                      SERVER ACTIONS LAYER (@/actions/*)                     |
|  Real implementations:                                                       |
|    inventory.ts (RM/PM) | operations.ts (5 pipelines) | rbac.ts (roles/auth) |
|    reports.ts | po-suggestions.ts | lookups.ts* | csv-import.ts*             |
|  Thin re-export proxies:                                                     |
|    raw-materials.ts, packaging.ts -> inventory.ts                            |
|    finished-goods.ts, movements.ts -> operations.ts                          |
|    auth.ts, roles.ts -> rbac.ts                                              |
|  Guards: qty > 0, sufficient stock, archived-item rejection, duplicate codes  |
|  Atomicity: prisma.$transaction on all 5 operations write paths              |
|  * lookups.ts and csv-import.ts have no live caller                          |
+-------------------------------------+---------------------------------------+
                                      |
                                      | Domain rules: src/lib/inventory-utils.ts
                                      | (material-level totals & status resolution)
                                      v
+-------------------------------------+---------------------------------------+
|                         DATABASE LAYER (Prisma ORM)                         |
|  - PostgreSQL (Neon) via @prisma/adapter-pg + pg Pool                        |
|  - Singleton client in src/lib/prisma.ts (globalThis-cached outside prod)    |
|  - 14 models: RawMaterial, PackagingMaterial, RMIssue, ProductionLog,        |
|    PackagingIssue, FinishedGood, Dispatch, SystemLookup, StorageLocation,    |
|    Permission, Role, RolePermission, User, AuditLog                          |
+-----------------------------------------------------------------------------+
```

### Action-module map

| Module | Kind | Exports |
| :--- | :--- | :--- |
| `inventory.ts` | implementation | `getRawMaterials`, `getRawMaterialMasters`, `getRawMaterialByCode`, `createRawMaterial`, `inwardRawMaterial`, `updateRawMaterial`, `updateRawMaterialMasterByCode`, `archiveRawMaterialByCode`, `deleteRawMaterial`, and the PM equivalents (`get/create/inward/update/delete/archivePackagingMaterial`, `getPackagingMaterialByCode`) |
| `operations.ts` | implementation | `get/create/deleteRMIssue`, `getRMDetailsForIssue`, `get/create/deleteProductionLog`, `get/create/deletePackagingIssue`, `getPMDetailsForIssue`, `get/create/inward/update/delete/archiveFinishedGood`, `get/create/deleteDispatch`, plus aliases `postIssue`, `postGRN`, `postDispatch` |
| `rbac.ts` | implementation | `getPermissions`, `get/create/update/deleteRole`, `get/create/update/deleteUser`, `createStaffUser` (alias), `loginUser`, `checkUserLoginStatus`, `setupFirstTimePassword` (alias of `loginUser`), `getCurrentUser`, `logoutUser` |
| `reports.ts` | implementation | `getReportsData` |
| `po-suggestions.ts` | implementation | `getPurchaseOrderSuggestions` |
| `lookups.ts` | implementation, **unused** | `getSystemLookups`, `createSystemLookup`, `getStorageLocations` |
| `csv-import.ts` | implementation, **unused** | `importRawMaterialsCSV`, `importPackagingMaterialsCSV` |
| `raw-materials.ts`, `packaging.ts`, `finished-goods.ts`, `movements.ts`, `auth.ts`, `roles.ts` | proxies | Re-export the implementations above under domain-friendly names |

---

## 4. Environment & Configuration

```env
# PostgreSQL connection string (Neon console -> connection details)
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Server settings
NODE_ENV="production"
```

`DATABASE_URL` is the only variable the code reads. `prisma.config.ts` loads `dotenv/config` and passes it to the datasource; `next dev` / `next build` load `.env` themselves.

### Connection behaviour ([`src/lib/prisma.ts`](../src/lib/prisma.ts))
* Throws at client-construction time when `DATABASE_URL` is unset, rather than failing later on the first query.
* TLS is enabled for any host that does not contain `localhost` (`ssl: { rejectUnauthorized: false }`); local connections run without SSL.
* Query logging (`['query', 'error', 'warn']`) only when `NODE_ENV === 'development'`; production logs errors only.
* The client is cached on `globalThis` outside production so hot reloads do not exhaust the pool.

### Path aliases & build config
* `@/*` → `./src/*` (`tsconfig.json`).
* `next.config.ts` is empty — no custom webpack, headers, images or rewrites.

### Commands
```bash
npm run dev              # next dev
npm run build            # next build
npm start                # next start
npm run lint             # eslint

npx prisma db push       # Sync schema to Postgres (the schema workflow in use)
npx prisma generate      # Regenerate the typed client (also runs on postinstall)
npx prisma db seed       # npx tsx prisma/seed.ts
```

> **No migrations are committed.** `prisma.config.ts` declares `migrations.path = "prisma/migrations"`, but that directory does not exist; schema changes are applied with `db push`. Introduce `prisma migrate dev` before the database holds data you cannot recreate.
