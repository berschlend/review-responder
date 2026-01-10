# Update CLAUDE.md Command

You are executing the `/update-claude-md` command for ReviewResponder.

## What to Update:

### 1. CURRENT TASKS Section
- Move completed tasks from "NÄCHSTE CLAUDE TASKS" to "HEUTE ERLEDIGT"
- Add today's date if not present
- Use [x] for completed, [ ] for pending
- Remove irrelevant/stale tasks

### 2. Add New Completed Tasks
Format:
```
- [x] **Task Name** - Short description
  - Technical details if relevant
  - Files changed
  - Impact
```

### 3. Update BEKANNTE BUGS
- Remove fixed bugs
- Add newly discovered bugs
- Include reproduction steps

### 4. Document New Patterns
If Claude made a mistake during session:
- Add to relevant section
- Explain what went wrong
- Document correct approach

### 5. Update Feature Status
- Move features from backlog to COMPLETED FEATURES
- Update tech stack if new tools added
- Update API endpoints if new routes

### 6. Clean Up
- Remove outdated information
- Fix typos
- Ensure dates are current
- Keep file organized

## Format:
- Use German (matching existing style)
- Keep bullet points concise
- Include technical details
- Update "Stand:" date at top of CURRENT TASKS

## Don't:
- Don't remove important historical information
- Don't change project structure
- Don't add future tasks without user approval
- Don't make the file longer unnecessarily

After updating, show summary of changes to user.
