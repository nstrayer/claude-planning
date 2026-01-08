import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { registerDecorationListeners } from './decorations';
import { registerNavigationCommands } from './navigation';

// Generate short unique IDs for feedback markers
function generateFeedbackId(): string {
    return uuidv4().split('-')[0]; // First 8 chars of UUID
}

export function activate(context: vscode.ExtensionContext) {
    console.log('BootAndShoe Feedback Tags extension activated');

    // Register command for feedback (always with comment now)
    const addFeedback = vscode.commands.registerCommand(
        'feedbackTags.addFeedback',
        () => addFeedbackTag()
    );

    // Register command for general file feedback (no selection needed)
    const addGeneralFeedback = vscode.commands.registerCommand(
        'feedbackTags.addGeneralFeedback',
        addGeneralFeedbackTag
    );

    // Register command to remove feedback by ID
    const removeFeedbackCmd = vscode.commands.registerCommand(
        'feedbackTags.removeFeedback',
        (feedbackId: string) => removeFeedback(feedbackId)
    );

    context.subscriptions.push(addFeedback, addGeneralFeedback, removeFeedbackCmd);

    // Register decoration listeners for visual highlighting
    registerDecorationListeners(context);

    // Register navigation commands
    registerNavigationCommands(context);
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
