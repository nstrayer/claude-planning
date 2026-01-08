# Feedback System, Review Mode, and Research Enhancements Implementation Plan

## Overview

Enhance the bootandshoe plugin with three major features: (1) structured feedback collection via `<feedback>` tags during plan creation and iteration, (2) a dedicated review mode command for comprehensive plan feedback, (3) proactive web research suggestions during planning workflows. Additionally, standardize all agents to use the opus model and audit for context efficiency.

## Current State Analysis

### Existing Feedback Mechanisms
- `create_plan.md:271-291` has a Step 5: Review section that presents the plan and asks for general feedback
- `iterate_plan.md:91-111` presents understanding before making changes and asks for confirmation
- Neither command explicitly looks for or processes `<feedback>` tags
- No structured feedback collection beyond free-form text

### Current Web Research Integration
- `web-search-researcher.md` agent exists but is only invoked when explicitly requested
- `create_plan.md:101-119` mentions research agents but not web research
- No proactive suggestions for internet research during planning

### Current Model Configuration
- Commands (`create_plan.md`, `iterate_plan.md`, etc.) use `model: opus`
- Agents (`codebase-analyzer.md`, `codebase-locator.md`, etc.) use `model: sonnet`

## Desired End State

After implementation:
1. Users can provide structured feedback using `<feedback>` tags at any point during plan creation or iteration
2. A `/review_plan` command exists for dedicated, structured feedback collection on existing plans
3. Commands proactively suggest web research when discussing unfamiliar technologies or best practices
4. All agents use `model: opus` for consistency
5. All commands/agents follow latest best practices for context efficiency

### Key Discoveries:
- `create_plan.md:72-87` - Step 1.5 presents understanding and asks questions; good place to add feedback processing
- `iterate_plan.md:91-111` - Step 3 already confirms understanding before changes; natural feedback integration point
- `web-search-researcher.md:39-62` - Has comprehensive search strategies that can be referenced in suggestions
- All 6 agents have `model: sonnet` in frontmatter at line 6

## What We're NOT Doing

- Creating a complex feedback database or tracking system
- Building UI components for feedback collection
- Changing the fundamental plan creation workflow
- Adding feedback analytics or reporting
- Modifying the core agent architecture

## Implementation Approach

Add feedback processing as lightweight instructions within existing workflows. The `<feedback>` tag system integrates naturally into the conversational flow without requiring structural changes. Web research suggestions are added as conditional prompts when discussing technologies or patterns.

---

## Phase 1: Feedback Tag Processing

### Overview
Add instructions to `iterate_plan.md` to recognize and process `<feedback>` tags from user responses when iterating on existing plans. (Note: Removed from `create_plan.md` since there's no document to iterate on during plan creation - natural conversation suffices.)

### Changes Required:

#### 1. Update create_plan.md
**File**: `bootandshoe/commands/create_plan.md`
**Changes**: Add feedback processing guidance to the interactive steps (Steps 1-4), before the plan document is written

Add new section after "Important Guidelines" (around line 330):
```markdown
## Feedback Tag Processing

During the interactive planning conversation (Steps 1-4), users may provide structured feedback using `<feedback>` tags. This helps distinguish specific actionable feedback from general discussion.

### When to Look for Feedback Tags

Check for `<feedback>` tags in user responses during:
- Step 1: After presenting your initial understanding
- Step 2: After presenting research findings and design options
- Step 3: After proposing the plan structure

### How to Process Feedback Tags

1. **Parse all feedback tags** in the user's response:
   ```
   <feedback>
   I want to use PostgreSQL instead of SQLite for this feature
   </feedback>

   <feedback>
   Phase 2 should come before Phase 1 since it's a dependency
   </feedback>
   ```

2. **Acknowledge each piece of feedback** explicitly:
   ```
   I see your feedback:
   1. Use PostgreSQL instead of SQLite - I'll update my approach
   2. Reorder phases - you're right that Phase 2 is a dependency
   ```

3. **Incorporate before proceeding**:
   - If feedback changes your understanding, update it before moving forward
   - If feedback requires additional research, spawn sub-tasks first
   - If feedback affects the plan structure, incorporate before writing

4. **Confirm feedback has been addressed**:
   ```
   I've incorporated your feedback:
   - Updated database choice to PostgreSQL
   - Reordered phases so [original Phase 2] comes first

   Does this align with your intent?
   ```

**Note**: Users can provide multiple `<feedback>` tags in a single response. Process all of them before proceeding to the next step.
```

#### 2. Update iterate_plan.md
**File**: `bootandshoe/commands/iterate_plan.md`
**Changes**: Add feedback tag processing to Step 3 and Step 5

Add to Step 3 (Present Understanding and Approach), after the confirmation request:
```markdown
### Feedback Tag Processing

When the user responds, check for `<feedback>` tags in addition to their regular response:

1. **Parse feedback tags** - Extract all tagged feedback
2. **Prioritize tagged feedback** - These are specific, actionable items
3. **Incorporate into your changes** - Address each tagged item explicitly
4. **Confirm resolution** - Show how each feedback item was addressed

Example user response:
```
Looks good overall.

<feedback>
Add a rollback step to Phase 2 in case the migration fails
</feedback>

<feedback>
The success criteria should include a performance benchmark
</feedback>
```

Your response should acknowledge and address both tagged items before making changes.
```

#### 3. Update create_plan_nt.md and iterate_plan_nt.md
**Files**: `bootandshoe/commands/create_plan_nt.md`, `bootandshoe/commands/iterate_plan_nt.md`
**Changes**: Mirror the same feedback processing additions as the main versions

### Success Criteria:

#### Automated Verification:
- [x] All modified files have valid markdown syntax
- [x] No duplicate sections in modified files
- [x] `iterate_plan.md` contains feedback tag processing instructions
- [x] `iterate_plan_nt.md` contains feedback tag processing instructions

#### Manual Verification:
- [ ] Run `/iterate_plan` on an existing plan with `<feedback>` tags - verify feedback is processed
- [ ] Verify multiple `<feedback>` tags in one response are all processed

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Review Mode

### Overview
Create a new `/review_plan` command for dedicated, structured feedback collection on existing plans.

### Changes Required:

#### 1. Create review_plan.md
**File**: `bootandshoe/commands/review_plan.md`
**Changes**: New file

```markdown
---
description: Review existing plans and collect structured feedback for improvements
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

   Which plan would you like to review? Please provide the path (e.g., `thoughts/shared/plans/2026-01-07-feature.md`).

   Tip: List recent plans with `ls -lt thoughts/shared/plans/ | head`
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
2. Save this feedback for later review
3. Discuss specific items in more detail
```

### Step 4: Apply or Save Feedback

**If user chooses to update**:
- Transition to iterate_plan workflow with collected feedback
- Apply changes systematically

**If user chooses to save**:
- Write feedback to `thoughts/shared/reviews/YYYY-MM-DD-plan-name-review.md`
- Format for easy reference later

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
```

#### 2. Add review_plan_nt.md variant
**File**: `bootandshoe/commands/review_plan_nt.md`
**Changes**: Copy of review_plan.md with thoughts/ references removed

### Success Criteria:

#### Automated Verification:
- [x] `review_plan.md` exists in `bootandshoe/commands/`
- [x] `review_plan_nt.md` exists in `bootandshoe/commands/`
- [x] Both files have valid YAML frontmatter with `model: opus`
- [x] Files contain all required sections (Initial Response, Review Process, etc.)

#### Manual Verification:
- [ ] Run `/review_plan` with an existing plan - verify section-by-section review flow
- [ ] Provide `<feedback>` tags during review - verify they're collected in summary
- [ ] Choose "update plan" option - verify it transitions to iterate workflow
- [ ] Verify review provides useful, targeted questions for each section

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Proactive Web Research Suggestions

### Overview
Update planning commands to proactively suggest web research when discussing unfamiliar technologies, patterns, or best practices.

### Changes Required:

#### 1. Update create_plan.md
**File**: `bootandshoe/commands/create_plan.md`
**Changes**: Add web research suggestion guidelines to Step 2: Research & Discovery

Add after the sub-task spawning section:
```markdown
### Proactive Web Research Suggestions

During research and planning, proactively suggest web research when:

1. **Unfamiliar Technologies**: If the task involves technologies, libraries, or frameworks you're not confident about:
   ```
   I notice this involves [technology]. Would you like me to search the web for
   current best practices for [specific aspect]?
   ```

2. **Best Practices Uncertainty**: When you're unsure about the recommended approach:
   ```
   There are multiple ways to implement [feature]. Would you like me to research
   current industry best practices for [specific pattern]?
   ```

3. **Version-Specific Information**: When implementation might depend on specific versions:
   ```
   The approach may vary based on [library] version. Would you like me to check
   the latest documentation for [specific feature]?
   ```

4. **Security Considerations**: When the feature has security implications:
   ```
   This involves [sensitive area]. Would you like me to research current security
   best practices for [specific concern]?
   ```

**When suggesting research**:
- Be specific about what you'd search for
- Explain why the research would be valuable
- Wait for user confirmation before spawning web-search-researcher
- If approved, use the web-search-researcher agent with a focused query

**Example**:
```
I see we're implementing webhook signature verification. I have general knowledge
about this, but webhook security practices evolve. Would you like me to search
the web for current best practices for webhook signature verification in 2026?

This could help ensure we're using the most secure approach.
```
```

#### 2. Update iterate_plan.md
**File**: `bootandshoe/commands/iterate_plan.md`
**Changes**: Add web research suggestion to Step 2: Research If Needed

Add to the research section:
```markdown
### Web Research for Plan Updates

When user feedback introduces new technical considerations:

1. **Identify knowledge gaps**: If the requested change involves something you're uncertain about
2. **Suggest targeted research**:
   ```
   Your feedback about [topic] is a good point. Would you like me to search the
   web for current best practices on [specific aspect] before updating the plan?
   ```
3. **Wait for confirmation**: Only spawn web-search-researcher if user approves
4. **Incorporate findings**: Update the plan with researched best practices
```

#### 3. Update research_codebase.md
**File**: `bootandshoe/commands/research_codebase.md`
**Changes**: Add guidance for when to suggest web research

Add section:
```markdown
### Supplementing with Web Research

During codebase research, you may encounter areas where external research would be valuable:

1. **Third-party integrations**: When researching how the codebase uses external APIs or services
2. **Framework patterns**: When the codebase uses patterns that may have evolved
3. **Deprecation concerns**: When you find usage of potentially outdated approaches

**How to suggest**:
```
My codebase research found [implementation]. This integrates with [external service].
Would you like me to search the web for the current recommended approach for
[specific integration pattern]?
```

Only proceed with web research if the user confirms interest.
```

### Success Criteria:

#### Automated Verification:
- [x] `create_plan.md` contains "Proactive Web Research Suggestions" section
- [x] `iterate_plan.md` contains "Web Research for Plan Updates" section
- [x] `research_codebase.md` contains "Supplementing with Web Research" section

#### Manual Verification:
- [ ] Run `/create_plan` for a task involving a modern framework - verify web research is suggested
- [ ] Confirm the suggestion is specific and explains value
- [ ] Approve web research suggestion - verify web-search-researcher is spawned correctly
- [ ] Decline web research suggestion - verify planning continues without it

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Standardize Model to Opus

### Overview
Update all agents from `model: sonnet` to `model: opus` for consistency and improved reasoning capabilities.

### Changes Required:

#### 1. Update codebase-analyzer.md
**File**: `bootandshoe/agents/codebase-analyzer.md`
**Changes**: Line 6, change `model: sonnet` to `model: opus`

#### 2. Update codebase-locator.md
**File**: `bootandshoe/agents/codebase-locator.md`
**Changes**: Line 6, change `model: sonnet` to `model: opus`

#### 3. Update codebase-pattern-finder.md
**File**: `bootandshoe/agents/codebase-pattern-finder.md`
**Changes**: Line 6, change `model: sonnet` to `model: opus`

#### 4. Update thoughts-analyzer.md
**File**: `bootandshoe/agents/thoughts-analyzer.md`
**Changes**: Line 6, change `model: sonnet` to `model: opus`

#### 5. Update thoughts-locator.md
**File**: `bootandshoe/agents/thoughts-locator.md`
**Changes**: Line 6, change `model: sonnet` to `model: opus`

#### 6. Update web-search-researcher.md
**File**: `bootandshoe/agents/web-search-researcher.md`
**Changes**: Line 6, change `model: sonnet` to `model: opus`

### Success Criteria:

#### Automated Verification:
- [x] All 6 agent files contain `model: opus` in frontmatter
- [x] No agent files contain `model: sonnet`
- [x] Verify with: `grep -r "model: sonnet" bootandshoe/agents/` returns no results
- [x] Verify with: `grep -r "model: opus" bootandshoe/agents/` returns 6 results

#### Manual Verification:
- [ ] Run a command that spawns agents (e.g., `/create_plan`) - verify agents execute correctly with opus model
- [ ] Verify agent responses maintain quality and follow their documented behavior

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 5: Audit & Optimize

### Overview
Review all commands and agents for context efficiency and best practices, making targeted improvements.

### Changes Required:

#### 1. Audit all agents for consistent patterns
**Files**: All files in `bootandshoe/agents/`
**Review Points**:
- Consistent "documentarian" philosophy statement
- Clear output format examples
- Specific "What NOT to Do" sections
- Appropriate tool restrictions

#### 2. Audit all commands for context efficiency
**Files**: All files in `bootandshoe/commands/`
**Review Points**:
- Clear instructions to read files FULLY (not partial)
- Guidance to spawn parallel sub-tasks
- Instructions to wait for all sub-tasks before proceeding
- File:line reference requirements

#### 3. Standardize documentation references
**Files**: All commands and agents
**Changes**: Ensure all reference the main documentation at `docs/bootandshoe.md`

#### 4. Update docs/bootandshoe.md
**File**: `docs/bootandshoe.md`
**Changes**:
- Add documentation for new `/review_plan` command
- Update any outdated information
- Add section on feedback tags

### Success Criteria:

#### Automated Verification:
- [ ] All agent files contain "documentarian" philosophy section
- [ ] All command files contain instructions about reading files fully
- [ ] `docs/bootandshoe.md` documents `/review_plan` command
- [ ] `docs/bootandshoe.md` documents feedback tag usage

#### Manual Verification:
- [ ] Review agent outputs for consistency in format and tone
- [ ] Verify commands follow documented best practices
- [ ] Documentation accurately reflects all features

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding.

---

## Testing Strategy

### Unit Tests:
- N/A (markdown command files, no executable code)

### Integration Tests:
- Run each modified command with realistic inputs
- Verify feedback tags are processed correctly
- Verify web research suggestions appear appropriately

### Manual Testing Steps:
1. Create a new plan using `/create_plan` with a complex task
2. Provide feedback using `<feedback>` tags during planning
3. Run `/review_plan` on the created plan
4. Iterate on the plan using `/iterate_plan` with feedback
5. Verify web research suggestions appear for unfamiliar technologies
6. Spawn agents and verify they use opus model

## Performance Considerations

- Using opus model for all agents will increase API costs but improve reasoning quality
- Web research suggestions add a confirmation step but prevent uninformed decisions
- Feedback processing adds minimal overhead to existing workflows

## Migration Notes

- Existing plans remain compatible - no changes to plan file format
- Users can immediately start using `<feedback>` tags
- No breaking changes to existing command invocations

## References

- Original requirements: `TODOs.md`
- Create plan command: `bootandshoe/commands/create_plan.md`
- Iterate plan command: `bootandshoe/commands/iterate_plan.md`
- Web search agent: `bootandshoe/agents/web-search-researcher.md`
- Agent model config: `bootandshoe/agents/codebase-analyzer.md:6`
