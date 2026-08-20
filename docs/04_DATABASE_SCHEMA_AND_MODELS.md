# 04. Database Schema & Data Models — EFCPL MES & Inventory System

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
| stock             |      | stock              |      | totalStock            |
| unit (KG/Units/Bx)|      | unit               |      | unit                  |
| reorderLevel      |      | reorderLevel       |      | mfgDate               |
| maxStock          |      | maxStock           |      | expiryDate            |
| supplier          |      | supplier           |      | shelfLifeDays (calc)  |
| location          |      | location           |      | location              |
| expiryDate        |      | expiryDate         |      | status                |
| status            |      | status             |      | createdAt / updatedAt |
| createdAt (desc)  |      | createdAt/updatedAt|      +-----------------------+
| updatedAt         |      +--------------------+                  |
+-------------------+                 |                            |
          |                           v                            v
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
```

---

## 2. Model Definitions

### A. Inventory Section

#### 1. `RawMaterial`
Stores incoming and on-hand raw material lots. Supports discrete arrivals for identical material codes:
- `id`: Unique identifier (`cuid`).
- `code`: Item catalog code (e.g. `RM001`, `RM002`). Indexed for fast lookup.
- `name`: Material description (e.g. *Refined Sugar Grade A*).
- `brand`: Brand / Origin.
- `batchNumber`: Vendor or internal arrival lot number.
- `stock`: Current quantity available in this specific batch.
- `unit`: Unit of measurement (`KG`, `Units`, `Boxes`).
- `reorderLevel` & `maxStock`: Safety threshold levels.
- `supplier` & `location`: Vendor and warehouse storage location.
- `expiryDate`: Lot expiration timestamp.
- `status`: Calculated operational state (`Active` / `Low Stock`).
- `createdAt`: Arrival logging timestamp (used for default `desc` sorting).

#### 2. `PackagingMaterial`
Master packaging inventory (Bottles, Cartons, Caps, Pouches, Labels).
- Fields: `id`, `code` (Unique), `name`, `brand`, `batchNumber`, `stock`, `unit`, `reorderLevel`, `maxStock`, `supplier`, `location`, `expiryDate`, `status`, `createdAt`, `updatedAt`.

---

### B. Operations Section (5 Pipelines)

#### 1. `RMIssue`
Records raw material deductions issued to production batches:
- `rmCode`, `materialName`, `batchNumber`: Linked material lot.
- `issueFor`: Target Finished Good (selected from active FG catalog).
- `quantityInBatch`: Batch balance prior to issuance.
- `issuedStock`: Quantity deducted (strictly positive).
- `issuedDate`, `issuedBy`, `remarks`.

#### 2. `ProductionLog`
Records completed production processing cycles:
- `fgCode`, `fgName`: Manufactured finished product.
- `totalBatchesMade`: Batch run count.
- `totalOutput`: Total output quantity manufactured.
- `wastage`: Quantity lost in processing.
- `mfgDate`, `expiryDate`, `operator`, `remarks`.

#### 3. `PackagingIssue`
Records packaging materials issued to finished packaging lines:
- `pmCode`, `pmName`, `issueFor` (Target FG), `quantityInBatch`, `issuedQty`, `issuedDate`, `issuedBy`, `remarks`.

#### 4. `FinishedGood`
Finished product inventory available in cold rooms and warehouses:
- `sku` (Unique), `name`, `batchNumber`, `quantityProduced`, `totalStock`, `unit`, `mfgDate`, `expiryDate`.
- `shelfLifeDays`: Auto-computed as $\frac{\text{expiryDate} - \text{mfgDate}}{86400000}$.
- `location`, `status` (`In Stock` / `Low Stock`).

#### 5. `Dispatch`
Finished product customer shipments:
- `skuCode`, `productName`, `batchCode`, `dispatchQty`, `dispatchDate`, `partyName` (Customer), `mfgDate`, `expiryDate`, `location`, `coaStatus` (`Approved` / `Pending`), `dispatchedBy`, `remarks`.

---

### C. RBAC & Security Models
- **`Role`**: Custom role name, color tag, system administrator flag.
- **`Permission`**: Granular permission key (`inventory:rm:view`, `operations:issue:create`, etc.).
- **`RolePermission`**: Junction table mapping roles to permissions.
- **`User`**: Username, name, hashed password, role assignment, active flag.
- **`AuditLog`**: Mutation logging with user ID, action, entity, entity ID, JSON details, and timestamp.
