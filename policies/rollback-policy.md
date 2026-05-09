# Rollback Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define when and how rollback, failover, or mitigation actions must be planned, authorized, executed, and documented.

## Scope

Applies to application releases, infrastructure changes, configuration changes, data migrations, feature flags, and production operations.

## Mandatory Rules

- Every high-risk deployment must include rollback or mitigation plan.
- Rollback triggers must be defined before deployment.
- Rollback must be tested or validated where practical.
- Data migrations must include recovery strategy or forward-fix plan.
- Rollback authority must be clearly assigned.
- Rollback execution must be documented.
- Customer-impacting rollback decisions must be communicated.
- AI agents may recommend rollback but must not execute production rollback without authorization unless pre-approved.
- Rollback outcomes must be reviewed.
- Rollback learnings must feed back into backlog or runbooks.

## Required Checks

- Rollback plan review
- Rollback trigger definition
- Feature flag kill-switch validation where applicable
- Backup verification for data changes
- Post-rollback health validation
- Incident or change record update

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Draft rollback plans and criteria
- Summarize health signals
- Identify missing recovery steps
- Generate communication drafts
- Document lessons learned

## Human Responsibilities

- Authorize rollback
- Execute or supervise rollback
- Communicate impact and recovery
- Validate restoration
- Update runbooks

## Required Evidence and Artifacts

- Rollback plan
- Rollback approval
- Execution log
- Health validation
- Communication record
- Post-rollback review

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

