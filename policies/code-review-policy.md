# Code Review Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define required review practices for safe, high-quality, and traceable changes.

## Scope

Applies to all pull requests, merge requests, AI-generated changes, human-generated changes, and emergency changes.

## Mandatory Rules

- All changes must be reviewed before merging into protected branches.
- At least one qualified reviewer must approve each pull request.
- Security-sensitive changes require security or code owner review.
- Infrastructure and deployment changes require platform or DevOps review.
- AI-generated pull requests must be reviewed by a human before merge.
- Reviewers must verify test evidence and risk notes.
- Pull requests must be scoped and linked to an issue when applicable.
- Large pull requests should be split unless approved.
- Review comments must be resolved before merge.
- Self-approval is not allowed.

## Required Checks

- Branch protection requires review
- Required status checks pass
- CODEOWNERS configured for critical paths
- Pull request template completed
- Security-sensitive files require explicit approval

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Create clear PR descriptions
- Summarize implementation, tests, risks, and rollback notes
- Respond to review feedback with focused updates
- Do not mark own changes approved
- Highlight generated or uncertain sections

## Human Responsibilities

- Review correctness, maintainability, tests, security, and operational risk
- Check acceptance criteria
- Ensure policy gates passed
- Request changes when evidence is missing
- Escalate high-risk concerns

## Required Evidence and Artifacts

- Pull request approval record
- Code review comments
- Status check results
- Test evidence
- Security scan evidence
- Linked issue or ticket

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

