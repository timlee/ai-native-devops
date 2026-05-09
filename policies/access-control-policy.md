# Access Control Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define identity, authorization, least privilege, and review requirements for repositories, tools, environments, and runtime systems.

## Scope

Applies to users, service accounts, AI agents, CI/CD systems, repositories, cloud resources, secret managers, and production systems.

## Mandatory Rules

- Access must follow least privilege.
- Privileged access must require strong authentication.
- Production access must be restricted and auditable.
- Shared user accounts are prohibited unless explicitly approved.
- Service accounts must have owners and documented purpose.
- AI agents must use scoped and revocable permissions.
- Access must be reviewed regularly.
- Departed users and retired automation accounts must be removed promptly.
- Emergency access must be time-bound and reviewed after use.
- Repository admin permissions must be limited.

## Required Checks

- Access review
- MFA enforcement
- CODEOWNERS for critical paths
- Environment protection rules
- Service account inventory
- Privileged action audit logs
- Emergency access records

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Operate only within granted permissions
- Do not request broad permanent access
- Escalate permission failures instead of bypassing controls
- Avoid workflows requiring excessive privileges
- Document required permissions for new automation

## Human Responsibilities

- Approve access requests
- Review privileged permissions
- Remove stale access
- Monitor abnormal activity
- Maintain service account ownership

## Required Evidence and Artifacts

- Access request records
- Approval records
- Access review reports
- Service account inventory
- Audit logs
- Emergency access logs

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

