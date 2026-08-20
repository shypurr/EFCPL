# 01. Project Summary & Context — EFCPL Inventory & MES App

## 1. Project Background
**EFCPL (Exotic Food Processing Private Limited)** is a food manufacturing and processing company based in Pune, Maharashtra, India. The company processes and handles perishable agricultural commodities, fruits, syrups, packaging supplies, cold-chain storage operations, and finished packaged retail/B2B food products.

This system provides a high-performance, real-time **Manufacturing Execution System (MES) & Inventory Management Platform** designed for factory floor staff, store managers, production supervisors, and management across desktop workstations, tablets, and mobile devices.

---

## 2. Core Business Goals & System Structure

The application is architected into 4 primary pillars:

### 📦 I. Inventory Section
1. **Raw Materials (RM)**:
   - **Discrete Batch Logging**: Incoming raw material arrivals are logged as independent batch records rather than merging with existing stock.
   - **Chronological Sorting**: Entries are ordered reverse-chronologically by entry time (`createdAt: desc`), keeping the latest shipments at the top of the table.
   - **Fields Tracked**: Code, Material Name, Brand Name, Batch No, Current Stock, Unit (`KG`, `Units`, `Boxes`), Reorder Level, Max Stock, Supplier, Storage Location, Expiry Date, Entry Date, Status (`Active` / `Low Stock`), Actions.
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
- `+ Add Raw Material` (Master Catalog SKU)
- `+ Add Packaging Material` (Master Catalog SKU)
- `+ Add Finished Good SKU` (Master Catalog SKU)
- `+ Post GRN Receipt` (Goods Receipt Note)

### 🛡️ IV. Role-Based Access Control (RBAC) & Security
- **Granular Permissions ("Add Roles")**: Discord-style permission toggle matrix across modules (`inventory`, `operations`, `reports`, `admin`).
- **Staff User Provisioning ("Add User")**: Create unique login credentials with assigned roles.
- **Audit Trails**: Complete mutation logging for stock transactions.

---

## 3. Key User Experience & Quality Safeguards
- **Universal Non-Negative Input Enforcement**: All numeric fields (quantities, stock levels, reorder thresholds, batch counts) enforce `min="0"` with runtime guards blocking negative entries or scrolling into negative values.
- **Dynamic Changeable Unit Dropdowns**: Unit fields auto-populate from material records while remaining editable via dropdown options (`KG`, `Units`, `Boxes`).
- **Role-Appropriate Form Fields**: Clean operational dialogs streamlined for factory floor operators (e.g., removal of non-essential remarks in standard arrival logs).
- **Responsive Dark Theme UI**: Tailored for factory lighting conditions with full mobile and tablet touch optimizations, collapsible mobile navigation, and horizontal scroll tables.
