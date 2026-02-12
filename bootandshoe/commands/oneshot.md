---
description: Plan and execute simple tasks in one shot, with automatic complexity detection
model: opus
allowed-tools: ["Read", "Write", "Edit", "Grep", "Glob", "Bash", "AskUserQuestion", "Task", "TodoWrite"]
argument-hint: Task description
---

# One-Shot Task Execution

Plan and execute simple tasks in a single pass. Assess complexity upfront and either execute immediately or redirect to `/feature_plan` for complex work.

**Initial request:** $ARGUMENTS

---

## Phase 0: Check Context

**Goal**: Determine output location and validate input

**Actions**:
1. If no task description provided, ask the user to provide one and wait
2. If input includes a task document path (contains `/features/` and filename `task.md`):
   - Read task.md completely
   - Plan output: `thoughts/features/{slug}/oneshot-YYYY-MM-DD-description.md`
   - After completion, update task.md activity: `- YYYY-MM-DD: Oneshot task completed - [description]`
3. Otherwise: plan output: `thoughts/shared/plans/YYYY-MM-DD-oneshot-description.md`

**Output**: Context established, output path determined

---

## Phase 1: Assess Complexity

**Goal**: Determine if the task is simple enough for one-shot execution

**Actions**:
1. Read any mentioned files FULLY (no limit/offset)
2. Run quick parallel research:
   - **bootandshoe:codebase-locator**: Find relevant files
   - **bootandshoe:codebase-analyzer**: Understand existing patterns (if needed)
3. Assess against thresholds:
   - Maximum 2-3 implementation phases
   - Maximum ~5 files affected
   - No significant architectural decisions required
   - Clear, well-defined requirements
4. If task exceeds thresholds: explain why (specific reasons like "Affects 8+ files across API and UI layers"), state estimated scope (phases, files, decisions), recommend `/feature_plan`, and stop
5. If task is simple enough, proceed to next phase

**Output**: Complexity assessed, decision made

---

## Phase 2: Plan and Execute

**Goal**: Create a lightweight plan and implement it

**Actions**:
1. Write a plan file at the determined output location using the template below
2. Create a todo list with each implementation step
3. Implement each phase: make changes, run automated verification, check off completed items in the plan
4. Update plan status to `completed` when done

**Output**: Implementation complete

### Plan Template

```markdown
---
type: oneshot-plan
title: "[Brief title]"
created: YYYY-MM-DD
status: in-progress
---

# [Task Title]

## Task
[Original task description]

## Scope Assessment
- **Phases**: [1-3]
- **Files affected**: [list]
- **Complexity**: Simple (one-shot appropriate)

## Implementation

### Phase 1: [Name]

**Changes:**
1. `path/to/file.ext`: [what to change]

**Verification:**
- [ ] [Automated check, e.g., `make test`]

## Success Criteria

### Automated:
- [ ] [Command to verify]

### Manual:
- [ ] [What user should check]
```

---

## Phase 3: Report Results

**Goal**: Summarize what was done

**Actions**:
1. Present: task description, plan file path, list of changes made with file paths, automated checks that passed, and manual verification items for the user to test

**Output**: Results reported

---

## Guidelines

- **Be conservative**: When in doubt about complexity, redirect to `/feature_plan`
- **No back-and-forth**: This is one-shot; don't ask clarifying questions mid-task
- **Quick research only**: Don't spawn extensive research like `/feature_plan` does
- **Always save the plan**: Even for simple tasks, create the plan file for history
- **Verify before reporting**: Run automated checks before claiming completion
