# AGENTS.md — Global Instructions for AI Agents

This file defines the behavior contract for Claude, Codex, Copilot Coding Agent, ChatGPT, and internal AI agents working in this repository.

## Operating Principles

- Prefer small, reviewable pull requests.
- Preserve existing architecture unless the issue explicitly requests redesign.
- Do not introduce new dependencies without justification.
- Do not modify generated files unless the build process requires it.
- Do not remove tests to make CI pass.
- Do not weaken security controls, linting rules, or policy checks.
- Do not hardcode secrets, tokens, credentials, passwords, private keys, or internal URLs.
- Record assumptions clearly in PR descriptions.

## Required Workflow

1. Read the issue, acceptance criteria, and related documents.
2. Inspect existing code, tests, architecture docs, and recent changes.
3. Produce an implementation plan before editing significant code.
4. Create or update tests with the implementation.
5. Run relevant checks locally or through CI.
6. Open a pull request with summary, test evidence, risk, and rollback notes.

## Pull Request Requirements

Every AI-generated PR must include:

- Problem summary
- Implementation summary
- Files changed
- Tests added or updated
- Commands run
- Risk assessment
- Rollback plan
- Known limitations
- AI tool used

## Forbidden Actions

AI agents must not:

- Push to `main`, `master`, `release/*`, or protected branches.
- Approve their own pull requests.
- Bypass branch protection.
- Disable security scanning.
- Approve production deployments.
- Accept critical vulnerabilities without a formal exception.
- Modify audit logs or compliance evidence.

## Safe Autonomy Scope

AI agents may autonomously create PRs for:

- Documentation updates
- Test generation
- Lint fixes
- Small bug fixes
- Build script improvements
- Non-production workflow improvements
- Low-risk dependency updates

Human review is required for:

- Architecture changes
- Authentication or authorization changes
- Database migrations
- Infrastructure changes
- Production deployment changes
- Security exceptions
- Incident mitigation decisions
