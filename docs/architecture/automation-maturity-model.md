# AI DevOps Automation Maturity Model

## Levels

| Level | Name | Description | Human Role |
|---|---|---|---|
| L0 | Manual | AI is used only as a chat assistant | Full execution |
| L1 | Assisted | AI drafts docs, plans, prompts, and summaries | Review and execute |
| L2 | PR Automation | AI creates branches and PRs | Review and merge |
| L3 | Self-Healing CI | AI fixes build, test, lint, and low-risk issues through PRs | Review exceptions |
| L4 | Staging Autonomy | AI deploys and validates staging automatically | Approve production |
| L5 | Governed Production Autonomy | AI can trigger production rollout under policy gates | Supervise and audit |

## Recommended Target

Most organizations should target **L3 to L4** first. Production autonomy should only be enabled after:

- Strong observability exists.
- Rollback is tested.
- Approval gates are enforced.
- Security scanning is reliable.
- Audit evidence is retained.
- Incident process is mature.
