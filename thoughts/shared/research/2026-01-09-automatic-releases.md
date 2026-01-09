---
date: "2026-01-09T14:58:02-05:00"
researcher: nstrayer
git_commit: 368232033d50f8d691b69388fbacc860b2a42381
branch: main
repository: claude-plugins
topic: "Automatic releases and publishing workflow in claude-plugins project"
tags: [research, codebase, github-actions, releases, publishing, vscode-extension, claude-plugins]
status: complete
last_updated: 2026-01-09
last_updated_by: nstrayer
---

# Research: Automatic Releases and Publishing Workflow

**Date**: 2026-01-09 14:58:02 EST
**Researcher**: nstrayer
**Git Commit**: 368232033d50f8d691b69388fbacc860b2a42381
**Branch**: main
**Repository**: claude-plugins

## Research Question
How do automatic releases work in this project? Is there a way to just trigger a GitHub release and have the plugin and extension automatically published?

## Summary
The project implements a sophisticated two-stage automatic release process with full automation for VSCode extension publishing. Every push to main creates an automatic pre-release with semantic versioning based on conventional commits. When manually promoted to a full release, the VSCode extension is automatically packaged and published to both VS Code Marketplace and Open VSX Registry. Claude plugins themselves don't require separate publishing - they're distributed directly from GitHub repositories using the marketplace.json configuration.

## Detailed Findings

### Automatic Pre-release Creation
The project automatically creates pre-releases on every push to main:
- **Workflow**: [.github/workflows/prerelease.yml:1-144](https://github.com/nstrayer/claude-plugins/blob/368232033d50f8d691b69388fbacc860b2a42381/.github/workflows/prerelease.yml)
- **Trigger**: Push to main branch (lines 3-6)
- **Version determination**: Analyzes conventional commits (feat:, fix:, BREAKING CHANGE:) to determine semantic version bump (lines 41-92)
- **Release creation**: Creates/updates pre-release with tag format `v{VERSION}-pre` (lines 117-143)
- **Release notes**: Automatically generates categorized release notes from commit messages (lines 94-115)

### Manual Release Promotion
Full releases are created by promoting pre-releases:
- **Workflow**: [.github/workflows/release.yml:1-78](https://github.com/nstrayer/claude-plugins/blob/368232033d50f8d691b69388fbacc860b2a42381/.github/workflows/release.yml)
- **Trigger**: Manual via workflow_dispatch (line 4) or `/new-release` command
- **Process**: Finds latest pre-release, removes `-pre` suffix, deletes pre-release, creates full release (lines 24-77)
- **Command**: [.claude/commands/new_release.md:1-82](https://github.com/nstrayer/claude-plugins/blob/368232033d50f8d691b69388fbacc860b2a42381/.claude/commands/new_release.md) provides guided execution

### Automatic VSCode Extension Publishing
The VSCode extension is automatically published when a release is created:
- **Workflow**: [.github/workflows/publish-vscode-extension.yml:1-73](https://github.com/nstrayer/claude-plugins/blob/368232033d50f8d691b69388fbacc860b2a42381/.github/workflows/publish-vscode-extension.yml)
- **Trigger**: Release published event (lines 3-5)
- **Version extraction**: Strips 'v' prefix from git tag (lines 36-42)
- **Build process**: Lints, compiles, packages extension into .vsix file (lines 48-55)
- **Publishing targets**:
  - GitHub Release assets (lines 57-62)
  - VS Code Marketplace via `npm run publish:vsce` (lines 64-67)
  - Open VSX Registry via `npm run publish:ovsx` (lines 69-72)
- **Configuration**: [vscode-extension/package.json:171-178](https://github.com/nstrayer/claude-plugins/blob/368232033d50f8d691b69388fbacc860b2a42381/vscode-extension/package.json#L171-L178) defines publishing scripts

### Claude Plugin Distribution
Claude plugins use a different distribution model:
- **No centralized registry**: Plugins are distributed directly from GitHub repositories
- **Configuration**: [.claude-plugin/marketplace.json:1-22](https://github.com/nstrayer/claude-plugins/blob/368232033d50f8d691b69388fbacc860b2a42381/.claude-plugin/marketplace.json) defines plugin metadata
- **Installation**: Users install via `plugin install bootandshoe@bootandshoe-claude-planning`
- **Updates**: Claude Code checks marketplace.json version to detect updates
- **Validation**: [scripts/validate-plugins.js:1-342](https://github.com/nstrayer/claude-plugins/blob/368232033d50f8d691b69388fbacc860b2a42381/scripts/validate-plugins.js) validates structure in CI

### Validation Pipeline
All pushes and PRs trigger validation:
- **Workflow**: [.github/workflows/validate-plugins.yml:1-40](https://github.com/nstrayer/claude-plugins/blob/368232033d50f8d691b69388fbacc860b2a42381/.github/workflows/validate-plugins.yml)
- **Checks**: JSON schema validation, plugin source verification, agent/command file validation
- **Enforcement**: Blocks merging if validation fails

## Code References
- `.github/workflows/prerelease.yml:55-78` - Conventional commit parsing logic
- `.github/workflows/prerelease.yml:80-90` - Semantic version bump determination
- `.github/workflows/release.yml:30` - Pre-release detection using GitHub CLI
- `.github/workflows/publish-vscode-extension.yml:55` - Extension packaging command
- `vscode-extension/package.json:177-178` - Publishing scripts to marketplaces
- `.claude-plugin/marketplace.json:4` - Marketplace version that drives updates
- `scripts/validate-plugins.js:92-123` - JSON schema validation implementation

## Architecture Documentation

### Release Pipeline Architecture
The project implements a three-stage release pipeline:

1. **Continuous Pre-releases**: Every main branch commit triggers automatic pre-release creation with semantic versioning based on commit messages. Pre-releases serve as staging releases for testing.

2. **Controlled Promotion**: Manual promotion from pre-release to full release provides a checkpoint for human verification. This uses the same version number but removes the `-pre` suffix.

3. **Automatic Distribution**: Full releases trigger automatic publishing to multiple channels:
   - VSCode extension to VS Code Marketplace and Open VSX
   - GitHub Release with .vsix artifact
   - Claude plugin available via GitHub repository

### Version Management Strategy
The project uses different versioning strategies for different components:
- **Git tags**: Semantic versioning with 'v' prefix (v1.2.3) - auto-incremented
- **Marketplace version**: Semantic versioning without prefix (1.2.3) - auto-incremented from git tag
- **Plugin version**: Date-based versioning (2026-01-08) - manual
- **Extension version**: Matches git tag without prefix (1.2.3) - auto-incremented from git tag

### Concurrency Control
Both release workflows use the same concurrency group (`release`) with `cancel-in-progress: false` to prevent simultaneous release operations that could cause conflicts.

### Secret Management
Publishing requires two secrets configured in GitHub repository settings:
- `VSCE_PAT`: Personal Access Token for VS Code Marketplace
- `OVSX_PAT`: Personal Access Token for Open VSX Registry

## Historical Context (from thoughts/)
No existing research documents were found in thoughts/ directory related to automatic releases or publishing workflows. This appears to be the first comprehensive documentation of the release process.

## Related Research
This is the first research document in thoughts/shared/research/ about the release and publishing workflow.

## Open Questions
1. Could the release promotion step be automated based on test results or other criteria?
2. ~~Is there a way to automatically update the marketplace.json version during releases?~~ **Resolved** - Added automatic version update to prerelease.yml
3. Would it be beneficial to add a staging/beta channel for pre-releases?
4. Could the plugin validation be extended to include runtime testing?

## Updates

### 2026-01-09: Added automatic marketplace.json version updates
Added two new steps to `.github/workflows/prerelease.yml`:
1. **Update marketplace.json version** (lines 117-131): Compares current version with calculated next version, updates if different using `jq`
2. **Commit version update** (lines 133-140): Commits the change with `[skip ci]` to prevent infinite loops

This ensures marketplace.json version stays in sync with git tags automatically.

## Answer to Original Question

**Yes, there is partial automation for releases and publishing:**

1. **Automatic pre-releases**: Every push to main automatically creates a pre-release with proper versioning
2. **Manual trigger for full release**: Run `/new-release` command or trigger the release workflow manually
3. **Automatic VSCode extension publishing**: When a release is created, the extension is automatically published to both marketplaces
4. **Automatic Claude plugin availability**: Plugins are immediately available from GitHub - no separate publishing needed

To trigger a release that automatically publishes everything:
```bash
# Option 1: Use the Claude command
/new-release

# Option 2: Use GitHub CLI directly
gh workflow run release.yml

# This will:
# 1. Promote the latest pre-release to a full release
# 2. Automatically trigger VSCode extension publishing
# 3. Make the Claude plugin available at the new version
```

The only manual step is triggering the release promotion - everything else is automated.