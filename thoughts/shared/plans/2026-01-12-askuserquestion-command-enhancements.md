---
type: implementation-plan
title: "AskUserQuestion Enhancements for Bootandshoe Commands"
created: 2026-01-12
status: complete
git_commit: a3f1a352c7d13b4e44cb7b3fcc373fae6de11bd1
branch: main
---

# AskUserQuestion Enhancements for Bootandshoe Commands

## Overview

Add structured user interaction via the AskUserQuestion tool to four bootandshoe commands: `/validate_plan`, `/review_plan`, `/create_plan`, and `/iterate_plan`. This follows the pattern established by `/create_prd` which successfully uses AskUserQuestion for iterative requirement gathering.

## Current State Analysis

The bootandshoe commands currently use conversational (freeform text) interaction patterns:

| Command | Current Pattern | Pain Points |
|---------|----------------|-------------|
| `/validate_plan` | Shows checkboxes, no collection | No way to record manual test results |
| `/review_plan` | Expects `<feedback>` XML tags | Requires users to learn custom syntax |
| `/create_plan` | Freeform design option selection | Ambiguous responses, easy to miss decisions |
| `/iterate_plan` | Freeform confirmation | Unclear what type of changes are requested |

### Key Discovery

The `/create_prd` command (just added) demonstrates that AskUserQuestion can effectively guide users through structured phases while maintaining flexibility via the "Other" option.

## Desired End State

Each command uses AskUserQuestion at key decision points to:
- Collect structured responses that are unambiguous
- Ensure all critical steps are addressed
- Reduce cognitive load on users
- Enable better tracking/logging of decisions

## What We're NOT Doing

- Converting all interaction to AskUserQuestion (some steps benefit from freeform)
- Removing conversational elements entirely (summaries, explanations remain freeform)
- Modifying `/oneshot` (intentionally non-interactive)
- Modifying `/research_codebase` (exploratory nature benefits from open-ended queries)

## Implementation Approach

Add AskUserQuestion calls at specific decision points within each command. The tool supports 1-4 questions per call, with 2-4 options each, and optional multiSelect.

---

## Phase 1: `/validate_plan` - Manual Verification Collection

### Overview

Add structured collection of manual verification results. This is the highest-impact change since `/validate_plan` currently has no way to record whether manual tests passed.

### Changes Required

**File**: `bootandshoe/commands/validate_plan.md`

#### 1. Add Manual Verification Phase

After automated verification completes, add a structured phase to collect manual test results.

**Add after the automated verification section:**

```markdown
### Manual Verification Collection

After presenting automated verification results, use AskUserQuestion to collect manual test outcomes:

For each manual verification item in the plan's success criteria:

1. **Present the test** with structured options:
   ```
   AskUserQuestion:
   Question: "[Manual test description from plan]"
   Header: "Manual test"
   Options:
   - "Passed" - Test completed successfully
   - "Failed" - Test revealed issues (will document)
   - "Skipped" - Unable to test at this time
   - "N/A" - Not applicable to current implementation
   ```

2. **If any test failed**, follow up:
   ```
   AskUserQuestion:
   Question: "What issue did you find during '[test name]'?"
   Header: "Issue"
   Options:
   - "Functionality broken" - Feature doesn't work as expected
   - "Performance issue" - Too slow or resource-intensive
   - "UI/UX problem" - Works but user experience is poor
   - "Edge case failure" - Works normally but fails in specific scenarios
   ```
   Then ask for details via freeform text.

3. **Final sign-off**:
   ```
   AskUserQuestion:
   Question: "What is the validation status?"
   Header: "Status"
   Options:
   - "All passed - ready for merge"
   - "Issues found - needs fixes before merge"
   - "Partially verified - some tests deferred"
   - "Blocked - cannot complete validation"
   ```
```

#### 2. Update Validation Report

Add a section to the validation report that summarizes collected results:

```markdown
## Validation Summary

### Automated Verification
- [x] All automated checks passed

### Manual Verification
| Test | Result | Notes |
|------|--------|-------|
| [Test 1] | Passed | - |
| [Test 2] | Failed | [Issue description] |

### Final Status: [Selected sign-off option]
```

### Success Criteria

#### Automated Verification:
- [x] Command file updated with AskUserQuestion sections
- [x] Validation passes: `npm run validate`

#### Manual Verification:
- [x] `/validate_plan` prompts for each manual test result
- [x] Failed tests trigger follow-up questions
- [x] Final sign-off is collected
- [x] Validation report includes collected results

---

## Phase 2: `/review_plan` - Structured Feedback Collection

### Overview

Replace the `<feedback>` XML tag pattern with structured AskUserQuestion prompts for each review section.

### Changes Required

**File**: `bootandshoe/commands/review_plan.md`
**File**: `bootandshoe/commands/review_plan_nt.md`

#### 1. Replace Section Review Pattern

**Current pattern (remove):**
```markdown
After each section, ask:
"Any feedback on [section]? Use <feedback>your feedback</feedback> or say 'looks good'."
```

**New pattern (add):**
```markdown
After presenting each section, use AskUserQuestion:

**For Scope Review:**
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

**For Technical Approach:**
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

**For Each Phase:**
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

**For Final Action:**
```
AskUserQuestion:
Question: "What would you like to do with this feedback?"
Header: "Action"
Options:
- "Update plan now" - Run /iterate_plan with collected feedback
- "Save for later" - Document feedback without updating
- "Discuss further" - Talk through specific items
- "Approve as-is" - Plan is ready for implementation
```
```

#### 2. Collect Detailed Feedback

When user selects options indicating issues (Missing items, Remove items, Needs refinement, etc.), follow up with freeform text collection:

```markdown
If the user selected an option indicating issues:
- Summarize what they flagged
- Ask: "Please describe the specific feedback for [section/phase]:"
- Collect freeform response
- Add to feedback summary
```

#### 3. Generate Feedback Summary

At the end of review, generate a structured summary:

```markdown
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
| Phase 1 | [Options selected] | [Details] |
| Phase 2 | [Options selected] | [Details] |

### Recommended Action: [Final action selected]
```

### Success Criteria

#### Automated Verification:
- [x] Both review_plan.md and review_plan_nt.md updated
- [x] Validation passes: `npm run validate`

#### Manual Verification:
- [x] `/review_plan` uses AskUserQuestion for each section
- [x] Selecting issue options triggers follow-up
- [x] Feedback summary is generated
- [x] "Update plan now" triggers `/iterate_plan`

---

## Phase 3: `/create_plan` - Decision Point Structuring

### Overview

Add AskUserQuestion at key decision points during planning: design option selection, phase structure approval, and web research decisions.

### Changes Required

**File**: `bootandshoe/commands/create_plan.md`
**File**: `bootandshoe/commands/create_plan_nt.md`
**File**: `bootandshoe/commands/create_plan_generic.md`

#### 1. Design Option Selection

**Current pattern:**
```markdown
**Design Options:**
1. [Option A] - [pros/cons]
2. [Option B] - [pros/cons]

Which approach aligns best with your vision?
```

**New pattern:**
```markdown
After presenting design options, use AskUserQuestion:

```
AskUserQuestion:
Question: "Which technical approach should we use?"
Header: "Approach"
Options: [Dynamically generated based on research]
- "[Option A name]" - [Brief pro]
- "[Option B name]" - [Brief pro]
- "Discuss trade-offs" - Need more information before deciding
- "Hybrid approach" - Combine elements from multiple options
```

If "Discuss trade-offs" selected, provide detailed comparison then re-ask.
If "Hybrid approach" selected, ask which elements to combine via freeform.
```

#### 2. Phase Structure Approval

**Current pattern:**
```markdown
Does this phasing make sense? Should I adjust the order or granularity?
```

**New pattern:**
```markdown
After presenting phase structure, use AskUserQuestion:

```
AskUserQuestion:
Question: "Does this phase structure work?"
Header: "Structure"
Options:
- "Yes, proceed" - Write detailed plan with this structure
- "Adjust order" - Phases should be reordered
- "Split phases" - Some phases are too large
- "Merge phases" - Some phases should be combined
```

If adjustment needed, ask for specifics via freeform, then re-present structure.
```

#### 3. Web Research Decisions

**Current pattern:**
```markdown
Would you like me to search the web for current best practices for [topic]?
```

**New pattern:**
```markdown
When web research may be valuable, use AskUserQuestion:

```
AskUserQuestion:
Question: "Should I research [specific topic] online?"
Header: "Research"
Options:
- "Yes, research this" - Search for current best practices
- "No, proceed" - Existing knowledge is sufficient
- "Research something else" - Will specify different topic
```
```

### Success Criteria

#### Automated Verification:
- [x] All three create_plan variants updated
- [x] Validation passes: `npm run validate`

#### Manual Verification:
- [x] Design options presented with structured selection
- [x] Phase structure approval uses AskUserQuestion
- [x] Web research prompts use structured options
- [x] "Discuss trade-offs" triggers detailed comparison

---

## Phase 4: `/iterate_plan` - Change Confirmation

### Overview

Add structured confirmation before making changes to ensure clear understanding of requested modifications.

### Changes Required

**File**: `bootandshoe/commands/iterate_plan.md`
**File**: `bootandshoe/commands/iterate_plan_nt.md`

#### 1. Change Type Classification

When feedback is provided but change type is ambiguous:

```markdown
If the type of change isn't clear from the feedback, use AskUserQuestion:

```
AskUserQuestion:
Question: "What type of changes are needed?"
Header: "Change type"
multiSelect: true
Options:
- "Add new phase" - Insert additional implementation phase
- "Modify existing phase" - Update details of current phase
- "Update success criteria" - Change how we verify completion
- "Adjust scope" - Change what's in/out of scope
```

Use selected options to focus the iteration.
```

#### 2. Understanding Confirmation

Before making any changes:

```markdown
After presenting your understanding of requested changes:

```
AskUserQuestion:
Question: "Does this capture the changes you want?"
Header: "Confirm"
Options:
- "Yes, make changes" - Proceed with updates
- "Needs adjustment" - Will clarify what's different
- "Research first" - Need more codebase investigation
- "Cancel" - Don't make changes right now
```

Only proceed with edits if "Yes, make changes" is selected.
```

### Success Criteria

#### Automated Verification:
- [x] Both iterate_plan variants updated
- [x] Validation passes: `npm run validate`

#### Manual Verification:
- [x] Ambiguous feedback triggers change type question
- [x] Understanding confirmation required before edits
- [x] "Research first" spawns additional investigation
- [x] "Cancel" gracefully exits without changes

---

## Phase 5: Documentation Updates

### Overview

Update documentation to reflect new interaction patterns.

### Changes Required

**File**: `docs/bootandshoe.md`

#### Add Interaction Patterns Section

```markdown
## Interaction Patterns

Commands use two interaction styles:

### Structured (AskUserQuestion)
Used for key decisions where clear choices improve workflow:
- `/create_prd` - All phases use structured questions
- `/validate_plan` - Manual verification collection
- `/review_plan` - Section-by-section feedback
- `/create_plan` - Design options, phase approval
- `/iterate_plan` - Change confirmation

### Conversational (Freeform)
Used for exploration and detailed explanations:
- `/research_codebase` - Open-ended investigation
- `/oneshot` - Quick execution without interaction
- Summaries and explanations within all commands
```

### Success Criteria

#### Automated Verification:
- [x] Documentation updated
- [x] Validation passes: `npm run validate`

#### Manual Verification:
- [x] New section accurately describes patterns
- [x] Examples are clear

---

## Testing Strategy

### Unit Tests
- Not applicable (prompt-based commands)

### Integration Tests
- Not applicable

### Manual Testing Steps

1. **validate_plan flow**: Run `/validate_plan` on a completed implementation, verify manual test collection works
2. **review_plan flow**: Run `/review_plan` on an existing plan, verify structured feedback collection
3. **create_plan decisions**: Run `/create_plan`, verify design options use AskUserQuestion
4. **iterate_plan confirmation**: Run `/iterate_plan` with vague feedback, verify clarification questions

## Performance Considerations

- AskUserQuestion adds round-trips but improves clarity
- Each question phase should have 2-4 options max to avoid overwhelming users
- Use multiSelect sparingly (only when multiple selections make sense)

## Migration Notes

- Existing `/review_plan` `<feedback>` tag pattern will still work (backwards compatible)
- Users accustomed to freeform responses can always select "Other"

## References

- Pattern established by: `bootandshoe/commands/create_prd.md`
- AskUserQuestion tool documentation
- Related: `/Users/nicholasstrayer/.claude/plans/sunny-launching-babbage.md` (PRD command plan)
