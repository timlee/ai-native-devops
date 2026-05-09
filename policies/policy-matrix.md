# Policy Matrix

> Last updated: 2026-05-09

This matrix maps DevOps lifecycle phases to the recommended policy files and required evidence.

| Phase | Primary Policies | Required Evidence |
|---|---|---|
| PLAN | `change-management-policy.md`, `ai-guardrails.md` | Issue, problem statement, acceptance criteria, risk notes |
| DESIGN | `security-policy.md`, `data-handling-policy.md`, `infrastructure-policy.md` | ADR, API spec, threat model, data review |
| CODE | `coding-policy.md`, `code-review-policy.md`, `ai-guardrails.md` | Pull request, review comments, lint/static analysis |
| BUILD | `supply-chain-policy.md`, `third-party-dependency-policy.md` | Build logs, artifact manifest, SBOM, provenance |
| TEST | `testing-policy.md` | Test report, coverage report, defect log |
| SECURE / COMPLY | `security-policy.md`, `compliance-policy.md`, `secrets-management-policy.md` | Scan reports, remediation plan, exception records |
| RELEASE | `release-policy.md`, `compliance-policy.md` | Version tag, changelog, release notes, approval record |
| DEPLOY | `deployment-policy.md`, `rollback-policy.md`, `access-control-policy.md` | Deployment plan, approval, logs, health checks |
| OPERATE | `infrastructure-policy.md`, `observability-policy.md`, `cost-management-policy.md` | Runbooks, config records, cost/capacity reports |
| MONITOR / OBSERVE | `observability-policy.md`, `audit-logging-policy.md` | Dashboards, alert rules, SLO reports, anomaly logs |
| INCIDENT / LEARN | `incident-policy.md`, `backup-recovery-policy.md`, `change-management-policy.md` | Incident timeline, RCA, postmortem, action items |

## Minimum Required Gates by Risk Level

| Risk Level | Required Gates |
|---|---|
| Low | CI pass, normal PR review |
| Medium | CI pass, tests, code owner review |
| High | Security review, rollback plan, approval record |
| Critical | Formal risk acceptance, incident/release owner approval, executive or security approval where applicable |

## AI Automation Permission Matrix

| Action | AI Allowed? | Required Control |
|---|---:|---|
| Draft documentation | Yes | Human review for policy or external docs |
| Generate tests | Yes | Test review and CI validation |
| Modify application code | Yes | Pull request and review |
| Modify CI/CD workflows | Limited | Platform review |
| Modify security controls | Limited | Security review |
| Read production telemetry | Yes, if approved | Read-only scoped access |
| Change production configuration | Limited | Approval and audit log |
| Deploy to staging | Yes, if approved | CI/CD policy gates |
| Deploy to production | No autonomous deploy by default | Human approval and environment protection |
| Accept security risk | No | Security/risk owner approval |
| Access raw secrets | No | Use secret manager or short-lived identity |
