---
description: Validate implementation against PRD requirements and plan success criteria
model: opus
allowed-tools: ["Read", "Write", "Edit", "Grep", "Glob", "Bash", "AskUserQuestion", "Task"]
---

# Validate Feature

You are tasked with validating that a feature implementation meets both the PRD requirements and plan success criteria. This provides comprehensive validation for feature-centric workflows.

## Initial Setup

When invoked:

1. **Determine input type**:
   - If task document path provided (contains `/features/` and filename is `task.md`): use it
   - If plan path provided: use legacy plan-only validation
   - If no path provided: ask user for the task document path

2. **Load feature documents**:
   - Read task.md completely
   - Extract PRD path from `**PRD:**` field
   - Extract plan path from `**Plan:**` field
   - Read both PRD and plan completely

3. **Gather implementation evidence**:

   For git users:
   ```bash
   # Check recent commits
   git log --oneline -n 20
   git diff HEAD~N..HEAD  # Where N covers implementation commits

   # Run comprehensive checks
   cd $(git rev-parse --show-toplevel) && make check test
   ```

## Validation Process

### Step 1: PRD Compliance Check

For each requirement in the PRD:

1. **Functional Requirements**:
   - Verify each requirement has been implemented
   - Find code evidence (file:line references)
   - Note any gaps or partial implementations

2. **Non-Functional Requirements**:
   - Check performance requirements are met
   - Verify security considerations addressed
   - Confirm accessibility requirements if applicable

3. **Acceptance Criteria**:
   - Check each criterion from the PRD
   - Mark as Met/Unmet/Partial
   - Provide evidence for each

### Step 2: Plan Execution Check

For each phase in the implementation plan:

1. **Check completion status**:
   - Look for checkmarks in the plan (- [x])
   - Verify the actual code matches claimed completion

2. **Run automated verification**:
   - Execute each command from "Automated Verification"
   - Document pass/fail status
   - If failures, investigate root cause

3. **Assess manual criteria**:
   - List what needs manual testing
   - Provide clear steps for user verification

### Step 3: Collect Manual Verification Results

Use AskUserQuestion to collect manual test outcomes:

For each manual verification item:

1. **Present each test** with structured options:
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
   - "All passed - feature complete" - Implementation is complete and verified
   - "Issues found - needs fixes" - Problems need to be addressed
   - "Partially verified - some tests deferred" - Some tests couldn't be completed
   - "Blocked - cannot complete validation" - Something prevents full validation
   ```

### Step 4: Generate Validation Report

Create comprehensive validation summary:

```markdown
## Feature Validation Report: [Feature Name]

**Task:** thoughts/features/{slug}/task.md
**PRD:** thoughts/features/{slug}/prd.md
**Plan:** thoughts/features/{slug}/plan.md

---

### PRD Compliance

| Requirement | Status | Evidence |
|-------------|--------|----------|
| [Functional Req 1] | Met/Unmet/Partial | [File:line or description] |
| [Functional Req 2] | Met/Unmet/Partial | [File:line or description] |
| [Non-Functional: Performance] | Met/Unmet/N/A | [Evidence] |
| [Non-Functional: Security] | Met/Unmet/N/A | [Evidence] |

### Acceptance Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| [Criterion 1 from PRD] | Met/Unmet | [Details] |
| [Criterion 2 from PRD] | Met/Unmet | [Details] |

---

### Plan Execution

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: [Name] | Complete/Incomplete | [Details] |
| Phase 2: [Name] | Complete/Incomplete | [Details] |
| Phase 3: [Name] | Complete/Incomplete | [Details] |

### Automated Verification Results

| Check | Status | Command |
|-------|--------|---------|
| Build | Pass/Fail | `make build` |
| Tests | Pass/Fail | `make test` |
| Lint | Pass/Fail | `make lint` |

### Manual Verification Results

| Test | Result | Notes |
|------|--------|-------|
| [Test 1] | Passed/Failed/Skipped/N/A | [Issue details if failed] |
| [Test 2] | Passed/Failed/Skipped/N/A | [Issue details if failed] |

---

### Deviations from Plan

- [Any deviations noted, with justification]

### Issues Found

- [Any issues discovered during validation]

### Final Status: [Selected sign-off option]
```

### Step 5: Update Task Document

Based on validation results:

**If "All passed - feature complete"**:
1. Update task.md status to `complete`
2. Add activity: `- YYYY-MM-DD: Feature validated and complete`
3. Inform user: "Feature marked as complete in task.md"

**If "Issues found - needs fixes"**:
1. Keep task.md status as `validating`
2. Add activity: `- YYYY-MM-DD: Validation found issues (see report)`
3. List specific issues that need addressing

**If "Partially verified" or "Blocked"**:
1. Keep task.md status as `validating`
2. Add activity with reason: `- YYYY-MM-DD: Validation incomplete - [reason]`

## Legacy Fallback

If a plan path is provided instead of a task document:
- Proceed with plan-only validation
- Skip PRD compliance check
- Skip task document updates

## Important Guidelines

1. **Be thorough but practical** - Focus on what matters
2. **Run all automated checks** - Don't skip verification commands
3. **Document everything** - Both successes and issues
4. **Think critically** - Question if the implementation truly solves the problem
5. **Consider maintenance** - Will this be maintainable long-term?
6. **Check PRD alignment** - The PRD defines success, not just the plan

## Validation Checklist

Always verify:
- [ ] All PRD requirements are met
- [ ] All acceptance criteria satisfied
- [ ] All plan phases marked complete are actually done
- [ ] Automated tests pass
- [ ] Code follows existing patterns
- [ ] No regressions introduced
- [ ] Error handling is robust
- [ ] Documentation updated if needed
- [ ] Manual test steps are clear

## Relationship to Other Commands

Recommended feature workflow:
1. `/feature_start` - Create feature directory with task.md and PRD
2. `/feature_plan @task.md` - Create implementation plan
3. `/feature_implement @task.md` - Execute the implementation
4. `/commit` - Create atomic commits for changes
5. `/feature_validate @task.md` - Verify implementation (this command)
