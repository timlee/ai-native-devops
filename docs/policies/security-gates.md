# Security Gates

## Purpose

This policy defines controls required to safely operate AI-assisted and AI-autonomous DevOps workflows.

## Policy Requirements

- All AI actions must be traceable.
- All code changes must go through pull requests.
- Protected branches must require review and passing checks.
- Production deployment must use protected environments.
- Secrets must not be included in prompts, logs, comments, or generated files.
- Critical security findings must block release unless formally accepted.
- Human approval is required for high-risk changes.

## Recommended GitHub Controls

- Branch protection rules
- Required status checks
- Required pull request review
- Code owners
- Signed commits where appropriate
- Environment protection rules
- OIDC-based cloud authentication
- Audit log retention

## Enforcement Checklist

- [ ] Rule is documented.
- [ ] Rule is automated where possible.
- [ ] Rule has an owner.
- [ ] Exceptions require approval.
- [ ] Evidence is retained.
