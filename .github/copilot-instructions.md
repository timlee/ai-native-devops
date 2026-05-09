# GitHub Copilot Repository Instructions

Use these instructions when generating code, tests, documentation, or pull request content for this repository.

## Coding Style

- Follow existing project conventions.
- Prefer readable, maintainable code over clever abstractions.
- Add comments only where they clarify non-obvious behavior.
- Keep functions small and testable.
- Use explicit types where the project convention supports them.

## Testing

- Add or update tests for every behavior change.
- Include edge cases and failure paths.
- Do not delete tests unless they are obsolete and replacement coverage exists.
- Prefer deterministic tests over time-dependent or network-dependent tests.

## Security

- Never generate hardcoded secrets.
- Validate inputs at trust boundaries.
- Avoid unsafe shell execution.
- Use least privilege for permissions.
- Do not weaken authentication, authorization, encryption, or audit logging.

## Pull Requests

PR descriptions must include:

- Summary
- Related issue
- Testing evidence
- Security impact
- Deployment impact
- Rollback plan
