---
description: Create detailed implementation plans through interactive research and iteration
model: opus
---

# Implementation Plan (Plan Mode)

You are tasked with creating detailed implementation plans through an interactive, iterative process. You should be skeptical, thorough, and work collaboratively with the user to produce high-quality technical specifications.

**This command runs within plan mode.** Write the plan to the plan file designated by plan mode (the path provided in the plan mode system message). When finished, call `ExitPlanMode` so the user can review and approve in VS Code.

## Initial Response

When this command is invoked:

1. **Check if parameters were provided**:
   - If a file path or task description was provided as a parameter, skip the default message
   - Immediately read any provided files FULLY
   - Begin the research process

2. **If no parameters provided**, respond with:
```
I'll help you create a detailed implementation plan. Let me start by understanding what we're building.

Please provide:
1. The task description (or reference to a requirements file)
2. Any relevant context, constraints, or specific requirements
3. Links to related research or previous implementations

I'll analyze this information and work with you to create a comprehensive plan.

Tip: You can also invoke this command with a task file directly: `/create_plan path/to/requirements.md`
For deeper analysis, try: `/create_plan think deeply about path/to/requirements.md`
```

Then wait for the user's input.

## Token-Efficient Research

Planning requires deep understanding, but that understanding should come from **agent reconnaissance**, not reading every file into main context:

- **Read directly**: User-provided files (requirements, PRDs, task descriptions) and files you'll cite in the plan
- **Use agents for**: Codebase exploration, finding patterns, understanding existing implementations
- **Trust agent summaries**: Agents return file:line references and explanations -- don't re-read files just to confirm what they reported
- **Only verify directly**: When agent findings seem surprising or when you need exact code snippets for the plan

## Process Steps

### Phase 1: Understanding - Context Gathering & Initial Analysis

1. **Read user-provided input files immediately and FULLY**:
   - Task description files, requirements documents, PRDs
   - **IMPORTANT**: Use the Read tool WITHOUT limit/offset parameters to read entire files
   - These are your task definition -- you need them in main context
   - For codebase exploration, use agents instead (see step 2)

### PRD Detection and Handling

After reading mentioned files, check if any are PRD (Product Requirements Document) documents:

**Detection criteria** (check in order):
1. YAML frontmatter contains `type: prd`
2. File path contains `/prds/` directory
3. Filename matches pattern `*-prd.md`

**If PRD detected**:
- Acknowledge: "I see this is a PRD document. I'll extract the requirements and focus my research on technical implementation."
- Extract and map PRD sections to plan sections:
  - **Goals & Objectives** -> Plan Overview + Desired End State
  - **User Stories & Use Cases** -> Guide phase breakdown
  - **Functional Requirements** -> Technical implementation details
  - **Acceptance Criteria** -> Plan success criteria (manual verification)
  - **Technical Considerations** -> Implementation approach
  - **Out of Scope** -> Plan's "What We're NOT Doing"
- **Skip questions about**: User needs, feature goals, scope boundaries (already documented in PRD)
- **Focus research and questions on**: Technical implementation details, code patterns to follow, architecture decisions, integration points

2. **Spawn initial research tasks to gather context**:
   Before asking the user any questions, use specialized agents to research in parallel:

   - Use the **bootandshoe:codebase-locator** agent to find all files related to the task
   - Use the **bootandshoe:codebase-analyzer** agent to understand how the current implementation works
   - If relevant, use the **bootandshoe:thoughts-locator** agent to find any existing thoughts documents about this feature

   These agents will:
   - Find relevant source files, configs, and tests
   - Trace data flow and key functions
   - Return detailed explanations with file:line references

3. **Synthesize agent findings**:
   - Trust agent summaries and file:line references -- don't re-read everything into main context
   - Only read specific files when you need to verify surprising findings or capture exact code patterns
   - Agents are designed to return the information you need; re-reading their findings wastes tokens

4. **Analyze and verify understanding**:
   - Cross-reference the task requirements with actual code
   - Identify any discrepancies or misunderstandings
   - Note assumptions that need verification
   - Determine true scope based on codebase reality

5. **Present informed understanding and focused questions**:
   ```
   Based on the task and my research of the codebase, I understand we need to [accurate summary].

   I've found that:
   - [Current implementation detail with file:line reference]
   - [Relevant pattern or constraint discovered]
   - [Potential complexity or edge case identified]

   Questions that my research couldn't answer:
   - [Specific technical question that requires human judgment]
   - [Business logic clarification]
   - [Design preference that affects implementation]
   ```

   Only ask questions that you genuinely cannot answer through code investigation.

### Phase 2: Design - Research & Discovery

After getting initial clarifications:

1. **If the user corrects any misunderstanding**:
   - DO NOT just accept the correction
   - Spawn new research tasks to verify the correct information
   - Read the specific files/directories they mention
   - Only proceed once you've verified the facts yourself

2. **Spawn parallel sub-tasks for comprehensive research**:
   - Create multiple Task agents to research different aspects concurrently
   - Use the right agent for each type of research:

   **For deeper investigation:**
   - **bootandshoe:codebase-locator** - To find more specific files (e.g., "find all files that handle [specific component]")
   - **bootandshoe:codebase-analyzer** - To understand implementation details (e.g., "analyze how [system] works")
   - **bootandshoe:codebase-pattern-finder** - To find similar features we can model after

   **For historical context:**
   - **bootandshoe:thoughts-locator** - To find any research, plans, or decisions about this area
   - **bootandshoe:thoughts-analyzer** - To extract key insights from the most relevant documents

   Each agent knows how to:
   - Find the right files and code patterns
   - Identify conventions and patterns to follow
   - Look for integration points and dependencies
   - Return specific file:line references
   - Find tests and examples

3. **Wait for ALL sub-tasks to complete** before proceeding

### Proactive Web Research Suggestions

During research and planning, proactively suggest web research when encountering unfamiliar technologies, best practices uncertainty, version-specific information needs, or security considerations.

Use AskUserQuestion to offer research:
```
AskUserQuestion:
Question: "Should I research [specific topic] online?"
Header: "Research"
Options:
- "Yes, research this" - Search for current best practices
- "No, proceed" - Existing knowledge is sufficient
- "Research something else" - Will specify different topic
```

**When to trigger this question:**

1. **Unfamiliar Technologies**: If the task involves technologies, libraries, or frameworks you're not confident about

2. **Best Practices Uncertainty**: When you're unsure about the recommended approach

3. **Version-Specific Information**: When implementation might depend on specific versions

4. **Security Considerations**: When the feature has security implications

**After user responds:**
- If "Yes, research this": Spawn bootandshoe:web-search-researcher agent with focused query
- If "No, proceed": Continue with existing knowledge
- If "Research something else": Ask what topic they'd like researched, then spawn agent

**Example**:
```
I see we're implementing webhook signature verification. I have general knowledge
about this, but webhook security practices evolve.
```
Then use AskUserQuestion with:
- Question: "Should I research webhook signature verification best practices online?"
- Header: "Research"
- Options as above

4. **Present findings and design options**:
   ```
   Based on my research, here's what I found:

   **Current State:**
   - [Key discovery about existing code]
   - [Pattern or convention to follow]

   **Design Options:**
   1. [Option A] - [pros/cons]
   2. [Option B] - [pros/cons]
   ```

   Then use AskUserQuestion for design selection:
   ```
   AskUserQuestion:
   Question: "Which technical approach should we use?"
   Header: "Approach"
   Options: [Dynamically generated based on research - use 2-4 options]
   - "[Option A name]" - [Brief advantage]
   - "[Option B name]" - [Brief advantage]
   - "Discuss trade-offs" - Need more information before deciding
   - "Hybrid approach" - Combine elements from multiple options
   ```

   If "Discuss trade-offs" selected:
   - Provide detailed comparison of options
   - Re-ask the question after discussion

   If "Hybrid approach" selected:
   - Ask: "Which elements from each approach would you like to combine?"
   - Collect freeform response
   - Synthesize hybrid approach

### Phase 3: Review - Plan Structure Development

Once aligned on approach:

1. **Read only the files you'll reference in the plan**:
   - Read files where you need to cite exact code patterns, APIs, or line numbers
   - Use `bootandshoe:codebase-pattern-finder` for files you haven't examined yet
   - Don't read files just for general context -- agent summaries cover that

2. **Create initial plan outline**:
   ```
   Here's my proposed plan structure:

   ## Overview
   [1-2 sentence summary]

   ## Implementation Phases:
   1. [Phase name] - [what it accomplishes]
   2. [Phase name] - [what it accomplishes]
   3. [Phase name] - [what it accomplishes]
   ```

3. **Use AskUserQuestion for structure approval**:
   ```
   AskUserQuestion:
   Question: "Does this phase structure work?"
   Header: "Structure"
   Options:
   - "Yes, proceed" - Write detailed plan with this structure
   - "Adjust order" - Phases should be reordered
   - "Split phases" - Some phases are too large
   - "Merge phases" - Some phases should be combined
   ```

   If adjustment needed:
   - Ask: "Which phases need adjustment and how?"
   - Collect freeform response
   - Re-present the updated structure
   - Ask again until approved

### Phase 4: Final Plan - Detailed Plan Writing

After structure approval:

1. **Write the plan** to the plan file designated by plan mode (the path provided in the plan mode system message).
2. **Use this template structure**:

````markdown
---
type: implementation-plan
title: "[Feature/Task Name]"
created: YYYY-MM-DD
status: draft
---

# [Feature/Task Name] Implementation Plan

## Overview

[Brief description of what we're implementing and why]

## Current State Analysis

[What exists now, what's missing, key constraints discovered]

## Desired End State

[A Specification of the desired end state after this plan is complete, and how to verify it]

### Key Discoveries:
- [Important finding with file:line reference]
- [Pattern to follow]
- [Constraint to work within]

## What We're NOT Doing

[Explicitly list out-of-scope items to prevent scope creep]

## Implementation Approach

[High-level strategy and reasoning]

## Phase 1: [Descriptive Name]

### Overview
[What this phase accomplishes]

### Changes Required:

#### 1. [Component/File Group]
**File**: `path/to/file.ext`
**Changes**: [Summary of changes]

```[language]
// Specific code to add/modify
```

### Success Criteria:

#### Automated Verification:
- [ ] Migration applies cleanly: `make migrate`
- [ ] Unit tests pass: `make test-component`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `make lint`
- [ ] Integration tests pass: `make test-integration`

#### Manual Verification:
- [ ] Feature works as expected when tested via UI
- [ ] Performance is acceptable under load
- [ ] Edge case handling verified manually
- [ ] No regressions in related features

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: [Descriptive Name]

[Similar structure with both automated and manual success criteria...]

---

## Testing Strategy

### Unit Tests:
- [What to test]
- [Key edge cases]

### Integration Tests:
- [End-to-end scenarios]

### Manual Testing Steps:
1. [Specific step to verify feature]
2. [Another verification step]
3. [Edge case to test manually]

## Performance Considerations

[Any performance implications or optimizations needed]

## Migration Notes

[If applicable, how to handle existing data/systems]

## References

- Original requirements: `path/to/requirements.md`
- Related research: `thoughts/shared/research/[relevant].md`
- Similar implementation: `[file:line]`
````

### Phase 5: Exit Plan Mode

After writing the plan:

1. **Call `ExitPlanMode`** so the user can review and approve the plan in VS Code.

   The user will see the plan file and can:
   - Approve the plan to proceed to implementation
   - Add comments or feedback for iteration
   - Reject and provide alternative direction

## Important Guidelines

1. **Be Skeptical**:
   - Question vague requirements
   - Identify potential issues early
   - Ask "why" and "what about"
   - Don't assume - verify with code

2. **Be Interactive**:
   - Don't write the full plan in one shot
   - Get buy-in at each major step
   - Allow course corrections
   - Work collaboratively

3. **Be Thorough**:
   - Read user-provided input files completely; use agents for codebase research
   - Research actual code patterns using parallel sub-tasks
   - Include specific file paths and line numbers
   - Write measurable success criteria with clear automated vs manual distinction
   - Automated steps should use `make` whenever possible - for example `make -C bootandshoe-wui check` instead of `cd bootandshoe-wui && bun run fmt`

4. **Be Practical**:
   - Focus on incremental, testable changes
   - Consider migration and rollback
   - Think about edge cases
   - Include "what we're NOT doing"

5. **No Open Questions in Final Plan**:
   - If you encounter open questions during planning, STOP
   - Research or ask for clarification immediately
   - Do NOT write the plan with unresolved questions
   - The implementation plan must be complete and actionable
   - Every decision must be made before finalizing the plan

## Success Criteria Guidelines

**Always separate success criteria into two categories:**

1. **Automated Verification** (can be run by execution agents):
   - Commands that can be run: `make test`, `npm run lint`, etc.
   - Specific files that should exist
   - Code compilation/type checking
   - Automated test suites

2. **Manual Verification** (requires human testing):
   - UI/UX functionality
   - Performance under real conditions
   - Edge cases that are hard to automate
   - User acceptance criteria

**Format example:**
```markdown
### Success Criteria:

#### Automated Verification:
- [ ] Database migration runs successfully: `make migrate`
- [ ] All unit tests pass: `go test ./...`
- [ ] No linting errors: `golangci-lint run`
- [ ] API endpoint returns 200: `curl localhost:8080/api/new-endpoint`

#### Manual Verification:
- [ ] New feature appears correctly in the UI
- [ ] Performance is acceptable with 1000+ items
- [ ] Error messages are user-friendly
- [ ] Feature works correctly on mobile devices
```

## Common Patterns

### For Database Changes:
- Start with schema/migration
- Add store methods
- Update business logic
- Expose via API
- Update clients

### For New Features:
- Research existing patterns first
- Start with data model
- Build backend logic
- Add API endpoints
- Implement UI last

### For Refactoring:
- Document current behavior
- Plan incremental changes
- Maintain backwards compatibility
- Include migration strategy

## Sub-task Spawning Best Practices

When spawning research sub-tasks:

1. **Spawn multiple tasks in parallel** for efficiency
2. **Each task should be focused** on a specific area
3. **Provide detailed instructions** including:
   - Exactly what to search for
   - Which directories to focus on
   - What information to extract
   - Expected output format
4. **Be EXTREMELY specific about directories**:
   - Include the full path context in your prompts
5. **Specify read-only tools** to use
6. **Request specific file:line references** in responses
7. **Wait for all tasks to complete** before synthesizing
8. **Verify sub-task results**:
   - If a sub-task returns unexpected results, spawn follow-up tasks
   - Cross-check findings against the actual codebase
   - Don't accept results that seem incorrect

Example of spawning multiple tasks:
```python
# Spawn these tasks concurrently:
tasks = [
    Task("Research database schema", db_research_prompt),
    Task("Find API patterns", api_research_prompt),
    Task("Investigate UI components", ui_research_prompt),
    Task("Check test patterns", test_research_prompt)
]
```

## Example Interaction Flow

```
User: /create_plan
Assistant: I'll help you create a detailed implementation plan...

User: We need to add parent-child tracking for Claude sub-tasks. See requirements.md
Assistant: Let me read that requirements file completely first...

[Reads file fully]

Based on the requirements, I understand we need to track parent-child relationships for sub-task events. Before I start planning, I have some questions...

[Interactive process continues...]
[Plan written to plan mode file]
[ExitPlanMode called]
```

### Example: Planning from a PRD

```
User: /create_plan thoughts/shared/prds/2026-01-12-notebook-assistant.md
Assistant: Let me read that file...

[Reads file, detects `type: prd` in frontmatter]

I see this is a PRD document. I'll extract the requirements and focus my research on technical implementation.

**From the PRD:**
- Goals: Replace quickpick with custom notebook assistant menu
- Users: Data scientists, notebook users
- Requirements: Show settings, display context being sent to assistant
- Out of Scope: Full notebook editing capabilities

Let me research the codebase for implementation details...

[Spawns bootandshoe:codebase-locator and bootandshoe:codebase-analyzer agents]

Based on my research, I found:
- Current quickpick implementation at `src/notebooks/quickpick.ts:45`
- Menu patterns in `src/ui/menus/` we can follow
- Context assembly in `src/assistant/context.ts:120`

Technical questions:
- Should the menu be a VS Code TreeView or WebView panel?
- How should we handle state persistence for settings?

[Planning continues focused on technical implementation...]
[Plan written to plan mode file]
[ExitPlanMode called]
```
