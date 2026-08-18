# 05. Implementation Roadmap & Milestones — EFCPL MES App

## 1. Execution Phases Overview

```
+-----------------------------------------------------------------------------+
| PHASE 1: Architecture & Technical Specifications (COMPLETED)                |
| - Requirements, Tech Stack Selection, Dynamic System Architecture, Specs     |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 2: Database Schema & Seeding (COMPLETED & VALIDATED)                   |
| - Prisma v7 Schema, Inventory (RM/PM) & Operations (5 Tabs) & RBAC          |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 3: Backend API & Server Actions Layer (IN PROGRESS)                    |
| - Actions: Auth/RBAC, Inventory CRUD, Operations Pipeline, CSV Importer      |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 4: Frontend Development & Google Stitch Integration                  |
| - Google Stitch UI integration, Inventory Tabs, 5 Operations Tabs, Add Hub  |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 5: Advanced Modules (Alerts, Analytics, Reports)                      |
| - Expiry alerts, Stock thresholds, Valuation, Aging reports                 |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 6: Production Security, PWA & Vercel Deployment                        |
| - PWA Service Worker, Security audit, Vercel CI/CD, Factory Live CSV Seed    |
+-----------------------------------------------------------------------------+
```

---

## 2. Milestone Checklist

### Phase 1: Architecture & Documentation (✅ Completed)
- [x] Document core business domain, requirements, and zero-hardcoding philosophy.
- [x] Outline Inventory (RM, PM) & Operations (5 standalone tabs) system hierarchy.
- [x] Design Discord-style Roles & Permissions model + Staff User provisioning flow.

### Phase 2: Prisma Schema & Validation (✅ Completed)
- [x] Write updated `prisma/schema.prisma` with 2 Inventory models, 5 Operations pipeline models, and RBAC tables.
- [x] Validate schema cleanly using `npx prisma validate`.

### Phase 3: Backend API & Server Actions Layer (🚧 Active Focus)
- [ ] Build Auth & RBAC Server Actions (`auth.ts`, `roles.ts`).
- [ ] Build Inventory Server Actions (`raw-materials.ts`, `packaging-materials.ts`).
- [ ] Build Operations Server Actions (`rm-issue.ts`, `production.ts`, `packaging-issue.ts`, `finished-goods.ts`, `dispatch.ts`).
- [ ] Build CSV Data Import & Factory Seed utility (`csv-importer.ts`).

### Phase 4: Frontend Development & Google Stitch Integration
- [ ] Integrate Google Stitch components and design layout.
- [ ] Connect dynamic data tables and entry form modals to Server Actions.
- [ ] Implement Add Materials / Product entry hub.
- [ ] Implement Discord-style Role & Permission management UI.

### Phase 5: Advanced Modules & Reports
- [ ] Expiry alert rule engine ($\le 30$ and $\le 60$ days).
- [ ] Purchase Order suggestions engine.
- [ ] Valuation & Aging reports.

### Phase 6: PWA, Security & Vercel Deployment
- [ ] PWA manifest & Service Worker.
- [ ] Live factory CSV seed import.
- [ ] Vercel deployment.
