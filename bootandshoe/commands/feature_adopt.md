---
description: Adopt in-progress work into the feature tracking workflow
---

# Adopt Feature

You are tasked with adopting existing in-progress work into the feature-centric workflow. This creates a feature directory with a task.md that captures current git state, letting the user continue with `/feature_plan`, `/feature_implement`, and `/feature_validate`.

## Initial Response

When this command is invoked:

1. **Check for GitHub issue URL parameter**:
   - If URL provided (e.g., `https://github.com/org/repo/issues/123`), fetch issue details
   - Run: `gh issue view {number} --json title,body,labels`
   - Store for later use in slug generation and task.md

2. **Run git introspection** (all four commands in parallel):

```bash
git branch --show-current
git log --oneline main..HEAD 2>/dev/null
git status --short
git diff --stat main..HEAD 2>/dev/null
```

3. **Present findings** as a concise summary:

```
Here's what I found on your current branch:

**Branch:** {branch name}
**Commits ahead of main:** {N}
{oneline list of commits, or "(none)" if zero}

**Uncommitted changes:** {N} files
**Files changed vs main:** {N} files
{top-level directory grouping, e.g. "  src/components/ (4 files), tests/ (2 files)"}
```

### Edge Cases

- **On `main` with no commits ahead AND no uncommitted changes**: Stop and tell the user:
  ```
  There's nothing to adopt -- no commits ahead of main and no uncommitted changes.
  If you're starting fresh, try `/feature_start` instead.
  ```
  Do not proceed further.

- **On `main` with uncommitted changes only**: Adjust messaging:
  ```
  You're on `main` with {N} uncommitted changes but no commits ahead.
  I can still adopt this work -- the task.md will capture your uncommitted changes.
  ```

- **Detached HEAD**: Note the situation:
  ```
  You're in a detached HEAD state at {short commit hash}.
  I'll capture this context -- you'll need to provide a custom slug.
  ```

## Step 2: Ask Questions

Use a single AskUserQuestion call with 2 questions:

```
AskUserQuestion with questions:
1. Question: "What is this feature about?"
   Header: "Feature"
   Options:
   - "{inferred description from branch name or commits}" - Based on your branch/commits
   - "{second inference if available}" - Alternative interpretation
   (If nothing useful can be inferred, provide two general-purpose options like
    "Bug fix" and "New feature" -- the user can always pick "Other" for freeform input)
   multiSelect: false

2. Question: "Where are you in the work?"
   Header: "Status"
   Options:
   - "Just started" - Exploring, prototyping, or just began coding
   - "Actively implementing" - Core work is underway
   - "Mostly done" - Implementation is largely complete
   - "Done, needs validation" - Ready for review and testing
   multiSelect: false
```

Map the status answer:
- "Just started" -> `planning`
- "Actively implementing" -> `implementing`
- "Mostly done" -> `implementing`
- "Done, needs validation" -> `validating`

## Step 3: Generate and Confirm Slug

Generate a slug using this priority order:

1. **GitHub issue URL** (if provided as parameter): `issue-{number}-{short-desc}` using first few words of issue title, max 30 chars
2. **Feature branch name**: strip prefixes (`feature/`, `feat/`, `fix/`, `bugfix/`, `chore/`), convert to kebab-case, max 30 chars
3. **Feature description** (from the user's answer to question 1): first few meaningful words, kebab-case, max 30 chars

Confirm with AskUserQuestion:

```
AskUserQuestion with questions:
1. Question: "Use this slug for the feature directory?"
   Header: "Slug"
   Options:
   - "{auto-generated-slug}" - thoughts/features/{auto-generated-slug}/ (Recommended)
   - "Custom slug" - I'll type my own
   multiSelect: false
```

If the user picks "Custom slug" (via "Other"), use their freeform input. Validate: lowercase, kebab-case, no spaces.

### Edge Case: Directory Already Exists

If `thoughts/features/{slug}/` already exists, warn the user:

```
AskUserQuestion with questions:
1. Question: "The directory thoughts/features/{slug}/ already exists. What should I do?"
   Header: "Conflict"
   Options:
   - "Use existing directory" - Add task.md to the existing directory (may overwrite)
   - "Pick a different slug" - I'll choose a new name
   multiSelect: false
```

If "Pick a different slug", collect a new slug via freeform input and re-check.

## Step 4: Confirm and Create

Show what will be created:

```
I'll create the following:

  thoughts/features/{slug}/
    task.md - Context anchor capturing your current work

Proceed?
```

Wait for user confirmation, then create:

1. **Create directory**: `thoughts/features/{slug}/`

2. **Create task.md** using this template:

```markdown
# Feature: {Name from user's description}

**Status:** {mapped status}
**Issue:** {GitHub link or "None"}
**PRD:** (none)
**Plan:** (not yet created)

## Context

Adopted from existing work on branch `{branch}` with {N} commits ahead of main.

**Key files changed:**
{top 5-8 files from git diff --stat, grouped by directory; if no commits ahead, list uncommitted files from git status instead}

## Decisions

(none yet)

## Recent Activity

- {YYYY-MM-DD}: Feature adopted from in-progress work
```

Key differences from `feature_start`'s task.md:
- `**PRD:**` is `(none)` -- no PRD is created
- `## Context` section captures git state at adoption time
- Status reflects actual progress, not always `planning`

## Step 5: Present Next Steps

After creating the files, present status-specific guidance:

**If status is `planning`:**
```
Feature adopted at: thoughts/features/{slug}/

Next steps:
1. Create a plan: /feature_plan @thoughts/features/{slug}/task.md
2. Implement: /feature_implement @thoughts/features/{slug}/task.md
3. Validate: /feature_validate @thoughts/features/{slug}/task.md
```

**If status is `implementing`:**
```
Feature adopted at: thoughts/features/{slug}/

Since you're actively implementing, you have two options:
1. Create a plan to track remaining work: /feature_plan @thoughts/features/{slug}/task.md
2. Continue implementing and validate when ready: /feature_validate @thoughts/features/{slug}/task.md
```

**If status is `validating`:**
```
Feature adopted at: thoughts/features/{slug}/

Since you're ready for validation:
1. Validate your work: /feature_validate @thoughts/features/{slug}/task.md
```

Always end with:
```
The task.md file will track status, decisions, and activity throughout the feature lifecycle.
```

## Important Guidelines

1. **Keep it lightweight**: This command should be fast. Two AskUserQuestion rounds max (questions + slug confirmation). Do not ask unnecessary follow-up questions.

2. **Use AskUserQuestion effectively**:
   - Infer options from git context (branch name, commit messages) when possible
   - Keep option labels concise (1-5 words)
   - Always allow "Other" (built into the tool)

3. **Handle git gracefully**:
   - If `main` doesn't exist, try `master` as the base branch
   - If neither exists, use the first commit as the base
   - Never fail silently -- tell the user what happened

4. **Don't create a PRD**:
   - The whole point of adopt is to skip the PRD creation phase
   - Downstream commands handle `**PRD:** (none)` gracefully
   - If the user wants a PRD later, they can create one separately

5. **Don't over-gather information**:
   - The git state IS the context -- capture it, don't interrogate about it
   - Two questions are enough: what is it, and where are you
   - Trust that `/feature_plan` will do deeper requirements gathering if needed
