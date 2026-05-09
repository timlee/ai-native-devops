# Exception Policy

> Policy version: 1.0  
> Owner: Engineering / DevOps / Security  
> Last updated: 2026-05-09

## Purpose

Define how temporary exceptions to repository, security, compliance, deployment, and operational policies are requested, reviewed, approved, tracked, and closed.

## Scope

Applies to all policy exceptions, waivers, risk acceptances, emergency changes, and temporary deviations.

## Mandatory Rules

- Exceptions must be documented before policy is bypassed unless emergency response requires immediate action.
- Exceptions must have business justification.
- Exceptions must identify affected systems, risks, compensating controls, owner, approver, and expiration date.
- Permanent exceptions are not allowed unless converted into a policy change.
- Security exceptions require security owner approval.
- Compliance exceptions require compliance or control owner approval.
- Deployment exceptions require platform or release owner approval.
- Expired exceptions must be closed, renewed, or remediated.
- Exception use must be auditable.
- AI agents must not approve exceptions.

## Required Checks

- Exception request record
- Risk assessment
- Compensating control review
- Approval record
- Expiration tracking
- Post-exception review
- Closure evidence

## AI Agent Responsibilities

AI agents such as Claude, Codex, GitHub Copilot, ChatGPT, Gemini, or internal agents must follow these responsibilities:

- Draft exception requests from evidence
- Identify missing risk information
- Suggest compensating controls
- Track expiration reminders where integrated
- Do not approve or hide exceptions

## Human Responsibilities

- Request exceptions only when necessary
- Approve or reject based on risk
- Track expiration
- Ensure remediation before expiration
- Review recurring exceptions

## Required Evidence and Artifacts

- Exception request
- Risk assessment
- Approval record
- Compensating controls
- Expiration date
- Closure or renewal evidence

## Exceptions

This policy governs all exceptions. Any exception to this policy requires executive or designated risk owner approval.

## Review Cadence

Quarterly, or after a major incident, failed deployment, audit finding, or significant process change.

## Exception Request Template

```md
# Policy Exception Request

## Summary

## Policy Being Excepted

## Business Justification

## Affected Systems

## Risk Assessment

## Compensating Controls

## Requested Expiration Date

## Owner

## Required Approvers

## Remediation Plan

## Closure Criteria
```

