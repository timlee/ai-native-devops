"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirementPanel = void 0;
const fs = __importStar(require("fs"));
const https = __importStar(require("https"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const phasePanel_1 = require("./phasePanel");
const githubUtils_1 = require("./githubUtils");
// ── Constants ─────────────────────────────────────────────────────────────────
const ISSUE_SECTIONS = [
    "User Story",
    "BDD Scenario",
    "Acceptance Criteria",
    "Technical Constraints",
    "Tasks",
];
const ALL_REQ_ARTIFACTS = [...ISSUE_SECTIONS];
const ALL_DESIGN_ARTIFACTS = [
    "Architecture Diagram",
    "ADR",
    "OpenAPI Spec",
    "Data Model",
    "Threat Model",
];
const SECTION_FILES = {
    "User Story": "plan/user-story.md",
    "BDD Scenario": "plan/bdd-scenario.md",
    "Acceptance Criteria": "plan/acceptance-criteria.md",
    "Technical Constraints": "plan/technical-constraints.md",
    "Tasks": "plan/tasks.md",
};
// ── Helpers ───────────────────────────────────────────────────────────────────
const REQ_ARTIFACT_DEFS = [
    { name: "User Story", heading: "## User Story", guide: "- User Story: Write exactly ONE user story in the form \"As a <role>, I want <goal>, so that <benefit>\"." },
    { name: "BDD Scenario", heading: "## BDD Scenario", guide: "- BDD Scenario: Write exactly ONE Gherkin scenario (Scenario: <title>, Given <context>, When <action>, Then <outcome>) that directly exercises the requirement." },
    { name: "Acceptance Criteria", heading: "## Acceptance Criteria", guide: "- Acceptance Criteria: Write measurable checkbox conditions (- [ ]) that directly verify the requirement." },
    { name: "Technical Constraints", heading: "## Technical Constraints", guide: "- Technical Constraints: List only technical, architectural, and platform-specific constraints that bound the implementation (bulleted list)." },
    { name: "Tasks", heading: "## Tasks", guide: "- Tasks: Write a prioritized list of actionable development tasks with P0/P1/P2 labels and S/M/L effort estimates." },
];
function buildPrompt(moduleName, reqId, description, selectedArtifacts) {
    const selected = REQ_ARTIFACT_DEFS.filter(a => selectedArtifacts.includes(a.name));
    return [
        "You are the REQUIREMENT phase AI agent.",
        "",
        "Requirement:",
        `- Module: ${moduleName}`,
        `- ID: ${reqId}`,
        `- Description: ${description}`,
        "",
        "Task:",
        `Generate ${selected.length} planning artifact${selected.length !== 1 ? "s" : ""} for this requirement as structured Markdown.`,
        "Use these exact ## headings in this order (no text before the first heading):",
        "",
        ...selected.map(a => a.heading),
        "",
        "Guidelines:",
        ...selected.map(a => a.guide),
        "",
        "Output structured Markdown only. Do not add any text before the first ## heading.",
    ].join("\n");
}
const DESIGN_ARTIFACT_DEFS = [
    { name: "Architecture Diagram", guide: "- Architecture Diagram: Mermaid diagram (```mermaid fenced block) showing system components, services, and data flows." },
    { name: "ADR", guide: "- ADR: Architecture Decision Record — Title, Status, Context, Decision, Consequences (positive/negative)." },
    { name: "OpenAPI Spec", guide: "- OpenAPI Spec: Valid OpenAPI 3.1 YAML for the API surface implied by the requirements." },
    { name: "Data Model", guide: "- Data Model: Entity-relationship description with field types and cardinality in Markdown table format." },
    { name: "Threat Model", guide: "- Threat Model: STRIDE-based threat enumeration with mitigations as a Markdown table." },
];
function buildDesignPrompt(moduleName, reqId, description, requirements, selectedArtifacts) {
    const selected = DESIGN_ARTIFACT_DEFS.filter(a => selectedArtifacts.includes(a.name));
    return [
        "You are the DESIGN phase AI agent.",
        "",
        "Confirmed Requirements Context:",
        `- Module: ${moduleName}`,
        `- ID: ${reqId}`,
        `- Description: ${description}`,
        "",
        "## User Story (confirmed by user)",
        requirements.userStory,
        "",
        "## BDD Scenario (confirmed by user)",
        requirements.bddScenario,
        "",
        "## Acceptance Criteria (confirmed by user)",
        requirements.acceptanceCriteria,
        "",
        "## Tasks (confirmed by user)",
        requirements.tasks,
        "",
        ...(requirements.planningNotes.trim()
            ? [`## Planning Notes (confirmed by user)`, requirements.planningNotes, ""]
            : []),
        "Task:",
        `Generate ${selected.length} architecture design artifact${selected.length !== 1 ? "s" : ""} as structured Markdown.`,
        "Use these exact ## headings in this order (no text before the first heading):",
        "",
        ...selected.map(a => `## ${a.name}`),
        "",
        "Guidelines:",
        ...selected.map(a => a.guide),
        "",
        "Output structured Markdown only. Do not add any text before the first ## heading.",
    ].join("\n");
}
function parseSections(markdown) {
    const result = new Map();
    const lines = markdown.split("\n");
    let currentHeading = null;
    const buffer = [];
    const flush = () => {
        if (currentHeading !== null) {
            result.set(currentHeading, buffer.join("\n").trim());
            buffer.length = 0;
        }
    };
    for (const line of lines) {
        if (line.startsWith("## ")) {
            flush();
            currentHeading = line.slice(3).trim();
        }
        else if (currentHeading !== null) {
            buffer.push(line);
        }
    }
    flush();
    return result;
}
function writeArtifacts(repoRoot, moduleName, reqId, sections, planningNotes) {
    const written = [];
    for (const heading of ISSUE_SECTIONS) {
        const file = SECTION_FILES[heading];
        const content = sections.get(heading) ?? "";
        const fullPath = path.join(repoRoot, file);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, `# ${heading}\n\n> Module: ${moduleName} | ID: ${reqId}\n\n${content}\n`, "utf8");
        written.push(file);
    }
    const notesPath = path.join(repoRoot, "plan/planning-notes.md");
    fs.mkdirSync(path.dirname(notesPath), { recursive: true });
    const notesContent = planningNotes.trim()
        ? planningNotes
        : "## Assumptions\n\n- \n\n## Risks\n\n- \n\n## Open Questions\n\n- \n\n## Dependencies\n\n- ";
    fs.writeFileSync(notesPath, `# Planning Notes\n\n> Module: ${moduleName} | ID: ${reqId}\n\n${notesContent}\n`, "utf8");
    written.push("plan/planning-notes.md");
    return written;
}
function writeDesignFiles(repoRoot, moduleName, reqId, artifacts, selectedArtifacts) {
    const written = [];
    const fileMap = [
        { key: "architectureDiagram", file: "docs/architecture/design-draft.md", heading: "Architecture Diagram", artifactName: "Architecture Diagram" },
        { key: "adr", file: `docs/adr/ADR-${reqId}.md`, heading: "ADR", artifactName: "ADR" },
        { key: "openApiSpec", file: "docs/api/openapi.yaml", heading: "OpenAPI Spec", artifactName: "OpenAPI Spec" },
        { key: "dataModel", file: "docs/data/data-model.md", heading: "Data Model", artifactName: "Data Model" },
        { key: "threatModel", file: "docs/security/threat-model.md", heading: "Threat Model", artifactName: "Threat Model" },
    ];
    for (const { key, file, heading, artifactName } of fileMap) {
        if (!selectedArtifacts.includes(artifactName)) {
            continue;
        }
        const content = artifacts[key];
        const fullPath = path.join(repoRoot, file);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, `# ${heading}\n\n> Module: ${moduleName} | ID: ${reqId}\n\n${content}\n`, "utf8");
        written.push(file);
    }
    return written;
}
function buildIssueBody(moduleName, reqId, description, requirements, design) {
    const lines = [
        `> **Module:** ${moduleName} | **ID:** ${reqId}`,
        `> _Generated by AI-Native DevOps extension_`,
        "",
        "---",
        "## User Requirement",
        "",
        description || "_Not provided._",
        "",
    ];
    const reqMap = [
        ["User Story", requirements.userStory],
        ["BDD Scenario", requirements.bddScenario],
        ["Acceptance Criteria", requirements.acceptanceCriteria],
        ["Technical Constraints", requirements.technicalConstraints],
        ["Tasks", requirements.tasks],
        ["Planning Notes", requirements.planningNotes],
    ];
    for (const [heading, content] of reqMap) {
        lines.push(`### ${heading}`, "", content || "_Not generated._", "");
    }
    if (design) {
        lines.push("---", "## Design Artifacts", "");
        const designMap = [
            ["Architecture Diagram", design.architectureDiagram],
            ["ADR", design.adr],
            ["OpenAPI Spec", design.openApiSpec],
            ["Data Model", design.dataModel],
            ["Threat Model", design.threatModel],
        ];
        for (const [heading, content] of designMap) {
            if (!content.trim()) {
                continue;
            }
            lines.push(`### ${heading}`, "", content, "");
        }
    }
    return lines.join("\n");
}
function createGithubIssue(token, owner, repo, title, body, labels) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({ title, body, labels });
        const req = https.request({
            hostname: "api.github.com",
            path: `/repos/${owner}/${repo}/issues`,
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
                "User-Agent": "ai-native-devops-vscode",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        }, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode === 201 && json.html_url && json.number) {
                        resolve({ url: json.html_url, number: json.number });
                    }
                    else if (res.statusCode === 422 && labels.length > 0) {
                        // Labels don't exist — retry without labels
                        createGithubIssue(token, owner, repo, title, body, []).then(resolve, reject);
                    }
                    else {
                        reject(new Error(json.message ?? `GitHub API returned ${res.statusCode}`));
                    }
                }
                catch {
                    reject(new Error("Failed to parse GitHub API response"));
                }
            });
        });
        req.on("error", reject);
        req.write(payload);
        req.end();
    });
}
// ── Panel ─────────────────────────────────────────────────────────────────────
class RequirementPanel {
    constructor(_phase, _context, _aiRunner) {
        this._phase = _phase;
        this._context = _context;
        this._aiRunner = _aiRunner;
        this._rawOutput = "";
        this._step = "input";
        this._cancelled = false;
        this._workflowCtx = { moduleName: "", reqId: "", description: "" };
        this._repoRoot = "";
        this._disposables = [];
        this._panel = vscode.window.createWebviewPanel("requirementPanel", _phase.label, vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
        this._panel.webview.html = this._buildHtml();
        this._panel.webview.onDidReceiveMessage((msg) => {
            switch (msg.command) {
                case "submit":
                    this._handleSubmit(msg.moduleName ?? "", msg.reqId ?? "", msg.description ?? "", msg.selectedReqArtifacts ?? [...ALL_REQ_ARTIFACTS]);
                    break;
                case "confirmRequirements":
                    this._handleConfirmRequirements(msg, msg.selectedArtifacts ?? [...ALL_DESIGN_ARTIFACTS]);
                    break;
                case "confirmDesign":
                    this._handleConfirmDesign(msg);
                    break;
                case "goBack":
                    this._handleGoBack(msg.fromStep ?? "");
                    break;
                case "restart":
                    this._handleRestart();
                    break;
                case "openFile":
                    this._openFile(msg.text ?? "");
                    break;
                case "openIssue":
                    vscode.env.openExternal(vscode.Uri.parse(msg.url ?? ""));
                    break;
            }
        }, undefined, this._disposables);
        this._panel.onDidDispose(() => this._dispose(), undefined, this._disposables);
    }
    static show(phase, context, aiRunner) {
        if (RequirementPanel._current) {
            RequirementPanel._current._panel.reveal(vscode.ViewColumn.One);
            return;
        }
        RequirementPanel._current = new RequirementPanel(phase, context, aiRunner);
    }
    async _handleSubmit(moduleName, reqId, description, selectedReqArtifacts) {
        if (!reqId.trim() || !description.trim()) {
            this._panel.webview.postMessage({ command: "validationError", text: "All fields are required." });
            return;
        }
        if (selectedReqArtifacts.length === 0) {
            this._panel.webview.postMessage({ command: "validationError", text: "Select at least one artifact to generate." });
            return;
        }
        this._rawOutput = "";
        this._step = "review-requirements";
        this._repoRoot = (0, phasePanel_1.resolveRepoRoot)(this._context);
        this._workflowCtx = {
            moduleName: moduleName.trim(),
            reqId: reqId.trim(),
            description: description.trim(),
            selectedReqArtifacts,
        };
        this._panel.webview.postMessage({ command: "started", step: "review-requirements" });
        const prompt = buildPrompt(this._workflowCtx.moduleName, this._workflowCtx.reqId, this._workflowCtx.description, selectedReqArtifacts);
        const sink = {
            appendAiChunk: (chunk) => {
                if (this._cancelled) {
                    return;
                }
                this._rawOutput += chunk;
                this._panel.webview.postMessage({ command: "appendChunk", text: chunk });
            },
            aiDone: () => {
                if (this._cancelled) {
                    return;
                }
                const sections = parseSections(this._rawOutput);
                const artifacts = {
                    userStory: sections.get("User Story") ?? "",
                    bddScenario: sections.get("BDD Scenario") ?? "",
                    acceptanceCriteria: sections.get("Acceptance Criteria") ?? "",
                    technicalConstraints: sections.get("Technical Constraints") ?? "",
                    tasks: sections.get("Tasks") ?? "",
                    planningNotes: "",
                };
                this._workflowCtx.requirements = artifacts;
                this._panel.webview.postMessage({ command: "aiDone", artifacts, selectedReqArtifacts });
            },
            aiError: (msg) => {
                if (this._cancelled) {
                    return;
                }
                this._panel.webview.postMessage({ command: "aiError", text: msg });
            },
        };
        await this._aiRunner.run(this._phase, prompt, sink);
    }
    _handleGoBack(fromStep) {
        this._cancelled = true;
        this._rawOutput = "";
        if (fromStep === "review-requirements") {
            this._step = "input";
        }
        else {
            this._step = "review-requirements";
        }
        setImmediate(() => { this._cancelled = false; });
    }
    _handleRestart() {
        this._cancelled = true;
        this._rawOutput = "";
        this._workflowCtx = { moduleName: "", reqId: "", description: "" };
        this._step = "input";
        setImmediate(() => { this._cancelled = false; });
    }
    async _handleConfirmRequirements(artifacts, selectedArtifacts) {
        this._workflowCtx.requirements = artifacts;
        this._workflowCtx.selectedArtifacts = selectedArtifacts;
        const { moduleName, reqId } = this._workflowCtx;
        const sections = new Map([
            ["User Story", artifacts.userStory],
            ["BDD Scenario", artifacts.bddScenario],
            ["Acceptance Criteria", artifacts.acceptanceCriteria],
            ["Technical Constraints", artifacts.technicalConstraints],
            ["Tasks", artifacts.tasks],
        ]);
        const written = writeArtifacts(this._repoRoot, moduleName, reqId, sections, artifacts.planningNotes);
        this._panel.webview.postMessage({ command: "filesReady", files: written, phase: "requirements" });
        this._step = "gen-design";
        this._rawOutput = "";
        this._panel.webview.postMessage({ command: "started", step: "gen-design" });
        const prompt = buildDesignPrompt(moduleName, reqId, this._workflowCtx.description, artifacts, selectedArtifacts);
        const sink = {
            appendAiChunk: (chunk) => {
                if (this._cancelled) {
                    return;
                }
                this._rawOutput += chunk;
                this._panel.webview.postMessage({ command: "appendChunk", text: chunk });
            },
            aiDone: () => {
                if (this._cancelled) {
                    return;
                }
                const secs = parseSections(this._rawOutput);
                const designArtifacts = {
                    architectureDiagram: selectedArtifacts.includes("Architecture Diagram") ? (secs.get("Architecture Diagram") ?? "") : "",
                    adr: selectedArtifacts.includes("ADR") ? (secs.get("ADR") ?? "") : "",
                    openApiSpec: selectedArtifacts.includes("OpenAPI Spec") ? (secs.get("OpenAPI Spec") ?? "") : "",
                    dataModel: selectedArtifacts.includes("Data Model") ? (secs.get("Data Model") ?? "") : "",
                    threatModel: selectedArtifacts.includes("Threat Model") ? (secs.get("Threat Model") ?? "") : "",
                };
                this._workflowCtx.design = designArtifacts;
                this._step = "review-design";
                this._panel.webview.postMessage({ command: "aiDone", artifacts: designArtifacts, step: "review-design", selectedArtifacts });
            },
            aiError: (msg) => {
                if (this._cancelled) {
                    return;
                }
                this._panel.webview.postMessage({ command: "aiError", text: msg });
            },
        };
        await this._aiRunner.run(this._phase, prompt, sink);
    }
    async _handleConfirmDesign(artifacts) {
        this._workflowCtx.design = artifacts;
        const { moduleName, reqId } = this._workflowCtx;
        const writtenDesign = writeDesignFiles(this._repoRoot, moduleName, reqId, artifacts, this._workflowCtx.selectedArtifacts ?? [...ALL_DESIGN_ARTIFACTS]);
        this._panel.webview.postMessage({ command: "filesReady", files: writtenDesign, phase: "design" });
        const choice = await vscode.window.showInformationMessage(`Create GitHub issue "[${reqId}] ${moduleName}"?`, { modal: true }, "Create Issue");
        if (choice !== "Create Issue") {
            this._panel.webview.postMessage({ command: "confirmCancelled" });
            return;
        }
        this._step = "complete";
        try {
            const cfg = vscode.workspace.getConfiguration("aiNativeDevOps");
            let owner = cfg.get("githubOwner", "").trim();
            let repo = cfg.get("githubRepo", "").trim();
            if (!owner || !repo) {
                const info = (0, githubUtils_1.getGithubRepoInfo)(this._repoRoot);
                if (!info) {
                    throw new Error("Cannot detect GitHub owner/repo from git remote. " +
                        "Set aiNativeDevOps.githubOwner and aiNativeDevOps.githubRepo in settings.");
                }
                owner = info.owner;
                repo = info.repo;
            }
            const token = await (0, githubUtils_1.getGithubToken)();
            const title = `[${reqId}] ${moduleName}`;
            const body = buildIssueBody(moduleName, reqId, this._workflowCtx.description, this._workflowCtx.requirements, artifacts);
            const { url, number } = await createGithubIssue(token, owner, repo, title, body, ["requirement", "design", "ai-generated"]);
            this._panel.webview.postMessage({ command: "issueReady", url, number });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this._panel.webview.postMessage({ command: "issueError", text: message });
        }
    }
    async _openFile(relativePath) {
        const repoRoot = (0, phasePanel_1.resolveRepoRoot)(this._context);
        const fullPath = path.join(repoRoot, relativePath);
        try {
            const doc = await vscode.workspace.openTextDocument(fullPath);
            await vscode.window.showTextDocument(doc, { preview: false });
        }
        catch {
            vscode.window.showErrorMessage(`Cannot open ${relativePath}`);
        }
    }
    _dispose() {
        RequirementPanel._current = undefined;
        this._panel.dispose();
        for (const d of this._disposables) {
            d.dispose();
        }
        this._disposables = [];
    }
    _buildHtml() {
        return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<title>${this._phase.label}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
    background: var(--vscode-editor-background);
    padding: 24px;
    max-width: 800px;
  }
  h1 { font-size: 1.4em; margin-bottom: 4px; }
  .subtitle { color: var(--vscode-descriptionForeground); margin-bottom: 20px; font-size: 0.9em; }
  .field { margin-bottom: 14px; }
  label { display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9em; }
  input[type="text"], textarea {
    width: 100%;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, #555);
    border-radius: 3px;
    padding: 7px 10px;
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
  }
  input[type="text"]:focus, textarea:focus {
    outline: 1px solid var(--vscode-focusBorder);
    border-color: var(--vscode-focusBorder);
  }
  textarea { min-height: 120px; resize: vertical; }
  .field-row { display: flex; gap: 12px; }
  .field-row .field { flex: 1; }
  .error-msg { color: var(--vscode-errorForeground); font-size: 0.85em; margin-top: 6px; min-height: 1em; }
  button.primary {
    padding: 8px 20px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none; border-radius: 3px; cursor: pointer;
    font-size: 0.95em; margin-top: 4px;
  }
  button.primary:hover { background: var(--vscode-button-hoverBackground); }
  button.primary:disabled { opacity: 0.5; cursor: default; }
  button.secondary {
    padding: 8px 16px;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border: none; border-radius: 3px; cursor: pointer;
    font-size: 0.95em; margin-top: 4px;
  }
  button.secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
  button.secondary:disabled { opacity: 0.5; cursor: default; }
  .button-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
  .divider { border: none; border-top: 1px solid var(--vscode-panel-border, #444); margin: 20px 0; }
  button.link-btn {
    background: none; border: none; padding: 0;
    color: var(--vscode-textLink-foreground);
    cursor: pointer; text-decoration: underline;
    font-size: inherit; font-family: inherit;
  }
  button.link-btn:hover { color: var(--vscode-textLink-activeForeground); }
  .file-list { list-style: none; margin-top: 6px; }
  .file-list li { margin: 3px 0; }
  .section-label {
    font-weight: 600; margin-bottom: 8px; font-size: 0.9em;
    text-transform: uppercase; letter-spacing: 0.05em;
    color: var(--vscode-descriptionForeground);
  }

  /* Step indicator */
  .step-indicator {
    display: flex; align-items: center;
    padding: 14px 0 20px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--vscode-panel-border, #444);
  }
  .step-dot {
    display: flex; flex-direction: column; align-items: center;
    opacity: 0.35; min-width: 72px; transition: opacity 0.2s;
  }
  .step-dot.active { opacity: 1; }
  .step-dot.done { opacity: 0.7; }
  .step-num {
    width: 26px; height: 26px; border-radius: 50%;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8em; font-weight: 700; margin-bottom: 5px;
  }
  .step-dot.active .step-num {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }
  .step-dot.done .step-num { background: #4caf50; color: #fff; }
  .step-lbl { font-size: 0.72em; color: var(--vscode-descriptionForeground); text-align: center; }
  .step-connector { flex: 1; height: 1px; background: var(--vscode-panel-border, #444); margin: 0 2px 26px; }

  /* Spinner */
  .spinner-row {
    display: flex; align-items: center; gap: 8px;
    font-style: italic; color: var(--vscode-descriptionForeground);
    margin-bottom: 8px; font-size: 0.9em;
  }
  .spinner {
    display: inline-block; width: 13px; height: 13px;
    border: 2px solid var(--vscode-foreground);
    border-top-color: transparent; border-radius: 50%;
    animation: spin 0.7s linear infinite; opacity: 0.55; flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Output pre */
  .output-pre {
    white-space: pre-wrap; word-break: break-word;
    background: var(--vscode-textBlockQuote-background, #1e1e1e);
    border-left: 3px solid var(--vscode-textBlockQuote-border, #555);
    padding: 12px; max-height: 300px; overflow-y: auto;
    font-size: 0.85em; margin-bottom: 14px;
  }

  /* Artifact review */
  .review-hint { color: var(--vscode-descriptionForeground); font-size: 0.88em; margin-bottom: 16px; }
  .artifact-group { margin-bottom: 16px; }
  .artifact-select-group { margin-bottom: 16px; }
  .cb-label { display: block; margin-bottom: 5px; font-size: 0.9em; cursor: pointer; }
  .artifact-label {
    display: block; font-weight: 600; font-size: 0.82em;
    text-transform: uppercase; letter-spacing: 0.05em;
    color: var(--vscode-descriptionForeground); margin-bottom: 5px;
  }
  .artifact-ta { min-height: 150px; font-family: var(--vscode-font-family); }
  .code-ta { min-height: 200px; font-family: var(--vscode-editor-font-family, monospace); font-size: 0.88em; }

  /* Files + issue */
  #filesSection { display: none; margin-top: 16px; }
  #issueSection {
    display: none; margin-top: 16px; padding: 12px;
    background: var(--vscode-textBlockQuote-background); border-radius: 3px;
  }
  .issue-label { font-weight: 600; margin-bottom: 6px; font-size: 0.9em; }
</style>
</head>
<body>
<h1>${this._phase.label}</h1>
<p class="subtitle">Capture a requirement, review AI-generated artifacts, then publish a GitHub issue.</p>

<!-- Step indicator -->
<div class="step-indicator">
  <div class="step-dot active" id="step-dot-1">
    <div class="step-num" id="step-num-1">1</div>
    <div class="step-lbl">Input</div>
  </div>
  <div class="step-connector"></div>
  <div class="step-dot" id="step-dot-2">
    <div class="step-num" id="step-num-2">2</div>
    <div class="step-lbl">Requirements</div>
  </div>
  <div class="step-connector"></div>
  <div class="step-dot" id="step-dot-3">
    <div class="step-num" id="step-num-3">3</div>
    <div class="step-lbl">Design</div>
  </div>
  <div class="step-connector"></div>
  <div class="step-dot" id="step-dot-4">
    <div class="step-num" id="step-num-4">4</div>
    <div class="step-lbl">Publish</div>
  </div>
</div>

<!-- Step 1: Input -->
<section id="sectionStep1">
  <div class="field">
    <label for="reqId">Requirement ID</label>
    <input type="text" id="reqId" placeholder="e.g. REQ-001">
  </div>
  <div class="field">
    <label for="description">Goal</label>
    <textarea id="description" placeholder="Describe what needs to be built — goals, constraints, user types, edge cases..."></textarea>
  </div>
  <div class="field">
    <p class="section-label" style="margin-bottom:8px">Artifacts to generate</p>
    <label class="cb-label"><input type="checkbox" class="req-cb" value="User Story" checked> User Story</label>
    <label class="cb-label"><input type="checkbox" class="req-cb" value="BDD Scenario" checked> BDD Scenario</label>
    <label class="cb-label"><input type="checkbox" class="req-cb" value="Acceptance Criteria" checked> Acceptance Criteria</label>
    <label class="cb-label"><input type="checkbox" class="req-cb" value="Technical Constraints" checked> Technical Constraints</label>
    <label class="cb-label"><input type="checkbox" class="req-cb" value="Tasks" checked> Tasks</label>
  </div>
  <div class="error-msg" id="validationError"></div>
  <button class="primary" id="submitBtn" onclick="submitForm()">Generate Requirements</button>
</section>

<!-- Step 2: Review Requirements -->
<section id="sectionStep2" style="display:none">
  <div id="reqSpinner" class="spinner-row">
    <span class="spinner"></span><span>Generating requirements artifacts…</span>
  </div>
  <pre id="reqOutputPre" class="output-pre" style="display:none"></pre>
  <div id="reqReviewArea" style="display:none">
    <p class="review-hint">Review and edit each artifact, then click Confirm &amp; Continue.</p>
    <div class="artifact-group" id="req-group-userStory">
      <label class="artifact-label" for="ta-userStory">User Story</label>
      <textarea class="artifact-ta" id="ta-userStory"></textarea>
    </div>
    <div class="artifact-group" id="req-group-bddScenario">
      <label class="artifact-label" for="ta-bddScenario">BDD Scenario</label>
      <textarea class="artifact-ta" id="ta-bddScenario"></textarea>
    </div>
    <div class="artifact-group" id="req-group-acceptanceCriteria">
      <label class="artifact-label" for="ta-acceptanceCriteria">Acceptance Criteria</label>
      <textarea class="artifact-ta" id="ta-acceptanceCriteria"></textarea>
    </div>
    <div class="artifact-group" id="req-group-technicalConstraints">
      <label class="artifact-label" for="ta-technicalConstraints">Technical Constraints</label>
      <textarea class="artifact-ta" id="ta-technicalConstraints"></textarea>
    </div>
    <div class="artifact-group" id="req-group-tasks">
      <label class="artifact-label" for="ta-tasks">Tasks</label>
      <textarea class="artifact-ta" id="ta-tasks"></textarea>
    </div>
    <div class="artifact-group">
      <label class="artifact-label" for="ta-planningNotes">Planning Notes</label>
      <textarea class="artifact-ta" id="ta-planningNotes" placeholder="Add assumptions, risks, open questions, dependencies…"></textarea>
    </div>
    <div class="artifact-select-group">
      <p class="review-hint" style="margin-bottom:6px">Select design artifacts to generate in Step 3:</p>
      <label class="cb-label"><input type="checkbox" class="design-cb" value="Architecture Diagram" checked> Architecture Diagram</label>
      <label class="cb-label"><input type="checkbox" class="design-cb" value="ADR" checked> ADR — Architecture Decision Record</label>
      <label class="cb-label"><input type="checkbox" class="design-cb" value="OpenAPI Spec" checked> OpenAPI Spec</label>
      <label class="cb-label"><input type="checkbox" class="design-cb" value="Data Model" checked> Data Model</label>
      <label class="cb-label"><input type="checkbox" class="design-cb" value="Threat Model" checked> Threat Model</label>
    </div>
    <div class="button-row">
      <button class="secondary" id="backFromStep2Btn" onclick="goBackFromStep2()">&#8592; Back</button>
      <button class="primary" id="confirmReqBtn" onclick="confirmRequirements()">Confirm &amp; Continue</button>
    </div>
  </div>
</section>

<!-- Step 3: Generate Design -->
<section id="sectionStep3" style="display:none">
  <div id="designSpinner" class="spinner-row">
    <span class="spinner"></span><span>Generating design artifacts from confirmed requirements…</span>
  </div>
  <pre id="designOutputPre" class="output-pre" style="display:none"></pre>
  <div class="button-row" style="margin-top:12px">
    <button class="secondary" id="backFromStep3Btn" onclick="goBackFromStep3()">&#8592; Back to Requirements</button>
  </div>
</section>

<!-- Step 4: Review Design + Publish -->
<section id="sectionStep4" style="display:none">
  <p class="review-hint">Review and edit each design artifact, then create the GitHub issue.</p>
  <div class="artifact-group" id="group-architectureDiagram">
    <label class="artifact-label" for="ta-architectureDiagram">Architecture Diagram (Mermaid)</label>
    <textarea class="artifact-ta code-ta" id="ta-architectureDiagram"></textarea>
  </div>
  <div class="artifact-group" id="group-adr">
    <label class="artifact-label" for="ta-adr">ADR — Architecture Decision Record</label>
    <textarea class="artifact-ta" id="ta-adr"></textarea>
  </div>
  <div class="artifact-group" id="group-openApiSpec">
    <label class="artifact-label" for="ta-openApiSpec">OpenAPI Spec (YAML)</label>
    <textarea class="artifact-ta code-ta" id="ta-openApiSpec"></textarea>
  </div>
  <div class="artifact-group" id="group-dataModel">
    <label class="artifact-label" for="ta-dataModel">Data Model</label>
    <textarea class="artifact-ta" id="ta-dataModel"></textarea>
  </div>
  <div class="artifact-group" id="group-threatModel">
    <label class="artifact-label" for="ta-threatModel">Threat Model</label>
    <textarea class="artifact-ta" id="ta-threatModel"></textarea>
  </div>
  <div class="button-row">
    <button class="secondary" id="backFromStep4Btn" onclick="goBackFromStep4()">&#8592; Back to Requirements</button>
    <button class="secondary" id="newRequirementBtn" onclick="startNewRequirement()">&#8635; New Requirement</button>
    <button class="primary" id="createIssueBtn" onclick="confirmDesign()">Create GitHub Issue</button>
  </div>

  <div id="filesSection">
    <hr class="divider">
    <div class="section-label">Local Files Written</div>
    <ul class="file-list" id="fileList"></ul>
  </div>
  <div id="issueSection">
    <div class="issue-label" id="issueLabel"></div>
    <div id="issueContent"></div>
  </div>
</section>

<script>
  const vscode = acquireVsCodeApi();
  let rawOutput = '';
  let activeOutputPre = null;

  function showSection(n) {
    [1,2,3,4].forEach(i => {
      document.getElementById('sectionStep' + i).style.display = i === n ? '' : 'none';
    });
    [1,2,3,4].forEach(i => {
      const dot = document.getElementById('step-dot-' + i);
      dot.classList.toggle('active', i === n);
      if (i === n) { dot.classList.remove('done'); }
    });
  }

  function markStepDone(n) {
    const dot = document.getElementById('step-dot-' + n);
    dot.classList.remove('active');
    dot.classList.add('done');
    document.getElementById('step-num-' + n).textContent = '\\u2713';
  }

  function submitForm() {
    const reqId = document.getElementById('reqId').value.trim();
    const description = document.getElementById('description').value.trim();
    const selectedReqArtifacts = Array.from(
      document.querySelectorAll('.req-cb:checked')
    ).map(cb => cb.value);
    const errEl = document.getElementById('validationError');
    errEl.textContent = '';
    if (!reqId || !description) {
      errEl.textContent = 'All fields are required.';
      return;
    }
    if (selectedReqArtifacts.length === 0) {
      errEl.textContent = 'Select at least one artifact to generate.';
      return;
    }
    document.getElementById('submitBtn').disabled = true;
    vscode.postMessage({ command: 'submit', moduleName: '', reqId, description, selectedReqArtifacts });
  }

  function confirmRequirements() {
    document.getElementById('confirmReqBtn').disabled = true;
    const selectedArtifacts = Array.from(
      document.querySelectorAll('.design-cb:checked')
    ).map(cb => cb.value);
    vscode.postMessage({
      command: 'confirmRequirements',
      userStory:           document.getElementById('ta-userStory').value,
      bddScenario:         document.getElementById('ta-bddScenario').value,
      acceptanceCriteria:  document.getElementById('ta-acceptanceCriteria').value,
      technicalConstraints: document.getElementById('ta-technicalConstraints').value,
      tasks:               document.getElementById('ta-tasks').value,
      planningNotes:       document.getElementById('ta-planningNotes').value,
      selectedArtifacts,
    });
  }

  function confirmDesign() {
    document.getElementById('createIssueBtn').disabled = true;
    document.getElementById('backFromStep4Btn').disabled = true;
    vscode.postMessage({
      command: 'confirmDesign',
      architectureDiagram: document.getElementById('ta-architectureDiagram').value,
      adr:                 document.getElementById('ta-adr').value,
      openApiSpec:         document.getElementById('ta-openApiSpec').value,
      dataModel:           document.getElementById('ta-dataModel').value,
      threatModel:         document.getElementById('ta-threatModel').value,
    });
  }

  function unmarkStepDone(n) {
    const dot = document.getElementById('step-dot-' + n);
    dot.classList.remove('done', 'active');
    document.getElementById('step-num-' + n).textContent = String(n);
  }

  function goBackFromStep2() {
    unmarkStepDone(1);
    showSection(1);
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('reqSpinner').style.display = 'flex';
    document.getElementById('reqOutputPre').style.display = 'none';
    document.getElementById('reqOutputPre').textContent = '';
    document.getElementById('reqReviewArea').style.display = 'none';
    rawOutput = ''; activeOutputPre = null;
    vscode.postMessage({ command: 'goBack', fromStep: 'review-requirements' });
  }

  function goBackFromStep3() {
    unmarkStepDone(2);
    showSection(2);
    document.getElementById('reqSpinner').style.display = 'none';
    document.getElementById('reqOutputPre').style.display = 'none';
    document.getElementById('reqReviewArea').style.display = '';
    document.getElementById('confirmReqBtn').disabled = false;
    document.getElementById('designSpinner').style.display = 'flex';
    document.getElementById('designOutputPre').style.display = 'none';
    document.getElementById('designOutputPre').textContent = '';
    rawOutput = ''; activeOutputPre = null;
    vscode.postMessage({ command: 'goBack', fromStep: 'gen-design' });
  }

  function goBackFromStep4() {
    unmarkStepDone(3);
    unmarkStepDone(2);
    showSection(2);
    document.getElementById('reqSpinner').style.display = 'none';
    document.getElementById('reqOutputPre').style.display = 'none';
    document.getElementById('reqReviewArea').style.display = '';
    document.getElementById('confirmReqBtn').disabled = false;
    document.getElementById('filesSection').style.display = 'none';
    document.getElementById('fileList').innerHTML = '';
    document.getElementById('issueSection').style.display = 'none';
    document.getElementById('issueSection').style.borderLeft = '';
    document.getElementById('issueLabel').textContent = '';
    document.getElementById('issueContent').innerHTML = '';
    document.getElementById('createIssueBtn').disabled = false;
    document.getElementById('backFromStep4Btn').disabled = false;
    rawOutput = ''; activeOutputPre = null;
    vscode.postMessage({ command: 'goBack', fromStep: 'review-design' });
  }

  function startNewRequirement() {
    unmarkStepDone(1);
    unmarkStepDone(2);
    unmarkStepDone(3);
    unmarkStepDone(4);

    document.getElementById('reqId').value = '';
    document.getElementById('description').value = '';
    document.getElementById('validationError').textContent = '';
    document.getElementById('submitBtn').disabled = false;
    document.querySelectorAll('.req-cb').forEach(cb => { cb.checked = true; });

    document.getElementById('reqSpinner').style.display = 'flex';
    document.getElementById('reqOutputPre').style.display = 'none';
    document.getElementById('reqOutputPre').textContent = '';
    document.getElementById('reqReviewArea').style.display = 'none';
    document.getElementById('confirmReqBtn').disabled = false;

    document.getElementById('designSpinner').style.display = 'flex';
    document.getElementById('designOutputPre').style.display = 'none';
    document.getElementById('designOutputPre').textContent = '';

    ['ta-architectureDiagram','ta-adr','ta-openApiSpec','ta-dataModel','ta-threatModel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('filesSection').style.display = 'none';
    document.getElementById('fileList').innerHTML = '';
    document.getElementById('issueSection').style.display = 'none';
    document.getElementById('issueSection').style.borderLeft = '';
    document.getElementById('issueLabel').textContent = '';
    document.getElementById('issueContent').innerHTML = '';
    document.getElementById('createIssueBtn').disabled = false;
    document.getElementById('backFromStep4Btn').disabled = false;
    document.getElementById('newRequirementBtn').disabled = false;

    rawOutput = ''; activeOutputPre = null;
    showSection(1);
    vscode.postMessage({ command: 'restart' });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { submitForm(); }
  });

  window.addEventListener('message', event => {
    const msg = event.data;

    if (msg.command === 'validationError') {
      document.getElementById('validationError').textContent = msg.text;
      document.getElementById('submitBtn').disabled = false;

    } else if (msg.command === 'started') {
      rawOutput = '';
      if (msg.step === 'review-requirements') {
        showSection(2);
        markStepDone(1);
        activeOutputPre = document.getElementById('reqOutputPre');
        activeOutputPre.textContent = '';
        activeOutputPre.style.display = '';
        document.getElementById('reqSpinner').style.display = 'flex';
        document.getElementById('reqReviewArea').style.display = 'none';
      } else if (msg.step === 'gen-design') {
        showSection(3);
        markStepDone(2);
        activeOutputPre = document.getElementById('designOutputPre');
        activeOutputPre.textContent = '';
        activeOutputPre.style.display = '';
        document.getElementById('designSpinner').style.display = 'flex';
      }

    } else if (msg.command === 'appendChunk') {
      rawOutput += msg.text;
      if (activeOutputPre) {
        activeOutputPre.textContent = rawOutput;
        activeOutputPre.scrollTop = activeOutputPre.scrollHeight;
      }

    } else if (msg.command === 'aiDone') {
      const a = msg.artifacts || {};
      if (msg.step === 'review-design') {
        const selected = msg.selectedArtifacts || ['Architecture Diagram','ADR','OpenAPI Spec','Data Model','Threat Model'];
        const artifactGroupMap = {
          'Architecture Diagram': 'group-architectureDiagram',
          'ADR':                  'group-adr',
          'OpenAPI Spec':         'group-openApiSpec',
          'Data Model':           'group-dataModel',
          'Threat Model':         'group-threatModel',
        };
        showSection(4);
        markStepDone(3);
        document.getElementById('designSpinner').style.display = 'none';
        document.getElementById('ta-architectureDiagram').value = a.architectureDiagram || '';
        document.getElementById('ta-adr').value               = a.adr || '';
        document.getElementById('ta-openApiSpec').value       = a.openApiSpec || '';
        document.getElementById('ta-dataModel').value         = a.dataModel || '';
        document.getElementById('ta-threatModel').value       = a.threatModel || '';
        for (const [name, groupId] of Object.entries(artifactGroupMap)) {
          document.getElementById(groupId).style.display = selected.includes(name) ? '' : 'none';
        }
      } else {
        const selReq = msg.selectedReqArtifacts || ['User Story','BDD Scenario','Acceptance Criteria','Technical Constraints','Tasks'];
        const reqGroupMap = {
          'User Story':           'req-group-userStory',
          'BDD Scenario':         'req-group-bddScenario',
          'Acceptance Criteria':  'req-group-acceptanceCriteria',
          'Technical Constraints': 'req-group-technicalConstraints',
          'Tasks':                'req-group-tasks',
        };
        document.getElementById('reqSpinner').style.display = 'none';
        document.getElementById('ta-userStory').value           = a.userStory || '';
        document.getElementById('ta-bddScenario').value         = a.bddScenario || '';
        document.getElementById('ta-acceptanceCriteria').value  = a.acceptanceCriteria || '';
        document.getElementById('ta-technicalConstraints').value = a.technicalConstraints || '';
        document.getElementById('ta-tasks').value               = a.tasks || '';
        document.getElementById('ta-planningNotes').value       = '';
        for (const [name, groupId] of Object.entries(reqGroupMap)) {
          document.getElementById(groupId).style.display = selReq.includes(name) ? '' : 'none';
        }
        document.getElementById('reqReviewArea').style.display = '';
      }

    } else if (msg.command === 'aiError') {
      if (activeOutputPre) {
        activeOutputPre.textContent += '\\n\\nError: ' + msg.text;
      }
      document.getElementById('submitBtn').disabled = false;
      const confirmReqBtn = document.getElementById('confirmReqBtn');
      if (confirmReqBtn) { confirmReqBtn.disabled = false; }
      const createIssueBtn = document.getElementById('createIssueBtn');
      if (createIssueBtn) { createIssueBtn.disabled = false; }

    } else if (msg.command === 'filesReady') {
      const list = document.getElementById('fileList');
      for (const f of msg.files) {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.className = 'link-btn';
        btn.textContent = f;
        btn.onclick = () => vscode.postMessage({ command: 'openFile', text: f });
        li.appendChild(btn);
        list.appendChild(li);
      }
      document.getElementById('filesSection').style.display = '';

    } else if (msg.command === 'issueReady') {
      markStepDone(4);
      const sec = document.getElementById('issueSection');
      sec.style.display = '';
      sec.style.borderLeft = '3px solid #4caf50';
      document.getElementById('issueLabel').textContent = 'GitHub Issue Created';
      const content = document.getElementById('issueContent');
      content.innerHTML = '';
      const btn = document.createElement('button');
      btn.className = 'link-btn';
      btn.textContent = '#' + msg.number + ' — Open in browser';
      btn.onclick = () => vscode.postMessage({ command: 'openIssue', url: msg.url });
      content.appendChild(btn);

    } else if (msg.command === 'issueError') {
      const sec = document.getElementById('issueSection');
      sec.style.display = '';
      sec.style.borderLeft = '3px solid var(--vscode-errorForeground)';
      document.getElementById('issueLabel').textContent = 'GitHub Issue — Not Created';
      document.getElementById('issueContent').textContent = msg.text;
      document.getElementById('createIssueBtn').disabled = false;
      document.getElementById('backFromStep4Btn').disabled = false;

    } else if (msg.command === 'confirmCancelled') {
      document.getElementById('createIssueBtn').disabled = false;
      document.getElementById('backFromStep4Btn').disabled = false;
    }
  });
</script>
</body>
</html>`;
    }
}
exports.RequirementPanel = RequirementPanel;
//# sourceMappingURL=requirementPanel.js.map