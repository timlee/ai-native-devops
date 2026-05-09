# Observability Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define requirements for logs, metrics, traces, dashboards, alerts, SLOs, and production visibility.

## Scope

Applies to applications, services, infrastructure, CI/CD systems, user-facing features, and operational processes.

## Mandatory Rules

- Production services must emit relevant logs, metrics, and traces.
- Critical user journeys should have SLIs where practical.
- Alerts must be actionable and routed to an owner.
- Alert thresholds must be reviewed and tuned.
- Dashboards must cover health, performance, reliability, capacity, and error trends.
- Logs must not contain secrets or unnecessary sensitive data.
- New production services must include runbooks and observability coverage.
- Incidents must preserve telemetry evidence.
- SLO violations must be reviewed.
- Telemetry changes should be version-controlled where practical.

## Required Checks

- Dashboard review
- Alert rule review
- SLO / error budget review
- Log privacy checks
- Telemetry coverage check
- Runbook linkage
- Incident evidence review

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Suggest useful metrics, logs, and traces
- Generate dashboard queries and alert rules
- Explain anomalies using telemetry
- Correlate alerts with deployments
- Avoid noisy alerts
- Flag sensitive data in logs

## Human Responsibilities

- Own dashboards and alerts
- Review SLO status
- Tune alert thresholds
- Maintain runbook links
- Validate observability before launch

## Required Evidence and Artifacts

- Observability plan
- Dashboard links
- Alert rules
- SLO reports
- Telemetry configuration
- Incident telemetry evidence

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

