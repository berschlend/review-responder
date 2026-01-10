#!/bin/bash
# Hook: Loggt alle wichtigen Bash Commands für Debugging

LOG_FILE=".claude/command-history.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Extrahiere Command aus TOOL_INPUT (simplified)
COMMAND=$(echo "$TOOL_INPUT" | head -1)

# Logge nur wichtige Commands
if echo "$COMMAND" | grep -qE "(git|npm|node|curl|psql)"; then
  echo "[$TIMESTAMP] $COMMAND" >> "$LOG_FILE"
fi

exit 0
