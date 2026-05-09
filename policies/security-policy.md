# Security Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define security requirements for secure development, vulnerability management, threat modeling, and release protection.

## Scope

Applies to source code, dependencies, containers, infrastructure, CI/CD workflows, cloud resources, secrets, data, and AI-assisted changes.

## Mandatory Rules

- Security checks must run for all pull requests to protected branches.
- Critical vulnerabilities must block release unless formally excepted.
- High vulnerabilities require remediation plan and approval before release.
- Secret leaks must be treated as incidents and remediated immediately.
- Authentication, authorization, cryptography, and data-handling changes require security review.
- Threat modeling is required for significant architecture or trust-boundary changes.
- Security controls must not be disabled without approval.
- Dependencies must be reviewed for known vulnerabilities and license risks.
- Container and IaC security checks must pass before deployment.
- Security findings must be tracked to resolution or formal exception.

## Required Checks

- SAST
- SCA / dependency vulnerability scan
- Secret scan
- Container image scan
- IaC scan
- License scan
- Threat model review
- Security code owner approval
- Vulnerability threshold enforcement

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Explain findings clearly
- Suggest remediation options and trade-offs
- Generate secure code patterns
- Never reveal or persist secrets
- Do not suppress security checks without approval
- Open remediation PRs for low-risk fixes where allowed
- Escalate critical findings

## Human Responsibilities

- Review high-risk findings
- Approve risk acceptance only through exception process
- Rotate leaked credentials
- Validate security-sensitive changes
- Maintain scanner configuration

## Required Evidence and Artifacts

- Security scan reports
- Threat model
- Remediation plan
- Risk register
- Exception records
- Approval records
- Incident record for secret exposure

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

