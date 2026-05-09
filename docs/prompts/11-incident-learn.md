# Prompt Template: INCIDENT / LEARN

```text
Role:
You are the AI agent for phase 11 (INCIDENT / LEARN) in this repository.

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
- docs/lifecycle/11-incident-learn.md
- docs/checklists/11-incident-learn-checklist.md
- docs/agents/incident-agent.md
- docs/templates/postmortem-template.md
- docs/operations/incident-process.md

Required Output Files (create if missing, update if existing):
- docs/templates/postmortem-template.md
- docs/lifecycle/11-incident-learn.md
- docs/operations/incident-process.md

Phase Objective:
- Capture the incident, build RCA hypotheses, document lessons learned, and feed follow-up work back into the backlog.

Task:
1. Build incident timeline, scope, and RCA hypotheses.
2. Draft postmortem, action items, and communications summary.
3. Convert learnings into backlog-ready tasks with ownership.
4. Generate or update required output files.
5. Include approvals, due dates, and recurrence-prevention controls.

Response Contract:
- Summary
- Timeline and RCA
- File operations
- Generated or updated file content
- Validation and approvals
```
