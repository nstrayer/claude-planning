---
description: Create a new release tag and push to GitHub
---

# New Release

Create a new semantic version release tag and push it to GitHub.

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

### Step 2: Determine Current Version

```bash
# Get latest version tag
git tag -l 'v*' --sort=-v:refname | head -1
```

- Parse the tag into major.minor.patch components
- If no tags exist, treat current version as `v0.0.0`

### Step 3: Ask for Release Type

Use `AskUserQuestion` to ask the user what type of release this is:

- **Major** (breaking changes): `v1.2.3` → `v2.0.0`
- **Minor** (new features): `v1.2.3` → `v1.3.0`
- **Patch** (bug fixes): `v1.2.3` → `v1.2.4`

Calculate the next version based on their selection.

### Step 4: Confirm and Create Release

Show the user:
```
Current version: v1.2.3
New version: v1.3.0
Release type: minor

This will:
1. Create annotated tag v1.3.0
2. Push tag to origin
```

Then execute:
```bash
# Create annotated tag
git tag -a v{VERSION} -m "Release v{VERSION}"

# Push tag to origin
git push origin v{VERSION}
```

### Step 5: Report Success

Confirm the release was created and provide the GitHub releases URL:
```
Release v1.3.0 created and pushed!

View on GitHub: https://github.com/{owner}/{repo}/releases/tag/v{VERSION}
```

## Error Handling

- **Dirty working directory**: List the uncommitted files and ask user to commit or stash them
- **Wrong branch**: Tell user to switch to main branch first
- **Behind remote**: Tell user to pull latest changes first
- **Tag already exists**: This shouldn't happen if version calculation is correct, but inform user if it does
