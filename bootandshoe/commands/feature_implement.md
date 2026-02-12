---
description: Implement approved technical plans with phased verification
model: opus
allowed-tools: ["Read", "Write", "Edit", "Grep", "Glob", "Bash", "AskUserQuestion", "Task", "TodoWrite"]
argument-hint: Path to plan or task file
---

# Implement Plan

Implement an approved technical plan phase by phase, with verification at each step. Follow the plan's intent while adapting to what you find in the codebase.

**Initial request:** $ARGUMENTS

---

## Phase 1: Load the Plan

**Goal**: Find and understand the implementation plan

**Actions**:
1. If a task document path was provided (contains `/features/` and filename is `task.md`):
   - Read task.md and find the plan path from `**Plan:**` field
   - Update task.md status to `implementing`
   - Add activity: `- YYYY-MM-DD: Implementation started`
   - Read the linked plan
2. If a plan path was provided directly, read it completely
3. If no path provided:
   - Check if the user just approved a plan via plan mode
   - Look for recent plans in `thoughts/shared/plans/`
   - Otherwise, ask the user for the plan path
4. Check for existing checkmarks (`- [x]`) indicating prior progress
5. Validate it looks like an implementation plan (has phases, success criteria)
6. Read any referenced requirements documents
7. Create a todo list to track progress

**Output**: Plan loaded, progress tracked, ready to implement

---

## Phase 2: Implement Each Phase

**Goal**: Execute the plan phase by phase with verification

**Actions**:
1. Before each phase, spawn agents for reconnaissance instead of reading all files:
   - **bootandshoe:codebase-pattern-finder**: Find similar implementations to model after
   - **bootandshoe:codebase-analyzer**: Understand components you'll modify
2. Only read files directly when you're about to edit them
3. For phases with 3+ independent changes, spawn parallel `general-purpose` agents to implement different parts concurrently
4. Follow the plan's intent while adapting to what you find -- plans are guides, not scripts
5. If something doesn't match the plan, stop and present the issue clearly: what the plan says, what you found, why it matters, and ask how to proceed

**Output**: Phase implemented

---

## Phase 3: Verify Each Phase

**Goal**: Confirm the phase works before moving on

**Actions**:
1. Run the automated success criteria checks from the plan (usually `make check test` covers everything)
2. Fix any issues before proceeding
3. Update progress: check off completed items in the plan file using Edit, update todos
4. If task document exists, add activity: `- YYYY-MM-DD: Phase N completed`
5. After automated verification passes, pause and inform the user that the phase is ready for manual testing. List the automated checks that passed and the manual verification items from the plan
6. Wait for the user to confirm manual testing is complete before proceeding to the next phase
7. Do not check off manual testing items until confirmed by the user

**Output**: Phase verified, ready for next phase or completion

---

## Phase 4: Wrap Up

**Goal**: Finalize implementation

**Actions**:
1. If instructed to execute multiple phases consecutively, skip the manual verification pause until the last phase
2. After final phase completion, if task document exists:
   - Update task.md status to `validating`
   - Add activity: `- YYYY-MM-DD: Implementation complete, ready for validation`

**Output**: Implementation complete

---

## Resuming Work

If the plan has existing checkmarks:
- Trust that completed work is done
- Pick up from the first unchecked item
- Verify previous work only if something seems off

## If You Get Stuck

- Use **bootandshoe:codebase-analyzer** to understand relevant code (don't read everything into main context)
- Consider if the codebase has evolved since the plan was written
- Present the mismatch clearly and ask for guidance
