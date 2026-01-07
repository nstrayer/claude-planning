# BootAndShoe Plugin

**Category:** Development
**Version:** 2025-12-15
**Author:** BootAndShoe
**Forked from:** [jeffh/claude-plugins](https://github.com/jeffh/claude-plugins) (HumanLayer plugin)

A simplified fork of the HumanLayer plugin, focused exclusively on planning use cases. This plugin provides slash commands and research agents for codebase research, implementation planning, and plan validation workflows.

## Commands

The bootandshoe plugin provides 10 slash commands focused on research, planning, and implementation workflows.

### `/research_codebase`

Conducts comprehensive codebase research by spawning parallel specialized agents.

**Features:**
- Spawns multiple agents in parallel for efficient research
- Documents findings with file:line references
- Generates research document with metadata
- Saves to `thoughts/shared/research/YYYY-MM-DD-description.md`
- Creates permanent GitHub permalinks when possible

**Variants:**
- `/research_codebase` - Full version with thoughts directory integration
- `/research_codebase_nt` - No thoughts directory required
- `/research_codebase_generic` - Generic version without project-specific features

**Usage:**
```bash
/research_codebase
# Then provide your research question when prompted
```

---

### `/create_plan`

Interactive planning process that researches your codebase and generates detailed implementation plans.

**Features:**
- Spawns parallel research agents to understand existing code
- Asks clarifying questions based on actual codebase findings
- Generates plans with phases and success criteria (automated & manual)
- Saves to `thoughts/shared/plans/YYYY-MM-DD-description.md`

**Variants:**
- `/create_plan` - Full version with thoughts directory integration
- `/create_plan_nt` - No thoughts directory required
- `/create_plan_generic` - Generic version without project-specific features

**Usage:**
```bash
# Interactive mode
/create_plan

# With ticket file
/create_plan thoughts/allison/tickets/eng_1234.md

# Deep analysis mode
/create_plan think deeply about thoughts/allison/tickets/eng_1234.md
```

---

### `/iterate_plan`

Update and refine existing implementation plans based on new information or feedback.

**Features:**
- Reads existing plan and understands current state
- Incorporates feedback and new requirements
- Maintains plan structure and format
- Updates success criteria as needed

**Variants:**
- `/iterate_plan` - Full version with thoughts directory integration
- `/iterate_plan_nt` - No thoughts directory required

**Usage:**
```bash
/iterate_plan thoughts/shared/plans/2025-10-09-my-feature.md
```

---

### `/implement_plan`

Executes approved implementation plans phase-by-phase with verification checkpoints.

**Features:**
- Reads and understands complete plan context
- Implements each phase before moving to next
- Runs automated verification (tests, linting, builds)
- Pauses for manual verification before continuing
- Updates checkboxes in plan file as work progresses

**Usage:**
```bash
/implement_plan thoughts/shared/plans/2025-10-09-my-feature.md
```

---

### `/validate_plan`

Validates that an implementation plan was correctly executed by verifying all success criteria.

**Features:**
- Compares implementation against plan specifications
- Runs all automated verification commands
- Identifies what needs manual testing
- Generates comprehensive validation report
- Catches issues before they reach production

**Usage:**
```bash
/validate_plan thoughts/shared/plans/2025-10-09-my-feature.md
```

---

## Agents

The bootandshoe plugin provides 6 specialized agents that can be invoked via Claude Code's Task tool. These agents are designed to be documentarians—they describe what exists without suggesting improvements unless explicitly asked.

### Codebase Agents

#### `codebase-analyzer`

Analyzes implementation details with precise file:line references.

**Use when you need to:**
- Understand HOW specific code works
- Trace data flow through components
- Document technical implementation details
- Get surgical precision on code behavior

**Tools:** Read, Grep, Glob, LS

---

#### `codebase-locator`

Finds WHERE code lives in the codebase.

**Use when you need to:**
- Locate files related to a feature
- Find test files, configs, or documentation
- Understand code organization
- Map out component locations

**Tools:** Grep, Glob, LS

---

#### `codebase-pattern-finder`

Finds similar implementations and usage examples.

**Use when you need to:**
- Find existing patterns to model after
- See how similar features are implemented
- Locate usage examples
- Discover testing patterns

**Tools:** Grep, Glob, Read, LS

---

### Thoughts Directory Agents

#### `thoughts-analyzer`

Deep dives on research topics within the thoughts/ directory.

**Use when you need to:**
- Extract key decisions from documents
- Find actionable insights from past research
- Understand historical context
- Filter high-value information from noise

**Tools:** Read, Grep, Glob, LS

---

#### `thoughts-locator`

Discovers relevant documents in the thoughts/ directory.

**Use when you need to:**
- Find existing tickets, plans, or research
- Locate historical decisions
- Discover related documentation
- Map out what thoughts exist on a topic

**Tools:** Grep, Glob, LS

---

### Web Research Agent

#### `web-search-researcher`

Performs comprehensive web research using search and fetch.

**Use when you need to:**
- Find modern information beyond training data
- Research APIs, libraries, or frameworks
- Discover best practices from web sources
- Gather technical documentation

**Tools:** WebSearch, WebFetch, TodoWrite, Read, Grep, Glob, LS

---

## Skills

### `spec-metadata`

Generates metadata for research documents and specifications.

**Use for:**
- Creating research documents
- Adding timestamp and git metadata to documentation
- Generating consistent frontmatter

---

## Requirements

### Thoughts Directory Structure

Several commands expect a `thoughts/` directory with this structure:

```
thoughts/
├── shared/
│   ├── plans/              # Implementation plans
│   ├── research/           # Research documents
│   └── prs/               # PR descriptions
├── allison/               # Personal thoughts (user-specific)
│   └── tickets/
└── searchable/            # Hard links for searching
```

**Note:** Commands with `_nt` suffix work without this directory structure.
