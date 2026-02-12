---
description: Adopt in-progress work into the feature tracking workflow
model: opus
allowed-tools: ["Read", "Write", "Grep", "Glob", "Bash", "AskUserQuestion"]
argument-hint: Optional GitHub issue URL
---

# Adopt Feature

Adopt existing in-progress work into the feature-centric workflow. Creates a feature directory with task.md that captures current git state, enabling use of `/feature_plan`, `/feature_implement`, and `/feature_validate`.

**Initial request:** $ARGUMENTS

---

## Phase 1: Gather Git Context

**Goal**: Understand the current state of work

**Actions**:
1. If a GitHub issue URL was provided, fetch details via `gh issue view {number} --json title,body,labels`
2. Run four git commands in parallel:
   - `git branch --show-current`
   - `git log --oneline main..HEAD 2>/dev/null`
   - `git status --short`
   - `git diff --stat main..HEAD 2>/dev/null`
3. Present a concise summary: branch name, commits ahead of main, uncommitted changes count, top-level directory grouping of changed files
4. Handle edge cases:
   - **On main with no commits and no changes**: Inform the user there is nothing to adopt and suggest `/feature_start` instead. Stop here.
   - **On main with uncommitted changes only**: Note that task.md will capture the uncommitted changes
   - **Detached HEAD**: Note the situation and that user will need a custom slug

**Output**: Git state understood, summary presented

---

## Phase 2: Collect Feature Information

**Goal**: Understand what the feature is and where the user is in development

**Actions**:
1. Call AskUserQuestion with 2 questions in a single call:
   - "What is this feature about?" (header: "Feature", multiSelect: false) -- infer options from branch name or commit messages; fall back to "Bug fix" / "New feature" if nothing useful to infer
   - "Where are you in the work?" (header: "Status", multiSelect: false) -- options: "Just started" / "Actively implementing" / "Mostly done" / "Done, needs validation"
2. Map status: "Just started" -> `planning`, "Actively implementing" -> `implementing`, "Mostly done" -> `implementing`, "Done, needs validation" -> `validating`

**Output**: Feature description and status determined

---

## Phase 3: Generate Slug

**Goal**: Create a feature directory slug

**Actions**:
1. Generate slug using priority order:
   - GitHub issue URL: `issue-{number}-{short-desc}` from issue title, max 30 chars
   - Feature branch name: strip prefixes (`feature/`, `feat/`, `fix/`, `bugfix/`, `chore/`), convert to kebab-case, max 30 chars
   - Feature description from user answer: first meaningful words, kebab-case, max 30 chars
2. Use AskUserQuestion (header: "Slug") to confirm: "{auto-slug}" (Recommended) / "Custom slug"
3. If custom slug chosen, validate: lowercase, kebab-case, no spaces
4. If `thoughts/features/{slug}/` already exists, use AskUserQuestion (header: "Conflict") to resolve: "Use existing directory" / "Pick a different slug"

**Output**: Slug confirmed

---

## Phase 4: Create Feature Directory

**Goal**: Create task.md capturing current work

**Actions**:
1. Show what will be created (`thoughts/features/{slug}/` with `task.md`) and wait for user confirmation
2. Create directory `thoughts/features/{slug}/` via Bash
3. Write `thoughts/features/{slug}/task.md` using the template below

**Output**: Feature directory created

### task.md Template

```markdown
# Feature: {Name from user's description}

**Status:** {mapped status}
**Issue:** {GitHub link or "None"}
**PRD:** (none)
**Plan:** (not yet created)

## Context

Adopted from existing work on branch `{branch}` with {N} commits ahead of main.

**Key files changed:**
{top 5-8 files from git diff --stat, grouped by directory; if no commits, list uncommitted files}

## Decisions

(none yet)

## Recent Activity

- {YYYY-MM-DD}: Feature adopted from in-progress work
```

---

## Phase 5: Present Next Steps

**Goal**: Guide the user on what to do next

**Actions**:
1. Present status-specific guidance:
   - **planning**: Suggest `/feature_plan @task.md` -> `/feature_implement` -> `/feature_validate`
   - **implementing**: Suggest creating a plan for remaining work, or continuing and validating when ready
   - **validating**: Suggest `/feature_validate @task.md`
2. Note that task.md will track status, decisions, and activity throughout the lifecycle

**Output**: User informed of next steps

---

## Guidelines

- **Keep it lightweight**: Two AskUserQuestion rounds max (questions + slug confirmation)
- **Infer options from git context**: Use branch names and commit messages to generate meaningful options
- **Handle git gracefully**: Try `master` if `main` doesn't exist; if neither exists, use first commit as base. Never fail silently
- **Don't create a PRD**: That's the point of adopt -- downstream commands handle `**PRD:** (none)` gracefully
- **Don't over-gather**: Git state IS the context; two questions are enough. Trust that `/feature_plan` will do deeper requirements gathering if needed
