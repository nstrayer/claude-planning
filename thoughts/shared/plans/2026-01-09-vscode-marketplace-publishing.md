# VSCode Extension Marketplace Publishing Infrastructure

## Overview

Set up automated publishing of the BootAndShoe Feedback Tags VSCode extension to both the Visual Studio Code Marketplace and Open VSX Registry using GitHub Actions. Publishing will trigger on every GitHub release, with version numbers synced from release tags.

## Current State Analysis

The extension exists at `vscode-extension/` with basic functionality but lacks marketplace publishing infrastructure:

- **package.json**: Has basic metadata but missing `repository`, `license`, `icon`, and `keywords` fields
- **No LICENSE file**: Required for marketplace listing
- **No icon**: Marketplace listings benefit from visual branding
- **No publishing tools**: `@vscode/vsce` and `ovsx` packages not installed
- **No publishing scripts**: Only `compile`, `watch`, and `lint` scripts exist
- **No marketplace workflow**: GitHub workflows create releases but don't publish to marketplaces

### Key Discoveries:
- Publisher field set to `bootandshoe` in `vscode-extension/package.json:6` (will change to `nstrayer`)
- `vscode:prepublish` script exists at `vscode-extension/package.json:119` (runs compile)
- `.vscodeignore` properly configured to exclude source files
- Existing release workflow at `.github/workflows/release.yml` can be extended

## Desired End State

After implementation:
1. Every GitHub release automatically publishes the extension to both marketplaces
2. Version numbers sync from GitHub release tags
3. `.vsix` artifact attached to GitHub releases for manual testing
4. Extension discoverable and installable from both VS Code Marketplace and Open VSX

### Verification:
- Extension appears on VS Code Marketplace at `https://marketplace.visualstudio.com/items?itemName=nstrayer.bootandshoe-feedback-tags`
- Extension appears on Open VSX at `https://open-vsx.org/extension/nstrayer/bootandshoe-feedback-tags`
- Running `ext install nstrayer.bootandshoe-feedback-tags` in VS Code installs the extension

## What We're NOT Doing

- Creating a CHANGELOG.md file
- Setting up pre-release/beta channels

**Clarification on version bumping**: The workflow in Phase 3 already handles automated version bumping - it extracts the version from the release tag and updates package.json before publishing. No separate setup needed.

## Implementation Approach

The implementation proceeds in four phases:
1. Add required metadata and assets to the extension
2. Install publishing tools and add scripts
3. Create the GitHub Actions publishing workflow
4. Document manual setup steps for marketplace accounts

---

## Phase 1: Add Required Metadata and Assets

### Overview
Add missing package.json fields, LICENSE file, and placeholder icon required for marketplace listing.

### Changes Required:

#### 1. Update package.json metadata
**File**: `vscode-extension/package.json`
**Changes**: Add repository, license, icon, keywords, and homepage fields

```json
{
  "name": "bootandshoe-feedback-tags",
  "displayName": "BootAndShoe Feedback Tags",
  "description": "Add feedback tags for bootandshoe iterate plan workflow",
  "version": "1.0.0",
  "publisher": "nstrayer",
  "license": "MIT",
  "icon": "images/icon.png",
  "repository": {
    "type": "git",
    "url": "https://github.com/nstrayer/claude-planning.git"
  },
  "homepage": "https://github.com/nstrayer/claude-planning/tree/main/vscode-extension",
  "bugs": {
    "url": "https://github.com/nstrayer/claude-planning/issues"
  },
  "keywords": [
    "feedback",
    "markdown",
    "bootandshoe",
    "planning",
    "claude"
  ],
  "engines": {
    ...
  }
}
```

#### 2. Create MIT LICENSE file
**File**: `vscode-extension/LICENSE`
**Changes**: Create new file with MIT license text

```
MIT License

Copyright (c) 2026 Nick Strayer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

#### 3. Copy existing icon to images folder
**File**: `vscode-extension/images/icon.png`
**Changes**: Copy the existing icon to the expected location

```bash
mkdir -p vscode-extension/images
cp vscode-extension/claude-feedback.png vscode-extension/images/icon.png
```

The icon at `vscode-extension/claude-feedback.png` has already been created and will be used for the marketplace listing.

#### 4. Update .vscodeignore
**File**: `vscode-extension/.vscodeignore`
**Changes**: Ensure images folder is included but unnecessary files excluded

```
.vscode/**
.vscode-test/**
src/**
.gitignore
tsconfig.json
**/*.map
**/*.ts
.eslintrc.json
node_modules/**
!node_modules/@vscode/vsce/**
```

#### 5. Add marketplace badges to README
**File**: `vscode-extension/README.md`
**Changes**: Add badges at the top of the README showing marketplace status

Add the following badges at the top of the README (after the title):

```markdown
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/nstrayer.bootandshoe-feedback-tags)](https://marketplace.visualstudio.com/items?itemName=nstrayer.bootandshoe-feedback-tags)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/nstrayer.bootandshoe-feedback-tags)](https://marketplace.visualstudio.com/items?itemName=nstrayer.bootandshoe-feedback-tags)
[![Open VSX Version](https://img.shields.io/open-vsx/v/nstrayer/bootandshoe-feedback-tags)](https://open-vsx.org/extension/nstrayer/bootandshoe-feedback-tags)
```

**Note**: These badges will show "not found" until the extension is published, but having them in place means they'll automatically work once publishing is complete.

### Success Criteria:

#### Automated Verification:
- [x] package.json is valid JSON: `cd vscode-extension && node -e "require('./package.json')"`
- [x] LICENSE file exists: `test -f vscode-extension/LICENSE`
- [x] Icon file exists: `test -f vscode-extension/images/icon.png`
- [x] TypeScript compiles: `cd vscode-extension && npm run compile`

#### Manual Verification:
- [x] Icon displays correctly when viewed
- [x] LICENSE file contains correct copyright holder name

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to the next phase.

---

## Phase 2: Install Publishing Tools and Scripts

### Overview
Add vsce and ovsx packages and create npm scripts for packaging and publishing.

### Changes Required:

#### 1. Install publishing dependencies
**File**: `vscode-extension/package.json`
**Changes**: Add @vscode/vsce and ovsx to devDependencies

Run:
```bash
cd vscode-extension && npm install --save-dev @vscode/vsce ovsx
```

This adds to devDependencies:
```json
{
  "devDependencies": {
    "@vscode/vsce": "^3.0.0",
    "ovsx": "^0.9.0",
    ...existing deps...
  }
}
```

#### 2. Add packaging and publishing scripts
**File**: `vscode-extension/package.json`
**Changes**: Add scripts for packaging and publishing

```json
{
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "lint": "eslint src --ext ts",
    "package": "vsce package",
    "publish:vsce": "vsce publish",
    "publish:ovsx": "ovsx publish"
  }
}
```

### Success Criteria:

#### Automated Verification:
- [x] Dependencies install without errors: `cd vscode-extension && npm ci`
- [x] Package script creates .vsix file: `cd vscode-extension && npm run package`
- [x] Generated .vsix file exists: `test -f vscode-extension/*.vsix`

#### Manual Verification:
- [x] .vsix file can be installed locally in VS Code (Extensions > Install from VSIX)
- [x] Extension activates and works correctly after local installation

**Implementation Note**: After completing this phase, test the .vsix installation locally before proceeding.

---

## Phase 3: Create GitHub Actions Publishing Workflow

### Overview
Create a workflow that triggers on GitHub releases, extracts version from tag, builds and packages the extension, uploads .vsix to the release, and publishes to both marketplaces.

### Changes Required:

#### 1. Create publishing workflow
**File**: `.github/workflows/publish-vscode-extension.yml`
**Changes**: Create new workflow file

```yaml
name: Publish VSCode Extension

on:
  release:
    types: [published]

jobs:
  publish:
    name: Publish Extension
    runs-on: ubuntu-latest

    # Only run for releases that look like version tags
    if: startsWith(github.event.release.tag_name, 'v')

    defaults:
      run:
        working-directory: vscode-extension

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: vscode-extension/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Extract version from tag
        id: version
        run: |
          # Remove 'v' prefix from tag (v1.2.3 -> 1.2.3)
          VERSION="${GITHUB_REF_NAME#v}"
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "Extracted version: $VERSION"

      - name: Update package.json version
        run: |
          npm version ${{ steps.version.outputs.version }} --no-git-tag-version --allow-same-version

      - name: Run linting
        run: npm run lint

      - name: Compile TypeScript
        run: npm run compile

      - name: Package extension
        run: npm run package -- --out bootandshoe-feedback-tags-${{ steps.version.outputs.version }}.vsix

      - name: Upload .vsix to GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: vscode-extension/bootandshoe-feedback-tags-${{ steps.version.outputs.version }}.vsix
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Publish to VS Code Marketplace
        run: npm run publish:vsce
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}

      - name: Publish to Open VSX Registry
        run: npm run publish:ovsx -- -p ${{ secrets.OVSX_PAT }}
        env:
          OVSX_PAT: ${{ secrets.OVSX_PAT }}
```

### Success Criteria:

#### Automated Verification:
- [x] Workflow file is valid YAML: `python -c "import yaml; yaml.safe_load(open('.github/workflows/publish-vscode-extension.yml'))"`
- [x] Workflow appears in GitHub Actions tab after push

#### Manual Verification:
- [x] Creating a test release (e.g., v1.0.1) triggers the workflow
- [x] Workflow completes successfully (requires secrets to be configured first)
- [x] .vsix file appears as release asset

**Implementation Note**: This workflow will fail until secrets are configured in Phase 4.

---

## Phase 4: Configure Marketplace Accounts and Secrets

### Overview
This phase requires manual setup outside of code changes. Document the steps needed to create marketplace accounts and configure GitHub secrets.

### Manual Setup Required:

#### 1. Create Azure DevOps Organization and Publisher (for VS Code Marketplace)

1. Go to https://dev.azure.com/
2. Sign in with Microsoft account
3. Create a new organization if you don't have one
4. Go to https://marketplace.visualstudio.com/manage/createpublisher
5. Create publisher with ID: `nstrayer`
6. Fill in display name, description, etc.

#### 2. Generate VS Code Marketplace Personal Access Token (VSCE_PAT)

1. In Azure DevOps, click User Settings (top right) > Personal Access Tokens
2. Click "New Token"
3. Name: `vsce-publish` (or similar)
4. Organization: Select "All accessible organizations"
5. Expiration: Set appropriately (max 1 year)
6. Scopes: Click "Custom defined", then:
   - Find "Marketplace" section
   - Check "Manage" (full access to publish)
7. Click Create and copy the token immediately

#### 3. Create Open VSX Account and Token (OVSX_PAT)

1. Go to https://open-vsx.org/
2. Sign in with GitHub account
3. Go to https://open-vsx.org/user-settings/tokens
4. Create access token with description: `github-actions`
5. Copy the token immediately

#### 4. Create Namespace on Open VSX

1. Go to https://open-vsx.org/create-namespace
2. Create namespace: `nstrayer`
3. This allows publishing extensions under this publisher ID

#### 5. Add Secrets to GitHub Repository

1. Go to repository Settings > Secrets and variables > Actions
2. Add new repository secrets:
   - `VSCE_PAT`: Paste the Azure DevOps token from step 2
   - `OVSX_PAT`: Paste the Open VSX token from step 3

### Success Criteria:

#### Manual Verification:
- [x] Publisher `nstrayer` exists on VS Code Marketplace
- [x] Namespace `nstrayer` exists on Open VSX
- [x] `VSCE_PAT` secret configured in GitHub repository
- [x] `OVSX_PAT` secret configured in GitHub repository
- [x] Test release triggers workflow and publishes successfully to both marketplaces
- [x] Extension installable via `ext install nstrayer.bootandshoe-feedback-tags`

---

## Testing Strategy

### Local Testing:
1. Run `npm run package` to create .vsix
2. Install .vsix in VS Code via Extensions > Install from VSIX
3. Verify extension activates on markdown files
4. Test feedback tag functionality

### CI Testing:
1. Create a test release (e.g., v1.0.1-test)
2. Verify workflow triggers and completes
3. Download .vsix from release assets
4. Install and verify functionality

### Marketplace Testing:
1. After successful publish, search for extension in VS Code
2. Install from marketplace
3. Verify all features work

## Rollback Strategy

If a bad version is published:
1. VS Code Marketplace: Use the Manage Publishers portal to unpublish/remove the version
2. Open VSX: Use the web interface or `ovsx unpublish` command
3. GitHub: Delete the release and re-tag with fixed version

## References

- VS Code Extension Publishing: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- Open VSX Publishing: https://github.com/eclipse/openvsx/wiki/Publishing-Extensions
- vsce documentation: https://github.com/microsoft/vscode-vsce
- ovsx documentation: https://github.com/eclipse/openvsx/tree/master/cli
- Existing extension: `vscode-extension/package.json`
- Existing release workflow: `.github/workflows/release.yml`
