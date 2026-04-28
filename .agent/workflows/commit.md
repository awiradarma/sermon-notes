---
description: how to commit and push code
---
When the user asks you to commit and push changes, you MUST ALWAYS bump the version in `package.json` before creating a git commit.

1. Ensure all changes are working.
// turbo
2. Run `npm version patch` (or minor/major if instructed otherwise).
// turbo
3. Commit the changes and push, usually via: `git add -A && git commit -m "Your precise commit message" && git push --follow-tags`
