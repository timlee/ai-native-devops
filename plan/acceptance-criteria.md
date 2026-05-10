# Acceptance Criteria

> Module: Auth | ID: REQ-001

- [ ] **GitHub Integration**
  - [ ] The tool authenticates to GitHub using a token retrieved from a secrets manager (e.g., Azure Key Vault, HashiCorp Vault, AWS Secrets Manager).
  - [ ] The tool fetches all open issues from a configured repository without hard-coding credentials.
  - [ ] Rate-limit headers (`X-RateLimit-Remaining`) are respected; requests are retried with exponential back-off when limits are approached.

- [ ] **Issue Selection**
  - [ ] A list of issues is rendered with at minimum: issue number, title, labels, and truncated body.
  - [ ] The user can select exactly one issue to proceed to artifact generation.
  - [ ] The selected issue's full body and metadata are passed as context to the AI generation pipeline.

- [ ] **Architecture Diagram Generation**
  - [ ] A C4-level or equivalent diagram is generated in a renderable format (e.g., Mermaid, PlantUML, or PNG).
  - [ ] The diagram references the selected issue ID in its metadata or filename.

- [ ] **ADR Generation**
  - [ ] An ADR is generated following a standard template (Title, Status, Context, Decision, Consequences).
  - [ ] The ADR includes the GitHub issue URL in the `Context` section.

- [ ] **OpenAPI Spec Generation**
  - [ ] A valid OpenAPI 3.1 YAML/JSON file is generated and passes schema validation (e.g., `spectral lint`).
  - [ ] The spec includes `info.description` referencing the originating issue ID.

- [ ] **Data Model Generation**
  - [ ] A data model is generated in at least one of: ERD (Mermaid), JSON Schema, or Prisma schema format.
  - [ ] All entities defined in the model are traceable to terms in the issue description.

- [ ] **Threat Model Generation**
  - [ ] A STRIDE-based threat model is generated covering at minimum the components identified in the architecture diagram.
  - [ ] Each identified threat includes: Category, Description, Affected Component, Mitigation.

- [ ] **Access Control**
  - [ ] Only users with the `design:write` role (or equivalent) can trigger artifact generation.
  - [ ] Unauthorized attempts return a `403 Forbidden` response with a structured error message.

- [ ] **Traceability & Persistence**
  - [ ] All five artifacts are saved with filenames or metadata containing the GitHub issue ID.
  - [ ] A manifest file (JSON/YAML) is produced per generation run listing all artifacts, their paths, and the source issue URL.

---
