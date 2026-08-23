# 02. Technical Stack Specification — EFCPL MES & Inventory System

## 1. Overview
This document specifies the core runtime, frameworks, libraries, database drivers, and infrastructure powering the EFCPL MES & Inventory Management Platform.

---

## 2. Technology Stack Matrix

| Layer | Technology | Version | Rationale & Capabilities |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | 16.x | High-performance React framework with Server Components, streaming SSR, and optimized client bundles. |
| **UI Library** | React | 19.x | Concurrent rendering, modern hooks, and component lifecycle management. |
| **Type System** | TypeScript | 5.x | End-to-end static typing across database models, Server Actions, and UI components. |
| **Styling & Theme** | Tailwind CSS | 4.x | Dark-theme optimized utility classes, responsive container queries, and mobile viewport adaptations. |
| **Iconography** | Lucide React | Latest | Crisp vector icons designed for high-contrast touch targets. |
| **Database ORM** | Prisma ORM | 7.9.x | Schema-driven data modeling, automated migrations, and type-safe query generation. |
| **Database Engine** | PostgreSQL (Neon) | 16+ | Serverless Postgres accessed through the `@prisma/adapter-pg` driver adapter over a `pg` connection `Pool`. |
| **Deployment Target** | Render (web service) + Neon (database) | — | `postinstall: prisma generate` regenerates the client on every deploy build. |
| **Backend Mutations** | Next.js Server Actions | Native | Zero-API-boilerplate type-safe mutations with automatic cache revalidation (`revalidatePath('/')`). |
| **Validation** | Zod | 4.x | Schema validation primitives available to server actions. |
| **Authentication & RBAC** | Custom Argon2/PBKDF2 Hashing + Role Matrix | Custom | Modular RBAC model with granular permission keys and audit logging. |

> **Legacy SQLite**: `@prisma/adapter-better-sqlite3` and `better-sqlite3` remain in `package.json`
> from the pre-migration setup, but nothing imports them — `src/lib/prisma.ts` instantiates the
> Postgres adapter unconditionally and throws if `DATABASE_URL` is missing.

---

## 3. System Data Flow Architecture

```
+-----------------------------------------------------------------------------+
|                            CLIENT BROWSER / TABLET                          |
|  - React 19 UI with Dark Theme & High-Contrast Typography                   |
|  - Responsive Navigation (Desktop Sidebar / Tablet Topbar / MobileNav)      |
|  - 12 Operational Modals + Admin/Login Dialogs, Non-Negative Guards         |
+-------------------------------------+---------------------------------------+
                                      |
                                      | Next.js Server Action RPC
                                      v
+-------------------------------------+---------------------------------------+
|                      SERVER ACTIONS LAYER (@/actions/*)                     |
|  - inventory.ts / operations.ts / raw-materials.ts / finished-goods.ts      |
|  - movements.ts / roles.ts / rbac.ts / reports.ts / po-suggestions.ts       |
|  - lookups.ts / csv-import.ts / auth.ts                                     |
|  - Input Validation & Transaction Management (`prisma.$transaction`)        |
+-------------------------------------+---------------------------------------+
                                      |
                                      | Domain rules: src/lib/inventory-utils.ts
                                      | (material-level stock totals & status)
                                      v
+-------------------------------------+---------------------------------------+
|                         DATABASE LAYER (Prisma ORM)                         |
|  - PostgreSQL (Neon) via `@prisma/adapter-pg` + `pg` Pool                   |
|  - Singleton client in `src/lib/prisma.ts` (globalThis-cached in dev)       |
|  - Models: RawMaterial, PackagingMaterial, RMIssue, ProductionLog,          |
|    PackagingIssue, FinishedGood, Dispatch, SystemLookup, StorageLocation,   |
|    Role, Permission, RolePermission, User, AuditLog                         |
+-----------------------------------------------------------------------------+
```

---

## 4. Environment & Configuration

```env
# PostgreSQL connection string (Neon console → connection details)
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Server Settings
NODE_ENV="production"
```

### Connection Behaviour (`src/lib/prisma.ts`)
* Throws at client-construction time when `DATABASE_URL` is unset, rather than failing later on the first query.
* TLS is enabled automatically for any non-`localhost` host (`ssl: { rejectUnauthorized: false }`); local connections run without SSL.
* Query logging (`['query', 'error', 'warn']`) is enabled only when `NODE_ENV === 'development'`; production logs errors only.
* The client is cached on `globalThis` outside production so Next.js hot reloads do not exhaust the connection pool.

### Database Commands
```bash
npx prisma db push       # Sync schema to the Postgres database
npx prisma generate      # Regenerate the typed client (also runs on postinstall)
npx prisma db seed       # Seed lookups, sample materials & admin credentials
```
