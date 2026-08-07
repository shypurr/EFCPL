# 02. Technical Stack Specification — EFCPL Inventory Management System

## 1. Overview
This document specifies the software architecture, libraries, tools, database providers, and hosting infrastructure selected for the production-grade EFCPL Inventory Management System.

---

## 2. Technology Stack Matrix

| Architecture Layer | Technology | Version / Specification | Rationale & Capability |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | 14.x+ | Fullstack React framework providing Server-Side Rendering (SSR), Server Components, and optimized client bundles. |
| **Language** | TypeScript | 5.x+ | Strict static typing across database models, API payloads, and UI component props to eliminate runtime bugs. |
| **Styling & Design** | Tailwind CSS | 3.x+ | Utility-first CSS framework for ultra-fast, mobile-first responsive layout design and dark/light system colors. |
| **UI Components** | Shadcn UI & Radix Primitives | Latest | Accessible, unstyled UI primitives for modals, tabs, dropdowns, data tables, toasts, and dialogs. |
| **Icons** | Lucide React | Latest | Crisp, customizable vector icons optimized for mobile touch targets. |
| **Progressive Web App (PWA)**| `next-pwa` | Latest | Web app manifest + Service Worker caching. Enables "Add to Home Screen" on iOS & Android, offline fallback, and camera access for QR/Barcode scanning. |
| **Database** | PostgreSQL | 15.x+ hosted on **Neon (`neon.tech`)** | Serverless Postgres database featuring **instant zero-copy branching**, auto-scaling, and transactional schema migrations. |
| **Database ORM** | Prisma ORM | 5.x+ | Type-safe SQL query builder and automated database migration engine. |
| **Authentication & RBAC** | Clerk / NextAuth.js | Latest | Secure session management, password/OTP login, and Role-Based Access Control (*Admin*, *Store Manager*, *Production Supervisor*, *Warehouse Staff*). |
| **State Management** | React Query / TanStack Query & Zustand | 5.x+ | Client-side cache synchronization, optimistic updates, and instant UI re-render on mutation. |
| **Hosting & Deployment** | Vercel | Global Serverless CDN | Zero-cold-start serverless execution, global edge CDN, native Next.js optimization, and continuous deployment from GitHub. |

---

## 3. Database & Hosting Infrastructure

```
                                    +-----------------------------------+
                                    |       Vercel (Global Edge CDN)    |
                                    |   Next.js 14+ Frontend & APIs     |
                                    +-----------------+-----------------+
                                                      |
                                                      | Secure TLS Connection
                                                      v
                                    +-----------------+-----------------+
                                    |     Neon.tech (Serverless DB)     |
                                    |   PostgreSQL + Branching Engine   |
                                    +-----------------------------------+
```

### Why Neon (PostgreSQL)?
1. **Transactional DDL Migrations**: Schema alterations (`ALTER TABLE`) occur within isolated transactions. Failed updates roll back automatically without corrupting schema state.
2. **Database Branching**: Allows creation of instant zero-copy staging branches (`staging-v2`, `dev-feature-x`) to test schema changes before applying them to production.
3. **JSONB Indexing**: Supports storing unstructured/custom material specifications in `JSONB` columns with high-performance indexing.

### Why Vercel?
1. **Zero Cold Starts**: Serverless execution ensures instant $(<100\text{ms})$ responses 24/7 without the 50-second wake-up delays seen in container platforms.
2. **Native Next.js Optimization**: Instant image optimization for product pictures, edge middleware for role authentication, and automatic caching.

---

## 4. Environment Configuration
The application will operate using environment variable isolation:

```env
# Database
DATABASE_URL="postgresql://user:password@ep-cool-app-123456.pooler.eastus2.azure.neon.tech/efcpl_db?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-cool-app-123456.neon.tech/efcpl_db?sslmode=require"

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# App Settings
NEXT_PUBLIC_APP_URL="https://inventory.efcpl.com"
```
