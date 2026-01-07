# Minimal Context Architecture

This plugin is designed to minimize context usage while maximizing codebase understanding.

## How It Works

### Parallel Sub-Agents

Instead of reading entire files into the main conversation, commands spawn specialized agents that:

1. Search the codebase in parallel
2. Return only relevant `file:line` references
3. Let you decide what to read in full

```
Main Context                    Sub-Agents (parallel)
     │                         ┌─ codebase-locator ──► "Found auth in src/auth.ts:45"
     ├── /research_codebase ───┼─ codebase-analyzer ──► "Login flow: src/auth.ts:45-89"
     │                         └─ pattern-finder ────► "Similar pattern: src/user.ts:12"
     ▼
Only file:line references returned (not full file contents)
```

### Context Savings

| Approach | Context Used |
|----------|--------------|
| Read 5 files fully | ~2000 lines each = 10,000 lines |
| Parallel agents with references | ~50 lines of references |

## Best Practices

1. **Start with `/research_codebase`** - Get the lay of the land with references first
2. **Read selectively** - Only pull full files you actually need
3. **Use specific prompts** - "Find auth files" beats "explore the codebase"
4. **Trust agent references** - They're precise; you don't need full context to act on them

## When to Read Full Files

- Before making edits to a file
- When agent references aren't enough to understand the logic
- When writing tests that need to match existing patterns

The goal: understand the codebase structure without filling your context with code you won't modify.
