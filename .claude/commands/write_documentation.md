---
description: Update README and docs to reflect current commands, agents, skills, and VSCode extension
---

# Update Documentation

Sync README.md, docs/bootandshoe.md, and vscode-extension/README.md with current state.

## Process

### Step 1: Gather Current State

Read all source files in parallel:

**Commands** (`bootandshoe/commands/*.md`):
- Extract filename (command name)
- Extract `description` from YAML frontmatter
- Note variants by suffix: `_nt` (no thoughts), `_generic` (minimal assumptions)

**Agents** (`bootandshoe/agents/*.md`):
- Extract filename (agent name)
- Extract `description` from YAML frontmatter
- Extract `tools` array from frontmatter if present

**Skills** (`bootandshoe/skills/*.md`):
- Extract filename (skill name)
- Extract `description` from YAML frontmatter

**VSCode Extension** (`vscode-extension/package.json`):
- Extract `displayName`, `description`, `version`
- Extract commands from `contributes.commands` array
- Extract keybindings from `contributes.keybindings` array
- Note any configuration options from `contributes.configuration`

### Step 2: Update README.md

The README uses these formats. Update each section to match current state:

**Commands Reference table:**
```markdown
| Command | Description | Workflow Position |
|---------|-------------|-------------------|
| `/create_plan` | {frontmatter description} | Start of workflow |
```

Group variants together. Workflow positions:
- `Start of workflow` - planning commands
- `After /create_plan` - iteration commands
- `After plan approval` - implementation
- `After implementation` - validation
- `Any time` - research and utility commands

**Agents table:**
```markdown
| Agent | Purpose |
|-------|---------|
| `codebase-locator` | {frontmatter description} |
```

**If skills exist**, add a Skills section after Agents:
```markdown
## Skills

| Skill | Purpose |
|-------|---------|
| `spec-metadata` | {frontmatter description} |
```

**Update the mermaid diagram** if workflow commands changed.

### Step 3: Update docs/bootandshoe.md

Uses similar table format but includes more detail:

**Commands table** includes Variants column:
```markdown
| Command | Description | Variants |
|---------|-------------|----------|
| `/create_plan` | {description} | `_nt`, `_generic` |
```

**Agents tables** include Tools column, split into "Codebase Agents" and "Other Agents":
```markdown
| Agent | Purpose | Tools |
|-------|---------|-------|
| `codebase-locator` | {description} | Grep, Glob, LS |
```

**Skills table:**
```markdown
| Skill | Purpose |
|-------|---------|
| `spec-metadata` | {description} |
```

### Step 4: Update README.md VSCode Extension Section

If not present, add a "VSCode Extension" section after Key Principles:

```markdown
## VSCode Extension

The [BootAndShoe Feedback Tags](vscode-extension/) extension provides IDE integration for the planning workflow.

**Features:**
- Add `<feedback>` tags to plan files for `/iterate_plan`
- Submit plans directly to Claude Code terminal
- Navigate between feedback items
- Feedback explorer sidebar

**Installation:** Available on [VS Marketplace](https://marketplace.visualstudio.com/items?itemName=nstrayer.bootandshoe-feedback-tags) and [Open VSX](https://open-vsx.org/extension/nstrayer/bootandshoe-feedback-tags)

**Key Commands:**
| Command | Shortcut | Description |
|---------|----------|-------------|
| Add Feedback | `Cmd+Shift+F` | Wrap selection in feedback tags |
| Add General Feedback | `Cmd+Shift+G` | Add file-level feedback |
| Submit to Terminal | `Cmd+Shift+T` | Run iterate_plan in Claude Code |
```

### Step 5: Update vscode-extension/README.md

Ensure the extension README reflects current state:
- Update features list based on `contributes.commands`
- Update keybindings table from `contributes.keybindings`
- List any configuration options from `contributes.configuration`
- Keep installation instructions current

### Step 6: Report Changes

List what was updated:
- Commands added/removed
- Agents added/removed
- Skills added/removed
- VSCode extension commands/keybindings changed
- Sections modified

## Important Notes

- **Match existing format** - don't change the overall structure, just update tables
- **Use frontmatter descriptions** - don't invent descriptions
- **Preserve non-table content** - installation instructions, workflow diagram, examples, key principles
- **Skip missing sections** - if no skills exist, don't add empty Skills section
- **VSCode extension version** - extract from package.json, don't guess
