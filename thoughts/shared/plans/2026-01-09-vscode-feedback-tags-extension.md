# VS Code Feedback Tags Extension Implementation Plan

## Overview

Create a VS Code extension that enables easy insertion of `<feedback>` and `<general-feedback>` tags in markdown files for the bootandshoe iterate plan workflow. The extension will provide a Google Docs-style commenting experience where users can highlight text and add feedback through context menus or keyboard shortcuts. The extension will be housed in this repository alongside the bootandshoe skills.

## Current State Analysis

### Existing Feedback System
The bootandshoe plugin uses simple `<feedback>` tags in markdown files:
- **Format**: `<feedback>content here</feedback>`
- **Processing**: Commands like `iterate_plan.md:126-143` and `review_plan.md:162-198` parse these tags
- **Purpose**: Distinguish specific actionable feedback from general discussion
- **Location**: Used primarily in plan files under `thoughts/shared/plans/`

### VS Code Extension Capabilities
Based on research, VS Code provides all necessary APIs:
- Context menu integration via `contributes.menus`
- Text selection handling via `editor.selection`
- Text insertion/replacement via `editor.edit()`
- Markdown-specific activation via `onLanguage:markdown`
- Visual decorations for highlighting existing tags

### Repository Structure
Current structure of this repo:
```
claude-plugins/
├── bootandshoe/
│   ├── agents/
│   └── commands/
├── docs/
└── thoughts/
```

## Desired End State

After implementation, users will be able to:
1. Select text in a markdown file and right-click to add `<feedback>` tags
2. Add file-level `<general-feedback>` tags via command palette or context menu
3. Optionally enter additional feedback context in a quick input box
4. See existing feedback tags visually highlighted in the editor
5. Navigate between feedback tags quickly
6. Have all feedback processed by updated bootandshoe commands

The extension will live in this repo at `vscode-extension/`.

## What We're NOT Doing

- Publishing to the VS Code Marketplace (initially - can be added later)
- Building a collaborative comment system with real-time sync
- Creating a webview panel for comment management
- Storing feedback in a separate database

## Feasibility Assessment

**Highly Feasible** - All required capabilities are well-supported by VS Code APIs:

### Technical Requirements ✅
- **Context Menu Integration**: Fully supported via `editor/context` contribution point
- **Text Selection**: Standard API via `editor.selection`
- **Text Manipulation**: Simple with `editor.edit()` and `editBuilder.replace()`
- **Markdown Targeting**: Easy with `when` clauses (`editorLangId == 'markdown'`)
- **Visual Feedback**: Decorations API for highlighting existing tags

### Implementation Complexity: **Low to Medium**
- Core functionality: ~150-200 lines of TypeScript
- No external dependencies required
- Standard VS Code extension patterns apply
- Testing framework well-established

### User Experience Benefits
1. **Faster Feedback**: No manual typing of tags
2. **Consistent Format**: Ensures proper tag structure
3. **Visual Clarity**: Highlights make feedback stand out
4. **Keyboard Accessible**: Can assign shortcuts for power users
5. **Context Preservation**: Selected text becomes the feedback focus
6. **File-Level Feedback**: Quick way to add overall thoughts

## Implementation Approach

Four-phase approach:
1. **Phase 1**: Basic tag insertion + general feedback (MVP)
2. **Phase 2**: Update bootandshoe commands to process `<general-feedback>`
3. **Phase 3**: Visual decorations and navigation
4. **Phase 4**: Advanced features (optional enhancements)

---

## Phase 1: VS Code Extension MVP

### Overview
Implement core functionality to insert `<feedback>` and `<general-feedback>` tags via context menu and command palette.

### Changes Required:

#### 1. Project Setup (Monorepo Structure)
**Files to Create**:
```
claude-plugins/
├── bootandshoe/           # Existing
├── docs/                  # Existing
├── thoughts/              # Existing
└── vscode-extension/      # NEW
    ├── src/
    │   └── extension.ts   # Main extension logic
    ├── package.json       # Extension manifest
    ├── tsconfig.json      # TypeScript config
    ├── .vscodeignore      # Exclude files from package
    └── README.md          # User documentation
```

#### 2. Extension Manifest
**File**: `vscode-extension/package.json`
```json
{
  "name": "bootandshoe-feedback-tags",
  "displayName": "BootAndShoe Feedback Tags",
  "description": "Add feedback tags for bootandshoe iterate plan workflow",
  "version": "1.0.0",
  "publisher": "bootandshoe",
  "engines": {
    "vscode": "^1.74.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onLanguage:markdown"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "feedbackTags.addFeedback",
        "title": "Add Feedback Tag",
        "category": "Feedback"
      },
      {
        "command": "feedbackTags.addFeedbackWithComment",
        "title": "Add Feedback Tag with Comment",
        "category": "Feedback"
      },
      {
        "command": "feedbackTags.addGeneralFeedback",
        "title": "Add General Feedback for File",
        "category": "Feedback"
      }
    ],
    "menus": {
      "editor/context": [
        {
          "command": "feedbackTags.addFeedback",
          "when": "editorLangId == 'markdown' && editorHasSelection",
          "group": "1_modification@1"
        },
        {
          "command": "feedbackTags.addFeedbackWithComment",
          "when": "editorLangId == 'markdown' && editorHasSelection",
          "group": "1_modification@2"
        },
        {
          "command": "feedbackTags.addGeneralFeedback",
          "when": "editorLangId == 'markdown'",
          "group": "1_modification@3"
        }
      ]
    },
    "keybindings": [
      {
        "command": "feedbackTags.addFeedback",
        "key": "ctrl+shift+f",
        "mac": "cmd+shift+f",
        "when": "editorTextFocus && editorLangId == 'markdown' && editorHasSelection"
      },
      {
        "command": "feedbackTags.addGeneralFeedback",
        "key": "ctrl+shift+g",
        "mac": "cmd+shift+g",
        "when": "editorTextFocus && editorLangId == 'markdown'"
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "lint": "eslint src --ext ts"
  },
  "devDependencies": {
    "@types/vscode": "^1.74.0",
    "@types/node": "16.x",
    "typescript": "^5.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0"
  }
}
```

#### 3. TypeScript Configuration
**File**: `vscode-extension/tsconfig.json`
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "exclude": ["node_modules", ".vscode-test"]
}
```

#### 4. Core Extension Logic
**File**: `vscode-extension/src/extension.ts`
```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('BootAndShoe Feedback Tags extension activated');

    // Register command for simple feedback tag (selection required)
    const addFeedback = vscode.commands.registerCommand(
        'feedbackTags.addFeedback',
        () => addFeedbackTag(false)
    );

    // Register command for feedback tag with comment (selection required)
    const addFeedbackWithComment = vscode.commands.registerCommand(
        'feedbackTags.addFeedbackWithComment',
        () => addFeedbackTag(true)
    );

    // Register command for general file feedback (no selection needed)
    const addGeneralFeedback = vscode.commands.registerCommand(
        'feedbackTags.addGeneralFeedback',
        addGeneralFeedbackTag
    );

    context.subscriptions.push(addFeedback, addFeedbackWithComment, addGeneralFeedback);
}

/**
 * Add a <feedback> tag around selected text
 */
async function addFeedbackTag(withComment: boolean) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    if (!selectedText) {
        vscode.window.showWarningMessage('Please select text to add feedback');
        return;
    }

    let wrappedText: string;

    if (withComment) {
        const comment = await vscode.window.showInputBox({
            prompt: 'Enter your feedback comment (optional)',
            placeHolder: 'Describe what needs to be changed...',
            ignoreFocusOut: true
        });

        if (comment === undefined) {
            // User cancelled
            return;
        }

        if (comment) {
            wrappedText = `<feedback>\n${selectedText}\n<!-- ${comment} -->\n</feedback>`;
        } else {
            wrappedText = `<feedback>\n${selectedText}\n</feedback>`;
        }
    } else {
        // Simple inline tag for short selections, multiline for longer
        if (selectedText.includes('\n') || selectedText.length > 80) {
            wrappedText = `<feedback>\n${selectedText}\n</feedback>`;
        } else {
            wrappedText = `<feedback>${selectedText}</feedback>`;
        }
    }

    await editor.edit(editBuilder => {
        editBuilder.replace(selection, wrappedText);
    });

    vscode.window.showInformationMessage('Feedback tag added');
}

/**
 * Add a <general-feedback> tag at the end of the file for file-level feedback
 */
async function addGeneralFeedbackTag() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    const feedback = await vscode.window.showInputBox({
        prompt: 'Enter general feedback for this file',
        placeHolder: 'Overall thoughts, concerns, or suggestions...',
        ignoreFocusOut: true
    });

    if (!feedback) {
        // User cancelled or entered empty string
        return;
    }

    const document = editor.document;
    const tag = `<general-feedback>\n${feedback}\n</general-feedback>`;

    // Check if there's already a general-feedback tag at the end
    const text = document.getText();
    const existingMatch = text.match(/<general-feedback>[\s\S]*<\/general-feedback>\s*$/);

    if (existingMatch) {
        // Append to existing general feedback
        const result = await vscode.window.showQuickPick(
            ['Add new tag', 'Append to existing', 'Cancel'],
            { placeHolder: 'A general-feedback tag already exists at the end of the file' }
        );

        if (result === 'Cancel' || !result) {
            return;
        }

        if (result === 'Append to existing') {
            // Find the closing tag and insert before it
            const closingTagIndex = text.lastIndexOf('</general-feedback>');
            const insertPosition = document.positionAt(closingTagIndex);

            await editor.edit(editBuilder => {
                editBuilder.insert(insertPosition, `\n${feedback}\n`);
            });

            vscode.window.showInformationMessage('Feedback appended to existing tag');
            return;
        }
    }

    // Insert at the very end of the file
    const lastLine = document.lineAt(document.lineCount - 1);
    const endPosition = lastLine.range.end;

    // Add spacing before the tag
    const prefix = text.endsWith('\n\n') ? '' : text.endsWith('\n') ? '\n' : '\n\n';

    await editor.edit(editBuilder => {
        editBuilder.insert(endPosition, `${prefix}${tag}\n`);
    });

    vscode.window.showInformationMessage('General feedback added to end of file');
}

export function deactivate() {}
```

#### 5. VS Code Ignore File
**File**: `vscode-extension/.vscodeignore`
```
.vscode/**
.vscode-test/**
src/**
.gitignore
tsconfig.json
**/*.map
**/*.ts
```

#### 6. Extension README
**File**: `vscode-extension/README.md`
```markdown
# BootAndShoe Feedback Tags

VS Code extension for adding feedback tags in markdown files, designed for the bootandshoe iterate plan workflow.

## Features

### Add Feedback Tag (Selection)
- Select text in a markdown file
- Right-click → "Add Feedback Tag" or use `Cmd+Shift+F` (Mac) / `Ctrl+Shift+F` (Windows/Linux)
- Wraps selected text in `<feedback>` tags

### Add Feedback with Comment
- Select text → Right-click → "Add Feedback Tag with Comment"
- Enter an optional comment explaining the feedback
- Creates structured feedback with embedded comment

### Add General Feedback (File-Level)
- Right-click anywhere → "Add General Feedback for File" or use `Cmd+Shift+G`
- Enter overall feedback for the entire file
- Adds `<general-feedback>` tag at the end of the file

## Usage with BootAndShoe

These tags are processed by bootandshoe commands:
- `/iterate_plan` - Processes feedback when updating plans
- `/review_plan` - Collects and organizes feedback during reviews

## Installation

1. Clone this repository
2. Open `vscode-extension/` in VS Code
3. Run `npm install`
4. Press F5 to launch Extension Development Host
5. Test with any markdown file

## Building

```bash
cd vscode-extension
npm run compile
```
```

### Success Criteria:

#### Automated Verification:
- [x] Extension compiles without errors: `cd vscode-extension && npm run compile`
- [x] Package.json has valid VS Code extension structure
- [x] TypeScript types are correct
- [x] Lint passes: `npm run lint`

#### Manual Verification:
- [ ] Extension activates when opening markdown files
- [ ] Right-click menu shows "Add Feedback Tag" when text is selected
- [ ] Right-click menu shows "Add General Feedback for File" always (in markdown)
- [ ] Simple tag insertion wraps selected text correctly
- [ ] Tag with comment prompts for input and formats correctly
- [ ] General feedback prompts for input and adds to end of file
- [ ] Keyboard shortcuts work (Cmd+Shift+F, Cmd+Shift+G)
- [ ] Cancelling input aborts the operation
- [ ] Existing general-feedback tag detection works

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding.

---

## Phase 2: Update BootAndShoe Commands

### Overview
Update `iterate_plan.md` and `review_plan.md` to recognize and process `<general-feedback>` tags in addition to existing `<feedback>` tags.

### Changes Required:

#### 1. Update iterate_plan.md
**File**: `bootandshoe/commands/iterate_plan.md`
**Changes**: Update the "Feedback Tag Processing" section to include general feedback

Add after line 143 (existing feedback tag processing section):
```markdown
### General Feedback Tag Processing

In addition to inline `<feedback>` tags, also check for `<general-feedback>` tags at the end of the file:

```
<general-feedback>
Overall, this plan looks good but I'm concerned about the migration strategy.
The phasing seems aggressive - consider adding a rollback phase.
</general-feedback>
```

**How to process general feedback:**

1. **Check for the tag** at the end of the file (typically after all phases)
2. **Treat as high-level feedback** - these are overarching concerns that may affect multiple phases
3. **Address before specific feedback** - general concerns often set context for specific changes
4. **Acknowledge explicitly**:
   ```
   I see your general feedback about the plan:
   - Concern about migration strategy
   - Suggestion to add rollback phase

   Let me address these overarching points first, then handle specific feedback tags.
   ```

5. **Remove or update the tag** after addressing - either delete the tag if fully resolved, or update it with remaining concerns
```

#### 2. Update iterate_plan_nt.md
**File**: `bootandshoe/commands/iterate_plan_nt.md`
**Changes**: Mirror the same general feedback processing additions

#### 3. Update review_plan.md
**File**: `bootandshoe/commands/review_plan.md`
**Changes**: Add general feedback collection to the review process

Add to Step 3 (Feedback Summary), update the template:
```markdown
## Review Summary

**General Feedback** (file-level):
<general-feedback>
[Overall thoughts collected during review]
</general-feedback>

**Specific Feedback**:

### Scope
- [Feedback item 1]
...
```

Also add guidance for prompting general feedback at the end of the review:
```markdown
### Step 2.5: General Feedback

After section-by-section review, prompt for overall thoughts:

```
## Overall Assessment

Before I summarize, do you have any general feedback about the plan as a whole?

Consider:
- Overall complexity and timeline
- Architectural direction
- Risk tolerance
- Anything that doesn't fit in a specific section

You can provide this as a `<general-feedback>` tag or just describe it.
```
```

#### 4. Update review_plan_nt.md
**File**: `bootandshoe/commands/review_plan_nt.md`
**Changes**: Mirror the same general feedback additions

### Success Criteria:

#### Automated Verification:
- [ ] `iterate_plan.md` contains "General Feedback Tag Processing" section
- [ ] `iterate_plan_nt.md` contains "General Feedback Tag Processing" section
- [ ] `review_plan.md` contains general feedback collection guidance
- [ ] `review_plan_nt.md` contains general feedback collection guidance
- [ ] All modified files have valid markdown syntax

#### Manual Verification:
- [ ] Run `/iterate_plan` on a file with `<general-feedback>` tag - verify it's processed
- [ ] Run `/review_plan` - verify it prompts for general feedback
- [ ] Verify general feedback appears in review summary

**Implementation Note**: After completing this phase, pause for manual testing before proceeding.

---

## Phase 3: Visual Decorations and Navigation

### Overview
Add visual highlighting for existing feedback tags and navigation between tags.

### Changes Required:

#### 1. Add Decoration Provider
**File**: `vscode-extension/src/decorations.ts`
```typescript
import * as vscode from 'vscode';

// Decoration type for inline <feedback> tags
const feedbackDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 223, 0, 0.2)',
    border: '1px solid #ffd700',
    borderRadius: '3px',
    overviewRulerColor: '#ffd700',
    overviewRulerLane: vscode.OverviewRulerLane.Right
});

// Decoration type for <general-feedback> tags (different color)
const generalFeedbackDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(100, 149, 237, 0.2)',
    border: '1px solid #6495ed',
    borderRadius: '3px',
    overviewRulerColor: '#6495ed',
    overviewRulerLane: vscode.OverviewRulerLane.Right
});

export function updateDecorations(editor: vscode.TextEditor) {
    if (editor.document.languageId !== 'markdown') {
        return;
    }

    const text = editor.document.getText();

    // Find <feedback> tags
    const feedbackDecorations: vscode.DecorationOptions[] = [];
    const feedbackRegex = /<feedback>[\s\S]*?<\/feedback>/g;
    let match;

    while ((match = feedbackRegex.exec(text))) {
        const startPos = editor.document.positionAt(match.index);
        const endPos = editor.document.positionAt(match.index + match[0].length);
        feedbackDecorations.push({
            range: new vscode.Range(startPos, endPos),
            hoverMessage: new vscode.MarkdownString('**Inline Feedback**\n\nThis text has been marked for feedback.')
        });
    }

    // Find <general-feedback> tags
    const generalDecorations: vscode.DecorationOptions[] = [];
    const generalRegex = /<general-feedback>[\s\S]*?<\/general-feedback>/g;

    while ((match = generalRegex.exec(text))) {
        const startPos = editor.document.positionAt(match.index);
        const endPos = editor.document.positionAt(match.index + match[0].length);
        generalDecorations.push({
            range: new vscode.Range(startPos, endPos),
            hoverMessage: new vscode.MarkdownString('**General Feedback**\n\nFile-level feedback for the entire document.')
        });
    }

    editor.setDecorations(feedbackDecorationType, feedbackDecorations);
    editor.setDecorations(generalFeedbackDecorationType, generalDecorations);
}

export function registerDecorationListeners(context: vscode.ExtensionContext) {
    // Update decorations when active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            updateDecorations(editor);
        }
    }, null, context.subscriptions);

    // Update decorations when document changes
    vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            updateDecorations(editor);
        }
    }, null, context.subscriptions);

    // Initial decoration
    if (vscode.window.activeTextEditor) {
        updateDecorations(vscode.window.activeTextEditor);
    }
}
```

#### 2. Update extension.ts to use decorations
**File**: `vscode-extension/src/extension.ts`
**Changes**: Import and initialize decoration listeners

Add to activate():
```typescript
import { registerDecorationListeners } from './decorations';

export function activate(context: vscode.ExtensionContext) {
    // ... existing command registrations ...

    // Register decoration listeners
    registerDecorationListeners(context);
}
```

#### 3. Navigation Commands
**File**: `vscode-extension/src/navigation.ts`
```typescript
import * as vscode from 'vscode';

export function registerNavigationCommands(context: vscode.ExtensionContext) {
    const nextFeedback = vscode.commands.registerCommand('feedbackTags.nextFeedback', () => {
        navigateToFeedback('next');
    });

    const prevFeedback = vscode.commands.registerCommand('feedbackTags.previousFeedback', () => {
        navigateToFeedback('previous');
    });

    context.subscriptions.push(nextFeedback, prevFeedback);
}

function navigateToFeedback(direction: 'next' | 'previous') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const text = editor.document.getText();
    const combinedRegex = /<(feedback|general-feedback)>[\s\S]*?<\/\1>/g;
    const ranges: vscode.Range[] = [];

    let match;
    while ((match = combinedRegex.exec(text))) {
        const startPos = editor.document.positionAt(match.index);
        const endPos = editor.document.positionAt(match.index + match[0].length);
        ranges.push(new vscode.Range(startPos, endPos));
    }

    if (ranges.length === 0) {
        vscode.window.showInformationMessage('No feedback tags found in this file');
        return;
    }

    const currentPos = editor.selection.active;
    let targetRange: vscode.Range | undefined;

    if (direction === 'next') {
        targetRange = ranges.find(r => r.start.isAfter(currentPos)) || ranges[0];
    } else {
        targetRange = [...ranges].reverse().find(r => r.end.isBefore(currentPos)) || ranges[ranges.length - 1];
    }

    if (targetRange) {
        editor.selection = new vscode.Selection(targetRange.start, targetRange.start);
        editor.revealRange(targetRange, vscode.TextEditorRevealType.InCenter);
    }
}
```

#### 4. Add navigation keybindings
**File**: `vscode-extension/package.json`
**Changes**: Add to keybindings array:
```json
{
  "command": "feedbackTags.nextFeedback",
  "key": "ctrl+]",
  "mac": "cmd+]",
  "when": "editorTextFocus && editorLangId == 'markdown'"
},
{
  "command": "feedbackTags.previousFeedback",
  "key": "ctrl+[",
  "mac": "cmd+[",
  "when": "editorTextFocus && editorLangId == 'markdown'"
}
```

### Success Criteria:

#### Automated Verification:
- [ ] All new files compile without errors
- [ ] No TypeScript type errors

#### Manual Verification:
- [ ] `<feedback>` tags highlighted with yellow background
- [ ] `<general-feedback>` tags highlighted with blue background
- [ ] Decorations appear in overview ruler (scrollbar)
- [ ] Hover shows appropriate message for each tag type
- [ ] `Cmd+]` navigates to next feedback tag
- [ ] `Cmd+[` navigates to previous feedback tag
- [ ] Decorations update as tags are added/removed

---

## Phase 4: Advanced Features (Optional)

### Overview
Add power-user features based on actual usage patterns.

### Potential Features:

#### 1. Status Bar Item
Show count of feedback tags in current file:
```typescript
const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right, 100
);
statusBarItem.command = 'feedbackTags.nextFeedback';

function updateStatusBar(editor: vscode.TextEditor) {
    const text = editor.document.getText();
    const feedbackCount = (text.match(/<feedback>/g) || []).length;
    const generalCount = (text.match(/<general-feedback>/g) || []).length;

    if (feedbackCount + generalCount > 0) {
        statusBarItem.text = `$(comment) ${feedbackCount + generalCount} feedback`;
        statusBarItem.show();
    } else {
        statusBarItem.hide();
    }
}
```

#### 2. Remove Feedback Tag Command
Quick way to strip tags but keep content:
```typescript
vscode.commands.registerCommand('feedbackTags.removeFeedback', async () => {
    // Find the feedback tag the cursor is inside
    // Replace <feedback>content</feedback> with just content
});
```

#### 3. Export All Feedback
Collect all feedback into a summary:
```typescript
vscode.commands.registerCommand('feedbackTags.exportFeedback', async () => {
    // Extract all <feedback> and <general-feedback> tags
    // Format as a summary document
    // Copy to clipboard or create new file
});
```

### Success Criteria:
- [ ] Status bar shows feedback count
- [ ] Remove command works correctly
- [ ] Export creates useful summary

---

## Testing Strategy

### Unit Tests:
- Test tag wrapping logic with various inputs (single line, multiline, special characters)
- Test regex matching for finding existing tags
- Test navigation logic for finding next/previous tags

### Integration Tests:
- Test command execution in actual VS Code environment
- Test decoration updates on document changes
- Test persistence across editor sessions

### Manual Testing Steps:
1. Open `vscode-extension/` in VS Code and press F5 to launch development host
2. Open a markdown file from `thoughts/shared/plans/`
3. Select text and right-click to add feedback tag
4. Use Cmd+Shift+G to add general feedback
5. Verify both tag types are highlighted correctly
6. Use Cmd+] and Cmd+[ to navigate between tags
7. Run `/iterate_plan` with the tagged file - verify feedback is processed
8. Run `/review_plan` - verify general feedback prompt appears

## Performance Considerations

- Regex parsing for decorations uses efficient non-greedy matching
- Decorations update on document change (debounced by VS Code)
- Large files with many feedback tags should still perform well
- Status bar updates are lightweight

## Migration Notes

- Extension works immediately with existing `<feedback>` tags
- New `<general-feedback>` tag is additive - no breaking changes
- Commands updated to recognize both tag types
- Users can install extension optionally - manual tag typing still works

## Repository Integration

### Root package.json (optional)
Could add workspace script to root `package.json`:
```json
{
  "scripts": {
    "extension:build": "cd vscode-extension && npm run compile",
    "extension:watch": "cd vscode-extension && npm run watch"
  }
}
```

### Documentation Updates
**File**: `docs/bootandshoe.md`
Add section about the VS Code extension and feedback tags.

## References

- Current implementation: `bootandshoe/commands/iterate_plan.md:126-143`
- Review command: `bootandshoe/commands/review_plan.md:162-198`
- VS Code Extension API: https://code.visualstudio.com/api
- Extension Samples: https://github.com/microsoft/vscode-extension-samples