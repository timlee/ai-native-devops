# Backlog Items

> Module: Auth | ID: REQ-001

| Priority | ID | Title | Effort | Notes |
|---|---|---|---|---|
| **P0** | BL-001 | GitHub API authentication via secrets manager | S | Prerequisite for all other items |
| **P0** | BL-002 | Fetch and display GitHub issues in UI/CLI | M | Core integration; must handle pagination |
| **P0** | BL-003 | Issue selection UX and context extraction | S | Feeds AI generation pipeline |
| **P0** | BL-004 | AI pipeline: Architecture diagram generation | M | Mermaid/PlantUML output preferred |
| **P0** | BL-005 | AI pipeline: ADR generation | S | Structured template enforcement required |
| **P0** | BL-006 | AI pipeline: OpenAPI spec generation + linting | M | Must pass `spectral lint` gate |
| **P1** | BL-007 | AI pipeline: Data model generation | M | Support ERD + JSON Schema outputs |
| **P1** | BL-008 | AI pipeline: STRIDE threat model generation | L | Requires component graph from architecture step |
| **P1** | BL-009 | RBAC enforcement on generation endpoints | S | Integrate with existing auth middleware |
| **P1** | BL-010 | Artifact persistence with issue ID traceability | S | Write manifest JSON per run |
| **P1** | BL-011 | Rate-limit handling and retry logic for GitHub API | S | Exponential back-off; configurable thresholds |
| **P2** | BL-012 | Artifact versioning and diff view | L | Nice-to-have for iterative design sessions |
| **P2** | BL-013 | Bulk generation across multiple issues | L | Batch mode; lower priority |
| **P2** | BL-014 | Export artifacts to Confluence/Notion | M | Integration via webhook or plugin |
