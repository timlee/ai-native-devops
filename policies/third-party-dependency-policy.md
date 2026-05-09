# Third-Party Dependency Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define requirements for adding, updating, reviewing, and removing third-party libraries, packages, containers, tools, and services.

## Scope

Applies to application dependencies, build dependencies, container base images, GitHub Actions, Terraform modules, SaaS integrations, and AI tools.

## Mandatory Rules

- New dependencies must have a clear purpose and owner.
- Dependencies must be reviewed for security, license, maintenance activity, and operational risk.
- Dependency versions must be pinned or locked where practical.
- Known critical vulnerabilities must block release unless formally excepted.
- Unused dependencies must be removed.
- Container base images must be maintained and scanned.
- Third-party GitHub Actions should be pinned to trusted version or commit SHA where appropriate.
- Licenses must be compatible with project requirements.
- Dependency updates must include test evidence.
- High-risk third-party services require security review.

## Required Checks

- SCA scan
- License scan
- Dependency review
- Lockfile diff review
- Container base image scan
- GitHub Actions dependency review
- Test execution after updates

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Explain why a dependency is needed
- Prefer standard library or approved existing dependency
- Identify vulnerabilities and license concerns
- Avoid large dependencies for small tasks
- Generate migration notes

## Human Responsibilities

- Approve high-impact dependencies
- Review license and security risks
- Maintain update cadence
- Remove unused dependencies
- Approve exceptions

## Required Evidence and Artifacts

- Dependency manifest
- Lockfile diff
- SCA report
- License report
- Review approval
- Test results

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

