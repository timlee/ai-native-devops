# 06 SECURE / COMPLY Lifecycle Guide

## Phase Objective

Prioritize security and compliance findings, propose remediations, and document release-blocking decisions by risk tier.

## Repository Directories

- docs/lifecycle
- docs/prompts
- docs/checklists
- docs/agents
- docs/policies
- docs/security
- docs/workflows
- .github/workflows

## Mandatory Input Files

- docs/lifecycle/06-secure-comply.md
- docs/prompts/06-secure-comply.md
- docs/checklists/06-secure-comply-checklist.md
- docs/agents/security-agent.md
- docs/policies/security-gates.md

## Required Output Files

- docs/policies/security-gates.md
- docs/policies/secrets-management.md
- docs/security/security-model.md

## Core Activities

- SAST and DAST analysis
- SCA dependency scanning
- Secret scanning
- IaC validation
- Compliance evidence review

## AI And Automation Expectations

- Consolidate findings from scans and policy checks.
- Rank issues by exploitability and impact.
- Propose auto-fixes, exceptions, and escalation paths.
- Document release-blocking recommendations.

## Controls And Approval Gates

- Do not weaken security controls to pass checks.
- Document exceptions formally.
- Require security approval for high or critical findings.
- Block release on unresolved critical findings unless formally accepted.

## Validation And Exit Criteria

- Findings are consolidated and ranked.
- Remediation path or exception exists for significant issues.
- Security guidance artifacts are updated.
- Handoff to RELEASE is explicit.

## Handoff

- Provide findings, fixes, blockers, and approval state to RELEASE.
