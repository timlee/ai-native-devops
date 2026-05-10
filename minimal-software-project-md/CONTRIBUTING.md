# Contributing Guide

## Purpose

This guide defines how contributors should propose, implement, review, and merge changes.

## Branching

Use short-lived branches:

```text
feature/<short-description>
fix/<short-description>
docs/<short-description>
refactor/<short-description>
```

## Commit Messages

Use clear commit messages.

Recommended format:

```text
type(scope): short summary
```

Examples:

```text
feat(auth): add password reset endpoint
fix(api): handle empty request body
docs(readme): update setup instructions
```

## Pull Request Requirements

A pull request should include:

- Summary of changes
- Related issue or requirement
- Test evidence
- Risk notes
- Screenshots or logs when useful
- Documentation updates when behavior changes

## Review Expectations

Reviewers should check:

- Correctness
- Maintainability
- Security impact
- Test coverage
- Backward compatibility
- Documentation accuracy

## Definition of Done

A change is complete when:

- Requirements are satisfied
- Tests pass
- Code review is complete
- Documentation is updated
- No critical security or quality checks fail
