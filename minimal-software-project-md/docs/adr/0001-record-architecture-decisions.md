# ADR 0001: Record Architecture Decisions

## Status

Accepted

## Context

Architecture decisions need to be documented so future contributors understand why the system was designed in a particular way.

## Decision

Use Architecture Decision Records under `docs/adr/` for significant technical decisions.

Each ADR should include:

- Title
- Status
- Context
- Decision
- Consequences
- Alternatives considered

## Consequences

Positive:

- Improves long-term maintainability
- Helps new contributors understand trade-offs
- Preserves decision history

Negative:

- Requires discipline to keep records updated

## Template

```md
# ADR NNNN: Decision Title

## Status

Proposed / Accepted / Deprecated / Superseded

## Context

Describe the problem and constraints.

## Decision

Describe the chosen approach.

## Consequences

Describe positive and negative outcomes.

## Alternatives Considered

Describe other options and why they were not chosen.
```
