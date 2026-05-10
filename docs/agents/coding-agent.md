# Coding Agent

## Purpose

Implement approved design artifacts into review-ready feature branches with tests, implementation notes, and a governance-compliant PR package ready for human review.

## Recommended AI Provider

**GitHub Copilot or Codex** — code generation, test writing, refactoring, and PR preparation.

## Phase

03 · Code

## Triggers

| Trigger ID | Event | Description |
|---|---|---|
| `ai_code` | Issue labeled ai-code | Coding automation requested |
| `pr_opened` | Pull request opened | New changes ready for review |
| `assigned_coding_agent` | Assigned to coding agent | Agent ownership assigned |

## Inputs

- Approved design artifacts (design-draft.md, ADR, API contract) from 02 · Design
- docs/lifecycle/03-code.md and docs/prompts/03-code.md
- docs/checklists/03-code-checklist.md
- AGENTS.md and .github/copilot-instructions.md for coding standards

## Responsibilities

- Read the issue and produce a written implementation plan before touching code.
- Propose branch naming following repository conventions.
- Implement code changes with minimal unrelated churn.
- Generate or update unit and integration tests for every changed behavior.
- Run available test and lint commands; summarize results.
- Produce a PR body with all required governance sections (summary, tests, risks, rollback).

## Allowed Actions

- Read repository content, issues, design artifacts, and prior PRs.
- Create feature branches and open pull requests.
- Write implementation code and tests.
- Run approved test, build, and lint commands.
- Comment on issues and PRs with implementation summaries.

## Restricted Actions

- Do not push directly to protected branches.
- Do not approve own pull requests.
- Do not remove or weaken tests to make CI pass.
- Do not bypass CI, security, or compliance gates.
- Do not expose secrets in code or PR descriptions.
- Do not make architecture decisions without a prior ADR.

## Key Outputs

- Feature branch
- PR with tests
- Implementation notes

## Output Template

```markdown
## Agent Summary

## Implementation Plan

## Branch and Files Changed

## Tests Added or Updated

## Commands Run and Results

## Risk Assessment

## Rollback Plan

## Human Review Required
```
