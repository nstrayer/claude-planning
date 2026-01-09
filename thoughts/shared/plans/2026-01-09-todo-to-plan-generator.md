# Todo-to-Plan Generator Command

## Overview

Create a new command `/generate_plans` that analyzes a TODO markdown file and automatically generates detailed implementation plans for each item, following the standard plan template.

## Current State Analysis

Currently, users must manually invoke `/create_plan` for each task and provide requirements. There's no automated way to process a list of TODOs into structured plans.

### Key Discoveries:
- Plan template defined in `bootandshoe/commands/create_plan.md:216-312`
- Plans stored at `thoughts/shared/plans/YYYY-MM-DD-description.md`
- TODOs.md exists with list format at project root
- No existing command to batch-process TODOs

## Desired End State

After implementation:
1. `/generate_plans path/to/todos.md` parses the TODO file
2. For each TODO item, generates a separate implementation plan
3. Plans follow the standard template with phases and success criteria
4. User reviews and approves each plan before moving to next
5. Optional: Generate a single combined plan for related items

### Verification:
- Running `/generate_plans TODOs.md` produces plans for each item
- Generated plans are well-structured and actionable
- Plans reference the original TODO item

## What We're NOT Doing

- Auto-implementing the plans
- Modifying the source TODO file
- Creating dependencies between plans
- Scheduling or prioritizing plans

## Implementation Approach

Create a new command that parses TODO files, identifies actionable items, and invokes plan creation logic for each.

---

## Phase 1: Create generate_plans Command

### Overview
Create the command file that parses TODO files and orchestrates plan generation.

### Changes Required:

#### 1. Create Command File
**File**: `bootandshoe/commands/generate_plans.md` (new file)
**Changes**: Create command with TODO parsing and plan generation logic

The command should:
1. Accept a file path parameter
2. Parse markdown list items and checkboxes
3. Present found items for user selection
4. Research codebase for each item
5. Generate plans following standard template
6. Get user approval between plans

Key sections to include:
- Initial response with file path handling
- TODO parsing logic for various formats
- Research spawning using codebase-locator and codebase-analyzer
- Plan template with frontmatter
- Interactive approval workflow
- Summary of generated plans

### Success Criteria:

#### Automated Verification:
- [ ] Command file exists: `test -f bootandshoe/commands/generate_plans.md`
- [ ] Command file is valid markdown

#### Manual Verification:
- [ ] `/generate_plans TODOs.md` parses the file correctly
- [ ] User sees list of TODO items
- [ ] Plans are generated in standard format
- [ ] User approval workflow works

---

## Phase 2: Add Skill Registration

### Overview
Register the command as a skill so it can be invoked via `/generate_plans`.

### Changes Required:

#### 1. Update plugin.json
**File**: `bootandshoe/plugin.json`
**Changes**: Add skill entry for generate_plans

```json
{
  "skills": [
    {
      "name": "generate_plans",
      "description": "Generate implementation plans from a TODO markdown file",
      "command": "commands/generate_plans.md"
    }
  ]
}
```

Or if using auto-discovery, ensure the command follows naming conventions.

### Success Criteria:

#### Automated Verification:
- [ ] Skill appears in `/help` output
- [ ] Command is accessible via `/bootandshoe:generate_plans`

#### Manual Verification:
- [ ] Skill works when invoked
- [ ] Description appears correctly

---

## Phase 3: Add Progress Tracking

### Overview
Add optional progress tracking to show which TODOs have been planned.

### Changes Required:

#### 1. Track Generated Plans
**File**: `bootandshoe/commands/generate_plans.md`
**Changes**: Add logic to track which items have plans

When generating plans:
1. Check if a plan already exists for this TODO (by title match)
2. Offer to skip or regenerate
3. Show progress indicator for multiple items

#### 2. Summary Report
Generate a summary showing:
- Items with new plans created
- Items with existing plans (skipped)
- Items that were skipped by user choice
- Remaining unplanned items

### Success Criteria:

#### Manual Verification:
- [ ] Running twice shows existing plans
- [ ] User can choose to skip or regenerate
- [ ] Summary shows accurate counts

---

## Testing Strategy

### Unit Tests:
- TODO parsing handles various markdown formats
- Empty TODOs handled gracefully
- Completed items are skipped

### Integration Tests:
1. Parse sample TODO file with mixed formats
2. Generate plan for single item
3. Generate multiple plans in sequence
4. Handle user cancellation mid-process

### Manual Testing Steps:
1. Create test TODO file with 3-5 items
2. Run `/generate_plans test-todos.md`
3. Verify items are parsed correctly
4. Approve first plan generation
5. Skip second item
6. Verify summary shows correct counts
7. Run again to verify existing plan detection

## Performance Considerations

- Research tasks spawned in parallel where possible
- Plans generated one at a time to avoid overwhelming user
- No unnecessary file reads after initial parse

## References

- Plan template: `bootandshoe/commands/create_plan.md:216-312`
- Similar command: `bootandshoe/commands/create_plan.md`
- Example TODO file: `TODOs.md`
- Original requirement: `TODOs.md:8`