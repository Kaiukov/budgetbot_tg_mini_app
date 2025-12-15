---
name: docs latest changes
description: "Update Documentation for latest changes"
category: utility
complexity: basic
mcp-servers: []
personas: []
---


## Instructions each step must be done: 
- Use SKILLs `telegram-mini-apps-skill`, `changelog-conciseness` PATH: `cd ~/.claude/skills && ll` list of skills
- Follow DRY principles and do not duplicate work
- Keep the bulk of the project explanation in the CLAUDE SKILL `~/.claude/skills/telegram-mini-apps-skill`
    - update if requred: SKILL.md 
    - list all filed ./references -> update if requred
    - list all filed ./examples -> update if requred
- The `@CLAUDE.md` must be ultra concise and short, do not overhelmed with details

# Triger /docs-latest-changes 
0. Make todo list for all tasks
1. list skill folder, Run next command
```bash
brew install tree && cd ~/.claude/skills/telegram-mini-apps-skill && tree . # Fetch file structure of skill, your tast find related files and update them. 
```
2. list current project, use bash tool `tree`
3. Get all `@CLAUDE.md` -> `rg --files -g 'CLAUDE.md'`
4. Read `@CHANGELOG.md`
5. Read diff current branch

## Update Docs
- Update related documentation in the CLAUDE SKILL
- Update `@CLAUDE.md` in the folders
- Update `@CHANGELOG.md`

## How to keep updated CLAUDE.md
### Example of CLAUDE.md
- {file_name}.{file_extension} - {ultra concise description}
    - functions1 - concise description
    - functions2 - concise description
- {file_name}.{file_extension} - {ultra concise description}
    - functions1 - concise description
    - functions2 - concise description

### Rules
- exclude `./CLAUDE.md` from root folder.






