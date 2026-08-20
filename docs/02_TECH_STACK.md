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
| **Database ORM** | Prisma ORM | 7.x | Schema-driven data modeling, automated migrations, and type-safe query generation. |
| **Database Engine** | SQLite / Better-SQLite3 | Latest | Fast local persistence using `@prisma/adapter-better-sqlite3` driver adapter, with seamless migration path to PostgreSQL (Neon). |
| **Backend Mutations** | Next.js Server Actions | Native | Zero-API-boilerplate type-safe mutations with automatic cache revalidation (`revalidatePath('/')`). |
| **Authentication & RBAC** | Custom Argon2/PBKDF2 Hashing + Role Matrix | Custom | Modular RBAC model with granular permission keys and audit logging. |

---

## 3. System Data Flow Architecture

```
+-----------------------------------------------------------------------------+
|                            CLIENT BROWSER / TABLET                          |
|  - React 19 UI with Dark Theme & High-Contrast Typography                   |
|  - Responsive Navigation (Desktop Sidebar / Tablet Topbar / MobileNav)      |
|  - 13 Action Modals with Non-Negative Guards & Dynamic Selection            |
+-------------------------------------+---------------------------------------+
                                      |
                                      | Next.js Server Action RPC
                                      v
+-------------------------------------+---------------------------------------+
|                      SERVER ACTIONS LAYER (@/actions/*)                     |
|  - inventory.ts / operations.ts / raw-materials.ts / finished-goods.ts      |
|  - movements.ts / roles.ts / reports.ts / po-suggestions.ts                 |
|  - Input Validation & Transaction Management (`prisma.$transaction`)        |
+-------------------------------------+---------------------------------------+
                                      |
                                      | Prisma v7 Client + Driver Adapter
                                      v
+-------------------------------------+---------------------------------------+
|                         DATABASE LAYER (Prisma ORM)                         |
|  - SQLite Database (`dev.db`) via `@prisma/adapter-better-sqlite3`          |
|  - Models: RawMaterial, PackagingMaterial, RMIssue, ProductionLog,          |
|    PackagingIssue, FinishedGood, Dispatch, Role, User, AuditLog             |
+-----------------------------------------------------------------------------+
```

---

## 4. Environment & Configuration

```env
# Database Connection (SQLite local file URL)
DATABASE_URL="file:./dev.db"

# Server Settings
NODE_ENV="development"
```
