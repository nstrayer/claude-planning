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
exports.registerNavigationCommands = registerNavigationCommands;
const vscode = __importStar(require("vscode"));
/**
 * Find all feedback locations in the document
 */
function findFeedbackLocations(document) {
    const text = document.getText();
    const locations = [];
    const markerRegex = /<!--fb:([a-f0-9]+)-->[\s\S]*?<!--\/fb:\1-->/g;
    let match;
    while ((match = markerRegex.exec(text))) {
        const id = match[1];
        const markerStart = document.positionAt(match.index);
        const markerEnd = document.positionAt(match.index + match[0].length);
        // Find associated feedback entry
        const feedbackRegex = new RegExp(`<feedback id="${id}">[\\s\\S]*?</feedback>`);
        const feedbackMatch = text.match(feedbackRegex);
        let feedbackRange = null;
        if (feedbackMatch) {
            const feedbackIndex = text.indexOf(feedbackMatch[0]);
            feedbackRange = new vscode.Range(document.positionAt(feedbackIndex), document.positionAt(feedbackIndex + feedbackMatch[0].length));
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
function navigateToFeedback(direction) {
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
    let targetLocation;
    if (direction === 'next') {
        targetLocation = locations.find(loc => loc.markerRange.start.isAfter(currentPos))
            || locations[0]; // Wrap to first
    }
    else {
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
function registerNavigationCommands(context) {
    const nextCmd = vscode.commands.registerCommand('feedbackTags.nextFeedback', () => {
        navigateToFeedback('next');
    });
    const prevCmd = vscode.commands.registerCommand('feedbackTags.previousFeedback', () => {
        navigateToFeedback('previous');
    });
    const listCmd = vscode.commands.registerCommand('feedbackTags.listFeedback', showFeedbackList);
    context.subscriptions.push(nextCmd, prevCmd, listCmd);
}
//# sourceMappingURL=navigation.js.map