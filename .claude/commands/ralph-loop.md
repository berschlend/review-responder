# Ralph Loop - Autonomous Development Loop

Parse the user's arguments for:
- `prompt`: The main task description (required)
- `--max-iterations N`: Maximum iterations before force-stop (default: 20)
- `--completion-promise "TEXT"`: The promise text that signals completion (default: "DONE")

## Instructions

You are entering an autonomous development loop. Your goal is to complete the task iteratively until you can honestly output the completion promise.

### Rules:
1. **Work autonomously** - Don't ask for user input unless absolutely blocked
2. **Iterate** - After each significant change, review your work and improve
3. **Test** - Run tests after changes, fix failures before continuing
4. **Commit often** - Small, atomic commits with clear messages
5. **Track progress** - Update your mental model of what's done vs remaining

### Completion:
When you have FULLY completed the task and verified it works:
1. Run final tests
2. Commit all changes
3. Output: `<promise>{{completion-promise}}</promise>`

### If Stuck:
- Try a different approach
- Simplify the solution
- Break into smaller steps
- After 3 failed attempts at same problem, output the promise with notes

### Loop State:
This session is iteration {{iteration}} of max {{max-iterations}}.

---

## Your Task:

{{prompt}}

---

Begin working. Remember: output `<promise>{{completion-promise}}</promise>` only when truly complete.
