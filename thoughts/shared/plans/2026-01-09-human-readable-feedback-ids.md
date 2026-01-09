# Human-Readable Feedback IDs

## Overview

Replace the current UUID-based feedback IDs (e.g., `a1b2c3d4`) with human-readable identifiers that convey meaning about the feedback content or location (e.g., `phase2-api-clarity` or `overview-simplify`).

## Current State Analysis

Feedback IDs are generated using truncated UUIDs:

```typescript
// vscode-extension/src/extension.ts:8-10
function generateFeedbackId(): string {
    return uuidv4().split('-')[0]; // First 8 chars of UUID
}
```

This produces IDs like `a1b2c3d4` that are:
- Unique but meaningless
- Hard to remember or discuss
- Provide no context about the feedback

### Key Discoveries:
- ID generation at `extension.ts:8-10`
- IDs used in markers: `<!--fb:${feedbackId}-->` at `extension.ts:190-192`
- IDs displayed in tree view at `feedbackTreeProvider.ts`
- IDs shown in QuickPick at `extension.ts:84-88`
- Regex expects hex pattern: `/<!--fb:([a-f0-9]+)-->/` at `extension.ts:25`

## Desired End State

After implementation:
1. Feedback IDs are short, meaningful phrases (e.g., `auth-flow-unclear`)
2. IDs reflect the content or section being marked
3. IDs are unique within a document
4. Optional: Use LLM to generate contextual IDs

### Verification:
- New feedback has readable IDs
- Existing hex IDs continue to work
- Tree view and QuickPick show meaningful labels

## What We're NOT Doing

- Migrating existing feedback to new ID format
- Creating an ID database or registry
- Requiring network calls for basic functionality
- Changing the marker XML format (just the ID content)

## Implementation Approach

Three options with increasing sophistication. We'll implement Option 2 (heuristic naming) as the default with Option 3 (LLM naming) as an opt-in feature.

**Option 1: Simple Pattern** - Use section header + counter (e.g., `overview-1`, `phase2-3`)
**Option 2: Content-Based** - Extract keywords from selection/feedback (e.g., `auth-clarity`)
**Option 3: LLM-Generated** - Use a small model to generate meaningful IDs

---

## Phase 1: Update Regex to Accept Alphanumeric IDs

### Overview
Modify the feedback marker regex to accept both old hex IDs and new alphanumeric-with-hyphens IDs.

### Changes Required:

#### 1. Update Marker Regex in extension.ts
**File**: `vscode-extension/src/extension.ts`
**Changes**: Expand regex pattern to accept broader character set

```typescript
// Line 25 - update regex to accept alphanumeric with hyphens
const markerRegex = /<!--fb:([a-z0-9-]+)-->([\s\S]*?)<!--\/fb:\1-->/gi;
```

Also update the feedback extraction regex at line 33:
```typescript
const feedbackRegex = new RegExp(`<feedback id="${id}">\\s*([\\s\\S]*?)\\s*</feedback>`);
// No change needed - already accepts any ID string
```

#### 2. Update Regex in decorations.ts
**File**: `vscode-extension/src/decorations.ts`
**Changes**: Update any marker parsing regex

Search for similar patterns and update to accept `[a-z0-9-]+`

#### 3. Update Regex in navigation.ts
**File**: `vscode-extension/src/navigation.ts`
**Changes**: Update any marker parsing regex

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles: `cd vscode-extension && npm run compile`
- [ ] Extension activates without errors

#### Manual Verification:
- [ ] Old hex IDs still detected and work
- [ ] New format IDs (e.g., `test-id-one`) detected correctly
- [ ] Mixed documents with both formats work

---

## Phase 2: Implement Heuristic ID Generation

### Overview
Replace UUID generation with a function that creates meaningful IDs based on content and context.

### Changes Required:

#### 1. Create ID Generation Module
**File**: `vscode-extension/src/idGenerator.ts` (new file)
**Changes**: Create module with ID generation logic

```typescript
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
function findNearestSection(document: vscode.TextDocument, line: number): string | null {
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
function extractKeywords(text: string): string {
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
 * Fallback to short UUID if heuristics fail
 */
export function generateFallbackId(): string {
    return Math.random().toString(36).substring(2, 8);
}
```

#### 2. Update extension.ts to Use New Generator
**File**: `vscode-extension/src/extension.ts`
**Changes**: Import and use new ID generator

```typescript
// Add import at top
import { generateReadableId } from './idGenerator';

// Update generateFeedbackId function or replace usage
// In addFeedbackTag() around line 185:
const feedbackId = generateReadableId(
    document,
    selection,
    feedbackComment
);
```

#### 3. Handle General Feedback IDs
**File**: `vscode-extension/src/extension.ts`
**Changes**: Update addGeneralFeedbackTag to use readable IDs

For general feedback (no selection), generate IDs like `general-{keyword}`:

```typescript
// In addGeneralFeedbackTag(), around line 313
const keywords = extractKeywords(feedback);
const feedbackId = `general-${keywords}`;
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles: `cd vscode-extension && npm run compile`
- [ ] No linting errors: `cd vscode-extension && npm run lint`
- [ ] New file exists: `test -f vscode-extension/src/idGenerator.ts`

#### Manual Verification:
- [ ] Adding feedback in "## Overview" section creates ID like `overview-keyword`
- [ ] Adding feedback in "## Phase 2" creates ID like `phase2-keyword`
- [ ] Duplicate feedback gets unique suffix (e.g., `overview-clarity-2`)
- [ ] IDs are displayed correctly in tree view
- [ ] QuickPick shows readable IDs

---

## Phase 3: Optional LLM-Generated IDs

### Overview
Add optional integration with a small LLM to generate contextually meaningful IDs when network is available.

### Changes Required:

#### 1. Add Configuration Setting
**File**: `vscode-extension/package.json`
**Changes**: Add setting for LLM ID generation

```json
"configuration": {
  "title": "Claude Feedback",
  "properties": {
    "claudeFeedback.useLlmForIds": {
      "type": "boolean",
      "default": false,
      "description": "Use LLM to generate contextual feedback IDs (requires API key)"
    },
    "claudeFeedback.llmApiKey": {
      "type": "string",
      "default": "",
      "description": "API key for LLM service (Anthropic Claude)"
    }
  }
}
```

#### 2. Create LLM ID Generator
**File**: `vscode-extension/src/llmIdGenerator.ts` (new file)
**Changes**: Create module for LLM-based ID generation

```typescript
import * as vscode from 'vscode';

/**
 * Generate a feedback ID using an LLM
 */
export async function generateLlmId(
    context: string,
    selectedText: string,
    feedbackText: string
): Promise<string | null> {
    const config = vscode.workspace.getConfiguration('claudeFeedback');
    const apiKey = config.get<string>('llmApiKey');

    if (!apiKey) {
        return null;
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 50,
                messages: [{
                    role: 'user',
                    content: `Generate a short, kebab-case ID (2-4 words, lowercase, hyphens) for this feedback:

Section context: ${context}
Selected text: "${selectedText.substring(0, 100)}"
Feedback: "${feedbackText.substring(0, 100)}"

Reply with ONLY the ID, nothing else. Example: auth-flow-unclear`
                }]
            })
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json() as { content: Array<{ text: string }> };
        const id = data.content[0]?.text?.trim()?.toLowerCase()?.replace(/[^a-z0-9-]/g, '');

        return id && id.length <= 30 ? id : null;
    } catch {
        return null;
    }
}
```

#### 3. Integrate LLM Generation with Fallback
**File**: `vscode-extension/src/extension.ts`
**Changes**: Use LLM when enabled, fall back to heuristic

```typescript
import { generateLlmId } from './llmIdGenerator';
import { generateReadableId } from './idGenerator';

// In addFeedbackTag(), replace ID generation:
let feedbackId: string;

const config = vscode.workspace.getConfiguration('claudeFeedback');
if (config.get<boolean>('useLlmForIds')) {
    const sectionContext = findNearestSection(document, selection.start.line);
    const llmId = await generateLlmId(sectionContext || '', selectedText, feedbackComment);
    feedbackId = llmId || generateReadableId(document, selection, feedbackComment);
} else {
    feedbackId = generateReadableId(document, selection, feedbackComment);
}
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles: `cd vscode-extension && npm run compile`
- [ ] Settings appear in VS Code: Check extension settings UI

#### Manual Verification:
- [ ] With setting OFF: Uses heuristic ID generation
- [ ] With setting ON + valid API key: Uses LLM-generated IDs
- [ ] With setting ON + invalid/missing key: Falls back to heuristic
- [ ] LLM-generated IDs are contextually meaningful
- [ ] Network errors don't break functionality

---

## Testing Strategy

### Unit Tests:
- `extractKeywords` handles various input types
- `findNearestSection` finds correct headers
- `ensureUnique` adds proper suffixes
- `slugify` produces valid IDs

### Integration Tests:
1. Add feedback in various sections → Check ID reflects section
2. Add duplicate feedback → Check uniqueness suffix
3. Add general feedback → Check `general-` prefix

### Manual Testing Steps:
1. Open plan file with multiple sections
2. Add feedback to "Overview" section
3. Verify ID like `overview-something`
4. Add feedback to "Phase 2: Auth"
5. Verify ID like `phase2-auth-something`
6. Add same feedback twice
7. Verify second gets unique suffix
8. Enable LLM setting with valid API key
9. Add feedback and verify LLM-generated ID

## Performance Considerations

- Heuristic generation is synchronous and fast
- LLM generation adds ~500ms latency (acceptable for user-initiated action)
- LLM fallback ensures no blocking on network issues
- IDs cached implicitly (no re-generation needed)

## Migration Notes

- Existing hex IDs continue to work (regex updated)
- No automatic migration of old IDs
- Users can manually update IDs if desired
- Mixed ID formats coexist in same document

## References

- Current ID generation: `vscode-extension/src/extension.ts:8-10`
- Marker regex: `vscode-extension/src/extension.ts:25`
- Tree view display: `vscode-extension/src/feedbackTreeProvider.ts`
- Original requirement: `TODOs.md:6`