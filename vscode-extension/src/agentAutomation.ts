import { Phase } from "./phases";

export interface AutomationRequirements {
  repositoryDirectories: string[];
  mandatoryInputFiles: string[];
  requiredOutputFiles: string[];
}

export interface AgentTrigger {
  id: string;
  label: string;
  description: string;
}

export interface AgentAutomationSpec {
  phaseId: number;
  phaseKey: string;
  agentName: string;
  objective: string;
  triggers: AgentTrigger[];
  automatedFlow: string[];
  decisionPolicy?: string[];
  outputs: string[];
  artifactPaths: string[];
}

export const AGENT_AUTOMATION_SPECS: AgentAutomationSpec[] = [
  {
    phaseId: 1,
    phaseKey: "plan",
    agentName: "PLAN agent",
    objective: "Auto decompose requests into actionable backlog with delivery risk visibility.",
    triggers: [
      { id: "github-issue", label: "GitHub Issue created", description: "New issue intake" },
      { id: "jira-ticket", label: "Jira ticket created", description: "New product/engineering request" },
      { id: "slack-request", label: "Slack request", description: "Ad-hoc intake from chat" },
    ],
    automatedFlow: [
      "Summarize request and define problem statement",
      "Generate user stories and acceptance criteria",
      "Identify dependencies and risk hints",
      "Estimate effort and propose backlog labels",
      "Return markdown suitable for GitHub issue",
    ],
    outputs: [
      "PRD snippet",
      "User stories",
      "Acceptance criteria",
      "Planning notes",
      "Risk / effort estimate",
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
    objective: "Generate architecture draft package and ADR/threat model artifacts.",
    triggers: [
      { id: "ready-for-design", label: "Issue labeled ready-for-design", description: "Design gate opened" },
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
      "API contract",
      "Data model",
      "ADR",
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
    objective: "Implement issue scope, add tests, and prepare PR package for human review.",
    triggers: [
      { id: "ai-code", label: "Issue labeled ai-code", description: "Coding automation requested" },
      { id: "assigned-coding-agent", label: "Assigned to coding agent", description: "Agent ownership assigned" },
    ],
    automatedFlow: [
      "Read issue and create implementation plan",
      "Propose branch naming and code changes",
      "Generate/modify implementation and unit tests",
      "Run test commands and summarize outcomes",
      "Prepare PR body with required governance sections",
    ],
    outputs: [
      "Code diff proposal",
      "Unit tests",
      "Test run summary",
      "PR description template",
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
    objective: "Auto diagnose and remediate build failures with supply-chain metadata.",
    triggers: [
      { id: "ci-failed", label: "CI build failed", description: "Pipeline build failure" },
      { id: "docker-failed", label: "Docker build failed", description: "Container build failure" },
      { id: "dependency-conflict", label: "Dependency conflict", description: "Version/lock conflict" },
    ],
    automatedFlow: [
      "Analyze build log and identify root cause",
      "Propose config/script/Dockerfile remediation",
      "Recommend rerun validation steps",
      "Generate SBOM/provenance guidance aligned with SLSA",
    ],
    outputs: [
      "Build failure analysis",
      "Remediation patch plan",
      "SBOM requirements",
      "Checksum/provenance checklist",
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
    objective: "Expand test coverage and explain failures with acceptance-criteria traceability.",
    triggers: [
      { id: "pr-opened", label: "PR opened", description: "New changes ready for tests" },
      { id: "test-failed", label: "Test failed", description: "Failing test suite" },
      { id: "coverage-low", label: "Coverage below threshold", description: "Coverage gate violation" },
    ],
    automatedFlow: [
      "Generate missing unit and integration tests",
      "Analyze flaky tests and probable causes",
      "Check acceptance criteria coverage and edge cases",
      "Assess regression risk and mock/fixture needs",
      "Produce repair PR suggestion",
    ],
    outputs: [
      "Test cases",
      "Coverage report summary",
      "Failure analysis",
      "Benchmark summary",
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
    objective: "Prioritize security findings and automate remediation by risk tier.",
    triggers: [
      { id: "sast-failed", label: "SAST failed", description: "Static scan findings" },
      { id: "sca-failed", label: "SCA failed", description: "Dependency vulnerability findings" },
      { id: "secret-scan-failed", label: "Secret scan failed", description: "Secret exposure finding" },
      { id: "container-scan-failed", label: "Container scan failed", description: "Image vulnerability findings" },
      { id: "iac-scan-failed", label: "IaC scan failed", description: "Infrastructure policy findings" },
    ],
    automatedFlow: [
      "Aggregate and de-duplicate findings",
      "Rank findings by exploitability/impact",
      "Create remediation tasks",
      "Auto-fix low risk findings with PR suggestions",
      "Escalate high/critical findings with approval guidance",
    ],
    decisionPolicy: [
      "Low: auto-fix + PR",
      "Medium: PR + reviewer required",
      "High: remediation plan + security approver decision",
      "Critical: block release unless formal exception",
    ],
    outputs: [
      "Consolidated findings",
      "Risk-ranked remediation plan",
      "Auto-fix patch candidates",
      "Release blocking recommendation",
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
    objective: "Assemble release package with risk summary and go/no-go recommendation.",
    triggers: [
      { id: "main-green", label: "Main branch green", description: "All checks passing" },
      { id: "security-passed", label: "Security gate passed", description: "Security policy passed" },
      { id: "candidate-selected", label: "Version candidate selected", description: "Release candidate chosen" },
    ],
    automatedFlow: [
      "Generate changelog and release notes",
      "Summarize risk and unresolved concerns",
      "Build approval packet",
      "Produce go/no-go recommendation",
    ],
    outputs: [
      "Version tag proposal",
      "Release bundle checklist",
      "Changelog",
      "Release notes",
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
    objective: "Prepare safe rollout plans with environment protection and OIDC guidance.",
    triggers: [
      { id: "release-approved", label: "Release approved", description: "Deployment gate entered" },
    ],
    automatedFlow: [
      "Validate manifests and environment readiness",
      "Generate rollout/canary/rollback plan",
      "Check environment protection rule assumptions",
      "Recommend OIDC-based cloud credential setup",
    ],
    outputs: [
      "Rollout plan",
      "Canary checkpoints",
      "Rollback strategy",
      "Environment gate checklist",
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
    objective: "Automate runbook drafting and low-risk operations with auditability.",
    triggers: [
      { id: "scheduled-job", label: "Scheduled job", description: "Routine operations" },
      { id: "change-request", label: "Change request", description: "Requested operational change" },
      { id: "capacity-alert", label: "Capacity alert", description: "Scaling/cost signal" },
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
      "Runbook draft",
      "Ops action plan",
      "Capacity/cost analysis",
      "Scaling recommendation",
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
    objective: "Correlate telemetry anomalies and generate incident-ready summaries.",
    triggers: [
      { id: "alert", label: "Alert fired", description: "Monitoring alert event" },
      { id: "slo-burn", label: "SLO burn rate spike", description: "Reliability risk signal" },
      { id: "dashboard-anomaly", label: "Dashboard anomaly", description: "Unexpected metric movement" },
    ],
    automatedFlow: [
      "Correlate metrics/logs/traces",
      "Link anomaly to recent deployment/config changes",
      "Estimate likely causes and owner candidates",
      "Draft incident ticket",
    ],
    outputs: [
      "Alert summary",
      "Anomaly explanation",
      "Correlation timeline",
      "Suggested owner",
      "Incident draft",
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
    objective: "Automate incident documentation, RCA hypotheses, and feedback loops into backlog.",
    triggers: [
      { id: "incident-declared", label: "Incident declared", description: "Incident lifecycle started" },
    ],
    automatedFlow: [
      "Create incident channel summary",
      "Collect logs/metrics/deployment history",
      "Generate timeline and RCA hypotheses",
      "Draft postmortem",
      "Convert action items into backlog tasks",
    ],
    outputs: [
      "Incident summary",
      "Timeline",
      "RCA hypotheses",
      "Postmortem draft",
      "Backlog action items",
    ],
    artifactPaths: [
      "docs/templates/postmortem-template.md",
      "docs/lifecycle/11-incident-learn.md",
      "docs/operations/incident-process.md",
    ],
  },
];

export function getAgentSpecByPhase(phaseId: number): AgentAutomationSpec | undefined {
  return AGENT_AUTOMATION_SPECS.find((spec) => spec.phaseId === phaseId);
}

export function buildAutomationPrompt(
  phase: Phase,
  spec: AgentAutomationSpec,
  trigger: AgentTrigger,
  requestContext: string,
  requirements?: AutomationRequirements
): string {
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
    "Governance Requirements:",
    "- Include risks, assumptions, and approval gates.",
    "- Clearly separate auto-actions vs human approval actions.",
    "- Include test/security validation evidence where applicable.",
    "- Include rollback or mitigation guidance.",
    "",
    "Language Requirements:",
    "- Provide Traditional Chinese and English headings where practical.",
    "",
    "Return a complete, actionable, implementation-ready output.",
  ].join("\n");
}
