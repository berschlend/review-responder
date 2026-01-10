# Beads System - Recursive TODO.md Management

> Inspired by [Steve Yegge's Beads](https://github.com/steveyegge/beads)

## What is This?

A **hierarchical TODO management system** that automatically injects relevant TODO context into every Claude Code session. Each directory can have its own `TODO.md` file, scoped to that directory and its subdirectories.

## How It Works

### Directory Scoping
- **Root `TODO.md`**: Project-wide tasks (marketing, infrastructure, general features)
- **`frontend/TODO.md`**: Frontend-specific tasks (UI/UX, React components, styling)
- **`backend/TODO.md`**: Backend-specific tasks (API endpoints, database, security)
- **`chrome-extension/TODO.md`**: Extension-specific tasks (Chrome Web Store, browser APIs)

### Automatic Injection
When a Claude Code session starts, the `SessionStart` hook automatically runs `.claude/hooks/inject-todos.sh`, which:

1. Finds all `TODO.md` files in the repository
2. Groups them by directory scope
3. Injects them into Claude's context with clear scope labels

## File Structure

```
review-responder/
├── TODO.md                      # Root: Project-wide tasks
├── .claude/
│   ├── settings.json            # Hook configuration
│   └── hooks/
│       └── inject-todos.sh      # TODO injection script
├── frontend/
│   └── TODO.md                  # Frontend-specific tasks
├── backend/
│   └── TODO.md                  # Backend-specific tasks
└── chrome-extension/
    └── TODO.md                  # Extension-specific tasks
```

## Configuration

### Hook Setup (`.claude/settings.json`)

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/inject-todos.sh",
            "statusMessage": "Injecting recursive TODO context..."
          }
        ]
      }
    ]
  }
}
```

### Injection Script (`.claude/hooks/inject-todos.sh`)

The script:
- Finds all TODO.md files recursively
- Displays each with directory scope
- Runs automatically on session start
- Can be run manually: `.claude/hooks/inject-todos.sh`

## Benefits

### For AI Agents
- **Context Awareness**: Claude knows what tasks exist and where they belong
- **Better Task Selection**: Can choose appropriate tasks based on current directory
- **Reduced Confusion**: Clear scope prevents mixing frontend/backend tasks

### For Developers
- **Organized TODOs**: Each component has its own task list
- **No Context Switching**: Jump into any directory and see relevant TODOs
- **Team Collaboration**: Different team members can manage different TODO files

## Best Practices

### 1. Keep TODOs Scoped
```markdown
# ✅ Good: Specific to directory
frontend/TODO.md:
- [ ] Fix responsive layout on mobile dashboard

# ❌ Bad: Too general
- [ ] Fix bugs
```

### 2. Use Clear Hierarchies
```markdown
## Current Sprint
- [ ] High priority task

## Backlog
- [ ] Future enhancement

## Bugs
- [ ] Known issues to fix
```

### 3. Update Regularly
- Mark tasks complete when done
- Add new tasks as they arise
- Remove obsolete tasks

### 4. Coordinate with CLAUDE.md
- **CLAUDE.md**: Long-term project memory, architecture, completed features
- **TODO.md**: Active tasks, current sprint, immediate work
- **Scoped TODO.md**: Component-specific tasks

## Managing TODOs with Claude

### You can have a separate Claude session that manages TODO organization:

```
User: "I want to add keyboard shortcuts to the dashboard"

Claude: "That's a frontend task. I'll add it to frontend/TODO.md:
- [ ] Implement keyboard shortcuts for dashboard navigation"
```

### The hook ensures all Claude sessions see the current state:

```
Session A (working on backend):
📂 SCOPE: backend
- [ ] Add caching for analytics queries
- [ ] Implement webhook system

Session B (working on frontend):
📂 SCOPE: frontend
- [ ] Implement keyboard shortcuts for dashboard
- [ ] Add dark mode toggle
```

## Example Workflow

### Adding a New Feature

1. **Planning Session** (optional dedicated Claude):
   ```
   User: "We need to add real-time notifications"
   Claude: "I'll break this down:
   - frontend/TODO.md: UI components for notifications
   - backend/TODO.md: WebSocket implementation
   - Root TODO.md: Testing and deployment"
   ```

2. **Implementation Session** (any Claude):
   ```
   Claude sees all TODOs automatically via SessionStart hook
   Claude: "I see the notification feature in both frontend and backend TODOs.
   Which component should I work on first?"
   ```

3. **Completion**:
   ```
   Claude marks completed tasks in the appropriate TODO.md file
   Next session automatically sees updated state
   ```

## Testing the System

### Manual Test
```bash
.claude/hooks/inject-todos.sh
```

### Verify Hook Installation
Check `.claude/settings.json` for the SessionStart hook configuration.

### Add Test TODO
Create a new TODO.md in any directory and verify it appears in the next session.

## Troubleshooting

### Hook Not Running
- Check `.claude/settings.json` syntax
- Verify script is executable: `chmod +x .claude/hooks/inject-todos.sh`
- Test manually: `.claude/hooks/inject-todos.sh`

### TODOs Not Found
- Ensure files are named exactly `TODO.md` or `Todo.md`
- Check if git repository is initialized (script uses `git rev-parse`)
- Verify files are not gitignored

### Too Much Context
- Consider consolidating TODO files
- Move completed tasks to a `DONE.md` archive
- Keep only active, actionable tasks

## Advanced Usage

### Custom Scopes
You can create TODO.md files at any directory level:

```
backend/
├── TODO.md                    # All backend tasks
├── api/
│   └── TODO.md               # API-specific tasks
└── database/
    └── TODO.md               # Database-specific tasks
```

### Integration with Other Systems

The hook can be extended to integrate with:
- GitHub Issues
- Jira/Linear
- Project management tools
- CI/CD pipelines

### Example Extension (Future)
```bash
# .claude/hooks/inject-todos.sh
# ...existing code...

# Also inject GitHub issues
gh issue list --label "current-sprint" --json title,body
```

## Related Systems

- **Beads**: The original inspiration - git-backed graph issue tracker
- **CLAUDE.md**: Project documentation and memory
- **Git Hooks**: Pre-commit, post-merge synchronization (future enhancement)

## Sources

- [Beads Revolution Article](https://steve-yegge.medium.com/the-beads-revolution-how-i-built-the-todo-system-that-ai-agents-actually-want-to-use-228a5f9be2a9)
- [Beads GitHub Repository](https://github.com/steveyegge/beads)
- [Beads Claude Code Integration](https://steveyegge.github.io/beads/integrations/claude-code)

---

> **Remember**: This system works best when TODO.md files are kept focused, actionable, and regularly updated. Think of them as the "active working memory" while CLAUDE.md is the "long-term memory" of your project.
