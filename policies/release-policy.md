# Release Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define requirements for packaging, versioning, approving, communicating, and publishing release artifacts.

## Scope

Applies to application releases, library releases, container releases, infrastructure releases, documentation releases, and AI-assisted release preparation.

## Mandatory Rules

- Release candidates must be built from approved source and traceable commits.
- Release versioning must follow repository standard.
- Release notes or changelog must be generated for user-impacting changes.
- Required test and security gates must pass before release.
- Known risks and unresolved issues must be documented.
- Release approvals must be recorded.
- Release artifacts must be immutable after publishing.
- Rollback or mitigation notes must exist for production-impacting releases.
- AI-generated release notes must be reviewed for accuracy.
- Release decisions must not be based on fabricated or incomplete evidence.

## Required Checks

- Version tag validation
- Changelog/release notes review
- Build artifact verification
- Test results review
- Security scan review
- Approval record
- Release package integrity check

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Draft changelog and release notes
- Summarize commits, PRs, risks, and known issues
- Generate go/no-go summaries
- Identify missing release evidence
- Do not publish final release without authorization

## Human Responsibilities

- Approve release candidate
- Validate release notes
- Review unresolved risks
- Approve publication
- Communicate release status

## Required Evidence and Artifacts

- Release candidate list
- Version tag
- Changelog
- Release notes
- Approval record
- Artifact manifest
- Risk summary

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

