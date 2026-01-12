import * as vscode from 'vscode';

/**
 * Generate a human-readable feedback ID based on context and content
 */
export function generateReadableId(
    document: vscode.TextDocument,
    selection: vscode.Selection,
    feedbackText: string
): string {
    // Get context: find the nearest section header
    const sectionName = findNearestSection(document, selection.start.line);

    // Extract keywords from the feedback or selected text
    const keywords = extractKeywords(feedbackText);

    // Combine into readable ID
    let baseId = sectionName
        ? `${sectionName}-${keywords}`
        : keywords;

    // Ensure uniqueness within document
    const existingIds = getExistingIds(document);
    baseId = ensureUnique(baseId, existingIds);

    return baseId;
}

/**
 * Find the nearest markdown section header above the given line
 */
export function findNearestSection(document: vscode.TextDocument, line: number): string | null {
    // Search backwards for ## or # header
    for (let i = line; i >= 0; i--) {
        const text = document.lineAt(i).text;
        const headerMatch = text.match(/^#{1,3}\s+(?:Phase\s+\d+[:\s]*)?(.+)/);
        if (headerMatch) {
            return slugify(headerMatch[1]).substring(0, 15);
        }
    }
    return null;
}

/**
 * Extract meaningful keywords from text
 */
export function extractKeywords(text: string): string {
    // Remove common words and punctuation
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'be', 'to', 'of', 'and', 'for', 'in', 'on', 'this', 'that', 'it', 'with']);

    const words = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w))
        .slice(0, 2); // Take first 2 meaningful words

    return words.join('-') || 'feedback';
}

/**
 * Convert text to URL-safe slug
 */
function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Get all existing feedback IDs in document
 */
function getExistingIds(document: vscode.TextDocument): Set<string> {
    const text = document.getText();
    const ids = new Set<string>();
    const regex = /<!--fb:([a-z0-9-]+)-->/gi;
    let match;
    while ((match = regex.exec(text))) {
        ids.add(match[1].toLowerCase());
    }
    return ids;
}

/**
 * Ensure ID is unique by appending number if needed
 */
function ensureUnique(baseId: string, existingIds: Set<string>): string {
    if (!existingIds.has(baseId.toLowerCase())) {
        return baseId;
    }

    let counter = 2;
    while (existingIds.has(`${baseId}-${counter}`.toLowerCase())) {
        counter++;
    }
    return `${baseId}-${counter}`;
}

/**
 * Fallback to short random ID if heuristics fail
 */
export function generateFallbackId(): string {
    return Math.random().toString(36).substring(2, 8);
}
