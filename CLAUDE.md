# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript type checking
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once (use before push)

# Single test file
npx vitest run src/lib/utils.test.ts

# Database
npx prisma db push           # Apply schema changes
npx prisma generate          # Regenerate client after schema changes
npx prisma db seed           # Seed demo data

# GitHub (use gh CLI for repo info, PRs, issues, workflows)
gh run list                  # View recent CI runs
gh pr list                   # List pull requests
gh pr create                 # Create pull request
```

## Architecture

**Invoice Management MVP** - Next.js 16 app with PostgreSQL/Prisma backend.

### Data Flow
- **Server Actions** (`src/app/actions/invoices.ts`): All database mutations go through server actions. `createInvoice`, `updateInvoice`, `updateInvoiceStatus`, `deleteInvoice`. Actions call `revalidatePath` after mutations.
- **Database** (`src/lib/db.ts`): Single Prisma client instance with global caching for dev hot-reload.
- **Validation** (`src/lib/validation.ts`): Pure validation functions returning `{valid, field, message}` results. Used by form components client-side.

### Schema
Two models: `Invoice` (id, invoiceNumber, clientName, clientEmail, status, issueDate, dueDate, notes) and `LineItem` (id, invoiceId, description, quantity, unitPrice). LineItems cascade delete with Invoice.

### Key Patterns
- Invoice numbers auto-generated as `INV-001`, `INV-002`, etc.
- Status flow: draft → sent → paid (with computed "overdue" when sent + past dueDate)
- Form handles European decimal input (comma treated as decimal separator)
- `@/` path alias maps to `./src/`

### CI/CD
GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR to master:
- PostgreSQL 16 service container for integration
- Lint → Typecheck → Tests → DB Push → Build
- All checks must pass before merge

## File Index: Routes
/|Dashboard with invoice list, stats|getInvoices,calculateInvoiceTotal
/login|Auth login page|LoginForm
/register|Auth registration page|RegisterForm
/clients|Client list with archive toggle|getClients
/clients/new|Create new client form|ClientForm,createClient
/clients/[id]|Edit client detail page|getClient,updateClient
/invoices/new|Create new invoice form|InvoiceForm,createInvoice
/invoices/[id]|Edit invoice page|getInvoice,updateInvoice
/invoices/[id]/preview|Print-ready invoice view|getInvoice,PrintButton

## File Index: Actions
src/app/actions/invoices.ts|invoice CRUD with tenant isolation|createInvoice,updateInvoice,updateInvoiceStatus,deleteInvoice,getInvoice,getInvoices
src/app/actions/clients.ts|client CRUD with soft delete|createClient,updateClient,archiveClient,restoreClient,getClient,getClients
src/app/actions/auth.ts|user registration action|registerUser

## File Index: Components
src/components/invoice-form.tsx|invoice create/edit form with line items|InvoiceForm
src/components/client-form.tsx|client create/edit form|ClientForm
src/components/client-selector.tsx|dropdown to pick existing client|ClientSelector
src/components/login-form.tsx|email/password login form|LoginForm
src/components/register-form.tsx|user registration form|RegisterForm
src/components/nav-header.tsx|top navigation with logout|NavHeader
src/components/stat-card.tsx|dashboard statistics card|StatCard
src/components/status-badge.tsx|invoice status colored badge|StatusBadge
src/components/print-button.tsx|triggers browser print dialog|PrintButton
src/components/ui/*|shadcn primitives|Button,Input,Table,Card,Badge,Select,Textarea,Label

## File Index: Lib
src/lib/db.ts|Prisma client singleton|db
src/lib/auth.ts|NextAuth config and session|auth,getCurrentUserId
src/lib/schemas.ts|Zod validation schemas|invoiceSchema,clientSchema,lineItemSchema,ActionResult,validationError
src/lib/validation.ts|pure invoice validation functions|validateInvoice,validateLineItemPrice,VALIDATION_MESSAGES
src/lib/clients-validation.ts|pure client validation functions|validateClientName,validateClientEmail
src/lib/auth-validation.ts|pure auth validation functions|validateEmail,validatePassword
src/lib/utils.ts|formatting utilities|formatCurrency,formatDate,calculateInvoiceTotal,cn
src/lib/password.ts|bcrypt hash/verify|hashPassword,verifyPassword
src/middleware.ts|route protection|redirects unauthenticated to /login

## File Index: Schema
prisma/schema.prisma|PostgreSQL models|User(id,email,passwordHash),Client(id,userId,name,email,phone,address,archivedAt),Invoice(id,userId,clientId,invoiceNumber,clientName,clientEmail,status,dueDate,lineItems),LineItem(id,invoiceId,description,quantity,unitPrice)

## File Index: Patterns
TENANT_ISOLATION|all queries filter by userId from session|userId = await getCurrentUserId()
CLIENT_SNAPSHOT|invoice stores clientName/Email/Phone/Address at creation|clientId optional, snapshot fields required
STATUS_FLOW|draft->sent->paid with computed overdue|status === 'sent' && dueDate < now
ACTIONRESULT|server actions return {success,data} or {success:false,error,field}|ActionResult<T> type
EURO_DECIMALS|form accepts comma as decimal separator|parseNum replaces comma with dot
INVOICE_NUMBERS|auto-generated INV-001, INV-002 sequence|generateInvoiceNumber()
REVALIDATE_PATHS|actions call revalidatePath after mutations|revalidatePath("/"), revalidatePath(`/invoices/${id}`)

## Software Design Principles

Prefer **deep modules** over small ones. A class with few methods hiding significant complexity beats many shallow classes with sprawling interfaces.

**Define errors out of existence.** Redesign semantics so edge cases become normal behavior rather than exceptions to handle.

**Avoid temporal decomposition.** Organize by shared knowledge, not execution order. If read() and parse() both need format knowledge, they belong together.

**General interfaces are simpler.** `insert(pos, text)` + `delete(start, end)` beats `backspace()` + `deleteSelection()` + `insertChar()`.

**Pull complexity downward.** Simple interface > simple implementation. Module developers should suffer so users don't. Avoid config params that punt decisions upward.

**Comments-first design.** Write interface comments before implementation. If the comment is hard to write, the abstraction is wrong.

**Design it twice.** Sketch two radically different approaches before implementing, even when the first seems obvious.

**Different layer, different abstraction.** Pass-through methods signal wrong boundaries.

**Exception aggregation.** Let errors propagate to a single handler rather than scattering try/catch throughout.

### Red Flags
- Shallow module (interface as complex as implementation)
- Information leakage (same knowledge in multiple places)
- Pass-through methods
- Hard to describe (needs long comment = bad abstraction)
- Conjoined methods (can't understand one without the other)

## Workflow Rules

1. **Test-Driven Development (TDD).** When implementing new functionality or fixing bugs where applicable:
   - Write the test first that defines the expected behavior
   - Run the test and watch it fail (red)
   - Write the minimal code to make the test pass (green)
   - Refactor while keeping tests green
   - Exceptions: exploratory coding, UI/styling work, or when explicitly specified otherwise
   - Test file naming: `*.test.ts` or `*.test.tsx` co-located with source files or in `__tests__/`

2. **Teach during brainstorming.** When designing features, explain the reasoning behind decisions - what production SaaS platforms do, why certain patterns scale better, trade-offs between approaches. This builds product intuition alongside the code.

3. **Use best model (opus) for planning, lesser models (sonnet/haiku) for implementation and review.** Planning requires deep thinking; implementation and review can be parallelized with faster models.

4. **Atomic commits.** Each commit should represent one logical change. Group related files together (e.g., component + its tests), but separate distinct features or layers. Never bundle unrelated changes in a single commit.

5. **Always code review before commit.** Dispatch a review agent to check changes before staging and committing. The review should verify implementation matches the spec exactly — nothing added beyond the spec, nothing omitted from it.

6. **Always run tests before push.** Run `npm run typecheck` and `npm run test:run` (or equivalent) and verify they pass before pushing to remote.
