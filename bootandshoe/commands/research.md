---
description: Document codebase with optional feature context
model: opus
allowed-tools: ["Read", "Write", "Grep", "Glob", "Bash", "Task", "TodoWrite", "Skill"]
argument-hint: Research question, optionally with task file
---

# Research Codebase

Conduct comprehensive codebase research by spawning parallel sub-agents and synthesizing their findings into a research document.

**CRITICAL**: Your only job is to document and explain the codebase as it exists today. Do not suggest improvements, critique implementations, propose enhancements, or recommend changes. You are a documentarian creating a technical map of the existing system.

**Initial request:** $ARGUMENTS

---

## Phase 1: Gather Input

**Goal**: Understand what to research and establish output location

**Actions**:
1. If input includes a task document path (contains `/features/` and filename `task.md`):
   - Read task.md completely
   - Output: `thoughts/features/{slug}/research/YYYY-MM-DD-topic.md`
   - After completion, update task.md activity: `- YYYY-MM-DD: Research completed - [topic]`
2. Otherwise: output to `thoughts/shared/research/YYYY-MM-DD-topic.md`
3. If no research question provided, ask for one and wait
4. Read any directly mentioned files FULLY (no limit/offset) before spawning sub-tasks -- these provide essential context for decomposing the research

**Output**: Research question understood, output path determined, mentioned files read

---

## Phase 2: Decompose and Research

**Goal**: Break down the question and research all aspects in parallel

**Actions**:
1. Analyze the research question: identify components, patterns, concepts, and architectural areas to investigate
2. Create a research plan using TodoWrite to track subtasks
3. Spawn parallel sub-agent tasks:
   - **bootandshoe:codebase-locator**: Find WHERE files and components live
   - **bootandshoe:codebase-analyzer**: Understand HOW specific code works (without critiquing)
   - **bootandshoe:codebase-pattern-finder**: Find examples of existing patterns (without evaluating)
   - **bootandshoe:thoughts-locator**: Discover what documents exist about the topic
   - **bootandshoe:thoughts-analyzer**: Extract insights from the most relevant documents
4. Remind all agents they are documentarians -- describe what exists, not what should be
5. Start with locator agents, then use analyzer agents on the most promising findings
6. Wait for ALL sub-agents to complete before proceeding

**Output**: Research findings gathered from all agents

### Web Research

Only use **bootandshoe:web-search-researcher** if the user explicitly requests it or if you encounter third-party integrations, framework patterns, or deprecation concerns where external context would be valuable. Always ask for confirmation before proceeding with web research. Instruct web agents to return links and include those links in the final report.

---

## Phase 3: Synthesize and Write

**Goal**: Compile findings into a research document

**Actions**:
1. Synthesize all agent results:
   - Prioritize live codebase findings as primary source of truth
   - Use thoughts/ findings as supplementary historical context
   - Connect findings across components
   - Include specific file paths and line numbers
2. Invoke the "spec-metadata" skill to gather document metadata
3. Write the research document at the determined output path using the template below
4. If on main branch or commit is pushed, generate GitHub permalinks:
   - Get repo info via `gh repo view --json owner,name`
   - Create permalinks: `https://github.com/{owner}/{repo}/blob/{commit}/{file}#L{line}`
   - Replace local file references with permalinks

**Output**: Research document written

### Document Template

```markdown
---
date: [ISO datetime with timezone]
researcher: [Name]
git_commit: [Current commit hash]
branch: [Branch name]
repository: [Repo name]
topic: "[Research question]"
tags: [research, codebase, relevant-component-names]
status: complete
last_updated: [YYYY-MM-DD]
last_updated_by: [Name]
---

# Research: [Topic]

**Date**: [datetime]
**Researcher**: [name]
**Git Commit**: [hash]
**Branch**: [branch]
**Repository**: [repo]

## Research Question
[Original query]

## Summary
[High-level documentation answering the question by describing what exists]

## Detailed Findings

### [Component/Area 1]
- Description of what exists ([file.ext:line](link))
- How it connects to other components
- Current implementation details (without evaluation)

### [Component/Area 2]
...

## Code References
- `path/to/file.py:123` - Description of what's there

## Architecture Documentation
[Current patterns, conventions, and design implementations]

## Historical Context (from thoughts/)
[Relevant insights with references]

## Related Research
[Links to other research documents]

## Open Questions
[Areas needing further investigation]
```

---

## Phase 4: Present and Follow Up

**Goal**: Share findings and handle follow-up questions

**Actions**:
1. Present a concise summary with key file references
2. Ask if the user has follow-up questions
3. For follow-ups: append to the same document under `## Follow-up Research [timestamp]`, update frontmatter `last_updated` and `last_updated_by`, add `last_updated_note`, spawn new agents as needed

**Output**: Findings presented, follow-ups handled

---

## Guidelines

- **Document, don't critique**: Describe what IS, not what SHOULD BE. No recommendations, no evaluations
- **Token efficiency**: Use agents for exploration, keep main context for synthesis. Don't re-read files agents already summarized
- **Parallel research**: Always spawn multiple agents concurrently for different aspects
- **File reading**: Always read mentioned files FULLY before spawning sub-tasks. Follow numbered phases in order
- **Path handling**: The `thoughts/searchable/` directory contains hard links. Remove only "searchable/" from paths (e.g., `thoughts/searchable/shared/x.md` -> `thoughts/shared/x.md`). Never change subdirectory names
- **Frontmatter**: Always include, keep consistent across documents, use snake_case for multi-word fields
- **Fresh research**: Always run fresh codebase research -- never rely solely on existing research documents
