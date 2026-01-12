---
description: Create Product Requirements Documents through interactive requirement gathering
model: opus
---

# Create PRD

You are tasked with creating Product Requirements Documents (PRDs) through an interactive, structured process using the AskUserQuestion tool. Guide the user through requirement gathering in phases, then generate a comprehensive PRD.

## Initial Response

When this command is invoked:

1. **Check if a feature description was provided**:
   - If text was provided as a parameter, use it as the starting point
   - Skip directly to Phase 1 with the provided context

2. **If no parameters provided**, respond with:
```
I'll help you create a Product Requirements Document (PRD) through structured questioning.

I'll guide you through 5 phases:
1. Feature Overview - What are we building and why?
2. Use Cases - How will users interact with this feature?
3. Requirements - What must it do?
4. Constraints & Scope - What are the boundaries?
5. Success Criteria - How do we know it's done?

Let's start with the first phase.
```

Then immediately proceed to Phase 1.

## Process Steps

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

Ready to generate the PRD?
```

### Phase 6: PRD Generation

After completing all phases:

1. **Use TodoWrite** to track PRD generation
2. **Generate the PRD** using the template below
3. **Save to** `thoughts/shared/prds/YYYY-MM-DD-description.md`
   - Use today's date
   - Use kebab-case description derived from feature name
4. **Present the PRD location** and offer to iterate

## PRD Template

```markdown
---
type: prd
title: "[Feature Name]"
created: YYYY-MM-DD
status: draft
---

# [Feature Name] PRD

## Overview

[Brief description of what we're building - 2-3 sentences from Phase 1]

## Problem Statement

[What user problem are we solving? From Phase 1]

## Goals & Objectives

- [Goal 1 - derived from problem and outcome]
- [Goal 2]

## User Personas

[Who will use this feature - from Phase 1]

## User Stories

[From Phase 2]
- As a [persona], I want to [action] so that [benefit]
- [Additional stories]

## Requirements

### Functional Requirements

[Must-have items from Phase 3]
- [Requirement 1]
- [Requirement 2]

### Nice-to-Have

[Optional items from Phase 3, if any]
- [Item 1]

### Non-Functional Requirements

[From Phase 3]
- **Performance**: [if selected]
- **Security**: [if selected]
- **Accessibility**: [if selected]

## Acceptance Criteria

[From Phase 5]
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Technical Considerations

[From Phase 4 - constraints and dependencies]

## Out of Scope

[From Phase 4]
- [Item 1]
- [Item 2]

## Success Metrics

[From Phase 5]
- [Metric 1]

## Open Questions

[Any unresolved items discovered during questioning]
```

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
   - Don't block PRD generation for minor gaps
   - Note assumptions made

5. **Keep it focused**:
   - PRDs are product documents, not technical specs
   - Avoid implementation details
   - Focus on WHAT, not HOW

## Example Interaction Flow

```
User: /create_prd