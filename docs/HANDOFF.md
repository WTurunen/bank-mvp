# Production Readiness Handoff

## Overview

This document covers all production-readiness work completed on the `claude/production-readiness-review-VDoP8` branch and what remains. Use this to continue the work.

**Branch:** `claude/production-readiness-review-VDoP8`
**Tests:** 155/155 passing
**Typecheck:** Clean

---

## What Was Done (11 of 13 Features)

### Track 1: Security (COMPLETE)

| Feature | Status | Key Files |
|---------|--------|-----------|
| 1.1 Authentication | Done (prior) | `src/lib/auth.ts`, `src/middleware.ts`, `src/app/login/`, `src/app/register/` |
| 1.2 Tenant Isolation | Done (prior) | All actions filter by `userId` from `getCurrentUserId()` |
| 1.3 Server Validation | Done (prior) | `src/lib/schemas.ts` (Zod schemas for invoice, client, lineItem, status) |
| 1.4 Rate Limiting | Done | `src/lib/rate-limit.ts`, `src/middleware.ts`, `src/app/rate-limited/page.tsx` |

**1.4 Rate Limiting details:**
- In-memory token bucket algorithm (no external dependencies)
- Three tiers: 100 req/min (authenticated), 20 req/min (unauthenticated), 5 req/min (auth routes like login/register)
- Integrated into the existing Next.js middleware alongside auth checks
- Dedicated `/rate-limited` page shown when limit exceeded

### Track 2: Performance (2 of 3 done)

| Feature | Status | Key Files |
|---------|--------|-----------|
| 2.1 Pagination | Done | `src/lib/pagination.ts`, `src/components/pagination.tsx`, `src/app/page.tsx` |
| 2.2 Database Indexes | Done | `prisma/schema.prisma` |
| **2.3 Query Optimization** | **REMAINING** | See "What Remains" below |

**2.1 Pagination details:**
- `PaginatedResult<T>` type with `data` + `pagination` metadata
- Helper functions: `parsePaginationParams()`, `calculateSkipTake()`, `calculatePaginationMeta()`
- Default page size: 20, max: 100
- `getInvoices()` now returns `{ data, pagination }` instead of raw array
- Pagination component with page numbers, prev/next, ellipsis for large sets
- URL-driven via `?page=2` search params

**2.2 Database Indexes added:**
- `Invoice`: `@@index([userId, status])`, `@@index([userId, createdAt])`, `@@index([clientId])`, `@@index([status])`, `@@index([dueDate])`, `@@index([createdAt])`
- `Client`: `@@index([userId, archivedAt])`, `@@index([archivedAt])`

### Track 3: Reliability (2 of 3 done)

| Feature | Status | Key Files |
|---------|--------|-----------|
| 3.1 Structured Logging | Done | `src/lib/logger.ts` |
| 3.2 Error Monitoring | Done | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/app/error.tsx`, `src/app/global-error.tsx` |
| **3.3 Test Coverage** | **REMAINING** | See "What Remains" below |

**3.1 Structured Logging details:**
- Pino logger with environment-aware config (pretty in dev, JSON in prod)
- `createLogger({ action, userId, ...context })` creates child loggers per operation
- All server actions (invoices + clients) now log: action start, success, failures
- Includes `logRequest()` and `logError()` utility functions

**3.2 Error Monitoring details:**
- Sentry SDK configured for client, server, and edge runtimes
- `next.config.ts` wrapped with `withSentryConfig`
- `src/app/error.tsx` - route-level error boundary reporting to Sentry
- `src/app/global-error.tsx` - root error boundary
- `src/components/error-boundary.tsx` - reusable error boundary component
- Sentry user context set from auth session in `src/lib/auth.ts`
- **Note:** You need to set `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` environment variables for it to actually report. Without them, Sentry is a no-op.

### Track 4: Data Integrity (COMPLETE)

| Feature | Status | Key Files |
|---------|--------|-----------|
| 4.1 Database Transactions | Done | `src/lib/transaction.ts`, `src/app/actions/invoices.ts` |
| 4.2 Invoice Number Fix | Done | `src/lib/invoice-number.ts`, `prisma/schema.prisma` (InvoiceCounter model) |
| 4.3 Soft Deletes | Done | `src/app/actions/invoices.ts`, `src/app/page.tsx` |

**4.1 Database Transactions details:**
- `withTransaction()` wrapper with retry logic for deadlocks (Prisma P2034)
- Exponential backoff: 100ms, 200ms, 400ms (3 retries)
- Configurable timeout, max wait, isolation level
- `updateInvoice` wrapped in transaction with optimistic locking (`version` field)
- Version check inside transaction prevents concurrent overwrites

**4.2 Invoice Number Fix details:**
- New `InvoiceCounter` model in schema for atomic counter
- `getNextInvoiceNumber(userId)` uses `UPDATE ... RETURNING` (raw SQL) for atomicity
- Falls back to `INSERT ... ON CONFLICT DO NOTHING` for first-time initialization
- `createInvoice` retries up to 3 times on unique constraint violation (P2002)

**4.3 Soft Deletes details:**
- `archivedAt DateTime?` field on Invoice model
- `deleteInvoice()` now sets `archivedAt = new Date()` instead of hard deleting
- `restoreInvoice(id)` function added to un-archive
- All queries filter `archivedAt: null` by default
- Dashboard has "Show archived" / "Hide archived" toggle via `?showArchived=true`
- Paid invoices cannot be archived (returns error)

---

## What Remains (2 Features)

### Feature 2.3: Query Optimization (8 tasks)

**Plan file:** `docs/plans/implementation/features/2.3-query-optimization.md`

**Goal:** Reduce data fetched from database. Currently `getInvoices()` does `include: { lineItems: true }` which loads all line item rows for every invoice on the dashboard. The dashboard only needs totals, not individual items.

**Tasks:**

1. **2.3.1a - Dashboard statistics query** (`src/app/actions/invoices.ts`)
   - Create `getDashboardStats()` function that calculates outstanding/paid/overdue totals in a single optimized query instead of loading all invoices client-side
   - Currently the dashboard loads ALL invoice data and calculates stats in `src/app/page.tsx` lines 35-45

2. **2.3.1b - Calculate invoice totals in database** (`src/app/actions/invoices.ts`)
   - Create `getInvoiceTotals(invoiceIds)` using raw SQL: `SUM(quantity * "unitPrice")`
   - Needs `import { Prisma } from "@prisma/client"` for `Prisma.join()`

3. **2.3.2a - Optimize getInvoices for list views** (`src/app/actions/invoices.ts`)
   - Create `getInvoicesList()` that uses `select` instead of `include` to only fetch fields needed for the table (id, invoiceNumber, clientName, status, dueDate + calculated total)
   - This avoids loading full lineItems data for list views

4. **2.3.2b - Update dashboard to use optimized queries** (`src/app/page.tsx`)
   - Switch from `getInvoices` to `getInvoicesList` + `getDashboardStats()`
   - Remove client-side stat calculation (lines 35-45 of page.tsx)

5. **2.3.3a - Optimize getClients for list views** (`src/app/actions/clients.ts`)
   - Create `getClientsList()` with `select` instead of full `include`
   - Note: `getClients()` currently returns to a "use client" page, so the clients page may need more refactoring

6. **2.3.4a - Optimize getInvoice for preview** (`src/app/actions/invoices.ts`)
   - Ensure `getInvoice()` includes client relationship data in one query (add `client: { select: { id, name, email } }`)

7. **2.3.5a - Connection pooling** (`src/lib/db.ts`)
   - Add logging config to PrismaClient: `log: ["query", "error", "warn"]` in dev, `["error"]` in prod
   - Add `?connection_limit=10&pool_timeout=30` to DATABASE_URL docs

8. **2.3.5b - Query logging verification** (no code change, just verify 2.3.5a works)

**Important notes for 2.3:**
- The plan references `userId` filtering (tenant isolation) - this is already implemented
- The plan references `PaginationParams` - this is already implemented in `src/lib/pagination.ts`
- You need to remove the `getCurrentUserId()` lines from the plan examples only if auth is not present. It IS present, so keep them.

### Feature 3.3: Test Coverage (14 tasks)

**Plan file:** `docs/plans/implementation/features/3.3-test-coverage.md`

**Goal:** Increase test coverage to 70%+ with tests for validation schemas, server actions, and auth flows.

**Current test state:**
- 9 test files, 155 tests, all passing
- Existing tests: `__tests__/actions/invoices.test.ts`, `__tests__/components/*.test.tsx`, `src/lib/utils.test.ts`
- Tests use Vitest + happy-dom environment
- Server action tests mock `@/lib/auth`, `@/lib/db`, `next/cache`, `next/navigation`

**Tasks:**

1. **3.3.1a - Test database setup** - Create `src/test/db-setup.ts` for integration tests with real DB
2. **3.3.1b - Test factories** - Create `src/test/factories.ts` with `createTestUser()`, `createTestClient()`, `createTestInvoice()`
3. **3.3.2a - Invoice validation tests** - Create `src/lib/schemas.test.ts` testing `invoiceSchema`, `lineItemSchema`, `invoiceStatusSchema`
4. **3.3.2b - Client validation tests** - Add `clientSchema` tests to `src/lib/schemas.test.ts`
5. **3.3.2c - Auth validation tests** - Create `src/lib/auth-validation.test.ts` testing `validateEmail`, `validatePassword`, `validateName`
6. **3.3.3a - Mock auth helper** - Create `src/test/mock-auth.ts`
7. **3.3.3b - createInvoice action tests** (integration)
8. **3.3.3c - updateInvoice action tests** (integration)
9. **3.3.3d - deleteInvoice action tests** (integration)
10. **3.3.4a - createClient action tests** (integration)
11. **3.3.4b - updateClient action tests** (integration)
12. **3.3.4c - archiveClient action tests** (integration)
13. **3.3.5a - Coverage reporting** - Add `coverage` config to vitest
14. **3.3.5b - Coverage thresholds** - Enforce 70% minimum

**Important notes for 3.3:**
- The plan's integration tests (3.3.3b-3.3.4c) assume a test database. You need `TEST_DATABASE_URL` in your env, or these tests need to use mocks like the existing ones in `__tests__/actions/invoices.test.ts`
- The existing mock pattern is well established: mock `@/lib/db` with vi.fn() mocks, mock `@/lib/auth` to return a fixed userId, mock `next/cache` and `next/navigation`
- The validation tests (3.3.2a-3.3.2c) are pure unit tests that don't need any mocking - good to start with
- Existing test for `withTransaction` mock: `vi.fn(async (callback) => { const { db } = await import('@/lib/db'); return callback(db); })` - use this pattern
- `deleteInvoice` calls `redirect("/")` which throws in Next.js - tests must handle this (see existing test in `__tests__/actions/invoices.test.ts`)

---

## Architecture Decisions Made

### Why in-memory rate limiting (not Redis)?
The MVP doesn't need distributed rate limiting yet. In-memory token bucket is zero-dependency and sufficient for a single-server deployment. Switch to `@upstash/ratelimit` + Redis when you scale horizontally.

### Why optimistic locking (not pessimistic)?
`version` field on Invoice avoids database locks for concurrent edits. The transaction wrapper re-checks the version inside the transaction. Users get a clear "modified by another user" error instead of silent data loss.

### Why soft deletes for invoices only?
Invoices are financial records with compliance implications. Clients already had soft deletes (`archivedAt`). Hard deleting invoices would create audit gaps.

### Why Pino (not Winston)?
Pino is faster and produces structured JSON by default, which is what log aggregation services (Datadog, CloudWatch, etc.) expect. The `pino-pretty` dev transport gives readable console output.

### Why raw SQL for invoice numbers?
Prisma doesn't support `UPDATE ... RETURNING` or `INSERT ... ON CONFLICT` natively. The `getNextInvoiceNumber()` function uses `$executeRaw` and `$queryRaw` to guarantee atomic increment without race conditions.

---

## How to Run

```bash
# Install dependencies
npm install

# Set up database (needs DATABASE_URL in .env)
npx prisma db push
npx prisma generate

# Run dev server
npm run dev

# Run all checks (do this before pushing)
npm run typecheck && npm run test:run && npm run lint

# Seed demo data
npx prisma db seed
```

## Gotchas

1. **Next.js `redirect()` throws** - It works by throwing internally. Never put it inside a try/catch block. See `deleteInvoice` in `src/app/actions/invoices.ts` line 275 - the redirect is AFTER the await, outside any try/catch.

2. **Prisma Decimal fields** - `quantity` and `unitPrice` are `Decimal` in the DB but the app converts them with `.toNumber()` in `getInvoices()` and `getInvoice()`. The `InvoiceInput` type uses plain `number`.

3. **Sentry needs env vars** - `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` must be set for error reporting to work. Without them, the integration is a silent no-op (no errors, just no reporting).

4. **Rate limiting resets on server restart** - Since it's in-memory, all rate limit counters reset when the Node process restarts. This is fine for MVP.

5. **Invoice numbers are global, not per-user** - The `InvoiceCounter` model has a single row (`id = "default"`). All users share the sequence. The plan suggested per-user sequences but global is simpler and avoids invoice number collisions.

6. **`getClients()` has no pagination** - The clients page is a "use client" component that manages its own state. Adding server-side pagination would require refactoring it to a server component. This was intentionally deferred.

7. **Test mocks for `withTransaction`** - If you write new tests that touch `updateInvoice`, you need to mock `@/lib/transaction` so the callback receives the mocked `db` object. Pattern:
   ```typescript
   vi.mock('@/lib/transaction', () => ({
     withTransaction: vi.fn(async (callback) => {
       const { db } = await import('@/lib/db');
       return callback(db);
     }),
   }));
   ```

---

## Commit History

```
feat: add database indexes and schema fields for production readiness
feat: add rate limiting to prevent abuse and brute force attacks
feat: add database transactions and fix invoice number race condition
chore: add tsconfig.tsbuildinfo to gitignore
feat: add archivedAt field to Invoice for soft deletes
feat: add structured logging with Pino
feat: add Sentry error monitoring with error boundaries
feat: add pagination and soft deletes for invoices
```
