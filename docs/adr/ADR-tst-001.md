# ADR

> Module: test | ID: tst-001

### ADR-001: Use Schemathesis for OpenAPI-Driven Contract Testing

**Status:** Accepted

**Context:**
The project requires every API endpoint to be validated against an OpenAPI specification automatically. Manual test authoring risks drift between tests and the spec. A tool-driven approach that treats the OpenAPI document as the single source of truth reduces maintenance overhead and ensures full coverage of declared operations, schemas, and status codes.

**Decision:**
Adopt **Schemathesis** (Python) as the primary contract testing engine, backed by **pytest** as the test runner. Schemathesis reads the OpenAPI document directly and auto-generates test cases for request/response schema validation, status codes, and security schemes. `pytest-cov` enforces the 80% coverage threshold. A custom pytest plugin audits registered routes against the OpenAPI spec to detect undocumented endpoints.

**Consequences:**

*Positive:*
- OpenAPI document is the authoritative source; no duplication between spec and tests.
- Stateful and stateless test generation covers edge cases automatically.
- CI integration is straightforward via pytest JUnit XML output.
- Security scheme enforcement (Bearer, API Key) is testable via header injection fixtures.

*Negative:*
- Schemathesis stateful tests require a running service instance or a realistic mock, adding CI infrastructure complexity.
- Auto-generated tests may need manual refinement for domain-specific business logic assertions.
- Python toolchain must be maintained alongside the primary application stack if the service is non-Python.

---
