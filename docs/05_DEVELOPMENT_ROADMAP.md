# 05. Implementation Roadmap & Milestones — EFCPL Inventory App

## 1. Execution Phases Overview

```
+-----------------------------------------------------------------------------+
| PHASE 1: Architecture & Technical Documentation                              |
| - Requirements, Tech Stack Selection, Dynamic System Architecture, Prisma Schema|
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 2: Project Initialization & Database Provisioning                     |
| - Next.js 14 (App Router) Setup, Prisma & Neon Config, Tailwind & Shadcn UI  |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 3: Dynamic Data Layer & Server Actions                                |
| - Dynamic SystemLookups, Raw Material CRUD, Finished Goods CRUD, GRN/Issues |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 4: UI Components & Dashboard Layout                                   |
| - Responsive Mobile Shell, Dynamic Navigation, Stat Cards, Tables & Modals  |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 5: Advanced Modules (Alert Engine, PO Suggestions, Analytics)          |
| - Stock Expiry Rules, Dynamic PO Restock Math, Valuation & Aging Reports    |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
| PHASE 6: PWA Integration, Audit Logging & Vercel Production Deployment      |
| - PWA Manifest/Service Worker, RBAC Auth, Vercel CI/CD & Neon Seed Deployment |
+-----------------------------------------------------------------------------+
```

---

## 2. Detailed Milestone Breakdowns

### Phase 1: Architecture & Documentation (Completed)
- [x] Analyze original 921-line dashboard prototype.
- [x] Document core business domain, requirements, and zero-hardcoding philosophy.
- [x] Specify tech stack (Next.js 14, TypeScript, Tailwind, Neon Postgres, Prisma, Vercel).
- [x] Design comprehensive PostgreSQL relational schema with JSONB extensions.

### Phase 2: Next.js Project Initialization & Database Setup
- [ ] Initialize Next.js 14 App Router project (`npx create-next-app@latest`).
- [ ] Configure Tailwind CSS, fonts (`DM Sans` & `DM Mono`), and Shadcn UI components.
- [ ] Initialize Prisma ORM with `schema.prisma`.
- [ ] Provision Neon PostgreSQL cloud database and connect via `.env.local`.
- [ ] Run initial database migrations (`npx prisma migrate dev`).
- [ ] Seed default dynamic lookups (Units: *KG, LTR, Cartons, Rolls*, Categories, Storage Zones).

### Phase 3: Backend API & Server Actions Layer
- [ ] Build dynamic Master Lookup services (`actions/lookups.ts`).
- [ ] Implement Raw Material actions (`actions/raw-materials.ts`) with validation.
- [ ] Implement Finished Goods & Batch actions (`actions/finished-goods.ts`).
- [ ] Implement Packaging actions (`actions/packaging.ts`).
- [ ] Implement Inventory Movements (GRN / MIS / Dispatch) with atomic transaction updates.

### Phase 4: Frontend Component System & Layout
- [ ] Build App Shell: Sidebar navigation (Desktop) + Bottom Navigation Bar (Mobile).
- [ ] Build Dynamic Data Table component (sortable, searchable, customizable columns).
- [ ] Build Dynamic Form Modal Builder (supporting standard inputs + dynamic JSON metadata).
- [ ] Build Topbar with dynamic live Alert notifications badge.

### Phase 5: Advanced Functional Modules
- [ ] **Alert Engine**: Dynamic low-stock and near-expiry warning calculations ($\le 30$ days, $\le 60$ days).
- [ ] **Purchase Order Generator**: Restock calculation engine based on lead time and reorder thresholds.
- [ ] **Analytics & Reports Module**: Valuation calculation (₹ Lakhs), Material consumption log, FG aging & dead stock table.
- [ ] **System Settings Page**: Admin dashboard to add/edit custom units, categories, storage zones, and alert thresholds without touching code.

### Phase 6: PWA, Security & Vercel Production Deployment
- [ ] Configure PWA manifest (`manifest.json`), service worker caching, and home screen icons.
- [ ] Integrate user authentication (Clerk / NextAuth.js) with Role-Based Access Control.
- [ ] Implement audit log middleware for tracking user mutations.
- [ ] Connect repository to Vercel for automated CI/CD deployment.
- [ ] Perform end-to-end verification across desktop and mobile devices.
