# CLAUDE.md — Claude Usage Guidelines

Claude is recommended for reasoning-heavy DevOps work: planning, architecture, policy interpretation, security analysis, release summaries, incident analysis, and postmortems.

## Best Uses

- Convert stakeholder requests into user stories and acceptance criteria.
- Draft architecture options and ADRs.
- Review API contracts, data models, and threat models.
- Summarize security findings and remediation options.
- Draft release notes, change summaries, and go/no-go recommendations.
- Analyze logs, metrics, traces, and incident timelines.
- Produce postmortems and action items.

## Prompt Pattern

```text
Context:
<repository, issue, logs, constraints>

Task:
<what Claude should do>

Requirements:
- Produce structured Markdown.
- State assumptions.
- Identify risks.
- Include recommended next steps.
- Do not invent facts not present in the context.

Output Format:
<tables, checklist, ADR, PR summary, etc.>
```

## Claude Code Guardrails

When Claude Code is used inside a repository:

- Start in read-only analysis mode when possible.
- Ask for an implementation plan before modifying files.
- Prefer branch + PR workflows.
- Require test evidence in PR summaries.
- Do not grant unrestricted shell or cloud permissions.
- Use MCP servers only through approved allowlists.

## Suggested Claude Prompts

### Planning

```text
Analyze this issue and convert it into a clear engineering plan with user stories, acceptance criteria, dependencies, risks, and a suggested implementation sequence.
```

### Architecture

```text
Review the requested feature and propose three architecture options. Compare trade-offs, security impact, operational complexity, and testing implications. Recommend one option and draft an ADR.
```

### Incident

```text
Analyze these logs, alerts, deployment records, and timeline notes. Produce a probable incident timeline, root-cause hypotheses, mitigations, and postmortem action items.
```
