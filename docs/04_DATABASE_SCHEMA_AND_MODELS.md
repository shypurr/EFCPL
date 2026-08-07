# 04. Database Schema & Data Models — EFCPL Inventory Management System

## 1. Schema Overview & ERD Concept
The database is built on **PostgreSQL (Neon)** using **Prisma ORM**. It is structured to separate dynamic lookup metadata from physical inventory entities and audit-trailed movement transactions.

---

## 2. Complete Prisma Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ==========================================
// 1. DYNAMIC SYSTEM LOOKUPS & CONFIGURATION
// ==========================================

model SystemLookup {
  id          String   @id @default(cuid())
  group       String   // e.g., "UNIT", "COA_STATUS", "PACKAGING_TYPE", "TEMP_CONDITION"
  code        String   // e.g., "KG", "LTR", "APPROVED", "CARTON"
  label       String   // e.g., "Kilograms (KG)", "Approved", "Corrugated Carton"
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  metadata    Json?    // Optional JSON for extra attributes
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([group, code])
  @@index([group])
}

model CategoryMaster {
  id          String   @id @default(cuid())
  name        String   @unique // e.g., "Raw Material", "Packaging", "Finished Goods"
  code        String   @unique // e.g., "RM", "PM", "FG"
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model StorageLocation {
  id          String   @id @default(cuid())
  name        String   @unique // e.g., "Zone A / Bin 1", "Cold Store 1 (-18°C)"
  zone        String   // e.g., "Zone A", "Cold Store"
  tempSpec    String?  // e.g., "-18°C", "0-4°C", "Ambient"
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model SystemSetting {
  id          String   @id @default(cuid())
  key         String   @unique // e.g., "EXPIRY_WARNING_DAYS_CRITICAL", "DEFAULT_CURRENCY"
  value       String   // e.g., "30", "INR"
  description String?
  updatedAt   DateTime @updatedAt
}

// ==========================================
// 2. CORE INVENTORY ENTITIES
// ==========================================

model RawMaterial {
  id           String             @id @default(cuid())
  code         String             @unique // e.g., "RM-001"
  name         String             // e.g., "Maida (All Purpose Flour)"
  grade        String?            // e.g., "Food Grade A1"
  qty          Float              @default(0)
  unit         String             // Dynamic reference to SystemLookup (group: UNIT)
  reorderLevel Float              @default(0)
  maxStock     Float?
  supplierName String?
  leadTimeDays Int?               @default(0)
  lastPurchaseRate Float?        @default(0)
  lastReceivedDate DateTime?
  batchNumber  String?
  coaStatus    String             @default("Pending") // Approved, Pending, Rejected, N/A
  locationId   String?
  location     StorageLocation?   @relation(fields: [locationId], references: [id])
  expiryDate   DateTime?
  attributes   Json?              // Dynamic fields (e.g. Moisture %, FSSAI No)
  remarks      String?
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt

  movements    InventoryMovement[]

  @@index([code])
  @@index([name])
}

model FinishedGood {
  id            String             @id @default(cuid())
  sku           String             @unique // e.g., "FG-001"
  name          String             // e.g., "Paneer Butter Masala 400g"
  batchNumber   String             // e.g., "FGB-2025-001"
  qtyProduced   Float              @default(0)
  qtyDispatched Float              @default(0)
  unit          String             @default("Units")
  qtyReserved   Float              @default(0)
  salesOrderRef String?
  mfgDate       DateTime
  expiryDate    DateTime
  shelfLifeDays Int?
  locationId    String?
  location      StorageLocation?   @relation(fields: [locationId], references: [id])
  tempCondition String?            // e.g., "-18°C (Deep Frozen)"
  attributes    Json?              // Dynamic fields (Barcode, EAN, Brand)
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  dispatches    DispatchEntry[]
  movements     InventoryMovement[]

  @@index([sku])
  @@index([batchNumber])
}

model PackagingMaterial {
  id              String             @id @default(cuid())
  code            String             @unique // e.g., "PKG-001"
  type            String             // Dynamic reference (Pouch, Label, Carton, Bottle)
  description     String             // e.g., "400g PP Microwavable Container"
  specification   String?            // e.g., "150x100mm, Clear PP"
  qty             Float              @default(0)
  unit            String             @default("Units")
  linkedSkus      String?            // e.g., "FG-001, FG-002"
  supplier        String?
  moq             Float?             @default(0)
  leadTimeDays    Int?               @default(0)
  lastPurchaseRate Float?            @default(0)
  reorderLevel    Float              @default(0)
  avgConsumption  Float?             @default(0)
  attributes      Json?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  movements       InventoryMovement[]

  @@index([code])
}

// ==========================================
// 3. MOVEMENTS & TRANSACTIONS (AUDIT LOGGED)
// ==========================================

enum MovementType {
  GRN        // Inward Receipt
  ISSUE      // Outward Issue to Production
  DISPATCH   // Outward Sale Dispatch
  ADJUSTMENT // Audit Correction
}

model InventoryMovement {
  id           String            @id @default(cuid())
  refNumber    String            @unique // e.g., "GRN-001", "MIS-001", "DSP-001"
  type         MovementType
  category     String            // Raw Material, Packaging, Finished Goods
  materialId   String?
  rawMaterial  RawMaterial?      @relation(fields: [materialId], references: [id])
  finishedGoodId String?
  finishedGood FinishedGood?     @relation(fields: [finishedGoodId], references: [id])
  packagingId  String?
  packaging    PackagingMaterial?@relation(fields: [packagingId], references: [id])
  
  qty          Float
  unit         String
  party        String?           // Supplier or Department or Customer
  invoiceRef   String?
  batchRef     String?
  coaStatus    String?
  performedBy  String            // User name / User ID
  remarks      String?
  movementDate DateTime          @default(now())
  createdAt    DateTime          @default(now())

  @@index([refNumber])
  @@index([type])
  @@index([movementDate])
}

model DispatchEntry {
  id             String       @id @default(cuid())
  dispatchNo     String       @unique // e.g., "DSP-001"
  dispatchDate   DateTime     @default(now())
  finishedGoodId String
  finishedGood   FinishedGood @relation(fields: [finishedGoodId], references: [id])
  qtyDispatched  Float
  unit           String
  customerName   String
  salesOrderRef  String?
  dispatchedBy   String
  remarks        String?
  createdAt      DateTime     @default(now())
}

// ==========================================
// 4. AUTHENTICATION & AUDIT TRAIL
// ==========================================

enum UserRole {
  ADMIN
  STORE_MANAGER
  PRODUCTION_SUPERVISOR
  WAREHOUSE_STAFF
  VIEWER
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String
  role      UserRole  @default(WAREHOUSE_STAFF)
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  auditLogs AuditLog[]
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String   // e.g., "CREATE_RM", "POST_GRN", "DELETE_ITEM"
  entity    String   // e.g., "RawMaterial"
  entityId  String?
  details   Json?    // Detailed diff of what changed
  timestamp DateTime @default(now())

  @@index([userId])
  @@index([timestamp])
}
```
