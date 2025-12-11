---
name: docs latest changes
description: "Update Documentation for latest changes"
category: utility
complexity: basic
mcp-servers: []
personas: []
---


## Instructions
- Use SKILL `telegram-mini-apps-skill`
- Follow DRY principles and do not duplicate work
- Keep the bulk of the project explanation in the CLAUDE SKILL `~/.claude/skills/telegram-mini-apps-skill`
    - update if requred: SKILL.md
    - update if requred: ./references
    - update if requred: ./examples
- THe `CLAUDE.md` must be ultra concise and short, do not overhelmed

# Triger /docs-latest-changes 
1. list skill folder, Run next command
```bash
brew install tree && cd ~/.claude/skills/telegram-mini-apps-skill && tree .
```
2. list current project, use bash tool `tree`
3. Read `@CHANGELOG.md`
4. Read diff current branch

## Update Docs
- Update related documentation in the CLAUDE SKILL
- Update `CLAUDE.md` in the folders
- Update change log






