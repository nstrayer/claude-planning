"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const uuid_1 = require("uuid");
const decorations_1 = require("./decorations");
const navigation_1 = require("./navigation");
const feedbackTreeProvider_1 = require("./feedbackTreeProvider");
// Generate short unique IDs for feedback markers
function generateFeedbackId() {
    return (0, uuid_1.v4)().split('-')[0]; // First 8 chars of UUID
}
/**
 * Check if a document is an implementation plan by looking for YAML frontmatter
 * with type: implementation-plan
 */
function isImplementationPlan(document) {
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
function getPlanMetadata(document) {
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
/**
 * Get all feedback markers from a document
 */
function getFeedbackMarkers(document) {
    const text = document.getText();
    const markers = [];
    const markerRegex = /<!--fb:([a-f0-9]+)-->([\s\S]*?)<!--\/fb:\1-->/g;
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
function activate(context) {
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
        }
        else {
            planStatusBarItem.hide();
        }
    }
    // Initial update and listen for editor changes
    updatePlanStatusBar();
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => updatePlanStatusBar()));
    console.log('Step 2: Status bar setup complete');
    // Register command for feedback (always with comment now)
    const addFeedback = vscode.commands.registerCommand('feedbackTags.addFeedback', () => addFeedbackTag());
    console.log('Step 3: addFeedback registered');
    // Register command for general file feedback (no selection needed)
    const addGeneralFeedback = vscode.commands.registerCommand('feedbackTags.addGeneralFeedback', addGeneralFeedbackTag);
    console.log('Step 4: addGeneralFeedback registered');
    // Register command to remove feedback by ID, FeedbackItem, or show picker if none
    const removeFeedbackCmd = vscode.commands.registerCommand('feedbackTags.removeFeedback', async (arg) => {
        let feedbackId;
        if (typeof arg === 'string') {
            feedbackId = arg;
        }
        else if (arg && arg.marker) {
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
    });
    console.log('Step 5: removeFeedbackCmd registered');
    // Register commands for terminal submission
    const submitToTerminal = vscode.commands.registerCommand('feedbackTags.submitToTerminal', submitPlanToTerminal);
    console.log('Step 6: submitToTerminal registered');
    const copyCommand = vscode.commands.registerCommand('feedbackTags.copyIterateCommand', copyIterateCommand);
    console.log('Step 7: copyCommand registered');
    context.subscriptions.push(addFeedback, addGeneralFeedback, removeFeedbackCmd, submitToTerminal, copyCommand);
    console.log('Step 8: All commands pushed to subscriptions');
    // Register decoration listeners for visual highlighting
    (0, decorations_1.registerDecorationListeners)(context);
    // Register navigation commands
    (0, navigation_1.registerNavigationCommands)(context);
    // Register feedback tree view
    const feedbackProvider = new feedbackTreeProvider_1.FeedbackTreeProvider();
    const treeView = vscode.window.createTreeView('feedbackExplorer', {
        treeDataProvider: feedbackProvider
    });
    context.subscriptions.push(treeView);
    // Refresh tree view when active editor changes
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => feedbackProvider.refresh()));
    // Refresh tree view when document content changes
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document === vscode.window.activeTextEditor?.document) {
            feedbackProvider.refresh();
        }
    }));
    // Register navigation command for tree view items
    context.subscriptions.push(vscode.commands.registerCommand('feedbackTags.goToFeedback', (marker) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const start = new vscode.Position(marker.startLine, 0);
        editor.selection = new vscode.Selection(start, start);
        editor.revealRange(new vscode.Range(start, start), vscode.TextEditorRevealType.InCenter);
    }));
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
        }
        else {
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
async function removeFeedback(feedbackId) {
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
        const proceed = await vscode.window.showQuickPick(['Continue anyway', 'Cancel'], { placeHolder: 'No feedback markers found. Submit anyway?' });
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
        const action = await vscode.window.showQuickPick(['Copy to clipboard', 'Cancel'], { placeHolder: 'No terminals found. Copy command to clipboard?' });
        if (action === 'Copy to clipboard') {
            await vscode.env.clipboard.writeText(command);
            vscode.window.showInformationMessage(`Command copied: ${command}`);
        }
        return;
    }
    let selectedTerminal;
    if (terminals.length === 1) {
        // Only one terminal, use it
        selectedTerminal = terminals[0];
    }
    else {
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
    vscode.window.showInformationMessage(`Command copied to clipboard: ${command}`);
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
        const result = await vscode.window.showQuickPick(['Add new tag', 'Append to existing', 'Cancel'], { placeHolder: 'A general-feedback tag already exists at the end of the file' });
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
function deactivate() { }
//# sourceMappingURL=extension.js.map