# Improve Plan Detection with Formal Header Format

## Overview

Add a standardized YAML frontmatter header to implementation plans that identifies the document as a plan and includes basic metadata. This enables the VSCode feedback extension to automatically detect when a file is an implementation plan.

**Note**: Commands like `/iterate_plan` and `/implement_plan` remain flexible and do not require this header - they work with any markdown file the user provides.

## Current State Analysis

Plans are currently identified only by:
- File location (`thoughts/shared/plans/`)
- Filename pattern (`YYYY-MM-DD-description.md`)
- Structural content (phases, success criteria)

There's no formal metadata to quickly identify a plan file, making it difficult for the VSCode extension to know when to show plan-specific UI.

### Key Discoveries:
- Plan template defined in `bootandshoe/commands/create_plan.md:216-312`
- No frontmatter or metadata currently in plans
- VSCode extension needs a reliable way to detect plan files

## Desired End State

After implementation:
1. All new plans include YAML frontmatter with `type: implementation-plan`
2. VSCode extension can detect plan files and show appropriate UI
3. Basic metadata (title, created date, status) is available for extension display
4. Commands remain flexible - they work with any file, not just plans with headers

### Verification:
- New plans created via `/create_plan` include frontmatter
- VSCode extension correctly identifies plans via frontmatter
- Existing plans without frontmatter still work (backwards compatible)
- Commands work without requiring frontmatter

## What We're NOT Doing

- Adding command-level plan detection (commands stay flexible)
- Migrating all existing plans to new format (optional per-user)
- Creating a plan database or index
- Adding frontmatter validation tooling
- Tracking phase completion in frontmatter (too rigid)

## Implementation Approach

Single phase: add the header format and update create_plan templates. The VSCode extension will use this header for plan detection.

---

## Phase 1: Define Header Format and Update create_plan

### Overview
Define a minimal YAML frontmatter schema and update the create_plan command templates to include it.

### Changes Required:

#### 1. Define Plan Header Schema
**Documentation**: Add to `create_plan.md` template section

```yaml
---
type: implementation-plan
title: "[Feature/Task Name]"
created: YYYY-MM-DD
status: draft | in-progress | completed | abandoned
---
```

**Field definitions:**
- `type`: Always `implementation-plan` - the key identifier for extension detection
- `title`: Human-readable plan name for display
- `created`: ISO date when plan was created
- `status`: Current plan state (manually updated by user)

#### 2. Update create_plan.md Template
**File**: `bootandshoe/commands/create_plan.md`
**Changes**: Add frontmatter to the plan template (around line 217)

Update the template to begin with:

```markdown
## Step 4: Detailed Plan Writing

After structure approval:

1. **Write the plan** to `thoughts/shared/plans/YYYY-MM-DD-description.md`
2. **Use this template structure**:

````markdown
---
type: implementation-plan
title: "[Feature/Task Name]"
created: YYYY-MM-DD
status: draft
---

# [Feature/Task Name] Implementation Plan

## Overview
...
````
```

#### 3. Update create_plan_nt.md Template
**File**: `bootandshoe/commands/create_plan_nt.md`
**Changes**: Apply same frontmatter addition for consistency

#### 4. Update create_plan_generic.md Template
**File**: `bootandshoe/commands/create_plan_generic.md`
**Changes**: Apply same frontmatter addition

### Success Criteria:

#### Automated Verification:
- [x] create_plan.md template includes frontmatter: `grep -A 5 "^---$" bootandshoe/commands/create_plan.md | grep "type: implementation-plan"`
- [x] create_plan_nt.md template includes frontmatter: `grep -A 5 "^---$" bootandshoe/commands/create_plan_nt.md | grep "type: implementation-plan"`

#### Manual Verification:
- [x] Running `/create_plan` produces a plan with correct frontmatter
- [x] Frontmatter renders correctly in markdown viewers
- [x] Plan content is not affected by frontmatter presence

---

## Phase 2: VSCode Extension Plan Detection

### Overview
Update the VSCode feedback extension to detect plan files via frontmatter and show appropriate UI.

### Changes Required:

#### 1. Add Frontmatter Detection
**File**: `vscode-extension/src/extension.ts` (or appropriate location)
**Changes**: Add function to check if current file is an implementation plan

```typescript
function isImplementationPlan(document: vscode.TextDocument): boolean {
  const text = document.getText();
  // Check for YAML frontmatter with type: implementation-plan
  const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    return frontmatterMatch[1].includes('type: implementation-plan');
  }
  return false;
}
```

#### 2. Update UI Based on Plan Detection
**Changes**: Show plan-specific UI elements when a plan is detected
- Could show plan title in status bar
- Could enable plan-specific feedback categories
- Could show phase overview in sidebar

### Success Criteria:

#### Automated Verification:
- [x] Extension code includes plan detection: `grep "implementation-plan" vscode-extension/src/*.ts`

#### Manual Verification:
- [ ] Opening a plan file triggers plan-specific UI
- [ ] Opening a non-plan markdown file does not trigger plan UI
- [ ] Plan title from frontmatter is displayed correctly

---

## Testing Strategy

### Unit Tests:
- Frontmatter parsing extracts all expected fields
- Plans without frontmatter handled gracefully
- Extension correctly identifies plan vs non-plan files

### Integration Tests:
1. `/create_plan` → produces plan with frontmatter
2. VSCode extension → detects plan from frontmatter
3. Old plans still work with commands (no frontmatter required)

### Manual Testing Steps:
1. Create new plan via `/create_plan`
2. Verify frontmatter present and correctly formatted
3. Open plan in VSCode, verify extension detects it
4. Open non-plan markdown, verify no plan UI shown
5. Run `/iterate_plan` on file without frontmatter - should work normally

## Backwards Compatibility

Plans without frontmatter continue to work:
- Commands (`/iterate_plan`, `/implement_plan`) work with any markdown file
- VSCode extension can fall back to location-based detection (`thoughts/shared/plans/`)
- No requirement to migrate existing plans

## Example Plan with New Format

```markdown
---
type: implementation-plan
title: "Add User Authentication"
created: 2026-01-09
status: draft
---

# Add User Authentication Implementation Plan

## Overview
...
```

## References

- Current create_plan template: `bootandshoe/commands/create_plan.md:216-312`
- VSCode extension: `vscode-extension/src/`
- Original requirement: `TODOs.md:4`
