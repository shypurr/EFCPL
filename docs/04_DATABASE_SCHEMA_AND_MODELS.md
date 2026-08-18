# 04. Database Schema & Data Models — EFCPL MES & Inventory System

## 1. Relational Entity Overview

```
+-------------------+      +--------------------+      +-----------------------+
|    RawMaterial    |      | PackagingMaterial  |      |     FinishedGood      |
+-------------------+      +--------------------+      +-----------------------+
| code (PK)         |      | code (PK)          |      | sku (PK)              |
| name              |      | name               |      | name                  |
| brand             |      | brand              |      | batchNumber           |
| batchNumber       |      | batchNumber        |      | quantityProduced      |
| stock             |      | stock              |      | totalStock            |
| unit              |      | unit               |      | unit                  |
| reorderLevel      |      | reorderLevel       |      | mfgDate               |
| maxStock          |      | maxStock           |      | expiryDate            |
| supplier          |      | supplier           |      | shelfLifeDays (calc)  |
| location          |      | location           |      | location              |
| expiryDate        |      | expiryDate         |      | status                |
| status            |      | status             |      +-----------------------+
+-------------------+      +--------------------+                  |
          |                          |                             |
          v                          v                             v
+-------------------+      +--------------------+      +-----------------------+
|      RMIssue      |      |   PackagingIssue   |      |       Dispatch        |
+-------------------+      +--------------------+      +-----------------------+
| rmCode (FK)       |      | pmCode (FK)        |      | skuCode (FK)          |
| issueFor (Target) |      | issueFor (Target)  |      | partyName             |
| quantityInBatch   |      | quantityInBatch    |      | dispatchQty           |
| issuedStock       |      | issuedQty          |      | dispatchDate          |
| issuedDate        |      | issuedDate         |      | coaStatus             |
+-------------------+      +--------------------+      +-----------------------+
```

---

## 2. Model Definitions

### A. Inventory Section
* **`RawMaterial`**: Raw material items master. Stores stock levels, reorder thresholds, supplier info, and batch expiration dates.
* **`PackagingMaterial`**: Packaging items master. Mirrors `RawMaterial` field structure (Code, Name, Brand, Batch Number, Stock, Unit, Reorder Level, Max Stock, Supplier, Location, Expiry, Status).

### B. Operations Section (5 Dedicated Tabs)
* **`RMIssue`**: Raw Material issuance logs. Auto-links `rmCode` to `materialName`, auto-populates `expiryDate` and `quantityInBatch` from selected batch, records `issuedStock` to `issueFor` (Target FG).
* **`ProductionLog`**: Production run records. Links `fgCode` to `fgName`, stores `totalBatchesMade`, `totalOutput`, `wastage`. Entry form captures `mfgDate`, `expiryDate`, `remarks`.
* **`PackagingIssue`**: Packaging material issuance logs. Auto-links `pmCode` to `pmName`, auto-populates `quantityInBatch`, records `issuedQty` to `issueFor` (Target FG).
* **`FinishedGood`**: Manufactured FG inventory & batch stock. Auto-calculates `shelfLifeDays` as $(\text{expiryDate} - \text{mfgDate})$.
* **`Dispatch`**: Customer dispatch logs. Records `skuCode`, `productName`, `batchCode`, `dispatchQty`, `dispatchDate`, `partyName`, `mfgDate`, `expiryDate`, `location`, `coaStatus`.

### C. Security & RBAC (Discord-Style)
* **`User`**: `id`, `username`, `name`, `passwordHash`, `roleId`, `isActive`, `createdAt`, `updatedAt`.
* **`Role`**: `id`, `name`, `colorTag`, `description`, `isSystemAdmin`, `rolePermissions`.
* **`Permission`**: `id`, `key`, `label`, `module`, `action`, `description`.
* **`RolePermission`**: `roleId`, `permissionId`.
* **`AuditLog`**: Mutation tracking (`userId`, `action`, `entity`, `entityId`, `details`, `timestamp`).
