# Feedback System Enhancements Implementation Plan

## Overview

Enhance the feedback system by making the documentation more generic (not VSCode-specific), adding user-friendly deletion capabilities, and creating a view pane that shows feedback for the currently active document.

## Current State Analysis

The feedback system currently uses a marker-based architecture where HTML comment markers (`<!--fb:id-->`) wrap text selections and reference corresponding feedback entries stored in a `<feedback-section>` at the end of files. The documentation explicitly attributes this format to VSCode, even though the format itself is platform-agnostic.

### Key Discoveries:
- Documentation describes format as "Marker-Based Format (VSCode Extension)" in `/Users/nicholasstrayer/dev/claude-skills/claude-plugins/bootandshoe/commands/iterate_plan.md:138`
- Feedback deletion exists but requires manual ID entry (`removeFeedback()` at `vscode-extension/src/extension.ts:123`)
- No view pane exists - only a QuickPick list for single-file navigation (`navigation.ts:83`)
- Extension operates only on active editor - no workspace-wide aggregation

## Desired End State

After implementation:
1. Command documentation describes the marker-based format generically without VSCode attribution
2. Users can delete feedback items through an intuitive UI (no manual ID entry)
3. A TreeView sidebar shows feedback for the active document with navigation and deletion capabilities

## What We're NOT Doing

- Changing the actual feedback format (HTML comments and XML tags remain)
- Modifying how feedback is generated or processed by bootandshoe commands
- Adding feedback to non-markdown files
- Creating a webview-based UI (using TreeView instead for simplicity)
- Workspace-wide feedback aggregation (view shows only active document)

## Implementation Approach

Three independent phases that can be developed in parallel but should be deployed sequentially for user experience consistency.

## Phase 1: Generic Feedback Format Documentation

### Overview
Update command documentation to describe the marker-based format without VSCode-specific attribution, focusing on the format itself rather than its implementation source.

### Changes Required:

#### 1. Update iterate_plan.md Documentation
**File**: `bootandshoe/commands/iterate_plan.md`
**Changes**: Replace VSCode-specific heading and description with generic format description

```markdown
### Feedback Tag Processing

The plan may contain feedback in two formats:

#### Legacy Inline Format
This format uses simple tags that wrap the content directly:
```
<feedback>
This paragraph needs clarification
</feedback>
```

#### Marker-Based Format
This format uses HTML comment markers that reference feedback stored in a dedicated section:
- Start marker: `<!--fb:${id}-->`
- End marker: `<!--/fb:${id}-->`
- Feedback section at end of file contains the actual comments
```

#### 2. Update iterate_plan_nt.md Documentation
**File**: `bootandshoe/commands/iterate_plan_nt.md`
**Changes**: Apply identical changes to the no-thoughts variant

```markdown
### Feedback Tag Processing

The plan may contain feedback in two formats:

#### Legacy Inline Format
This format uses simple tags that wrap the content directly:
```
<feedback>
This paragraph needs clarification
</feedback>
```

#### Marker-Based Format
This format uses HTML comment markers that reference feedback stored in a dedicated section:
- Start marker: `<!--fb:${id}-->`
- End marker: `<!--/fb:${id}-->`
- Feedback section at end of file contains the actual comments
```

### Success Criteria:

#### Automated Verification:
- [x] Files exist and are readable: `ls bootandshoe/commands/iterate_plan*.md`
- [x] No references to "VSCode" in feedback sections: `! grep -i "vscode" bootandshoe/commands/iterate_plan*.md | grep -i feedback`

#### Manual Verification:
- [ ] Documentation accurately describes both formats
- [ ] Format explanation is clear and implementation-agnostic
- [ ] Commands still process feedback correctly

---

## Phase 2: Feedback Deletion UI Enhancement

### Overview
Add user-friendly deletion capabilities to the VSCode extension by providing visual delete buttons in the QuickPick list and hover actions on feedback decorations.

### Changes Required:

#### 1. Add Delete Button to QuickPick Items
**File**: `vscode-extension/src/navigation.ts`
**Changes**: Extend QuickPick items with delete action button

```typescript
// In showFeedbackList() function around line 113
const items = locations.map(loc => {
    // ... existing code ...

    return {
        label: `$(comment) ${displayContent}`,
        description: `Line ${loc.markerRange.start.line + 1}`,
        detail: displayComment,
        buttons: [{
            iconPath: new vscode.ThemeIcon('trash'),
            tooltip: 'Delete this feedback'
        }],
        location: loc,
        feedbackId: loc.id
    };
});

// Add button click handler after line 121
const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select feedback to navigate to, or click trash to delete',
    matchOnDescription: true,
    matchOnDetail: true,
    onDidTriggerItemButton: async (e) => {
        const item = e.item as any;
        if (e.button.tooltip === 'Delete this feedback') {
            const confirm = await vscode.window.showWarningMessage(
                `Delete feedback "${item.detail}"?`,
                { modal: true },
                'Delete'
            );
            if (confirm === 'Delete') {
                await vscode.commands.executeCommand('feedbackTags.removeFeedback', item.feedbackId);
                // Re-show the list
                vscode.commands.executeCommand('feedbackTags.listFeedback');
            }
        }
    }
});
```

#### 2. Add Hover Action for Deletion
**File**: `vscode-extension/src/decorations.ts`
**Changes**: Add delete action to hover content

```typescript
// In updateDecorations() function, modify the hover message around line 68
const hoverMessage = new vscode.MarkdownString(
    `**Feedback:** ${feedbackContent}\n\n` +
    `[Delete Feedback](command:feedbackTags.removeFeedback?${encodeURIComponent(JSON.stringify(marker.id))}) | ` +
    `[Go to Feedback Section](command:feedbackTags.goToFeedbackSection)`
);
hoverMessage.isTrusted = true; // Enable command links
```

#### 3. Update Remove Command to Accept ID Parameter
**File**: `vscode-extension/src/extension.ts`
**Changes**: Modify command registration to accept ID as parameter

```typescript
// Around line 38, update the command registration
context.subscriptions.push(
    vscode.commands.registerCommand('feedbackTags.removeFeedback', async (feedbackId?: string) => {
        if (!feedbackId) {
            // Show QuickPick to select feedback to delete
            const markers = await getFeedbackMarkers(); // Need to implement this
            if (markers.length === 0) {
                vscode.window.showInformationMessage('No feedback markers in this file');
                return;
            }

            const items = markers.map(m => ({
                label: m.content.substring(0, 40),
                description: `ID: ${m.id}`,
                id: m.id
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select feedback to delete'
            });

            if (!selected) return;
            feedbackId = selected.id;
        }

        await removeFeedback(feedbackId);
    })
);
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compilation succeeds: `cd vscode-extension && npm run compile`
- [x] No linting errors: `cd vscode-extension && npm run lint`

#### Manual Verification:
- [ ] Delete button appears in QuickPick list
- [ ] Clicking delete button shows confirmation dialog
- [ ] Confirming deletion removes feedback and markers
- [ ] Hover over feedback decorations shows delete link
- [ ] Delete command works with and without ID parameter

---

## Phase 3: Active Document Feedback View Pane

### Overview
Create a TreeView sidebar that shows all feedback in the currently active document, updating automatically when switching files or when feedback is added/removed.

### Changes Required:

#### 1. Create Feedback Tree Data Provider
**File**: `vscode-extension/src/feedbackTreeProvider.ts` (new file)
**Changes**: Implement TreeDataProvider for active document feedback

```typescript
import * as vscode from 'vscode';
import { parseFeedbackMarkers, FeedbackMarker } from './decorations';

export class FeedbackTreeProvider implements vscode.TreeDataProvider<FeedbackItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FeedbackItem | undefined | null | void> = new vscode.EventEmitter<FeedbackItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FeedbackItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: FeedbackItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: FeedbackItem): Thenable<FeedbackItem[]> {
        // Only show root-level items (flat list, no hierarchy)
        if (element) {
            return Promise.resolve([]);
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return Promise.resolve([]);
        }

        const markers = parseFeedbackMarkers(editor.document);
        return Promise.resolve(markers.map(marker => new FeedbackItem(marker)));
    }
}

export class FeedbackItem extends vscode.TreeItem {
    constructor(public readonly marker: FeedbackMarker) {
        // Show truncated marked content as label
        const displayContent = marker.content.length > 50
            ? marker.content.substring(0, 50) + '...'
            : marker.content;
        super(displayContent, vscode.TreeItemCollapsibleState.None);

        this.tooltip = marker.content;
        this.description = `Line ${marker.startLine + 1}`;
        this.contextValue = 'feedbackItem';
        this.iconPath = new vscode.ThemeIcon('comment');

        // Navigate to marker on click
        this.command = {
            command: 'feedbackTags.goToFeedback',
            title: 'Go to Feedback',
            arguments: [marker]
        };
    }
}
```

#### 2. Register TreeView and Event Listeners in Extension
**File**: `vscode-extension/src/extension.ts`
**Changes**: Import and register the tree view provider with active editor tracking

```typescript
// Add import at top
import { FeedbackTreeProvider } from './feedbackTreeProvider';

// In activate() function, after existing code
const feedbackProvider = new FeedbackTreeProvider();
const treeView = vscode.window.createTreeView('feedbackExplorer', {
    treeDataProvider: feedbackProvider
});

// Refresh when active editor changes
context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => feedbackProvider.refresh())
);

// Refresh when document content changes
context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document === vscode.window.activeTextEditor?.document) {
            feedbackProvider.refresh();
        }
    })
);

// Register navigation command
context.subscriptions.push(
    vscode.commands.registerCommand('feedbackTags.goToFeedback', (marker: FeedbackMarker) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const start = new vscode.Position(marker.startLine, 0);
        editor.selection = new vscode.Selection(start, start);
        editor.revealRange(new vscode.Range(start, start), vscode.TextEditorRevealType.InCenter);
    })
);
```

#### 3. Update Package.json for TreeView
**File**: `vscode-extension/package.json`
**Changes**: Add view container and view configuration

```json
{
    "contributes": {
        "views": {
            "explorer": [
                {
                    "id": "feedbackExplorer",
                    "name": "Feedback",
                    "icon": "$(comment-discussion)",
                    "contextualTitle": "Document Feedback"
                }
            ]
        },
        "commands": [
            // ... existing commands ...
            {
                "command": "feedbackTags.goToFeedback",
                "title": "Go to Feedback"
            }
        ],
        "menus": {
            "view/item/context": [
                {
                    "command": "feedbackTags.removeFeedback",
                    "when": "view == feedbackExplorer && viewItem == feedbackItem",
                    "group": "inline"
                }
            ]
        }
    }
}
```

#### 4. Export parseFeedbackMarkers and FeedbackMarker
**File**: `vscode-extension/src/decorations.ts`
**Changes**: Export the function and interface for use in tree provider

```typescript
// Export the interface (around line 5)
export interface FeedbackMarker {
    id: string;
    startLine: number;
    endLine: number;
    content: string;
}

// Change from internal function to exported (around line 15)
export function parseFeedbackMarkers(document: vscode.TextDocument): FeedbackMarker[] {
    // ... existing implementation ...
}
```

#### 5. Update removeFeedback to Accept Marker Object
**File**: `vscode-extension/src/extension.ts`
**Changes**: Support both ID string and marker object for deletion from tree view

```typescript
// Update the removeFeedback command registration
context.subscriptions.push(
    vscode.commands.registerCommand('feedbackTags.removeFeedback', async (arg?: string | FeedbackItem) => {
        let feedbackId: string;

        if (typeof arg === 'string') {
            feedbackId = arg;
        } else if (arg && arg.marker) {
            feedbackId = arg.marker.id;
        } else {
            // Show picker if no arg provided
            // ... existing picker code ...
        }

        await removeFeedback(feedbackId);
    })
);
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compilation succeeds: `cd vscode-extension && npm run compile`
- [x] No linting errors: `cd vscode-extension && npm run lint`
- [x] New file exists: `ls vscode-extension/src/feedbackTreeProvider.ts`

#### Manual Verification:
- [ ] Feedback view appears in Explorer sidebar
- [ ] View shows feedback items for the active document
- [ ] View updates when switching to a different document
- [ ] View updates when feedback is added or removed
- [ ] Clicking feedback item navigates to its location in the editor
- [ ] Right-click delete action removes feedback
- [ ] Empty state shown when document has no feedback

---

## Testing Strategy

### Unit Tests:
- Test feedback marker parsing with various formats
- Test deletion with edge cases (empty section, last item)

### Integration Tests:
- Add feedback → appears in tree view
- Delete from tree → updates document
- Navigate from tree → opens correct location
- Switch files → tree view updates

### Manual Testing Steps:
1. Install updated extension
2. Open markdown file with existing feedback
3. Verify feedback appears in tree view sidebar
4. Add new feedback via context menu
5. Verify tree view updates automatically
6. Delete feedback from QuickPick list (with delete button)
7. Delete feedback from tree view context menu
8. Click feedback item in tree → navigates to location
9. Switch to different file → tree view updates to show new file's feedback
10. Open file with no feedback → tree view shows empty state

## Performance Considerations

- Tree view parses only the active document (not workspace-wide)
- Refresh triggered on document change events
- No file scanning or caching complexity

## Migration Notes

No migration needed - enhancements are backwards compatible with existing feedback format.

## References

- Original requirements: `TODOs.md`
- Current extension implementation: `vscode-extension/src/extension.ts`
- Command documentation: `bootandshoe/commands/iterate_plan.md`
- Previous feedback plans: `thoughts/shared/plans/2026-01-09-vscode-feedback-tags-extension.md`