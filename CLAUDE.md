# CLAUDE.md

Plugin repository for Claude Code. Primary plugin: **bootandshoe** - commands and agents for planning and implementation workflows.

## Structure

```
bootandshoe/
  agents/      # Sub-agents for Task tool (codebase-locator, codebase-analyzer, etc.)
  commands/    # Slash commands (/create_plan, /implement_plan, etc.)
```

## Core Workflow

### Feature-Centric (Multi-Session)

For features that span multiple sessions:

1. `/start_feature [issue-url]` - Create feature directory with task.md and PRD
2. `/create_plan @task.md` - Create plan (outputs to feature dir)
3. `/implement_plan @task.md` - Execute plan (updates task.md)
4. `/validate_feature @task.md` - Validate against PRD + plan

### Standalone (Single-Session)

For one-off tasks:

1. `/create_plan` - Research codebase, create phased implementation plan
2. `/implement_plan` - Execute plan with automated/manual verification
3. `/validate_plan` - Verify all success criteria met

## Context Efficiency

The plugin minimizes context usage through:

- **Parallel sub-agents**: Spawn multiple Task agents to research concurrently
- **file:line references**: Agents return precise locations, not full file contents
- **Focused prompts**: Tell agents WHAT to find, not HOW to search

## Agent Usage

When spawning agents via Task tool:

```python
# Spawn in parallel for efficiency
Task("bootandshoe:codebase-locator", "Find all authentication-related files")
Task("bootandshoe:codebase-analyzer", "Analyze how the login flow works")
Task("bootandshoe:codebase-pattern-finder", "Find similar form validation patterns")
```

Agents are documentarians - they describe what exists without suggesting improvements.

## Key Principles

- **Document, don't critique**: Agents describe current state, not ideal state
- **Automated vs manual verification**: Plans separate what can be scripted from what needs human testing
- **Read files fully**: Never use limit/offset when reading mentioned files
- **Feature-centric**: Use `/start_feature` for multi-session work; task.md anchors context

## Documentation

See [docs/bootandshoe.md](docs/bootandshoe.md) for complete command and agent reference.
