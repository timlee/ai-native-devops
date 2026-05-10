# Operations Runbook

## Service Ownership

| Area | Owner | Contact |
|---|---|---|
| Application | TBD | TBD |
| Infrastructure | TBD | TBD |
| Security | TBD | TBD |

## Service Health

Define normal operating conditions.

| Signal | Normal Range | Alert Threshold |
|---|---|---|
| Error rate | TBD | TBD |
| Latency | TBD | TBD |
| CPU / Memory | TBD | TBD |
| Queue depth | TBD | TBD |

## Common Operational Tasks

### Restart Service

```bash
<restart-command>
```

### Check Logs

```bash
<log-command>
```

### Check Deployment Status

```bash
<status-command>
```

## Incident Response

1. Confirm impact
2. Assign incident owner
3. Review recent deployments
4. Inspect logs, metrics, and traces
5. Mitigate user impact
6. Communicate status
7. Document timeline
8. Create follow-up action items

## Escalation

| Severity | Description | Response |
|---|---|---|
| SEV1 | Major outage or data risk | Immediate escalation |
| SEV2 | Significant degradation | Same-day response |
| SEV3 | Minor issue | Normal priority |

## Postmortem Template

```md
# Postmortem

## Summary

## Impact

## Timeline

## Root Cause

## What Went Well

## What Went Wrong

## Action Items
```
