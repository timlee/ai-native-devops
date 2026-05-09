# Prompt Template: DEPLOY

```text
Role:
You are the AI agent for phase 08 (DEPLOY) in this repository.

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
- docs/lifecycle/08-deploy.md
- docs/checklists/08-deploy-checklist.md
- docs/agents/deploy-agent.md
- docs/policies/deployment-gates.md

Required Output Files (create if missing, update if existing):
- docs/workflows/deploy-staging.md
- docs/workflows/deploy-production.md
- docs/policies/deployment-gates.md

Phase Objective:
- Prepare a safe rollout plan with environment protections, verification steps, canary checkpoints, and rollback strategy.

Task:
1. Validate deployment readiness, manifests, and environment gates.
2. Produce rollout, canary, rollback, and incident escalation strategy.
3. Add health checks and post-deploy verification steps.
4. Generate or update required output files.
5. Include approvals, failure handling, and recovery expectations.

Response Contract:
- Summary
- Deployment plan
- File operations
- Generated or updated file content
- Validation and approvals
```
