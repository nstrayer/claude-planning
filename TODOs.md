Next steps:

- [ ] Rename everything to claude-feedback for clarity.
- [x] Be smarter about detecting what a plan is. E.g. a format in the header that can be checked and the create plan command can generate.
- [x] Add ability to copy command and plan path to the clipboard for easy use in claude. E.g. copy `/bootandshoe:iterate_plan /path/to/plan.md` to clipboard.
- [ ] Look into making the IDs for the feedback more human-readable. Potentially using a small llm to generate meaningful names based on the area and content of the feedback. Does this actually improve performance?
- [x] Verify that release tags will also release the plugin and let claude code instances know that it can be updated.
- [ ] Add command that can look at a todo md file and generate a plan or plans for it automatically.
- [x] Add buttons in the action bar for sending to iterate plan and implement plan to claude code like we do with the iterate on feedback command. 