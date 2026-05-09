# Infrastructure Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define best practices for infrastructure-as-code, cloud resources, Kubernetes, networking, runtime configuration, and environment management.

## Scope

Applies to Terraform, CloudFormation, Pulumi, Kubernetes manifests, Helm charts, Ansible, cloud resources, CI/CD infrastructure, and runtime configuration.

## Mandatory Rules

- Infrastructure changes must be version-controlled IaC where practical.
- Manual production infrastructure changes must be avoided and documented if necessary.
- IaC must be reviewed before apply.
- Infrastructure plans must be reviewed for destructive changes.
- Least privilege must be applied to IAM and runtime identities.
- Public exposure must be intentional and documented.
- Encryption must be enabled for sensitive data where supported.
- Production and non-production environments must be separated.
- Infrastructure drift must be detected and reviewed.
- Rollback or recovery procedure must exist for critical changes.

## Required Checks

- IaC formatting and validation
- IaC security scan
- Plan review
- Policy-as-code checks
- Environment protection approval
- Drift detection
- Cloud configuration review

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Generate IaC following least privilege
- Explain plan changes and risk
- Do not apply destructive changes without approval
- Flag public access and broad permissions
- Generate rollback notes

## Human Responsibilities

- Review infrastructure plans
- Approve production applies
- Validate security-sensitive resources
- Maintain environment documentation
- Respond to drift

## Required Evidence and Artifacts

- IaC plan
- IaC apply log
- Security scan report
- Change approval
- Rollback plan
- Drift report

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

