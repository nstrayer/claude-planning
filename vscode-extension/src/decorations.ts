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

export interface FeedbackMarker {
    id: string;
    range: vscode.Range;
    startLine: number;
    content: string;
    comment: string | null;
}

/**
 * Parse feedback markers from document text
 */
export function parseFeedbackMarkers(document: vscode.TextDocument): FeedbackMarker[] {
    const text = document.getText();
    const markers: FeedbackMarker[] = [];

    // Find all feedback markers: <!--fb:id-->...<!--/fb:id-->
    const markerRegex = /<!--fb:([a-z0-9-]+)-->([\s\S]*?)<!--\/fb:\1-->/gi;
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
