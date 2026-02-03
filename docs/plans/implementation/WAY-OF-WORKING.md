# Way of Working: Multi-Agent Implementation

## Overview

This document explains how to use the implementation plans in this directory with multiple AI agents working in parallel.

## The Problem We're Solving

Large implementation projects face these challenges with AI agents:

1. **Token exhaustion** — Long sessions run out of context before completing work
2. **Lost progress** — When a session ends, work state is lost
3. **Duplicate work** — Multiple agents might work on the same task
4. **Coordination conflicts** — Agents editing the same files cause merge conflicts
5. **Small model limitations** — Smaller/faster models can't improvise well

## Our Solution

### One Feature = One Worktree

Each feature gets its own git worktree (isolated working directory). This means:
- Agents working on different features can't conflict
- Each feature branch is self-contained
- Merging completed features is clean

### Atomic Tasks

Each task is designed to be:
- **Completable in one short session** — No task requires remembering context across sessions
- **Unambiguous** — Exact file paths, exact code, exact commands
- **Verifiable** — Each task has a verification step
- **Independently committable** — One task = one commit

### Progress Tracking via Append-Only Log

At the bottom of each feature file is a Progress Log table:

```markdown
| Timestamp | Agent | Action | Task | Commit |
|-----------|-------|--------|------|--------|
| 2024-01-15 10:15 | agent-a1b2 | START | 1.1.1a | - |
| 2024-01-15 10:25 | agent-a1b2 | DONE | 1.1.1a | abc123f |
```

Why append-only?
- Minimizes merge conflicts (agents only add lines, never edit existing ones)
- Git push becomes the coordination point (first to push wins)
- Full audit trail of who did what

### Commit Messages as Cross-Reference

All commits include the task ID: `feat(1.1.1a): install next-auth dependency`

This enables verification:
```bash
git log --oneline --grep="(1.1.1a)"
```

If the Progress Log says DONE but no commits exist, the task wasn't properly completed.

## How to Start a Feature

### Step 1: Create Worktree

```bash
# From the main repo
git worktree add ../bank-mvp-1.1-auth feature/1.1-authentication
cd ../bank-mvp-1.1-auth
```

### Step 2: Read the Feature Plan

Open the feature file (e.g., `docs/plans/implementation/features/1.1-authentication.md`) and:
1. Read the Overview to understand the goal
2. Check Dependencies to ensure prerequisites are done
3. Look at the Progress Log to see what's already completed

### Step 3: Claim a Task

Find the next unclaimed task (not in Progress Log or only has START without DONE for >30 min).

Add a START entry:
```markdown
| 2024-01-15 10:30 | agent-xyz | START | 1.1.1b | - |
```

Commit and push immediately:
```bash
git add docs/plans/implementation/features/1.1-authentication.md
git commit -m "chore: claim task 1.1.1b"
git push
```

If push fails (someone else claimed it), pull and pick a different task.

### Step 4: Do the Work

Follow the task instructions exactly:
1. Read the **File** and **Action** fields
2. Apply the **Code** changes
3. Run the **Verify** step
4. Create the commit using the **Commit** template

### Step 5: Mark Complete

Update the Progress Log:
```markdown
| 2024-01-15 10:30 | agent-xyz | START | 1.1.1b | - |
| 2024-01-15 10:45 | agent-xyz | DONE | 1.1.1b | def456a |
```

Check off the task in the Task List:
```markdown
- [x] 1.1.1b Install bcryptjs for password hashing
```

Commit and push.

### Step 6: Repeat or End Session

Either continue with the next task or end the session. Progress is saved in git.

## Reclaiming Stuck Tasks

If a task has START but no DONE for more than 30 minutes:

1. Check git log for partial work: `git log --oneline --grep="(task-id)"`
2. Add a RECLAIM entry to the Progress Log
3. Continue or restart the work

```markdown
| 2024-01-15 10:30 | agent-abc | START | 1.1.3a | - |
| 2024-01-15 11:15 | agent-xyz | RECLAIM | 1.1.3a | - |
| 2024-01-15 11:30 | agent-xyz | DONE | 1.1.3a | ghi789b |
```

## Completing a Feature

When all tasks are checked off:

1. Run full verification:
   ```bash
   npm run typecheck
   npm run test:run
   npm run lint
   ```

2. Create PR to main:
   ```bash
   git push -u origin feature/1.1-authentication
   gh pr create --title "feat: add authentication (1.1)" --body "..."
   ```

3. After merge, clean up:
   ```bash
   cd ../bank-mvp
   git worktree remove ../bank-mvp-1.1-auth
   git branch -d feature/1.1-authentication
   ```

## Feature Dependencies

Some features depend on others. Check the Dependencies field in each feature file.

```
Track 1 (Security) - BLOCKS PRODUCTION
├── 1.1 Authentication ──────────────────┐
├── 1.2 Tenant Isolation (needs 1.1) ◄───┘
├── 1.3 Server Validation (independent)
└── 1.4 Rate Limiting (needs 1.1) ◄──────┘

Track 2 (Performance) - Can start immediately
├── 2.1 Pagination (independent)
├── 2.2 Database Indexes (independent)
└── 2.3 Query Optimization (needs 2.1)

Track 3 (Reliability) - Can start immediately
├── 3.1 Structured Logging (independent)
├── 3.2 Error Monitoring (independent)
└── 3.3 Test Coverage (needs 1.3 for schema tests)

Track 4 (Data Integrity) - Can start immediately
├── 4.1 Database Transactions (independent)
├── 4.2 Invoice Number Fix (independent)
└── 4.3 Soft Deletes (independent)
```

**Recommended starting points** (no dependencies):
- 1.3 Server Validation
- 2.1 Pagination
- 3.1 Structured Logging
- 4.1 Database Transactions

## Tips for Agents

1. **Read the task completely before starting** — Don't skim
2. **Follow instructions exactly** — Don't improvise or "improve" the code
3. **Verify before marking done** — Run the Verify step
4. **Commit frequently** — One task = one commit
5. **Push after claiming and after completing** — This is the coordination mechanism
6. **If confused, stop** — Better to leave a task unclaimed than do it wrong

## Tips for Orchestrating Multiple Agents

1. **Assign agents to different features** — Avoids file conflicts
2. **Use smaller models (Haiku/Sonnet) for implementation** — Plans are detailed enough
3. **Use larger models (Opus) for debugging** — When something goes wrong
4. **Monitor progress via git log** — `git log --oneline --all --graph`
5. **Review PRs before merging** — Agents can make mistakes

## Troubleshooting

### "Push rejected"
Another agent claimed the task. Pull and pick a different one.

### "TypeScript errors after changes"
Run `npm run typecheck` and fix errors before committing. If the error is in the plan itself, note it and continue (plans aren't perfect).

### "Tests failing"
Check if the test failure is related to your changes or pre-existing. If pre-existing, note it and continue. If related, fix it.

### "Task seems wrong or incomplete"
Leave a note in the Progress Log and move on. Don't try to fix the plan mid-implementation.

```markdown
| 2024-01-15 11:00 | agent-xyz | NOTE | 1.1.3a | Plan missing X, skipped |
```
