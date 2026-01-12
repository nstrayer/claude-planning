import * as vscode from 'vscode';
import { registerDecorationListeners, FeedbackMarker } from './decorations';
import { registerNavigationCommands } from './navigation';
import { FeedbackTreeProvider, FeedbackItem } from './feedbackTreeProvider';
import { generateReadableId, findNearestSection } from './idGenerator';
import { generateLlmId, isCopilotAvailable } from './llmIdGenerator';

/**
 * Check if a document is an implementation plan by looking for YAML frontmatter
 * with type: implementation-plan
 */
function isImplementationPlan(document: vscode.TextDocument): boolean {
    const text = document.getText();
    // Check for YAML frontmatter with type: implementation-plan
    const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
        return frontmatterMatch[1].includes('type: implementation-plan');
    }
    return false;
}

/**
 * Extract plan metadata from YAML frontmatter
 */
function getPlanMetadata(document: vscode.TextDocument): { title?: string; status?: string; created?: string } | null {
    const text = document.getText();
    const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
        return null;
    }

    const frontmatter = frontmatterMatch[1];
    const titleMatch = frontmatter.match(/title:\s*"?([^"\n]+)"?/);
    const statusMatch = frontmatter.match(/status:\s*(\S+)/);
    const createdMatch = frontmatter.match(/created:\s*(\S+)/);

    return {
        title: titleMatch?.[1],
        status: statusMatch?.[1],
        created: createdMatch?.[1]
    };
}

interface FeedbackMarkerInfo {
    id: string;
    content: string;
    comment: string | null;
}

/**
 * Get all feedback markers from a document
 */
function getFeedbackMarkers(document: vscode.TextDocument): FeedbackMarkerInfo[] {
    const text = document.getText();
    const markers: FeedbackMarkerInfo[] = [];

    const markerRegex = /<!--fb:([a-z0-9-]+)-->([\s\S]*?)<!--\/fb:\1-->/gi;
    let match;

    while ((match = markerRegex.exec(text))) {
        const id = match[1];
        const content = match[2].trim();

        // Find the associated feedback comment
        const feedbackRegex = new RegExp(`<feedback id="${id}">\\s*([\\s\\S]*?)\\s*</feedback>`);
        const feedbackMatch = text.match(feedbackRegex);
        const comment = feedbackMatch ? feedbackMatch[1].trim() : null;

        markers.push({ id, content, comment });
    }

    return markers;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('TESTING 123 - NEW CODE IS RUNNING');
    console.log('Step 1: Starting activation');

    // Create status bar item for plan detection
    const planStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(planStatusBarItem);

    // Update status bar when active editor changes
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

    // Initial update and listen for editor changes
    updatePlanStatusBar();
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => updatePlanStatusBar())
    );
    console.log('Step 2: Status bar setup complete');

    // Register command for feedback (always with comment now)
    const addFeedback = vscode.commands.registerCommand(
        'feedbackTags.addFeedback',
        () => addFeedbackTag()
    );
    console.log('Step 3: addFeedback registered');

    // Register command for general file feedback (no selection needed)
    const addGeneralFeedback = vscode.commands.registerCommand(
        'feedbackTags.addGeneralFeedback',
        addGeneralFeedbackTag
    );
    console.log('Step 4: addGeneralFeedback registered');

    // Register command to remove feedback by ID, FeedbackItem, or show picker if none
    const removeFeedbackCmd = vscode.commands.registerCommand(
        'feedbackTags.removeFeedback',
        async (arg?: string | FeedbackItem) => {
            let feedbackId: string | undefined;

            if (typeof arg === 'string') {
                feedbackId = arg;
            } else if (arg && arg.marker) {
                feedbackId = arg.marker.id;
            }

            if (!feedbackId) {
                // Show picker to select feedback to delete
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('No active editor');
                    return;
                }

                const markers = getFeedbackMarkers(editor.document);
                if (markers.length === 0) {
                    vscode.window.showInformationMessage('No feedback markers in this file');
                    return;
                }

                const items = markers.map(m => ({
                    label: m.content.substring(0, 40) + (m.content.length > 40 ? '...' : ''),
                    description: `ID: ${m.id}`,
                    detail: m.comment || 'No comment',
                    id: m.id
                }));

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: 'Select feedback to delete'
                });

                if (!selected) {
                    return;
                }
                feedbackId = selected.id;
            }

            await removeFeedback(feedbackId);
        }
    );
    console.log('Step 5: removeFeedbackCmd registered');

    // Register commands for terminal submission
    const submitToTerminal = vscode.commands.registerCommand(
        'feedbackTags.submitToTerminal',
        submitPlanToTerminal
    );
    console.log('Step 6: submitToTerminal registered');

    const copyCommand = vscode.commands.registerCommand(
        'feedbackTags.copyIterateCommand',
        copyIterateCommand
    );
    console.log('Step 7: copyCommand registered');

    const copyPlanPathCmd = vscode.commands.registerCommand(
        'feedbackTags.copyPlanPath',
        copyPlanPath
    );
    console.log('Step 8: copyPlanPath registered');

    const copyFeedbackSummaryCmd = vscode.commands.registerCommand(
        'feedbackTags.copyFeedbackSummary',
        copyFeedbackSummary
    );
    console.log('Step 9: copyFeedbackSummary registered');

    const submitImplementPlanCmd = vscode.commands.registerCommand(
        'feedbackTags.submitImplementPlan',
        submitImplementPlanToTerminal
    );
    console.log('Step 10: submitImplementPlan registered');

    const copyImplementCommandCmd = vscode.commands.registerCommand(
        'feedbackTags.copyImplementCommand',
        copyImplementCommand
    );
    console.log('Step 11: copyImplementCommand registered');

    context.subscriptions.push(
        addFeedback,
        addGeneralFeedback,
        removeFeedbackCmd,
        submitToTerminal,
        copyCommand,
        copyPlanPathCmd,
        copyFeedbackSummaryCmd,
        submitImplementPlanCmd,
        copyImplementCommandCmd
    );
    console.log('Step 8: All commands pushed to subscriptions');

    // Register decoration listeners for visual highlighting
    registerDecorationListeners(context);

    // Register navigation commands
    registerNavigationCommands(context);

    // Register feedback tree view
    const feedbackProvider = new FeedbackTreeProvider();
    const treeView = vscode.window.createTreeView('feedbackExplorer', {
        treeDataProvider: feedbackProvider
    });
    context.subscriptions.push(treeView);

    // Refresh tree view when active editor changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => feedbackProvider.refresh())
    );

    // Refresh tree view when document content changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document === vscode.window.activeTextEditor?.document) {
                feedbackProvider.refresh();
            }
        })
    );

    // Register navigation command for tree view items
    context.subscriptions.push(
        vscode.commands.registerCommand('feedbackTags.goToFeedback', (marker: FeedbackMarker) => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const start = new vscode.Position(marker.startLine, 0);
            editor.selection = new vscode.Selection(start, start);
            editor.revealRange(new vscode.Range(start, start), vscode.TextEditorRevealType.InCenter);
        })
    );

    // Check Copilot availability if LLM IDs are enabled
    const config = vscode.workspace.getConfiguration('claudeFeedback');
    if (config.get<boolean>('useLlmForIds')) {
        isCopilotAvailable().then(available => {
            if (!available) {
                vscode.window.showInformationMessage(
                    'Claude Feedback: AI-generated IDs enabled but GitHub Copilot not available. Using heuristic IDs instead.'
                );
            }
        });
    }
}

/**
 * Generate a feedback ID, optionally using LLM if enabled
 */
async function generateFeedbackIdAsync(
    document: vscode.TextDocument,
    selection: vscode.Selection,
    selectedText: string,
    feedbackComment: string,
    token: vscode.CancellationToken
): Promise<string> {
    const config = vscode.workspace.getConfiguration('claudeFeedback');

    if (config.get<boolean>('useLlmForIds')) {
        const sectionContext = findNearestSection(document, selection.start.line);
        const llmId = await generateLlmId(
            sectionContext || '',
            selectedText,
            feedbackComment,
            token
        );
        if (llmId) {
            return llmId;
        }
        // Fallback to heuristic if LLM fails or Copilot unavailable
    }

    return generateReadableId(document, selection, feedbackComment);
}

/**
 * Add feedback about selected text using marker-based referencing
 */
async function addFeedbackTag() {
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

    const document = editor.document;
    const tokenSource = new vscode.CancellationTokenSource();

    let feedbackId: string;
    try {
        feedbackId = await generateFeedbackIdAsync(
            document,
            selection,
            selectedText,
            feedbackComment,
            tokenSource.token
        );
    } finally {
        tokenSource.dispose();
    }

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

/**
 * Remove a feedback marker and its associated comment
 */
async function removeFeedback(feedbackId: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

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
    const command = `/bootandshoe:iterate_plan ${filePath} - address all feedback and update the plan accordingly.`;

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

    vscode.window.showInformationMessage(`Copied: ${command}`);
}

/**
 * Copy implement_plan command to clipboard
 */
async function copyImplementCommand() {
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

    const filePath = editor.document.fileName;
    const command = `/bootandshoe:implement_plan ${filePath}`;

    await vscode.env.clipboard.writeText(command);
    vscode.window.showInformationMessage(`Copied: ${command}`);
}

/**
 * Copy just the plan file path to clipboard
 */
async function copyPlanPath(uri?: vscode.Uri) {
    let filePath: string;

    if (uri) {
        filePath = uri.fsPath;
    } else {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No file open');
            return;
        }
        filePath = editor.document.fileName;
    }

    await vscode.env.clipboard.writeText(filePath);
    vscode.window.showInformationMessage(`Copied path: ${filePath}`);
}

/**
 * Copy all feedback markers as formatted summary
 */
async function copyFeedbackSummary() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No file open');
        return;
    }

    const markers = getFeedbackMarkers(editor.document);
    if (markers.length === 0) {
        vscode.window.showInformationMessage('No feedback in this file');
        return;
    }

    // Format feedback summary
    const summary = markers.map((m, i) =>
        `${i + 1}. "${m.content.substring(0, 50)}${m.content.length > 50 ? '...' : ''}"` +
        (m.comment ? `\n   Feedback: ${m.comment}` : '')
    ).join('\n\n');

    const fileName = editor.document.fileName.split('/').pop();
    const header = `Feedback Summary for ${fileName}:\n\n`;

    await vscode.env.clipboard.writeText(header + summary);
    vscode.window.showInformationMessage(`Copied ${markers.length} feedback items`);
}

/**
 * Submit implement_plan command to Claude Code terminal
 */
async function submitImplementPlanToTerminal() {
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

    const filePath = editor.document.fileName;
    const command = `/bootandshoe:implement_plan ${filePath}`;

    // Get all terminals
    const terminals = vscode.window.terminals;

    if (terminals.length === 0) {
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
        selectedTerminal = terminals[0];
    } else {
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

    selectedTerminal.sendText(command);
    selectedTerminal.show();

    vscode.window.showInformationMessage(`Sent to ${selectedTerminal.name}: ${command}`);
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
