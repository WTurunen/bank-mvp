# Design Rationale: Multi-Agent Implementation System

This document explains **why** the implementation system was designed the way it is.

## Context

We needed a system to implement the production-readiness roadmap (18 critical/high issues) with these constraints:

1. **Token limits** — AI sessions exhaust context before completing large tasks
2. **Multiple agents** — Want to parallelize work across agents
3. **Small models** — Implementation agents use Haiku/Sonnet (fast but can't improvise)
4. **Resumability** — Must be able to stop and resume without losing progress
5. **Speed** — Need to ship fast, can't afford coordination overhead

## Key Decisions

### Decision 1: One Worktree Per Feature (Not Per Track)

**Considered:**
- A) One worktree per track (4 worktrees)
- B) One worktree per feature (13 worktrees)
- C) All work in main branch

**Chose B because:**
- Tracks contain features with dependencies (e.g., 1.2 depends on 1.1)
- Working on dependent features in the same worktree causes conflicts
- 13 features is manageable, and each is self-contained
- Clean merge history (one PR per feature)

**Trade-off:** More worktrees to manage, but cleaner isolation.

### Decision 2: Append-Only Progress Log (Not Checkboxes Alone)

**Considered:**
- A) Just check off tasks in the markdown list
- B) Separate progress.md file per feature
- C) Append-only log at bottom of each feature file

**Chose C because:**
- Checkboxes alone don't show WHO did the work or WHEN
- Separate file means two files to keep in sync
- Append-only minimizes merge conflicts (agents only add, never edit)
- Git push becomes natural coordination point
- Built-in audit trail

**Trade-off:** Slightly more verbose, but much safer for concurrent work.

### Decision 3: Atomic Tasks with Exact Code

**Considered:**
- A) High-level tasks ("Add authentication")
- B) Medium-level tasks ("Create login page with form")
- C) Atomic tasks with exact code snippets

**Chose C because:**
- Small models (Haiku/Sonnet) can't improvise well
- Exact code eliminates ambiguity
- Each task is completable in one short session
- Verification is straightforward
- Agents don't need to understand the full picture

**Trade-off:** Plans are verbose (~6,600 lines), but execution is reliable.

### Decision 4: Commit Messages Include Task IDs

**Considered:**
- A) Conventional commits only (`feat: add login page`)
- B) Task IDs in commit body
- C) Task IDs in commit subject (`feat(1.1.5a): create login page`)

**Chose C because:**
- Enables cross-referencing: `git log --grep="(1.1.5a)"`
- Verifies Progress Log claims (DONE should have matching commits)
- Makes code review easier (reviewer knows which task each commit fulfills)
- Survives squash merges if ID is in subject

**Trade-off:** Slightly unconventional commit format, but huge debugging benefit.

### Decision 5: 30-Minute Reclaim Timeout

**Considered:**
- A) No timeout (stuck tasks stay stuck forever)
- B) 15-minute timeout
- C) 30-minute timeout
- D) 1-hour timeout

**Chose C because:**
- Most tasks should complete in 10-20 minutes
- 30 minutes gives buffer for slow networks or complex tasks
- Short enough that stuck tasks don't block progress for long
- Long enough that agents don't reclaim tasks that are legitimately in progress

**Trade-off:** Might occasionally reclaim a task that was still being worked on, but agent can see partial commits and continue.

### Decision 6: Progress Log in Feature File (Not Separate)

**Considered:**
- A) Separate PROGRESS.md file per worktree
- B) Progress log embedded in each feature file

**Chose B because:**
- Everything about a feature is in one file
- No risk of forgetting to create the progress file
- Easier to see task list and progress together
- One less file to manage

**Trade-off:** Feature files are longer, but more self-contained.

### Decision 7: Use Git Push as Coordination Mechanism

**Considered:**
- A) Lock files in the repo
- B) External coordination service (Redis, database)
- C) Git push conflicts as coordination

**Chose C because:**
- No external dependencies
- Git is already part of the workflow
- Push rejection is a clear signal ("someone else claimed this")
- Works offline (until push time)
- Simpler than building lock infrastructure

**Trade-off:** Agents must push immediately after claiming. If they forget, another agent might duplicate work.

### Decision 8: Tasks Include Verification Steps

**Considered:**
- A) Trust agents to verify their own work
- B) Explicit verification step in each task
- C) Automated verification at PR time only

**Chose B because:**
- Catches errors early (before they compound)
- Makes task completion unambiguous
- Agents have clear "done" criteria
- Reduces PR review burden

**Trade-off:** More verbose task definitions, but higher quality output.

## What We Explicitly Avoided

### Avoided: Complex State Machines

We considered having tasks with states like CLAIMED → IN_PROGRESS → REVIEW → DONE. Rejected because:
- Adds complexity without clear benefit
- Simple START → DONE is sufficient
- RECLAIM handles the stuck case

### Avoided: Central Orchestrator

We considered having a "master" agent that assigns tasks. Rejected because:
- Single point of failure
- Adds latency (must ask orchestrator for next task)
- Agents can self-organize by reading the Progress Log

### Avoided: Real-Time Coordination

We considered WebSocket-based real-time updates between agents. Rejected because:
- Massive complexity increase
- Git push is "good enough" coordination
- Occasional duplicate work is acceptable trade-off

### Avoided: Task Priorities

We considered adding priority levels to tasks. Rejected because:
- Dependencies already define natural ordering
- Within a feature, tasks are sequential anyway
- Adds cognitive overhead for agents

## Assumptions

This system assumes:

1. **Agents can read and follow instructions** — Plans are detailed, but agents must execute them
2. **Git is available and working** — All coordination relies on git
3. **Network is reasonably reliable** — Push/pull needs to work
4. **Features are reasonably independent** — Minimal cross-feature file edits
5. **Humans review PRs** — Agents aren't perfect; PRs catch mistakes

## Known Limitations

1. **Plans can have bugs** — Code snippets might have typos or missing pieces
2. **Dependencies might be incomplete** — We might have missed a dependency
3. **No automatic conflict resolution** — If two agents edit the same file, manual merge required
4. **Progress Log can desync** — If agent forgets to update log, it drifts from reality
5. **No rollback mechanism** — If a task is done wrong, must manually fix

## Future Improvements (Not Implemented)

If this system proves useful, consider:

1. **Automated progress dashboard** — Parse Progress Logs into a visual dashboard
2. **Slack/Discord notifications** — Alert when tasks complete or get stuck
3. **Automated PR creation** — When all tasks done, auto-create PR
4. **Task time tracking** — Add duration to Progress Log for estimation
5. **Conflict detection** — Warn if two features touch same files
