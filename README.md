# Claude Code Plugins

A collection of powerful plugins for [Claude Code](https://claude.ai/code) that enhance your development workflow with specialized commands and agents for codebase research, planning, and implementation.

## Overview

This repository provides a plugin marketplace for Claude Code with the **bootandshoe** plugin: 6 specialized agents and 10 slash commands for codebase research, planning, and implementation workflows.

## Installation

### Add This Marketplace to Claude Code

You can install plugins from this marketplace using one of these methods:

#### From GitHub (Recommended)

```bash
/plugin marketplace add bootandshoe/claude-planning
```

#### From Local Directory

If you've cloned this repository locally:

```bash
/plugin marketplace add /path/to/claude-planning
```

### Install the bootandshoe Plugin

After adding the marketplace, install the plugin:

```bash
# Interactive installation (browse all available plugins)
/plugin

# Direct installation
/plugin install bootandshoe@bootandshoe-claude-planning
```

## Available Commands

### Planning Workflow Commands

| Command | Description |
|---------|-------------|
| `/research_codebase` | Spawn parallel agents to research the codebase comprehensively |
| `/create_plan` | Interactive planning process that researches codebase and generates detailed implementation plans |
| `/iterate_plan` | Update and refine existing implementation plans |
| `/implement_plan` | Execute approved plans phase-by-phase with verification checkpoints |
| `/validate_plan` | Verify implementation against plan success criteria |

**Command Variants:**
- `_nt` suffix: No thoughts directory required (e.g., `/create_plan_nt`)
- `_generic` suffix: Generic version without project-specific features

## Available Agents

Specialized agents invoked via Claude Code's Task tool:

| Agent | Description |
|-------|-------------|
| `codebase-analyzer` | Analyzes implementation details with file:line references |
| `codebase-locator` | Finds where code lives in the codebase |
| `codebase-pattern-finder` | Finds similar implementations and usage examples |
| `thoughts-analyzer` | Deep dives on research topics in thoughts/ directory |
| `thoughts-locator` | Discovers relevant documents in thoughts/ directory |
| `web-search-researcher` | Performs web research for external documentation |

## Workflow Example

```bash
# 1. Research and plan
/create_plan

# 2. Implement the plan
/implement_plan thoughts/shared/plans/2025-10-09-my-feature.md

# 3. Validate implementation
/validate_plan thoughts/shared/plans/2025-10-09-my-feature.md
```

## Requirements

Some commands expect a `thoughts/` directory structure. See [full documentation](docs/bootandshoe.md) for details.
