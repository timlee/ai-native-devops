# 02 DESIGN Lifecycle Guide

## Phase Objective

Translate approved planning intent into architecture, interfaces, decisions, and risk controls that can guide implementation safely.

## Repository Directories

- docs/lifecycle
- docs/prompts
- docs/checklists
- docs/agents
- docs/architecture
- docs/adr
- docs/api
- docs/security
- docs/policies

## Mandatory Input Files

- docs/lifecycle/02-design.md
- docs/prompts/02-design.md
- docs/checklists/02-design-checklist.md
- docs/agents/architecture-agent.md
- docs/architecture/repository-architecture.md

## Required Output Files

- docs/architecture/design-draft.md
- docs/adr/ADR-0001-design-decision.md
- docs/api/openapi.yaml
- docs/security/threat-model.md

## Core Activities

- Architecture options and trade-offs
- API contracts
- Data model definition
- Threat modeling
- ADR authoring

## AI And Automation Expectations

- Summarize design constraints from planning and policy inputs.
- Generate architecture options with trade-off analysis.
- Draft API and threat-model artifacts in repository locations.
- Highlight implementation boundaries and approval dependencies.

## Controls And Approval Gates

- Document architectural decisions and consequences explicitly.
- Record security assumptions and mitigations.
- Require reviewer sign-off for major architecture changes.
- Do not hand off to CODE until the chosen design is reviewable.

## Validation And Exit Criteria

- Architecture direction is documented.
- API and threat model artifacts exist.
- Key trade-offs and risks are captured.
- Handoff to CODE is explicit.

## Handoff

- Provide implementation boundaries, interfaces, data contracts, and unresolved risks to CODE.
