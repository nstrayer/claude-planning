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
1. `/feature_start [issue-url]` - Create feature directory with task.md and PRD
2. `/feature_plan @task.md` - Create plan (outputs to feature dir)
3. `/feature_implement @task.md` - Execute plan (updates task.md)
4. `/feature_validate @task.md` - Validate against PRD + plan

The task document maintains context across sessions and tracks status through: `planning` -> `planned` -> `implementing` -> `validating` -> `complete`

## Commands

| Command | Description |
|---------|-------------|
| `/feature_start` | Start a new feature with task document and PRD |
| `/feature_plan` | Interactive planning with codebase research |
| `/feature_implement` | Execute plans phase-by-phase with verification |
| `/feature_iterate` | Update existing plans with new information |
| `/feature_validate` | Validate implementation against PRD and plan |
| `/research` | Spawn parallel agents for codebase research |
| `/oneshot` | Quick plan-and-execute for simple tasks |

### Feature Workflow Example

```bash
# Start a feature from a GitHub issue
/feature_start https://github.com/org/repo/issues/123

# Or start without an issue
/feature_start
# Follow interactive prompts to create PRD

# Create implementation plan
/feature_plan @thoughts/features/issue-123-auth/task.md

# Implement the plan
/feature_implement @thoughts/features/issue-123-auth/task.md

# Validate against both PRD and plan
/feature_validate @thoughts/features/issue-123-auth/task.md
```

### Standalone Plan Workflow

For one-off tasks without the full feature structure:

```bash
# Create a plan (interactive, runs in plan mode)
/feature_plan

# Create plan from requirements file
/feature_plan path/to/requirements.md

# Implement - accepts plans from any source
/feature_implement thoughts/shared/plans/2025-01-08-feature.md
/feature_implement .claude/plan.md

# Validate implementation
/feature_validate thoughts/shared/plans/2025-01-08-feature.md
```

PRDs in `thoughts/shared/prds/` are detected by `/feature_plan` via:
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

Feature directories are created by `/feature_start`. Standalone plans can be stored in `thoughts/shared/plans/`.

## Usage Examples

### Research

```bash
# Research a topic
/research
# Then: "How does authentication work?"

# Research with feature context
/research @thoughts/features/my-feature/task.md How does the API handle errors?
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
| `/feature_start` | All phases - requirement gathering, user stories, success criteria |
| `/feature_validate` | PRD compliance, manual verification, final sign-off |
| `/feature_plan` | Design options, phase structure approval, web research decisions |
| `/feature_iterate` | Change type classification, understanding confirmation |

Benefits:
- Unambiguous responses
- All critical steps addressed
- Reduced cognitive load
- Better decision tracking

### Conversational (Freeform)

Used for exploration and detailed explanations:
- `/research` - Open-ended investigation
- `/oneshot` - Quick execution without interaction
- Summaries and explanations within all commands
- Follow-up details when users select options indicating issues

### Backwards Compatibility

Legacy patterns still work:
- `<feedback>` tags in `/feature_iterate` responses
- Freeform text responses (via "Other" option)
