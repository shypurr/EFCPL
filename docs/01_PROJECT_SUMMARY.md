# 01. Project Summary & Context — EFCPL Inventory Management System

## 1. Project Background
**EFCPL (Exotic Food Processing Private Limited)** is a food manufacturing and processing company based out of Pune, Maharashtra, India. The company handles perishable and non-perishable raw agricultural inputs, finished packaged food goods, packaging supplies, and cold-chain storage operations.

Currently, inventory tracking relies on static desktop files or localized browser tools. This project aims to transform the static dashboard into a **modern, multi-device, multi-user, production-grade cloud application (PWA)** accessible seamlessly on mobile smartphones, tablets, and desktop workstations.

---

## 2. Core Business Goals
1. **Real-time Synchronization**: Every stock movement (Goods Receipt Note, Material Issue to Production, Sales Dispatch) must sync instantly across all team members (Store Managers, Production Supervisors, Warehouse Operators, Executive Admins).
2. **Zero Hardcoding & High Extensibility**:
   - Categorizations, unit types (KG, LTR, Cartons, Rolls), storage zones/cold stores, status badges, CoA statuses, and panel definitions must be dynamically data-driven via settings and configuration models.
   - Adding a new product category, unit, storage condition, or user role must never require modifying frontend source code.
3. **Quality & Expiry Compliance**:
   - Automated rule engine for near-expiry alerts ($\le 30$ and $\le 60$ days).
   - Cold storage temperature logs (e.g. $-18^\circ\text{C}$ Deep Frozen, $0\text{--}4^\circ\text{C}$ Chilled, Ambient).
   - Certificate of Analysis (CoA) tracking for raw materials (Approved, Pending, Rejected).
4. **Financial & Operational Intelligence**:
   - Automated inventory valuation in ₹ (Lakhs / Crores).
   - Automated Purchase Order (PO) recommendations based on dynamic reorder levels and Lead Times.
   - Finished Goods Aging and Dead-Stock risk analytics.

---

## 3. Key Functional Modules

| Module | Core Responsibility |
| :--- | :--- |
| **Dashboard & KPIs** | Live operational metrics, low-stock warnings, near-expiry alerts, and top 10 movement activity feeds. |
| **Alerts & Notification Engine** | Rule-driven alerts for low stock, expiring batches, pending CoA releases, and overcommitted sales orders. |
| **Raw Materials (RM)** | SKU master, current stock, reorder levels, supplier details, lead time, purchase rates (₹), CoA status, expiry. |
| **Finished Goods (FG)** | SKU master, production batches, produced vs dispatched, reserved stock, shelf-life, cold store locations. |
| **Packaging Materials (PM)** | Cartons, labels, pouches, bottles, shrink wraps, linked SKUs, MOQs, supplier lead times. |
| **Stock Movements (GRN / Issues / Dispatches)** | Goods Receipt Notes (inward), Material Issues to production (outward), Customer dispatches. |
| **PO Suggestions** | Auto-calculated replenishment recommendations based on dynamic stock thresholds and lead times. |
| **Analytics & Reports** | Stock valuation, consumption logs, aging/dead stock analysis, and inventory turn reports. |
| **System Settings & Customization** | Dynamic lookup masters for categories, units, storage zones, suppliers, department tags, and status workflows. |

---

## 4. Architectural Principles
- **API-First & Server Actions**: All data transactions go through validated server endpoints / server actions.
- **Strict Type Safety**: TypeScript end-to-end (Database schema $\rightarrow$ ORM $\rightarrow$ Server Actions $\rightarrow$ React Components).
- **Mobile-First Responsive PWA**: Touch-friendly UI designed for warehouse smartphones with desktop workspace compatibility.
- **Auditability**: Every stock mutation records `who`, `when`, `what`, and `why` with system audit logs.
