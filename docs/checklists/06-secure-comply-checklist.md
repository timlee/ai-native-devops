# SECURE / COMPLY Checklist

## Entry Criteria

- [ ] Work item is linked.
- [ ] Scope is understood.
- [ ] Required inputs are available.
- [ ] Dependencies are identified.

## Required Inputs

- [ ] docs/lifecycle/06-secure-comply.md reviewed.
- [ ] docs/prompts/06-secure-comply.md reviewed.
- [ ] docs/agents/security-agent.md reviewed.
- [ ] Scan results and policy findings are available.

## Execution Checklist

- [ ] SAST and DAST analysis
- [ ] SCA dependency scan
- [ ] Secret scanning
- [ ] IaC validation
- [ ] Compliance evidence

## Artifact Checklist

- [ ] Vulnerability reports
- [ ] Secret scan results
- [ ] Risk register
- [ ] Exception records
- [ ] Security sign-off

## Required Output Files

- [ ] docs/policies/security-gates.md updated.
- [ ] docs/policies/secrets-management.md updated.
- [ ] docs/security/security-model.md updated.

## AI Usage Checklist

- [ ] AI context is limited to necessary information.
- [ ] No secrets are included in prompts.
- [ ] AI assumptions are documented.
- [ ] AI output has been reviewed.
- [ ] Validation evidence is attached.

## Exit Criteria

- [ ] Required artifacts are complete.
- [ ] Quality gates passed.
- [ ] Risks are documented.
- [ ] Handoff is ready.

## Handoff

- [ ] Blocking findings and approval state are captured for RELEASE.
