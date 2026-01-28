# Clients Feature Follow-ups

Follow-up improvements identified during code review of the clients feature implementation.

## Overview

Three improvements to harden the clients feature:
1. Better error handling for duplicate emails
2. Query optimization for clients list
3. Error boundary for resilience

## Tasks

### Task 1: Handle unique email constraint errors in server actions

**Problem:** When creating/updating a client with a duplicate email, Prisma throws an opaque database error instead of a user-friendly message.

**Files:** `src/app/actions/clients.ts`

**Implementation:**
1. Write test for duplicate email error handling
2. Wrap `createClient` in try/catch, detect Prisma unique constraint error (P2002)
3. Return structured error or throw with user-friendly message
4. Same for `updateClient`

**Test cases:**
- createClient with existing email returns friendly error
- updateClient to existing email returns friendly error

---

### Task 2: Optimize N+1 query in getClients

**Problem:** `getClients` loads full invoice records just to count them. For clients with many invoices, this is wasteful.

**Files:**
- `src/app/actions/clients.ts`
- `src/app/clients/page.tsx`

**Implementation:**
1. Change `include: { invoices: true }` to `include: { _count: { select: { invoices: true } } }`
2. Update Client type in page.tsx to use `_count: { invoices: number }` instead of `invoices: { id: string }[]`
3. Update display from `client.invoices.length` to `client._count.invoices`

**Verification:** Check query in Prisma logs shows no invoice data loaded.

---

### Task 3: Add error boundary to clients page

**Problem:** If `getClients` throws, the page stays in loading state with no feedback.

**Files:** `src/app/clients/page.tsx`

**Implementation:**
1. Add error state: `const [error, setError] = useState<string | null>(null)`
2. Wrap `loadClients` in try/catch
3. On error, set error state and clear loading
4. Display error message with retry button

**Test cases:**
- Shows error message when getClients fails
- Retry button reloads clients

---

## Execution Order

Tasks are independent and can be done in any order or in parallel.

**Recommended order:** 1 → 2 → 3 (error handling first, then optimization, then UI resilience)

## Verification

After all tasks:
- `npm run typecheck` passes
- `npm run test:run` passes
- Manual test: try creating client with duplicate email
- Manual test: verify clients list loads efficiently
