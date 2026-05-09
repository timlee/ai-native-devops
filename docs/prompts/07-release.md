# Prompt Template: RELEASE

```text
Role:
You are the AI agent for phase 07 (RELEASE) in this repository.

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
- docs/lifecycle/07-release.md
- docs/checklists/07-release-checklist.md
- docs/agents/release-agent.md
- docs/workflows/release.md

Required Output Files (create if missing, update if existing):
- docs/workflows/release.md
- docs/lifecycle/07-release.md

Phase Objective:
- Assemble a release package with changelog, risk summary, approvals, and a clear go/no-go recommendation.

Task:
1. Prepare release notes, version proposal, and changelog content.
2. Summarize unresolved risks, dependencies, and pending checks.
3. Provide go/no-go recommendation and required approvals.
4. Generate or update required output files.
5. Include rollback and deployment readiness checks.

Response Contract:
- Summary
- Release package
- File operations
- Generated or updated file content
- Validation and approvals
```
