# Release Tag Verification Plan

## Overview

Verify that release tags properly trigger plugin distribution and that Claude Code instances can detect and update to new versions.

## Current State Analysis

The repository has a two-stage release process:
1. **Prerelease**: Automatic on `main` pushes, creates tags like `v1.0.0-pre`
2. **Full Release**: Manual promotion removes `-pre` suffix

The VSCode extension publishes to marketplaces on full release, but the bootandshoe plugin itself is distributed via direct GitHub repository access.

### Key Discoveries:
- Release workflow at `.github/workflows/release.yml` creates full releases
- VSCode publishing at `.github/workflows/publish-vscode-extension.yml` triggers on `release: [published]`
- Plugin marketplace.json at `.claude-plugin/marketplace.json:4` has version `1.1.1`
- Plugin version in marketplace.json at line 16 is `2026-01-08` (date-based)
- No automated version bump for the bootandshoe plugin in release workflows

## Desired End State

After verification:
1. Release tags reliably trigger VSCode extension publishing
2. Plugin version in marketplace.json updates on release
3. Claude Code can detect available updates
4. Documentation exists for the release process

## What We're NOT Doing

- Changing the release workflow fundamentals
- Adding a plugin registry or database
- Building a custom update notification system
- Modifying Claude Code's plugin infrastructure

## Implementation Approach

Three phases: verify current workflows, add automated version bumping, and document the process.

---

## Phase 1: Verify Release Workflow End-to-End

### Overview
Manually test the complete release flow to identify any gaps or failures.

### Verification Steps:

#### 1. Test Prerelease Creation
```bash
# Make a small change to main branch
git checkout main
git pull
# Make trivial change (e.g., update version date in marketplace.json)
git commit -m "feat: test prerelease workflow"
git push
```

Expected: GitHub Actions creates prerelease with appropriate version bump.

Verification commands:
```bash
# Check prerelease was created
gh release list --limit 5

# Check workflow run status
gh run list --workflow=prerelease.yml --limit 1
gh run view <run-id>
```

#### 2. Test Release Promotion
```bash
# Trigger manual release workflow
gh workflow run release.yml

# Wait for completion and verify
gh release list --limit 5
```

Expected: Prerelease promoted to full release, `-pre` suffix removed.

#### 3. Test VSCode Extension Publishing
```bash
# Check if publish workflow triggered
gh run list --workflow=publish-vscode-extension.yml --limit 1

# Verify release has VSIX asset
gh release view <tag> --json assets
```

Expected: VSIX file attached to release, extension available on marketplaces.

Marketplace verification:
- VS Code Marketplace: `https://marketplace.visualstudio.com/items?itemName=nstrayer.bootandshoe-feedback-tags`
- Open VSX: `https://open-vsx.org/extension/nstrayer/bootandshoe-feedback-tags`

### Success Criteria:

#### Automated Verification:
- [ ] Prerelease workflow completes: `gh run view --workflow=prerelease.yml --exit-status`
- [ ] Release workflow completes: `gh run view --workflow=release.yml --exit-status`
- [ ] VSCode publish workflow completes: `gh run view --workflow=publish-vscode-extension.yml --exit-status`
- [ ] VSIX attached to release: `gh release view <tag> --json assets | grep vsix`

#### Manual Verification:
- [ ] Extension installable from VS Code Marketplace
- [ ] Extension installable from Open VSX
- [ ] Extension version matches release tag

---

## Phase 2: Add Automated marketplace.json Version Bump

### Overview
Update the release workflow to automatically bump the version in marketplace.json when creating releases.

### Changes Required:

#### 1. Update Prerelease Workflow
**File**: `.github/workflows/prerelease.yml`
**Changes**: Add step to update marketplace.json version

Add after the "Determine version" step:

```yaml
      - name: Update marketplace.json version
        run: |
          # Update the marketplace version
          jq --arg ver "${{ steps.version.outputs.new_version }}" \
            '.version = $ver' \
            .claude-plugin/marketplace.json > tmp.json && \
            mv tmp.json .claude-plugin/marketplace.json

          # Update the plugin version to today's date
          TODAY=$(date +%Y-%m-%d)
          jq --arg ver "$TODAY" \
            '.plugins[0].version = $ver' \
            .claude-plugin/marketplace.json > tmp.json && \
            mv tmp.json .claude-plugin/marketplace.json

      - name: Commit version update
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add .claude-plugin/marketplace.json
          git diff --cached --quiet || git commit -m "chore: bump marketplace version to ${{ steps.version.outputs.new_version }}"
          git push
```

#### 2. Alternative: Version Sync Script
**File**: `scripts/sync-versions.js` (new file)
**Changes**: Create script to sync versions across package files

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const version = process.argv[2];
if (!version) {
    console.error('Usage: node sync-versions.js <version>');
    process.exit(1);
}

// Update marketplace.json
const marketplacePath = path.join(__dirname, '..', '.claude-plugin', 'marketplace.json');
const marketplace = JSON.parse(fs.readFileSync(marketplacePath, 'utf8'));
marketplace.version = version;
marketplace.plugins[0].version = new Date().toISOString().split('T')[0]; // Today's date
fs.writeFileSync(marketplacePath, JSON.stringify(marketplace, null, 2) + '\n');

console.log(`Updated marketplace.json to version ${version}`);
```

Add to package.json scripts:
```json
"scripts": {
  "sync-versions": "node scripts/sync-versions.js"
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Prerelease updates marketplace.json version: `git show HEAD:marketplace.json | grep version`
- [ ] Version matches release tag format

#### Manual Verification:
- [ ] marketplace.json version increments with each release
- [ ] Plugin version date updates to release date

---

## Phase 3: Document Claude Code Update Detection

### Overview
Research and document how Claude Code detects plugin updates and notify users.

### Investigation Steps:

#### 1. Research Claude Code Plugin Update Mechanism
Claude Code plugins are installed from GitHub repositories. The update detection likely works by:
- Comparing installed version with marketplace.json version
- Using git to check for new commits/tags
- Periodic refresh of plugin registry

#### 2. Test Update Detection
```bash
# Install plugin
claude /plugin install bootandshoe@bootandshoe-claude-planning

# Check installed version
claude /plugins

# After new release, check if update available
claude /plugins  # Should show update indicator
```

#### 3. Document Findings
**File**: `docs/release-process.md` (new file)
**Content**: Document the complete release flow

```markdown
# Release Process

## Automated Releases

### Prerelease (Automatic)
Triggered on every push to `main`:
1. Analyzes commits for version bump type
2. Creates prerelease tag (v1.2.3-pre)
3. Updates marketplace.json version
4. Generates release notes

### Full Release (Manual)
Triggered manually via GitHub Actions:
1. Run "Release" workflow from Actions tab
2. Promotes latest prerelease to full release
3. Triggers VSCode extension publishing

## Version Numbers

- **Git tags**: Semantic versioning (v1.2.3)
- **marketplace.json version**: Same as git tag without 'v'
- **Plugin version**: Date-based (YYYY-MM-DD)
- **VSCode extension**: Same as git tag without 'v'

## Claude Code Updates

Users can update plugins via:
```
claude /plugin update bootandshoe
```

The plugin system checks the repository's marketplace.json version against the locally installed version.
```

### Success Criteria:

#### Manual Verification:
- [ ] Update detection works in Claude Code
- [ ] `/plugin update` command updates to latest
- [ ] Documentation accurately describes process

---

## Testing Strategy

### Pre-Release Testing:
1. Create test branch with version changes
2. Verify workflow dry-run output
3. Check version parsing logic

### Release Testing:
1. Create prerelease on test repository
2. Promote to full release
3. Verify all artifacts created
4. Test installation from marketplace

### Update Testing:
1. Install old version of plugin
2. Create new release
3. Verify Claude Code shows update available
4. Test update process

## Risk Mitigation

### If Workflow Fails:
- Check GitHub Actions logs for errors
- Verify secrets (VSCE_PAT, OVSX_PAT) are valid
- Ensure permissions are correct

### If Publishing Fails:
- Check marketplace account status
- Verify extension ID hasn't changed
- Check for conflicting versions

## References

- Prerelease workflow: `.github/workflows/prerelease.yml`
- Release workflow: `.github/workflows/release.yml`
- VSCode publishing: `.github/workflows/publish-vscode-extension.yml`
- Marketplace config: `.claude-plugin/marketplace.json`
- Original requirement: `TODOs.md:7`