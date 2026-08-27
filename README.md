# EFCPL Manufacturing Execution System (MES) & Inventory Management Platform

> **Exotic Food Processing Private Limited (EFCPL)** — Food Processing, Cold-Chain Inventory & Operations Pipeline.

A modern, production-grade web application built with **Next.js 16 (App Router)**, **React 19**, **Prisma ORM v7**, **Tailwind CSS v4**, and **TypeScript**.

---

## 🌟 Key Features & Functional Modules

### 📦 1. Inventory Management (Discrete Batch Model)
* **Raw Materials (RM)**:
  * **Master SKU vs. Physical Batch Arrivals**: Registering a material in the catalog (*+ Add Raw Material*) creates a master template record (`isMaster: true`, zero stock, no batch). Stock exists only when an inward arrival is logged (*Log Incoming RM*).
  * **Discrete Batch Logging**: Every incoming shipment creates a separate batch entry (`isMaster: false`) with lot number, supplier, arrival timestamp, and expiry date.
  * **Material-Level Totals & Dynamic Status**: Material stock is dynamically computed as the sum of all arrival batches sharing that material code. Low-stock thresholds evaluate against the material's total stock (`totalStock <= reorderLevel`), keeping all batch records in synchronized status.
  * **Chronological Sorting**: Reverse-chronological table display (`createdAt: desc`) keeping the latest shipments at the top of the table.
* **Packaged Materials (PM)**:
  * Master tracking for glass jars, bottles, caps, pouches, cartons, and packaging supplies with reorder alerts.

### ⚙️ 2. Operations Pipelines (5 Standalone Workflows)
1. **RM Issue**: Deduct raw agricultural commodities from specific batches to production runs with dynamic Target Finished Good (FG) binding.
2. **Production Log**: Record completed manufacturing runs with batch counts, output quantities, wastage, operator attribution, and **automatic Finished Goods stock incrementation**.
3. **Packaging Issue**: Issue packaging supplies (jars, bottles, cartons, caps) directly linked to target FG production runs.
4. **Finished Goods (FG)**: Cold room and warehouse finished goods inventory with **auto-calculated shelf life** ($\text{Expiry Date} - \text{MFG Date}$).
5. **Dispatch Log**: Customer/distributor shipments with positive dispatch quantities, batch codes, delivery locations, and Certificate of Analysis (CoA) status tracking with **automatic FG stock deduction**.

### 📋 3. Master Catalog Hub & Safe Archival System
* **2-Level Interactive Catalog Panel (`MasterCatalogPanel.tsx`)**:
  * **Level 1**: Quick visual switcher cards for Raw Materials (RM), Packaging Materials (PM), and Finished Goods (FG) showing active item counts and descriptions.
  * **Level 2**: Comprehensive catalog tables displaying codes/SKUs, descriptions, units, reorder levels, max stock, current total stock, default suppliers, and locations.
* **Batch Multi-Select & Single-Item Deletion**: Supports search filtering, select-all / individual checkboxes for multi-item removal, and single-item delete actions.
* **Safe Soft-Deletion / Archival Architecture (`isArchived`)**:
  * Deleting catalog items flags them as `isArchived: true` and `status: 'Archived'` rather than hard-deleting rows.
  * Preserves full relational integrity and historical records (past RM issues, packaging issues, production logs, and dispatches).
  * Hides archived items from active inventory views and modal dropdown selectors, blocking new operations on deleted SKUs.
* **Inline Catalog Editor (`EditMaterialModal.tsx`)**: Edit material-level settings (name, brand, unit, reorder level, max stock, default supplier/location) and automatically synchronize recomputed status across all batches.

### 📊 4. Factory Intelligence, PO Suggestions & Reports
* **Automated Purchase Order (PO) Engine (`po-suggestions.ts`)**:
  * Continuously evaluates active RM and PM inventory against reorder levels and maximum stock targets.
  * Calculates suggested PO quantities (`Math.max(0, maxStock - stock)` or `reorderLevel * 3`).
* **Factory Floor Alerts & Real-time Warnings**: Dedicated alerts dashboard with instant "Generate PO" shortcuts for under-stocked materials.
* **Factory Reports & Inventory Valuation (`reports.ts`)**:
  * High-level summaries of total RM stock (KG), PM stock (Units), FG inventory, and lifetime dispatch volume.
  * **Finished Goods Inventory Aging**: Computes product age in days from manufacturing and days remaining until expiration.

### 🛡️ 5. Role-Based Access Control (RBAC) & Security
* **Discord-Style Roles & Permissions**: Modular permission toggle matrix across modules (`inventory`, `operations`, `reports`, `admin`) with custom role color tags.
* **Staff User Provisioning**: Add staff accounts with hashed credentials and role assignments.
* **Authentication**: PBKDF2/Argon2 cryptographic password hashing and HTTP-only session cookie management.

### 🛡️ 6. Data Integrity & Usability Safeguards
* **Universal Non-Negative Input Enforcement**: All numeric fields enforce `min="0"` with runtime keystroke guards blocking negative values.
* **Changeable Unit Dropdowns**: Pre-populates unit from master catalog with changeable dropdown options (`KG`, `Units`, `Boxes`, etc.).
* **Integrated Inline Unit Badges**: Quantity inputs feature inline unit badges to prevent visual clipping on mobile viewports.
* **Streamlined Entry Forms**: Operational dialogs are kept clean and focused; free-text *Remarks* fields are removed from entry modals and written as `null`.
* **Multi-Device Responsive Dark UI**: Tailored for desktop monitors, tablet workstations, and mobile devices with bottom navigation (`MobileNav`), slide-out drawer, and horizontal-scroll data tables.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React
* **Backend**: Next.js Server Actions (`@/actions/*`)
* **Database & ORM**: Prisma ORM v7 with `@prisma/adapter-pg` driver adapter
* **Database Engine**: PostgreSQL on **Neon** (Serverless Postgres)
* **Hosting**: Render (Web Service) + Neon (Database)
* **Language**: TypeScript 5 (Strict Mode)

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
```
The application validates `DATABASE_URL` at startup. TLS is automatically enabled for non-`localhost` hosts.

### 3. Database Sync & Seeding
```bash
# Push schema to the PostgreSQL database
npx prisma db push

# Generate Prisma Client (also runs automatically on postinstall)
npx prisma generate

# Seed lookups, sample materials, and initial admin credentials
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Directory Structure

```
├── docs/                               # Architecture & System Documentation
│   ├── 01_PROJECT_SUMMARY.md           # Project context, business goals & modules
│   ├── 02_TECH_STACK.md                # Technology matrix, data flows & drivers
│   ├── 03_SYSTEM_ARCHITECTURE_AND_DESIGN.md # UI/UX design, stock models & workflows
│   ├── 04_DATABASE_SCHEMA_AND_MODELS.md # Prisma schema, models & data dictionaries
│   └── 05_DEVELOPMENT_ROADMAP.md       # Milestones, completed phases & active items
├── prisma/
│   ├── schema.prisma                   # Prisma 7 PostgreSQL Database Schema
│   └── seed.ts                         # Database seed script
├── src/
│   ├── actions/                        # Next.js Server Actions
│   │   ├── inventory.ts                # RM & PM CRUD, inward logging, catalog archiving
│   │   ├── operations.ts               # Pipelines (RM issue, production, PM issue, dispatch)
│   │   ├── raw-materials.ts            # Raw Material action proxies
│   │   ├── finished-goods.ts           # Finished Goods & dispatch action proxies
│   │   ├── packaging.ts                # Packaging material action proxies
│   │   ├── movements.ts                # Operations action proxies
│   │   ├── auth.ts                     # Authentication & session actions
│   │   ├── roles.ts                    # Role action proxies
│   │   ├── rbac.ts                     # Roles, permissions & user provisioning
│   │   ├── lookups.ts                  # SystemLookup & StorageLocation queries
│   │   ├── reports.ts                  # Inventory valuation & FG aging reports
│   │   ├── po-suggestions.ts           # Purchase order suggestion engine
│   │   └── csv-import.ts               # Bulk CSV data importer
│   ├── app/
│   │   ├── globals.css                 # Tailwind CSS v4 styling & scrollbars
│   │   ├── layout.tsx                  # Root HTML layout
│   │   └── page.tsx                    # Main 14-tab MES dashboard & operations UI
│   ├── components/
│   │   ├── MasterCatalogPanel.tsx      # 2-level RM/PM/FG master catalog management
│   │   ├── Sidebar.tsx                 # Desktop persistent navigation sidebar
│   │   ├── Topbar.tsx                  # Desktop/tablet topbar with user status & alerts
│   │   ├── MobileNav.tsx               # Mobile bottom navigation bar & slide-out drawer
│   │   ├── LoginModal.tsx              # User sign-in modal
│   │   ├── Admin/
│   │   │   ├── RoleManagerModal.tsx    # Permission matrix editor & role builder
│   │   │   └── UserManagerModal.tsx    # Staff user account provisioning
│   │   └── Modals/                     # Operational & Catalog Modal Dialogs
│   │       ├── AddRawMaterialModal.tsx # RM master SKU registration
│   │       ├── InwardRawMaterialModal.tsx # RM physical arrival batch logging
│   │       ├── AddPackagingModal.tsx   # PM master item registration
│   │       ├── InwardPackagingModal.tsx # PM physical inward logging
│   │       ├── AddFinishedGoodModal.tsx # FG SKU master registration
│   │       ├── InwardFinishedGoodModal.tsx # FG batch production/inward logging
│   │       ├── EditMaterialModal.tsx   # Unified RM/PM/FG catalog edit modal
│   │       ├── IssueModal.tsx          # RM issue to production
│   │       ├── ProductionModal.tsx     # Production run logging & auto-FG addition
│   │       ├── PackagingIssueModal.tsx # Packaging supply issue to production
│   │       ├── DispatchModal.tsx       # Sales dispatch & auto-FG stock deduction
│   │       ├── GRNModal.tsx            # Goods Receipt Note posting
│   │       └── AddLookupModal.tsx      # System lookup values & units
│   └── lib/
│       ├── prisma.ts                   # PrismaClient singleton with @prisma/adapter-pg
│       ├── inventory-utils.ts          # Material-level stock aggregation & status rules
│       └── auth-utils.ts               # PBKDF2/Argon2 password hashing & verification
```
