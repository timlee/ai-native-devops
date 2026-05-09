# 08 DEPLOY Lifecycle Guide

## Phase Objective

Prepare a safe rollout plan with environment protections, canary checkpoints, health verification steps, and rollback strategy.

## Repository Directories

- docs/lifecycle
- docs/prompts
- docs/checklists
- docs/agents
- docs/workflows
- docs/policies
- .github/workflows

## Mandatory Input Files

- docs/lifecycle/08-deploy.md
- docs/prompts/08-deploy.md
- docs/checklists/08-deploy-checklist.md
- docs/agents/deploy-agent.md
- docs/policies/deployment-gates.md

## Required Output Files

- docs/workflows/deploy-staging.md
- docs/workflows/deploy-production.md
- docs/policies/deployment-gates.md

## Core Activities

- Environment validation
- Rollout planning
- Progressive delivery
- Health verification
- Rollback planning

## AI And Automation Expectations

- Validate manifests, environments, and readiness checks.
- Produce rollout, canary, and rollback sequences.
- Add verification and incident escalation steps.
- Document approvals and failure handling.

## Controls And Approval Gates

- Respect environment protections and deployment gates.
- Avoid production mutation without required approval.
- Capture rollback plan before rollout.
- Escalate failed health checks immediately.

## Validation And Exit Criteria

- Deployment plan and rollback strategy are documented.
- Environment gates are satisfied.
- Verification steps are explicit.
- Handoff to OPERATE and MONITOR / OBSERVE is clear.

## Handoff

- Provide rollout evidence, verification steps, and rollback status to OPERATE and MONITOR / OBSERVE.
