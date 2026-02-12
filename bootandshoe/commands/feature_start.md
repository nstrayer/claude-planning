---
description: Start a new feature with task document and PRD
model: opus
allowed-tools: ["Read", "Write", "Edit", "Grep", "Glob", "Bash", "AskUserQuestion", "Task"]
argument-hint: Optional GitHub issue URL
---

# Start Feature

Guide the user through creating a feature directory with a task document and PRD. Follow a systematic approach: gather context, ask structured questions across 5 phases, then create the feature directory with task.md and prd.md.

## Core Principles

- **Use AskUserQuestion for every phase**: Call the tool to collect answers -- do not simulate or narrate responses
- **Summarize between phases**: Confirm understanding before moving on
- **Adapt options dynamically**: Base options on previous answers and domain context
- **Keep PRDs product-focused**: Focus on WHAT, not HOW -- no implementation details

**Initial request:** $ARGUMENTS

---

## Phase 0: Setup

**Goal**: Determine starting context

**Actions**:
1. If a GitHub issue URL was provided in arguments:
   - Extract issue number from URL
   - Run `gh issue view {number} --json title,body,labels` via Bash
   - Use title/body as context for subsequent phases
2. Search `thoughts/shared/prds/` via Glob for PRDs matching keywords from the feature name or issue
3. If matching PRDs found, use AskUserQuestion to ask whether to use an existing PRD or create a new one
   - If user selects existing PRD, skip to Phase 6 (Feature Directory Creation)
4. If no arguments provided, briefly explain what this command creates (feature directory, task.md, PRD) and proceed to Phase 1

**Output**: Context gathered, ready for PRD creation or existing PRD selected

---

## Phase 1: Feature Overview

**Goal**: Understand the feature at a high level

**Actions**:
1. Call AskUserQuestion with up to 3 questions:
   - What feature or capability is being proposed (header: "Feature")
   - What user problem does this solve (header: "Problem")
   - Who are the primary users (header: "Users", multiSelect: true)
2. Generate options dynamically based on any issue context from Phase 0
3. After receiving answers, summarize understanding and ask if it captures their intent before continuing

**Output**: Clear understanding of feature, problem, and users

---

## Phase 2: Use Cases & User Stories

**Goal**: Define how users will interact with the feature

**Actions**:
1. Call AskUserQuestion with up to 3 questions:
   - Primary use case (header: "Main use case") -- derive options from Phase 1 answers
   - What triggers users to need this (header: "Trigger")
   - Expected outcome on success (header: "Outcome")
2. Formulate user stories in "As a [persona], I want to [action] so that [outcome]" format
3. Present stories and confirm with user before continuing

**Output**: User stories confirmed

---

## Phase 3: Requirements

**Goal**: Define functional and non-functional requirements

**Actions**:
1. Call AskUserQuestion with up to 3 questions:
   - Must-have functional requirements (header: "Must-have", multiSelect: true) -- derive from use cases
   - Nice-to-have features for later (header: "Nice-to-have", multiSelect: true)
   - Non-functional requirements (header: "Non-functional", multiSelect: true) -- options: Performance, Security, Accessibility, Reliability
2. Summarize requirements and confirm with user

**Output**: Requirements defined and confirmed

---

## Phase 4: Constraints & Scope

**Goal**: Define boundaries to prevent scope creep

**Actions**:
1. Call AskUserQuestion with up to 3 questions:
   - Technical constraints (header: "Constraints", multiSelect: true)
   - What is explicitly out of scope (header: "Out of scope", multiSelect: true) -- suggest related features that could be confused as in-scope
   - Dependencies or integrations (header: "Dependencies", multiSelect: true)
2. Summarize scope boundaries and confirm with user

**Output**: Scope boundaries established

---

## Phase 5: Success Criteria

**Goal**: Define how completion will be measured

**Actions**:
1. Call AskUserQuestion with up to 3 questions:
   - Key acceptance criteria (header: "Acceptance", multiSelect: true) -- derive testable criteria from requirements
   - How success will be measured (header: "Metrics")
   - What would make this feature a failure (header: "Failure signals")
2. Summarize success criteria and confirm with user
3. Ask if the user is ready to generate the feature directory

**Output**: Success criteria established, ready for directory creation

---

## Phase 6: Feature Directory Creation

**Goal**: Create the feature directory with task.md and prd.md

### Step 1: Generate slug

- If GitHub issue was provided: use format `issue-{number}-{short-desc}`, max 30 chars, kebab-case
- Otherwise: use AskUserQuestion to propose an auto-generated slug based on the feature name, with option for custom slug
- Validate: lowercase, kebab-case, no spaces

### Step 2: Create directory and files

1. Create directory `thoughts/features/{slug}/` via Bash
2. Write `thoughts/features/{slug}/task.md` with this structure:

```markdown
# Feature: {Name}

**Status:** planning
**Issue:** {GitHub link or "None"}
**PRD:** ./prd.md
**Plan:** (not yet created)

## Decisions

(none yet)

## Recent Activity

- {YYYY-MM-DD}: Feature started
```

3. Write `thoughts/features/{slug}/prd.md` -- populate all sections from the 5 phases of gathered information. Use this structure:

```markdown
---
type: prd
title: "{Feature Name}"
created: {YYYY-MM-DD}
status: draft
---

# {Feature Name} PRD

## Overview
## Problem Statement
## Goals & Objectives
## User Personas
## User Stories
## Requirements
### Functional Requirements
### Nice-to-Have
### Non-Functional Requirements
## Acceptance Criteria
## Technical Considerations
## Out of Scope
## Success Metrics
## Open Questions
```

### Step 3: If using existing PRD

If the user selected an existing PRD in Phase 0:
1. Read the existing PRD completely
2. Generate slug from PRD title
3. Create task.md pointing to the PRD
4. Copy the PRD to `thoughts/features/{slug}/prd.md`

### Step 4: Report

Tell the user what was created and suggest next steps:
- Review and refine the PRD
- `/feature_plan @thoughts/features/{slug}/task.md` to create implementation plan
- `/feature_implement @thoughts/features/{slug}/task.md` to implement
- `/feature_validate @thoughts/features/{slug}/task.md` to validate

---

## Guidelines

- Ask 2-3 questions per phase using AskUserQuestion (tool supports 1-4)
- Provide meaningful options based on context; use multiSelect for lists
- Keep option labels concise (1-5 words)
- Allow corrections without restarting -- adjust and re-confirm
- Add unresolved items to "Open Questions" in the PRD
- Do not block creation for minor gaps -- note assumptions made
