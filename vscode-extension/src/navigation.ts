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
    if (!editor) {
        return;
    }

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
    if (!editor) {
        return;
    }

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
            buttons: [{
                iconPath: new vscode.ThemeIcon('trash'),
                tooltip: 'Delete this feedback'
            }],
            location: loc,
            feedbackId: loc.id
        };
    });

    const quickPick = vscode.window.createQuickPick<typeof items[0]>();
    quickPick.items = items;
    quickPick.placeholder = 'Select feedback to navigate to, or click trash to delete';
    quickPick.matchOnDescription = true;
    quickPick.matchOnDetail = true;

    quickPick.onDidTriggerItemButton(async (e) => {
        if (e.button.tooltip === 'Delete this feedback') {
            const confirm = await vscode.window.showWarningMessage(
                `Delete feedback "${e.item.detail}"?`,
                { modal: true },
                'Delete'
            );
            if (confirm === 'Delete') {
                quickPick.hide();
                await vscode.commands.executeCommand('feedbackTags.removeFeedback', e.item.feedbackId);
                // Re-show the list after deletion
                vscode.commands.executeCommand('feedbackTags.listFeedback');
            }
        }
    });

    quickPick.onDidAccept(() => {
        const selected = quickPick.selectedItems[0];
        if (selected) {
            editor.selection = new vscode.Selection(selected.location.markerRange.start, selected.location.markerRange.start);
            editor.revealRange(selected.location.markerRange, vscode.TextEditorRevealType.InCenter);
        }
        quickPick.hide();
    });

    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
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
