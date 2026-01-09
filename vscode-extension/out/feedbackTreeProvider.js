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
exports.FeedbackItem = exports.FeedbackTreeProvider = void 0;
const vscode = __importStar(require("vscode"));
const decorations_1 = require("./decorations");
class FeedbackTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        // Only show root-level items (flat list, no hierarchy)
        if (element) {
            return Promise.resolve([]);
        }
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return Promise.resolve([]);
        }
        const markers = (0, decorations_1.parseFeedbackMarkers)(editor.document);
        return Promise.resolve(markers.map(marker => new FeedbackItem(marker)));
    }
}
exports.FeedbackTreeProvider = FeedbackTreeProvider;
class FeedbackItem extends vscode.TreeItem {
    constructor(marker) {
        // Show truncated marked content as label
        const displayContent = marker.content.length > 50
            ? marker.content.substring(0, 50) + '...'
            : marker.content;
        super(displayContent, vscode.TreeItemCollapsibleState.None);
        this.marker = marker;
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
exports.FeedbackItem = FeedbackItem;
//# sourceMappingURL=feedbackTreeProvider.js.map