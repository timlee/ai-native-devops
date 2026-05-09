# Coding Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define coding standards that improve maintainability, readability, correctness, security, and AI-assisted code quality.

## Scope

Applies to all source code, scripts, configuration code, infrastructure code, generated code, and AI-assisted code contributions.

## Mandatory Rules

- Code must be clear, maintainable, and consistent with repository style.
- Complex logic must explain intent where needed.
- Public interfaces must be documented.
- Error handling must be explicit and appropriate.
- Input validation must be applied at trust boundaries.
- No hardcoded secrets or environment-specific sensitive values.
- Feature behavior must be traceable to requirements or issue references.
- Generated code must be reviewed like human-written code.
- Dead code and unnecessary complexity must be removed.
- Backward compatibility must be considered for public APIs and schemas.

## Required Checks

- Formatting check
- Linting
- Static analysis
- Type checking where applicable
- Unit tests for changed logic
- Secure coding checks
- Dependency review
- Code owner review for critical areas

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Follow existing project style and architecture
- Generate small focused changes
- Avoid unnecessary dependencies
- Prefer secure, simple, and testable implementations
- Update related tests and documentation
- Explain non-obvious design choices

## Human Responsibilities

- Review maintainability, security, and correctness
- Confirm requirements and acceptance criteria
- Reject unsafe or unnecessarily broad changes
- Ensure language-specific best practices

## Required Evidence and Artifacts

- Pull request
- Commit history
- Code review comments
- Lint/static analysis results
- Test results
- Updated documentation

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

