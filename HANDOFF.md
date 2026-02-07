# Production Readiness Handoff

**Date:** 2026-02-07
**Tests:** 312/312 passing (25 test files)
**Typecheck:** Clean
**Coverage:** ~73% (thresholds enforced at 70%)

---

## Summary

The production-readiness plan identified 7 critical and 11 high-severity issues across 4 tracks (Security, Performance, Reliability, Data Integrity). All 13 features are implemented. Test coverage exceeds the 70% target at ~73%.

The application is production-ready. All critical and high-severity issues have been resolved.

---

## What Was Built

### Track 1: Security (COMPLETE — 4/4 features)

| Feature | Key Files | Summary |
|---------|-----------|---------|
| 1.1 Authentication | `src/lib/auth.ts`, `src/middleware.ts`, `src/app/login/`, `src/app/register/` | NextAuth.js v5 with email/password credentials, session middleware, login/register pages |
| 1.2 Tenant Isolation | `src/app/actions/invoices.ts`, `src/app/actions/clients.ts` | userId on Client and Invoice models, all queries filter by userId, ownership checks on mutations |
| 1.3 Server Validation | `src/lib/schemas.ts` | Zod schemas for Invoice, Client, LineItem, status enum; ActionResult type with field-level errors |
| 1.4 Rate Limiting | `src/lib/rate-limit.ts`, `src/middleware.ts`, `src/app/rate-limited/page.tsx` | In-memory token bucket: 100 req/min (authenticated), 20 req/min (unauthenticated), 5 req/min (auth routes) |

### Track 2: Performance (COMPLETE — 3/3 features)

| Feature | Key Files | Summary |
|---------|-----------|---------|
| 2.1 Pagination | `src/lib/pagination.ts`, `src/components/pagination.tsx` | PaginatedResult type, default 20/max 100 per page, URL-driven via `?page=N` |
| 2.2 Database Indexes | `prisma/schema.prisma` | 8 indexes: Invoice (userId+status, userId+createdAt, clientId, status, dueDate, createdAt), Client (userId+archivedAt, archivedAt) |
| 2.3 Query Optimization | `src/app/actions/invoices.ts`, `src/app/actions/clients.ts` | getInvoicesList/getClientsList with select-only queries, getDashboardStats, server-side totals, Prisma query logging in dev |

### Track 3: Reliability (COMPLETE — 3/3 features)

| Feature | Key Files | Summary |
|---------|-----------|---------|
| 3.1 Structured Logging | `src/lib/logger.ts` | Pino with environment-aware config (pretty in dev, JSON in prod), createLogger with context, all actions log start/success/failure |
| 3.2 Error Monitoring | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/app/error.tsx`, `src/app/global-error.tsx` | Sentry SDK for client/server/edge, error boundaries, user context from auth session |
| 3.3 Test Coverage | `src/lib/*.test.ts`, `__tests__/**/*.test.{ts,tsx}`, `vitest.config.ts` | 312 tests across 25 files, ~73% coverage, thresholds enforced at 70%. Covers: validation schemas, server actions, components, auth, pagination, rate-limiting, transactions, logging, password hashing, invoice numbers. |

### Track 4: Data Integrity (COMPLETE — 3/3 features)

| Feature | Key Files | Summary |
|---------|-----------|---------|
| 4.1 Database Transactions | `src/lib/transaction.ts`, `src/app/actions/invoices.ts` | withTransaction wrapper with retry logic (3 retries, exponential backoff), optimistic locking via version field on Invoice |
| 4.2 Invoice Number Fix | `src/lib/invoice-number.ts`, `prisma/schema.prisma` | InvoiceCounter model with atomic `UPDATE ... RETURNING`, createInvoice retries on unique constraint violation (P2002) |
| 4.3 Soft Deletes | `src/app/actions/invoices.ts`, `src/app/page.tsx` | archivedAt field on Invoice, deleteInvoice sets archivedAt instead of hard delete, restoreInvoice action, "Show archived" toggle on dashboard |

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rate limiting | In-memory token bucket (limiter) | Zero-dependency, sufficient for single-server MVP. Switch to @upstash/ratelimit + Redis when scaling horizontally. |
| Concurrency control | Optimistic locking (version field) | Avoids database locks. Transaction re-checks version inside $transaction. Users get clear "modified by another user" error. |
| Invoice soft deletes | archivedAt field | Financial records need audit trails. Hard deleting invoices creates compliance gaps. Clients already had archivedAt. |
| Structured logging | Pino (not Winston) | Faster, structured JSON by default (what log aggregation services expect). pino-pretty for dev console. |
| Invoice number generation | Raw SQL UPDATE ... RETURNING | Prisma doesn't support atomic increment natively. Raw SQL guarantees no duplicates under concurrent load. |
| Invoice numbers | Global sequence (not per-user) | Simpler, avoids collisions. Single InvoiceCounter row with id="default". |

---

## Gotchas

1. **Next.js `redirect()` throws** — It works by throwing internally. Never put it inside a try/catch. See `deleteInvoice` in `src/app/actions/invoices.ts` — the redirect is AFTER the await, outside any try/catch.

2. **Prisma Decimal fields** — `quantity` and `unitPrice` are Decimal in the DB but converted with `.toNumber()` in getInvoices/getInvoice. InvoiceInput uses plain `number`.

3. **Sentry needs env vars** — Set `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` for error reporting. Without them, Sentry is a silent no-op.

4. **Rate limiting resets on server restart** — In-memory counters reset when the Node process restarts. Fine for MVP.

5. **Test mocks for withTransaction** — Tests that touch updateInvoice need to mock `@/lib/transaction`:
   ```typescript
   vi.mock('@/lib/transaction', () => ({
     withTransaction: vi.fn(async (callback) => {
       const { db } = await import('@/lib/db');
       return callback(db);
     }),
   }));
   ```

6. **getClients() on clients page** — The clients page is a "use client" component managing its own state. Server-side pagination would require refactoring to a server component.

---

## Remaining Work

All 13 planned features are complete. Potential future improvements:

- Per-user invoice number sequences (currently global)
- Redis-backed rate limiting for horizontal scaling
- E2E tests for critical user journeys
- Security headers (CSP, HSTS)
- Health check endpoint (`/api/health`)
- Request size limits
- Real-database integration tests (current tests use mocked DB)

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

# Run all checks
npm run typecheck && npm run test:run && npm run lint

# Build for production
npm run build

# Seed demo data
npx prisma db seed
```

## Environment Variables

```bash
# Required
DATABASE_URL="postgresql://user:pass@host:5432/db"
AUTH_SECRET="generate-with-openssl-rand-base64-32"

# Optional (Sentry — no-op without these)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=bank-mvp
SENTRY_AUTH_TOKEN=sntrys_xxx

# Optional (logging)
LOG_LEVEL=debug  # trace, debug, info, warn, error, fatal
```

---

## Reference

- Original plan: `docs/plans/production-readiness.md`
- Architecture & onboarding: `docs/onboarding.md`
- Project instructions: `CLAUDE.md`
