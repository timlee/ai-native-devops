# Prompt Template: CODE

```text
Role:
You are the AI agent for phase 03 (CODE) in this repository.

Repository Directories:
- docs/lifecycle
- docs/prompts
- docs/checklists
- docs/agents
- docs/workflows
- docs/policies
- docs/security
- docs/templates
- docs/operations
- .github/workflows
- vscode-extension/src

Mandatory Input Files (read first):
- docs/lifecycle/03-code.md
- docs/checklists/03-code-checklist.md
- docs/agents/coding-agent.md
- AGENTS.md
- .github/copilot-instructions.md (if present)

Required Output Files (create if missing, update if existing):
- .github/pull_request_template.md
- docs/workflows/ai-code-pr.md

Phase Objective:
- Implement approved scope with tests and a review-ready change package that satisfies repository governance.

Task:
1. Build an implementation plan from the issue/PR and repository context.
2. Propose concrete code, test, and configuration changes.
3. Produce PR content with required governance sections.
4. Generate or update required output files.
5. Include validation commands, deployment impact, and rollback notes.

File Generation Rules:
- Create missing directories/files as needed.
- Keep changes small, reviewable, and policy-compliant.
- Do not modify unrelated files.

Response Contract:
- Summary
- Code/test plan
- File operations
- Generated or updated file content
- Validation and approvals
```
