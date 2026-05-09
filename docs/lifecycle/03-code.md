# 03 CODE Lifecycle Guide

## Phase Objective

Implement approved scope with tests and a review-ready change package that satisfies repository governance and traceability requirements.

## Repository Directories

- docs/lifecycle
- docs/prompts
- docs/checklists
- docs/agents
- docs/workflows
- .github
- .github/workflows
- vscode-extension/src

## Mandatory Input Files

- docs/lifecycle/03-code.md
- docs/prompts/03-code.md
- docs/checklists/03-code-checklist.md
- docs/agents/coding-agent.md
- AGENTS.md

## Required Output Files

- .github/pull_request_template.md
- docs/workflows/ai-code-pr.md

## Core Activities

- Implementation
- Refactoring
- Unit testing
- Code review preparation
- PR authoring

## AI And Automation Expectations

- Build an implementation plan from approved design.
- Propose code, tests, and config changes with minimal unrelated churn.
- Produce a review-ready PR package with governance sections.
- Record validation commands and rollback implications.

## Controls And Approval Gates

- Keep changes linked to tracked work.
- Preserve repository conventions and security controls.
- Do not weaken testing or approval gates.
- Require human review before merge.

## Validation And Exit Criteria

- Implementation is complete for scoped work.
- Tests for changed behavior exist or are updated.
- PR package is review-ready.
- Handoff to BUILD or TEST is clear.

## Handoff

- Provide changed files, validation evidence, known risks, and rollback notes to BUILD and TEST.
