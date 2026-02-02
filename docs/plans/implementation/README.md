# Implementation Coordination System

## Overview

This system enables multiple agents to work on production-readiness features in parallel without conflicts.

**Start here:**
1. Read `WAY-OF-WORKING.md` — How to use this system
2. Read `RATIONALE.md` — Why it's designed this way
3. Pick a feature from `features/` and start working

## Structure

```
docs/plans/implementation/
├── README.md                 # This file (quick reference)
├── WAY-OF-WORKING.md         # Step-by-step guide for agents
├── RATIONALE.md              # Design decisions and why
└── features/
    ├── 1.1-authentication.md
    ├── 1.2-tenant-isolation.md
    ├── 1.3-server-validation.md
    ├── 1.4-rate-limiting.md
    ├── 2.1-pagination.md
    ├── 2.2-database-indexes.md
    ├── 2.3-query-optimization.md
    ├── 3.1-structured-logging.md
    ├── 3.2-error-monitoring.md
    ├── 3.3-test-coverage.md
    ├── 4.1-database-transactions.md
    ├── 4.2-invoice-number-fix.md
    └── 4.3-soft-deletes.md
```

## Workflow

### Starting a Feature

1. Create a git worktree for the feature:
   ```bash
   git worktree add ../bank-mvp-1.1-auth feature/1.1-authentication
   ```

2. Read the feature's PROGRESS.md (created on first task start)

3. Find next unclaimed task (no START or has RECLAIM available)

4. Claim task by appending to progress log

### Task Lifecycle

```
[Unclaimed] → START → [In Progress] → DONE → [Complete]
                ↓
           (30 min timeout)
                ↓
           [Reclaimable] → RECLAIM → [In Progress] → ...
```

### Progress Log Format

Each feature worktree contains a `PROGRESS.md` file:

```markdown
## Progress Log

| Timestamp | Agent | Action | Task | Commit |
|-----------|-------|--------|------|--------|
| 2024-01-15 10:15 | agent-a1b2 | START | 1.1.1a | - |
| 2024-01-15 10:25 | agent-a1b2 | DONE | 1.1.1a | abc123f |
| 2024-01-15 10:30 | agent-c3d4 | START | 1.1.1b | - |
```

### Commit Format

All commits must include the task ID:

```
feat(1.1.1a): install next-auth dependency
feat(1.1.2b): create auth config file
fix(1.1.3a): correct session callback types
test(1.1.4a): add login page tests
```

### Cross-Checking

Verify task completion by checking git log:

```bash
git log --oneline --grep="(1.1.1a)"
```

If PROGRESS.md shows DONE but no commits exist, the task was not properly completed.

### Reclaiming Stuck Tasks

A task is reclaimable if:
- It has START but no DONE
- More than 30 minutes have passed

To reclaim:
1. Check `git log --grep="(task-id)"` for partial work
2. Append RECLAIM entry to progress log
3. Continue or restart the work

## Dependencies Between Features

```
Track 1 (Security) - BLOCKS PRODUCTION DEPLOY
├── 1.1 Authentication (no deps)
├── 1.2 Tenant Isolation (depends on 1.1)
├── 1.3 Server Validation (no deps)
└── 1.4 Rate Limiting (depends on 1.1)

Track 2 (Performance) - Can start immediately
├── 2.1 Pagination (no deps)
├── 2.2 Database Indexes (no deps, but coordinate with 1.2 for userId index)
└── 2.3 Query Optimization (depends on 2.1)

Track 3 (Reliability) - Can start immediately
├── 3.1 Structured Logging (no deps)
├── 3.2 Error Monitoring (no deps)
└── 3.3 Test Coverage (depends on 1.3 for schema tests)

Track 4 (Data Integrity) - Can start immediately
├── 4.1 Database Transactions (no deps)
├── 4.2 Invoice Number Fix (no deps)
└── 4.3 Soft Deletes (no deps)
```

## Verification

Before marking a feature complete:

```bash
npm run typecheck    # Must pass
npm run test:run     # Must pass
npm run lint         # Must pass
```

## Merging Features

When all tasks in a feature are DONE:

1. Run full verification suite
2. Create PR to main branch
3. Get review approval
4. Merge and delete worktree

```bash
git checkout main
git merge feature/1.1-authentication
git worktree remove ../bank-mvp-1.1-auth
git branch -d feature/1.1-authentication
```
