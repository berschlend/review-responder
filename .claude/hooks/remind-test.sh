#!/bin/bash
# Hook: Erinnert daran Tests zu laufen nach Code-Änderungen

# Check if backend files were modified
if echo "$TOOL_INPUT" | grep -qE "backend/.*\.js"; then
  echo ""
  echo "💡 REMINDER: Backend geändert - teste lokal mit:"
  echo "   cd backend && node server.js"
  echo ""
fi

# Check if frontend files were modified
if echo "$TOOL_INPUT" | grep -qE "frontend/.*\.(js|jsx|css)"; then
  echo ""
  echo "💡 REMINDER: Frontend geändert - teste lokal mit:"
  echo "   cd frontend && npm start"
  echo ""
fi

exit 0
