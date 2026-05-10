# REQUIREMENT Agent

## Role

The REQUIREMENT agent is the first agent in the AI-native DevOps lifecycle. It converts raw stakeholder input into five structured planning artifacts.

## Trigger

Manual — the user opens the "00 · Requirement" phase panel, enters requirements text, and clicks "Generate Artifacts".

## Inputs

- Raw requirements text (free-form prose, bullet points, or structured notes).

## Outputs

| Artifact | File | Description |
|---|---|---|
| Product Requirements | plan/product-requirements.md | Numbered, testable requirements list |
| Backlog Items | plan/backlog-items.md | Prioritized items with P0/P1/P2 labels and S/M/L effort |
| User Stories | plan/user-stories.md | As a / I want / So that format |
| Acceptance Criteria | plan/acceptance-criteria.md | Measurable conditions as checkboxes |
| Planning Notes | plan/planning-notes.md | Assumptions, risks, open questions, dependencies |

## Agent Responsibilities by Tool

| Tool | Responsibility |
|---|---|
| Claude | Primary reasoning — parse requirements, generate all five artifacts |
| Codex | Translate requirements into implementation task descriptions |
| GitHub Copilot | IDE-level story authoring assistance |
| Internal Agent | Organization-specific intake templates |

## Required Controls

- Output must be reviewed by a human before handoff to PLAN phase.
- Risks and assumptions must be documented in Planning Notes.
- All artifacts must be linked to a work item, issue, or request record.

## Handoff

On completion, the five files in `plan/` are passed to the **PLAN agent** (01 · Plan) for further decomposition, estimation, and backlog prioritization.
