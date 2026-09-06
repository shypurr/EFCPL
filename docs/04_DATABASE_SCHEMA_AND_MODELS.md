# 04. Database Schema & Data Models — EFCPL MES & Inventory System

> **Engine**: PostgreSQL (Neon) — `datasource db { provider = "postgresql" }` in [`prisma/schema.prisma`](../prisma/schema.prisma).
> **Generator**: `prisma-client-js`. **14 models**, no enums, no migrations directory (schema is applied with `prisma db push`).

## 1. Relational Schema Architecture

Only three foreign keys exist in the whole schema outside the RBAC block. Inventory and operations are joined **by string value** (`code` / `sku`), which is what makes soft-deletion safe: archiving a catalog row cannot orphan a log row.

```
+-------------------+      +--------------------+      +-----------------------+
|    RawMaterial    |      | PackagingMaterial  |      |     FinishedGood      |
+-------------------+      +--------------------+      +-----------------------+
| id (PK, cuid)     |      | id (PK, cuid)      |      | id (PK, cuid)         |
| code (Indexed)    |      | code (Unique)      |      | sku (Unique, Indexed) |
| name (Indexed)    |      | name (Indexed)     |      | name                  |
| brand             |      | brand              |      | batchNumber (Indexed) |
| batchNumber       |      | batchNumber        |      | quantityProduced      |
| stock (PER BATCH) |      | stock (per SKU)    |      | totalStock            |
| unit              |      | unit ("Units")     |      | unit ("KG")           |
| reorderLevel      |      | reorderLevel       |      | mfgDate               |
| maxStock?         |      | maxStock?          |      | expiryDate            |
| supplier?         |      | supplier?          |      | shelfLifeDays (calc)  |
| location?         |      | location?          |      | location?             |
| expiryDate?       |      | expiryDate?        |      | status ("In Stock")   |
| status ("Active") |      | status ("Active")  |      | isArchived (Indexed)  |
| isMaster (bool)   |      | isArchived (Idx)   |      | createdAt / updatedAt |
| isArchived (Idx)  |      | attributes? / rmks?|      +-----------+-----------+
| attributes? /rmks?|      | createdAt/updatedAt|                  |
| createdAt (Idx)   |      +---------+----------+                  | sku <- skuCode
| updatedAt         |                |                            |  (FK, SetNull)
+-------------------+                | code <- pmCode             |
          | rmCode (string, no FK)   |  (FK, SetNull)             |
          v                          v                            v
+-------------------+       +--------------------+     +-----------------------+
|      RMIssue      |       |   PackagingIssue   |     |       Dispatch        |
+-------------------+       +--------------------+     +-----------------------+
| id (PK)           |       | id (PK)            |     | id (PK)               |
| rmCode? (Indexed) |       | pmCode? (Indexed)  |     | skuCode? (Indexed)    |
| materialName      |       | pmName             |     | productName           |
| batchNumber       |       | issueFor (Target)  |     | batchCode             |
| issueFor (Target) |       | quantityInBatch    |     | dispatchQty           |
| expiryDate?       |       | issuedQty          |     | dispatchDate (Indexed)|
| quantityInBatch   |       | issuedDate (Idx)   |     | partyName             |
| issuedStock       |       | issuedBy / remarks?|     | mfgDate / expiryDate  |
| issuedDate (Idx)  |       | createdAt          |     | location? / coaStatus |
| issuedBy /remarks?|       +--------------------+     | dispatchedBy /remarks?|
| createdAt         |                                  | createdAt             |
+-------------------+                                  +-----------------------+

+--------------------+      +--------------------+
|    SystemLookup    |      |  StorageLocation   |   (Configuration tables —
+--------------------+      +--------------------+    no FK relations, and
| id (PK)            |      | id (PK)            |    currently unread by the
| group (Indexed)    |      | name (Unique)      |    application: dropdown
| code               |      | zone               |    values are hardcoded)
| label              |      | tempSpec?          |
| sortOrder/isActive |      | description?       |
| metadata? (Json)   |      | isActive           |
| @@unique(group,code)|     | createdAt/updatedAt|
+--------------------+      +--------------------+

RBAC block (the only cascade relations):

  Permission --< RolePermission >-- Role --< User --< AuditLog
                 (Cascade both)      ^        |
                                     |        +-- roleId (SetNull)
                                     +-- @@unique(roleId, permissionId)
```

> **Note on `remarks`**: the column is retained on `RawMaterial`, `PackagingMaterial`, `RMIssue`, `ProductionLog`, `PackagingIssue` and `Dispatch`, but no entry modal collects it any more. All write paths persist `remarks: null`.

> **Note on `ProductionLog`**: it has no FK to `FinishedGood` at all — the link is the `fgCode` string, matched against `FinishedGood.sku` inside `createProductionLog`.

---

## 2. Model Definitions

### A. Inventory Section

#### 1. `RawMaterial`
One table, **two kinds of row**, distinguished by the `isMaster` flag, with soft-deletion via `isArchived`:

| Row kind | `isMaster` | Created by | Meaning |
| :--- | :--- | :--- | :--- |
| **Master SKU** | `true` | `createRawMaterial` (*+ Add Raw Material*) | Catalog definition only. `stock: 0`, `batchNumber: ''`, `expiryDate: null`. Never shown in the RM inventory table. |
| **Arrival batch** | `false` | `inwardRawMaterial` (*Log Inward / Arrived RM*) | A physical shipment that actually arrived. One row per arrival; rows are never merged. |

Fields:
- `id` — `cuid`.
- `code` — catalog code (`RM001`, …). **Not unique**: one code owns one master row plus many arrival rows. Indexed.
- `name` — material description. Indexed.
- `brand` — brand / origin (nullable).
- `batchNumber` — vendor or internal lot number. Defaults to `""`; empty on master rows.
- `stock` — quantity of **this single batch**, never the material total. See §3.
- `unit` — `KG`, `Units`, `Boxes`, `GM`, `LTR`, `ML`, `BAGS`. No DB default; the actions default to `KG`.
- `reorderLevel` (default `0`) & `maxStock` (nullable) — material-level settings, copied onto each arrival row from the master template.
- `supplier`, `location` — vendor and warehouse location. Master-row values act as defaults for future arrivals; the actions fall back to `'RM Store A'`.
- `expiryDate` — lot expiry (nullable).
- `status` — `Active` / `Low Stock` / `Archived`, written identically to every row of a code by `syncRawMaterialStatusByCode`.
- `isMaster` (default `false`) — catalog-definition marker.
- `isArchived` (default `false`) — soft-delete marker. Indexed.
- `attributes` — optional `Json` bag. Never written by any action today.
- `remarks` — retained, always `null`.
- `createdAt` (indexed, drives the default `desc` sort) / `updatedAt`.

Indexes: `code`, `name`, `createdAt`, `isArchived`.

#### 2. `PackagingMaterial`
Master packaging inventory (bottles, cartons, caps, pouches, labels) — **one row per SKU**, not a batch model.
- Fields: `id`, `code` (**unique**), `name`, `brand?`, `batchNumber`, `stock`, `unit` (default `"Units"`), `reorderLevel`, `maxStock?`, `supplier?`, `location?`, `expiryDate?`, `status`, `isArchived`, `attributes?`, `remarks?`, `createdAt`, `updatedAt`.
- Relation: `pmIssues PackagingIssue[]`.
- `inwardPackagingMaterial` **increments** `stock` on the existing row and overwrites `batchNumber` / `supplier` / `location` / `expiryDate`, so there is no PM arrival history.
- `createPackagingMaterial` generates a batch number (`PB-<last 4 of Date.now()>`) when none is supplied, and defaults `location` to `'PM Warehouse'`.
- **Soft delete**: `archivePackagingMaterial(id)` sets `isArchived: true, status: 'Archived'`, preserving past `PackagingIssue` rows via the `SetNull` FK.
- Indexes: `code`, `name`, `isArchived`.

---

### B. Operations Section (5 Pipelines)

#### 1. `RMIssue`
Raw material deductions issued to production:
- `rmCode?` (indexed), `materialName`, `batchNumber` — the source lot. **No FK** — the string survives archival.
- `issueFor` — target Finished Good, picked from the live FG list.
- `quantityInBatch` — the source row's `stock` **before** the deduction (snapshot).
- `issuedStock` — quantity deducted, strictly positive.
- `expiryDate?` — copied from the source batch for traceability.
- `issuedDate` (indexed, default `now()`), `issuedBy` (default `"Store Manager"`), `remarks?` (always `null`), `createdAt`.

#### 2. `ProductionLog`
Completed production cycles:
- `fgCode` (indexed), `fgName` — the manufactured product; `fgCode` is matched against `FinishedGood.sku` at write time.
- `totalBatchesMade` (`Int`), `totalOutput` (`Float`) — output automatically increments FG stock.
- `unit` (default `"KG"`), `wastage` (default `0`).
- `mfgDate`, `expiryDate` — required; drive the recomputed `shelfLifeDays` on the FG row.
- `operator` (default `"Supervisor"` in the schema; the action writes `"Production Supervisor"` when none is supplied), `remarks?` (always `null`), `createdAt` (indexed).
- If the target SKU does not exist, `createProductionLog` **creates** the `FinishedGood` (batch number defaults to `BATCH-FG-<last 4 of Date.now()>`, location to `'Cold Store Zone A'`). If it exists and is archived, the transaction throws and the production log is rolled back.

#### 3. `PackagingIssue`
Packaging materials issued to packing lines:
- `pmCode?` → `PackagingMaterial.code` (**FK**, `onDelete: SetNull`), `pmName`, `issueFor`, `quantityInBatch` (pre-deduction snapshot), `issuedQty`, `issuedDate` (indexed), `issuedBy` (default `"Store Manager"`), `remarks?` (always `null`), `createdAt`.

#### 4. `FinishedGood`
Finished product inventory in cold rooms and warehouses:
- `sku` (**unique**, indexed), `name`, `batchNumber` (indexed), `quantityProduced`, `totalStock`, `unit` (default `"KG"`), `mfgDate`, `expiryDate`.
- `shelfLifeDays` — `Math.ceil((expiryDate − mfgDate) / 86400000)`, floored at `0`. Recomputed on create, inward, production and any date-changing update.
- `location?`, `status` (default `"In Stock"`; `Out of Stock` when a dispatch zeroes the balance; `Archived` when soft-deleted), `isArchived` (indexed), `createdAt` / `updatedAt`.
- Relation: `dispatches Dispatch[]`. Listed with `orderBy: { updatedAt: 'desc' }`.

#### 5. `Dispatch`
Customer shipments:
- `skuCode?` → `FinishedGood.sku` (**FK**, `onDelete: SetNull`), `productName`, `batchCode`, `dispatchQty` (strictly positive; deducts FG stock), `dispatchDate` (indexed, defaults to now), `partyName`, `mfgDate`, `expiryDate`, `location?`, `coaStatus` (default `"Approved"`; also `Pending`, `N/A`), `dispatchedBy` (default `"Dispatch Officer"`), `remarks?` (always `null`), `createdAt`.

---

### C. RBAC & Security Models
- **`Permission`** — `key` (unique, e.g. `inventory:rm:view`), `label`, `module`, `action`, `description?`. The seed writes 28 keys across modules `Inventory`, `Operations`, `Add Materials`, `Administration` and actions `view` / `create` / `edit` / `delete`.
- **`Role`** — `name` (unique), `colorTag` (default `#3B82F6`), `description?`, `isSystemAdmin` (blocks deletion when true), timestamps. Seeded: **System Admin** (all 28 permissions), **Store Manager**, **Production Supervisor**.
- **`RolePermission`** — junction, `@@unique([roleId, permissionId])`, both relations `onDelete: Cascade`.
- **`User`** — `username` (unique, lowercased on write), `name`, `passwordHash`, `roleId?` (`onDelete: SetNull`), `isActive`, timestamps. `passwordHash` is stripped from every action response.
- **`AuditLog`** — `userId` (`onDelete: Cascade`), `action`, `entity`, `entityId?`, `details? (Json)`, `timestamp` (indexed). ⚠️ **No code path writes to this table yet.**

---

### D. Configuration Models
- **`SystemLookup`** — key/label dictionary grouped by `group` (`UNIT`, `COA_STATUS`, `LOCATION`, `BRAND`), with `sortOrder`, `isActive`, and a `metadata` JSON bag. `@@unique([group, code])`, indexed on `group`. Served by [`src/actions/lookups.ts`](../src/actions/lookups.ts) and written by `AddLookupModal`. ⚠️ Neither has a live caller, and the seed does not populate this table — unit and location dropdowns are hardcoded arrays in the modals.
- **`StorageLocation`** — named warehouse/cold-room locations with `zone`, `tempSpec?`, `description?`, `isActive`, timestamps. ⚠️ Read by `getStorageLocations()`, which nothing calls; also unseeded.

---

## 3. The Raw Material Stock Model & Query Surface

`RawMaterial.stock` is a **batch quantity**, not a material quantity. Every read that answers "how much of `RM001` do we have?" aggregates across active rows via [`src/lib/inventory-utils.ts`](../src/lib/inventory-utils.ts):

| Helper | Responsibility |
| :--- | :--- |
| `sumStockByCode(rows)` | In-memory aggregation of `stock` per `code` — attaches `materialStock` to each row returned by `getRawMaterials`. |
| `resolveStockStatus(total, reorderLevel)` | Single source of truth for the low-stock rule: `total <= reorderLevel → 'Low Stock'`, else `'Active'`. |
| `getRawMaterialTotalStock(code)` | DB-side `aggregate({ _sum: { stock } })` for one code. Queries the full table so an active search filter cannot skew the total. **Currently has no caller.** |
| `syncRawMaterialStatusByCode(code)` | Recomputes the material total and writes the resulting `status` to **every** row of that code, using `Math.max()` of all rows' `reorderLevel`. Called by `inwardRawMaterial`, `updateRawMaterial`, `updateRawMaterialMasterByCode` and `deleteRawMaterial` — but **not** by `createRMIssue`. |

**Query surface** (`src/actions/inventory.ts`, proxied by `src/actions/raw-materials.ts`):

| Action | Row filter | Used by |
| :--- | :--- | :--- |
| `getRawMaterials(search, status)` | `isMaster: false, isArchived: false`, `createdAt desc` | RM inventory table (arrivals only); attaches `materialStock` + `isLowStock` |
| `getRawMaterialMasters(search)` | `isArchived: false`, deduplicated by `code` (master preferred); attaches `totalStock` + `batchCount` | RM code dropdowns & Master Catalog Panel |
| `getRawMaterialByCode(code)` | `orderBy: [{ isMaster: 'desc' }, { createdAt: 'desc' }]` — **no archived filter** | Single-material lookup, prefers the master definition |
| `archiveRawMaterialByCode(code)` | sets `isArchived: true, status: 'Archived'` on every non-archived row of the code | Master Catalog batch/single deletion |
| `updateRawMaterialMasterByCode(code, data)` | updates all non-archived rows; supplier/location on the master row only | Master Catalog inline editor |
| `deleteRawMaterial(id)` | **hard delete** of one row, then resyncs the code | RM inventory table row action |

> ⚠️ `po-suggestions.ts` and `reports.ts` bypass this surface entirely with unfiltered `prisma.rawMaterial.findMany()` calls, so they see master rows (`stock: 0`) and archived rows. See [03_SYSTEM_ARCHITECTURE_AND_DESIGN.md §5](03_SYSTEM_ARCHITECTURE_AND_DESIGN.md#5-known-drift-between-the-stock-model-and-its-consumers).

---

## 4. Seed Data ([`prisma/seed.ts`](../prisma/seed.ts))

`npx prisma db seed` is idempotent (upserts / existence checks) and writes:

| Entity | Rows |
| :--- | :--- |
| `Permission` | 28 keys — 8 Inventory, 16 Operations, 1 Add Materials, 3 Administration |
| `Role` | `System Admin` (`isSystemAdmin: true`, all permissions), `Store Manager`, `Production Supervisor` |
| `User` | `admin` / `admin123` (System Admin), `manager` / `manager123` (Store Manager) — **change these before deploying** |
| `RawMaterial` | Masters `RM001` (Refined Sugar Grade A, KG, reorder 1000) and `RM002` (Mango Pulp Puree, LTR, reorder 500), plus one arrival each (4 500 KG, 1 200 LTR) |
| `PackagingMaterial` | `PM001` — 500ml Glass Jar Bottles, 25 000 Units, reorder 5 000 |
| `FinishedGood` | `FGPRO001` — Premium Mango Jam 500g Jar, 1 800 Jars in stock |
| `SystemLookup`, `StorageLocation`, `AuditLog` | **none** |
