# Simplify Plugin to Planning-Only Implementation Plan

## Overview

Remove all non-planning-related components from the claude-planning repository, keeping only the research → create plan → iterate → implement workflow. Remove jj, ralph, pai, and gh plugins entirely, and strip down humanlayer to only planning-focused commands.

## Current State Analysis

The repository currently contains 5 plugins:
- **humanlayer** - 22 commands, 6 agents, 2 skills
- **jj** - 5 commands for Jujutsu version control
- **ralph** - 3 commands + hooks for iterative AI loops
- **pai** - 7 agents, 200+ skill files for Personal AI Infrastructure
- **gh** - 2 commands for GitHub CLI operations

### Key Discoveries:
- Planning commands have minimal jj references (just alternative command documentation)
- All 6 humanlayer agents are used by planning commands - keep all
- spec-metadata skill is used by research_codebase - keep it
- create-worktree skill is not needed for planning workflow

## Desired End State

A focused plugin with only planning workflow commands:
- **10 commands**: research_codebase (3 variants), create_plan (3 variants), iterate_plan (2 variants), implement_plan, validate_plan
- **6 agents**: codebase-analyzer, codebase-locator, codebase-pattern-finder, thoughts-analyzer, thoughts-locator, web-search-researcher
- **1 skill**: spec-metadata (git-only)

## What We're NOT Doing

- Not modifying agent behavior or prompts (beyond removing jj references if any)
- Not changing the planning workflow logic
- Not adding new features
- Not updating any tests (none exist)

## Implementation Approach

Work in phases from outer (entire plugins) to inner (file edits), verifying at each step.

---

## Phase 1: Remove Entire Plugins

### Overview
Delete the jj, ralph, pai, and gh plugin directories entirely.

### Changes Required:

#### 1. Delete plugin directories
```bash
rm -rf jj/
rm -rf ralph/
rm -rf pai/
rm -rf gh/
```

### Success Criteria:

#### Automated Verification:
- [x] Directories no longer exist: `ls jj/ ralph/ pai/ gh/` returns errors

#### Manual Verification:
- [ ] Confirm no unintended files were deleted

---

## Phase 2: Remove Non-Planning Commands from humanlayer

### Overview
Remove 10 commands that are not part of the planning workflow.

### Changes Required:

#### 1. Delete non-planning commands
**Files to delete from `humanlayer/commands/`:**
- `ci_commit.md`
- `ci_describe_pr.md`
- `commit.md`
- `create_handoff.md`
- `create_worktree.md`
- `debug.md`
- `describe_pr.md`
- `describe_pr_nt.md`
- `local_review.md`
- `resume_handoff.md`

```bash
rm humanlayer/commands/ci_commit.md
rm humanlayer/commands/ci_describe_pr.md
rm humanlayer/commands/commit.md
rm humanlayer/commands/create_handoff.md
rm humanlayer/commands/create_worktree.md
rm humanlayer/commands/debug.md
rm humanlayer/commands/describe_pr.md
rm humanlayer/commands/describe_pr_nt.md
rm humanlayer/commands/local_review.md
rm humanlayer/commands/resume_handoff.md
```

### Success Criteria:

#### Automated Verification:
- [x] Only 10 commands remain: `ls humanlayer/commands/ | wc -l` returns 10
- [x] Remaining commands are planning-related: `ls humanlayer/commands/`

#### Manual Verification:
- [ ] Verify the correct files were deleted

---

## Phase 3: Remove create-worktree Skill

### Overview
Remove the create-worktree skill which is not needed for planning workflow.

### Changes Required:

#### 1. Delete create-worktree skill directory
```bash
rm -rf humanlayer/skills/create-worktree/
```

### Success Criteria:

#### Automated Verification:
- [x] Only spec-metadata skill remains: `ls humanlayer/skills/`

---

## Phase 4: Remove jj References from Planning Commands

### Overview
Edit planning commands and spec-metadata skill to remove jj alternative instructions, making them git-only.

### Changes Required:

#### 1. validate_plan.md
**File**: `humanlayer/commands/validate_plan.md`
**Changes**: Remove lines 32-39 (jj user alternatives)

Remove this section:
```
   For jj users:
   ```bash
   # Check recent commits
   jj log -r 'ancestors(@, 20)' --no-graph -T 'commit_id.short() ++ " " ++ description.first_line() ++ "\n"'
   jj diff -r @~N  # Where N covers implementation changes

   # Run comprehensive checks
   cd $(jj workspace root) && make check test
   ```
```

#### 2. research_codebase.md
**File**: `humanlayer/commands/research_codebase.md`
**Changes**: Remove jj alternatives at lines 153 and 158

Remove:
- `- For jj users: \`jj log -r @ --no-graph -T 'bookmarks'\` and \`jj status\``
- `- For jj users: \`jj log -r @ --no-graph -T 'commit_id'\``

#### 3. research_codebase_nt.md
**File**: `humanlayer/commands/research_codebase_nt.md`
**Changes**: Remove jj alternatives at lines 141 and 146

#### 4. research_codebase_generic.md
**File**: `humanlayer/commands/research_codebase_generic.md`
**Changes**: Remove jj alternatives at lines 127 and 132

#### 5. spec-metadata skill
**File**: `humanlayer/skills/spec-metadata/SKILL.md`
**Changes**: Remove the entire "For jj users" section (lines 40-52) and line 85

### Success Criteria:

#### Automated Verification:
- [x] No jj references in planning commands: `grep -r "jj" humanlayer/commands/` returns empty
- [x] No jj references in skills: `grep -r "jj" humanlayer/skills/` returns empty

---

## Phase 5: Update marketplace.json

### Overview
Remove plugin entries for jj, ralph, pai, gh. Keep only humanlayer.

### Changes Required:

#### 1. Edit marketplace.json
**File**: `.claude-plugin/marketplace.json`
**Changes**: Remove plugins array entries for jj, ralph, pai, gh

The plugins array should only contain:
```json
"plugins": [
  {
    "name": "humanlayer",
    "description": "Commands and agents for codebase research, planning, and implementation workflows",
    "source": "./humanlayer",
    "category": "development",
    "version": "2025-12-15",
    "author": {
      "name": "HumanLayer"
    }
  }
]
```

### Success Criteria:

#### Automated Verification:
- [x] Valid JSON: `cat .claude-plugin/marketplace.json | python3 -m json.tool`
- [x] Only humanlayer plugin: verified - plugins array contains only humanlayer

---

## Phase 6: Update Documentation

### Overview
Update README.md and docs to reflect the simplified plugin.

### Changes Required:

#### 1. Delete docs/jj.md
```bash
rm docs/jj.md
```

#### 2. Update README.md
**File**: `README.md`
**Changes**: Rewrite to focus only on humanlayer planning workflow

#### 3. Update docs/humanlayer.md
**File**: `docs/humanlayer.md`
**Changes**: Remove references to removed commands, update to reflect planning-only focus

### Success Criteria:

#### Automated Verification:
- [x] docs/jj.md doesn't exist
- [x] No references to removed plugins in README: `grep -E "jj|ralph|pai|/gh" README.md` returns empty

#### Manual Verification:
- [ ] README accurately describes the planning workflow
- [ ] docs/humanlayer.md is accurate

---

## Phase 7: Clean Up Miscellaneous Files

### Overview
Remove files that are no longer relevant.

### Changes Required:

#### 1. Delete research directory (created during this session)
```bash
rm -rf research/
```

#### 2. Delete pruning-plan.md
```bash
rm pruning-plan.md
```

#### 3. Check .claude/commands/ for relevance
Review and potentially remove:
- `.claude/commands/import-humanlayer.md` - may no longer be relevant
- `.claude/commands/write_documentation.md` - may no longer be relevant

### Success Criteria:

#### Automated Verification:
- [x] research/ directory doesn't exist
- [x] pruning-plan.md doesn't exist

Note: `.claude/commands/import-humanlayer.md` and `.claude/commands/write_documentation.md` were kept as they remain useful for managing the humanlayer plugin.

---

## Testing Strategy

### Automated Tests:
- Validate JSON: `npm run validate` (if available)
- Check for broken references: `grep -r` for removed file names

### Manual Testing Steps:
1. Install the plugin in a test project
2. Verify `/humanlayer:research_codebase` works
3. Verify `/humanlayer:create_plan` works
4. Verify `/humanlayer:implement_plan` works
5. Verify agents can be spawned via Task tool

## References

- Research document: `research/2026-01-07-claude-planning-repo-structure.md` (to be deleted)
- Original marketplace.json: `.claude-plugin/marketplace.json`
