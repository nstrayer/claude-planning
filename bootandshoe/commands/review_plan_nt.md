---
description: Review existing plans and collect structured feedback for improvements (no thoughts directory)
model: opus
---

# Review Plan

You are tasked with facilitating a structured review of an existing implementation plan. Your goal is to guide the user through a comprehensive review process and collect actionable feedback.

## Initial Response

When this command is invoked:

1. **Check if a plan file was provided**:
   - If provided, read the plan file FULLY
   - If not provided, ask for the plan path

2. **If no plan file provided**, respond with:
   ```
   I'll help you review an implementation plan and collect structured feedback.

   Which plan would you like to review? Please provide the path to the plan file.
   ```

## Review Process

### Step 1: Present Plan Summary

After reading the plan, present a structured summary:

```
## Plan Summary: [Title]

**Goal**: [1-sentence summary of what the plan accomplishes]

**Phases**:
1. [Phase 1 name] - [brief description]
2. [Phase 2 name] - [brief description]
...

**Key Technical Decisions**:
- [Decision 1]
- [Decision 2]

**Success Criteria Overview**:
- Automated: [count] checks
- Manual: [count] verification steps

Ready to begin the review? I'll walk through each section and collect your feedback.
```

### Step 2: Section-by-Section Review

Guide the user through reviewing each major section:

#### 2.1 Scope Review
```
## Scope Review

**Currently IN scope**:
- [Item 1]
- [Item 2]

**Currently OUT of scope**:
- [Item 1]
- [Item 2]

Questions:
- Is anything missing from the scope?
- Should anything be removed or deferred?
- Are the boundaries clear?

Provide feedback using <feedback> tags or respond with "looks good" to continue.
```

#### 2.2 Technical Approach Review
```
## Technical Approach Review

**Proposed approach**: [Summary]

**Key patterns/conventions being followed**:
- [Pattern 1] from [file:line]
- [Pattern 2] from [file:line]

Questions:
- Does this approach align with how you want the system to evolve?
- Are there alternative approaches worth considering?
- Any concerns about maintainability or complexity?

Provide feedback using <feedback> tags or respond with "looks good" to continue.
```

#### 2.3 Phase-by-Phase Review
For each phase:
```
## Phase [N]: [Name] Review

**Changes**:
- [Change 1]
- [Change 2]

**Dependencies**: [What this phase depends on]

**Success Criteria**:
- Automated: [List]
- Manual: [List]

Questions:
- Is this phase properly scoped?
- Are the success criteria measurable and complete?
- Any missing edge cases?

Provide feedback using <feedback> tags or respond with "looks good" to continue.
```

#### 2.4 Risk Assessment
```
## Risk Assessment

Based on my analysis, potential risks include:
- **[Risk 1]**: [Description and mitigation in plan]
- **[Risk 2]**: [Description and mitigation in plan]

Questions:
- Are there risks I haven't identified?
- Are the mitigations adequate?
- Should any risks block implementation?

Provide feedback using <feedback> tags or respond with "looks good" to continue.
```

### Step 3: Feedback Summary

After completing the review:

```
## Review Summary

**Feedback Collected**:

### Scope
- [Feedback item 1]
- [Feedback item 2]

### Technical Approach
- [Feedback item 1]

### Phase-Specific
- Phase 1: [Feedback]
- Phase 2: [Feedback]

### Risks
- [Feedback item 1]

**Recommended Actions**:
1. [Action based on feedback]
2. [Action based on feedback]

Would you like me to:
1. Update the plan with this feedback now (runs /iterate_plan)
2. Discuss specific items in more detail
```

### Step 4: Apply Feedback

**If user chooses to update**:
- Transition to iterate_plan workflow with collected feedback
- Apply changes systematically

## Important Guidelines

1. **Be Systematic**: Cover every section of the plan
2. **Be Specific**: Ask targeted questions, not generic ones
3. **Collect Structured Feedback**: Encourage `<feedback>` tag usage
4. **Summarize Clearly**: Make it easy to see all feedback at once
5. **Enable Action**: Offer clear next steps after review

## Feedback Tag Processing

Throughout the review, watch for `<feedback>` tags:

```
<feedback>
Phase 2 success criteria need a specific performance benchmark
</feedback>
```

- Acknowledge each feedback item
- Categorize by section (scope, approach, phase, risk)
- Include all feedback in the final summary
