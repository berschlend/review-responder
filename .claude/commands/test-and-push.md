# Test & Push Command

You are executing the `/test-and-push` command for ReviewResponder.

## Workflow:

1. **Run Tests First**
   - Check if tests exist in the project
   - Run frontend tests: `cd frontend && npm test` (if exists)
   - Run backend tests: `cd backend && npm test` (if exists)
   - If NO tests exist, skip to manual verification

2. **Manual Verification Checklist**
   - Ask user: "Hast du die Changes manuell getestet?"
   - Wait for user confirmation

3. **Git Status Check**
   - Run `git status` to see all changes
   - Show user what will be committed

4. **Git Add & Commit**
   - `git add -A`
   - Create meaningful commit message based on changes
   - `git commit -m "message"`

5. **Push to Branch**
   - Check current branch name
   - `git push -u origin <branch-name>`
   - Retry up to 4x with exponential backoff (2s, 4s, 8s, 16s) if network error

6. **Confirm Success**
   - Show push result
   - Confirm: "✅ Pushed to <branch-name>"

## Important:

- NEVER skip testing/verification
- ALWAYS show git status before commit
- Use descriptive commit messages (German is OK)
