# Production Readiness Plan: Invoice Management MVP

## Current State Assessment

**Critical Issues (7):**
- No authentication or authorization - anyone can access any data
- No server-side input validation - trusts client data
- No multi-tenancy - horizontal authorization bypass possible
- No database transactions - concurrent operations can corrupt data
- Invoice number race condition - duplicates possible under load
- Exposed database credentials in .env (may be in git history)
- No rate limiting - DoS attack vector

**High Severity (11):**
- No pagination - dashboard fetches ALL invoices
- No logging or audit trail - can't debug or comply with regulations
- Minimal test coverage (~5%) - only utils.test.ts exists
- No database indexes on frequently queried fields
- No error monitoring (Sentry, etc.)
- Generic error handling leaks system info
- N+1 query potential with lineItems
- No request size limits
- Hard deletes on invoices (compliance risk)
- Client-side total calculation (tamperable)
- No database constraints on status enum

---

## Prioritized TODO

### Phase 1: Stop the Bleeding (Security Critical)
1. **Add authentication** - NextAuth.js with email/password or OAuth
2. **Add tenant isolation** - `userId`/`tenantId` on all models, enforce in all queries
3. **Server-side validation** - Zod schemas for all server actions
4. **Status enum validation** - Only allow draft/sent/paid
5. **Rate limiting** - Middleware to prevent abuse
6. **Rotate database credentials** - If .env was ever committed

### Phase 2: Data Integrity
7. **Database transactions** - Wrap updateInvoice in `db.$transaction()`
8. **Fix invoice number race** - Use database sequence or atomic increment
9. **Add database indexes** - clientId, status, dueDate, createdAt
10. **Pagination** - Cursor-based, default limit 50
11. **Input length limits** - maxLength on all text fields

### Phase 3: Observability
12. **Structured logging** - Pino/Winston with request context
13. **Error monitoring** - Sentry integration
14. **Audit trail** - Log who changed what, when
15. **Health checks** - /api/health endpoint for monitoring

### Phase 4: Testing & Reliability
16. **Unit tests** - Server actions, validation logic
17. **Integration tests** - Database operations, auth flows
18. **E2E tests** - Critical user journeys
19. **CI/CD hardening** - Block deploys if tests fail

### Phase 5: Compliance & Polish
20. **Soft deletes for invoices** - archivedAt instead of delete
21. **Data retention policy** - GDPR compliance
22. **Security headers** - CSP, HSTS, etc.
23. **Request size limits** - Next.js config

---

## Chosen Approach: Parallel Workstreams

Four independent tracks that can be worked simultaneously. **Critical rule:** Do NOT deploy to production until Track 1 (Security) completes Phase 1.

```
Track 1 (Security):     [Auth]──[Tenant Isolation]──[Validation]──[Rate Limit]
Track 2 (Performance):  [Pagination]──[Indexes]──[Query Optimization]
Track 3 (Reliability):  [Logging]──[Error Monitoring]──[Tests]
Track 4 (Data):         [Transactions]──[Invoice# Fix]──[Soft Deletes]
```

---

## Track 1: Security (BLOCKING - Must complete before production)

### 1.1 Authentication
- [ ] Install NextAuth.js v5
- [ ] Configure email/password provider (or OAuth)
- [ ] Create login/register pages
- [ ] Add session middleware
- [ ] Protect all routes with auth check

**Files to create/modify:**
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/lib/auth.ts`
- `src/app/login/page.tsx`
- `src/middleware.ts`

### 1.2 Tenant Isolation (Multi-tenancy)
- [ ] Add `userId` to Invoice and Client models
- [ ] Create migration
- [ ] Update ALL server actions to filter by userId
- [ ] Add `getCurrentUserId()` helper

**Files to modify:**
- `prisma/schema.prisma`
- `src/app/actions/invoices.ts`
- `src/app/actions/clients.ts`

### 1.3 Server-Side Validation
- [ ] Install Zod
- [ ] Create schemas for Invoice, Client, LineItem
- [ ] Validate in every server action BEFORE db operations
- [ ] Status enum: only allow 'draft' | 'sent' | 'paid'

**Files to create/modify:**
- `src/lib/schemas.ts`
- `src/app/actions/invoices.ts`
- `src/app/actions/clients.ts`

### 1.4 Rate Limiting
- [ ] Install `@upstash/ratelimit` or similar
- [ ] Add rate limit middleware
- [ ] Configure: 100 req/min for authenticated, 10 req/min for unauth

**Files to create:**
- `src/middleware.ts` (extend)
- `src/lib/rate-limit.ts`

---

## Track 2: Performance (Can start immediately)

### 2.1 Pagination
- [ ] Add `take` and `skip` params to `getInvoices()`
- [ ] Add `take` and `skip` params to `getClients()`
- [ ] Create pagination UI component
- [ ] Default: 50 items per page

**Files to modify:**
- `src/app/actions/invoices.ts`
- `src/app/actions/clients.ts`
- `src/app/page.tsx`
- `src/app/clients/page.tsx`

### 2.2 Database Indexes
- [ ] Add index on `Invoice.clientId`
- [ ] Add index on `Invoice.status`
- [ ] Add index on `Invoice.dueDate`
- [ ] Add composite index on `(userId, status)` after Track 1.2

**Files to modify:**
- `prisma/schema.prisma`

### 2.3 Query Optimization
- [ ] Use `select` instead of full `include` where possible
- [ ] Calculate totals in database (aggregate query) not memory
- [ ] Add connection pooling config if not present

**Files to modify:**
- `src/app/actions/invoices.ts`
- `src/app/page.tsx`

---

## Track 3: Reliability (Can start immediately)

### 3.1 Structured Logging
- [ ] Install Pino
- [ ] Create logger utility with request context
- [ ] Add logging to all server actions (action name, userId, result)
- [ ] Log errors with stack traces

**Files to create/modify:**
- `src/lib/logger.ts`
- `src/app/actions/invoices.ts`
- `src/app/actions/clients.ts`

### 3.2 Error Monitoring
- [ ] Install Sentry SDK
- [ ] Configure in `next.config.js`
- [ ] Wrap server actions with error boundary
- [ ] Add source maps for readable stack traces

**Files to create/modify:**
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `next.config.js`

### 3.3 Test Coverage
- [ ] Add tests for server actions (invoices.test.ts, clients.test.ts)
- [ ] Add tests for validation schemas
- [ ] Add integration tests with test database
- [ ] Target: 70% coverage minimum

**Files to create:**
- `src/app/actions/invoices.test.ts`
- `src/app/actions/clients.test.ts`
- `src/lib/schemas.test.ts`

---

## Track 4: Data Integrity (Can start immediately)

### 4.1 Database Transactions
- [ ] Wrap `updateInvoice` in `db.$transaction()`
- [ ] Wrap `deleteInvoice` in transaction with audit log
- [ ] Add optimistic locking (version field) for concurrent edits

**Files to modify:**
- `src/app/actions/invoices.ts`

### 4.2 Invoice Number Race Condition Fix
- [ ] Option A: Use PostgreSQL SEQUENCE
- [ ] Option B: Use `UPDATE ... RETURNING` atomic increment
- [ ] Add unique constraint retry logic

**Files to modify:**
- `prisma/schema.prisma`
- `src/app/actions/invoices.ts`

### 4.3 Soft Deletes for Invoices
- [ ] Add `archivedAt` field to Invoice model
- [ ] Change `deleteInvoice` to set archivedAt instead of hard delete
- [ ] Filter out archived invoices in all queries
- [ ] Add "show archived" toggle to UI

**Files to modify:**
- `prisma/schema.prisma`
- `src/app/actions/invoices.ts`
- `src/app/page.tsx`

---

## Coordination Rules

1. **Track 1 blocks production deploy** - No client onboarding until auth + tenant isolation complete
2. **Track 2 can ship independently** - Pagination/indexes improve existing functionality
3. **Track 3 can ship independently** - Logging/monitoring are additive
4. **Track 4.1 (transactions) should merge before high traffic** - Prevents data corruption
5. **Schema changes coordinate** - Tracks 1.2, 2.2, 4.2, 4.3 all touch schema.prisma

## Merge Order Suggestion
```
Week 1: Track 2.1 (pagination) + Track 3.1 (logging) + Track 4.1 (transactions)
Week 2: Track 1.1-1.2 (auth + tenancy) + Track 2.2 (indexes)
Week 3: Track 1.3-1.4 (validation + rate limit) + Track 3.2 (Sentry)
Week 4: Track 4.2-4.3 (invoice# + soft delete) + Track 3.3 (tests)
```

---

## Verification Plan
After implementation, verify with:
1. `npm run typecheck && npm run test:run` - all pass
2. Manual auth testing - can't access other users' data
3. Load test - 1000 concurrent invoice creates, no duplicates
4. Security scan - OWASP ZAP or similar
5. Staging deployment with synthetic load before production
