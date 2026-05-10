"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_AUTOMATION_SPECS = void 0;
exports.getAgentSpecByPhase = getAgentSpecByPhase;
exports.buildAutomationPrompt = buildAutomationPrompt;
exports.AGENT_AUTOMATION_SPECS = [
    {
        phaseId: 0,
        phaseKey: "requirement",
        agentName: "REQUIREMENT agent",
        objective: "Convert raw stakeholder requirements into five structured planning artifacts ready for the PLAN phase.",
        triggers: [
            { id: "manual_input", label: "Manual requirement input", description: "User-entered requirements text" },
        ],
        automatedFlow: [
            "Parse and clarify the raw requirements text",
            "Generate a prioritized product requirements list",
            "Decompose into backlog items with labels and priorities",
            "Write user stories in As a / I want / So that format",
            "Define measurable acceptance criteria per story",
            "Record planning notes: assumptions, risks, open questions",
        ],
        outputs: [
            "Product requirements",
            "Backlog items",
            "User stories",
            "Acceptance criteria",
            "Planning notes",
        ],
        artifactPaths: [
            "plan/product-requirements.md",
            "plan/backlog-items.md",
            "plan/user-stories.md",
            "plan/acceptance-criteria.md",
            "plan/planning-notes.md",
        ],
    },
    {
        phaseId: 1,
        phaseKey: "plan",
        agentName: "PLAN agent",
        objective: "Use AI agents and deterministic DevOps tooling to improve speed, quality, reliability, and traceability across requirement analysis, user stories, acceptance criteria, effort and risk estimation, and backlog prioritization.",
        triggers: [
            { id: "issue_opened", label: "GitHub Issue opened", description: "New issue or feature request intake" },
            { id: "jira_ticket", label: "Jira ticket created", description: "New product or engineering request" },
            { id: "slack_request", label: "Slack request", description: "Ad-hoc intake from chat" },
            { id: "pr_opened", label: "Pull request opened", description: "Changes requiring planning review" },
        ],
        automatedFlow: [
            "Summarize context from issues, pull requests, logs, docs, and previous decisions",
            "Generate structured drafts of user stories and acceptance criteria for human review",
            "Identify missing requirements, risks, edge cases, and dependencies",
            "Produce implementation, testing, security, and operational recommendations",
            "Create pull requests only when scope is clear and policy allows",
            "Record assumptions and evidence for auditability",
        ],
        outputs: [
            "Summary of current state",
            "Recommended next steps",
            "Risks and missing information",
            "Artifacts to create or update",
            "Validation checklist",
            "Human approval points",
        ],
        artifactPaths: [
            "docs/lifecycle/01-plan.md",
            "docs/prompts/01-plan.md",
        ],
    },
    {
        phaseId: 2,
        phaseKey: "design",
        agentName: "DESIGN agent",
        objective: "Translate approved planning artifacts into architecture options, ADR, API contract, and threat model.",
        triggers: [
            { id: "ready_for_design", label: "Issue labeled ready-for-design", description: "Design gate opened" },
        ],
        automatedFlow: [
            "Generate architecture options with trade-offs",
            "Draft API contract and data model",
            "Produce ADR proposal",
            "Produce threat model assumptions and mitigations",
            "Map implementation boundaries in current repository",
        ],
        outputs: [
            "Architecture options",
            "ADR",
            "API contract",
            "Threat model",
        ],
        artifactPaths: [
            "docs/architecture/design-draft.md",
            "docs/adr/ADR-0001-design-decision.md",
            "docs/api/openapi.yaml",
            "docs/security/threat-model.md",
        ],
    },
    {
        phaseId: 3,
        phaseKey: "code",
        agentName: "CODE agent",
        objective: "Implement approved scope with tests and a review-ready PR package that satisfies repository governance requirements.",
        triggers: [
            { id: "ai_code", label: "Issue labeled ai-code", description: "Coding automation requested" },
            { id: "pr_opened", label: "Pull request opened", description: "New changes ready for review" },
            { id: "assigned_coding_agent", label: "Assigned to coding agent", description: "Agent ownership assigned" },
        ],
        automatedFlow: [
            "Read issue and create implementation plan",
            "Propose branch naming and code changes",
            "Generate or modify implementation and unit tests",
            "Run test commands and summarize outcomes",
            "Prepare PR body with required governance sections",
        ],
        outputs: [
            "Feature branch",
            "PR with tests",
            "Implementation notes",
        ],
        artifactPaths: [
            ".github/pull_request_template.md",
            "docs/workflows/ai-code-pr.md",
        ],
    },
    {
        phaseId: 4,
        phaseKey: "build",
        agentName: "BUILD agent",
        objective: "Ensure reproducible builds with signed artifacts and supply-chain metadata; diagnose and remediate build failures.",
        triggers: [
            { id: "ci_failed", label: "CI build failed", description: "Pipeline build failure" },
            { id: "docker_failed", label: "Docker build failed", description: "Container build failure" },
            { id: "dependency_conflict", label: "Dependency conflict", description: "Version or lock conflict" },
        ],
        automatedFlow: [
            "Analyze build log and identify root cause",
            "Propose config, script, or Dockerfile remediation",
            "Recommend rerun validation steps",
            "Generate SBOM and provenance guidance aligned with SLSA",
        ],
        outputs: [
            "Reproducible build",
            "Signed artifact",
            "SBOM",
        ],
        artifactPaths: [
            "docs/workflows/ci.md",
            "docs/workflows/security.md",
        ],
    },
    {
        phaseId: 5,
        phaseKey: "test",
        agentName: "TEST agent",
        objective: "Expand test coverage, explain failures, and trace test results to acceptance criteria.",
        triggers: [
            { id: "pr_opened", label: "PR opened", description: "New changes ready for tests" },
            { id: "ci_failed", label: "CI test failed", description: "Failing test suite" },
            { id: "coverage_low", label: "Coverage below threshold", description: "Coverage gate violation" },
        ],
        automatedFlow: [
            "Generate missing unit and integration tests",
            "Analyze flaky tests and probable causes",
            "Check acceptance criteria coverage and edge cases",
            "Assess regression risk and mock or fixture needs",
            "Produce repair PR suggestion",
        ],
        outputs: [
            "Test results",
            "Coverage report",
            "Regression analysis",
        ],
        artifactPaths: [
            "docs/lifecycle/05-test.md",
            "docs/checklists/05-test-checklist.md",
        ],
    },
    {
        phaseId: 6,
        phaseKey: "secure-comply",
        agentName: "SECURE / COMPLY agent",
        objective: "Consolidate security scan findings, rank by risk tier, and drive remediation with compliance sign-off.",
        triggers: [
            { id: "security_alert", label: "Security alert fired", description: "Scanner or policy alert" },
            { id: "sast_failed", label: "SAST failed", description: "Static scan findings" },
            { id: "sca_failed", label: "SCA failed", description: "Dependency vulnerability findings" },
            { id: "secret_scan_failed", label: "Secret scan failed", description: "Secret exposure finding" },
            { id: "container_scan_failed", label: "Container scan failed", description: "Image vulnerability findings" },
            { id: "iac_scan_failed", label: "IaC scan failed", description: "Infrastructure policy findings" },
        ],
        automatedFlow: [
            "Aggregate and de-duplicate findings",
            "Rank findings by exploitability and impact",
            "Create remediation tasks",
            "Auto-fix low-risk findings with PR suggestions",
            "Escalate high and critical findings with approval guidance",
        ],
        decisionPolicy: [
            "Low: auto-fix + PR",
            "Medium: PR + reviewer required",
            "High: remediation plan + security approver decision",
            "Critical: block release unless formal exception",
        ],
        outputs: [
            "SAST/SCA/secret-scan results",
            "Remediation plan",
            "Compliance sign-off",
        ],
        artifactPaths: [
            "docs/policies/security-gates.md",
            "docs/policies/secrets-management.md",
            "docs/security/security-model.md",
        ],
    },
    {
        phaseId: 7,
        phaseKey: "release",
        agentName: "RELEASE agent",
        objective: "Assemble versioned release package with risk summary, changelog, and go/no-go recommendation.",
        triggers: [
            { id: "main_green", label: "Main branch green", description: "All checks passing" },
            { id: "security_passed", label: "Security gate passed", description: "Security policy passed" },
            { id: "candidate_selected", label: "Version candidate selected", description: "Release candidate chosen" },
        ],
        automatedFlow: [
            "Generate changelog and release notes",
            "Summarize risk and unresolved concerns",
            "Build approval packet",
            "Produce go/no-go recommendation",
        ],
        outputs: [
            "Release notes",
            "Changelog",
            "Go/no-go recommendation",
            "Approval record",
        ],
        artifactPaths: [
            "docs/workflows/release.md",
            "docs/lifecycle/07-release.md",
        ],
    },
    {
        phaseId: 8,
        phaseKey: "deploy",
        agentName: "DEPLOY agent",
        objective: "Plan and validate safe progressive rollouts with environment protection, health verification, and rollback readiness.",
        triggers: [
            { id: "release_approved", label: "Release approved", description: "Deployment gate entered" },
            { id: "deploy_complete", label: "Deployment complete", description: "Rollout finished — validate health" },
        ],
        automatedFlow: [
            "Validate manifests and environment readiness",
            "Generate rollout, canary, and rollback plan",
            "Check environment protection rule assumptions",
            "Verify post-deploy health signals",
        ],
        outputs: [
            "Deployment record",
            "Rollback plan",
            "Environment validation",
        ],
        artifactPaths: [
            "docs/workflows/deploy-staging.md",
            "docs/workflows/deploy-production.md",
            "docs/policies/deployment-gates.md",
        ],
    },
    {
        phaseId: 9,
        phaseKey: "operate",
        agentName: "OPERATE agent",
        objective: "Automate runbook drafting and low-risk operations with full auditability and change traceability.",
        triggers: [
            { id: "scheduled_job", label: "Scheduled job", description: "Routine operations" },
            { id: "change_request", label: "Change request", description: "Requested operational change" },
            { id: "capacity_alert", label: "Capacity alert", description: "Scaling or cost signal" },
        ],
        automatedFlow: [
            "Generate or update runbook",
            "Recommend low-risk executable operations",
            "Analyze capacity and cost trends",
            "Propose scaling and ops actions",
        ],
        decisionPolicy: [
            "Read-only analysis: fully automated",
            "Low-risk operation: auto-run with audit",
            "Config change: PR + approval",
            "Production mutation: approval gate",
        ],
        outputs: [
            "Config change log",
            "Access review",
            "Runbook update",
        ],
        artifactPaths: [
            "docs/templates/runbook-template.md",
            "docs/lifecycle/09-operate.md",
        ],
    },
    {
        phaseId: 10,
        phaseKey: "monitor-observe",
        agentName: "MONITOR / OBSERVE agent",
        objective: "Correlate telemetry signals, validate SLOs, detect anomalies, and generate incident-ready summaries.",
        triggers: [
            { id: "alert_fired", label: "Alert fired", description: "Monitoring alert event" },
            { id: "slo_burn", label: "SLO burn rate spike", description: "Reliability risk signal" },
            { id: "deploy_complete", label: "Deployment complete", description: "Validate post-deploy health" },
            { id: "dashboard_anomaly", label: "Dashboard anomaly", description: "Unexpected metric movement" },
        ],
        automatedFlow: [
            "Correlate metrics, logs, and traces",
            "Link anomaly to recent deployment or config changes",
            "Validate SLO budget status",
            "Estimate likely causes and owner candidates",
            "Draft incident ticket if threshold exceeded",
        ],
        outputs: [
            "SLO validation report",
            "Alert quality review",
            "Capacity notes",
        ],
        artifactPaths: [
            "docs/lifecycle/10-monitor-observe.md",
            "docs/workflows/incident-response.md",
        ],
    },
    {
        phaseId: 11,
        phaseKey: "incident-learn",
        agentName: "INCIDENT / LEARN agent",
        objective: "Document incident timeline, generate RCA hypotheses, author postmortem, and convert action items into backlog.",
        triggers: [
            { id: "incident_opened", label: "Incident declared", description: "Incident lifecycle started" },
        ],
        automatedFlow: [
            "Create incident channel summary",
            "Collect logs, metrics, and deployment history",
            "Generate timeline and RCA hypotheses",
            "Draft postmortem",
            "Convert action items into backlog tasks",
        ],
        outputs: [
            "Incident timeline",
            "RCA",
            "Postmortem",
            "Action items backlog",
        ],
        artifactPaths: [
            "docs/templates/postmortem-template.md",
            "docs/lifecycle/11-incident-learn.md",
            "docs/operations/incident-process.md",
        ],
    },
];
function getAgentSpecByPhase(phaseId) {
    return exports.AGENT_AUTOMATION_SPECS.find((spec) => spec.phaseId === phaseId);
}
function buildAutomationPrompt(phase, spec, trigger, requestContext, requirements) {
    const flow = spec.automatedFlow.map((step, i) => `${i + 1}. ${step}`).join("\n");
    const outputs = spec.outputs.map((item) => `- ${item}`).join("\n");
    const repositoryDirectories = requirements?.repositoryDirectories?.length
        ? requirements.repositoryDirectories.map((item) => `- ${item}`).join("\n")
        : "- Refer to the phase documentation in docs/lifecycle and docs/prompts.";
    const mandatoryInputs = requirements?.mandatoryInputFiles?.length
        ? requirements.mandatoryInputFiles.map((item) => `- ${item}`).join("\n")
        : `- ${phase.lifecycleFile}\n- ${phase.promptFile}\n- ${phase.checklistFile}\n- ${phase.agentFile}`;
    const artifacts = requirements?.requiredOutputFiles?.length
        ? requirements.requiredOutputFiles.map((item) => `- ${item}`).join("\n")
        : spec.artifactPaths.map((item) => `- ${item}`).join("\n");
    const policy = spec.decisionPolicy
        ? `\nAutomation Policy:\n${spec.decisionPolicy.map((p) => `- ${p}`).join("\n")}`
        : "";
    return [
        `You are operating as the ${spec.agentName} for phase ${phase.label}.`,
        "",
        `Objective: ${spec.objective}`,
        `Trigger: ${trigger.label} (${trigger.description})`,
        "",
        "Request Context:",
        requestContext,
        "",
        "Repository Directories:",
        repositoryDirectories,
        "",
        "Mandatory Input Files:",
        mandatoryInputs,
        "",
        "Execute this automation workflow:",
        flow,
        policy,
        "",
        "Required Output Sections (Markdown):",
        outputs,
        "",
        "Expected Artifacts / File Targets:",
        artifacts,
        "",
        "Required Controls:",
        "- All changes must be linked to an issue, PR, workflow run, or incident record.",
        "- Production-impacting changes require approval gates.",
        "- Security and compliance exceptions must be documented.",
        "- Generated outputs must be reviewed for correctness and completeness.",
        "",
        "Exit Criteria (confirm before handoff):",
        "- Required artifacts are complete.",
        "- Quality gates for this phase are satisfied.",
        "- Risks are documented or accepted.",
        "- Handoff to the next phase is clear.",
        "",
        "Return a complete, actionable, implementation-ready output as structured Markdown.",
    ].join("\n");
}
//# sourceMappingURL=agentAutomation.js.map