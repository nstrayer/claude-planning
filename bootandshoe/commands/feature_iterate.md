---
description: Iterate on existing implementation plans with thorough research and updates
model: opus
allowed-tools: ["Read", "Write", "Edit", "Grep", "Glob", "Bash", "AskUserQuestion", "Task", "EnterPlanMode", "ExitPlanMode"]
argument-hint: Path to plan or task file, plus feedback
---

# Iterate Implementation Plan (Plan Mode)

Update existing implementation plans based on user feedback. Be skeptical, thorough, and ensure changes are grounded in codebase reality.

**This command runs within plan mode.** Read the existing plan, make updates, and write the result to the plan file designated by plan mode. When finished, call `ExitPlanMode` so the user can review and approve in VS Code.

**Initial request:** $ARGUMENTS

---

## Phase 1: Locate Plan and Feedback

**Goal**: Identify the plan to update and what changes are needed

**Actions**:
1. Parse input for:
   - Task document path (`thoughts/features/{slug}/task.md`) -- read it and extract plan path from `**Plan:**` field
   - Plan file path (`thoughts/shared/plans/*.md` or `thoughts/features/{slug}/plan.md`)
   - Requested changes/feedback text
2. If no plan file provided, ask the user for the path and wait
3. If plan file provided but no feedback, ask what changes to make and wait
4. If both provided, proceed immediately

**Output**: Plan file identified, feedback understood

---

## Phase 2: Understand Current Plan

**Goal**: Read and fully understand the existing plan

**Actions**:
1. Read the existing plan file FULLY (no limit/offset)
2. Understand current structure, phases, scope, and success criteria
3. Parse what the user wants to add/modify/remove
4. Determine if changes require codebase research

**Output**: Plan understood, change scope identified

---

## Phase 3: Research (if needed)

**Goal**: Gather technical context for the requested changes

**Actions**:
1. Only spawn research tasks if changes require new technical understanding -- skip for simple edits like rewording or reordering
2. Spawn parallel agents as needed:
   - **bootandshoe:codebase-locator**: Find relevant files
   - **bootandshoe:codebase-analyzer**: Understand implementation details
   - **bootandshoe:codebase-pattern-finder**: Find similar patterns
   - **bootandshoe:thoughts-locator** / **bootandshoe:thoughts-analyzer**: Historical context
3. If feedback introduces unfamiliar technologies, suggest web research via **bootandshoe:web-search-researcher** and wait for confirmation
4. Wait for all research tasks to complete

**Output**: Technical context gathered

---

## Phase 4: Clarify and Confirm

**Goal**: Ensure mutual understanding before editing

**Actions**:
1. If change type is unclear, use AskUserQuestion (header: "Change type", multiSelect: true) with options: "Add new phase" / "Modify existing phase" / "Update success criteria" / "Adjust scope"
2. Present understanding of requested changes and research findings
3. Use AskUserQuestion (header: "Confirm") to confirm: "Yes, make changes" / "Needs adjustment" / "Research first" / "Cancel"
4. If "Needs adjustment": collect specifics and re-confirm
5. If "Research first": spawn additional agents, then re-present
6. If "Cancel": end gracefully without edits

**Output**: Changes confirmed, ready to edit

### Feedback Tag Processing

When the user responds, check for tagged feedback in two formats:

**Legacy inline format**: `<feedback>content</feedback>` tags wrapping content directly.

**Marker-based format**: In-document markers `<!--fb:id-->text<!--/fb:id-->` with corresponding entries in a `<feedback-section>` at end of file. For each feedback entry:
1. Locate the marker by ID
2. Read the marked text for context
3. Address the feedback in your updates
4. Remove markers and feedback entries when resolved (keep the text between markers)

Acknowledge and address all tagged feedback items before making changes.

---

## Phase 5: Update the Plan

**Goal**: Make precise edits to the plan

**Actions**:
1. Use the Edit tool for surgical changes -- do not wholesale rewrite
2. Maintain existing structure unless explicitly changing it
3. Keep all file:line references accurate
4. Ensure consistency:
   - New phases follow existing patterns
   - Scope changes update "What We're NOT Doing"
   - Approach changes update "Implementation Approach"
   - Maintain automated vs manual success criteria distinction
5. Preserve quality: include file paths/line numbers, measurable success criteria, `make` commands for verification

**Output**: Plan updated

---

## Phase 6: Exit Plan Mode

**Goal**: Submit updated plan for review

**Actions**:
1. Summarize the changes made and key improvements
2. If task document was provided, add activity to task.md: `- YYYY-MM-DD: Plan updated`
3. Call `ExitPlanMode` so the user can review in VS Code

**Output**: Updated plan submitted for approval

---

## Guidelines

- **Be skeptical**: Question problematic change requests, verify technical feasibility, point out conflicts with existing phases
- **Be surgical**: Make precise edits, preserve good content, only research what's needed
- **Be thorough**: Read the full plan before editing, ensure updated sections maintain quality
- **Be interactive**: Confirm understanding before editing, show what you plan to change, allow course corrections
- **No open questions**: If changes raise questions, ask or research immediately -- never leave unresolved items
- **Success criteria**: Maintain automated (prefer `make` commands) vs manual distinction
- **Sub-tasks**: Only spawn if truly needed; be specific about directories; request file:line references; wait for all to complete
