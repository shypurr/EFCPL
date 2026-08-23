# EFCPL Manufacturing Execution System (MES) & Inventory Management Platform

> **Exotic Food Processing Private Limited (EFCPL)** — Food Processing, Cold-Chain Inventory & Operations Pipeline.

A modern, production-grade web application built with **Next.js 16 (App Router)**, **React 19**, **Prisma ORM v7**, **Tailwind CSS v4**, and **TypeScript**.

---

## 🌟 Key Features

### 📦 1. Inventory Management
* **Raw Materials (RM)**:
  * **Catalog vs. Stock**: *+ Add Raw Material* registers a master SKU only (zero stock, no batch). Stock appears only when an arrival is logged.
  * **Discrete Batch Logging**: Every incoming shipment creates a separate batch entry rather than merging stock.
  * **Material-Level Totals**: A material's quantity is the sum of all its arrival batches; low-stock status is resolved against that total, not a single batch.
  * **Chronological Sorting**: Reverse-chronological table display (`latest entries on top`) with arrival timestamps.
  * **Status Monitoring**: Dynamic low-stock and near-expiry indicators.
* **Packaged Materials (PM)**:
  * Master tracking for glass jars, bottles, caps, pouches, cartons, and packaging supplies.

### ⚙️ 2. Operations Pipelines (5 Standalone Workflows)
1. **RM Issue**: Deduct raw agricultural commodities to production batches with dynamic Target FG selector.
2. **Production Log**: Track manufactured food runs with batch counts, total output, wastage, and operator records.
3. **Packaging Issue**: Issue packaging supplies linked directly to production runs.
4. **Finished Goods (FG)**: Cold storage inventory tracking with **auto-calculated shelf life** ($\text{Expiry} - \text{MFG}$).
5. **Dispatch Log**: Customer/distributor shipments with positive quantities, batch codes, and Certificate of Analysis (CoA) status.

### 🛡️ 3. Role-Based Access Control (RBAC) & Security
* Discord-style permission toggle matrix across modules (`inventory`, `operations`, `reports`, `admin`).
* Staff user provisioning with hashed credentials.
* Mutation audit logging.

### 🛡️ 4. Data Integrity & Usability Safeguards
* **Universal Non-Negative Input Enforcement**: All number inputs locked to $\ge 0$ with `min="0"` and keystroke guards.
* **Changeable Unit Dropdown**: Pre-populates unit from catalog with changeable dropdown (`KG`, `Units`, `Boxes`).
* **Streamlined Entry Forms**: Free-text *Remarks* removed from every entry modal — schema columns retained but written as `null`.
* **Multi-Device Responsive Dark UI**: Optimized for desktop monitors, tablet workstations, and mobile devices with collapsible navigation and touch-optimized controls.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 16, React 19, Tailwind CSS v4, Lucide React
* **Backend**: Next.js Server Actions (`@/actions/*`)
* **Database & ORM**: Prisma ORM v7 with `@prisma/adapter-pg` → **PostgreSQL (Neon)**
* **Hosting**: Render (web service) + Neon (database)
* **Language**: TypeScript 5 (Strict Mode)

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment
Copy `.env.example` to `.env` and set your Neon (or local Postgres) connection string:
```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```
The app throws on startup if `DATABASE_URL` is missing. TLS is enabled automatically for any non-`localhost` host.

### 3. Database Sync
```bash
# Push schema to the PostgreSQL database
npx prisma db push

# Generate Prisma Client (also runs automatically on postinstall)
npx prisma generate

# Seed lookups, sample materials and admin credentials
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
├── docs/                       # Comprehensive Architecture & System Docs
│   ├── 01_PROJECT_SUMMARY.md
│   ├── 02_TECH_STACK.md
│   ├── 03_SYSTEM_ARCHITECTURE_AND_DESIGN.md
│   ├── 04_DATABASE_SCHEMA_AND_MODELS.md
│   └── 05_DEVELOPMENT_ROADMAP.md
├── prisma/
│   ├── schema.prisma           # Prisma 7 Database Schema
│   └── seed.ts                 # Database seed script
├── src/
│   ├── actions/                # Next.js Server Actions
│   │   ├── inventory.ts        # RM & PM CRUD, master registration + inward logging
│   │   ├── operations.ts       # Pipeline operations (RM issue, PM issue, etc.)
│   │   ├── raw-materials.ts    # Raw Material action proxies
│   │   ├── finished-goods.ts   # Finished Goods and Dispatches
│   │   ├── packaging.ts        # Packaging materials actions
│   │   ├── movements.ts        # GRN posting actions
│   │   ├── auth.ts             # Authentication & session actions
│   │   ├── roles.ts            # Role action proxies
│   │   ├── rbac.ts             # Roles, permissions & user provisioning
│   │   ├── lookups.ts          # SystemLookup / StorageLocation config
│   │   ├── reports.ts          # Inventory reporting & valuation
│   │   ├── po-suggestions.ts   # Auto-reorder engine
│   │   └── csv-import.ts       # Bulk CSV data importer
│   ├── app/
│   │   ├── globals.css         # Tailwind CSS styling & custom scrollbars
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Main tabbed MES dashboard & tables
│   ├── components/
│   │   ├── Modals/             # Action & Creation Dialogs
│   │   │   ├── AddRawMaterialModal.tsx      # RM master SKU registration
│   │   │   ├── InwardRawMaterialModal.tsx   # RM arrival batch logging
│   │   │   ├── IssueModal.tsx               # RM issue to production
│   │   │   ├── ProductionModal.tsx
│   │   │   ├── PackagingIssueModal.tsx
│   │   │   ├── AddPackagingModal.tsx
│   │   │   ├── InwardPackagingModal.tsx
│   │   │   ├── AddFinishedGoodModal.tsx
│   │   │   ├── InwardFinishedGoodModal.tsx
│   │   │   ├── DispatchModal.tsx
│   │   │   ├── GRNModal.tsx
│   │   │   └── AddLookupModal.tsx           # Units / locations / lookup values
│   │   ├── Admin/
│   │   │   ├── RoleManagerModal.tsx         # Permission matrix editor
│   │   │   └── UserManagerModal.tsx         # Staff provisioning
│   │   ├── LoginModal.tsx      # Credential sign-in dialog
│   │   ├── Sidebar.tsx         # Desktop navigation
│   │   ├── MobileNav.tsx       # Responsive mobile bottom navigation
│   │   └── Topbar.tsx          # Responsive search, filter & user topbar
│   └── lib/
│       ├── prisma.ts           # PrismaClient with the pg (PostgreSQL) adapter
│       ├── inventory-utils.ts  # Material-level stock totals & status rules
│       └── auth-utils.ts       # Password hashing & verification
```
