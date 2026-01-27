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

1. **Teach during brainstorming.** When designing features, explain the reasoning behind decisions - what production SaaS platforms do, why certain patterns scale better, trade-offs between approaches. This builds product intuition alongside the code.

2. **Use best model (opus) for planning, lesser models (sonnet/haiku) for implementation and review.** Planning requires deep thinking; implementation and review can be parallelized with faster models.

2. **Always code review before commit.** Dispatch a review agent to check changes before staging and committing.

3. **Always run tests before push.** Run `npm run typecheck` and `npm run test:run` (or equivalent) and verify they pass before pushing to remote.
