# 05. Implementation Roadmap & Milestones — EFCPL MES App

## 1. Execution Phases Overview

```
+-----------------------------------------------------------------------------+
| PHASE 1: Architecture & Technical Specifications (COMPLETED)                |
| - Domain modeling, multi-section navigation hierarchy, specs                |
+------------------------------------+----------------------------------------+
                                     v
+------------------------------------+----------------------------------------+
| PHASE 2: Database Schema & Setup (COMPLETED)                                |
| - Prisma v7 ORM, SQLite adapter (later Postgres), Inventory/Ops/RBAC tables |
+------------------------------------+----------------------------------------+
                                     v
+------------------------------------+----------------------------------------+
| PHASE 3: Backend API & Server Actions Layer (COMPLETED)                     |
| - 3 implementation modules (inventory, operations, rbac) + 6 proxy modules  |
+------------------------------------+----------------------------------------+
                                     v
+------------------------------------+----------------------------------------+
| PHASE 4: Frontend Responsive UI & Modals (COMPLETED)                        |
| - 14 panels, 14 wired dialogs, Sidebar + Topbar + MobileNav                 |
+------------------------------------+----------------------------------------+
                                     v
+------------------------------------+----------------------------------------+
| PHASE 5: Operational Safeguards & Batch Traceability (COMPLETED)            |
| - Discrete RM arrival logging, reverse-chronological sorting, non-negative  |
|   input controls, dynamic FG dropdowns, changeable units, $transaction      |
+------------------------------------+----------------------------------------+
                                     v
+------------------------------------+----------------------------------------+
| PHASE 6: Cloud Database Migration (COMPLETED)                               |
| - PostgreSQL/Neon datasource, @prisma/adapter-pg, Render deploy config      |
+------------------------------------+----------------------------------------+
                                     v
+------------------------------------+----------------------------------------+
| PHASE 6.5: RM Master / Arrival Separation (COMPLETED)                       |
| - isMaster flag, material-level stock aggregation, remarks removed          |
+------------------------------------+----------------------------------------+
                                     v
+------------------------------------+----------------------------------------+
| PHASE 7: Master Catalog Hub & Safe Archival System (COMPLETED)              |
| - MasterCatalogPanel (2-level drilldown), isArchived soft-deletion,         |
|   batch multi-select deletion, EditMaterialModal inline editing             |
+------------------------------------+----------------------------------------+
                                     v
+------------------------------------+----------------------------------------+
| PHASE 8: Factory Intelligence, PO Suggestions & Reports (COMPLETED)         |
| - PO replenishment engine, reports & FG aging, real-time alerts panel       |
+------------------------------------+----------------------------------------+
                                     v
+------------------------------------+----------------------------------------+
| PHASE 9: Correctness, Security & Hardening (IN PROGRESS / PLANNED)          |
| - 9a Stock-model drift fixes    - 9b RBAC enforcement                       |
| - 9c Cleanup & dependency prune - 9d Migrations, audit log, PWA, tests      |
+-----------------------------------------------------------------------------+
```

---

## 2. Milestone Checklist

### Phase 1: Architecture & Documentation (✅ Completed)
- [x] Document core food-processing workflows and inventory structure.
- [x] Structure primary system areas: Inventory (RM/PM), Operations (5 panels), Master Creation Hub, Security & RBAC.

### Phase 2: Prisma Schema & Database Engine (✅ Completed)
- [x] Configure Prisma v7 with PostgreSQL on Neon (`@prisma/adapter-pg`).
- [x] 14 models: `RawMaterial`, `PackagingMaterial`, `RMIssue`, `ProductionLog`, `PackagingIssue`, `FinishedGood`, `Dispatch`, `SystemLookup`, `StorageLocation`, `Permission`, `Role`, `RolePermission`, `User`, `AuditLog`.
- [x] Schema sync (`prisma db push`) and client generation (`prisma generate` on `postinstall`).

### Phase 3: Server Actions Layer (✅ Completed)
- [x] RM & PM CRUD, inward logging, archiving and master editing ([`inventory.ts`](../src/actions/inventory.ts)).
- [x] Five operations pipelines, all transactional ([`operations.ts`](../src/actions/operations.ts)).
- [x] Roles, permissions, users, login and session ([`rbac.ts`](../src/actions/rbac.ts)).
- [x] Reports ([`reports.ts`](../src/actions/reports.ts)) and PO suggestions ([`po-suggestions.ts`](../src/actions/po-suggestions.ts)).
- [x] Domain-named proxy modules: `raw-materials.ts`, `packaging.ts`, `finished-goods.ts`, `movements.ts`, `auth.ts`, `roles.ts`.
- [~] CSV importer written ([`csv-import.ts`](../src/actions/csv-import.ts)) but **never wired to a UI entry point**.
- [~] Lookup actions written ([`lookups.ts`](../src/actions/lookups.ts)) but **no live caller** — dropdown values are hardcoded in the modals.

### Phase 4: Frontend Development & Responsive UI (✅ Completed)
- [x] Dark theme palette (`#070E1A`, `#0D1B2E`, `#162440`, `#1D9E75`) via CSS variables in `globals.css`.
- [x] 14 panels covering Dashboard, Alerts, Inventory, 5 Operations, Master Entry Hub, Admin, Reports and PO Suggestions.
- [x] 14 wired dialogs: 11 under `Modals/` plus `LoginModal`, `RoleManagerModal` and `UserManagerModal`.
- [x] Mobile and tablet viewports with a fixed bottom `MobileNav` (5 tabs), a full slide-out drawer, and horizontally scrolling tables.
- [~] `GRNModal.tsx` and `AddLookupModal.tsx` exist under `Modals/` but are imported by nothing.

### Phase 5: Safeguards & Traceability (✅ Completed)
- [x] **Discrete RM batch arrivals**: incoming shipments log as separate rows rather than merging stock.
- [x] **Reverse-chronological ordering** (`createdAt: desc`).
- [x] **Non-negative controls**: `min="0"` on numeric inputs plus change-handler guards.
- [x] **Server-side guards**: `qty > 0`, sufficient-stock checks, archived-item rejection, duplicate-code rejection.
- [x] **Atomic movements**: `prisma.$transaction` around all five operations write paths.
- [x] **Dynamic FG dropdowns** and changeable unit selectors.

### Phase 6: Cloud Database Migration (✅ Completed)
- [x] Prisma datasource switched to `postgresql`; `@prisma/adapter-pg` + `pg` `Pool` wired in [`prisma.ts`](../src/lib/prisma.ts).
- [x] Fail fast when `DATABASE_URL` is absent; auto-enable TLS for non-`localhost` hosts.
- [x] Neon connection string documented in `.env.example`; `postinstall: prisma generate` for Render builds.
- [x] Environment-gated query logging and a `globalThis`-cached client for dev hot reloads.

### Phase 6.5: RM Master / Arrival Separation (✅ Completed)
- [x] **`isMaster` flag on `RawMaterial`**: catalog SKUs and physical arrivals as distinct row kinds in one table.
- [x] **`createRawMaterial` registers only**: `stock: 0`, `batchNumber: ''`, `expiryDate: null`; rejects duplicate master codes.
- [x] **`getRawMaterials` filters `isMaster: false`**; `getRawMaterialMasters()` feeds the code dropdowns.
- [x] **Material-level stock helpers** ([`inventory-utils.ts`](../src/lib/inventory-utils.ts)): `sumStockByCode`, `resolveStockStatus`, `getRawMaterialTotalStock`, `syncRawMaterialStatusByCode`.
- [x] **Remarks removed from entry modals**; all write paths persist `remarks: null`.

### Phase 7: Master Catalog Hub & Safe Archival System (✅ Completed)
- [x] **2-level Master Catalog Panel**: category picker with counts plus detailed catalog tables.
- [x] **Safe soft-deletion**: `archiveRawMaterialByCode`, `archivePackagingMaterial`, `archiveFinishedGood`.
- [x] **Batch multi-select deletion** with a stock-aware confirmation dialog.
- [x] **Inline catalog editor** with per-category field specs and read-only code/SKU.

### Phase 8: Factory Intelligence, PO Suggestions & Reports (✅ Completed)
- [x] **PO suggestion engine**: `max(0, target − stock)` with `target = maxStock ?? (reorderLevel × 3, else 100)`.
- [x] **Reports & FG aging**: stock summaries, last 100 dispatches, `ageDays` / `daysLeft` per in-stock SKU.
- [x] **Alerts panel** with per-material "Generate PO" jumps and a live alert badge.

---

### Phase 9: Correctness, Security & Hardening (📋 Open)

Ordered by risk. Items 9a and 9b are the ones that change what operators see and who can do what.

#### 9a — Close the stock-model drift *(see [03 §5](03_SYSTEM_ARCHITECTURE_AND_DESIGN.md#5-known-drift-between-the-stock-model-and-its-consumers))*
- [ ] Render `materialStock` / `isLowStock` in the RM table and dashboard instead of per-row `stock <= reorderLevel` — the fields are already computed and currently discarded.
- [ ] Derive `lowRmCount` (and the Alerts panel cards) from material-level totals so multi-batch codes stop over-counting.
- [ ] Call `syncRawMaterialStatusByCode` at the end of `createRMIssue` — the only stock mutation that skips it.
- [ ] Filter `po-suggestions.ts` and `reports.ts` with `where: { isMaster: false, isArchived: false }`; today they include zero-stock master rows and archived materials.
- [ ] Make `getRMDetailsForIssue` resolve the same row `createRMIssue` will decrement (match on `batchNumber`, not newest-first).
- [ ] Decide whether `getRawMaterialTotalStock` should be used or removed — it currently has no caller.

#### 9b — Enforce RBAC
- [ ] Add a server-side guard (`requirePermission(key)`) that reads `getCurrentUser()` and rejects unauthorized mutations. **No action checks the session today.**
- [ ] Gate panel visibility and action buttons in `page.tsx` on `currentUser.permissions`.
- [ ] Replace the `setupFirstTimePassword` → `loginUser` alias with a real first-login flow, or drop the two-step `LoginModal` branch.
- [ ] Remove the seeded default credentials (`admin/admin123`, `manager/manager123`) and the `efcpl123` fallback password from production paths.

#### 9c — Cleanup
- [ ] Delete or wire up `GRNModal.tsx` and `AddLookupModal.tsx`.
- [ ] Delete or wire up `csv-import.ts` and `lookups.ts`; if lookups stay, seed `SystemLookup` / `StorageLocation` and replace the hardcoded unit/location arrays in the modals.
- [ ] Remove `patch2.js` (a stale one-off codemod that was never applied) and `prisma/dev.db` (pre-Postgres SQLite leftover).
- [ ] Prune unused dependencies: `zod`, `clsx`, `tailwind-merge`, `date-fns`, `better-sqlite3`, `@prisma/adapter-better-sqlite3`, `@types/better-sqlite3`.
- [ ] Reduce `any` usage in action payloads and component props; `strict` is on but largely bypassed.

#### 9d — Production hardening
- [ ] **Migrations**: adopt `prisma migrate dev` / `migrate deploy`. `prisma.config.ts` already points at `prisma/migrations`, but the directory does not exist and the schema is applied with `db push`.
- [ ] **Audit log**: write `AuditLog` rows on mutations. The model, relation and indexes exist; nothing inserts.
- [ ] **PWA**: add the missing `public/icon-192.png` and `public/icon-512.png` referenced by `manifest.json`, then register a service worker. The manifest itself is already linked from `layout.tsx`.
- [ ] **Tests**: no test framework, unit tests or E2E suite exists. Start with `inventory-utils.ts` and the five transactional write paths.
- [ ] **Split `page.tsx`** (1 555 lines, one client component) into per-panel components.
