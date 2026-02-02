# Invoice Management MVP - Onboarding Guide

This document covers the architecture and design decisions behind the Invoice Management MVP. It serves as both onboarding material and technical reference - explaining not just *what* the app does, but *why* it's built the way it is.

## Overview & Tech Stack

**What it does:** A simple invoice management system for creating, tracking, and managing invoices for clients.

**Stack:**
- **Next.js 16** (App Router) - React framework with server-side rendering
- **React 19** - UI library
- **PostgreSQL** - Relational database
- **Prisma 6** - TypeScript ORM
- **Tailwind 4** - Utility-first CSS

## Directory Structure

```
src/
├── app/                    # Routes and pages (App Router)
│   ├── actions/            # Server actions (all mutations)
│   │   ├── invoices.ts     # Invoice CRUD operations
│   │   └── clients.ts      # Client CRUD operations
│   ├── invoices/           # Invoice routes
│   │   ├── new/            # Create invoice
│   │   └── [id]/           # Edit & preview invoice
│   └── clients/            # Client routes
├── components/             # UI components
│   ├── ui/                 # Primitive UI components (button, input, etc.)
│   ├── invoice-form.tsx    # Invoice create/edit form
│   ├── client-form.tsx     # Client create/edit form
│   ├── client-selector.tsx # Dropdown for selecting clients
│   └── status-badge.tsx    # Visual status indicator
├── lib/                    # Utilities
│   ├── db.ts               # Prisma client singleton
│   ├── validation.ts       # Invoice validation functions
│   ├── clients-validation.ts
│   └── utils.ts            # Formatting helpers
└── test/                   # Test utilities
prisma/
├── schema.prisma           # Database schema
├── seed.ts                 # Demo data seeding
└── scripts/                # Migration helpers
```

## Data Model

Three models with clear ownership hierarchy:

```
Client (1) ──────> (many) Invoice (1) ──────> (many) LineItem
```

### Client
```prisma
model Client {
  id          String    @id @default(cuid())
  name        String
  email       String    @unique
  phone       String?
  address     String?
  archivedAt  DateTime?           # Soft delete
  invoices    Invoice[]
}
```

### Invoice
```prisma
model Invoice {
  id            String     @id @default(cuid())
  invoiceNumber String     @unique    # Auto-generated: INV-001, INV-002...

  # Reference to client
  clientId      String?
  client        Client?    @relation(...)

  # Snapshot fields (copied from client at invoice creation)
  clientName    String
  clientEmail   String
  clientPhone   String?
  clientAddress String?

  status        String     @default("draft")  # draft, sent, paid
  issueDate     DateTime   @default(now())
  dueDate       DateTime
  notes         String?
  lineItems     LineItem[]
}
```

### LineItem
```prisma
model LineItem {
  id          String  @id @default(cuid())
  invoiceId   String
  description String
  quantity    Decimal
  unitPrice   Decimal
  invoice     Invoice @relation(..., onDelete: Cascade)
}
```

> **Why Cascade Delete?** When an invoice is deleted, its line items are meaningless orphans. The business logic is clear: line items exist only in the context of their invoice.

## Data Flow

```
┌─────────────────┐     ┌────────────────┐     ┌───────────────┐
│  UI Component   │────>│   Validation   │────>│ Server Action │
│ (invoice-form)  │     │ (validation.ts)│     │  "use server" │
└─────────────────┘     └────────────────┘     └───────┬───────┘
                                                       │
                                                       v
┌─────────────────┐     ┌────────────────┐     ┌───────────────┐
│ Cache Invalidation│<──│revalidatePath()│<────│    Prisma     │
│   (automatic)   │     │                │     │  (db.ts)      │
└─────────────────┘     └────────────────┘     └───────┬───────┘
                                                       │
                                                       v
                                               ┌───────────────┐
                                               │  PostgreSQL   │
                                               └───────────────┘
```

## Key Architectural Patterns

### 1. Server Actions for Mutations

All database writes go through server actions in `src/app/actions/`.

```typescript
// src/app/actions/invoices.ts
"use server";

export async function createInvoice(data: InvoiceInput) {
  const invoice = await db.invoice.create({ ... });
  revalidatePath("/");
  return invoice.id;
}
```

**Why this pattern?**
- Co-located with usage - no separate API route files
- Type-safe - input types flow from client to server
- No fetch boilerplate - just import and call
- Built-in revalidation - `revalidatePath()` triggers cache invalidation

**Trade-off:** Less control over HTTP semantics (status codes, headers). For this MVP, that's acceptable.

---

### 2. Client Data Snapshots

When an invoice is created, client data is *copied* into the invoice record:

```typescript
// Invoice stores both the reference AND a snapshot
clientId: data.clientId,        // Reference (for filtering)
clientName: data.clientName,    // Snapshot
clientEmail: data.clientEmail,  // Snapshot
clientPhone: data.clientPhone,  // Snapshot
clientAddress: data.clientAddress, // Snapshot
```

**Why this pattern?**
- **Invoice is a legal document** - must reflect point-in-time data
- Client can change name/address later without affecting past invoices
- Historical accuracy preserved for accounting/legal compliance

**Trade-off:** Some data duplication. Worth it for data integrity.

---

### 3. Computed Overdue Status

Database stores only three statuses: `draft`, `sent`, `paid`.

"Overdue" is computed at render time:

```typescript
// src/app/page.tsx:126-130
status={
  invoice.status === 'sent' && new Date(invoice.dueDate) < new Date()
    ? 'overdue'
    : invoice.status as 'draft' | 'sent' | 'paid'
}
```

**Why this pattern?**
- Always accurate without cron jobs or batch updates
- No stale data - always reflects current time
- Simple logic: `status === "sent" && dueDate < today`

**Trade-off:** Computed on every render. Negligible cost - it's just a date comparison.

---

### 4. Single Prisma Client (globalThis caching)

```typescript
// src/lib/db.ts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

**Why this pattern?**
- Next.js hot-reload creates new module instances on each file change
- Without caching: connection pool exhaustion in dev (too many connections)
- Production: Single instance anyway (modules only load once)

---

### 5. Pure Validation Functions

```typescript
// src/lib/validation.ts
export type ValidationResult = {
  valid: boolean
  field: string
  message: string
}

export function validateDueDate(invoiceDate: Date, dueDate: Date): ValidationResult {
  const invoiceTime = new Date(invoiceDate).setHours(0, 0, 0, 0)
  const dueTime = new Date(dueDate).setHours(0, 0, 0, 0)

  if (dueTime < invoiceTime) {
    return { valid: false, field: 'dueDate', message: 'Due date must be on or after invoice date' }
  }
  return { valid: true, field: 'dueDate', message: '' }
}
```

**Why this pattern?**
- Testable without DOM or React dependencies
- Reusable server-side if needed
- Returns structured errors (not throws) - caller decides how to handle
- Consistent `{valid, field, message}` shape for all validations

---

### 6. European Decimal Input Support

```typescript
// src/components/invoice-form.tsx:25
const parseNum = (val: string) => {
  const normalized = val.replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
};
```

Form accepts both `1.50` and `1,50` as valid decimal input. Normalized before storage.

## Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `page.tsx` (dashboard) | Fetch invoices, calculate stats, render invoice table |
| `InvoiceForm` | State management, validation, submit to server action |
| `ClientSelector` | Dropdown for existing clients, passes full client object up |
| `StatusBadge` | Visual status indicator with icons and colors |
| `StatCard` | Dashboard metric display |
| Server Actions | Database operations, error handling, cache invalidation |

## Route Structure

```
/                       Dashboard (invoice list, stats)
/invoices/new           Create invoice
/invoices/[id]          Edit invoice
/invoices/[id]/preview  Print-ready invoice view

/clients                Client list
/clients/new            Create client
/clients/[id]           Edit client
```

## Design Decisions

### Why Server Actions over API Routes?

**Server Actions:**
- Import function directly from `@/app/actions/invoices`
- Call like a regular async function
- Automatic serialization/deserialization
- Built-in error handling with try/catch

**API Routes would require:**
- Separate route handler file
- fetch() calls with URL strings
- Manual JSON serialization
- HTTP error code handling

For a simple CRUD app, server actions reduce boilerplate significantly.

### Why Client Data Snapshots?

Consider: Client "Acme Corp" sends an invoice. Later, they rebrand to "Acme Inc". Without snapshots, all historical invoices would show "Acme Inc" - incorrect for legal/accounting purposes.

The snapshot pattern ensures invoices remain immutable records of the transaction at that point in time.

### Why Computed Status?

Alternative: Store overdue status in DB, run cron job to update.

Problems with cron approach:
- Stale data between runs
- Additional infrastructure (scheduler)
- Race conditions if invoice viewed during update

Computed approach: Zero infrastructure, always accurate, trivial CPU cost.

### Why Single globalThis Prisma Client?

```
Hot reload → New module instance → New PrismaClient → New connection pool
× 100 file saves → 100 connection pools → Database: "too many connections"
```

The globalThis pattern reuses the same client across hot reloads.

### Why Pure Validation Functions?

React component testing is harder (needs DOM, event simulation). Pure functions are trivial to test:

```typescript
test('due date before invoice date is invalid', () => {
  const result = validateDueDate(new Date('2024-01-15'), new Date('2024-01-10'));
  expect(result.valid).toBe(false);
});
```

## Common Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript type checking
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once

npx prisma db push   # Apply schema changes
npx prisma generate  # Regenerate client
npx prisma db seed   # Seed demo data
```

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR to master:
1. PostgreSQL 16 service container
2. Lint → Typecheck → Tests → DB Push → Build
3. All checks must pass before merge
