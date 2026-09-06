# 03. System Architecture & UI/UX Design Specifications

## 1. System Design Principles

1. **Catalog ≠ Stock**: registering a material and receiving a shipment are two separate acts. *+ Add Raw Material* creates a **master SKU** with zero stock and no batch; only *Log Inward / Arrived RM* creates stock. The system never invents a phantom opening batch on registration.
2. **Discrete batch traceability**: every raw material arrival is an independent row with its own arrival timestamp, batch number, supplier and quantity. RM rows are never merged, giving lot-level auditability. *(Packaging materials deliberately do not follow this model — see §3.4.)*
3. **Safe archiving & audit permanence**: deleting a catalog item is a soft delete (`isArchived: true`). Historical transaction logs stay 100% intact; archived items vanish from active lists and every write path rejects them by name.
4. **Atomic stock movements**: all five operations write paths wrap their stock check, stock update and log insert in a single `prisma.$transaction`, so a rejected movement leaves no partial record.
5. **Strict operational constraints**: no negative numbers in inputs or server actions; quantity guards return descriptive error strings rather than throwing at the client.
6. **Dynamic relational bindings**: forms read live inventory state — "Issue For" selectors bind to current Finished Goods, code dropdowns bind to non-archived masters, units prefill but stay editable.

---

## 2. Inventory & Operations Data Flow

```
[ + Add Raw Material ] --> [ RM MASTER ROW (isMaster: true, stock 0) ]
   (catalog only)                        |
                                         | supplies the code dropdown
                                         v
[ Log Inward / Arrived RM ] --> [ RM ARRIVAL ROW (isMaster: false, createdAt desc) ]
   (physical arrival)                    |          one row per shipment
                                         |
                     +-------------------+-------------------+
                     |  material total = SUM(stock) of all   |
                     |  arrival rows sharing the same code   |
                     |  (src/lib/inventory-utils.ts)         |
                     +-------------------+-------------------+
                                         |
                                         v
                                [ RM Issue ] ---> [ Target FG Selection ]
                             (decrements ONE batch row)
                                      |
                                      v
                                [ Production Log ] ---> [ FinishedGood upsert ]
                                      |                         |
                                [ Packaging Issue ]     [ Auto-Add FG Stock ]
                             (decrements PM row)                |
                                      |                         v
                                      v                  [ Dispatch Log ]
                               [ Completed FG ]                 |
                                                                v
                                                     [ Auto-Deduct FG Stock ]
                                              (status -> 'Out of Stock' at zero)
```

---

## 3. UI/UX & Interaction Patterns

### 3.1 Master Registration vs. Logged Arrivals
Two distinct RM entry points, deliberately kept apart:

| | **+ Add Raw Material** (`AddRawMaterialModal`) | **Log Inward / Arrived RM** (`InwardRawMaterialModal`) |
| :--- | :--- | :--- |
| **Purpose** | Register a catalog SKU | Record a physical shipment |
| **Fields** | Code, Name, Brand, Unit, Reorder Level, Max Stock, default Supplier, default Location | RM Code (dropdown), Name, Brand, Incoming Qty, Unit, Batch No, Supplier, Location, Expiry |
| **Writes** | `createRawMaterial` → one row, `isMaster: true`, `stock: 0`, `batchNumber: ''`, `expiryDate: null`, `location` defaults to `'RM Store A'` | `inwardRawMaterial` → one new row, `isMaster: false`, `stock: qty` |
| **Guard** | Rejects a duplicate code that already has a master row | Rejects `qty <= 0` and archived codes; inherits missing fields from the master template |
| **Visible in RM table** | No | Yes |

* The Inward modal's code dropdown is fed by `getRawMaterialMasters()` (non-archived, deduplicated by code with the master preferred), so an operator can only receive stock against a registered SKU.
* An inward for a code with **no** master row still succeeds — `rmTemplate` is simply `null` and defaults (`'Raw Material'`, `KG`, `'RM Store A'`, `reorderLevel: 0`) apply. The dropdown makes this unreachable from the UI, but a direct action call is not blocked.

### 3.2 Master Catalog Hub ([`MasterCatalogPanel.tsx`](../src/components/MasterCatalogPanel.tsx))
The `add-materials` panel provides catalog governance for all three categories:

- **Level 1 (category hub)**: 3-card picker for RM, PM and FG with live item counts and descriptions.
- **Level 2 (catalog tables)**: SKU codes, descriptions, units, reorder levels, max stock, current total stock, batch counts, default suppliers and storage locations, with a search box.
- **Batch multi-delete mode**: checkbox selection with a "Select All" toggle, a selected-count indicator, and a confirmation dialog that surfaces the stock about to be retired.
- **Safe soft-deletion**: invokes `archiveRawMaterialByCode` (by **code**, archiving master + every batch row at once), `archivePackagingMaterial` (by **row id**) or `archiveFinishedGood` (by **row id**). Rows are marked `isArchived: true, status: 'Archived'` — never deleted.
- **Inline editing ([`EditMaterialModal.tsx`](../src/components/Modals/EditMaterialModal.tsx))**:
  - **RM** → `updateRawMaterialMasterByCode`: writes `name`, `brand`, `unit`, `reorderLevel`, `maxStock` to **every non-archived row** of the code, then writes `supplier` / `location` to the master row alone (they are defaults for *future* arrivals and must not rewrite what past batches recorded). Finishes with `syncRawMaterialStatusByCode`.
  - **PM** → `updatePackagingMaterial` by row id. **FG** → `updateFinishedGood` by row id (recomputes `shelfLifeDays` if dates change).
  - `code` / `sku` render read-only with the hint that history references them.

### 3.3 Discrete Raw Materials Log & Reverse-Chronological Table
* **Separate batch rows**: logging an arrival for `RM001` creates a new `RawMaterial` row rather than incrementing an aggregate.
* **Chronological ordering**: `getRawMaterials` queries `orderBy: { createdAt: 'desc' }`, newest first.
* **Entry Date column**: shows the arrival timestamp.
* **Arrivals only**: `getRawMaterials` filters `isMaster: false, isArchived: false`, so catalog definitions never pollute the stock table.
* The RM table's row actions are **delete only**; it calls the hard-delete `deleteRawMaterial(id)` for a single arrival row. Catalog-level (soft) deletion lives in the Master Catalog Hub.

### 3.4 Packaging Materials Use a Different Model
`PackagingMaterial.code` is `@unique`, and `inwardPackagingMaterial` **updates the existing row** (`stock: pm.stock + qty`) instead of inserting a batch. Consequences worth knowing:

* PM has no arrival history — the last inward's `batchNumber`, `supplier`, `location` and `expiryDate` overwrite the previous values.
* PM status is a straightforward per-row rule (`stock <= reorderLevel → 'Low Stock'`), applied inline; there is no PM equivalent of `syncRawMaterialStatusByCode` because there is nothing to aggregate.
* Inward against an unknown PM code is rejected outright (unlike RM).

### 3.5 Material-Level Stock & Status Resolution
Because one RM code owns many rows, a single row's `stock` is never the answer to "do we have enough?". The rules live in [`src/lib/inventory-utils.ts`](../src/lib/inventory-utils.ts):

| Helper | Responsibility |
| :--- | :--- |
| `sumStockByCode(rows)` | In-memory aggregation of `stock` per `code`. |
| `resolveStockStatus(total, reorderLevel)` | The low-stock rule: `total <= reorderLevel → 'Low Stock'`, else `'Active'`. |
| `getRawMaterialTotalStock(code)` | DB-side `aggregate({ _sum: { stock } })` for one code, over the full table so a search filter cannot skew it. |
| `syncRawMaterialStatusByCode(code)` | Recomputes the material total and writes the resulting `status` to **every** row of that code, using `Math.max()` of all rows' `reorderLevel` so a legacy row left at `0` cannot mask a low-stock condition. |

Callers of `syncRawMaterialStatusByCode` today: `inwardRawMaterial`, `updateRawMaterial`, `updateRawMaterialMasterByCode`, `deleteRawMaterial`. **Not** `createRMIssue` — see §5.

### 3.6 Streamlined Entry Forms (No Remarks)
Every operational entry modal has had its free-text **Remarks** field removed. The `remarks` columns still exist on `RawMaterial`, `PackagingMaterial`, `RMIssue`, `ProductionLog`, `PackagingIssue` and `Dispatch`, and every write path persists `null`.

### 3.7 Universal Non-Negative Numeric Controls
* **Input level**: numeric inputs carry `min="0"`, blocking negative stepping with browser arrows. `EditMaterialModal` applies this dynamically (`min={f.type === 'number' ? 0 : undefined}`).
* **Event handlers**: `onChange` handlers discard negative values before updating state.
* **Server actions**: `inwardRawMaterial`, `inwardPackagingMaterial`, `inwardFinishedGood`, `createRMIssue`, `createPackagingIssue` and `createDispatch` all reject `qty <= 0`; `updateRawMaterialMasterByCode` rejects negative `reorderLevel` / `maxStock`.

### 3.8 Dynamic Dropdown Bindings & Changeable Units
* **Target FG dropdown**: `IssueModal` and `PackagingIssueModal` populate "Issue For (Target FG)" from the live Finished Goods list, showing SKU, product name and available stock.
* **Unit selector**: auto-fills from the selected master record but stays overridable. Option sets per category (`EditMaterialModal`): RM `KG, Units, Boxes, GM, LTR, ML, BAGS`; PM `Units, Boxes, Rolls, KG`; FG `KG, Units, Boxes, Jars`.
* **Storage location selectors**: RM `RM Store A, Cold Storage 1, Dry Warehouse`; PM `PM Warehouse, Packaging Bay 1, Dry Storage B`; FG `Cold Store Zone A, Deep Freezer 2, FG Bay 1, Dry Warehouse`. These are hardcoded arrays — the `StorageLocation` table is not read by the UI.
* **Inline unit badges**: quantity inputs ("Qty to Issue", "Dispatch Qty", "Received Qty") carry an inline unit badge to avoid overflow on narrow viewports.

---

## 4. Multi-Device Responsive Architecture

* **Desktop (≥ 1024px)**: persistent left sidebar (14 items in 5 sections), wide multi-column tables, centered dual-column modals.
* **Tablet (768px – 1023px)**: `Topbar` with alert count, plant badge, refresh and session controls; stacked modal grids; horizontally scrollable tables.
* **Mobile (< 768px)**: fixed bottom `MobileNav` with 5 quick tabs (Dashboard, Raw Mat, Production, FG Stock, Add Item) plus a slide-out drawer carrying the full 14-item navigation; touch-friendly (44px+) targets; full-width modals; responsive stat cards.
* **Theme**: dark navy/teal palette defined as CSS variables in `globals.css` (`--navy #070E1A`, `--navy2 #0D1B2E`, `--navy3 #162440`, `--navy4 #1E2F4A`, `--teal #1D9E75`), DM Sans body / DM Mono for codes, and custom 6px scrollbars. `table th, table td { white-space: nowrap }` is what forces the horizontal-scroll behaviour.

---

## 5. Known Drift Between the Stock Model and Its Consumers

The material-level model in §3.5 is implemented in the data layer but is **not what the UI displays**. These are verified inconsistencies in the current tree, not design intent:

| # | Drift | Where | Effect |
| :--- | :--- | :--- | :--- |
| 1 | `materialStock` and `isLowStock` are computed by `getRawMaterials` but have **no consumer**. | `src/actions/inventory.ts` → nothing in `src/components` or `page.tsx` | The aggregation work is discarded. |
| 2 | The RM table colours stock and renders the status badge from per-row `rm.stock <= rm.reorderLevel`. | `src/app/page.tsx` (RM panel) | A code with 5 small batches each under the reorder level shows 5 "Low Stock" rows even when the total is healthy. |
| 3 | Alert counts use per-row `stock <= reorderLevel` on both RM and PM. | `src/app/page.tsx` (`lowRmCount` / `lowPmCount`) | Alert badge and Alerts panel over-count for multi-batch RM codes. |
| 4 | `createRMIssue` writes `status` from the issued row's own stock and never calls `syncRawMaterialStatusByCode`. | `src/actions/operations.ts` | After an issue, that row's stored status can contradict the material total until the next inward or master edit resyncs it. |
| 5 | `po-suggestions.ts` and `reports.ts` call `prisma.rawMaterial.findMany()` with **no** `isMaster` / `isArchived` filter. | both files | Every zero-stock master row is treated as low stock, and archived materials still appear in suggestions and reports. |
| 6 | `getRawMaterials` builds `where.AND` for the search branch while `isArchived: false` stays only on the top-level object. | `src/actions/inventory.ts` | The archived filter survives (Prisma ANDs top-level keys with `AND`), but the duplicated `isMaster` clause makes the intent hard to read. |
| 7 | `getRMDetailsForIssue` resolves a code with `orderBy: { createdAt: 'desc' }` — the newest arrival — rather than the batch the operator picked. | `src/actions/operations.ts` | Prefill can describe a different batch than the one `createRMIssue` will decrement when `batchNumber` is blank. |

Closing #1–#4 is a small change (read `materialStock` / `isLowStock` in `page.tsx`, add the sync call to `createRMIssue`); #5 needs `where: { isMaster: false, isArchived: false }` on both queries. See [05_DEVELOPMENT_ROADMAP.md](05_DEVELOPMENT_ROADMAP.md) Phase 9.

> A stale one-off codemod, `patch2.js` at the repo root, was written to add the `syncRawMaterialStatusByCode` import and call to `operations.ts`. It was never applied — `operations.ts` still imports only `prisma` and `revalidatePath`.
