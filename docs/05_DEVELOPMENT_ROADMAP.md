# 05. Implementation Roadmap & Milestones — EFCPL MES App

## 1. Execution Phases Overview

```
+-----------------------------------------------------------------------------+
| PHASE 1: Architecture & Technical Specifications (COMPLETED)                |
| - Domain Modeling, Multi-Section Navigation Hierarchy, Specs                |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 2: Database Schema & Setup (COMPLETED)                                |
| - Prisma v7 ORM, SQLite adapter (later Postgres), Inventory/Ops/RBAC tables |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 3: Backend API & Server Actions Layer (COMPLETED)                     |
| - Server Actions: inventory.ts, operations.ts, raw-materials.ts,            |
|   finished-goods.ts, packaging.ts, movements.ts, roles.ts, auth.ts          |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 4: Frontend Responsive UI & Modals (COMPLETED)                        |
| - 12 Operational Modals, Tabbed Dashboard, Sidebar, MobileNav & Topbar      |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 5: Operational Safeguards & Batch Traceability (COMPLETED)            |
| - Discrete RM Arrival Logging, Reverse-Chronological Sorting, Non-Negative  |
|   Input Controls, Dynamic FG Dropdowns, Changeable Units                    |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 6: Cloud Database Migration (COMPLETED)                               |
| - PostgreSQL/Neon datasource, @prisma/adapter-pg, Render deploy config      |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 6.5: RM Master / Arrival Separation (COMPLETED)                       |
| - isMaster flag, material-level stock aggregation, remarks removed          |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 7: RM Issue Rework (ACTIVE)                                           |
| - Align issuing with the master/arrival + material-total stock model        |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 8: Production Hardening & PWA (PLANNED)                               |
| - PWA Manifest, Offline Worker, E2E test suite                              |
+-----------------------------------------------------------------------------+
```

---

## 2. Milestone Checklist

### Phase 1: Architecture & Documentation (✅ Completed)
- [x] Document core food processing workflows and inventory structure.
- [x] Structure 4 primary system areas: Inventory (RM/PM), Operations (5 Tabs), Master Creation Hub, and Security & RBAC.

### Phase 2: Prisma Schema & Database Engine (✅ Completed)
- [x] Configure Prisma v7 with `@prisma/adapter-better-sqlite3` *(superseded by Phase 6 — now `@prisma/adapter-pg`)*.
- [x] Implement schema for `RawMaterial`, `PackagingMaterial`, `RMIssue`, `ProductionLog`, `PackagingIssue`, `FinishedGood`, `Dispatch`, and RBAC.
- [x] Database schema sync (`prisma db push`) and client generation (`prisma generate`).

### Phase 3: Server Actions Layer (✅ Completed)
- [x] Build Raw Material & Packaging CRUD actions (`src/actions/inventory.ts`, `src/actions/raw-materials.ts`, `src/actions/packaging.ts`).
- [x] Build Operations pipeline actions (`src/actions/operations.ts`, `src/actions/finished-goods.ts`, `src/actions/movements.ts`).
- [x] Implement RBAC and Authentication actions (`src/actions/auth.ts`, `src/actions/roles.ts`).
- [x] Implement CSV import handler (`src/actions/csv-import.ts`).

### Phase 4: Frontend Development & Responsive UI (✅ Completed)
- [x] Responsive layout with dark theme palette (`#0B132B`, `#0D1B2E`, `#162440`, `#1D9E75`).
- [x] 12 operational modals (`src/components/Modals/`) for inward logging, issuances, production, dispatch, GRN, master item creation and lookup config, plus `Admin/RoleManagerModal`, `Admin/UserManagerModal` and `LoginModal`.
- [x] Tablet and mobile viewports with `MobileNav` bar and responsive data table wrappers.

### Phase 5: Safeguards & Traceability (✅ Completed)
- [x] **Discrete RM Batch Arrivals**: Incoming shipments log as separate records rather than merging stock.
- [x] **Reverse-Chronological Ordering**: Latest incoming entries displayed at the top.
- [x] **Universal Non-Negative Controls**: `min="0"` on all numeric inputs with negative keystroke prevention.
- [x] **Dynamic FG Dropdowns**: "Issue For" selectors linked dynamically to active Finished Goods.
- [x] **Changeable Unit Dropdown**: Dropdown selector with `KG`, `Units`, `Boxes` for inward raw materials.

### Phase 6: Cloud Database Migration (✅ Completed)
- [x] Switch the Prisma datasource to `postgresql` and wire `@prisma/adapter-pg` + `pg` `Pool` in `src/lib/prisma.ts`.
- [x] Fail fast when `DATABASE_URL` is absent; auto-enable TLS for non-`localhost` hosts.
- [x] Neon connection string documented in `.env.example`; `postinstall: prisma generate` for Render builds.
- [x] Environment-gated query logging and a `globalThis`-cached client for dev hot reloads.

### Phase 6.5: RM Master / Arrival Separation (✅ Completed)
- [x] **`isMaster` flag on `RawMaterial`**: catalog SKUs and physical arrivals now live as distinct row kinds in one table.
- [x] **`createRawMaterial` registers only**: writes `stock: 0`, `batchNumber: ''`, `expiryDate: null` — no phantom opening batch, and rejects a duplicate master code.
- [x] **`getRawMaterials` filters `isMaster: false`**: the RM table shows arrivals only; `getRawMaterialMasters()` feeds the code dropdowns (deduplicated by code, master preferred).
- [x] **Material-level stock model** (`src/lib/inventory-utils.ts`): `sumStockByCode`, `resolveStockStatus`, `getRawMaterialTotalStock`, `syncRawMaterialStatusByCode`; `materialStock` / `isLowStock` derived on read.
- [x] **Remarks removed from every entry modal**; all write paths persist `remarks: null`.

### Phase 7: RM Issue Rework (🚧 Active)
Goal: bring the issuing path in line with the master/arrival split and the material-level stock
model established in Phase 6.5.

Current behaviour (`createRMIssue` + `getRMDetailsForIssue` in `src/actions/operations.ts`,
`IssueModal.tsx`):
- [x] Batch-accurate selection — the modal picks a specific arrival row by `id` and posts its `code` + `batchNumber`.
- [x] Transactional deduct-and-log via `prisma.$transaction`.
- [x] Rejects non-positive quantities and insufficient batch stock.

Gaps to close in this phase:
- [ ] **Master rows are issuable**: both `getRMDetailsForIssue` and `createRMIssue` resolve rows with `findFirst({ where: { code } })` and no `isMaster: false` filter. A freshly registered master (stock `0`) is the newest row for its code, so a code-only issue can land on the catalog row and fail with a confusing "insufficient stock".
- [ ] **Status is recomputed per row**: the transaction sets `status` from the single row's post-issue `stock` against that row's `reorderLevel`, bypassing `syncRawMaterialStatusByCode` — so after an issue the stored status can contradict the material total.
- [ ] **Modal reads batch stock as available stock**: `IssueModal` warns against `selectedRm.stock` (one batch) rather than the `materialStock` already returned by `getRawMaterials`.
- [ ] **Client-side override**: the over-issue warning is a `confirm()` the operator can accept; the server still rejects it, producing a dead-end dialog.
- [ ] **No cross-batch issuing**: issuing more than one batch holds requires several manual entries; decide whether FEFO/FIFO auto-allocation across batches is in scope.
- [ ] `quantityInBatch` falls back to a hardcoded `100` in the modal when no row is selected.

### Phase 8: Production Hardening & PWA (📋 Planned)
- [ ] PWA Web Manifest & Service Worker registration.
- [ ] Automated end-to-end integration test suite.
- [ ] Audit-log wiring for all stock mutations (model exists; write paths not yet instrumented).
