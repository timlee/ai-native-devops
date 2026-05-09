# GitHub Repository Architecture

This document describes the recommended repository structure for an AI-native DevOps project.

## Directory Structure

```text
.
├── AGENTS.md
├── CLAUDE.md
├── CODEX.md
├── README.md
├── docs/
│   ├── architecture/
│   ├── lifecycle/
│   ├── agents/
│   ├── policies/
│   ├── workflows/
│   ├── prompts/
│   ├── checklists/
│   ├── templates/
│   ├── operations/
│   ├── security/
│   └── assets/images/
├── .github/
│   ├── copilot-instructions.md
│   ├── ISSUE_TEMPLATE/
│   └── workflows/
├── policies/
├── prompts/
└── scripts/
```

## Required Files

| File | Purpose |
|---|---|
| `AGENTS.md` | Common rules for all AI agents |
| `CLAUDE.md` | Claude-specific reasoning and workflow guidance |
| `CODEX.md` | Codex-specific implementation guidance |
| `.github/copilot-instructions.md` | GitHub Copilot coding guidance |
| `.github/pull_request_template.md` | Required PR evidence format |
| `.github/ISSUE_TEMPLATE/*` | Structured work intake |
| `.github/workflows/*` | CI/CD, security, release, and deployment automation |
| `policies/*` | Policy-as-code guidance and approval rules |
| `prompts/*` | Reusable AI prompt templates |

## Documentation Rules

- Every major feature should have an issue, design note, or ADR.
- Every architecture change should update `docs/architecture/` or `docs/adr/`.
- Every operational change should update runbooks.
- Every incident should produce postmortem action items.
- Every AI-generated artifact must be reviewable and traceable.
