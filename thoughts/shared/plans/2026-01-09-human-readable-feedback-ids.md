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
**Option 3: LLM-Generated** - Use VSCode Language Model API (Copilot) to generate meaningful IDs

> **Note**: Option 3 uses VSCode's built-in `vscode.lm` namespace instead of direct API calls. This requires GitHub Copilot but eliminates API key management.

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
- [x] TypeScript compiles: `cd vscode-extension && npm run compile`
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
- [x] TypeScript compiles: `cd vscode-extension && npm run compile`
- [x] No linting errors: `cd vscode-extension && npm run lint`
- [x] New file exists: `test -f vscode-extension/src/idGenerator.ts`

#### Manual Verification:
- [ ] Adding feedback in "## Overview" section creates ID like `overview-keyword`
- [ ] Adding feedback in "## Phase 2" creates ID like `phase2-keyword`
- [ ] Duplicate feedback gets unique suffix (e.g., `overview-clarity-2`)
- [ ] IDs are displayed correctly in tree view
- [ ] QuickPick shows readable IDs

---

## Phase 3: Optional LLM-Generated IDs

### Overview
Add optional integration with VSCode's built-in Language Model API to generate contextually meaningful IDs. This uses GitHub Copilot's models without requiring API key management.

### Why This Matters for LLM Coding Agents

Human-readable feedback IDs significantly improve how LLM coding agents interpret and act on feedback:

| Hex ID | Human-Readable ID | Agent Benefit |
|--------|-------------------|---------------|
| `a1b2c3d4` | `phase2-api-clarity` | Instant spatial + topic awareness |
| Requires lookup | Self-documenting | Reduced context consumption |
| No filtering | Pattern-based grouping | Can process `api-*` feedback together |

**Key insight**: Human-readable IDs act as semantic compression - agents understand feedback relevance from the ID alone without reading full content, reducing context usage by ~50% when filtering irrelevant feedback.

### Changes Required:

#### 1. Add Configuration Setting
**File**: `vscode-extension/package.json`
**Changes**: Add setting for LLM ID generation (no API key needed)

```json
"configuration": {
  "title": "Claude Feedback",
  "properties": {
    "claudeFeedback.useLlmForIds": {
      "type": "boolean",
      "default": false,
      "description": "Use AI to generate contextual feedback IDs (requires GitHub Copilot)"
    }
  }
}
```

**Note**: No API key setting needed - the VSCode Language Model API uses the user's existing Copilot subscription.

#### 2. Create LLM ID Generator
**File**: `vscode-extension/src/llmIdGenerator.ts` (new file)
**Changes**: Create module using VSCode's Language Model API

```typescript
import * as vscode from 'vscode';

/**
 * Generate a feedback ID using VSCode's Language Model API (Copilot)
 */
export async function generateLlmId(
    context: string,
    selectedText: string,
    feedbackText: string,
    token: vscode.CancellationToken
): Promise<string | null> {
    try {
        // Select available models - prefer smaller/faster models for ID generation
        const models = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            family: 'gpt-4o-mini'  // Fast, cheap, sufficient for short ID generation
        });

        // Fallback to any available model if gpt-4o-mini not available
        const availableModels = models.length > 0
            ? models
            : await vscode.lm.selectChatModels({ vendor: 'copilot' });

        if (availableModels.length === 0) {
            // No models available - user may not have Copilot
            return null;
        }

        const prompt = `Generate a short, kebab-case ID (2-4 words, lowercase, hyphens) for this feedback:

Section context: ${context}
Selected text: "${selectedText.substring(0, 100)}"
Feedback: "${feedbackText.substring(0, 100)}"

Reply with ONLY the ID, nothing else. Example: auth-flow-unclear`;

        const messages = [
            vscode.LanguageModelChatMessage.User(prompt)
        ];

        const response = await availableModels[0].sendRequest(messages, {}, token);

        // Collect streamed response
        let result = '';
        for await (const fragment of response.text) {
            result += fragment;
            // Early exit if we have enough characters
            if (result.length > 40) break;
        }

        // Validate and clean the ID
        const id = result.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
        return id && id.length >= 3 && id.length <= 30 ? id : null;

    } catch (err) {
        if (err instanceof vscode.LanguageModelError) {
            // Log for debugging but don't break functionality
            console.log('Language model error:', err.message, err.code);
        }
        return null;  // Fallback to heuristic generation
    }
}

/**
 * Check if Copilot language models are available
 */
export async function isCopilotAvailable(): Promise<boolean> {
    try {
        const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
        return models.length > 0;
    } catch {
        return false;
    }
}
```

**Key differences from direct API approach**:
- No API key management - uses Copilot subscription
- Requires `CancellationToken` for proper VSCode integration
- Streaming response handling
- Graceful fallback when Copilot unavailable
- Access to multiple model providers (GPT-4o, Claude 3.5 Sonnet, etc.)

#### 3. Integrate LLM Generation with Fallback
**File**: `vscode-extension/src/extension.ts`
**Changes**: Use LLM when enabled, fall back to heuristic

```typescript
import { generateLlmId, isCopilotAvailable } from './llmIdGenerator';
import { generateReadableId, findNearestSection } from './idGenerator';

// In addFeedbackTag(), replace ID generation:
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

// Usage in command handler:
vscode.commands.registerCommand('feedbackTags.addFeedback', async () => {
    const tokenSource = new vscode.CancellationTokenSource();
    try {
        // ... get document, selection, feedbackComment ...
        const feedbackId = await generateFeedbackIdAsync(
            document,
            selection,
            selectedText,
            feedbackComment,
            tokenSource.token
        );
        // ... use feedbackId ...
    } finally {
        tokenSource.dispose();
    }
});
```

#### 4. Optional: Show Copilot Status in UI
**File**: `vscode-extension/src/extension.ts`
**Changes**: Inform users about Copilot availability

```typescript
// On extension activation, check Copilot availability
export async function activate(context: vscode.ExtensionContext) {
    // ... existing activation code ...

    const config = vscode.workspace.getConfiguration('claudeFeedback');
    if (config.get<boolean>('useLlmForIds')) {
        const copilotAvailable = await isCopilotAvailable();
        if (!copilotAvailable) {
            vscode.window.showInformationMessage(
                'Claude Feedback: AI-generated IDs enabled but GitHub Copilot not available. Using heuristic IDs instead.'
            );
        }
    }
}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `cd vscode-extension && npm run compile`
- [ ] Settings appear in VS Code: Check extension settings UI
- [x] No `llmApiKey` setting exists (removed)

#### Manual Verification:
- [ ] With setting OFF: Uses heuristic ID generation
- [ ] With setting ON + Copilot installed: Uses LLM-generated IDs
- [ ] With setting ON + Copilot NOT installed: Falls back to heuristic with info message
- [ ] LLM-generated IDs are contextually meaningful (e.g., `auth-flow-unclear`)
- [ ] Rate limit errors don't break functionality (graceful fallback)
- [ ] Cancellation works (user can cancel long-running requests)

---

## Testing Strategy

### Unit Tests:
- `extractKeywords` handles various input types
- `findNearestSection` finds correct headers
- `ensureUnique` adds proper suffixes
- `slugify` produces valid IDs
- `isCopilotAvailable` returns boolean without throwing

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

**With Copilot installed:**
8. Enable `useLlmForIds` setting
9. Add feedback and verify LLM-generated ID is contextual
10. Check no errors in Developer Tools console

**Without Copilot:**
11. Enable `useLlmForIds` setting
12. Verify info message appears about fallback
13. Add feedback and verify heuristic ID is used

## Performance Considerations

- Heuristic generation is synchronous and fast (< 1ms)
- LLM generation adds ~200-500ms latency (acceptable for user-initiated action)
- VSCode Language Model API handles rate limiting automatically
- Fallback to heuristic ensures no blocking on Copilot issues
- IDs generated once per feedback addition (no regeneration needed)
- Streaming response with early exit minimizes latency

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

### VSCode Language Model API Documentation
- [Language Model API Guide](https://code.visualstudio.com/api/extension-guides/language-model)
- [VSCode API Reference - lm namespace](https://code.visualstudio.com/api/references/vscode-api#lm)
- [VSCode 1.90 Release Notes](https://code.visualstudio.com/updates/v1_90) - API became stable
- [VSCode 1.95 Release Notes](https://code.visualstudio.com/updates/v1_95) - Language Model Tools finalized

### Related Research
- `thoughts/shared/research/2026-01-12-vscode-lm-api-for-feedback-ids.md` - VSCode API research
- `thoughts/shared/research/2026-01-11-feedback-id-human-readable-analysis.md` - Performance analysis