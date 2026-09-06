# 01. Project Summary & Context — EFCPL Inventory & MES App

## 1. Project Background
**EFCPL (Exotic Food Processing Private Limited)** is a food manufacturing and processing company based in Pune, Maharashtra, India. The company processes and handles perishable agricultural commodities, fruits, syrups, packaging supplies, cold-chain storage operations, and finished packaged retail/B2B food products.

This system provides a real-time **Manufacturing Execution System (MES) & Inventory Management Platform** for factory floor staff, store managers, production supervisors, and management across desktop workstations, tablets, and mobile devices.

The entire application is a **single Next.js route** (`/`). [`src/app/page.tsx`](../src/app/page.tsx) is one client component that loads all data on mount and switches between 14 panels via an `activePanel` string. There is no routing, no API route handler, and no middleware — every mutation goes through a Server Action.

---

## 2. Core Business Goals & System Structure

The application is organised into 5 navigation sections spanning 14 panels (see [`Sidebar.tsx`](../src/components/Sidebar.tsx)):

| Section | Panels |
| :--- | :--- |
| Overview | `dashboard`, `alerts` |
| Inventory | `raw-materials`, `packaged-materials` |
| Operations | `op-rm-issue`, `op-production`, `op-packaging-issue`, `op-finished-goods`, `op-dispatch` |
| Master Entry Hub | `add-materials` |
| Admin & Governance | `admin-roles`, `admin-users`, `reports`, `po-suggestions` |

### 📦 I. Inventory Section

1. **Raw Materials (RM)** — a *discrete batch* model:
   - **Master registration ≠ stock**: *+ Add Raw Material* registers a catalog SKU only (`isMaster: true`, `stock: 0`, `batchNumber: ''`, `expiryDate: null`). Stock exists solely because an arrival was logged.
   - **Discrete batch logging**: each incoming arrival becomes an independent `RawMaterial` row (`isMaster: false`); rows are never merged into a running total.
   - **Material-level totals**: a material's real quantity is the sum of every non-master, non-archived row sharing its code. The aggregation and status rules live in [`src/lib/inventory-utils.ts`](../src/lib/inventory-utils.ts).
   - **Chronological sorting**: the RM table orders by `createdAt: desc`, latest shipments on top.
   - **Fields tracked**: Code, Material Name, Brand, Batch No, Stock, Unit (`KG`, `Units`, `Boxes`, `GM`, `LTR`, `ML`, `BAGS`), Reorder Level, Max Stock, Supplier, Storage Location, Expiry Date, Entry Date, Status, Actions (delete only — editing happens in the Master Catalog Hub).

2. **Packaged Materials (PM)** — a *single row per SKU* model:
   - `PackagingMaterial.code` is **unique**. Inward logging updates the existing row's `stock` in place rather than creating a batch row, so PM has no batch history.
   - Fields: Code, Material Name, Brand, Batch Number, Stock, Unit, Reorder Level, Max Stock, Supplier, Location, Expiry, Status, Actions.

### ⚙️ II. Operations Pipeline (5 Dedicated Panels)

1. **RM Issue** — issues raw commodities to a production run. Resolves the source row by `code` + `batchNumber` (falling back to the newest non-archived row for that code), rejects `issuedStock <= 0` and any quantity exceeding that batch's stock, then decrements the batch and writes an `RMIssue` log. `issueFor` is picked from the live Finished Goods list.
2. **Production Log** — records a manufacturing run (FG code & name, batches made, total output, wastage, MFG/expiry, operator). **Automatically adds stock**: updates the matching `FinishedGood` (quantity produced, total stock, batch number, dates, shelf life) or creates the SKU if it does not exist. Blocked against archived SKUs, and the whole thing rolls back if that check fails.
3. **Packaging Issue** — issues packaging supplies against a target FG run, atomically decrementing `PackagingMaterial.stock`.
4. **Finished Goods (FG)** — cold-room inventory for manufactured items, keyed by unique `sku`. **Shelf life is auto-computed** as `expiryDate − mfgDate` in whole days, floored at 0.
5. **Dispatch Log** — customer and distributor shipments (party name, SKU, product, batch code, quantity, date, location, CoA status). **Automatically deducts** `FinishedGood.totalStock` and flips status to `Out of Stock` at zero.

Every one of the five write paths runs inside `prisma.$transaction`, so a stock-check failure leaves no orphaned log row.

### 📋 III. Master Catalog Hub & Safe Archiving ([`MasterCatalogPanel.tsx`](../src/components/MasterCatalogPanel.tsx))

- **2-level navigation**: a 3-card category picker (RM / PM / FG) with live counts, then a detailed catalog table per category showing codes/SKUs, names, units, reorder levels, max stock, current total stock, batch counts, default suppliers and locations.
- **Batch deletion & selection**: checkbox multi-select with a select-all toggle, plus single-item delete, both behind a confirmation dialog that surfaces the stock about to be retired.
- **Safe soft-deletion (`isArchived`)**: archiving sets `isArchived: true` and `status: 'Archived'`. History (RM issues, packaging issues, production logs, dispatches) stays fully intact and queryable; the item disappears from active lists and every inward/issue/dispatch path rejects it by name.
- **Inline master editing ([`EditMaterialModal.tsx`](../src/components/Modals/EditMaterialModal.tsx))**: edits `name`, `brand`, `unit`, `reorderLevel`, `maxStock` across every row of an RM code, writes default `supplier` / `location` to the master row only, then resyncs material-level status. `code` and `sku` are read-only because history references them.

### 📊 IV. Factory Intelligence, PO Suggestions & Reports

- **PO suggestions engine** ([`po-suggestions.ts`](../src/actions/po-suggestions.ts)): selects RM and PM rows where `stock <= reorderLevel` and suggests `max(0, target − stock)`, with `target = maxStock ?? (reorderLevel > 0 ? reorderLevel × 3 : 100)`.
- **Real-time alerts panel**: one card per under-stocked RM/PM row with a "Generate PO" jump to the suggestions panel. The alert badge count is `lowRmCount + lowPmCount`.
- **Reports & FG aging** ([`reports.ts`](../src/actions/reports.ts)): full RM/PM/FG lists, the 100 most recent dispatches, and an FG aging table (`ageDays` since MFG, `daysLeft` to expiry) filtered to in-stock SKUs and sorted by urgency.

### 🛡️ V. Role-Based Access Control (RBAC) & Security

- **Granular permissions ("Discord-style roles")**: 28 permission keys seeded across four modules — `Inventory`, `Operations`, `Add Materials`, `Administration` — assigned to roles through a toggle matrix with per-role color tags.
- **Staff user provisioning**: create accounts with a username, display name, role and password (defaults to `efcpl123` if none is given). API responses always strip `passwordHash`.
- **Authentication**: PBKDF2-HMAC-SHA512 hashing (16-byte random salt, 1 000 iterations, 64-byte key, stored `salt:hash`) in [`auth-utils.ts`](../src/lib/auth-utils.ts). Login writes an HTTP-only `efcpl_session_user` cookie (`sameSite: lax`, `secure` in production, 7-day max age) carrying id, username, name, role name, color tag, permission keys and the admin flag.
- **Login flow**: [`LoginModal`](../src/components/LoginModal.tsx) is two-step — `checkUserLoginStatus(username)` confirms the account exists and returns the display name, then the password step calls `setupFirstTimePassword`, which is currently a straight alias for `loginUser`. There is no separate first-time-password path in the backend today.

> ⚠️ **Permissions are stored and displayed but never enforced.** No server action inspects the session cookie or a permission key before mutating, and `page.tsx` does not gate panels on `currentUser.permissions`. Treat the RBAC module as configuration until enforcement lands (roadmap Phase 9).

---

## 3. Key User Experience & Quality Safeguards
- **Non-negative numeric inputs**: numeric fields carry `min="0"`; change handlers discard negative values.
- **Server-side quantity guards**: inward, issue, production and dispatch actions reject `qty <= 0` and refuse to overdraw stock, returning a descriptive error string rather than throwing to the client.
- **Changeable unit dropdowns**: unit fields prefill from the selected master record and remain editable.
- **No Remarks fields**: every operational modal has had its free-text *Remarks* input removed; the schema columns remain and all write paths persist `null`.
- **Responsive dark theme**: tuned for factory lighting, with a fixed bottom [`MobileNav`](../src/components/MobileNav.tsx) (5 quick tabs plus a full slide-out drawer), a desktop sidebar, a tablet/desktop [`Topbar`](../src/components/Topbar.tsx), and horizontally scrolling tables.
- **Explicit DB error surface**: `page.tsx` catches connection failures on load and renders a `dbError` banner instead of an empty dashboard.

---

## 4. Current Deployment Posture
- **Database**: PostgreSQL on **Neon** (serverless), accessed via Prisma 7 + `@prisma/adapter-pg` over a `pg` `Pool`. The former local SQLite setup has been retired (the leftover `prisma/dev.db` file is unused).
- **Hosting**: **Render** web service; `postinstall: prisma generate` rebuilds the typed client on every deploy.
- **Schema management**: `prisma db push` only — no `prisma/migrations` directory is committed, even though `prisma.config.ts` points at one.
- **Configuration**: a single `DATABASE_URL` env var; the Prisma client throws at construction if it is missing and enables TLS automatically for non-`localhost` hosts.
- **PWA**: `public/manifest.json` exists and `layout.tsx` links it, but the referenced `icon-192.png` / `icon-512.png` are absent and no service worker is registered.
