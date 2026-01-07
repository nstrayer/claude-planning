# Claude Code Planning Plugin

A plugin for [Claude Code](https://claude.ai/code) that provides structured planning and implementation workflows with minimal context overhead.

**Key benefit**: Parallel sub-agents research your codebase and return precise `file:line` references, keeping your main context lean while gathering comprehensive information.

## Installation

```bash
# Add marketplace
/plugin marketplace add nstrayer/claude-planning

# Install plugin
/plugin install bootandshoe@bootandshoe-claude-planning
```

## Core Workflow

```bash
/create_plan              # Research codebase, generate implementation plan
/implement_plan <plan>    # Execute plan phase-by-phase with verification
/validate_plan <plan>     # Verify success criteria
```

## Commands

| Command | Description |
|---------|-------------|
| `/create_plan` | Interactive planning with codebase research |
| `/implement_plan` | Execute plans with automated/manual verification |
| `/validate_plan` | Verify implementation against plan criteria |
| `/research_codebase` | Spawn parallel agents for codebase research |
| `/iterate_plan` | Update existing plans with new information |

**Variants**: Add `_nt` for no-thoughts-directory mode, `_generic` for minimal project assumptions.

## Agents

Specialized agents for the Task tool:

| Agent | Purpose |
|-------|---------|
| `codebase-locator` | Find where code lives |
| `codebase-analyzer` | Understand how code works |
| `codebase-pattern-finder` | Find similar implementations |
| `web-search-researcher` | Research external documentation |

See [full documentation](docs/bootandshoe.md) for details.
