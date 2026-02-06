# BootAndShoe Plugin

Planning and implementation workflows for Claude Code. Provides slash commands and specialized agents that research codebases with minimal context overhead.

## Feature-Centric Workflow

For multi-session feature development, use the feature-centric workflow:

```
thoughts/features/{feature-slug}/
  task.md      # Context anchor (status, decisions, activity)
  prd.md       # Product requirements
  plan.md      # Implementation plan
```

**Commands:**
1. `/start_feature [issue-url]` - Create feature directory with task.md and PRD
2. `/create_plan @task.md` - Create plan (outputs to feature dir)
3. `/implement_plan @task.md` - Execute plan (updates task.md)
4. `/validate_feature @task.md` - Validate against PRD + plan

The task document maintains context across sessions and tracks status through: `planning` -> `planned` -> `implementing` -> `validating` -> `complete`

## Commands

| Command | Description |
|---------|-------------|
| `/start_feature` | Start a new feature with task document and PRD |
| `/create_plan` | Interactive planning with codebase research |
| `/implement_plan` | Execute plans phase-by-phase with verification |
| `/validate_feature` | Validate implementation against PRD and plan |
| `/validate_plan` | Verify implementation against plan success criteria |
| `/iterate_plan` | Update existing plans with new information |
| `/research_codebase` | Spawn parallel agents for codebase research |

### Feature Workflow Example

```bash
# Start a feature from a GitHub issue
/start_feature https://github.com/org/repo/issues/123

# Or start without an issue
/start_feature
# Follow interactive prompts to create PRD

# Create implementation plan
/create_plan @thoughts/features/issue-123-auth/task.md

# Implement the plan
/implement_plan @thoughts/features/issue-123-auth/task.md

# Validate against both PRD and plan
/validate_feature @thoughts/features/issue-123-auth/task.md
```

### Standalone Plan Workflow

For one-off tasks without the full feature structure:

```bash
# Create a plan (interactive, runs in plan mode)
/create_plan

# Create plan from requirements file
/create_plan path/to/requirements.md

# Implement - accepts plans from any source
/implement_plan thoughts/shared/plans/2025-01-08-feature.md
/implement_plan .claude/plan.md

# Validate implementation
/validate_plan thoughts/shared/plans/2025-01-08-feature.md
```

PRDs in `thoughts/shared/prds/` are detected by `/create_plan` via:
- Frontmatter: `type: prd`
- Path: `*/prds/*.md`
- Filename: `*-prd.md`

## Agents

Specialized agents for the Task tool. All agents are documentarians—they describe what exists without suggesting improvements.

### Codebase Agents

| Agent | Purpose | Tools |
|-------|---------|-------|
| `bootandshoe:codebase-locator` | Find where code lives | Grep, Glob, LS |
| `bootandshoe:codebase-analyzer` | Understand how code works | Read, Grep, Glob, LS |
| `bootandshoe:codebase-pattern-finder` | Find similar implementations | Grep, Glob, Read, LS |

### Other Agents

| Agent | Purpose | Tools |
|-------|---------|-------|
| `bootandshoe:thoughts-locator` | Find documents in thoughts/ | Grep, Glob, LS |
| `bootandshoe:thoughts-analyzer` | Extract insights from thoughts/ | Read, Grep, Glob, LS |
| `bootandshoe:web-search-researcher` | Research external documentation | WebSearch, WebFetch |

## Skills

| Skill | Purpose |
|-------|---------|
| `spec-metadata` | Generate frontmatter for research documents |

## Thoughts Directory

The `thoughts/` directory organizes planning artifacts:

```
thoughts/
├── features/           # Feature-centric workflows
│   └── {slug}/
│       ├── task.md     # Context anchor
│       ├── prd.md      # Requirements
│       └── plan.md     # Implementation plan
└── shared/
    ├── plans/          # Standalone implementation plans
    ├── prds/           # Standalone PRDs
    └── research/       # Research documents
```

Feature directories are created by `/start_feature`. Standalone plans can be stored in `thoughts/shared/plans/`.

## Usage Examples

### Research

```bash
# Research a topic
/research_codebase
# Then: "How does authentication work?"
```

### Agent Spawning

```python
# Spawn multiple agents in parallel
Task("bootandshoe:codebase-locator", "Find all files related to user authentication")
Task("bootandshoe:codebase-analyzer", "Analyze how the session management works")
```

## Key Principles

1. **Parallel research**: Spawn multiple agents concurrently for efficiency
2. **Precise references**: Agents return `file:line` references, not full contents
3. **Document, don't critique**: Describe what exists without evaluation
4. **Separated verification**: Plans distinguish automated checks from manual testing

## Interaction Patterns

Commands use two interaction styles:

### Structured (AskUserQuestion)

Used for key decisions where clear choices improve workflow:

| Command | Where Used |
|---------|------------|
| `/start_feature` | All phases - requirement gathering, user stories, success criteria |
| `/validate_feature` | PRD compliance, manual verification, final sign-off |
| `/validate_plan` | Manual verification collection, final sign-off |
| `/review_plan` | Section-by-section feedback, final action selection |
| `/create_plan` | Design options, phase structure approval, web research decisions |
| `/iterate_plan` | Change type classification, understanding confirmation |

Benefits:
- Unambiguous responses
- All critical steps addressed
- Reduced cognitive load
- Better decision tracking

### Conversational (Freeform)

Used for exploration and detailed explanations:
- `/research_codebase` - Open-ended investigation
- `/oneshot` - Quick execution without interaction
- Summaries and explanations within all commands
- Follow-up details when users select options indicating issues

### Backwards Compatibility

Legacy patterns still work:
- `<feedback>` tags in `/review_plan` responses
- Freeform text responses (via "Other" option)
