# Deployment Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define requirements for deploying changes safely, reliably, and audibly across environments.

## Scope

Applies to development, staging, production, disaster recovery, cloud, Kubernetes, serverless, and infrastructure deployments.

## Mandatory Rules

- Production deployments must use approved CI/CD workflows.
- Production deployment environments must require appropriate approvals.
- Deployment artifacts must be traceable to release records.
- Rollback plan or mitigation path must exist before production deployment.
- Pre-deployment checks must pass before rollout.
- Progressive delivery should be used for high-risk changes where practical.
- Deployment status and outcome must be recorded.
- Deployment credentials must use least privilege.
- AI agents must not deploy to production without authorization and policy gates.
- Failed deployments must be reviewed and linked to corrective actions.

## Required Checks

- Environment approval
- Pre-deployment validation
- Manifest or IaC validation
- Health check
- Rollback readiness check
- Deployment log retention
- Post-deployment verification

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Generate deployment plans and checklists
- Review manifests for risk and consistency
- Summarize readiness
- Monitor rollout signals when allowed
- Recommend rollback when thresholds breach
- Do not bypass environment protection

## Human Responsibilities

- Approve production deployments
- Validate readiness
- Monitor outcome
- Authorize rollback or mitigation
- Review failed deployments

## Required Evidence and Artifacts

- Deployment plan
- Manifest/IaC package
- Approval record
- Deployment logs
- Health check results
- Rollback plan
- Deployment outcome record

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

