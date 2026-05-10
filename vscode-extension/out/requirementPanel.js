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
const cp = __importStar(require("child_process"));
const fs = __importStar(require("fs"));
const https = __importStar(require("https"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const phasePanel_1 = require("./phasePanel");
// ── Constants ─────────────────────────────────────────────────────────────────
const ISSUE_SECTIONS = [
    "Product Requirements",
    "User Stories",
    "Acceptance Criteria",
    "Backlog Items",
];
const SECTION_FILES = {
    "Product Requirements": "plan/product-requirements.md",
    "User Stories": "plan/user-stories.md",
    "Acceptance Criteria": "plan/acceptance-criteria.md",
    "Backlog Items": "plan/backlog-items.md",
};
// ── Helpers ───────────────────────────────────────────────────────────────────
function buildPrompt(moduleName, reqId, description) {
    return [
        "You are the REQUIREMENT phase AI agent.",
        "",
        "Requirement:",
        `- Module: ${moduleName}`,
        `- ID: ${reqId}`,
        `- Description: ${description}`,
        "",
        "Task:",
        "Generate four planning artifacts for this requirement as structured Markdown.",
        "Use these exact ## headings in this order (no text before the first heading):",
        "",
        "## Product Requirements",
        "## User Stories",
        "## Acceptance Criteria",
        "## Backlog Items",
        "",
        "Guidelines:",
        "- Product Requirements: numbered list of clear, testable requirements scoped to this module.",
        "- User Stories: \"As a <role>, I want <goal>, so that <benefit>\" — one per bullet.",
        "- Acceptance Criteria: measurable checkbox conditions (- [ ]) tied to each story.",
        "- Backlog Items: prioritized list with P0/P1/P2 labels and S/M/L effort estimates.",
        "",
        "Output structured Markdown only. Do not add any text before the first ## heading.",
    ].join("\n");
}
function buildDesignPrompt(moduleName, reqId, description, requirements) {
    return [
        "You are the DESIGN phase AI agent.",
        "",
        "Confirmed Requirements Context:",
        `- Module: ${moduleName}`,
        `- ID: ${reqId}`,
        `- Description: ${description}`,
        "",
        "## Product Requirements (confirmed by user)",
        requirements.productRequirements,
        "",
        "## User Stories (confirmed by user)",
        requirements.userStories,
        "",
        "## Acceptance Criteria (confirmed by user)",
        requirements.acceptanceCriteria,
        "",
        "## Backlog Items (confirmed by user)",
        requirements.backlogItems,
        "",
        ...(requirements.planningNotes.trim()
            ? [`## Planning Notes (confirmed by user)`, requirements.planningNotes, ""]
            : []),
        "Task:",
        "Generate five architecture design artifacts as structured Markdown.",
        "Use these exact ## headings in this order (no text before the first heading):",
        "",
        "## Architecture Diagram",
        "## ADR",
        "## OpenAPI Spec",
        "## Data Model",
        "## Threat Model",
        "",
        "Guidelines:",
        "- Architecture Diagram: Mermaid diagram (```mermaid fenced block) showing system components, services, and data flows.",
        "- ADR: Architecture Decision Record — Title, Status, Context, Decision, Consequences (positive/negative).",
        "- OpenAPI Spec: Valid OpenAPI 3.1 YAML for the API surface implied by the requirements.",
        "- Data Model: Entity-relationship description with field types and cardinality in Markdown table format.",
        "- Threat Model: STRIDE-based threat enumeration with mitigations as a Markdown table.",
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
function writeDesignFiles(repoRoot, moduleName, reqId, artifacts) {
    const written = [];
    const fileMap = [
        { key: "architectureDiagram", file: "docs/architecture/design-draft.md", heading: "Architecture Diagram" },
        { key: "adr", file: `docs/adr/ADR-${reqId}.md`, heading: "ADR" },
        { key: "openApiSpec", file: "docs/api/openapi.yaml", heading: "OpenAPI Spec" },
        { key: "dataModel", file: "docs/data/data-model.md", heading: "Data Model" },
        { key: "threatModel", file: "docs/security/threat-model.md", heading: "Threat Model" },
    ];
    for (const { key, file, heading } of fileMap) {
        const content = artifacts[key];
        const fullPath = path.join(repoRoot, file);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, `# ${heading}\n\n> Module: ${moduleName} | ID: ${reqId}\n\n${content}\n`, "utf8");
        written.push(file);
    }
    return written;
}
function buildIssueBody(moduleName, reqId, requirements, design) {
    const lines = [
        `> **Module:** ${moduleName} | **ID:** ${reqId}`,
        `> _Generated by AI-Native DevOps extension_`,
        "",
        "---",
        "## Requirements Artifacts",
        "",
    ];
    const reqMap = [
        ["Product Requirements", requirements.productRequirements],
        ["User Stories", requirements.userStories],
        ["Acceptance Criteria", requirements.acceptanceCriteria],
        ["Backlog Items", requirements.backlogItems],
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
            lines.push(`### ${heading}`, "", content || "_Not generated._", "");
        }
    }
    return lines.join("\n");
}
function getGithubRepoInfo(repoRoot) {
    try {
        const remoteUrl = cp
            .execSync("git remote get-url origin", { cwd: repoRoot, encoding: "utf8", timeout: 5000 })
            .trim();
        // https://github.com/owner/repo.git
        const httpsMatch = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?$/);
        if (httpsMatch) {
            return { owner: httpsMatch[1], repo: httpsMatch[2] };
        }
        // git@github.com:owner/repo.git
        const sshMatch = remoteUrl.match(/git@github\.com:([^/]+)\/([^/.]+?)(?:\.git)?$/);
        if (sshMatch) {
            return { owner: sshMatch[1], repo: sshMatch[2] };
        }
    }
    catch {
        // git not available or no remote
    }
    return null;
}
async function getGithubToken() {
    const session = await vscode.authentication.getSession("github", ["public_repo"], { createIfNone: true });
    return session.accessToken;
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
        this._workflowCtx = { moduleName: "", reqId: "", description: "" };
        this._repoRoot = "";
        this._disposables = [];
        this._panel = vscode.window.createWebviewPanel("requirementPanel", _phase.label, vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
        this._panel.webview.html = this._buildHtml();
        this._panel.webview.onDidReceiveMessage((msg) => {
            switch (msg.command) {
                case "submit":
                    this._handleSubmit(msg.moduleName ?? "", msg.reqId ?? "", msg.description ?? "");
                    break;
                case "confirmRequirements":
                    this._handleConfirmRequirements(msg);
                    break;
                case "confirmDesign":
                    this._handleConfirmDesign(msg);
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
    async _handleSubmit(moduleName, reqId, description) {
        if (!moduleName.trim() || !reqId.trim() || !description.trim()) {
            this._panel.webview.postMessage({ command: "validationError", text: "All fields are required." });
            return;
        }
        this._rawOutput = "";
        this._step = "review-requirements";
        this._repoRoot = (0, phasePanel_1.resolveRepoRoot)(this._context);
        this._workflowCtx = {
            moduleName: moduleName.trim(),
            reqId: reqId.trim(),
            description: description.trim(),
        };
        this._panel.webview.postMessage({ command: "started", step: "review-requirements" });
        const prompt = buildPrompt(this._workflowCtx.moduleName, this._workflowCtx.reqId, this._workflowCtx.description);
        const sink = {
            appendAiChunk: (chunk) => {
                this._rawOutput += chunk;
                this._panel.webview.postMessage({ command: "appendChunk", text: chunk });
            },
            aiDone: () => {
                const sections = parseSections(this._rawOutput);
                const artifacts = {
                    productRequirements: sections.get("Product Requirements") ?? "",
                    userStories: sections.get("User Stories") ?? "",
                    acceptanceCriteria: sections.get("Acceptance Criteria") ?? "",
                    backlogItems: sections.get("Backlog Items") ?? "",
                    planningNotes: "",
                };
                this._workflowCtx.requirements = artifacts;
                this._panel.webview.postMessage({ command: "aiDone", artifacts });
            },
            aiError: (msg) => {
                this._panel.webview.postMessage({ command: "aiError", text: msg });
            },
        };
        await this._aiRunner.run(this._phase, prompt, sink);
    }
    async _handleConfirmRequirements(artifacts) {
        this._workflowCtx.requirements = artifacts;
        const { moduleName, reqId } = this._workflowCtx;
        const sections = new Map([
            ["Product Requirements", artifacts.productRequirements],
            ["User Stories", artifacts.userStories],
            ["Acceptance Criteria", artifacts.acceptanceCriteria],
            ["Backlog Items", artifacts.backlogItems],
        ]);
        const written = writeArtifacts(this._repoRoot, moduleName, reqId, sections, artifacts.planningNotes);
        this._panel.webview.postMessage({ command: "filesReady", files: written, phase: "requirements" });
        this._step = "gen-design";
        this._rawOutput = "";
        this._panel.webview.postMessage({ command: "started", step: "gen-design" });
        const prompt = buildDesignPrompt(moduleName, reqId, this._workflowCtx.description, artifacts);
        const sink = {
            appendAiChunk: (chunk) => {
                this._rawOutput += chunk;
                this._panel.webview.postMessage({ command: "appendChunk", text: chunk });
            },
            aiDone: () => {
                const secs = parseSections(this._rawOutput);
                const designArtifacts = {
                    architectureDiagram: secs.get("Architecture Diagram") ?? "",
                    adr: secs.get("ADR") ?? "",
                    openApiSpec: secs.get("OpenAPI Spec") ?? "",
                    dataModel: secs.get("Data Model") ?? "",
                    threatModel: secs.get("Threat Model") ?? "",
                };
                this._workflowCtx.design = designArtifacts;
                this._step = "review-design";
                this._panel.webview.postMessage({ command: "aiDone", artifacts: designArtifacts, step: "review-design" });
            },
            aiError: (msg) => {
                this._panel.webview.postMessage({ command: "aiError", text: msg });
            },
        };
        await this._aiRunner.run(this._phase, prompt, sink);
    }
    async _handleConfirmDesign(artifacts) {
        this._workflowCtx.design = artifacts;
        const { moduleName, reqId } = this._workflowCtx;
        const writtenDesign = writeDesignFiles(this._repoRoot, moduleName, reqId, artifacts);
        this._panel.webview.postMessage({ command: "filesReady", files: writtenDesign, phase: "design" });
        this._step = "complete";
        try {
            const cfg = vscode.workspace.getConfiguration("aiNativeDevOps");
            let owner = cfg.get("githubOwner", "").trim();
            let repo = cfg.get("githubRepo", "").trim();
            if (!owner || !repo) {
                const info = getGithubRepoInfo(this._repoRoot);
                if (!info) {
                    throw new Error("Cannot detect GitHub owner/repo from git remote. " +
                        "Set aiNativeDevOps.githubOwner and aiNativeDevOps.githubRepo in settings.");
                }
                owner = info.owner;
                repo = info.repo;
            }
            const token = await getGithubToken();
            const title = `[${reqId}] ${moduleName}`;
            const body = buildIssueBody(moduleName, reqId, this._workflowCtx.requirements, artifacts);
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
  <div class="field-row">
    <div class="field">
      <label for="moduleName">Module Name</label>
      <input type="text" id="moduleName" placeholder="e.g. User Authentication">
    </div>
    <div class="field">
      <label for="reqId">Requirement ID</label>
      <input type="text" id="reqId" placeholder="e.g. REQ-001">
    </div>
  </div>
  <div class="field">
    <label for="description">Description</label>
    <textarea id="description" placeholder="Describe what needs to be built — goals, constraints, user types, edge cases..."></textarea>
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
    <div class="artifact-group">
      <label class="artifact-label" for="ta-productRequirements">Product Requirements</label>
      <textarea class="artifact-ta" id="ta-productRequirements"></textarea>
    </div>
    <div class="artifact-group">
      <label class="artifact-label" for="ta-userStories">User Stories</label>
      <textarea class="artifact-ta" id="ta-userStories"></textarea>
    </div>
    <div class="artifact-group">
      <label class="artifact-label" for="ta-acceptanceCriteria">Acceptance Criteria</label>
      <textarea class="artifact-ta" id="ta-acceptanceCriteria"></textarea>
    </div>
    <div class="artifact-group">
      <label class="artifact-label" for="ta-backlogItems">Backlog Items</label>
      <textarea class="artifact-ta" id="ta-backlogItems"></textarea>
    </div>
    <div class="artifact-group">
      <label class="artifact-label" for="ta-planningNotes">Planning Notes</label>
      <textarea class="artifact-ta" id="ta-planningNotes" placeholder="Add assumptions, risks, open questions, dependencies…"></textarea>
    </div>
    <button class="primary" id="confirmReqBtn" onclick="confirmRequirements()">Confirm &amp; Continue</button>
  </div>
</section>

<!-- Step 3: Generate Design -->
<section id="sectionStep3" style="display:none">
  <div id="designSpinner" class="spinner-row">
    <span class="spinner"></span><span>Generating design artifacts from confirmed requirements…</span>
  </div>
  <pre id="designOutputPre" class="output-pre" style="display:none"></pre>
</section>

<!-- Step 4: Review Design + Publish -->
<section id="sectionStep4" style="display:none">
  <p class="review-hint">Review and edit each design artifact, then create the GitHub issue.</p>
  <div class="artifact-group">
    <label class="artifact-label" for="ta-architectureDiagram">Architecture Diagram (Mermaid)</label>
    <textarea class="artifact-ta code-ta" id="ta-architectureDiagram"></textarea>
  </div>
  <div class="artifact-group">
    <label class="artifact-label" for="ta-adr">ADR — Architecture Decision Record</label>
    <textarea class="artifact-ta" id="ta-adr"></textarea>
  </div>
  <div class="artifact-group">
    <label class="artifact-label" for="ta-openApiSpec">OpenAPI Spec (YAML)</label>
    <textarea class="artifact-ta code-ta" id="ta-openApiSpec"></textarea>
  </div>
  <div class="artifact-group">
    <label class="artifact-label" for="ta-dataModel">Data Model</label>
    <textarea class="artifact-ta" id="ta-dataModel"></textarea>
  </div>
  <div class="artifact-group">
    <label class="artifact-label" for="ta-threatModel">Threat Model</label>
    <textarea class="artifact-ta" id="ta-threatModel"></textarea>
  </div>
  <button class="primary" id="createIssueBtn" onclick="confirmDesign()">Create GitHub Issue</button>

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
    });
  }

  function markStepDone(n) {
    const dot = document.getElementById('step-dot-' + n);
    dot.classList.remove('active');
    dot.classList.add('done');
    document.getElementById('step-num-' + n).textContent = '\\u2713';
  }

  function submitForm() {
    const moduleName = document.getElementById('moduleName').value.trim();
    const reqId = document.getElementById('reqId').value.trim();
    const description = document.getElementById('description').value.trim();
    const errEl = document.getElementById('validationError');
    errEl.textContent = '';
    if (!moduleName || !reqId || !description) {
      errEl.textContent = 'All fields are required.';
      return;
    }
    document.getElementById('submitBtn').disabled = true;
    vscode.postMessage({ command: 'submit', moduleName, reqId, description });
  }

  function confirmRequirements() {
    document.getElementById('confirmReqBtn').disabled = true;
    vscode.postMessage({
      command: 'confirmRequirements',
      productRequirements: document.getElementById('ta-productRequirements').value,
      userStories:         document.getElementById('ta-userStories').value,
      acceptanceCriteria:  document.getElementById('ta-acceptanceCriteria').value,
      backlogItems:        document.getElementById('ta-backlogItems').value,
      planningNotes:       document.getElementById('ta-planningNotes').value,
    });
  }

  function confirmDesign() {
    document.getElementById('createIssueBtn').disabled = true;
    vscode.postMessage({
      command: 'confirmDesign',
      architectureDiagram: document.getElementById('ta-architectureDiagram').value,
      adr:                 document.getElementById('ta-adr').value,
      openApiSpec:         document.getElementById('ta-openApiSpec').value,
      dataModel:           document.getElementById('ta-dataModel').value,
      threatModel:         document.getElementById('ta-threatModel').value,
    });
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
        showSection(4);
        markStepDone(3);
        document.getElementById('designSpinner').style.display = 'none';
        document.getElementById('ta-architectureDiagram').value = a.architectureDiagram || '';
        document.getElementById('ta-adr').value               = a.adr || '';
        document.getElementById('ta-openApiSpec').value       = a.openApiSpec || '';
        document.getElementById('ta-dataModel').value         = a.dataModel || '';
        document.getElementById('ta-threatModel').value       = a.threatModel || '';
      } else {
        document.getElementById('reqSpinner').style.display = 'none';
        document.getElementById('ta-productRequirements').value = a.productRequirements || '';
        document.getElementById('ta-userStories').value         = a.userStories || '';
        document.getElementById('ta-acceptanceCriteria').value  = a.acceptanceCriteria || '';
        document.getElementById('ta-backlogItems').value        = a.backlogItems || '';
        document.getElementById('ta-planningNotes').value       = '';
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
    }
  });
</script>
</body>
</html>`;
    }
}
exports.RequirementPanel = RequirementPanel;
//# sourceMappingURL=requirementPanel.js.map