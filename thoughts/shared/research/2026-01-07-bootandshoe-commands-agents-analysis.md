---
date: 2026-01-07T14:03:35-05:00
researcher: Claude
git_commit: 069f59f010b13f0319115142308158d1b0597309
branch: main
repository: claude-plugins
topic: "BootAndShoe Plugin Commands and Agents Comprehensive Analysis"
tags: [research, codebase, bootandshoe, commands, agents, workflow]
status: complete
last_updated: 2026-01-07
last_updated_by: Claude
---

# Research: BootAndShoe Plugin Commands and Agents Comprehensive Analysis

**Date**: 2026-01-07 14:03:35 EST
**Researcher**: Claude
**Git Commit**: 069f59f010b13f0319115142308158d1b0597309
**Branch**: main
**Repository**: claude-plugins

## Research Question
Thoroughly describe what each command and subagent /task does in this repo. Put it in a table. Draw connections between elements when appropriate.

## Summary
The bootandshoe plugin provides a comprehensive planning and implementation workflow system for Claude Code, consisting of 10 command variants and 6 specialized agents. Commands orchestrate high-level workflows (research → planning → implementation → validation) while agents handle focused research tasks. All components follow a "documentarian" philosophy - describing what exists without suggesting improvements.

## Commands Overview Table

| Command | Description | Model | Primary Function | Agent Usage | Workflow Position |
|---------|-------------|-------|------------------|-------------|-------------------|
| `/create_plan` | Create implementation plan with thoughts directory | opus | Interactive plan creation through research and iteration | Spawns 5 agent types in parallel | Start of workflow |
| `/create_plan_nt` | Create plan without thoughts directory | opus | Same as create_plan but no thoughts/ agents | Spawns 3 codebase agents only | Start (no thoughts) |
| `/create_plan_generic` | Generic plan creation | opus | Simplified plan creation with minimal assumptions | Spawns 5 agent types | Start (generic) |
| `/iterate_plan` | Update existing plan with thoughts | opus | Modify plans based on feedback | Conditional agent spawning | After create_plan |
| `/iterate_plan_nt` | Update plan without thoughts | opus | Same as iterate_plan but no thoughts/ agents | Spawns 3 codebase agents | After create_plan |
| `/implement_plan` | Execute implementation plan | sonnet | Phase-by-phase plan execution with verification | No automatic agents | After plan approval |
| `/validate_plan` | Verify implementation correctness | sonnet | Validate against success criteria | Spawns research agents | After implementation |
| `/research_codebase` | Research with thoughts directory | opus | Document codebase comprehensively | Spawns all 6 agent types | Any time |
| `/research_codebase_nt` | Research without thoughts | opus | Same as research_codebase minus thoughts/ | Spawns 4 agents (no thoughts) | Any time |
| `/research_codebase_generic` | Generic codebase research | opus | Minimal assumptions research | Spawns 4 agents | Any time |

## Agents/Subagents Overview Table

| Agent | Description | Tools | Returns | Used By Commands | Complementary Agents |
|-------|-------------|-------|---------|------------------|---------------------|
| `codebase-locator` | Finds WHERE files/components live by topic | Grep, Glob, LS | File paths organized by purpose | All planning/research commands | → codebase-analyzer |
| `codebase-analyzer` | Understands HOW code works | Read, Grep, Glob, LS | Implementation details with file:line refs | All planning/research commands | ← codebase-locator |
| `codebase-pattern-finder` | Finds similar implementations/patterns | Grep, Glob, Read, LS | Code examples and variations | create_plan, iterate_plan, research | Works alongside analyzer |
| `thoughts-locator` | Discovers documents in thoughts/ directory | Grep, Glob, LS | Document paths by type | Non-nt commands only | → thoughts-analyzer |
| `thoughts-analyzer` | Extracts insights from thoughts/ docs | Read, Grep, Glob, LS | Key decisions and constraints | Non-nt commands only | ← thoughts-locator |
| `web-search-researcher` | External web research | WebSearch, WebFetch, TodoWrite, Read, Grep, Glob, LS | Links and summaries | research_codebase (on request) | Standalone |

## Command-Agent Interaction Patterns

| Pattern | Description | Example | Commands Using |
|---------|-------------|---------|----------------|
| **Parallel Spawn** | Commands spawn multiple agents concurrently | Task("codebase-locator", "Find auth files") + Task("codebase-analyzer", "Analyze login") | All planning/research |
| **Locator → Analyzer** | Find WHERE first, then understand HOW | Locator finds files → Command reads → Analyzer explains | create_plan, research_codebase |
| **Read First, Then Spawn** | Commands read user files before spawning agents | Read requirements.md → Spawn agents for context | All commands with file params |
| **Wait All, Then Synthesize** | Commands wait for all agents before proceeding | Spawn 5 agents → Wait → Compile results | All multi-agent commands |
| **Conditional Spawning** | Only spawn agents if needed | Check if technical research needed → Spawn | iterate_plan |
| **No Agent Execution** | Direct implementation without research | Read plan → Execute → Verify | implement_plan |

## Workflow Connections

### Primary Workflow Chain
```
/research_codebase (optional understanding)
        ↓
/create_plan (interactive planning)
        ↓
/iterate_plan (refine based on feedback)
        ↓
/implement_plan (phase-by-phase execution)
        ↓
/validate_plan (verify correctness)
```

### Agent Cooperation Patterns
```
codebase-locator (finds files)
        ↓
Command reads identified files
        ↓
codebase-analyzer (explains implementation)
        ↓
codebase-pattern-finder (shows examples)

thoughts-locator (finds documents)
        ↓
thoughts-analyzer (extracts insights)
```

### Data Flow Architecture
```
User Input → Command
    ↓
Read mentioned files fully
    ↓
Spawn agents in parallel ←─────────┐
    ↓                              │
Agents return file:line references │
    ↓                              │
Command reads important files      │
    ↓                              │
Synthesize all findings ───────────┘
    ↓
Write to thoughts/shared/{plans|research}/
    ↓
Present to user
```

## Key Design Principles

### Command Design
1. **Phased Approach**: Commands guide through discrete phases (research → plan → implement → validate)
2. **Interactive Workflow**: Commands pause for user input/approval at key points
3. **Full File Reading**: Commands always read files completely (no limit/offset)
4. **Context Efficiency**: Commands synthesize agent results to minimize token usage

### Agent Design
1. **Documentarian Philosophy**: All agents describe what exists without critique
2. **Specialized Tools**: Each agent has tools matching its specific purpose
3. **Reference Returns**: Agents return file:line references, not full content
4. **Parallel Execution**: Agents designed for concurrent operation

### Integration Patterns
1. **No Agent-to-Agent**: Agents never spawn other agents
2. **Command Orchestration**: Only commands spawn and coordinate agents
3. **Result Synthesis**: Commands add context agents can't see
4. **Verification Separation**: Automated vs manual verification throughout

## File Organization

### Command Files
```
bootandshoe/commands/
├── create_plan.md         # Full-featured planning
├── create_plan_nt.md      # No thoughts variant
├── create_plan_generic.md # Generic variant
├── iterate_plan.md        # Plan updates
├── iterate_plan_nt.md     # No thoughts updates
├── implement_plan.md      # Execution
├── validate_plan.md       # Verification
├── research_codebase.md   # Full research
├── research_codebase_nt.md # No thoughts research
└── research_codebase_generic.md # Generic research
```

### Agent Files
```
bootandshoe/agents/
├── codebase-locator.md      # WHERE finder
├── codebase-analyzer.md     # HOW explainer
├── codebase-pattern-finder.md # EXAMPLE shower
├── thoughts-locator.md      # Document finder
├── thoughts-analyzer.md     # Insight extractor
└── web-search-researcher.md # External researcher
```

### Output Structure
```
thoughts/shared/
├── plans/     # YYYY-MM-DD-description.md (from create_plan)
└── research/  # YYYY-MM-DD-description.md (from research_codebase)
```

## Implementation Details

### Success Criteria Format (Used in Plans)
```markdown
#### Automated Verification:
- [ ] make test
- [ ] make check

#### Manual Verification:
- [ ] UI displays correctly
- [ ] User flow works as expected
```

### Agent Invocation Pattern
```python
# Commands use natural language prompts
Task("codebase-locator", "Find all authentication files")
Task("codebase-analyzer", "Analyze session management")
Task("codebase-pattern-finder", "Find form validation examples")
```

### Metadata Requirements
- **Commands**: YAML frontmatter with `description` and `model`
- **Research Docs**: Extensive frontmatter (date, git_commit, branch, repository, topic, tags)
- **Plans**: Markdown checkboxes track completion state

## Variant Naming Convention
- **No suffix**: Full-featured with thoughts/ directory support
- **`_nt` suffix**: "No Thoughts" - works without thoughts/ directory
- **`_generic` suffix**: Minimal project-specific assumptions

## Performance Optimizations
1. **Parallel Agent Execution**: Multiple agents run concurrently
2. **Reference-Based Returns**: Agents return locations, not content
3. **Selective Reading**: Commands only read important files
4. **Conditional Spawning**: Agents only spawned when needed

## Code References
- Command definitions: `bootandshoe/commands/*.md`
- Agent definitions: `bootandshoe/agents/*.md`
- Documentation: `docs/bootandshoe.md`
- Example plan: `thoughts/shared/plans/2026-01-07-simplify-documentation.md`

## Architecture Documentation

### Command State Machine
- **create_plan**: Initial → Research → Structure → Write → Review
- **iterate_plan**: Read Plan → Research (optional) → Update → Review
- **implement_plan**: Read Plan → Execute Phase → Verify → Next Phase
- **validate_plan**: Discover → Validate → Report

### Agent Specialization Hierarchy
- **Search-only**: codebase-locator, thoughts-locator (Grep, Glob, LS)
- **Search+Read**: codebase-analyzer, codebase-pattern-finder, thoughts-analyzer
- **Full-featured**: web-search-researcher (all tools including web)

### Workflow Pause Points
1. After plan structure (before detailed writing)
2. After each implementation phase
3. Before proceeding with plan updates
4. After automated tests (before manual verification)

## Related Research
- Previous planning workflows in thoughts/shared/plans/
- Research documents in thoughts/shared/research/

## Open Questions
None - all command and agent functionality has been fully documented based on codebase analysis.