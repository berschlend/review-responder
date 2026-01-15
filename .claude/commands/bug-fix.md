# Bug Fix Command

You are executing the `/bug-fix` command for ReviewResponder.

## Workflow:

### Step 1: REPRODUCE

- Ask user for reproduction steps
- Read relevant error logs/screenshots
- Identify affected files
- Understand the bug completely

### Step 2: DIAGNOSE

- Read all related code
- Trace the root cause
- Check if similar issues exist elsewhere
- Check CLAUDE.md for known issues

### Step 3: PLAN FIX

- Propose solution approach
- Identify all files that need changes
- Consider edge cases
- Get user approval before coding

### Step 4: IMPLEMENT

- Make minimal, focused changes
- Fix root cause (not symptoms)
- Add defensive checks if needed
- Update CLAUDE.md if this was a recurring issue

### Step 5: VERIFY

- Test the specific bug scenario
- Test related functionality
- Ensure no regressions
- Manual testing checklist

### Step 6: COMMIT & PUSH

- `git add -A`
- Commit message: "Fix: [description]"
- `git push -u origin <branch-name>`
- Retry with backoff if network error

## Remember:

- Fix root cause, not symptoms
- Test thoroughly before push
- Document in CLAUDE.md if recurring pattern
- Keep changes minimal and focused
