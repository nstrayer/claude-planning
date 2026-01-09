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

        this.tooltip = marker.comment || marker.content;
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
