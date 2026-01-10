#!/bin/bash

# Beads-style recursive TODO.md injection hook
# This script finds all TODO.md files in the current directory tree
# and injects them into Claude's context with directory scope

set -euo pipefail

# Function to find all TODO.md files recursively from current directory upwards and downwards
find_todo_files() {
    local repo_root
    repo_root=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")

    # Find TODO.md files in repo root and all subdirectories
    find "$repo_root" \( -name "TODO.md" -o -name "Todo.md" \) -type f 2>/dev/null | sort
}

# Function to get relative path from repo root
get_relative_path() {
    local file_path="$1"
    local repo_root
    repo_root=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")

    if [[ "$file_path" == "$repo_root/TODO.md" ]] || [[ "$file_path" == "$repo_root/Todo.md" ]]; then
        echo "[ROOT]"
    else
        local dir_path
        dir_path=$(dirname "$file_path")
        echo "${dir_path#$repo_root/}"
    fi
}

# Main execution
main() {
    local todo_files
    mapfile -t todo_files < <(find_todo_files)

    if [[ ${#todo_files[@]} -eq 0 ]]; then
        # No TODO files found, exit silently
        exit 0
    fi

    echo ""
    echo "═══════════════════════════════════════════════════════════════════"
    echo "📋 RECURSIVE TODO CONTEXT (Beads-style)"
    echo "═══════════════════════════════════════════════════════════════════"
    echo ""
    echo "The following TODO.md files are active in this project hierarchy."
    echo "Each TODO.md file is scoped to its directory and subdirectories."
    echo ""

    for todo_file in "${todo_files[@]}"; do
        if [[ ! -f "$todo_file" ]]; then
            continue
        fi

        local scope
        scope=$(get_relative_path "$todo_file")

        echo "───────────────────────────────────────────────────────────────────"
        echo "📂 SCOPE: $scope"
        echo "───────────────────────────────────────────────────────────────────"
        echo ""
        cat "$todo_file"
        echo ""
        echo ""
    done

    echo "═══════════════════════════════════════════════════════════════════"
    echo "End of TODO context injection"
    echo "═══════════════════════════════════════════════════════════════════"
    echo ""
}

main "$@"
