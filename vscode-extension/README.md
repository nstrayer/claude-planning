# BootAndShoe Feedback Tags

VS Code extension for adding feedback tags in markdown files, designed for the bootandshoe iterate plan workflow.

## Features

### Add Feedback Tag (Selection)
- Select text in a markdown file
- Right-click → "Add Feedback Tag" or use `Cmd+Shift+F` (Mac) / `Ctrl+Shift+F` (Windows/Linux)
- Wraps selected text in `<feedback>` tags

### Add Feedback with Comment
- Select text → Right-click → "Add Feedback Tag with Comment"
- Enter an optional comment explaining the feedback
- Creates structured feedback with embedded comment

### Add General Feedback (File-Level)
- Right-click anywhere → "Add General Feedback for File" or use `Cmd+Shift+G`
- Enter overall feedback for the entire file
- Adds `<general-feedback>` tag at the end of the file

## Usage with BootAndShoe

These tags are processed by bootandshoe commands:
- `/iterate_plan` - Processes feedback when updating plans
- `/review_plan` - Collects and organizes feedback during reviews

## Installation

1. Clone this repository
2. Open `vscode-extension/` in VS Code
3. Run `npm install`
4. Press F5 to launch Extension Development Host
5. Test with any markdown file

## Building

```bash
cd vscode-extension
npm run compile
```
