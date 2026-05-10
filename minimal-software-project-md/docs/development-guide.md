# Development Guide

## Local Development

### Prerequisites

- Language/runtime:
- Package manager:
- Database:
- External services:

### Environment Variables

| Variable | Required | Description | Example |
|---|---:|---|---|
| `APP_ENV` | Yes | Runtime environment | `development` |
| `DATABASE_URL` | Yes | Database connection string | Use local value |
| `LOG_LEVEL` | No | Logging level | `debug` |

Do not commit real secrets.

## Setup

```bash
<install-command>
<database-setup-command>
<run-command>
```

## Common Commands

```bash
# Format code
<format-command>

# Lint code
<lint-command>

# Run tests
<test-command>

# Build project
<build-command>

# Run application
<run-command>
```

## Coding Standards

- Keep functions small and focused
- Prefer explicit error handling
- Validate external input
- Avoid hardcoded configuration
- Add tests for new behavior
- Update documentation when behavior changes

## Debugging

Describe how to inspect logs, run in debug mode, and reproduce local issues.

## AI-Assisted Development

AI tools may help with:

- Generating boilerplate
- Explaining unfamiliar code
- Drafting tests
- Refactoring small modules
- Reviewing error messages

AI-generated output must be reviewed before commit.
