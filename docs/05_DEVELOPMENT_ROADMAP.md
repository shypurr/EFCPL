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
| - Prisma v7 ORM, SQLite driver adapter, Inventory, Operations & RBAC tables |
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
| - 13 Interactive Action Modals, Tabbed Dashboard, MobileNav & Topbar        |
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
| PHASE 6: Production Hardening, PWA & Cloud Deployment (ACTIVE)              |
| - PWA Manifest, Offline Worker, PostgreSQL Production Migration             |
+-----------------------------------------------------------------------------+
```

---

## 2. Milestone Checklist

### Phase 1: Architecture & Documentation (✅ Completed)
- [x] Document core food processing workflows and inventory structure.
- [x] Structure 4 primary system areas: Inventory (RM/PM), Operations (5 Tabs), Master Creation Hub, and Security & RBAC.

### Phase 2: Prisma Schema & Database Engine (✅ Completed)
- [x] Configure Prisma v7 with `@prisma/adapter-better-sqlite3`.
- [x] Implement schema for `RawMaterial`, `PackagingMaterial`, `RMIssue`, `ProductionLog`, `PackagingIssue`, `FinishedGood`, `Dispatch`, and RBAC.
- [x] Database schema sync (`prisma db push`) and client generation (`prisma generate`).

### Phase 3: Server Actions Layer (✅ Completed)
- [x] Build Raw Material & Packaging CRUD actions (`src/actions/inventory.ts`, `src/actions/raw-materials.ts`, `src/actions/packaging.ts`).
- [x] Build Operations pipeline actions (`src/actions/operations.ts`, `src/actions/finished-goods.ts`, `src/actions/movements.ts`).
- [x] Implement RBAC and Authentication actions (`src/actions/auth.ts`, `src/actions/roles.ts`).
- [x] Implement CSV import handler (`src/actions/csv-import.ts`).

### Phase 4: Frontend Development & Responsive UI (✅ Completed)
- [x] Responsive layout with dark theme palette (`#0B132B`, `#0D1B2E`, `#162440`, `#1D9E75`).
- [x] 13 interactive modals for inward logging, issuances, master item creation, and role management.
- [x] Tablet and mobile viewports with `MobileNav` bar and responsive data table wrappers.

### Phase 5: Safeguards & Traceability (✅ Completed)
- [x] **Discrete RM Batch Arrivals**: Incoming shipments log as separate records rather than merging stock.
- [x] **Reverse-Chronological Ordering**: Latest incoming entries displayed at the top.
- [x] **Universal Non-Negative Controls**: `min="0"` on all numeric inputs with negative keystroke prevention.
- [x] **Dynamic FG Dropdowns**: "Issue For" selectors linked dynamically to active Finished Goods.
- [x] **Changeable Unit Dropdown**: Dropdown selector with `KG`, `Units`, `Boxes` for inward raw materials.

### Phase 6: Production Hardening & Cloud Deployment (🚧 Next Steps)
- [ ] PWA Web Manifest & Service Worker registration.
- [ ] Multi-node PostgreSQL / Neon cloud migration.
- [ ] Automated end-to-end integration test suite.
