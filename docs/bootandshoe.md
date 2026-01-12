# BootAndShoe Plugin

Planning and implementation workflows for Claude Code. Provides slash commands and specialized agents that research codebases with minimal context overhead.

## Commands

| Command | Description | Variants |
|---------|-------------|----------|
| `/create_prd` | Interactive PRD creation through requirement gathering | - |
| `/create_plan` | Interactive planning with codebase research | `_nt`, `_generic` |
| `/implement_plan` | Execute plans phase-by-phase with verification | - |
| `/validate_plan` | Verify implementation against success criteria | - |
| `/iterate_plan` | Update existing plans with new information | `_nt` |
| `/research_codebase` | Spawn parallel agents for codebase research | `_nt`, `_generic` |

**Variant suffixes:**
- `_nt` - No thoughts directory required
- `_generic` - Minimal project-specific assumptions

### PRD Workflow

Create PRDs before implementation plans for well-defined features:

```bash
# Create a PRD interactively (uses AskUserQuestion for structured gathering)
/create_prd

# Create implementation plan from PRD
/create_plan thoughts/shared/prds/2026-01-12-feature.md
```

PRDs are stored in `thoughts/shared/prds/` and are detected by `/create_plan` via:
- Frontmatter: `type: prd`
- Path: `*/prds/*.md`
- Filename: `*-prd.md`

When a PRD is detected, `/create_plan` extracts requirements and focuses research on technical implementation.

## Agents

Specialized agents for the Task tool. All agents are documentarians—they describe what exists without suggesting improvements.

### Codebase Agents

| Agent | Purpose | Tools |
|-------|---------|-------|
| `codebase-locator` | Find where code lives | Grep, Glob, LS |
| `codebase-analyzer` | Understand how code works | Read, Grep, Glob, LS |
| `codebase-pattern-finder` | Find similar implementations | Grep, Glob, Read, LS |

### Other Agents

| Agent | Purpose | Tools |
|-------|---------|-------|
| `thoughts-locator` | Find documents in thoughts/ | Grep, Glob, LS |
| `thoughts-analyzer` | Extract insights from thoughts/ | Read, Grep, Glob, LS |
| `web-search-researcher` | Research external documentation | WebSearch, WebFetch |

## Skills

| Skill | Purpose |
|-------|---------|
| `spec-metadata` | Generate frontmatter for research documents |

## Thoughts Directory (Optional)

Some commands use a `thoughts/` directory for storing plans and research:

```
thoughts/
├── shared/
│   ├── plans/      # Implementation plans
│   ├── prds/       # Product Requirements Documents
│   └── research/   # Research documents
```

Commands with `_nt` suffix work without this directory. You can also specify custom paths.

## Usage Examples

### Planning Workflow

```bash
# Create a plan (interactive)
/create_plan

# Create plan from requirements file
/create_plan path/to/requirements.md

# Implement the plan
/implement_plan thoughts/shared/plans/2025-01-08-feature.md

# Validate implementation
/validate_plan thoughts/shared/plans/2025-01-08-feature.md
```

### Research

```bash
# Research a topic
/research_codebase
# Then: "How does authentication work?"

# Without thoughts directory
/research_codebase_nt
```

### Agent Spawning

```python
# Spawn multiple agents in parallel
Task("codebase-locator", "Find all files related to user authentication")
Task("codebase-analyzer", "Analyze how the session management works")
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
| `/create_prd` | All phases - requirement gathering, user stories, success criteria |
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
