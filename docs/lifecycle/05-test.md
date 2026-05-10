# 05 TEST Lifecycle Guide

## Phase Objective

Expand coverage, explain failures, and verify behavior against acceptance criteria and regression expectations.

## Repository Directories

- docs/lifecycle
- docs/prompts
- docs/checklists
- docs/agents
- docs/workflows
- .github/workflows
- vscode-extension/src

## Mandatory Input Files

- docs/lifecycle/05-test.md
- docs/prompts/05-test.md
- docs/checklists/05-test-checklist.md
- docs/agents/test-agent.md
- docs/lifecycle/01-plan.md

## Required Output Files

- docs/lifecycle/05-test.md
- docs/checklists/05-test-checklist.md

## Core Activities

- Unit testing
- Integration testing
- Regression testing
- Coverage analysis
- Performance validation

## Recommended AI Provider

**GitHub Copilot** for test generation; any provider for failure analysis and coverage reporting.

## AI And Automation Expectations

- Expand missing tests and edge-case coverage.
- Analyze failures and flaky behavior.
- Map coverage to acceptance criteria.
- Document pass/fail thresholds and validation evidence.

## Controls And Approval Gates

- Keep tests deterministic when possible.
- Do not remove coverage without explicit replacement.
- Record failure evidence and unresolved risks.
- Require review for significant changes to test strategy.

## Validation And Exit Criteria

- Coverage and test scope are documented.
- Failures and regressions are explained.
- Validation evidence is attached or referenced.
- Handoff to SECURE / COMPLY or RELEASE is clear.

## Handoff

- Provide test evidence, gaps, and regression concerns to SECURE / COMPLY and RELEASE.
