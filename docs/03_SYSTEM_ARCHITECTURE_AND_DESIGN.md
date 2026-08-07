# 03. System Architecture & Zero-Hardcoding Design

## 1. Zero-Hardcoding Architecture Philosophy
To ensure the system remains 100% extensible and flexible for client requirements without rewriting source code, the system adheres to strict **Data-Driven Architecture** principles:

```
+-----------------------------------------------------------------------------+
|                            CLIENT BROWSER / PWA                             |
| Dynamic Component Renderer (Forms, Tables, Badges, Tabs, Dynamic Navigation) |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
|                          SERVER ACTIONS & API LAYER                         |
| Dynamic Validation, Metadata Lookup Service, Rule Engine Evaluation          |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
|                     NEON POSTGRESQL DATABASE                                |
| Master Data Tables (Categories, Units, Zones, Tags, Status Rules) + JSONB   |
+-----------------------------------------------------------------------------+
```

### Core Rules for Zero-Hardcoding:
1. **No Static Enums in UI**: Dropdown selections (Units: *KG, LTR, MT, Cartons, Rolls*, Categories: *Raw Material, Packaging, Finished Goods*, CoA Statuses: *Approved, Pending, Rejected*, Storage Zones: *Cold Store 1, Zone A*) are fetched dynamically from database master tables (`SystemLookup` / `CategoryMaster`).
2. **Dynamic UI Attributes via `JSONB` Metadata**: Every SKU (Raw Material, Finished Good, Packaging) contains an `attributes` JSONB column. If a client wants to add a new property like `FSSAI License No`, `Moisture %`, or `Container Thickness`, it can be added via the UI settings without modifying database tables or code.
3. **Configurable Alert Thresholds**: Reorder warnings, near-expiry warning windows (e.g. 30 days vs 60 days vs 90 days), and CoA enforcement rules are stored in a `SystemSettings` table editable by Admins.
4. **Dynamic Navigation & Role Permissions**: Navigation panels and action buttons (e.g. *+ Add Material*, *Dispatch*, *Delete*) render dynamically based on user role permission maps loaded at runtime.

---

## 2. Dynamic Master Data Architecture

The system splits data into **Master Metadata Tables** and **Operational Transaction Tables**:

```
                             +------------------------+
                             |     SystemLookup       |
                             |  (Units, Zones, Tags)  |
                             +-----------+------------+
                                         |
                                         | Referenced by
                                         v
+-----------------------+     +----------+-----------+     +------------------------+
|     RawMaterial       |     |    FinishedGood      |     |   PackagingMaterial    |
| (SKU, Qty, JSONB Spec)|     | (SKU, Batch, Expiry) |     |  (Code, Type, Linked)  |
+-----------+-----------+     +----------+-----------+     +-----------+------------+
            |                            |                             |
            +----------------------------+-----------------------------+
                                         |
                                         v
                             +-----------+------------+
                             |   InventoryMovement    |
                             | (GRN / Issue / Dispatch)|
                             +------------------------+
```

---

## 3. Modular Component Design

### 3.1 Dynamic Form Builder
Instead of hand-coding inputs for every popup modal, modals utilize a configuration-driven Form Builder:
- Input types (`text`, `number`, `date`, `select`, `textarea`, `json_attributes`) are generated from metadata.
- Validation schemas (min, max, required, patterns) are validated via Zod on both client and server.

### 3.2 Dynamic Data Tables
Tables automatically support:
- Sorting by any column
- Search filtering across indexed fields
- Dynamic status badge rendering based on lookup rules
- Pagination and export capabilities (CSV / PDF / Excel)

### 3.3 Dynamic Alert & Rule Engine
The alert engine evaluates live stock against dynamic rules stored in `AlertRule`:
$$\text{Trigger Condition: } \text{Current Stock} \le \text{Reorder Level}$$
$$\text{Expiry Condition: } (\text{Expiry Date} - \text{Current Date}) \le \text{Configured Days Threshold}$$

---

## 4. API & Server Actions Architecture

All frontend components communicate with the backend using **Next.js Server Actions** (for form submissions and mutations) and **REST / SWR endpoints** (for data fetching and real-time updates).

### Server Actions Structure:
- `actions/materials.ts`: CRUD operations for Raw Materials with validation.
- `actions/finished-goods.ts`: Production batching, dispatches, and reservation tracking.
- `actions/movements.ts`: Transactional Goods Receipt Note (GRN) posting & Material Issue Slips (MIS).
- `actions/settings.ts`: Dynamic lookup management (Categories, Units, Zones, System Rules).
- `actions/reports.ts`: Dynamic valuation aggregation and aging analytics calculations.
