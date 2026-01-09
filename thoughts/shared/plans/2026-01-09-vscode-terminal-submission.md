---
type: implementation-plan
title: "VSCode Terminal Submission"
status: in-progress
created: 2026-01-09
---

# VSCode Extension Terminal Submission Implementation Plan

## Overview

Add functionality to the VSCode extension to automatically submit plan documents with feedback to Claude Code terminals. Users can either send commands directly to active terminals or copy them to clipboard for manual pasting.

## Current State Analysis

<!--fb:4e89d025-->The VSCode extension currently:
- Manages feedback tags in markdown files using marker-based referencing
- Provides UI for adding/removing/navigating feedback
- Shows feedback in a tree view sidebar
- Does NOT have any terminal interaction capabilities
- Does NOT have clipboard operations<!--/fb:4e89d025-->

### Key Discoveries:
- Extension structure is in `vscode-extension/src/extension.ts:43-147`
- Commands registered with `vscode.commands.registerCommand()`
- No existing terminal or clipboard patterns in codebase
- Feedback markers stored with format `<!--fb:id-->text<!--/fb:id-->`
- Feedback comments stored in `<feedback-section>` at EOF

## Desired End State

After implementation, users will be able to:
1. Select a plan document with feedback in the editor
2. Choose to either:
   - Send `/bootandshoe:iterate_plan <path>` directly to an active Claude Code terminal
   - Copy the command to clipboard for manual pasting
3. Have the extension automatically construct the correct command with the current file path

## What We're NOT Doing

- NOT modifying the existing feedback tag system
- NOT changing how feedback is stored or displayed
- NOT creating new bootandshoe commands
- NOT implementing terminal detection for non-Claude Code terminals
- NOT parsing or modifying the feedback content before submission
- NOT implementing automatic terminal creation if none exists

## Implementation Approach

Add two new commands to the extension that construct the iterate_plan command with the current file path. One command sends directly to an active terminal, the other copies to clipboard. Both will be accessible via command palette, context menu, and keyboard shortcuts.

## Phase 1: Add Terminal Submission Command

### Overview
Implement the core functionality to send iterate_plan commands to active terminals.

### Changes Required:

#### 1. Extension Command Registration
**File**: `vscode-extension/src/extension.ts`
**Changes**: Add new command registrations in activate function

```typescript
// After line 104, add:
const submitToTerminal = vscode.commands.registerCommand(
    'feedbackTags.submitToTerminal',
    submitPlanToTerminal
);

const copyCommand = vscode.commands.registerCommand(
    'feedbackTags.copyIterateCommand',
    copyIterateCommand
);

// After line 105, update subscriptions:
context.subscriptions.push(addFeedback, addGeneralFeedback, removeFeedbackCmd, submitToTerminal, copyCommand);
```

#### 2. Terminal Submission Function
**File**: `vscode-extension/src/extension.ts`
**Changes**: Add new function after addGeneralFeedbackTag function

```typescript
/**
 * Submit the current plan file with feedback to Claude Code terminal
 */
async function submitPlanToTerminal() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    // Check if this is an implementation plan document
    if (!isImplementationPlan(editor.document)) {
        vscode.window.showWarningMessage('This command works with implementation plan documents only');
        return;
    }

    // Check if there are any feedback markers
    const markers = getFeedbackMarkers(editor.document);
    if (markers.length === 0) {
        const proceed = await vscode.window.showQuickPick(
            ['Continue anyway', 'Cancel'],
            { placeHolder: 'No feedback markers found. Submit anyway?' }
        );
        if (proceed !== 'Continue anyway') {
            return;
        }
    }

    // Get the file path
    const filePath = editor.document.fileName;

    // Construct the command
    const command = `/bootandshoe:iterate_plan ${filePath}`;

    // Find active terminal
    const terminal = vscode.window.activeTerminal;

    if (!terminal) {
        // No active terminal, offer to copy to clipboard instead
        const action = await vscode.window.showQuickPick(
            ['Copy to clipboard', 'Cancel'],
            { placeHolder: 'No active terminal found. Copy command to clipboard?' }
        );

        if (action === 'Copy to clipboard') {
            await vscode.env.clipboard.writeText(command);
            vscode.window.showInformationMessage(`Command copied to clipboard: ${command}`);
        }
        return;
    }

    // Send to terminal
    terminal.sendText(command);
    terminal.show();

    vscode.window.showInformationMessage(`Sent to terminal: ${command}`);
}
```

#### 3. Copy Command Function
**File**: `vscode-extension/src/extension.ts`
**Changes**: Add function after submitPlanToTerminal

```typescript
/**
 * Copy iterate_plan command to clipboard
 */
async function copyIterateCommand() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    // Check if this is an implementation plan document
    if (!isImplementationPlan(editor.document)) {
        vscode.window.showWarningMessage('This command works with implementation plan documents only');
        return;
    }

    // Get the file path
    const filePath = editor.document.fileName;

    // Construct the command
    const command = `/bootandshoe:iterate_plan ${filePath}`;

    // Copy to clipboard
    await vscode.env.clipboard.writeText(command);

    vscode.window.showInformationMessage(`Command copied to clipboard: ${command}`);
}
```

### Success Criteria:

#### Automated Verification:
- [x] Extension compiles without errors: `npm run compile`
- [x] Linting passes: `npm run lint`
- [x] Commands are registered in extension activation

#### Manual Verification:
- [ ] "Submit to Terminal" command appears in command palette
- [ ] "Copy Iterate Command" appears in command palette
- [ ] Command sends text to active terminal when present
- [ ] Command falls back to clipboard when no terminal active
- [ ] Clipboard copy function works independently
- [ ] Appropriate messages shown to user for each action

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Add UI Integration

### Overview
Add menu items and keyboard shortcuts for easy access to the new commands.

### Changes Required:

#### 1. Package.json Command Contributions
**File**: `vscode-extension/package.json`
**Changes**: Add new commands to the commands array after line 81

```json
{
  "command": "feedbackTags.submitToTerminal",
  "title": "Submit Plan to Claude Code Terminal",
  "category": "Feedback",
  "icon": "$(terminal)"
},
{
  "command": "feedbackTags.copyIterateCommand",
  "title": "Copy Iterate Plan Command",
  "category": "Feedback",
  "icon": "$(copy)"
}
```

#### 2. Context Key for Implementation Plans
**File**: `vscode-extension/src/extension.ts`
**Changes**: Update `updatePlanStatusBar` to also set a context key

```typescript
function updatePlanStatusBar() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        planStatusBarItem.hide();
        vscode.commands.executeCommand('setContext', 'feedbackTags.isImplementationPlan', false);
        return;
    }

    const isPlan = isImplementationPlan(editor.document);
    vscode.commands.executeCommand('setContext', 'feedbackTags.isImplementationPlan', isPlan);

    if (isPlan) {
        const metadata = getPlanMetadata(editor.document);
        const title = metadata?.title || 'Implementation Plan';
        const status = metadata?.status || 'unknown';
        planStatusBarItem.text = `$(checklist) ${title}`;
        planStatusBarItem.tooltip = `Implementation Plan\nStatus: ${status}`;
        planStatusBarItem.show();
    } else {
        planStatusBarItem.hide();
    }
}
```

#### 3. Context Menu Integration
**File**: `vscode-extension/package.json`
**Changes**: Add to editor/context menu after line 94

```json
{
  "command": "feedbackTags.submitToTerminal",
  "when": "feedbackTags.isImplementationPlan",
  "group": "2_feedback@1"
},
{
  "command": "feedbackTags.copyIterateCommand",
  "when": "feedbackTags.isImplementationPlan",
  "group": "2_feedback@2"
}
```

#### 4. Keyboard Shortcuts
**File**: `vscode-extension/package.json`
**Changes**: Add keybindings after line 134

```json
{
  "command": "feedbackTags.submitToTerminal",
  "key": "ctrl+shift+t",
  "mac": "cmd+shift+t",
  "when": "editorTextFocus && feedbackTags.isImplementationPlan"
},
{
  "command": "feedbackTags.copyIterateCommand",
  "key": "ctrl+shift+c",
  "mac": "cmd+shift+c",
  "when": "editorTextFocus && feedbackTags.isImplementationPlan"
}
```

### Success Criteria:

#### Automated Verification:
- [x] Extension compiles without errors: `npm run compile`
- [x] Package.json is valid JSON
- [x] No duplicate keyboard shortcuts

#### Manual Verification:
- [ ] Commands appear in right-click context menu for implementation plan documents
- [ ] Keyboard shortcuts work as expected
- [ ] Icons display correctly in command palette
- [ ] Menu items only show for implementation plan documents (with YAML frontmatter)

---

## Phase 3: Add Smart Terminal Detection

### Overview
Enhance the terminal submission to prefer Claude Code terminals and provide better user feedback.

### Changes Required:

#### 1. Terminal Detection Logic
**File**: `vscode-extension/src/extension.ts`
**Changes**: Update submitPlanToTerminal function to be smarter about terminal selection

```typescript
async function submitPlanToTerminal() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    // Check if this is an implementation plan document
    if (!isImplementationPlan(editor.document)) {
        vscode.window.showWarningMessage('This command works with implementation plan documents only');
        return;
    }

    // Check if there are any feedback markers
    const markers = getFeedbackMarkers(editor.document);
    if (markers.length === 0) {
        const proceed = await vscode.window.showQuickPick(
            ['Continue anyway', 'Cancel'],
            { placeHolder: 'No feedback markers found. Submit anyway?' }
        );
        if (proceed !== 'Continue anyway') {
            return;
        }
    }

    // Get the file path
    const filePath = editor.document.fileName;

    // Construct the command
    const command = `/bootandshoe:iterate_plan ${filePath}`;

    // Get all terminals
    const terminals = vscode.window.terminals;

    if (terminals.length === 0) {
        // No terminals at all
        const action = await vscode.window.showQuickPick(
            ['Copy to clipboard', 'Cancel'],
            { placeHolder: 'No terminals found. Copy command to clipboard?' }
        );

        if (action === 'Copy to clipboard') {
            await vscode.env.clipboard.writeText(command);
            vscode.window.showInformationMessage(`Command copied: ${command}`);
        }
        return;
    }

    let selectedTerminal: vscode.Terminal | undefined;

    if (terminals.length === 1) {
        // Only one terminal, use it
        selectedTerminal = terminals[0];
    } else {
        // Multiple terminals, let user choose
        const terminalItems = terminals.map((t, i) => ({
            label: t.name,
            description: vscode.window.activeTerminal === t ? '(active)' : '',
            terminal: t,
            index: i
        }));

        const selected = await vscode.window.showQuickPick(terminalItems, {
            placeHolder: 'Select terminal to send command to'
        });

        if (!selected) {
            return;
        }

        selectedTerminal = selected.terminal;
    }

    // Send to selected terminal
    selectedTerminal.sendText(command);
    selectedTerminal.show();

    vscode.window.showInformationMessage(`Sent to ${selectedTerminal.name}: ${command}`);
}
```

### Success Criteria:

#### Automated Verification:
- [x] Extension compiles without errors: `npm run compile`
- [x] TypeScript types are correct

#### Manual Verification:
- [ ] Single terminal scenario works without prompting
- [ ] Multiple terminals show selection dialog
- [ ] Selected terminal receives command correctly
- [ ] Terminal is brought to focus after sending
- [ ] Proper fallback to clipboard when no terminals exist

---

## Testing Strategy

### Unit Tests:
- Test command registration
- Test feedback marker detection
- Test command string construction

### Integration Tests:
- Test terminal interaction with mock terminals
- Test clipboard operations
- Test user dialog flows

### Manual Testing Steps:
1. Open a plan file with feedback markers
2. Test "Submit to Terminal" with active Claude Code terminal
3. Test "Copy Command" functionality
4. Test keyboard shortcuts (Cmd+Shift+T and Cmd+Shift+C on Mac)
5. Test right-click context menu
6. Test with multiple terminals open
7. Test with no terminals open (fallback to clipboard)
8. Test with non-plan files (should show warning about implementation plan documents)

## Performance Considerations

- Terminal detection is synchronous and fast
- Clipboard operations are async but lightweight
- No performance impact on existing functionality

## Migration Notes

No migration needed - this is purely additive functionality. Existing feedback tag system remains unchanged.

## References

- VSCode API Terminal documentation: https://code.visualstudio.com/api/references/vscode-api#Terminal
- VSCode API Clipboard documentation: https://code.visualstudio.com/api/references/vscode-api#env.clipboard
- Original feedback tags plan: `thoughts/shared/plans/2026-01-09-vscode-feedback-tags-extension.md`
- Iterate plan command: `bootandshoe/commands/iterate_plan.md`

---

---
<feedback-section>
<feedback id="4e89d025">
what is this?
</feedback>
</feedback-section>
