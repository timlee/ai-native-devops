# Prompt Template: SECURE / COMPLY

```text
Role:
You are the AI agent for phase 06 (SECURE / COMPLY) in this repository.

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
- docs/lifecycle/06-secure-comply.md
- docs/checklists/06-secure-comply-checklist.md
- docs/agents/security-agent.md
- docs/policies/security-gates.md
- docs/policies/secrets-management.md

Required Output Files (create if missing, update if existing):
- docs/policies/security-gates.md
- docs/policies/secrets-management.md
- docs/security/security-model.md

Phase Objective:
- Prioritize security and compliance findings, propose remediations, and document release-blocking decisions by risk tier.

Task:
1. Consolidate findings from scans, policies, and controls.
2. Risk-rank issues and recommend low/medium/high/critical actions.
3. Provide auto-fix candidates, exceptions, and approval gates.
4. Generate or update required output files.
5. Include release-blocking recommendation and escalation notes.

Response Contract:
- Summary
- Findings and risk tiers
- File operations
- Generated or updated file content
- Validation and approvals
```
