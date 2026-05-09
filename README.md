# AI-Native DevOps GitHub Repository Guidelines

This repository is a GitHub-ready reference structure for implementing an AI-native DevOps operating model using Claude, Codex, GitHub Copilot, ChatGPT, internal agents, CI/CD, IaC, security scanners, observability systems, and policy gates.

The goal is not unsafe full automation. The recommended model is **autonomous execution with policy-controlled human governance**:

- AI agents plan, design, code, test, secure, release, deploy, operate, observe, and learn.
- CI/CD, IaC, scanners, deployment controllers, and monitoring systems remain the deterministic execution layer.
- Policy gates enforce safety, traceability, security, compliance, and production approval boundaries.

![AI-Native DevOps Overall Architecture](docs/assets/images/overall-architecture.png)

## Quick Start

1. Copy this repository structure into your product repository or platform-engineering template.
2. Review `AGENTS.md`, `CLAUDE.md`, `CODEX.md`, and `.github/copilot-instructions.md`.
3. Enable GitHub branch protection and environment protection.
4. Add CI, security, release, and deployment workflows.
5. Start with AI-assisted pull requests, then gradually increase automation maturity.

## Recommended Adoption Path

| Level | Description | Recommended Use |
|---|---|---|
| L0 | Manual DevOps with AI chat support | Learning and documentation |
| L1 | AI drafts plans, docs, prompts, checklists | Low-risk introduction |
| L2 | AI opens PRs, humans review and merge | Recommended default |
| L3 | AI fixes CI/test/build failures automatically through PRs | Mature engineering teams |
| L4 | AI deploys to staging and validates automatically | Strong CI/CD and observability required |
| L5 | AI can trigger production rollout under strict policy gates | Only for highly mature organizations |

## Repository Map

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

## Most Important Rules

1. AI must not push directly to protected branches.
2. All code changes must go through pull requests.
3. Production deployment must use protected environments and approval gates.
4. Secrets must never be exposed to AI prompts or logs.
5. Every AI action must be traceable to an issue, PR, workflow run, or incident record.
6. High-risk security findings require human security approval.
7. Rollback paths must be documented before release or deployment.
