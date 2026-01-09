# Add Clipboard Copy Functionality

## Overview

Add clipboard copy commands to the VSCode extension that allow users to easily copy plan paths and formatted commands (like `/bootandshoe:iterate_plan /path/to/plan.md`) for pasting into Claude.

## Current State Analysis

The VSCode extension provides feedback tag management but has no clipboard functionality. Users must manually select and copy file paths when they want to use bootandshoe commands in Claude.

### Key Discoveries:
- No clipboard commands exist in `vscode-extension/package.json:45-81`
- VSCode provides clipboard API at `vscode.env.clipboard.writeText(text)`
- Tree view items have `contextValue = 'feedbackItem'` for context menus (`feedbackTreeProvider.ts:42`)
- Extension activates on markdown files (`package.json:30-32`)

## Desired End State

After implementation:
1. Right-click on plan files shows "Copy Iterate Command" option
2. Command palette includes copy commands for plan workflows
3. Keyboard shortcut available for quick copying
4. Tree view context menu includes "Copy Feedback" option
5. Users can paste ready-to-use commands into Claude

### Verification:
- Copying a command from VSCode pastes correctly into Claude
- Commands work from explorer context menu, command palette, and keyboard

## What We're NOT Doing

- Adding a custom clipboard history
- Copying multiple items at once
- Creating keybindings that conflict with system defaults
- Adding copy to non-plan markdown files

## Implementation Approach

Single phase to add all clipboard commands, menus, and keybindings.

---

## Phase 1: Add Clipboard Commands

### Overview
Add commands to copy plan paths and formatted bootandshoe commands to the clipboard.

### Changes Required:

#### 1. Add Copy Commands to package.json
**File**: `vscode-extension/package.json`
**Changes**: Add new command definitions

In the `contributes.commands` array (after line 81):

```json
{
  "command": "feedbackTags.copyIterateCommand",
  "title": "Copy Iterate Plan Command",
  "category": "Feedback",
  "icon": "$(copy)"
},
{
  "command": "feedbackTags.copyPlanPath",
  "title": "Copy Plan Path",
  "category": "Feedback",
  "icon": "$(files)"
},
{
  "command": "feedbackTags.copyFeedbackSummary",
  "title": "Copy All Feedback Summary",
  "category": "Feedback"
}
```

#### 2. Add Explorer Context Menu Items
**File**: `vscode-extension/package.json`
**Changes**: Add context menu entries for plan files

In the `contributes.menus` section, add new `explorer/context` entries:

```json
"explorer/context": [
  {
    "command": "feedbackTags.copyIterateCommand",
    "when": "resourcePath =~ /thoughts\\/shared\\/plans\\/.*\\.md$/",
    "group": "7_modification@1"
  },
  {
    "command": "feedbackTags.copyPlanPath",
    "when": "resourcePath =~ /thoughts\\/shared\\/plans\\/.*\\.md$/",
    "group": "7_modification@2"
  }
]
```

#### 3. Add Editor Context Menu Items
**File**: `vscode-extension/package.json`
**Changes**: Add to editor context menu when in plan file

In the `contributes.menus.editor/context` array:

```json
{
  "command": "feedbackTags.copyIterateCommand",
  "when": "editorLangId == 'markdown' && resourcePath =~ /thoughts\\/shared\\/plans\\//",
  "group": "1_modification@3"
},
{
  "command": "feedbackTags.copyFeedbackSummary",
  "when": "editorLangId == 'markdown'",
  "group": "1_modification@4"
}
```

#### 4. Add Keyboard Shortcuts
**File**: `vscode-extension/package.json`
**Changes**: Add keybindings for copy commands

In the `contributes.keybindings` array:

```json
{
  "command": "feedbackTags.copyIterateCommand",
  "key": "ctrl+shift+c",
  "mac": "cmd+shift+c",
  "when": "editorTextFocus && editorLangId == 'markdown' && resourcePath =~ /thoughts\\/shared\\/plans\\// "
},
{
  "command": "feedbackTags.copyFeedbackSummary",
  "key": "ctrl+alt+c",
  "mac": "cmd+alt+c",
  "when": "editorTextFocus && editorLangId == 'markdown'"
}
```

#### 5. Implement Copy Commands in extension.ts
**File**: `vscode-extension/src/extension.ts`
**Changes**: Register command handlers

Add after existing command registrations (around line 105):

```typescript
// Copy Iterate Plan Command
context.subscriptions.push(
    vscode.commands.registerCommand('feedbackTags.copyIterateCommand', async (uri?: vscode.Uri) => {
        // Get file path from uri parameter or active editor
        let filePath: string;

        if (uri) {
            filePath = uri.fsPath;
        } else {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No file open');
                return;
            }
            filePath = editor.document.uri.fsPath;
        }

        // Format the command
        const command = `/bootandshoe:iterate_plan ${filePath}`;

        await vscode.env.clipboard.writeText(command);
        vscode.window.showInformationMessage(`Copied: ${command}`);
    })
);

// Copy Plan Path
context.subscriptions.push(
    vscode.commands.registerCommand('feedbackTags.copyPlanPath', async (uri?: vscode.Uri) => {
        let filePath: string;

        if (uri) {
            filePath = uri.fsPath;
        } else {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No file open');
                return;
            }
            filePath = editor.document.uri.fsPath;
        }

        await vscode.env.clipboard.writeText(filePath);
        vscode.window.showInformationMessage(`Copied path: ${filePath}`);
    })
);

// Copy Feedback Summary
context.subscriptions.push(
    vscode.commands.registerCommand('feedbackTags.copyFeedbackSummary', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No file open');
            return;
        }

        const markers = parseFeedbackMarkers(editor.document);
        if (markers.length === 0) {
            vscode.window.showInformationMessage('No feedback in this file');
            return;
        }

        // Format feedback summary
        const summary = markers.map((m, i) =>
            `${i + 1}. Line ${m.markerRange.start.line + 1}: "${m.content.substring(0, 50)}${m.content.length > 50 ? '...' : ''}"` +
            (m.comment ? `\n   Feedback: ${m.comment}` : '')
        ).join('\n\n');

        const header = `Feedback Summary for ${editor.document.fileName.split('/').pop()}:\n\n`;

        await vscode.env.clipboard.writeText(header + summary);
        vscode.window.showInformationMessage(`Copied ${markers.length} feedback items`);
    })
);
```

#### 6. Add Tree View Copy Context Menu
**File**: `vscode-extension/package.json`
**Changes**: Add copy option to feedback tree items

In `contributes.menus.view/item/context`:

```json
{
  "command": "feedbackTags.copyFeedbackItem",
  "when": "view == feedbackExplorer && viewItem == feedbackItem",
  "group": "inline@2"
}
```

Add command definition:

```json
{
  "command": "feedbackTags.copyFeedbackItem",
  "title": "Copy Feedback",
  "category": "Feedback",
  "icon": "$(copy)"
}
```

#### 7. Implement Tree View Copy
**File**: `vscode-extension/src/extension.ts`
**Changes**: Add handler for copying feedback from tree view

```typescript
// Copy Feedback Item
context.subscriptions.push(
    vscode.commands.registerCommand('feedbackTags.copyFeedbackItem', async (item: FeedbackItem) => {
        if (!item || !item.marker) {
            vscode.window.showWarningMessage('No feedback item selected');
            return;
        }

        const marker = item.marker;
        const text = `Feedback on: "${marker.content}"` +
            (marker.comment ? `\nComment: ${marker.comment}` : '');

        await vscode.env.clipboard.writeText(text);
        vscode.window.showInformationMessage('Feedback copied to clipboard');
    })
);
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles: `cd vscode-extension && npm run compile`
- [ ] No linting errors: `cd vscode-extension && npm run lint`
- [ ] Package.json is valid: `cd vscode-extension && node -e "require('./package.json')"`
- [ ] New commands registered: `grep "copyIterateCommand" vscode-extension/package.json`

#### Manual Verification:
- [ ] Right-click plan file in explorer shows "Copy Iterate Plan Command"
- [ ] Clicking copies formatted command to clipboard
- [ ] Pasting in Claude works correctly
- [ ] "Copy Plan Path" copies just the path
- [ ] "Copy All Feedback Summary" formats and copies all feedback
- [ ] Tree view copy button works
- [ ] Keyboard shortcuts work in plan files
- [ ] Info messages confirm what was copied

---

## Testing Strategy

### Unit Tests:
- Command formatting produces expected output
- Handles files with special characters in path
- Graceful handling when no file is open

### Integration Tests:
1. Open plan file → Copy Iterate Command → Paste → Verify format
2. Right-click in explorer → Copy → Paste → Verify
3. Copy feedback summary → Verify all items included

### Manual Testing Steps:
1. Open a plan file in the editor
2. Press Cmd+Shift+C → Verify command copied
3. Right-click plan in explorer → "Copy Iterate Plan Command"
4. Paste into Claude session → Verify command works
5. Add feedback to file → "Copy All Feedback Summary"
6. Verify summary includes all feedback items
7. Right-click feedback in tree view → Copy
8. Verify single feedback item copied correctly

## Performance Considerations

- Clipboard operations are asynchronous but fast
- No file system scanning required
- Commands work from URI parameter without reading file

## References

- VSCode Clipboard API: `vscode.env.clipboard.writeText()`
- Extension source: `vscode-extension/src/extension.ts`
- Package manifest: `vscode-extension/package.json`
- Original requirement: `TODOs.md:5`