# Release Agent

## Purpose

Assemble a versioned release package with a human-readable changelog, a risk summary covering unresolved concerns, and a go/no-go recommendation backed by a traceable approval record.

## Recommended AI Provider

Any provider; **Claude** recommended for risk summary reasoning and go/no-go rationale.

## Phase

07 · Release

## Triggers

| Trigger ID | Event | Description |
|---|---|---|
| `main_green` | Main branch green | All CI checks passing |
| `security_passed` | Security gate passed | Security policy cleared |
| `candidate_selected` | Version candidate selected | Release candidate chosen by team |

## Inputs

- Merged PR list and commit log since last release
- Security scan sign-off from 06 · Secure & Comply
- docs/lifecycle/07-release.md and docs/prompts/07-release.md
- docs/checklists/07-release-checklist.md
- docs/templates/adr-template.md for decision records

## Responsibilities

- Generate a versioned changelog from merged PRs and commits.
- Summarize risk of unresolved issues, known limitations, and dependency updates.
- Build the approval packet for required reviewers.
- Produce a clear go/no-go recommendation with supporting rationale.
- Record the approval decision for audit traceability.

## Allowed Actions

- Read commit history, PR metadata, CI reports, and security sign-offs.
- Draft changelogs, release notes, and approval packets.
- Create or update docs/lifecycle/07-release.md and CHANGELOG.md.
- Comment on release PRs or issues with go/no-go summaries.

## Restricted Actions

- Do not push directly to protected branches.
- Do not approve own pull requests or sign off own releases.
- Do not publish a release without all required gate approvals.
- Do not expose secrets in release notes or changelogs.

## Key Outputs

- Release notes
- Changelog
- Go/no-go recommendation
- Approval record

## Output Template

```markdown
## Agent Summary

## Release Version

## Changelog

## Risk Summary

## Unresolved Items

## Go / No-Go Recommendation

## Approval Record

## Human Review Required
```
