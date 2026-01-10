#!/bin/bash
# Hook: Verhindert versehentliche Pushes auf main/master Branch

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

# Check if trying to push to main/master
if echo "$TOOL_INPUT" | grep -qE "git push.*origin.*(main|master)"; then
  echo "❌ BLOCKED: Versuche nicht auf main/master zu pushen!"
  echo "📍 Du bist auf Branch: $CURRENT_BRANCH"
  echo "✅ Nutze: git push -u origin $CURRENT_BRANCH"
  exit 1
fi

# Check if on main/master and trying to commit
if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
  if echo "$TOOL_INPUT" | grep -qE "git (commit|add)"; then
    echo "⚠️  WARNING: Du bist auf Branch '$CURRENT_BRANCH'!"
    echo "💡 Wechsel zu Feature Branch: claude/learn-claude-code-eKiGe"
    exit 1
  fi
fi

exit 0
