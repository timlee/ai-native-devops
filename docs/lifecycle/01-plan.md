# 01 PLAN Lifecycle Guide

## Phase Objective

Turn incoming requests into actionable backlog items with clear scope, acceptance criteria, dependencies, and delivery risks.

## Repository Directories

- docs/lifecycle
- docs/prompts
- docs/checklists
- docs/agents
- docs/workflows
- docs/policies
- .github/workflows
- vscode-extension/src

## Mandatory Input Files

- docs/lifecycle/01-plan.md
- docs/prompts/01-plan.md
- docs/checklists/01-plan-checklist.md
- docs/agents/planning-agent.md
- docs/policies/README.md

## Required Output Files

- docs/lifecycle/01-plan.md
- docs/prompts/01-plan.md

## Core Activities

- Requirement analysis
- User stories
- Acceptance criteria
- Effort and risk estimation
- Backlog prioritization

## AI And Automation Expectations

- Summarize context from issues, PRs, and existing documentation.
- Identify missing requirements, assumptions, dependencies, and risks.
- Draft backlog-ready artifacts in reviewable Markdown.
- Capture validation expectations and next-phase handoff notes.

## Controls And Approval Gates

- Link all outputs to a tracked work item.
- Record assumptions and evidence for auditability.
- Flag production-impacting or security-relevant scope for approval.
- Do not move to DESIGN until scope and acceptance criteria are reviewable.

## Validation And Exit Criteria

- Required planning artifacts are complete.
- Risks and dependencies are documented.
- Acceptance criteria are testable.
- Handoff to DESIGN is explicit.

## Handoff

- Provide architecture concerns, constraints, dependencies, and unresolved questions to DESIGN.
