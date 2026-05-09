# Policy Files for Best Practices

> Policy version: 1.0  
> Last updated: 2026-05-09

This directory defines best-practice policy files for an AI-native DevOps repository. These policies guide humans, AI agents, CI/CD systems, and automated governance checks.

## Purpose

Policy files establish a shared operating model for secure, reliable, auditable, and AI-assisted software delivery.

They help teams:

- Define what AI agents are allowed and not allowed to do
- Standardize engineering, testing, security, release, deployment, and incident workflows
- Enforce policy gates across the DevOps lifecycle
- Preserve traceability, accountability, and audit evidence
- Reduce delivery risk while enabling AI-assisted automation
- Support continuous improvement after incidents, failed deployments, or security findings

## Directory Structure

```text
policies/
├── README.md
├── ai-guardrails.md
├── model-governance-policy.md
├── coding-policy.md
├── code-review-policy.md
├── testing-policy.md
├── security-policy.md
├── secrets-management-policy.md
├── data-handling-policy.md
├── access-control-policy.md
├── supply-chain-policy.md
├── third-party-dependency-policy.md
├── infrastructure-policy.md
├── observability-policy.md
├── compliance-policy.md
├── change-management-policy.md
├── release-policy.md
├── deployment-policy.md
├── rollback-policy.md
├── incident-policy.md
├── backup-recovery-policy.md
├── audit-logging-policy.md
├── cost-management-policy.md
├── exception-policy.md
└── policy-matrix.md
```

## Policy Enforcement Model

Policies should be enforced through a combination of:

- Pull request templates
- Branch protection rules
- CODEOWNERS and required reviewers
- CI/CD quality gates
- Security scanners
- Deployment environment protection rules
- Infrastructure-as-code validation
- Audit logs and evidence retention
- Human approvals for high-risk actions
- AI agent instructions and tool permission boundaries

## AI Agent Baseline Rules

All AI agents must follow these baseline rules:

- Do not push directly to protected branches
- Do not bypass tests, security checks, or approval gates
- Do not approve your own pull request
- Do not expose secrets, credentials, tokens, private keys, or sensitive data
- Do not perform production-impacting actions without explicit authorization
- Always provide a summary, test evidence, and risk notes for proposed changes
- Always preserve traceability between issue, commit, pull request, release, and deployment
- Use least privilege and approved tools only
- Escalate uncertainty, high-risk decisions, policy conflicts, or suspected security incidents

## Minimum Required Policies for Production Repositories

```text
policies/
├── ai-guardrails.md
├── coding-policy.md
├── code-review-policy.md
├── testing-policy.md
├── security-policy.md
├── secrets-management-policy.md
├── release-policy.md
├── deployment-policy.md
├── rollback-policy.md
├── incident-policy.md
└── exception-policy.md
```

## Recommended Policy Gate Coverage

| DevOps Stage | Recommended Policy Gates |
|---|---|
| PLAN | Requirement clarity, scope, acceptance criteria, risk review |
| DESIGN | Architecture review, ADR, threat modeling, data/privacy review |
| CODE | Coding standards, static analysis, secure coding, PR review |
| BUILD | Reproducible build, dependency lock, artifact integrity, SBOM |
| TEST | Required test suites, coverage, regression, performance threshold |
| SECURE / COMPLY | SAST, SCA, secret scan, container scan, IaC scan, license review |
| RELEASE | Versioning, changelog, release notes, approval record |
| DEPLOY | Environment approval, rollout strategy, rollback readiness |
| OPERATE | Runtime configuration control, runbook coverage, access review |
| MONITOR / OBSERVE | SLO, alert quality, telemetry, anomaly handling |
| INCIDENT / LEARN | Severity classification, escalation, RCA, postmortem, action items |

## How to Use These Policies

1. Copy the `policies/` directory into your repository.
2. Review each policy and replace placeholder ownership information.
3. Link policy files from `README.md`, `AGENTS.md`, `CLAUDE.md`, `CODEX.md`, and `.github/copilot-instructions.md`.
4. Convert mandatory rules into CI/CD checks where possible.
5. Add policy gates to pull request templates and GitHub Actions workflows.
6. Use `exception-policy.md` for time-bound exceptions.
7. Review policies regularly and after major incidents or release failures.
