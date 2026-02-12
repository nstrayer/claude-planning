---
description: Validate implementation against PRD requirements and plan success criteria
model: opus
allowed-tools: ["Read", "Write", "Edit", "Grep", "Glob", "Bash", "AskUserQuestion", "Task"]
argument-hint: Path to task file or plan
---

# Validate Feature

Validate that a feature implementation meets both the PRD requirements and plan success criteria. Provides comprehensive validation for feature-centric workflows.

**Initial request:** $ARGUMENTS

---

## Phase 1: Load Feature Documents

**Goal**: Gather all documents needed for validation

**Actions**:
1. Determine input type:
   - Task document path (contains `/features/` and filename is `task.md`): use it
   - Plan path provided: use legacy plan-only validation (skip PRD checks and task document updates)
   - No path provided: ask user for the task document path
2. Read task.md completely, extract PRD path from `**PRD:**` and plan path from `**Plan:**`
3. Read both PRD and plan completely
4. Gather implementation evidence via Bash:
   - `git log --oneline -n 20`
   - `git diff` covering implementation commits
   - Run comprehensive checks (e.g., `make check test`)

**Output**: All documents loaded, initial evidence gathered

---

## Phase 2: PRD Compliance Check

**Goal**: Verify every PRD requirement has been implemented

**Actions**:
1. For each **functional requirement** in the PRD: verify implementation exists, find code evidence (file:line references), note gaps or partial implementations
2. For each **non-functional requirement**: check performance, security, and accessibility requirements
3. For each **acceptance criterion**: mark as Met/Unmet/Partial with evidence

**Output**: PRD compliance assessed

---

## Phase 3: Plan Execution Check

**Goal**: Verify all plan phases were completed correctly

**Actions**:
1. Check completion status: look for checkmarks (`- [x]`) in the plan, verify actual code matches claimed completion
2. Run each command from "Automated Verification" sections and document pass/fail status. If failures, investigate root cause
3. Collect the list of manual verification items for the next phase

**Output**: Automated verification complete, manual items identified

---

## Phase 4: Manual Verification

**Goal**: Collect manual test outcomes from the user

**Actions**:
1. For each manual verification item, use AskUserQuestion (header: "Manual test") with options: "Passed" / "Failed" / "Skipped" / "N/A"
2. For any failed test, follow up with AskUserQuestion (header: "Issue") to categorize: "Functionality broken" / "Performance issue" / "UI/UX problem" / "Edge case failure", then ask for details
3. After all manual tests, use AskUserQuestion (header: "Status") for final sign-off: "All passed - feature complete" / "Issues found - needs fixes" / "Partially verified - some tests deferred" / "Blocked - cannot complete validation"

**Output**: Manual verification results collected

---

## Phase 5: Generate Validation Report

**Goal**: Create a comprehensive validation summary

**Actions**:
1. Write a validation report covering all results, using the template below
2. Include: PRD compliance table, acceptance criteria table, plan execution status, automated verification results, manual verification results, deviations from plan, issues found, and final status

**Output**: Validation report written

### Report Template

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

### Acceptance Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| [Criterion 1 from PRD] | Met/Unmet | [Details] |

---

### Plan Execution

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: [Name] | Complete/Incomplete | [Details] |

### Automated Verification Results

| Check | Status | Command |
|-------|--------|---------|
| Build | Pass/Fail | `make build` |
| Tests | Pass/Fail | `make test` |

### Manual Verification Results

| Test | Result | Notes |
|------|--------|-------|
| [Test 1] | Passed/Failed/Skipped/N/A | [Details] |

---

### Deviations from Plan
- [Any deviations noted, with justification]

### Issues Found
- [Any issues discovered during validation]

### Final Status: [Selected sign-off option]
```

---

## Phase 6: Update Task Document

**Goal**: Reflect validation results in task.md

**Actions**:
1. Based on final sign-off:
   - **"All passed - feature complete"**: Update status to `complete`, add activity `- YYYY-MM-DD: Feature validated and complete`
   - **"Issues found - needs fixes"**: Keep status as `validating`, add activity `- YYYY-MM-DD: Validation found issues (see report)`, list specific issues
   - **"Partially verified" or "Blocked"**: Keep status as `validating`, add activity with reason

**Output**: Task document updated

---

## Guidelines

- **Be thorough but practical**: Run all automated checks, document both successes and issues
- **Think critically**: Question whether the implementation truly solves the problem
- **Check PRD alignment**: The PRD defines success, not just the plan
- **Consider maintenance**: Will this be maintainable long-term?

### Validation Checklist

Always verify: all PRD requirements met, all acceptance criteria satisfied, all claimed-complete plan phases actually done, automated tests pass, code follows existing patterns, no regressions introduced, error handling is robust, documentation updated if needed.

### Related Commands

1. `/feature_start` - Create feature directory with task.md and PRD
2. `/feature_plan @task.md` - Create implementation plan
3. `/feature_implement @task.md` - Execute the implementation
4. `/commit` - Create atomic commits for changes
5. `/feature_validate @task.md` - Verify implementation (this command)
