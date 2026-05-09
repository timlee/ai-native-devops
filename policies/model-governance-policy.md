# AI Model Governance Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define how AI models, AI agents, prompts, context, and tool integrations are selected, evaluated, monitored, and governed.

## Scope

Applies to all commercial, open-source, hosted, self-hosted, and internal AI models used in software delivery and operations.

## Mandatory Rules

- Only approved AI models and agent platforms may be used for repository work.
- Model access must follow least privilege.
- Sensitive data must not be submitted to unapproved AI services.
- Recurring automation prompts must be version-controlled.
- AI outputs must be validated before merge, release, or production use.
- Material changes to AI automation behavior require review.
- AI integrations must document owner, purpose, permissions, and data exposure.
- Model performance and failure patterns must be reviewed periodically.

## Required Checks

- Approved AI tool inventory
- Prompt templates under version control
- AI permission review
- Sensitive-data exposure review
- Recurring workflow audit logs
- Human approval gates for high-risk automation

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Use only approved models and tools
- Avoid unnecessary private or sensitive context
- Cite source context where possible
- Mark outputs that require human validation
- Report uncertainty and do not fabricate missing evidence

## Human Responsibilities

- Approve AI tools before operational use
- Review model access and permissions
- Validate high-risk AI outputs
- Retire unsafe AI workflows
- Maintain automation inventory

## Required Evidence and Artifacts

- Approved AI tool list
- Prompt templates
- Tool permission records
- Model evaluation notes
- AI workflow audit logs
- Approval records

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

