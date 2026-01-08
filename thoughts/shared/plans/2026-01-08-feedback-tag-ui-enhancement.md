# Feedback Tag UI Enhancement Implementation Plan

## Overview

Enhance the VSCode feedback tags extension to use a text-box-first interface with persistent highlighting and precise text targeting. The new system will use unique ID markers to reference text (resilient to line number changes) and store feedback comments at the end of the file.

## Current State Analysis

### Existing Implementation
- **Location**: `vscode-extension/src/extension.ts`
- **Current behavior**: Wraps selected text directly in `<feedback>` tags
- **Problem**: The feedback IS the wrapped text, which feels wrong - users want to write feedback ABOUT the text

### Key Discoveries from Research

1. **LLM Text Referencing Best Practices** (from Aider, Anthropic docs):
   - Line numbers are brittle - break when file changes
   - Search/replace blocks and unique markers are resilient
   - Position matters: feedback at end of file aligns with "Lost in the Middle" research
   - Consistency in format is more important than specific format choice

2. **VSCode Inline Widget Limitations**:
   - No true inline interactive widgets (buttons, inputs) in editor
   - Text decorations: Visual only, not clickable
   - CodeLens: Clickable but appears ABOVE lines
   - Inlay hints: Can be clickable, appears within code
   - Best approach: Use text decorations + hover providers + input box popup

## Desired End State

After implementation:

1. **User selects text** → triggers feedback command
2. **Input box appears** → user types their feedback comment
3. **Markers wrap the text** → `<!--fb:abc123-->selected text<!--/fb:abc123-->`
4. **Feedback stored at EOF** → `<feedback id="abc123">User's comment here</feedback>`
5. **Persistent highlighting** → marked text is visually distinct
6. **Hover shows feedback** → hovering over marked text shows the associated comment
7. **LLM can process** → clear structure pointing feedback to exact text location

### Tag Structure

```markdown
## Some Section

This is regular text. <!--fb:a1b2c3-->This specific phrase needs work<!--/fb:a1b2c3--> and continues here.

More content...

---
<feedback-section>
<feedback id="a1b2c3">
This phrase is unclear - consider rephrasing for better readability.
</feedback>
</feedback-section>
```

## What We're NOT Doing

- Building a webview panel for comment management
- Creating a sidebar tree view of comments
- Implementing collaborative/real-time features
- Supporting nested feedback markers
- Building a custom editor provider

## Implementation Approach

Three-phase approach:
1. **Phase 1**: New tag structure + input-first UI
2. **Phase 2**: Persistent decorations + hover integration
3. **Phase 3**: Navigation and management commands

---

## Phase 1: New Tag Structure and Input-First UI

### Overview
Replace the current "wrap selection in feedback" approach with a marker-based system where the user writes feedback about selected text.

### Changes Required:

#### 1. Update Extension Core Logic
**File**: `vscode-extension/src/extension.ts`
**Changes**: Complete rewrite of `addFeedbackTag` function

```typescript
import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';

// Generate short unique IDs for feedback markers
function generateFeedbackId(): string {
    return uuidv4().split('-')[0]; // First 8 chars of UUID
}

/**
 * Add feedback about selected text using marker-based referencing
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
        vscode.window.showWarningMessage('Please select text to add feedback about');
        return;
    }

    // Always prompt for feedback comment (this is the main change)
    const feedbackComment = await vscode.window.showInputBox({
        prompt: 'What feedback do you have about this text?',
        placeHolder: 'Describe what needs to be changed, clarified, or improved...',
        ignoreFocusOut: true,
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Please enter your feedback';
            }
            return null;
        }
    });

    if (!feedbackComment) {
        // User cancelled
        return;
    }

    const feedbackId = generateFeedbackId();
    const document = editor.document;
    const text = document.getText();

    // Create the marker-wrapped text
    const markerStart = `<!--fb:${feedbackId}-->`;
    const markerEnd = `<!--/fb:${feedbackId}-->`;
    const markedText = `${markerStart}${selectedText}${markerEnd}`;

    // Create the feedback entry for end of file
    const feedbackEntry = `<feedback id="${feedbackId}">\n${feedbackComment}\n</feedback>`;

    // Find or create the feedback section at end of file
    const feedbackSectionRegex = /<feedback-section>[\s\S]*<\/feedback-section>\s*$/;
    const existingSection = text.match(feedbackSectionRegex);

    await editor.edit(editBuilder => {
        // Replace selected text with marked version
        editBuilder.replace(selection, markedText);
    });

    // Get updated document text after first edit
    const updatedText = editor.document.getText();

    await editor.edit(editBuilder => {
        if (existingSection) {
            // Insert before closing </feedback-section> tag
            const closingTagIndex = updatedText.lastIndexOf('</feedback-section>');
            const insertPosition = document.positionAt(closingTagIndex);
            editBuilder.insert(insertPosition, `${feedbackEntry}\n`);
        } else {
            // Create new feedback section at end of file
            const lastLine = document.lineAt(document.lineCount - 1);
            const endPosition = lastLine.range.end;
            const prefix = updatedText.endsWith('\n\n') ? '' : updatedText.endsWith('\n') ? '\n' : '\n\n';
            const newSection = `${prefix}---\n<feedback-section>\n${feedbackEntry}\n</feedback-section>\n`;
            editBuilder.insert(endPosition, newSection);
        }
    });

    vscode.window.showInformationMessage(`Feedback added (id: ${feedbackId})`);
}
```

#### 2. Add UUID Dependency
**File**: `vscode-extension/package.json`
**Changes**: Add uuid package

```json
{
  "dependencies": {
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0",
    // ... existing devDependencies
  }
}
```

#### 3. Simplify Commands
**File**: `vscode-extension/package.json`
**Changes**: Remove the distinction between "Add Feedback Tag" and "Add Feedback Tag with Comment" since comment is now always required

```json
{
  "contributes": {
    "commands": [
      {
        "command": "feedbackTags.addFeedback",
        "title": "Add Feedback",
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
          "command": "feedbackTags.addGeneralFeedback",
          "when": "editorLangId == 'markdown'",
          "group": "1_modification@2"
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
  }
}
```

#### 4. Update Extension Activation
**File**: `vscode-extension/src/extension.ts`
**Changes**: Remove the duplicate command registration

```typescript
export function activate(context: vscode.ExtensionContext) {
    console.log('BootAndShoe Feedback Tags extension activated');

    // Register command for feedback (always with comment now)
    const addFeedback = vscode.commands.registerCommand(
        'feedbackTags.addFeedback',
        () => addFeedbackTag(true)
    );

    // Register command for general file feedback (no selection needed)
    const addGeneralFeedback = vscode.commands.registerCommand(
        'feedbackTags.addGeneralFeedback',
        addGeneralFeedbackTag
    );

    context.subscriptions.push(addFeedback, addGeneralFeedback);
}
```

### Success Criteria:

#### Automated Verification:
- [x] Extension compiles without errors: `cd vscode-extension && npm install && npm run compile`
- [x] TypeScript types are correct (no type errors)
- [x] Lint passes: `npm run lint`

#### Manual Verification:
- [x] Select text → trigger command → input box appears asking for feedback
- [x] After entering feedback, text is wrapped with `<!--fb:id-->...<!--/fb:id-->`
- [x] Feedback comment appears at end of file in `<feedback-section>`
- [x] Multiple feedback entries accumulate in the same section
- [x] Cancelling input box does nothing
- [x] Empty feedback is rejected with validation message

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding.

---

## Phase 2: Persistent Decorations and Hover Integration

### Overview
Add visual highlighting for marked text and show feedback content on hover.

### Changes Required:

#### 1. Create Decorations Module
**File**: `vscode-extension/src/decorations.ts`

```typescript
import * as vscode from 'vscode';

// Decoration type for feedback-marked text
const feedbackMarkerDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 223, 0, 0.15)',
    border: '1px dashed rgba(255, 193, 7, 0.5)',
    borderRadius: '2px',
    overviewRulerColor: '#ffc107',
    overviewRulerLane: vscode.OverviewRulerLane.Right
});

// Decoration type for the feedback section at end of file
const feedbackSectionDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(100, 149, 237, 0.1)',
    isWholeLine: true
});

interface FeedbackMarker {
    id: string;
    range: vscode.Range;
    comment: string | null;
}

/**
 * Parse feedback markers from document text
 */
function parseFeedbackMarkers(document: vscode.TextDocument): FeedbackMarker[] {
    const text = document.getText();
    const markers: FeedbackMarker[] = [];

    // Find all feedback markers: <!--fb:id-->...<!--/fb:id-->
    const markerRegex = /<!--fb:([a-f0-9]+)-->([\s\S]*?)<!--\/fb:\1-->/g;
    let match;

    while ((match = markerRegex.exec(text))) {
        const id = match[1];
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);

        // Find the associated feedback comment
        const feedbackRegex = new RegExp(`<feedback id="${id}">\\s*([\\s\\S]*?)\\s*</feedback>`);
        const feedbackMatch = text.match(feedbackRegex);
        const comment = feedbackMatch ? feedbackMatch[1].trim() : null;

        markers.push({
            id,
            range: new vscode.Range(startPos, endPos),
            comment
        });
    }

    return markers;
}

/**
 * Update decorations for the active editor
 */
export function updateDecorations(editor: vscode.TextEditor) {
    if (editor.document.languageId !== 'markdown') {
        return;
    }

    const markers = parseFeedbackMarkers(editor.document);

    const decorations: vscode.DecorationOptions[] = markers.map(marker => {
        const hoverContent = new vscode.MarkdownString();
        hoverContent.isTrusted = true;

        if (marker.comment) {
            hoverContent.appendMarkdown(`**Feedback** (id: \`${marker.id}\`)\n\n`);
            hoverContent.appendMarkdown(marker.comment);
            hoverContent.appendMarkdown(`\n\n---\n`);
            hoverContent.appendMarkdown(`[Remove feedback](command:feedbackTags.removeFeedback?${encodeURIComponent(JSON.stringify([marker.id]))})`);
        } else {
            hoverContent.appendMarkdown(`**Feedback marker** (id: \`${marker.id}\`)\n\n`);
            hoverContent.appendMarkdown(`_No comment found for this marker_`);
        }

        return {
            range: marker.range,
            hoverMessage: hoverContent
        };
    });

    editor.setDecorations(feedbackMarkerDecorationType, decorations);

    // Highlight the feedback section
    const text = editor.document.getText();
    const sectionMatch = text.match(/<feedback-section>[\s\S]*<\/feedback-section>/);
    if (sectionMatch) {
        const startIndex = text.indexOf(sectionMatch[0]);
        const endIndex = startIndex + sectionMatch[0].length;
        const sectionRange = new vscode.Range(
            editor.document.positionAt(startIndex),
            editor.document.positionAt(endIndex)
        );
        editor.setDecorations(feedbackSectionDecorationType, [{ range: sectionRange }]);
    }
}

/**
 * Register decoration listeners
 */
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

#### 2. Add Remove Feedback Command
**File**: `vscode-extension/src/extension.ts`
**Changes**: Add command to remove feedback by ID

```typescript
/**
 * Remove a feedback marker and its associated comment
 */
async function removeFeedback(feedbackId: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const text = document.getText();

    // Find and remove the marker
    const markerRegex = new RegExp(`<!--fb:${feedbackId}-->([\\s\\S]*?)<!--\\/fb:${feedbackId}-->`, 'g');
    const markerMatch = markerRegex.exec(text);

    if (!markerMatch) {
        vscode.window.showWarningMessage(`Feedback marker ${feedbackId} not found`);
        return;
    }

    // Find and remove the feedback entry
    const feedbackRegex = new RegExp(`<feedback id="${feedbackId}">[\\s\\S]*?</feedback>\\n?`, 'g');

    await editor.edit(editBuilder => {
        // Replace marker with just the content
        const markerStart = document.positionAt(markerMatch.index);
        const markerEnd = document.positionAt(markerMatch.index + markerMatch[0].length);
        editBuilder.replace(new vscode.Range(markerStart, markerEnd), markerMatch[1]);
    });

    // Get updated text and remove feedback entry
    const updatedText = editor.document.getText();
    const feedbackMatch = feedbackRegex.exec(updatedText);

    if (feedbackMatch) {
        await editor.edit(editBuilder => {
            const feedbackStart = document.positionAt(feedbackMatch.index);
            const feedbackEnd = document.positionAt(feedbackMatch.index + feedbackMatch[0].length);
            editBuilder.delete(new vscode.Range(feedbackStart, feedbackEnd));
        });
    }

    // Check if feedback section is now empty
    const finalText = editor.document.getText();
    const emptySectionRegex = /<feedback-section>\s*<\/feedback-section>/;
    const emptyMatch = finalText.match(emptySectionRegex);

    if (emptyMatch) {
        // Remove the entire empty section including the separator
        await editor.edit(editBuilder => {
            const sectionWithSeparator = /\n---\n<feedback-section>\s*<\/feedback-section>\n?/;
            const fullMatch = finalText.match(sectionWithSeparator);
            if (fullMatch) {
                const start = document.positionAt(finalText.indexOf(fullMatch[0]));
                const end = document.positionAt(finalText.indexOf(fullMatch[0]) + fullMatch[0].length);
                editBuilder.delete(new vscode.Range(start, end));
            }
        });
    }

    vscode.window.showInformationMessage(`Feedback ${feedbackId} removed`);
}

// In activate():
const removeFeedbackCmd = vscode.commands.registerCommand(
    'feedbackTags.removeFeedback',
    (feedbackId: string) => removeFeedback(feedbackId)
);
context.subscriptions.push(removeFeedbackCmd);
```

#### 3. Update Extension Entry Point
**File**: `vscode-extension/src/extension.ts`
**Changes**: Import and initialize decorations

```typescript
import { registerDecorationListeners, updateDecorations } from './decorations';

export function activate(context: vscode.ExtensionContext) {
    // ... existing command registrations ...

    // Register decoration listeners for visual highlighting
    registerDecorationListeners(context);
}
```

### Success Criteria:

#### Automated Verification:
- [x] All files compile without TypeScript errors
- [x] Lint passes

#### Manual Verification:
- [x] Marked text shows yellow/gold background highlight
- [x] Hovering over marked text shows feedback comment in popup
- [x] Hover popup includes "Remove feedback" link
- [x] Clicking "Remove feedback" removes both marker and comment
- [x] Feedback section at end of file has subtle blue background
- [x] Decorations persist when switching tabs and returning
- [x] Decorations update immediately when adding new feedback
- [x] Overview ruler (scrollbar) shows markers for feedback locations

**Implementation Note**: After completing this phase, pause for manual testing before proceeding.

---

## Phase 3: Navigation and Management Commands

### Overview
Add commands to navigate between feedback markers and manage all feedback in a file.

### Changes Required:

#### 1. Create Navigation Module
**File**: `vscode-extension/src/navigation.ts`

```typescript
import * as vscode from 'vscode';

interface FeedbackLocation {
    id: string;
    markerRange: vscode.Range;
    feedbackRange: vscode.Range | null;
}

/**
 * Find all feedback locations in the document
 */
function findFeedbackLocations(document: vscode.TextDocument): FeedbackLocation[] {
    const text = document.getText();
    const locations: FeedbackLocation[] = [];

    const markerRegex = /<!--fb:([a-f0-9]+)-->[\s\S]*?<!--\/fb:\1-->/g;
    let match;

    while ((match = markerRegex.exec(text))) {
        const id = match[1];
        const markerStart = document.positionAt(match.index);
        const markerEnd = document.positionAt(match.index + match[0].length);

        // Find associated feedback entry
        const feedbackRegex = new RegExp(`<feedback id="${id}">[\\s\\S]*?</feedback>`);
        const feedbackMatch = text.match(feedbackRegex);
        let feedbackRange: vscode.Range | null = null;

        if (feedbackMatch) {
            const feedbackIndex = text.indexOf(feedbackMatch[0]);
            feedbackRange = new vscode.Range(
                document.positionAt(feedbackIndex),
                document.positionAt(feedbackIndex + feedbackMatch[0].length)
            );
        }

        locations.push({
            id,
            markerRange: new vscode.Range(markerStart, markerEnd),
            feedbackRange
        });
    }

    return locations;
}

/**
 * Navigate to next/previous feedback marker
 */
function navigateToFeedback(direction: 'next' | 'previous') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const locations = findFeedbackLocations(editor.document);

    if (locations.length === 0) {
        vscode.window.showInformationMessage('No feedback markers found in this file');
        return;
    }

    const currentPos = editor.selection.active;
    let targetLocation: FeedbackLocation | undefined;

    if (direction === 'next') {
        targetLocation = locations.find(loc => loc.markerRange.start.isAfter(currentPos))
            || locations[0]; // Wrap to first
    } else {
        targetLocation = [...locations].reverse().find(loc => loc.markerRange.end.isBefore(currentPos))
            || locations[locations.length - 1]; // Wrap to last
    }

    if (targetLocation) {
        editor.selection = new vscode.Selection(targetLocation.markerRange.start, targetLocation.markerRange.start);
        editor.revealRange(targetLocation.markerRange, vscode.TextEditorRevealType.InCenter);
    }
}

/**
 * Show all feedback in a quick pick for navigation
 */
async function showFeedbackList() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const text = editor.document.getText();
    const locations = findFeedbackLocations(editor.document);

    if (locations.length === 0) {
        vscode.window.showInformationMessage('No feedback markers found in this file');
        return;
    }

    // Build quick pick items
    const items = locations.map(loc => {
        // Get the marked text content
        const markedText = editor.document.getText(loc.markerRange);
        const contentMatch = markedText.match(/<!--fb:[a-f0-9]+-->([\s\S]*?)<!--\/fb:[a-f0-9]+-->/);
        const content = contentMatch ? contentMatch[1].trim() : 'Unknown';

        // Get the feedback comment
        const feedbackRegex = new RegExp(`<feedback id="${loc.id}">\\s*([\\s\\S]*?)\\s*</feedback>`);
        const feedbackMatch = text.match(feedbackRegex);
        const comment = feedbackMatch ? feedbackMatch[1].trim() : 'No comment';

        // Truncate for display
        const displayContent = content.length > 40 ? content.substring(0, 40) + '...' : content;
        const displayComment = comment.length > 60 ? comment.substring(0, 60) + '...' : comment;

        return {
            label: `$(comment) ${displayContent}`,
            description: `Line ${loc.markerRange.start.line + 1}`,
            detail: displayComment,
            location: loc
        };
    });

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select feedback to navigate to',
        matchOnDescription: true,
        matchOnDetail: true
    });

    if (selected) {
        editor.selection = new vscode.Selection(selected.location.markerRange.start, selected.location.markerRange.start);
        editor.revealRange(selected.location.markerRange, vscode.TextEditorRevealType.InCenter);
    }
}

/**
 * Register navigation commands
 */
export function registerNavigationCommands(context: vscode.ExtensionContext) {
    const nextCmd = vscode.commands.registerCommand('feedbackTags.nextFeedback', () => {
        navigateToFeedback('next');
    });

    const prevCmd = vscode.commands.registerCommand('feedbackTags.previousFeedback', () => {
        navigateToFeedback('previous');
    });

    const listCmd = vscode.commands.registerCommand('feedbackTags.listFeedback', showFeedbackList);

    context.subscriptions.push(nextCmd, prevCmd, listCmd);
}
```

#### 2. Update Package.json with New Commands
**File**: `vscode-extension/package.json`
**Changes**: Add navigation commands and keybindings

```json
{
  "contributes": {
    "commands": [
      // ... existing commands ...
      {
        "command": "feedbackTags.nextFeedback",
        "title": "Go to Next Feedback",
        "category": "Feedback"
      },
      {
        "command": "feedbackTags.previousFeedback",
        "title": "Go to Previous Feedback",
        "category": "Feedback"
      },
      {
        "command": "feedbackTags.listFeedback",
        "title": "List All Feedback",
        "category": "Feedback"
      },
      {
        "command": "feedbackTags.removeFeedback",
        "title": "Remove Feedback",
        "category": "Feedback"
      }
    ],
    "keybindings": [
      // ... existing keybindings ...
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
      },
      {
        "command": "feedbackTags.listFeedback",
        "key": "ctrl+shift+l",
        "mac": "cmd+shift+l",
        "when": "editorTextFocus && editorLangId == 'markdown'"
      }
    ]
  }
}
```

#### 3. Update Extension Entry Point
**File**: `vscode-extension/src/extension.ts`
**Changes**: Import and register navigation

```typescript
import { registerNavigationCommands } from './navigation';

export function activate(context: vscode.ExtensionContext) {
    // ... existing code ...

    // Register navigation commands
    registerNavigationCommands(context);
}
```

### Success Criteria:

#### Automated Verification:
- [x] All files compile without errors
- [x] Lint passes

#### Manual Verification:
- [x] `Cmd+]` navigates to next feedback marker
- [x] `Cmd+[` navigates to previous feedback marker
- [x] Navigation wraps around (last → first, first → last)
- [x] `Cmd+Shift+L` shows list of all feedback
- [x] Quick pick shows marked text preview and comment
- [x] Selecting item from list navigates to that marker
- [x] "No feedback found" message when file has no markers

---

## Phase 4: Update BootAndShoe Commands (Optional)

### Overview
Update the bootandshoe iterate_plan and review_plan commands to understand the new marker-based feedback format.

### Changes Required:

#### 1. Update iterate_plan.md
**File**: `bootandshoe/commands/iterate_plan.md`
**Changes**: Add section explaining the new feedback format

Add to the feedback processing section:
```markdown
### Marker-Based Feedback Format

The VSCode extension uses a marker-based format for precise text references:

**In the document:**
```
<!--fb:a1b2c3-->marked text that needs feedback<!--/fb:a1b2c3-->
```

**At end of file:**
```
<feedback-section>
<feedback id="a1b2c3">
The actual feedback comment about the marked text
</feedback>
</feedback-section>
```

**How to process:**
1. Find all `<feedback>` entries in the `<feedback-section>`
2. For each feedback, locate the corresponding marker by ID
3. Understand the context by reading the marked text
4. Address the feedback and update the plan
5. Remove the marker and feedback entry when resolved

**To remove resolved feedback:**
- Delete the `<!--fb:id-->` and `<!--/fb:id-->` markers (keep the text between them)
- Delete the corresponding `<feedback id="id">...</feedback>` entry
```

### Success Criteria:

#### Manual Verification:
- [ ] `/iterate_plan` correctly identifies and processes marker-based feedback
- [ ] Resolved feedback markers are removed appropriately
- [ ] Plan updates address the specific marked text

---

## Testing Strategy

### Unit Tests:
- Test feedback ID generation (unique, correct format)
- Test marker regex parsing (handles edge cases, nested content)
- Test feedback section creation/update logic

### Integration Tests:
- Test full workflow: select → comment → verify markers
- Test decoration updates on document changes
- Test navigation between multiple markers

### Manual Testing Steps:
1. Open `vscode-extension/` in VS Code and press F5
2. Open a markdown file
3. Select text and press `Cmd+Shift+F`
4. Enter feedback comment
5. Verify marker wraps selected text
6. Verify feedback appears at end of file
7. Verify highlighted text and hover
8. Test navigation with `Cmd+]` and `Cmd+[`
9. Test removal via hover link
10. Test with multiple feedback markers

## Performance Considerations

- Decoration updates debounced by VSCode
- Regex parsing is efficient for typical document sizes
- Feedback section at EOF means quick append operations
- UUID generation is fast (using v4)

## Migration Notes

- **Breaking change**: Old `<feedback>content</feedback>` format no longer used
- Existing feedback tags will NOT be highlighted (different format)
- Users should manually migrate or recreate feedback
- Consider adding a migration command in future if needed

## References

- Current implementation: `vscode-extension/src/extension.ts`
- Original plan: `thoughts/shared/plans/2026-01-09-vscode-feedback-tags-extension.md`
- VSCode Decorations API: https://code.visualstudio.com/api/references/vscode-api#TextEditorDecorationType
- LLM Text Referencing Research: Aider edit formats, "Lost in the Middle" paper
