# BUILD Checklist

## Entry Criteria

- [ ] Work item is linked.
- [ ] Scope is understood.
- [ ] Required inputs are available.
- [ ] Dependencies are identified.

## Required Inputs

- [ ] docs/lifecycle/04-build.md reviewed.
- [ ] docs/prompts/04-build.md reviewed.
- [ ] docs/agents/build-agent.md reviewed.
- [ ] Relevant workflow logs are available.

## Execution Checklist

- [ ] Dependency resolution
- [ ] Compilation
- [ ] Packaging
- [ ] Container image creation
- [ ] SBOM generation

## Artifact Checklist

- [ ] Build logs
- [ ] Binaries
- [ ] Packages
- [ ] Container images
- [ ] SBOM

## Required Output Files

- [ ] docs/workflows/ci.md updated if build process changed.
- [ ] docs/workflows/security.md updated if build security expectations changed.

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

- [ ] Build evidence and failures are captured for TEST and SECURE / COMPLY.
