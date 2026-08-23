# 01. Project Summary & Context — EFCPL Inventory & MES App

## 1. Project Background
**EFCPL (Exotic Food Processing Private Limited)** is a food manufacturing and processing company based in Pune, Maharashtra, India. The company processes and handles perishable agricultural commodities, fruits, syrups, packaging supplies, cold-chain storage operations, and finished packaged retail/B2B food products.

This system provides a high-performance, real-time **Manufacturing Execution System (MES) & Inventory Management Platform** designed for factory floor staff, store managers, production supervisors, and management across desktop workstations, tablets, and mobile devices.

---

## 2. Core Business Goals & System Structure

The application is architected into 4 primary pillars:

### 📦 I. Inventory Section
1. **Raw Materials (RM)**:
   - **Master Registration ≠ Stock**: *+ Add Raw Material* registers a catalog SKU only (zero stock, no batch). Stock exists solely because an arrival was logged.
   - **Discrete Batch Logging**: Incoming raw material arrivals are logged as independent batch records rather than merging with existing stock.
   - **Material-Level Totals**: A material's real quantity is the sum of every arrival sharing its code; low-stock status is resolved against that total, never against a single batch.
   - **Chronological Sorting**: Entries are ordered reverse-chronologically by entry time (`createdAt: desc`), keeping the latest shipments at the top of the table.
   - **Fields Tracked**: Code, Material Name, Brand Name, Batch No, Current Stock, Unit (`KG`, `Units`, `Boxes`, `GM`, `LTR`, `ML`, `BAGS`), Reorder Level, Max Stock, Supplier, Storage Location, Expiry Date, Entry Date, Status (`Active` / `Low Stock`), Actions.
2. **Packaged Materials (PM)**:
   - Tracks packaging stock (Jars, Bottles, Cartons, Pouches, Caps, Labels).
   - Fields: Code, Material Name, Brand, Batch Number, Stock, Unit, Reorder Level, Max Stock, Supplier, Location, Expiry, Status, Actions.

### ⚙️ II. Operations Pipeline (5 Dedicated Tabs)
1. **RM Issue**:
   - Issue raw commodities directly to production batches.
   - Select from active raw material batches with real-time stock balances.
   - Dynamic **"Issue For"** target Finished Goods (FG) selector linked to active FG products.
2. **Production Log**:
   - Record manufacturing runs (Linked FG Code & Name, Total Batches Made, Total Output, Wastage, MFG Date, Expiry Date, Operator).
3. **Packaging Issue**:
   - Issue packaging supplies (Jars, Cartons, Caps) against target FG production runs.
4. **Finished Goods (FG)**:
   - Master catalog and cold room inventory for manufactured food items.
   - **Auto-Calculated Shelf Life**: Automatically computes shelf life in days from $(\text{Expiry Date} - \text{MFG Date})$.
5. **Dispatch Log**:
   - Customer and distributor shipments (Buyer Name, SKU Code, Product Name, Batch Code, Positive Dispatch Qty, Dispatch Date, Location, CoA Status).

### ➕ III. Master Entry Hub (Add Materials / Products)
Centralized modal creation hub for catalog definitions:
- `+ Add Raw Material` — registers a master SKU **only**; creates no stock and no batch. Duplicate master codes are rejected.
- `+ Add Packaging Material` (Master Catalog SKU — PM uses one aggregated row per code)
- `+ Add Finished Good SKU` (Master Catalog SKU)
- `+ Post GRN Receipt` (Goods Receipt Note)
- `+ Add Lookup Value` (units, storage locations, CoA statuses, brands via `SystemLookup`)

### 🛡️ IV. Role-Based Access Control (RBAC) & Security
- **Granular Permissions ("Add Roles")**: Discord-style permission toggle matrix across modules (`inventory`, `operations`, `reports`, `admin`).
- **Staff User Provisioning ("Add User")**: Create unique login credentials with assigned roles.
- **Audit Trails**: `AuditLog` model in place (user, action, entity, JSON details, timestamp). Write paths are **not yet instrumented** — scheduled for Phase 8.

---

## 3. Key User Experience & Quality Safeguards
- **Universal Non-Negative Input Enforcement**: All numeric fields (quantities, stock levels, reorder thresholds, batch counts) enforce `min="0"` with runtime guards blocking negative entries or scrolling into negative values.
- **Dynamic Changeable Unit Dropdowns**: Unit fields auto-populate from material records while remaining editable via dropdown options (`KG`, `Units`, `Boxes`).
- **Role-Appropriate Form Fields**: Clean operational dialogs streamlined for factory floor operators — the free-text **Remarks** field has been removed from *every* entry modal (RM/PM inward, RM issue, packaging issue, production, dispatch, GRN, master creation).
- **Responsive Dark Theme UI**: Tailored for factory lighting conditions with full mobile and tablet touch optimizations, collapsible mobile navigation, and horizontal scroll tables.

---

## 4. Current Deployment Posture
- **Database**: PostgreSQL on **Neon** (serverless), accessed via Prisma 7 + `@prisma/adapter-pg`. The former local SQLite setup has been retired.
- **Hosting**: **Render** web service; `prisma generate` runs on `postinstall` so each deploy builds a fresh typed client.
- **Configuration**: Single `DATABASE_URL` env var; the Prisma client fails fast at construction if it is missing and enables TLS automatically for non-local hosts.
