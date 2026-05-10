# 10 MONITOR / OBSERVE Lifecycle Guide

## Phase Objective

Correlate telemetry, identify anomalies quickly, and prepare incident-ready monitoring context and ownership clues.

## Repository Directories

- docs/lifecycle
- docs/prompts
- docs/checklists
- docs/agents
- docs/workflows
- docs/operations
- .github/workflows

## Mandatory Input Files

- docs/lifecycle/10-monitor-observe.md
- docs/prompts/10-monitor-observe.md
- docs/checklists/10-monitor-observe-checklist.md
- docs/agents/observability-agent.md
- docs/workflows/incident-response.md

## Required Output Files

- docs/lifecycle/10-monitor-observe.md
- docs/workflows/incident-response.md

## Core Activities

- Metrics review
- Logs and traces correlation
- Alert tuning
- SLO tracking
- Anomaly detection

## Recommended AI Provider

**Claude** — telemetry reasoning, anomaly pattern analysis, SLO interpretation, and causal linking.

## AI And Automation Expectations

- Correlate alerts, metrics, logs, traces, and recent changes.
- Identify likely causes, blast radius, and owner candidates.
- Draft incident-ready summaries and escalation steps.
- Update monitoring guidance artifacts.

## Controls And Approval Gates

- Preserve observability evidence and timestamps.
- Avoid speculative conclusions without noting confidence.
- Escalate sustained reliability or customer-impacting events.
- Keep monitoring recommendations auditable.

## Validation And Exit Criteria

- Correlation findings are documented.
- Escalation thresholds are clear.
- Incident response guidance is current.
- Handoff to INCIDENT / LEARN is clear when needed.

## Handoff

- Provide anomaly summary, likely causes, and evidence to INCIDENT / LEARN when escalation is required.
