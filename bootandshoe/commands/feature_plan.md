---
description: Create detailed implementation plans through interactive research and iteration
model: opus
allowed-tools: ["Read", "Write", "Edit", "Grep", "Glob", "Bash", "AskUserQuestion", "Task", "EnterPlanMode", "ExitPlanMode"]
argument-hint: Path to requirements file or task description
---

# Implementation Plan (Plan Mode)

Create detailed implementation plans through interactive research and iteration. Be skeptical, thorough, and collaborative.

**This command runs within plan mode.** Write the plan to the plan file designated by plan mode (the path provided in the plan mode system message). When finished, call `ExitPlanMode` so the user can review and approve in VS Code.

**Initial request:** $ARGUMENTS

---

## Phase 1: Understanding

**Goal**: Gather context and understand the task

**Actions**:
1. If a file path or task description was provided, read all provided files FULLY (no limit/offset). If no parameters provided, explain that you need a task description or requirements file path, then wait for input
2. Detect document types in provided files:
   - **PRD** (YAML `type: prd`, path contains `/prds/`, or filename matches `*-prd.md`): Extract requirements and map PRD sections to plan sections. Skip questions about user needs/goals/scope (already in PRD). Focus research on technical implementation
   - **Task document** (path contains `/features/` and filename is `task.md`): Read the linked PRD from `**PRD:**` field. Set plan output to `{feature-dir}/plan.md`
3. Spawn initial research tasks in parallel:
   - **bootandshoe:codebase-locator**: Find all files related to the task
   - **bootandshoe:codebase-analyzer**: Understand current implementation
   - **bootandshoe:thoughts-locator**: Find existing thoughts documents about the area
4. Synthesize agent findings -- trust agent summaries and file:line references. Only read files directly when findings seem surprising or you need exact code snippets
5. Present informed understanding with file:line references, then ask focused questions that research could not answer. Only ask questions requiring human judgment, business logic clarification, or design preferences

**Output**: Understanding confirmed, questions answered

---

## Phase 2: Design

**Goal**: Research thoroughly and select an implementation approach

**Actions**:
1. If the user corrects any misunderstanding, spawn new research tasks to verify -- do not just accept corrections
2. Spawn parallel research agents for deeper investigation:
   - **bootandshoe:codebase-locator**: Find specific component files
   - **bootandshoe:codebase-analyzer**: Understand implementation details
   - **bootandshoe:codebase-pattern-finder**: Find similar features to model after
   - **bootandshoe:thoughts-locator** / **bootandshoe:thoughts-analyzer**: Historical context
3. If encountering unfamiliar technologies, version-specific concerns, or security implications, use AskUserQuestion (header: "Research") to offer web research via **bootandshoe:web-search-researcher**
4. Present design options with pros/cons from research findings
5. Use AskUserQuestion (header: "Approach") to select approach with dynamically generated options. Include "Discuss trade-offs" and "Hybrid approach" options when appropriate

**Output**: Implementation approach selected

---

## Phase 3: Plan Structure

**Goal**: Agree on plan phases before writing details

**Actions**:
1. Read only files you will reference in the plan (for exact code patterns, APIs, line numbers). Use **bootandshoe:codebase-pattern-finder** for files not yet examined
2. Present proposed plan structure: overview + numbered phases with one-line descriptions
3. Use AskUserQuestion (header: "Structure") to confirm: "Yes, proceed" / "Adjust order" / "Split phases" / "Merge phases"
4. If adjustment needed, collect specifics and re-present until approved

**Output**: Phase structure approved

---

## Phase 4: Write the Plan

**Goal**: Write the detailed implementation plan

**Actions**:
1. Determine output location:
   - Task document provided: `{feature-dir}/plan.md`
   - Otherwise: plan mode file path from system message
2. Write the plan using the template below

**Output**: Plan file written

### Plan Template

````markdown
---
type: implementation-plan
title: "[Feature/Task Name]"
created: YYYY-MM-DD
status: draft
---

# [Feature/Task Name] Implementation Plan

## Overview
[Brief description of what we're implementing and why]

## Current State Analysis
[What exists now, what's missing, key constraints discovered]

## Desired End State
[Specification of the desired end state and how to verify it]

### Key Discoveries:
- [Important finding with file:line reference]
- [Pattern to follow]
- [Constraint to work within]

## What We're NOT Doing
[Explicitly list out-of-scope items]

## Implementation Approach
[High-level strategy and reasoning]

## Phase 1: [Descriptive Name]

### Overview
[What this phase accomplishes]

### Changes Required:

#### 1. [Component/File Group]
**File**: `path/to/file.ext`
**Changes**: [Summary]

```[language]
// Specific code to add/modify
```

### Success Criteria:

#### Automated Verification:
- [ ] [Check description]: `make [target]`

#### Manual Verification:
- [ ] [What user should check]

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding.

---

## Phase 2: [Descriptive Name]
[Similar structure...]

---

## Testing Strategy

### Unit Tests:
- [What to test]

### Integration Tests:
- [End-to-end scenarios]

### Manual Testing Steps:
1. [Specific verification step]

## Performance Considerations
[Any performance implications]

## Migration Notes
[If applicable]

## References
- Original requirements: `path/to/requirements.md`
- Related research: `thoughts/shared/research/[relevant].md`
- Similar implementation: `[file:line]`
````

---

## Phase 5: Update Task Document

**Goal**: Link the plan to the task document if applicable

**Actions**:
1. If task document was provided:
   - Set `**Plan:**` to `./plan.md`
   - Add activity: `- YYYY-MM-DD: Implementation plan created`
   - Update `**Status:**` to `planned`
2. Inform the user of the updates

**Output**: Task document updated with plan link

---

## Phase 6: Exit Plan Mode

**Goal**: Submit plan for user review

**Actions**:
1. Call `ExitPlanMode` so the user can review and approve the plan in VS Code

**Output**: Plan submitted for approval

---

## Guidelines

- **Be skeptical**: Question vague requirements, identify issues early, verify with code -- don't assume
- **Be interactive**: Get buy-in at each major step, allow course corrections, don't write the full plan in one shot
- **Be thorough**: Read input files completely, use agents for codebase research, include file:line references, write measurable success criteria with automated vs manual distinction. Use `make` commands for automated verification when possible
- **Be practical**: Focus on incremental testable changes, consider migration and rollback, include "what we're NOT doing"
- **No open questions in final plan**: If you encounter unresolved questions, stop and research or ask immediately -- never write the plan with open questions
- **Token efficiency**: Read user-provided files directly; use agents for codebase exploration; trust agent summaries; don't re-read files to confirm what agents reported

### Common Patterns

- **Database changes**: Schema/migration -> store methods -> business logic -> API -> clients
- **New features**: Research patterns -> data model -> backend -> API -> UI
- **Refactoring**: Document behavior -> incremental changes -> maintain compatibility -> migration strategy

### Sub-task Best Practices

- Spawn multiple tasks in parallel for efficiency
- Be extremely specific about directories in prompts
- Request file:line references in responses
- Wait for all tasks to complete before synthesizing
- Verify unexpected results with follow-up tasks
