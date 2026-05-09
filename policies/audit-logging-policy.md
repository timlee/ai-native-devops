# Audit Logging Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define audit logging, traceability, evidence retention, and tamper-resistance requirements.

## Scope

Applies to repositories, CI/CD systems, deployments, production access, security tools, AI agent actions, cloud resources, and compliance evidence.

## Mandatory Rules

- Security-relevant and production-impacting actions must be logged.
- Audit logs must identify actor, action, target, timestamp, and outcome where available.
- AI agent actions must be traceable to workflow runs, tickets, PRs, or commands.
- Audit logs must be protected against unauthorized modification.
- Retention periods must meet requirements.
- Privileged actions must be reviewed periodically.
- Audit logs must not contain secrets or excessive sensitive data.
- Failed access attempts and policy violations must be monitored.
- Required evidence must be reproducible or stored in approved locations.
- Log deletion outside retention process is prohibited.

## Required Checks

- Audit log collection
- Retention configuration review
- Privileged action review
- AI activity traceability check
- Log integrity control
- Access review
- Policy violation monitoring

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Summarize audit evidence
- Identify missing traceability
- Avoid secrets in logs or reports
- Explain suspicious patterns for review
- Document AI-generated actions clearly

## Human Responsibilities

- Maintain audit configuration
- Review privileged events
- Respond to audit requests
- Approve retention settings
- Investigate tampering or missing evidence

## Required Evidence and Artifacts

- Audit logs
- Workflow run records
- Deployment records
- Access logs
- Approval records
- Evidence retention reports

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

