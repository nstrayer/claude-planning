---
description: Plan and execute simple tasks in one shot, with automatic complexity detection
---

# One-Shot Task Execution

You are tasked with planning and executing simple tasks in a single pass. Unlike `/feature_plan` which is interactive and iterative, this command assesses complexity upfront and either executes immediately or redirects to the full planning workflow.

## Complexity Threshold

This command is designed for **simple tasks only**:
- **Maximum 2-3 implementation phases**
- **Maximum ~5 files affected**
- **No significant architectural decisions required**
- **Clear, well-defined requirements**

If the task exceeds these thresholds, you MUST redirect the user to `/feature_plan` instead.

## Workflow

### Step 0: Check for Feature Context

When invoked:

1. **Check for task document context**:
   - If input includes a path containing `/features/` and filename `task.md`:
     - Read task.md completely
     - Plan will be saved to feature directory: `thoughts/features/{slug}/oneshot-YYYY-MM-DD-description.md`
     - After completion, update task.md with activity: `- YYYY-MM-DD: Oneshot task completed - [description]`
   - Otherwise: Plan will be saved to `thoughts/shared/plans/YYYY-MM-DD-oneshot-description.md`

### Step 1: Understand the Task

When invoked with a task description:

1. **Read any mentioned files FULLY** (no limit/offset)
2. **Quick research** using parallel sub-agents:
   - Use **bootandshoe:codebase-locator** to find relevant files
   - Use **bootandshoe:codebase-analyzer** if you need to understand existing patterns
3. **Assess complexity** based on:
   - Number of files that need changes
   - Whether changes span multiple domains (DB, API, UI, etc.)
   - Presence of unclear requirements or design decisions
   - Dependencies between changes

### Step 2: Complexity Decision

**If task is TOO COMPLEX** (exceeds thresholds), respond:

```
This task is too complex for one-shot execution.

**Why:**
- [Specific reason: e.g., "Affects 8+ files across API and UI layers"]
- [Another reason if applicable]

**Estimated scope:**
- Phases needed: [N]
- Files affected: [N]
- Key decisions required: [list any]

**Recommendation:** Use `/feature_plan [task description]` to create a proper implementation plan with iterative refinement.
```

Then STOP. Do not proceed with implementation.

**If task is SIMPLE ENOUGH**, proceed to Step 3.

### Step 3: Create Lightweight Plan

Create a plan file at the determined location (feature directory or `thoughts/shared/plans/`):

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
2. `path/to/other.ext`: [what to change]

**Verification:**
- [ ] [Automated check, e.g., `make test`]

[Additional phases if needed, max 3]

## Success Criteria

### Automated:
- [ ] [Command to verify]

### Manual:
- [ ] [What user should check]
```

### Step 4: Execute the Plan

1. **Create a todo list** with each implementation step
2. **Implement each phase**:
   - Make the changes
   - Run automated verification
   - Check off completed items in the plan
3. **Update plan status** to `completed` when done

### Step 5: Report Results

After execution, provide a summary:

```
## One-Shot Complete

**Task:** [description]
**Plan:** `thoughts/shared/plans/YYYY-MM-DD-oneshot-[description].md`

**Changes made:**
- `file1.ext`: [brief description]
- `file2.ext`: [brief description]

**Verification:**
- [x] [Automated checks that passed]

**Manual verification needed:**
- [ ] [What user should test]
```

## Important Guidelines

1. **Be conservative** - When in doubt about complexity, redirect to `/feature_plan`
2. **No back-and-forth** - This is one-shot; don't ask clarifying questions mid-task
3. **Quick research only** - Don't spawn extensive research like `/feature_plan` does
4. **Always save the plan** - Even for simple tasks, create the plan file for history
5. **Verify before reporting success** - Run automated checks before claiming completion

## Examples of Appropriate Tasks

**Good for one-shot:**
- "Add a logout button to the header"
- "Fix the typo in the error message"
- "Add validation for email field"
- "Update the API endpoint URL"
- "Add a new column to the users table"

**Too complex for one-shot:**
- "Implement user authentication"
- "Add real-time notifications"
- "Refactor the state management"
- "Add a new payment provider"
- "Implement dark mode"

## Invocation

```
/oneshot [task description]
/oneshot Add a loading spinner to the submit button
/oneshot Fix the null pointer exception in UserService.getUser()
```

If no task description provided, respond:

```
Please provide a task description:

/oneshot [your task here]

Examples:
- /oneshot Add a logout button to the header
- /oneshot Fix the validation error in signup form
- /oneshot Update the copyright year in the footer
```
