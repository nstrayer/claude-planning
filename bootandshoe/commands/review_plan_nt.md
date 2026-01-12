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

Present the scope, then use AskUserQuestion:

```
## Scope Review

**Currently IN scope**:
- [Item 1]
- [Item 2]

**Currently OUT of scope**:
- [Item 1]
- [Item 2]
```

Then ask:
```
AskUserQuestion:
Question: "How does the scope look?"
Header: "Scope"
Options:
- "Scope is complete" - All necessary items included
- "Missing items" - Something should be added (will specify)
- "Remove items" - Something is out of scope (will specify)
- "Needs clarification" - Boundaries are unclear
```

If user selects "Missing items", "Remove items", or "Needs clarification":
- Ask: "Please describe what needs to change:"
- Collect freeform response
- Add to feedback summary

#### 2.2 Technical Approach Review

Present the approach, then use AskUserQuestion:

```
## Technical Approach Review

**Proposed approach**: [Summary]

**Key patterns/conventions being followed**:
- [Pattern 1] from [file:line]
- [Pattern 2] from [file:line]
```

Then ask:
```
AskUserQuestion:
Question: "How does the technical approach look?"
Header: "Approach"
Options:
- "Approach is sound" - Good technical direction
- "Consider alternative" - Different approach may be better
- "Complexity concerns" - Solution is over-engineered
- "Maintainability concerns" - Will be hard to maintain
```

If user selects anything other than "Approach is sound":
- Ask: "Please describe your concerns or the alternative you'd prefer:"
- Collect freeform response
- Add to feedback summary

#### 2.3 Phase-by-Phase Review

For each phase, present the details, then use AskUserQuestion:

```
## Phase [N]: [Name] Review

**Changes**:
- [Change 1]
- [Change 2]

**Dependencies**: [What this phase depends on]

**Success Criteria**:
- Automated: [List]
- Manual: [List]
```

Then ask:
```
AskUserQuestion:
Question: "How does Phase [N]: [Name] look?"
Header: "Phase [N]"
multiSelect: true
Options:
- "Scope appropriate" - Phase is right-sized
- "Success criteria clear" - Know when it's done
- "Dependencies identified" - Prerequisites are clear
- "Needs refinement" - Will provide specific feedback
```

If user selects "Needs refinement":
- Ask: "What needs to change in this phase?"
- Collect freeform response
- Add to feedback summary

#### 2.4 Risk Assessment

Present risks, then use AskUserQuestion:

```
## Risk Assessment

Based on my analysis, potential risks include:
- **[Risk 1]**: [Description and mitigation in plan]
- **[Risk 2]**: [Description and mitigation in plan]
```

Then ask:
```
AskUserQuestion:
Question: "How does the risk assessment look?"
Header: "Risks"
Options:
- "Risks well-covered" - All major risks identified with adequate mitigations
- "Missing risks" - Important risks not identified
- "Mitigations inadequate" - Risk responses need strengthening
- "Blocking concerns" - Some risks should block implementation
```

If user selects anything other than "Risks well-covered":
- Ask: "Please describe the risk concerns:"
- Collect freeform response
- Add to feedback summary

### Step 3: Feedback Summary

After completing the review, generate a structured summary:

```
## Review Feedback Summary

### Scope
- Status: [Selected option]
- Details: [If provided]

### Technical Approach
- Status: [Selected option]
- Details: [If provided]

### Phase Reviews
| Phase | Status | Feedback |
|-------|--------|----------|
| Phase 1 | [Options selected] | [Details if any] |
| Phase 2 | [Options selected] | [Details if any] |

### Risks
- Status: [Selected option]
- Details: [If provided]
```

Then use AskUserQuestion for final action:
```
AskUserQuestion:
Question: "What would you like to do with this feedback?"
Header: "Action"
Options:
- "Update plan now" - Run /iterate_plan with collected feedback
- "Discuss further" - Talk through specific items
- "Approve as-is" - Plan is ready for implementation
```

### Step 4: Apply Feedback

Based on the user's selection:

**If "Update plan now"**:
- Transition to iterate_plan workflow with collected feedback
- Apply changes systematically

**If "Discuss further"**:
- Ask which specific items they want to discuss
- Have a freeform conversation about those items
- Return to the action question when ready

**If "Approve as-is"**:
- Confirm the plan is ready for implementation
- Suggest running `/implement_plan` as next step

## Important Guidelines

1. **Be Systematic**: Cover every section of the plan
2. **Be Specific**: Ask targeted questions, not generic ones
3. **Collect Structured Feedback**: Use AskUserQuestion at each section
4. **Summarize Clearly**: Make it easy to see all feedback at once
5. **Enable Action**: Offer clear next steps after review

## Backwards Compatibility

The legacy `<feedback>` tag pattern still works for users who prefer it:

```
<feedback>
Phase 2 success criteria need a specific performance benchmark
</feedback>
```

If you see `<feedback>` tags in user responses:
- Acknowledge each feedback item
- Categorize by section (scope, approach, phase, risk)
- Include all feedback in the final summary
- Treat them as equivalent to structured responses
