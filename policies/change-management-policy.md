# Change Management Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define how changes are proposed, reviewed, approved, implemented, communicated, and recorded.

## Scope

Applies to application changes, infrastructure changes, CI/CD changes, configuration changes, security changes, and production operations.

## Mandatory Rules

- Changes must be traceable to an issue, ticket, incident, request, or roadmap item.
- Production-impacting changes must include risk assessment.
- High-risk changes require approval before deployment.
- Emergency changes must be documented and reviewed after execution.
- Change windows must be respected where defined.
- Stakeholders must be notified for user-impacting changes.
- Rollback plans are required for risky changes.
- Change records must include scope, owner, timing, validation, and outcome.
- AI agents may draft change records but must not approve high-risk changes.
- Unreviewed change to critical controls is prohibited.

## Required Checks

- Change record exists
- Risk assessment completed
- Approval workflow completed
- Rollback plan reviewed
- Deployment checklist completed
- Post-change validation recorded
- Emergency change review if applicable

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Draft change summaries and risk notes
- Identify affected systems
- Generate rollback checklist
- Do not mark approvals complete
- Escalate high-risk or emergency changes

## Human Responsibilities

- Approve or reject changes
- Assess operational impact
- Communicate planned changes
- Validate outcomes
- Conduct post-change reviews

## Required Evidence and Artifacts

- Change request
- Risk assessment
- Approval record
- Communication record
- Rollback plan
- Post-change validation result

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

