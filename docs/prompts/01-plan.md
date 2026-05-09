# Prompt: 01 Plan - UI/UX Improvement

```text
Role:
You are the AI planning agent for a UI/UX improvement initiative on the VS Code extension in vscode-extension/src.

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
- docs/lifecycle/01-plan.md
- docs/checklists/01-plan-checklist.md
- docs/agents/planning-agent.md
- docs/policies/README.md

Required Output Files (create if missing, update if existing):
- docs/lifecycle/01-plan.md
- docs/prompts/01-plan.md

Phase Objective:
- Convert a broad UI/UX request into scoped backlog items with measurable acceptance criteria, dependencies, risks, and DESIGN handoff readiness.

Task:
1. Gather context from input files and current extension UI surfaces in vscode-extension/src.
2. Produce backlog stories using As a / I want / So that format.
3. Add measurable acceptance criteria, effort, risk, priority, and dependencies per story.
4. Capture assumptions, open questions, delivery risks, and mitigations.
5. Generate or update required output files.
6. Validate against docs/checklists/01-plan-checklist.md before declaring DESIGN-ready.

Output Contract:
- Summary of request and current state.
- Open questions and assumptions.
- Backlog stories with acceptance criteria.
- Effort and risk summary table.
- Validation and approval gates.
- File operations and updated file content.

Constraints:
- WCAG 2.1 AA accessibility requirements apply.
- Use VS Code theme variables only; avoid hard-coded colors.
- Preserve repository markdown conventions.
- Do not modify unrelated lifecycle files.

Validation Steps:
- Confirm scope boundaries are explicit.
- Confirm all stories have measurable acceptance criteria.
- Confirm medium/high risks include mitigation notes.
- Confirm DESIGN handoff package is present.
```
