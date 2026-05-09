# Testing Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define testing requirements that ensure functional correctness, regression protection, reliability, and release confidence.

## Scope

Applies to unit tests, integration tests, E2E tests, performance tests, security tests, manual tests, and AI-generated tests.

## Mandatory Rules

- New or changed behavior must include relevant tests.
- Bug fixes must include regression tests where practical.
- Critical business flows must have integration or E2E coverage.
- Tests must be deterministic and avoid flakiness.
- Test data must not contain production secrets or sensitive personal data.
- Coverage thresholds must not be lowered without approval.
- Failed tests must not be ignored, skipped, or deleted without documented justification.
- Performance-sensitive changes require benchmark or load-test evidence when applicable.
- AI-generated tests must be reviewed for meaningful assertions.
- Test failures must be triaged and tracked.

## Required Checks

- Unit test suite
- Integration tests where applicable
- E2E tests for critical flows
- Coverage report
- Regression evidence
- Performance evidence when needed
- CI status checks

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Generate tests mapped to acceptance criteria
- Identify edge cases and negative paths
- Avoid superficial tests
- Explain coverage and gaps
- Suggest fixes for flaky or failing tests
- Avoid real credentials and production data

## Human Responsibilities

- Review test relevance and completeness
- Confirm tests validate behavior
- Approve justified skips or coverage exceptions
- Maintain reliability and speed

## Required Evidence and Artifacts

- Test plan
- Test cases
- CI test output
- Coverage report
- Benchmark report
- Flaky test log
- Defect records

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

