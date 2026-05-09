# Backup and Recovery Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define requirements for backups, restore testing, disaster recovery, recovery objectives, and data protection.

## Scope

Applies to databases, object storage, configuration, infrastructure state, repositories, CI/CD metadata, secrets, and operational records.

## Mandatory Rules

- Critical systems must have documented backup and recovery procedures.
- RTO and RPO must be defined for critical services.
- Backups must be protected from unauthorized access and destructive modification.
- Backups containing sensitive data must be encrypted.
- Restore procedures must be tested periodically.
- Backup failures must alert owners.
- Infrastructure state and configuration must be recoverable.
- Secrets recovery procedures must not expose secret values.
- Backup retention must meet business and compliance requirements.
- Recovery after major incidents must be reviewed.

## Required Checks

- Backup job monitoring
- Restore test evidence
- RTO/RPO review
- Backup access review
- Encryption verification
- Retention validation
- DR exercise

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Draft recovery runbooks
- Identify missing backup coverage
- Summarize restore tests
- Recommend recovery improvements
- Do not expose backup secrets

## Human Responsibilities

- Own backup and restore procedures
- Approve recovery objectives
- Run restore tests
- Investigate backup failures
- Maintain DR plans

## Required Evidence and Artifacts

- Backup inventory
- Backup job logs
- Restore test records
- DR plan
- RTO/RPO records
- Access review evidence

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

