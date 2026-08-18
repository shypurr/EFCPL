# 01. Project Summary & Context — EFCPL Inventory & MES App

## 1. Project Background
**EFCPL (Exotic Food Processing Private Limited)** is a food manufacturing and processing company based out of Pune, Maharashtra, India. The company handles perishable and non-perishable raw agricultural inputs, finished packaged food goods, packaging supplies, and cold-chain storage operations.

This system transforms manual inventory tracking into a **modern, multi-device, production-grade cloud application (PWA)** for mobile, tablet, and desktop workstations.

---

## 2. Core Business Goals & Updated System Structure

The portal is structured into 4 main pillars:

### 📦 I. Inventory Section
1. **Raw Materials (RM)**: Master stock table showing Code, Material Name, Brand Name, Batch Number, Stock Qty, Unit, Reorder Level, Max Stock, Supplier, Location, Expiry, Status, Actions (`Edit`, `Delete`).
2. **Packaged Materials (PM)**: Mirrors RM structure (Code, Name, Brand, Batch Number, Stock, Unit, Reorder Level, Max Stock, Supplier, Location, Expiry, Status, Actions).

### ⚙️ II. Operations Section (5 Standalone Tabs)
1. **RM Issue**: Issuing Raw Materials to production (Linked Code & Material Name, Target FG, Expiry, Available Batch Qty, Issued Stock).
2. **Production**: Recording FG production runs (Linked FG Code & Name, Total Batches Made, Total Output, Wastage; Entry form captures MFG, Expiry, Remarks).
3. **Packaging Issue**: Issuing Packaging Materials to production (Linked PM Code & Name, Target FG, Available Batch Qty, Issued Qty).
4. **Finished Goods (FG)**: Finished Goods stock & batch tracking (SKU, Name, Batch Number, Quantity Produced, Total Stock, Unit, MFG, Expiry, **Auto-Calculated Shelf Life**, Location).
5. **Dispatch**: Customer Dispatches (SKU Code, Product Name, Batch Code, Dispatch Quantity, Dispatch Date, Party Name, MFG, EXP, Location, COA Status).

### ➕ III. Add Materials / Master Entry Section
Centralized creation hub placed below Inventory & Operations to log new entries for:
`RM`, `PM`, `RMSU`, `Production`, `Packaging Issue`, `Finished Goods`, `Dispatch`.

### 🛡️ IV. Admin & Security Section (Discord-Style RBAC)
- **Roles & Permissions ("Add Roles")**: Discord-style granular permission toggles for each role.
- **Staff User Provisioning ("Add User")**: Admin creates unique Username and Password credentials for each staff member and assigns them to specific roles.

---

## 3. Architectural Principles
- **Backend-First Validation**: Database Schema, Prisma v7 ORM, Zod schemas, and Server Actions provide clean data contracts.
- **Strict Type Safety**: End-to-end TypeScript (`Prisma Schema` $\rightarrow$ `Server Actions` $\rightarrow$ `React Components`).
- **CSV Data Import**: Pre-seeding database with existing live factory CSV datasets.
- **Auditability**: Complete audit logs tracking `who`, `when`, `what`, and `why` for all inventory mutations.
