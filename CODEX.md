# CODEX.md — Codex Usage Guidelines

Codex is recommended for autonomous implementation, refactoring, bug fixing, test generation, and repository-wide code changes.

## Best Uses

- Implement scoped GitHub issues.
- Fix failing tests or CI jobs.
- Refactor modules while preserving behavior.
- Generate unit and integration tests.
- Update build scripts, Dockerfiles, or developer tooling.
- Prepare pull requests with test evidence.

## Task Intake Rules

Codex tasks should include:

- Clear problem statement
- Acceptance criteria
- Target files or modules when known
- Testing requirements
- Out-of-scope changes
- Security constraints

## Implementation Rules

- Make minimal necessary changes.
- Keep commits logically grouped.
- Add tests for new behavior.
- Preserve public APIs unless requested.
- Avoid broad rewrites.
- Prefer explicit error handling.
- Update documentation when behavior changes.

## Example Codex Task

```text
Implement issue #123.

Requirements:
- Add validation for invalid project names.
- Return HTTP 400 with a structured error body.
- Add unit tests and API tests.
- Do not change authentication logic.
- Open a PR with summary, tests run, and rollback notes.
```
