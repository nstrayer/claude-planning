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
exports.parseFeedbackMarkers = parseFeedbackMarkers;
exports.updateDecorations = updateDecorations;
exports.registerDecorationListeners = registerDecorationListeners;
const vscode = __importStar(require("vscode"));
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
/**
 * Parse feedback markers from document text
 */
function parseFeedbackMarkers(document) {
    const text = document.getText();
    const markers = [];
    // Find all feedback markers: <!--fb:id-->...<!--/fb:id-->
    const markerRegex = /<!--fb:([a-f0-9]+)-->([\s\S]*?)<!--\/fb:\1-->/g;
    let match;
    while ((match = markerRegex.exec(text))) {
        const id = match[1];
        const content = match[2].trim();
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);
        // Find the associated feedback comment
        const feedbackRegex = new RegExp(`<feedback id="${id}">\\s*([\\s\\S]*?)\\s*</feedback>`);
        const feedbackMatch = text.match(feedbackRegex);
        const comment = feedbackMatch ? feedbackMatch[1].trim() : null;
        markers.push({
            id,
            range: new vscode.Range(startPos, endPos),
            startLine: startPos.line,
            content,
            comment
        });
    }
    return markers;
}
/**
 * Update decorations for the active editor
 */
function updateDecorations(editor) {
    if (editor.document.languageId !== 'markdown') {
        return;
    }
    const markers = parseFeedbackMarkers(editor.document);
    const decorations = markers.map(marker => {
        const hoverContent = new vscode.MarkdownString();
        hoverContent.isTrusted = true;
        if (marker.comment) {
            hoverContent.appendMarkdown(`**Feedback** (id: \`${marker.id}\`)\n\n`);
            hoverContent.appendMarkdown(marker.comment);
            hoverContent.appendMarkdown(`\n\n---\n`);
            hoverContent.appendMarkdown(`[Remove feedback](command:feedbackTags.removeFeedback?${encodeURIComponent(JSON.stringify([marker.id]))})`);
        }
        else {
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
        const sectionRange = new vscode.Range(editor.document.positionAt(startIndex), editor.document.positionAt(endIndex));
        editor.setDecorations(feedbackSectionDecorationType, [{ range: sectionRange }]);
    }
}
/**
 * Register decoration listeners
 */
function registerDecorationListeners(context) {
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
//# sourceMappingURL=decorations.js.map