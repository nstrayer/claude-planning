---
description: Promote the latest pre-release to a full release
---

# New Release

Promote the latest pre-release to a full release by creating a GitHub release directly.

## Background

This repo uses a two-stage release process:
1. **Automatic pre-releases**: Every push to `main` triggers `prerelease.yml`, which creates a `v*.*.*-pre` tag based on conventional commits
2. **Manual promotion**: This command creates a full release directly, which triggers `publish-vscode-extension.yml` to publish the extension

## Workflow

### Step 1: Verify Git State

Run these checks and **stop if any fail**:

```bash
# Check for uncommitted changes
git status --porcelain

# Check current branch
git branch --show-current

# Fetch and check sync status
git fetch origin
git status
```

**Requirements:**
- Working directory must be clean (no uncommitted changes)
- Must be on `main` branch
- Must be up-to-date with origin/main

If any check fails, inform the user and stop. Do not proceed with the release.

### Step 2: Update Plugin Version Date

Update the plugin's date-based version in `.claude-plugin/marketplace.json` to today's date. This tells Claude Code that the plugin has been updated.

```bash
# Check current plugin version date
cat .claude-plugin/marketplace.json | grep -A1 '"source"' | grep version
```

If the date is not today's date (YYYY-MM-DD format):
1. Update the `version` field inside the `plugins` array to today's date
2. Commit and push the change:

```bash
git add .claude-plugin/marketplace.json
git commit -m "chore: update plugin version date"
git push origin main
```

3. Wait for the pre-release workflow to complete:

```bash
# Watch for the workflow to finish (wait ~30 seconds, then check)
gh run list --workflow=prerelease.yml --limit=1
```

If the version is already today's date, skip this step.

### Step 3: Find Latest Pre-release

```bash
gh release list --json tagName,isPrerelease --jq '.[] | select(.isPrerelease) | .tagName' | head -1
```

- If no pre-release exists, inform the user and stop
- Show the user which pre-release will be promoted (e.g., `v1.0.2-pre` → `v1.0.2`)

### Step 4: Create Release

Show the user:
```
Pre-release to promote: v1.0.2-pre
Release version: v1.0.2

Creating GitHub release...
```

Then execute:
```bash
# Get the release notes from the pre-release
gh release view "$PRERELEASE_TAG" --json body -q '.body' > /tmp/release-notes.md

# Update the changelog link to use the release tag
sed "s|${PRERELEASE_TAG}|${RELEASE_TAG}|g" /tmp/release-notes.md > /tmp/release-notes-updated.md

# Delete the pre-release (including its tag)
gh release delete "$PRERELEASE_TAG" --yes --cleanup-tag

# Create the full release (this will trigger the publish workflow via release event)
gh release create "$RELEASE_TAG" \
  --notes-file /tmp/release-notes-updated.md \
  --target main \
  --title "$RELEASE_TAG"

# Clean up temp files
rm /tmp/release-notes.md /tmp/release-notes-updated.md
```

### Step 5: Report Success

```
Release $RELEASE_TAG created successfully!

The publish workflow has been automatically triggered to:
- Build and package the VSCode extension
- Upload the .vsix file to the release
- Publish to VS Code Marketplace
- Publish to Open VSX Registry

Monitor progress: gh run list --workflow=publish-vscode-extension.yml --limit=1
View release: https://github.com/{owner}/{repo}/releases/tag/$RELEASE_TAG
```

## Error Handling

- **Dirty working directory**: List the uncommitted files and ask user to commit or stash them
- **Wrong branch**: Tell user to switch to main branch first
- **Behind remote**: Tell user to pull latest changes first
- **No pre-release found**: Tell user to push changes to main first to create a pre-release
