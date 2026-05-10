# 07 RELEASE Lifecycle Guide

## Phase Objective

Assemble a release package with changelog, risk summary, approvals, and a clear go/no-go recommendation.

## Repository Directories

- docs/lifecycle
- docs/prompts
- docs/checklists
- docs/agents
- docs/workflows
- docs/policies
- .github/workflows

## Mandatory Input Files

- docs/lifecycle/07-release.md
- docs/prompts/07-release.md
- docs/checklists/07-release-checklist.md
- docs/agents/release-agent.md
- docs/workflows/release.md

## Required Output Files

- docs/workflows/release.md
- docs/lifecycle/07-release.md

## Core Activities

- Versioning
- Changelog authoring
- Release note preparation
- Approval review
- Bundle preparation

## Recommended AI Provider

Any provider; **Claude** recommended for risk summary reasoning and go/no-go rationale.

## AI And Automation Expectations

- Summarize release scope and included changes.
- Highlight unresolved risks, dependencies, and pending checks.
- Draft release notes and approval packet content.
- Produce a go/no-go recommendation.

## Controls And Approval Gates

- Ensure prerequisite test and security gates are satisfied.
- Document release blockers and formal exceptions.
- Require explicit approval before DEPLOY.
- Preserve traceability from changes to release decision.

## Validation And Exit Criteria

- Release notes and risk summary are complete.
- Approval requirements are documented.
- Version proposal and release bundle are clear.
- Handoff to DEPLOY is explicit.

## Handoff

- Provide release package, approvals, rollback expectations, and readiness notes to DEPLOY.
