---
description: Validate implementation against plan, verify success criteria, identify issues
---

# Validate Plan

> **Note**: For feature-based workflows, use `/validate_feature @thoughts/features/{slug}/task.md` instead. This validates against both the PRD and plan.

You are tasked with validating that an implementation plan was correctly executed, verifying all success criteria and identifying any deviations or issues.

## Initial Setup

When invoked:
1. **Determine context** - Are you in an existing conversation or starting fresh?
   - If existing: Review what was implemented in this session
   - If fresh: Need to discover what was done through git and codebase analysis

2. **Locate the plan**:
   - If plan path provided, use it
   - Otherwise, search recent commits for plan references or ask user

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

### Step 1: Context Discovery

If starting fresh or need more context:

1. **Read the implementation plan** completely
2. **Identify what should have changed**:
   - List all files that should be modified
   - Note all success criteria (automated and manual)
   - Identify key functionality to verify

3. **Spawn parallel research tasks** to discover implementation:
   ```
   Task 1 - Verify database changes:
   Research if migration [N] was added and schema changes match plan.
   Check: migration files, schema version, table structure
   Return: What was implemented vs what plan specified

   Task 2 - Verify code changes:
   Find all modified files related to [feature].
   Compare actual changes to plan specifications.
   Return: File-by-file comparison of planned vs actual

   Task 3 - Verify test coverage:
   Check if tests were added/modified as specified.
   Run test commands and capture results.
   Return: Test status and any missing coverage
   ```

### Step 2: Systematic Validation

For each phase in the plan:

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

4. **Think deeply about edge cases**:
   - Were error conditions handled?
   - Are there missing validations?
   - Could the implementation break existing functionality?

### Step 3: Collect Manual Verification Results

After presenting automated verification results, use AskUserQuestion to collect manual test outcomes:

For each manual verification item in the plan's success criteria:

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
   - "All passed - ready for merge" - Implementation is complete and verified
   - "Issues found - needs fixes before merge" - Problems need to be addressed
   - "Partially verified - some tests deferred" - Some tests couldn't be completed
   - "Blocked - cannot complete validation" - Something prevents full validation
   ```

### Step 4: Generate Validation Report

Create comprehensive validation summary:

```markdown
## Validation Report: [Plan Name]

### Implementation Status
✓ Phase 1: [Name] - Fully implemented
✓ Phase 2: [Name] - Fully implemented
⚠️ Phase 3: [Name] - Partially implemented (see issues)

### Automated Verification Results
✓ Build passes: `make build`
✓ Tests pass: `make test`
✗ Linting issues: `make lint` (3 warnings)

### Code Review Findings

#### Matches Plan:
- Database migration correctly adds [table]
- API endpoints implement specified methods
- Error handling follows plan

#### Deviations from Plan:
- Used different variable names in [file:line]
- Added extra validation in [file:line] (improvement)

#### Potential Issues:
- Missing index on foreign key could impact performance
- No rollback handling in migration

### Manual Verification Results:
| Test | Result | Notes |
|------|--------|-------|
| [Test 1] | Passed/Failed/Skipped/N/A | [Issue details if failed] |
| [Test 2] | Passed/Failed/Skipped/N/A | [Issue details if failed] |

### Final Status: [Selected sign-off option]

### Recommendations:
- Address linting warnings before merge
- Consider adding integration test for [scenario]
- Document new API endpoints
```

## Working with Existing Context

If you were part of the implementation:
- Review the conversation history
- Check your todo list for what was completed
- Focus validation on work done in this session
- Be honest about any shortcuts or incomplete items

## Important Guidelines

1. **Be thorough but practical** - Focus on what matters
2. **Run all automated checks** - Don't skip verification commands
3. **Document everything** - Both successes and issues
4. **Think critically** - Question if the implementation truly solves the problem
5. **Consider maintenance** - Will this be maintainable long-term?

## Validation Checklist

Always verify:
- [ ] All phases marked complete are actually done
- [ ] Automated tests pass
- [ ] Code follows existing patterns
- [ ] No regressions introduced
- [ ] Error handling is robust
- [ ] Documentation updated if needed
- [ ] Manual test steps are clear

## Relationship to Other Commands

Recommended workflow:
1. `/implement_plan` - Execute the implementation
2. `/commit` - Create atomic commits for changes
3. `/validate_plan` - Verify implementation correctness
4. `/describe_pr` - Generate PR description

The validation works best after commits are made, as it can analyze the git history to understand what was implemented.

Remember: Good validation catches issues before they reach production. Be constructive but thorough in identifying gaps or improvements.
