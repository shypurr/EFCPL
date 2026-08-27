# 03. System Architecture & UI/UX Design Specifications

## 1. System Design Principles

The EFCPL MES platform is built upon five foundational design tenets:
1. **Catalog ≠ Stock**: Registering a material in the catalog and receiving a shipment are two separate acts. *+ Add Raw Material* creates a **master SKU** with zero stock and no batch; only *Log Incoming RM* creates stock. The system never invents a phantom opening batch on registration.
2. **Discrete Batch Traceability**: Every raw agricultural commodity arrival is recorded as an independent batch with its own arrival timestamp, batch number, supplier, and quantity. Stock entries are not merged, providing complete lot-level auditability.
3. **Safe Archiving & Audit Permanence**: Deleting materials uses soft-deletion (`isArchived: true`). Historical transaction logs (RM issues, packaging issues, production logs, dispatches) remain 100% intact, while archived items are hidden from active inventory lists and blocked from new operations.
4. **Strict Operational Constraints**: Zero negative numbers allowed anywhere in the system (inputs, tables, calculations). Keystroke guards intercept invalid inputs before state updates.
5. **Dynamic Relational Bindings**: Forms dynamically inspect related inventory states (e.g. "Issue For" selectors bind to live Finished Goods records, and unit selectors auto-populate with override options).

---

## 2. Inventory & Operations Data Flow

```
[ + Add Raw Material ] --> [ RM MASTER ROW (isMaster: true, stock 0) ]
   (catalog only)                        |
                                         | supplies the code dropdown
                                         v
[ Log Incoming RM ] -----> [ RM ARRIVAL ROW (isMaster: false, createdAt desc) ]
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
                                      |
                                      v
                                [ Production Log ] ---> [ Manufactured FG Batch ]
                                      |                         |
                                [ Packaging Issue ]             v
                                      |                 [ Auto-Add FG Stock ]
                                      v                         |
                               [ Completed FG ]                 v
                                                          [ Dispatch Log ]
                                                                |
                                                                v
                                                     [ Auto-Deduct FG Stock ]
```

---

## 3. UI/UX & Interaction Patterns

### 3.1 Master Registration vs. Logged Arrivals
Two distinct RM entry points, deliberately kept apart:

| | **+ Add Raw Material** (`AddRawMaterialModal`) | **Log Incoming RM** (`InwardRawMaterialModal`) |
| :--- | :--- | :--- |
| **Purpose** | Register a catalog SKU | Record a physical shipment |
| **Fields** | Code, Name, Brand, Unit, Reorder Level, Max Stock, default Supplier, default Location | RM Code (dropdown), Name, Brand, Incoming Qty, Unit, Batch No, Supplier, Location, Expiry |
| **Writes** | `createRawMaterial` → one row, `isMaster: true`, `stock: 0`, `batchNumber: ''`, `expiryDate: null` | `inwardRawMaterial` → one new row, `isMaster: false`, `stock: qty` |
| **Guard** | Rejects a duplicate code that already has a master row | Rejects `qty <= 0`; inherits missing fields from the master template |
| **Visible in RM table** | No | Yes |

* The Inward modal's code dropdown is fed by `getRawMaterialMasters()` (deduplicated by code, master preferred), so an operator can only receive stock against a registered SKU.

### 3.2 Master Catalog Hub (`MasterCatalogPanel.tsx`)
The Master Entry Hub (`add-materials` panel) provides complete catalog governance:
- **Level 1 (Category Hub)**: High-contrast 3-card picker for RM, PM, and FG with live item counts and descriptions.
- **Level 2 (Catalog Tables)**: Detailed views of SKU codes, descriptions, units, reorder levels, max stock, current total stock, default suppliers, and storage locations.
- **Batch Multi-Delete Mode**: Checkbox selection with "Select All" toggle, displaying selected item counts, stock warnings, and multi-item archive confirmation.
- **Safe Soft-Deletion**: Invokes `archiveRawMaterialByCode`, `archivePackagingMaterial`, or `archiveFinishedGood`. Rows are marked `isArchived = true`, removing them from future pickers without breaking historical audit trails.
- **Inline Editing (`EditMaterialModal.tsx`)**:
  - RM master editing (`updateRawMaterialMasterByCode`) updates material-level properties (`name`, `brand`, `unit`, `reorderLevel`, `maxStock`) across all associated batch rows while setting default supplier and location on the master row.
  - Automatically resyncs material-level low-stock status via `syncRawMaterialStatusByCode`.

### 3.3 Discrete Raw Materials Log & Reverse-Chronological Table
* **Separate Batch Rows**: When an operator logs an arrival for an existing raw material (e.g., `RM001` - Refined Sugar), a new record is created in the `RawMaterial` table rather than incrementing a single aggregated number.
* **Chronological Ordering**: The table queries with `orderBy: { createdAt: 'desc' }`, ensuring the newest incoming entries appear at the very top.
* **Entry Date Column**: Explicit timestamp column displaying arrival date.
* **Arrivals Only**: `getRawMaterials` filters `isMaster: false, isArchived: false`, so catalog definitions never pollute the stock table.

### 3.4 Material-Level Stock & Status Resolution
Because one material code owns many rows, a single row's `stock` is never the answer to "do we have enough?". The rules are centralised in `src/lib/inventory-utils.ts`:
* **Aggregation**: `getRawMaterials` sums `stock` per code across every arrival row and attaches `materialStock` + `isLowStock` to each returned row.
* **Status write-back**: After any stock mutation, `syncRawMaterialStatusByCode(code)` recomputes the total and writes the same `status` to **every** row of that code, so a stored status can never contradict the total.
* **Reorder level**: Taken as `Math.max()` across the code's rows, so a legacy row left at `0` cannot mask a genuine low-stock condition.

### 3.5 Streamlined Entry Forms (No Remarks)
Every operational entry modal has had its free-text **Remarks** field removed to keep factory-floor dialogs to the fields that matter. The `remarks` columns still exist in the schema and every write path persists `null`.

### 3.6 Universal Non-Negative Numeric Controls
* **Input Level**: All numeric inputs include `min="0"`, preventing negative stepping with browser arrows.
* **Event Handlers**: `onChange` handlers inspect incoming keystrokes and discard negative values or minus signs (`if (Number(val) < 0) return;`).
* **Server Action Validation**: Server actions enforce strictly positive quantities for issuances, productions, inward arrivals, and dispatches (`qty > 0`).

### 3.7 Dynamic Dropdown Bindings & Changeable Units
* **Target FG Dropdown**: The `IssueModal` and `PackagingIssueModal` dynamically populate the "Issue For (Target FG)" field with existing finished goods, showing current SKU, product name, and available finished stock.
* **Arrived RM Unit Selector**: Auto-fills the default unit from master definitions upon selecting an RM code, but allows operators to override the unit via a `<select>` dropdown (`KG`, `Units`, `Boxes`).
* **Integrated Unit Badges**: Inputs (such as "Qty to Issue", "Dispatch Qty", and "Received Qty") feature integrated inline unit badges to eliminate overflow issues on narrow viewports.

---

## 4. Multi-Device Responsive Architecture

* **Desktop Viewports ($\ge 1024\text{px}$)**: Full persistent left sidebar, expansive multi-column data tables, and centered dual-column modal dialogues.
* **Tablet Viewports ($768\text{px} - 1023\text{px}$)**: Adaptive topbar with quick search and status filters, stacked modal grids, and horizontally scrollable tables.
* **Mobile Viewports ($< 768\text{px}$)**: Fixed bottom `MobileNav` navigation bar, slide-out full navigation drawer, touch-friendly $(44\text{px}+)$ action buttons, full-width modal layouts, and responsive stat cards.

