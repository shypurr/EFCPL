# 03. System Architecture & UI/UX Design Specifications

## 1. System Design Principles

The EFCPL MES platform is built upon three foundational design tenets:
1. **Discrete Batch Traceability**: Every raw agricultural commodity arrival is recorded as an independent batch with its own arrival timestamp, batch number, supplier, and quantity. Stock entries are not merged, providing complete lot-level auditability.
2. **Strict Operational Constraints**: Zero negative numbers allowed anywhere in the system (inputs, tables, calculations).
3. **Dynamic Relational Bindings**: Forms dynamically inspect related inventory states (e.g. "Issue For" selectors bind to live Finished Goods records).

---

## 2. Inventory & Operations Data Flow

```
[ Inward Raw Material ] ---> [ Discrete RM Batch Record (createdAt desc) ]
                                      |
                                      v
                                [ RM Issue ] ---> [ Target FG Selection ]
                                      |
                                      v
                                [ Production Log ] ---> [ Manufactured FG Batch ]
                                      |                         |
                                [ Packaging Issue ]             v
                                      |                 [ Cold Storage Stock ]
                                      v                         |
                               [ Completed FG ]                 v
                                                          [ Dispatch Log ]
```

---

## 3. UI/UX & Interaction Patterns

### 3.1 Discrete Raw Materials Log & Reverse-Chronological Table
* **Separate Batch Rows**: When an operator logs an arrival for an existing raw material (e.g., `RM001` - Refined Sugar), a new record is created in the `RawMaterial` table rather than incrementing a single aggregated number.
* **Chronological Ordering**: The table queries with `orderBy: { createdAt: 'desc' }`, ensuring the newest incoming entries appear at the very top.
* **Entry Date Column**: Explicit timestamp column displaying arrival date.

### 3.2 Universal Non-Negative Numeric Controls
* **Input Level**: All numeric inputs include `min="0"`, preventing negative stepping with browser arrows.
* **Event Handlers**: `onChange` handlers inspect incoming keystrokes and discard negative values or minus signs (`if (Number(val) < 0) return;`).
* **Server Action Validation**: Server actions enforce strictly positive quantities for issuances, productions, inward arrivals, and dispatches (`qty > 0`).

### 3.3 Dynamic Dropdown Bindings & Changeable Units
* **Target FG Dropdown**: The `IssueModal` and `PackagingIssueModal` dynamically populate the "Issue For (Target FG)" field with existing finished goods, showing current SKU, product name, and available finished stock.
* **Arrived RM Unit Selector**: Auto-fills the default unit from master definitions upon selecting an RM code, but allows operators to override the unit via a `<select>` dropdown (`KG`, `Units`, `Boxes`).
* **Integrated Unit Badges**: Inputs (such as "Qty to Issue", "Dispatch Qty", and "Received Qty") feature integrated inline unit badges to eliminate overflow issues on narrow viewports.

---

## 4. Multi-Device Responsive Architecture

* **Desktop Viewports ($\ge 1024\text{px}$)**: Full persistent left sidebar, expansive multi-column data tables, and centered dual-column modal dialogues.
* **Tablet Viewports ($768\text{px} - 1023\text{px}$)**: Adaptive topbar with quick search and status filters, stacked modal grids, and horizontally scrollable tables.
* **Mobile Viewports ($< 768\text{px}$)**: Fixed bottom `MobileNav` navigation bar, touch-friendly $(44\text{px}+)$ action buttons, full-width modal layouts, and responsive stat cards.
