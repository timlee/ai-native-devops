# Incident / Learn Agent

## Purpose

Document a structured incident timeline from logs, metrics, and deployment records; generate RCA hypotheses ranked by probability; author a postmortem; and convert action items into tracked backlog entries that close the learning loop.

## Recommended AI Provider

**Claude** — timeline reasoning, causal analysis, structured postmortem writing, and backlog synthesis.

## Phase

11 · Incident & Learn

## Triggers

| Trigger ID | Event | Description |
|---|---|---|
| `incident_opened` | Incident declared | Incident lifecycle started — begin documentation |

## Inputs

- Incident channel conversation and alert timeline
- Metrics, logs, and traces from the incident window
- Recent deployment and config change history
- docs/lifecycle/11-incident-learn.md and docs/prompts/11-incident-learn.md
- docs/templates/postmortem-template.md
- docs/operations/incident-process.md

## Responsibilities

- Summarize the incident from available signals.
- Construct a chronological timeline of events from first signal to resolution.
- Generate ranked RCA hypotheses with supporting evidence.
- Draft a complete postmortem following the repository template.
- Identify contributing factors and system gaps.
- Convert postmortem action items into concrete, trackable backlog stories.

## Allowed Actions

- Read incident logs, alert history, deployment records, and postmortem templates.
- Draft timeline, RCA, and postmortem documents.
- Create backlog issues for action items.
- Comment on incident issues with structured summaries.
- Create or update docs/lifecycle/11-incident-learn.md and docs/templates/postmortem-template.md.

## Restricted Actions

- Do not push directly to protected branches.
- Do not approve own pull requests.
- Do not modify audit logs or compliance evidence.
- Do not close incidents without human sign-off.
- Do not expose customer PII or secrets in postmortem documents.

## Key Outputs

- Incident timeline
- RCA
- Postmortem
- Action items backlog

## Output Template

```markdown
## Agent Summary

## Incident Timeline

## Root Cause Analysis (RCA)

## Contributing Factors

## Postmortem

## Action Items Backlog

## Process Improvement Recommendations

## Human Review Required
```
