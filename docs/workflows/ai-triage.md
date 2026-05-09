# Workflow: ai-triage

## Purpose

This workflow defines how GitHub Actions and AI agents collaborate for `ai-triage` automation.

## Trigger Examples

- Issue label added
- Pull request opened or updated
- Workflow dispatch
- Schedule
- Security scan result
- Monitoring alert routed to GitHub issue

## Required Inputs

- Repository context
- Issue or PR reference
- Relevant logs or artifacts
- Required policy checks
- Target environment when applicable

## Expected Outputs

- Comment summary
- Pull request or workflow artifact
- Validation evidence
- Audit trail
- Next-step recommendation

## Guardrails

- Use least-privilege workflow permissions.
- Never expose secrets in logs.
- Do not deploy production without environment approval.
- Keep generated changes reviewable.
- Retain workflow artifacts when needed for compliance.
