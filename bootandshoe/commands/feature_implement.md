---
description: Implement approved technical plans with phased verification
model: opus
---

# Implement Plan

You are tasked with implementing an approved technical plan. Plans may come from various sources:
- A plan mode file path (from native plan mode via `/feature_plan`)
- `thoughts/shared/plans/` directory (traditional location)
- Any user-provided path containing a plan with `type: implementation-plan` frontmatter

## Getting Started

When given a plan path:
- Read the plan completely and check for any existing checkmarks (- [x])
- Validate it looks like an implementation plan (has phases, success criteria, etc.)
- Read any referenced requirements documents
- Create a todo list to track your progress
- Start implementing phase by phase

If no plan path provided:
- Check if the user just approved a plan via plan mode (they may reference it)
- Look for recent plans in `thoughts/shared/plans/`
- Otherwise, ask the user for the plan path

Tip: For feature-based implementation: `/feature_implement @thoughts/features/my-feature/task.md`

### Task Document Handling

When given a task document path (file path contains `/features/` and filename is `task.md`):

1. **Read task.md** and find the plan path from `**Plan:**` field
2. **Update task.md status** to `implementing`
3. **Add activity entry**: `- YYYY-MM-DD: Implementation started`
4. **Read the linked plan** and proceed with implementation

**After each phase completion**:
- Add brief activity entry to task.md: `- YYYY-MM-DD: Phase N completed`

**After final phase completion**:
- Update task.md status to `validating`
- Add activity: `- YYYY-MM-DD: Implementation complete, ready for validation`

## Token-Efficient Implementation

**Before each phase**, spawn agents for reconnaissance instead of reading all files:
- `bootandshoe:codebase-pattern-finder`: Find similar implementations to model after
- `bootandshoe:codebase-analyzer`: Understand components you'll modify

**Only read files directly** when you're about to edit them.

**For phases with 3+ independent changes**, spawn parallel `general-purpose` agents to implement different parts concurrently.

## Implementation Philosophy

Plans are carefully designed, but reality can be messy. Your job is to:
- Follow the plan's intent while adapting to what you find
- Implement each phase fully before moving to the next
- Verify your work makes sense in the broader codebase context
- Update checkboxes in the plan as you complete sections

When things don't match the plan exactly, think about why and communicate clearly. The plan is your guide, but your judgment matters too.

If you encounter a mismatch:
- STOP and think deeply about why the plan can't be followed
- Present the issue clearly:
  ```
  Issue in Phase [N]:
  Expected: [what the plan says]
  Found: [actual situation]
  Why this matters: [explanation]

  How should I proceed?
  ```

## Verification Approach

After implementing a phase:
- Run the success criteria checks (usually `make check test` covers everything)
- Fix any issues before proceeding
- Update your progress in both the plan and your todos
- Check off completed items in the plan file itself using Edit
- **If task document exists**: Add activity entry `- YYYY-MM-DD: Phase N completed`
- **Pause for human verification**: After completing all automated verification for a phase, pause and inform the human that the phase is ready for manual testing. Use this format:
  ```
  Phase [N] Complete - Ready for Manual Verification

  Automated verification passed:
  - [List automated checks that passed]

  Please perform the manual verification steps listed in the plan:
  - [List manual verification items from the plan]

  Let me know when manual testing is complete so I can proceed to Phase [N+1].
  ```

If instructed to execute multiple phases consecutively, skip the pause until the last phase. Otherwise, assume you are just doing one phase.

do not check off items in the manual testing steps until confirmed by the user.


## If You Get Stuck

When something isn't working as expected:
- Use `bootandshoe:codebase-analyzer` to understand the relevant code (don't read everything into main context)
- Consider if the codebase has evolved since the plan was written
- Present the mismatch clearly and ask for guidance

## Resuming Work

If the plan has existing checkmarks:
- Trust that completed work is done
- Pick up from the first unchecked item
- Verify previous work only if something seems off

Remember: You're implementing a solution, not just checking boxes. Keep the end goal in mind and maintain forward momentum.
