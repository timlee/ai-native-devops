#!/usr/bin/env bash
set -euo pipefail

echo "Validating AI-native DevOps repo structure..."
test -f AGENTS.md
test -f CLAUDE.md
test -f CODEX.md
test -f .github/copilot-instructions.md
test -d docs/lifecycle
test -d docs/prompts
test -d docs/policies
echo "OK: repository structure looks ready."
