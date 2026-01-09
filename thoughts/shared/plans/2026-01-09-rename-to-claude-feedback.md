# Rename VSCode Extension to Claude Feedback

## Overview

Rename the VSCode extension from "BootAndShoe Feedback Tags" to "Claude Feedback" to provide clearer branding and better reflect its purpose as a feedback system for Claude-based development workflows.

## Current State Analysis

The VSCode extension currently uses "bootandshoe" branding in several places:
- Package name: `bootandshoe-feedback-tags`
- Display name: "BootAndShoe Feedback Tags"
- Description references bootandshoe workflow
- README documentation mentions BootAndShoe multiple times

Command prefixes already use the generic `feedbackTags` rather than `bootandshoe`, which means commands don't need renaming.

### Key Discoveries:
- Package name appears in `package.json:2` and `package-lock.json:2,8`
- Display name at `package.json:3`
- Description at `package.json:4` mentions "bootandshoe iterate plan workflow"
- README has 7 references including title, badges, and section headings
- Extension activation log at `src/extension.ts:44`
- VSIX package file named `bootandshoe-feedback-tags-1.0.0.vsix`

## Desired End State

After implementation:
1. Extension package name: `claude-feedback`
2. Display name: "Claude Feedback"
3. Description emphasizes Claude development workflows
4. README uses Claude branding throughout
5. Marketplace URLs reflect new name

## What We're NOT Doing

- Changing the publisher ID (remains `nstrayer`)
- Modifying command IDs (remain as `feedbackTags.*`)
- Renaming the bootandshoe plugin directory itself
- Changing the feedback format or functionality
- Creating redirects from old marketplace listing (new listing)

## Implementation Approach

A single phase to rename all references, rebuild, and test the extension before publishing.

## Phase 1: Rename Extension References

### Overview
Update all bootandshoe references to Claude branding across configuration, documentation, and code.

### Changes Required:

#### 1. Update Package Configuration
**File**: `vscode-extension/package.json`
**Changes**: Update name, display name, description, keywords

```json
{
  "name": "claude-feedback",
  "displayName": "Claude Feedback",
  "description": "Add and manage feedback tags for Claude development workflows and plan iteration",
  "version": "1.0.0",
  "publisher": "nstrayer",
  "keywords": [
    "feedback",
    "markdown",
    "claude",
    "planning",
    "development"
  ]
}
```

#### 2. Update Package Lock
**File**: `vscode-extension/package-lock.json`
**Changes**: Update package name references

Run `npm install` after updating package.json to regenerate with correct names:
```bash
cd vscode-extension && npm install
```

#### 3. Update README Documentation
**File**: `vscode-extension/README.md`
**Changes**: Update title, badges, description, section headings

```markdown
# Claude Feedback

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/nstrayer.claude-feedback)](https://marketplace.visualstudio.com/items?itemName=nstrayer.claude-feedback)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/nstrayer.claude-feedback)](https://marketplace.visualstudio.com/items?itemName=nstrayer.claude-feedback)
[![Open VSX Version](https://img.shields.io/open-vsx/v/nstrayer/claude-feedback)](https://open-vsx.org/extension/nstrayer/claude-feedback)

A VSCode extension for adding and managing feedback tags in markdown files, designed for Claude development workflows and plan iteration.

[... rest of content ...]

## Usage with Claude

These tags are processed by Claude commands when iterating on implementation plans. The extension provides visual feedback markers and a convenient interface for managing feedback throughout your development process.
```

#### 4. Update Extension Activation Message
**File**: `vscode-extension/src/extension.ts`
**Changes**: Update console log message

```typescript
// Line 44
console.log('Claude Feedback extension activated');
```

#### 5. Update Repository URLs
**File**: `vscode-extension/package.json`
**Changes**: Consider if repository should be renamed (optional)

Keep as-is if repository name won't change:
```json
"repository": {
  "type": "git",
  "url": "https://github.com/nstrayer/claude-planning.git"
}
```

#### 6. Rebuild Extension Package
**Commands**: Compile and package with new name

```bash
cd vscode-extension
npm run compile
npm run package
# This will create claude-feedback-1.0.0.vsix
```

#### 7. Update GitHub Workflow
**File**: `.github/workflows/publish-vscode-extension.yml`
**Changes**: Update VSIX filename in packaging step

```yaml
# Line 304
- name: Package extension
  run: npm run package -- --out claude-feedback-${{ steps.version.outputs.version }}.vsix

# Line 309
- name: Upload .vsix to GitHub Release
  with:
    files: vscode-extension/claude-feedback-${{ steps.version.outputs.version }}.vsix
```

### Success Criteria:

#### Automated Verification:
- [ ] Package.json is valid: `cd vscode-extension && node -e "require('./package.json')"`
- [ ] TypeScript compiles: `cd vscode-extension && npm run compile`
- [ ] Extension packages successfully: `cd vscode-extension && npm run package`
- [ ] New VSIX file created: `test -f vscode-extension/claude-feedback-*.vsix`

#### Manual Verification:
- [ ] Extension installs from VSIX with new name
- [ ] Extension appears as "Claude Feedback" in VS Code
- [ ] All commands still work correctly
- [ ] Feedback tree view displays properly
- [ ] No console errors on activation

---

## Testing Strategy

### Local Testing:
1. Uninstall old "BootAndShoe Feedback Tags" extension
2. Install new `claude-feedback-1.0.0.vsix`
3. Open markdown file with existing feedback
4. Verify all features work:
   - Add feedback
   - Navigate feedback
   - Delete feedback
   - Tree view updates

### Pre-Publishing Checklist:
1. Search codebase for any remaining "bootandshoe" references
2. Verify package.json has all required fields
3. Test VSIX installation on clean VS Code instance
4. Check that old marketplace listing won't conflict

## Publishing Notes

After renaming:
1. This creates a NEW marketplace listing (not an update)
2. Old extension (`bootandshoe-feedback-tags`) could be deprecated with notice
3. Update any documentation that references the old extension name
4. Users will need to manually switch to the new extension

## Migration for Users

Users with the old extension installed should:
1. Export/note any important feedback in current files
2. Uninstall "BootAndShoe Feedback Tags"
3. Install "Claude Feedback" from marketplace
4. Existing feedback markers in files will work unchanged

## References

- Current package.json: `vscode-extension/package.json`
- Extension source: `vscode-extension/src/extension.ts`
- Publishing workflow: `.github/workflows/publish-vscode-extension.yml`
- Original requirement: `TODOs.md:3`