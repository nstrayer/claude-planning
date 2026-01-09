---
description: Promote the latest pre-release to a full release
---

# New Release

Promote the latest pre-release to a full release by triggering the GitHub Actions release workflow.

## Background

This repo uses a two-stage release process:
1. **Automatic pre-releases**: Every push to `main` triggers `prerelease.yml`, which creates a `v*.*.*-pre` tag based on conventional commits
2. **Manual promotion**: This command triggers `release.yml` to promote the latest pre-release to a full release

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

### Step 2: Find Latest Pre-release

```bash
gh release list --json tagName,isPrerelease --jq '.[] | select(.isPrerelease) | .tagName' | head -1
```

- If no pre-release exists, inform the user and stop
- Show the user which pre-release will be promoted (e.g., `v1.0.2-pre` → `v1.0.2`)

### Step 3: Confirm and Trigger Release

Show the user:
```
Pre-release to promote: v1.0.2-pre
Release version: v1.0.2

This will trigger the release workflow to:
1. Delete the pre-release tag
2. Create full release v1.0.2
```

Then execute:
```bash
gh workflow run release.yml
```

### Step 4: Report Success

```
Release workflow triggered!

The workflow will promote v1.0.2-pre to v1.0.2.
Monitor progress: gh run list --workflow=release.yml
View releases: https://github.com/{owner}/{repo}/releases
```

## Error Handling

- **Dirty working directory**: List the uncommitted files and ask user to commit or stash them
- **Wrong branch**: Tell user to switch to main branch first
- **Behind remote**: Tell user to pull latest changes first
- **No pre-release found**: Tell user to push changes to main first to create a pre-release
