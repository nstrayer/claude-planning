---
description: Start a new feature with task document and PRD
model: opus
allowed-tools: ["Read", "Write", "Edit", "Grep", "Glob", "Bash", "AskUserQuestion", "Task"]
---

# Start Feature

You are tasked with starting a new feature through an interactive process. This creates a feature directory with a task document (context anchor) and PRD.

## Initial Response

When this command is invoked:

1. **Check for GitHub issue URL parameter**:
   - If URL provided (e.g., `https://github.com/org/repo/issues/123`), fetch issue details
   - Extract issue number from URL
   - Run: `gh issue view {number} --json title,body,labels`
   - Use title/body as context for PRD conversation

2. **Check for existing PRDs**:
   - Search `thoughts/shared/prds/` for PRDs matching keywords from the feature name or issue
   - If matches found, use AskUserQuestion:
     ```
     Question: "I found existing PRDs that might be relevant. How should I proceed?"
     Header: "Existing PRD"
     Options:
     - "Use [PRD name]" - Use this PRD for the feature (one option per match, max 3)
     - "Create new PRD" - Start fresh with interactive PRD creation
     ```
   - If user selects existing PRD, skip to Feature Directory Creation

3. **If no parameters provided**, respond with:
```
I'll help you start a new feature. This creates:
- A feature directory at `thoughts/features/{slug}/`
- A task document (task.md) to anchor context across sessions
- A PRD through structured questioning

You can also provide a GitHub issue URL: `/feature_start https://github.com/org/repo/issues/123`

Let's begin by understanding what you're building.
```

Then proceed to Phase 1.

## PRD Creation Phases

### Phase 1: Feature Overview

Use AskUserQuestion to gather high-level understanding:

```
AskUserQuestion with questions:
1. "What feature or capability are you proposing?" (header: "Feature")
   Options: Provide 2-4 relevant options based on context, or let user describe freely

2. "What user problem does this solve?" (header: "Problem")
   Options: Common problem types relevant to the domain

3. "Who are the primary users of this feature?" (header: "Users")
   Options: Common user personas, with multiSelect: true if multiple may apply
```

After receiving answers, summarize:
```
Based on your responses, I understand:
- Feature: [summary]
- Problem: [summary]
- Users: [summary]

Does this capture your intent? Let me know if anything needs adjustment, then I'll continue to use cases.
```

### Phase 2: Use Cases & User Stories

Use AskUserQuestion to explore user interactions:

```
AskUserQuestion with questions:
1. "What is the primary use case for this feature?" (header: "Main use case")
   Options: 2-4 common use case patterns based on the feature type

2. "What triggers users to need this feature?" (header: "Trigger")
   Options: Common triggers (user action, system event, time-based, etc.)

3. "What is the expected outcome when the feature is used successfully?" (header: "Outcome")
   Options: Common success outcomes
```

After receiving answers, formulate user stories:
```
Based on your input, here are the user stories:

1. As a [persona], I want to [action from use case] so that [outcome].
2. [Additional stories if multiple use cases]

Do these capture the key interactions? I can adjust or add more before we continue.
```

### Phase 3: Requirements

Use AskUserQuestion to define requirements:

```
AskUserQuestion with questions:
1. "What are the must-have functional requirements?" (header: "Must-have", multiSelect: true)
   Options: Derive from use cases - list 3-4 key capabilities

2. "Are there nice-to-have features for future consideration?" (header: "Nice-to-have", multiSelect: true)
   Options: Common enhancements based on feature type

3. "What non-functional requirements matter?" (header: "Non-functional", multiSelect: true)
   Options:
   - Performance (fast response times)
   - Security (data protection, authentication)
   - Accessibility (screen readers, keyboard nav)
   - Reliability (error handling, recovery)
```

After receiving answers, summarize requirements:
```
Requirements summary:

**Must-Have:**
- [Requirement 1]
- [Requirement 2]

**Nice-to-Have:**
- [If any selected]

**Non-Functional:**
- [Selected constraints]

Any requirements to add or modify?
```

### Phase 4: Constraints & Scope

Use AskUserQuestion to define boundaries:

```
AskUserQuestion with questions:
1. "What technical constraints exist?" (header: "Constraints", multiSelect: true)
   Options: Common constraints (existing architecture, API limits, browser support, etc.)

2. "What is explicitly OUT of scope?" (header: "Out of scope", multiSelect: true)
   Options: Related features that could be confused as in-scope

3. "Are there dependencies or integrations?" (header: "Dependencies", multiSelect: true)
   Options: Common integration points based on context
```

After receiving answers:
```
Scope boundaries defined:

**Constraints:**
- [Constraint 1]

**Out of Scope:**
- [Item 1]
- [Item 2]

**Dependencies:**
- [If any]

This helps prevent scope creep. Any adjustments needed?
```

### Phase 5: Success Criteria

Use AskUserQuestion to define completion criteria:

```
AskUserQuestion with questions:
1. "What are the key acceptance criteria?" (header: "Acceptance", multiSelect: true)
   Options: Derive from requirements - testable criteria

2. "How will success be measured?" (header: "Metrics")
   Options: Common success metrics (user adoption, task completion, error reduction, etc.)

3. "What would make this feature a failure?" (header: "Failure signals")
   Options: Common failure indicators (helps clarify success by contrast)
```

After receiving answers:
```
Success criteria established:

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

**Success Metrics:**
- [Metric 1]

**Failure Signals:**
- [Signal 1]

Ready to generate the feature directory and PRD?
```

## Feature Directory Creation

### Generate Feature Slug

**If GitHub issue provided:**
- Format: `issue-{number}-{short-desc}`
- Example: `issue-123-user-auth`
- Max 30 characters, kebab-case
- Use first few words of issue title for description

**If no issue:**
- Use AskUserQuestion:
  ```
  Question: "What slug should I use for this feature directory?"
  Header: "Feature slug"
  Options:
  - "[auto-generated-slug]" - Based on feature name (Recommended)
  - "Custom slug" - I'll specify my own
  ```
- If custom, collect freeform input
- Validate: lowercase, kebab-case, no spaces

**Always confirm before creating:**
```
I'll create the feature directory at:
  thoughts/features/{slug}/

With files:
  - task.md (context anchor)
  - prd.md (requirements document)

Proceed?
```

### Create Feature Directory

1. **Create directory**: `thoughts/features/{slug}/`

2. **Create task.md**:

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

3. **Create prd.md** using template:

```markdown
---
type: prd
title: "{Feature Name}"
created: {YYYY-MM-DD}
status: draft
---

# {Feature Name} PRD

## Overview

{Brief description from Phase 1}

## Problem Statement

{What user problem are we solving? From Phase 1}

## Goals & Objectives

- {Goal 1 - derived from problem and outcome}
- {Goal 2}

## User Personas

{From Phase 1}

## User Stories

{From Phase 2}
- As a [persona], I want to [action] so that [benefit]
- [Additional stories]

## Requirements

### Functional Requirements

{Must-have items from Phase 3}
- {Requirement 1}
- {Requirement 2}

### Nice-to-Have

{Optional items from Phase 3, if any}
- {Item 1}

### Non-Functional Requirements

{From Phase 3}
- **Performance**: {if selected}
- **Security**: {if selected}
- **Accessibility**: {if selected}

## Acceptance Criteria

{From Phase 5}
- [ ] {Criterion 1}
- [ ] {Criterion 2}

## Technical Considerations

{From Phase 4 - constraints and dependencies}

## Out of Scope

{From Phase 4}
- {Item 1}
- {Item 2}

## Success Metrics

{From Phase 5}
- {Metric 1}

## Open Questions

{Any unresolved items discovered during questioning}
```

## Final Output

After creating the feature directory:

```
Feature directory created at: thoughts/features/{slug}/

Files created:
- task.md - Context anchor for this feature
- prd.md - Product requirements document

Next steps:
1. Review and refine the PRD if needed
2. Create implementation plan: /feature_plan @thoughts/features/{slug}/task.md
3. Implement: /feature_implement @thoughts/features/{slug}/task.md
4. Validate: /feature_validate @thoughts/features/{slug}/task.md

The task.md file will track status, decisions, and activity throughout the feature lifecycle.
```

## Using Existing PRD

If user selected an existing PRD:

1. **Read the existing PRD** completely
2. **Generate feature slug** from PRD title
3. **Create feature directory** with:
   - task.md pointing to the existing PRD
   - Copy or symlink the PRD to the feature directory

```markdown
# Feature: {Name from PRD}

**Status:** planning
**Issue:** {GitHub link if provided, else "None"}
**PRD:** ./prd.md
**Plan:** (not yet created)

## Decisions

(none yet)

## Recent Activity

- {YYYY-MM-DD}: Feature started from existing PRD
```

4. **Copy the PRD** to `thoughts/features/{slug}/prd.md`

## Important Guidelines

1. **Use AskUserQuestion strategically**:
   - Ask 2-4 questions per phase (tool supports 1-4)
   - Provide meaningful options based on context
   - Use multiSelect for lists (requirements, constraints)
   - Keep option labels concise (1-5 words)

2. **Adapt options dynamically**:
   - Base options on previous answers
   - Use domain knowledge to suggest relevant choices
   - Always allow "Other" (built into the tool)

3. **Summarize between phases**:
   - Confirm understanding before moving on
   - Allow corrections without restarting
   - Build the PRD incrementally

4. **Handle incomplete information**:
   - Add unresolved items to "Open Questions"
   - Don't block creation for minor gaps
   - Note assumptions made

5. **Keep it focused**:
   - PRDs are product documents, not technical specs
   - Avoid implementation details
   - Focus on WHAT, not HOW

## Example Interaction Flow

```
User: /feature_start https://github.com/myorg/myrepo/issues/42