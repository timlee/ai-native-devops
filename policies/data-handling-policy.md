# Data Handling Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define requirements for protecting sensitive, confidential, regulated, and production data throughout the DevOps lifecycle.

## Scope

Applies to source code, logs, metrics, traces, databases, test data, AI prompts, AI context, tickets, documentation, backups, and analytics.

## Mandatory Rules

- Sensitive data must be classified and handled according to classification.
- Production data must not be used in development or testing unless approved and masked.
- PII, secrets, credentials, and regulated data must not be sent to unapproved AI tools.
- Logs must not contain secrets, full tokens, passwords, private keys, or unnecessary personal data.
- Data retention requirements must be documented.
- Data access must follow least privilege.
- Data exports must be encrypted and tracked.
- Test data must be synthetic, anonymized, or minimized where possible.
- Deletion and retention obligations must be respected.
- Data incidents must be escalated immediately.

## Required Checks

- Data classification review
- PII/secret scanning in logs where possible
- Access review
- Retention policy validation
- Data masking checks
- Backup encryption verification
- AI prompt exposure review

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Avoid including sensitive data in prompts, examples, or generated docs
- Use synthetic examples and placeholders
- Flag possible PII or secrets
- Recommend minimization and masking
- Escalate uncertain data-handling cases

## Human Responsibilities

- Classify data
- Approve production data use in non-production contexts
- Review access and retention
- Respond to data incidents
- Validate anonymization and masking

## Required Evidence and Artifacts

- Data classification record
- Access review evidence
- Retention schedule
- Masking evidence
- Data export record
- Incident records

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

