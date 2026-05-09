# AI Guardrails Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define safe operating boundaries for AI-assisted development, DevOps automation, and autonomous agent workflows.

## Scope

Applies to all AI tools and agents used for planning, design, coding, testing, security analysis, release, deployment, operations, observability, and incident response.

## Mandatory Rules

- AI agents must not push directly to protected branches such as `main`, `master`, or release branches.
- AI agents must create pull requests for code, infrastructure, workflow, documentation, or policy changes.
- AI agents must not approve their own pull requests or bypass required reviewers.
- AI agents must not disable tests, scanners, policy checks, branch protection, or deployment approvals.
- AI agents must not access, print, store, or transmit secrets, tokens, credentials, private keys, or regulated data.
- AI agents must not perform production-impacting actions without explicit authorization and required policy gates.
- AI-generated changes must include a clear summary, rationale, risk assessment, and validation evidence.
- High-risk, ambiguous, destructive, or irreversible actions must be escalated to a human owner.
- AI agents must operate only within approved tools, repositories, environments, and permission scopes.
- AI agent activity must be traceable to a ticket, issue, pull request, runbook, or incident record.

## Required Checks

- Branch protection enabled
- Human review required for production-impacting changes
- Secrets scanning enabled
- Deployment environment approval enabled
- Audit logs retained
- AI-generated PR template completed

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Summarize the requested task before making changes
- Follow repository instructions
- Run available checks when possible
- Explain assumptions and validation gaps
- Escalate security, privacy, compliance, and production-risk decisions

## Human Responsibilities

- Review AI-generated outputs before merge, release, deployment, or external communication.
- Approve or reject high-risk changes, exceptions, and production-impacting actions.
- Maintain policy ownership, update rules, and enforce required controls.
- Investigate policy violations, suspicious behavior, and recurring exceptions.

## Required Evidence and Artifacts

- AI task request or ticket
- Pull request diff
- Test results
- Security scan results
- Approval record
- Audit log of AI-triggered actions

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

## Risk Classification

| Risk Level | Example | Required Control |
|---|---|---|
| Low | Documentation update, test fixture update | AI PR + normal review |
| Medium | Feature code, workflow update | AI PR + code owner review |
| High | Authentication, authorization, data handling, deployment logic | Security / platform approval |
| Critical | Production mutation, secret access, policy bypass | Human-only decision and formal approval |

