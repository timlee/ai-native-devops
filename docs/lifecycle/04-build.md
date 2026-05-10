# 04 BUILD Lifecycle Guide

## Phase Objective

Diagnose build and packaging issues, maintain reliable pipeline behavior, and document supply-chain and artifact expectations.

## Repository Directories

- docs/lifecycle
- docs/prompts
- docs/checklists
- docs/agents
- docs/workflows
- .github/workflows
- vscode-extension

## Mandatory Input Files

- docs/lifecycle/04-build.md
- docs/prompts/04-build.md
- docs/checklists/04-build-checklist.md
- docs/agents/build-agent.md
- .github/workflows/ci.yml

## Required Output Files

- docs/workflows/ci.md
- docs/workflows/security.md

## Core Activities

- Build execution
- Packaging
- Dependency resolution
- Container build or artifact assembly
- Artifact provenance and SBOM expectations

## Recommended AI Provider

Any provider — build log analysis and remediation are well-supported by all.

## AI And Automation Expectations

- Analyze build failures and probable root causes.
- Recommend workflow, dependency, or packaging fixes.
- Document SBOM and provenance guidance.
- Produce rerun steps and validation recommendations.

## Controls And Approval Gates

- Keep workflow changes auditable.
- Preserve security and branch protection rules.
- Document any supply-chain risk introduced by fixes.
- Require review for pipeline changes affecting release readiness.

## Validation And Exit Criteria

- Build path is reproducible.
- Required workflow guidance is documented.
- Artifact integrity expectations are captured.
- Handoff to TEST or SECURE / COMPLY is explicit.

## Handoff

- Provide build evidence, failure analysis, and remaining risks to TEST and SECURE / COMPLY.
