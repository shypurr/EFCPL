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
| - 14 Interactive Panels, 13 Modals, Desktop Sidebar, MobileNav & Topbar    |
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
| PHASE 7: Master Catalog Hub & Safe Archival System (COMPLETED)              |
| - MasterCatalogPanel (2-level drilldown), isArchived soft-deletion,         |
|   batch multi-select deletion, EditMaterialModal inline editing             |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 8: Factory Intelligence, PO Suggestions & Reports (COMPLETED)         |
| - PO Replenishment Engine (po-suggestions.ts), Reports & FG Aging           |
|   (reports.ts), Real-time Alerts Panel                                      |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 9: Production Hardening & PWA (PLANNED)                               |
| - PWA Manifest, Offline Worker, E2E test suite, Audit-log write instrumentation|
+-----------------------------------------------------------------------------+
```

---

## 2. Milestone Checklist

### Phase 1: Architecture & Documentation (✅ Completed)
- [x] Document core food processing workflows and inventory structure.
- [x] Structure primary system areas: Inventory (RM/PM), Operations (5 Tabs), Master Creation Hub, and Security & RBAC.

### Phase 2: Prisma Schema & Database Engine (✅ Completed)
- [x] Configure Prisma v7 with PostgreSQL on Neon (`@prisma/adapter-pg`).
- [x] Implement schema for `RawMaterial`, `PackagingMaterial`, `RMIssue`, `ProductionLog`, `PackagingIssue`, `FinishedGood`, `Dispatch`, and RBAC.
- [x] Database schema sync (`prisma db push`) and client generation (`prisma generate`).

### Phase 3: Server Actions Layer (✅ Completed)
- [x] Build Raw Material & Packaging CRUD actions (`src/actions/inventory.ts`, `src/actions/raw-materials.ts`, `src/actions/packaging.ts`).
- [x] Build Operations pipeline actions (`src/actions/operations.ts`, `src/actions/finished-goods.ts`, `src/actions/movements.ts`).
- [x] Implement RBAC and Authentication actions (`src/actions/auth.ts`, `src/actions/roles.ts`, `src/actions/rbac.ts`).
- [x] Implement CSV import handler (`src/actions/csv-import.ts`).

### Phase 4: Frontend Development & Responsive UI (✅ Completed)
- [x] Responsive layout with dark theme palette (`#070E1A`, `#0D1B2E`, `#162440`, `#1D9E75`).
- [x] 14 dedicated interactive panels covering Dashboard, Inventory, Operations, Master Entry Hub, Admin & Governance, Reports, and Alerts.
- [x] 13 operational and catalog modals plus `EditMaterialModal`, `RoleManagerModal`, `UserManagerModal`, and `LoginModal`.
- [x] Mobile and tablet viewports with fixed bottom `MobileNav` bar, slide-out full navigation drawer, and horizontal scrolling tables.

### Phase 5: Safeguards & Traceability (✅ Completed)
- [x] **Discrete RM Batch Arrivals**: Incoming shipments log as separate records rather than merging stock.
- [x] **Reverse-Chronological Ordering**: Latest incoming entries displayed at the top (`createdAt: desc`).
- [x] **Universal Non-Negative Controls**: `min="0"` on all numeric inputs with negative keystroke prevention.
- [x] **Dynamic FG Dropdowns**: "Issue For" selectors linked dynamically to active Finished Goods.
- [x] **Changeable Unit Dropdown**: Dropdown selector with `KG`, `Units`, `Boxes`, etc. for inward raw materials.

### Phase 6: Cloud Database Migration (✅ Completed)
- [x] Switch the Prisma datasource to `postgresql` and wire `@prisma/adapter-pg` + `pg` `Pool` in `src/lib/prisma.ts`.
- [x] Fail fast when `DATABASE_URL` is absent; auto-enable TLS for non-`localhost` hosts.
- [x] Neon connection string documented in `.env.example`; `postinstall: prisma generate` for Render builds.
- [x] Environment-gated query logging and a `globalThis`-cached client for dev hot reloads.

### Phase 6.5: RM Master / Arrival Separation (✅ Completed)
- [x] **`isMaster` flag on `RawMaterial`**: catalog SKUs and physical arrivals live as distinct row kinds in one table.
- [x] **`createRawMaterial` registers only**: writes `stock: 0`, `batchNumber: ''`, `expiryDate: null` — no phantom opening batch, and rejects duplicate master codes.
- [x] **`getRawMaterials` filters `isMaster: false`**: the RM table shows arrivals only; `getRawMaterialMasters()` feeds code dropdowns.
- [x] **Material-level stock model** (`src/lib/inventory-utils.ts`): `sumStockByCode`, `resolveStockStatus`, `getRawMaterialTotalStock`, `syncRawMaterialStatusByCode`; `materialStock` / `isLowStock` derived on read.
- [x] **Remarks removed from entry modals**; all write paths persist `remarks: null`.

### Phase 7: Master Catalog Hub & Safe Archival System (✅ Completed)
- [x] **2-Level Master Catalog Panel (`MasterCatalogPanel.tsx`)**: Category picker (RM/PM/FG) with item counts + detailed catalog tables.
- [x] **Safe Soft-Deletion / Archival (`isArchived: true`)**: `archiveRawMaterialByCode`, `archivePackagingMaterial`, and `archiveFinishedGood` mark items as archived rather than deleting rows, preserving historical issue, production, and dispatch logs.
- [x] **Batch Multi-Select Deletion**: Select-all / individual checkboxes for multi-item deletion with batch confirmation dialog.
- [x] **Inline Catalog Editor (`EditMaterialModal.tsx`)**: Edit material-level attributes (`name`, `brand`, `unit`, `reorderLevel`, `maxStock`, `supplier`, `location`) and synchronize recomputed status across all batch records.

### Phase 8: Factory Intelligence, PO Suggestions & Reports (✅ Completed)
- [x] **Automated PO Suggestion Engine (`po-suggestions.ts`)**: Evaluates stock against reorder/max stock thresholds and suggests purchase order quantities.
- [x] **Factory Reports & Inventory Aging (`reports.ts`)**: Overall stock valuation summary and FG aging calculations (`daysLeft` until expiration, `ageDays` from MFG).
- [x] **Factory Floor Alerts View**: Centralized real-time alert cards with quick "Generate PO" action buttons.

### Phase 9: Production Hardening & PWA (📋 Planned)
- [ ] PWA Web Manifest & Service Worker registration.
- [ ] Automated end-to-end integration test suite.
- [ ] Write-path audit log instrumentation (`AuditLog` model exists; write hooks planned).

