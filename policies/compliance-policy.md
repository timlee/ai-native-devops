# Compliance Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define compliance expectations for audit evidence, regulatory requirements, license obligations, records, and process adherence.

## Scope

Applies to software delivery, security controls, data handling, release approvals, deployment records, access records, and AI-assisted workflows.

## Mandatory Rules

- Compliance requirements must be mapped to controls and evidence.
- Required audit evidence must be retained.
- License compliance checks must run for production releases where applicable.
- Regulatory-impacting changes require review.
- Policy exceptions must be approved and time-bound.
- Audit logs must not be altered or deleted outside retention process.
- AI-generated compliance summaries must be validated.
- Compliance evidence must be traceable to release, deployment, or control activity.
- Open compliance findings must be tracked to closure.
- Teams must not falsely mark compliance checks complete.

## Required Checks

- License scan
- Control mapping
- Audit evidence collection
- Approval record validation
- Retention check
- Exception review
- Compliance report review

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Summarize evidence without fabricating missing data
- Identify evidence gaps
- Draft compliance notes and mappings
- Escalate missing approvals
- Avoid unsupported legal conclusions

## Human Responsibilities

- Define compliance requirements
- Approve evidence
- Review exceptions
- Respond to audits
- Maintain retention procedures

## Required Evidence and Artifacts

- Control mapping
- Audit evidence package
- License reports
- Approval records
- Exception records
- Compliance findings

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

