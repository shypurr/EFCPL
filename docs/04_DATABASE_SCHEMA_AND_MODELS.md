# 04. Database Schema & Data Models — EFCPL MES & Inventory System

> **Engine**: PostgreSQL (Neon) — `datasource db { provider = "postgresql" }` in `prisma/schema.prisma`.

## 1. Relational Schema Architecture

```
+-------------------+      +--------------------+      +-----------------------+
|    RawMaterial    |      | PackagingMaterial  |      |     FinishedGood      |
+-------------------+      +--------------------+      +-----------------------+
| id (PK, cuid)     |      | id (PK, cuid)      |      | id (PK, cuid)         |
| code (Indexed)    |      | code (Unique)      |      | sku (Unique)          |
| name              |      | name               |      | name                  |
| brand             |      | brand              |      | batchNumber           |
| batchNumber       |      | batchNumber        |      | quantityProduced      |
| stock (per batch) |      | stock (aggregated) |      | totalStock            |
| unit (KG/Units/Bx)|      | unit               |      | unit                  |
| reorderLevel      |      | reorderLevel       |      | mfgDate               |
| maxStock          |      | maxStock           |      | expiryDate            |
| supplier          |      | supplier           |      | shelfLifeDays (calc)  |
| location          |      | location           |      | location              |
| expiryDate        |      | expiryDate         |      | status                |
| status            |      | status             |      | isArchived (Boolean)  |
| isMaster (bool)   |      | isArchived (bool)  |      | createdAt / updatedAt |
| isArchived (bool) |      | attributes / rmks  |      +-----------------------+
| attributes / rmks |      | createdAt/updatedAt|                  |
| createdAt (desc)  |      +--------------------+                  |
| updatedAt         |                |                            |
+-------------------+                v                            v
          |                 +--------------------+     +-----------------------+
          |                 |   PackagingIssue   |     |       Dispatch        |
          v                 +--------------------+     +-----------------------+
+-------------------+       | id (PK)            |     | id (PK)               |
|      RMIssue      |       | pmCode (FK)        |     | skuCode (FK)          |
+-------------------+       | pmName             |     | productName           |
| id (PK)           |       | issueFor (Target)  |     | batchCode             |
| rmCode (Indexed)  |       | quantityInBatch    |     | dispatchQty           |
| materialName      |       | issuedQty          |     | dispatchDate          |
| batchNumber       |       | issuedDate         |     | partyName             |
| issueFor (Target) |       | issuedBy / remarks |     | mfgDate / expiryDate  |
| quantityInBatch   |       +--------------------+     | location / coaStatus  |
| issuedStock       |                                  | dispatchedBy / remarks|
| issuedDate        |                                  +-----------------------+
| issuedBy / remarks|
+-------------------+

+--------------------+      +--------------------+
|    SystemLookup    |      |  StorageLocation   |   (Configuration tables —
+--------------------+      +--------------------+    no FK relations; joined
| id (PK)            |      | id (PK)            |    by string value)
| group (UNIT/BRAND/ |      | name (Unique)      |
|  COA_STATUS/LOC.)  |      | zone               |
| code               |      | tempSpec           |
| label              |      | description        |
| sortOrder/isActive |      | isActive           |
| metadata (Json)    |      | createdAt/updatedAt|
| @@unique(group,code)|     +--------------------+
+--------------------+
```

> **Note on `remarks`**: the column is retained on `RawMaterial`, `PackagingMaterial`, `RMIssue`,
> `ProductionLog`, `PackagingIssue` and `Dispatch`, but no entry modal collects it any more.
> All write paths persist `remarks: null`.

---

## 2. Model Definitions

### A. Inventory Section

#### 1. `RawMaterial`
One table, **two kinds of row**, distinguished by the `isMaster` flag, with soft-deletion via `isArchived`:

| Row kind | `isMaster` | Created by | Meaning |
| :--- | :--- | :--- | :--- |
| **Master SKU** | `true` | `createRawMaterial` (*+ Add Raw Material*) | Catalog definition only. `stock: 0`, `batchNumber: ''`, `expiryDate: null`. Never shown in the RM inventory table. |
| **Arrival batch** | `false` | `inwardRawMaterial` (*Log Incoming RM*) | A physical shipment that actually arrived. One row per arrival; rows are never merged. |

Fields:
- `id`: Unique identifier (`cuid`).
- `code`: Item catalog code (e.g. `RM001`, `RM002`). **Not unique** — one code owns one master row plus many arrival rows. Indexed for fast lookup.
- `name`: Material description (e.g. *Refined Sugar Grade A*).
- `brand`: Brand / Origin.
- `batchNumber`: Vendor or internal arrival lot number (empty string on master rows).
- `stock`: Quantity of **this single batch** — never the material's total. See §3.
- `unit`: Unit of measurement (`KG`, `Units`, `Boxes`, `GM`, `LTR`, `ML`, `BAGS`).
- `reorderLevel` & `maxStock`: Safety threshold levels (material-level settings, copied onto each arrival row from the master template).
- `supplier` & `location`: Vendor and warehouse storage location.
- `expiryDate`: Lot expiration timestamp.
- `status`: Material-level operational state (`Active` / `Low Stock` / `Archived`), written identically to every row of a code by `syncRawMaterialStatusByCode`.
- `isMaster`: Catalog-definition marker (see table above).
- `isArchived`: Soft-deleted marker (`true` hides from active views while preserving historical issue/production logs).
- `attributes`: Optional `Json` bag for extra material properties.
- `createdAt`: Arrival logging timestamp (used for default `desc` sorting).

#### 2. `PackagingMaterial`
Master packaging inventory (Bottles, Cartons, Caps, Pouches, Labels).
- Fields: `id`, `code` (**Unique**), `name`, `brand`, `batchNumber`, `stock`, `unit`, `reorderLevel`, `maxStock`, `supplier`, `location`, `expiryDate`, `status`, `isArchived`, `attributes`, `remarks`, `createdAt`, `updatedAt`.
- **Soft Delete**: `archivePackagingMaterial` sets `isArchived: true, status: 'Archived'`, preserving past `PackagingIssue` records.

---

### B. Operations Section (5 Pipelines)

#### 1. `RMIssue`
Records raw material deductions issued to production batches:
- `rmCode`, `materialName`, `batchNumber`: Linked material lot.
- `issueFor`: Target Finished Good (selected from active FG catalog).
- `quantityInBatch`: Batch balance **prior to** issuance (snapshot of the source row's `stock`).
- `issuedStock`: Quantity deducted (strictly positive).
- `expiryDate`: Copied from the source batch for traceability.
- `issuedDate`, `issuedBy`, `remarks` (null).

#### 2. `ProductionLog`
Records completed production processing cycles:
- `fgCode`, `fgName`: Manufactured finished product.
- `totalBatchesMade`: Batch run count.
- `totalOutput`: Total output quantity manufactured (automatically increments `FinishedGood` stock).
- `wastage`: Quantity lost in processing.
- `mfgDate`, `expiryDate`, `operator`, `remarks` (null).

#### 3. `PackagingIssue`
Records packaging materials issued to finished packaging lines:
- `pmCode`, `pmName`, `issueFor` (Target FG), `quantityInBatch`, `issuedQty` (deducts PM stock), `issuedDate`, `issuedBy`, `remarks` (null).

#### 4. `FinishedGood`
Finished product inventory available in cold rooms and warehouses:
- `sku` (Unique), `name`, `batchNumber`, `quantityProduced`, `totalStock`, `unit`, `mfgDate`, `expiryDate`.
- `shelfLifeDays`: Auto-computed as $\frac{\text{expiryDate} - \text{mfgDate}}{86400000}$.
- `location`, `status` (`In Stock` / `Out of Stock` / `Archived`), `isArchived`.

#### 5. `Dispatch`
Finished product customer shipments:
- `skuCode`, `productName`, `batchCode`, `dispatchQty` (deducts FG stock), `dispatchDate`, `partyName` (Customer), `mfgDate`, `expiryDate`, `location`, `coaStatus` (`Approved` / `Pending`), `dispatchedBy`, `remarks` (null).

---

### C. RBAC & Security Models
- **`Role`**: Custom role name, color tag, system administrator flag.
- **`Permission`**: Granular permission key (`inventory:rm:view`, `operations:issue:create`, etc.).
- **`RolePermission`**: Junction table mapping roles to permissions.
- **`User`**: Username, name, hashed password, role assignment, active flag.
- **`AuditLog`**: Mutation logging with user ID, action, entity, entity ID, JSON details, and timestamp.

---

### D. Configuration Models
- **`SystemLookup`**: Generic key/label dictionary grouped by `group` (`UNIT`, `COA_STATUS`, `LOCATION`, `BRAND`), with `sortOrder`, `isActive` and a `metadata` JSON bag. Unique on `(group, code)`. Managed through `src/actions/lookups.ts` and the `AddLookupModal`.
- **`StorageLocation`**: Named warehouse/cold-room locations with `zone`, `tempSpec`, `description`, `isActive`.

---

## 3. The Raw Material Stock Model & Query Surface

`RawMaterial.stock` is a **batch quantity**, not a material quantity. Every read that answers "how much of `RM001` do we have?" aggregates across active rows via [`src/lib/inventory-utils.ts`](../src/lib/inventory-utils.ts):

| Helper | Responsibility |
| :--- | :--- |
| `sumStockByCode(rows)` | In-memory aggregation of `stock` per `code` — used to attach `materialStock` to each row returned by `getRawMaterials`. |
| `resolveStockStatus(total, reorderLevel)` | Single source of truth for the low-stock rule: `total <= reorderLevel → 'Low Stock'`, else `'Active'`. |
| `getRawMaterialTotalStock(code)` | DB-side `aggregate({ _sum: { stock } })` for one code. Queries full table so active search filters cannot skew total. |
| `syncRawMaterialStatusByCode(code)` | Recomputes material-level total and writes the resulting `status` to **every** row of that code. Uses `Math.max()` of all rows' `reorderLevel`. Call after any mutation that changes stock for a code. |

**Query surface** (`src/actions/inventory.ts`, proxied by `src/actions/raw-materials.ts`):

| Action | Row filter | Used by |
| :--- | :--- | :--- |
| `getRawMaterials(search, status)` | `isMaster: false, isArchived: false` | RM inventory table (arrivals only, `createdAt desc`) |
| `getRawMaterialMasters(search)` | `isArchived: false`, deduplicated by `code` | RM code dropdowns & Master Catalog Panel |
| `getRawMaterialByCode(code)` | `orderBy: [{ isMaster: 'desc' }, { createdAt: 'desc' }]` | Single-material lookup, prefers the master definition |
| `archiveRawMaterialByCode(code)` | sets `isArchived: true, status: 'Archived'` on all rows of code | Master Catalog batch/single deletion |
| `updateRawMaterialMasterByCode(code, data)` | updates master settings & all batch rows of code | Master Catalog inline editor |

