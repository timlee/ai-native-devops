# Incident Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define incident detection, classification, escalation, response, recovery, RCA, postmortem, and continuous improvement practices.

## Scope

Applies to production incidents, security incidents, data incidents, availability incidents, performance incidents, deployment incidents, and major internal disruptions.

## Mandatory Rules

- Incidents must be classified by severity, impact, urgency, and affected service.
- Incident commander or owner must be assigned for significant incidents.
- Stakeholder communication must be timely and accurate.
- Mitigation and recovery actions must be tracked.
- Incident evidence must be preserved.
- Root-cause analysis is required for major incidents.
- Blameless postmortems must focus on systems and process improvements.
- Action items must have owners and due dates.
- Security or data incidents must follow specialized escalation paths.
- AI-generated incident summaries must be validated before external communication.

## Required Checks

- Incident ticket
- Severity classification
- Escalation record
- Timeline reconstruction
- Mitigation record
- RCA/postmortem
- Action item tracking
- Knowledge base update

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Summarize alerts and context
- Draft timelines from logs and messages
- Suggest probable causes with evidence
- Draft postmortems and action items
- Avoid unsupported claims
- Do not send external communications without approval

## Human Responsibilities

- Declare and classify incidents
- Lead response coordination
- Approve communications
- Validate RCA and postmortem
- Own action item completion

## Required Evidence and Artifacts

- Incident record
- Timeline
- Status updates
- Mitigation log
- RCA notes
- Postmortem
- Action items
- Knowledge base updates

## Exceptions

Exceptions must be documented, time-bound, risk-assessed, approved by the required owner, and reviewed before expiration.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

