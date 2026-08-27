# 01. Project Summary & Context — EFCPL Inventory & MES App

## 1. Project Background
**EFCPL (Exotic Food Processing Private Limited)** is a food manufacturing and processing company based in Pune, Maharashtra, India. The company processes and handles perishable agricultural commodities, fruits, syrups, packaging supplies, cold-chain storage operations, and finished packaged retail/B2B food products.

This system provides a high-performance, real-time **Manufacturing Execution System (MES) & Inventory Management Platform** designed for factory floor staff, store managers, production supervisors, and management across desktop workstations, tablets, and mobile devices.

---

## 2. Core Business Goals & System Structure

The application is architected into 5 primary pillars across 14 interactive panels:

### 📦 I. Inventory Section (Discrete Batch & Aggregation Model)
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
   - **Automatic Stock Addition**: Increases `FinishedGood` total stock and updates latest batch information upon recording.
3. **Packaging Issue**:
   - Issue packaging supplies (Jars, Cartons, Caps) against target FG production runs, atomically decrementing PM stock.
4. **Finished Goods (FG)**:
   - Master catalog and cold room inventory for manufactured food items.
   - **Auto-Calculated Shelf Life**: Automatically computes shelf life in days from $(\text{Expiry Date} - \text{MFG Date})$.
5. **Dispatch Log**:
   - Customer and distributor shipments (Buyer Name, SKU Code, Product Name, Batch Code, Positive Dispatch Qty, Dispatch Date, Location, CoA Status).
   - **Automatic Stock Deduction**: Atomically decrements `FinishedGood` stock upon dispatch confirmation.

### 📋 III. Master Catalog Hub & Safe Archiving Panel (`MasterCatalogPanel.tsx`)
Centralized interactive catalog management hub:
- **2-Level Navigation**:
  - **Level 1**: Top-level 3-card picker for Raw Materials (RM), Packaging Materials (PM), and Finished Goods (FG) with live item counters.
  - **Level 2**: Comprehensive catalog tables displaying codes/SKUs, names, units, reorder levels, max stock, current total stock, default suppliers, and storage locations.
- **Batch Deletion & Selection**: Checkbox multi-select mode to delete multiple catalog items in one click or delete single items with confirmation.
- **Safe Soft-Deletion / Archival (`isArchived`)**: Deleting an item marks it as `isArchived: true` and `status: 'Archived'`, preserving full historical integrity (past RM issues, packaging issues, production logs, dispatches) while hiding it from active lists and blocking new operations on deleted SKUs.
- **Inline Master Editing (`EditMaterialModal.tsx`)**: Edit material-level settings (name, brand, unit, reorder level, max stock, default supplier/location) and synchronize recomputed status across all batches.

### 📊 IV. Factory Intelligence, PO Suggestions & Reports
- **PO Suggestions Engine (`po-suggestions.ts`)**: Automatically calculates replenishment quantities for materials at or below reorder levels (`Math.max(0, maxStock - stock)` or `reorderLevel * 3`).
- **Real-Time Alerts Dashboard**: Centralized factory warnings with instant "Generate PO" action triggers.
- **Factory Reports & FG Aging (`reports.ts`)**: Summarizes total factory stock volume, lifetime dispatches, and computes Finished Goods batch aging with days remaining until expiration.

### 🛡️ V. Role-Based Access Control (RBAC) & Security
- **Granular Permissions ("Discord-Style Roles")**: Modular permission toggle matrix across modules (`inventory`, `operations`, `reports`, `admin`) with custom role color tags.
- **Staff User Provisioning ("Add User")**: Create unique login credentials with assigned roles.
- **Authentication**: PBKDF2/Argon2 password hashing and HTTP-only session cookie management.

---

## 3. Key User Experience & Quality Safeguards
- **Universal Non-Negative Input Enforcement**: All numeric fields enforce `min="0"` with runtime guards blocking negative entries.
- **Dynamic Changeable Unit Dropdowns**: Unit fields auto-populate from material records while remaining editable via dropdown options (`KG`, `Units`, `Boxes`).
- **Role-Appropriate Form Fields**: Clean operational dialogs streamlined for factory floor operators — free-text **Remarks** fields have been removed from entry modals and persist as `null`.
- **Responsive Dark Theme UI**: Tailored for factory lighting conditions with full mobile and tablet touch optimizations, fixed bottom navigation bar (`MobileNav`), slide-out drawer, and horizontal-scroll data tables.

---

## 4. Current Deployment Posture
- **Database**: PostgreSQL on **Neon** (serverless), accessed via Prisma 7 + `@prisma/adapter-pg`. The former local SQLite setup has been retired.
- **Hosting**: **Render** web service; `prisma generate` runs on `postinstall` so each deploy builds a fresh typed client.
- **Configuration**: Single `DATABASE_URL` env var; the Prisma client fails fast at construction if it is missing and enables TLS automatically for non-local hosts.

