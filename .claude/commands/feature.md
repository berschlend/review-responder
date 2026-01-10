# Feature Implementation Command

You are executing the `/feature` command for ReviewResponder.

## Boris Cherny Workflow:

### Step 1: RESEARCH (No Code Yet!)
- Read all relevant files
- Understand current implementation
- Check CLAUDE.md for constraints
- Ask clarifying questions if needed

### Step 2: PLAN (Use Plan Mode!)
- Create detailed implementation plan
- List all files that need changes
- Identify potential risks
- Show plan to user for approval
- Iterate on plan until user says "go"

### Step 3: IMPLEMENT
- Switch to auto-accept edit mode (after plan approved)
- Implement according to plan
- Make atomic, focused changes
- Update CLAUDE.md if new patterns emerge

### Step 4: TEST
- Run relevant tests (if exist)
- Manual verification checklist
- Test in Chrome Extension (if UI changes)
- Fix any issues before proceeding

### Step 5: COMMIT & PUSH
- `git add -A`
- Meaningful commit message
- `git push -u origin <branch-name>`
- Retry with exponential backoff if needed

### Step 6: CREATE PR
- Use `gh pr create` with summary
- Include "## Summary" and "## Test plan"
- Reference relevant issues

## Remember:
- Research → Plan → Code → Test → PR
- NEVER skip planning phase
- ALWAYS test before push
- Update CLAUDE.md with learnings
