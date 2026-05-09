# Secrets Management Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define how credentials, tokens, API keys, private keys, certificates, and other secrets are created, stored, rotated, accessed, and audited.

## Scope

Applies to all secrets used by applications, CI/CD systems, infrastructure, cloud services, developers, and AI agents.

## Mandatory Rules

- Secrets must not be committed to source control.
- Secrets must not be pasted into AI tools, tickets, logs, comments, or documentation.
- Secrets must be stored in approved secret managers or platform secret stores.
- Long-lived credentials should be avoided where short-lived federation is available.
- Production secrets must be separated from development and staging secrets.
- Access must follow least privilege.
- Secret access must be auditable.
- Leaked secrets must be revoked and rotated immediately.
- Secrets must not be printed in CI/CD logs.
- Secret rotation must follow documented schedules or event triggers.

## Required Checks

- Secret scanning in commits and PRs
- CI/CD log redaction
- Secret manager access review
- Credential rotation records
- OIDC or short-lived credential configuration where supported
- Environment-specific secret separation

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Never request or reveal raw secrets
- Use placeholders in examples
- Recommend secret manager integration
- Flag suspicious secret-like strings
- Escalate potential leaks
- Do not generate scripts that echo secrets

## Human Responsibilities

- Provision secrets through approved channels
- Review access grants
- Rotate secrets after exposure or personnel changes
- Confirm least privilege
- Maintain emergency revocation procedures

## Required Evidence and Artifacts

- Secret inventory
- Access review records
- Rotation logs
- Secret scan results
- Leak incident records
- Approval records

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

