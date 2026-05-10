# REQUIREMENT Phase Guidelines

## Objective

The REQUIREMENT phase converts raw stakeholder input into five structured planning artifacts that feed directly into the PLAN phase.

## Core Activities

- Requirement intake and clarification
- Product requirements definition
- Backlog decomposition
- User story authoring
- Acceptance criteria definition
- Planning notes and risk capture

## Key Artifacts and Work Products

- Product requirements
- Backlog items
- User stories
- Acceptance criteria
- Planning notes

## How AI Supports This Phase

AI tools such as Claude, Codex, GitHub Copilot, and internal agents should be used to:

1. Parse and clarify raw requirements text provided by the user.
2. Generate a prioritized product requirements list that is clear and testable.
3. Decompose requirements into backlog items with labels and effort estimates.
4. Write user stories in "As a / I want / So that" format.
5. Define measurable acceptance criteria tied to each story.
6. Record planning notes: assumptions, risks, open questions, and dependencies.

## Recommended Agent Responsibilities

| Agent Type | Responsibility |
|---|---|
| Claude | Reasoning, clarification, drafting all five artifacts |
| Codex | Translating requirements into implementation tasks |
| GitHub Copilot | IDE-level suggestions during story authoring |
| Internal Agent | Organization-specific intake templates and tooling |

## Required Controls

- All changes must be linked to an issue, PR, workflow run, or incident record.
- Production-impacting changes require approval gates.
- Security and compliance exceptions must be documented.
- Generated outputs must be reviewed for correctness and completeness.

## Example Prompt

```text
You are the REQUIREMENT phase AI agent.

Raw requirements provided by the user:
<paste requirements here>

Task:
Analyze the requirements and produce exactly five planning artifacts as structured Markdown.
Use these exact ## headings in order:

## Product Requirements
## Backlog Items
## User Stories
## Acceptance Criteria
## Planning Notes

Output as structured Markdown only.
```

## Exit Criteria

- Required artifacts are complete (all five files written to plan/).
- Quality gates for this phase are satisfied.
- Risks are documented or accepted.
- Handoff to the PLAN phase is clear.
