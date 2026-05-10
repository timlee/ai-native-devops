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
function writeArtifacts(repoRoot, moduleName, reqId, sections) {
    const written = [];
    for (const heading of ISSUE_SECTIONS) {
        const file = SECTION_FILES[heading];
        const content = sections.get(heading) ?? "";
        const fullPath = path.join(repoRoot, file);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, `# ${heading}\n\n> Module: ${moduleName} | ID: ${reqId}\n\n${content}\n`, "utf8");
        written.push(file);
    }
    // Planning notes — local-only stub
    const notesPath = path.join(repoRoot, "plan/planning-notes.md");
    fs.mkdirSync(path.dirname(notesPath), { recursive: true });
    fs.writeFileSync(notesPath, `# Planning Notes\n\n> Module: ${moduleName} | ID: ${reqId}\n\n## Assumptions\n\n- \n\n## Risks\n\n- \n\n## Open Questions\n\n- \n\n## Dependencies\n\n- \n`, "utf8");
    written.push("plan/planning-notes.md");
    return written;
}
function buildIssueBody(moduleName, reqId, sections) {
    const lines = [
        `> **Module:** ${moduleName} | **ID:** ${reqId}`,
        `> _Generated by AI-Native DevOps extension_`,
        "",
    ];
    for (const heading of ISSUE_SECTIONS) {
        const content = sections.get(heading) ?? "_Not generated._";
        lines.push(`## ${heading}`, "", content, "");
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
        this._disposables = [];
        this._panel = vscode.window.createWebviewPanel("requirementPanel", _phase.label, vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
        this._panel.webview.html = this._buildHtml();
        this._panel.webview.onDidReceiveMessage((msg) => {
            if (msg.command === "submit") {
                this._handleSubmit(msg.moduleName ?? "", msg.reqId ?? "", msg.description ?? "");
            }
            else if (msg.command === "openFile") {
                this._openFile(msg.text ?? "");
            }
            else if (msg.command === "openIssue") {
                vscode.env.openExternal(vscode.Uri.parse(msg.url ?? ""));
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
            this._panel.webview.postMessage({
                command: "validationError",
                text: "All fields are required.",
            });
            return;
        }
        this._rawOutput = "";
        this._panel.webview.postMessage({ command: "started" });
        const repoRoot = (0, phasePanel_1.resolveRepoRoot)(this._context);
        const prompt = buildPrompt(moduleName.trim(), reqId.trim(), description.trim());
        const sink = {
            appendAiChunk: (chunk) => {
                this._rawOutput += chunk;
                this._panel.webview.postMessage({ command: "appendChunk", text: chunk });
            },
            aiDone: () => {
                this._onAiDone(repoRoot, moduleName.trim(), reqId.trim());
            },
            aiError: (msg) => {
                this._panel.webview.postMessage({ command: "aiError", text: msg });
            },
        };
        await this._aiRunner.run(this._phase, prompt, sink);
    }
    async _onAiDone(repoRoot, moduleName, reqId) {
        this._panel.webview.postMessage({ command: "aiDone" });
        // Write local files
        const sections = parseSections(this._rawOutput);
        const written = writeArtifacts(repoRoot, moduleName, reqId, sections);
        this._panel.webview.postMessage({ command: "filesReady", files: written });
        // Create GitHub issue
        try {
            const cfg = vscode.workspace.getConfiguration("aiNativeDevOps");
            let owner = cfg.get("githubOwner", "").trim();
            let repo = cfg.get("githubRepo", "").trim();
            if (!owner || !repo) {
                const info = getGithubRepoInfo(repoRoot);
                if (!info) {
                    throw new Error("Cannot detect GitHub owner/repo from git remote. " +
                        "Set aiNativeDevOps.githubOwner and aiNativeDevOps.githubRepo in settings.");
                }
                owner = info.owner;
                repo = info.repo;
            }
            const token = await getGithubToken();
            const title = `[${reqId}] ${moduleName}`;
            const body = buildIssueBody(moduleName, reqId, sections);
            const { url, number } = await createGithubIssue(token, owner, repo, title, body, ["requirement", "ai-generated"]);
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
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.95em;
    margin-top: 4px;
  }
  button.primary:hover { background: var(--vscode-button-hoverBackground); }
  button.primary:disabled { opacity: 0.5; cursor: default; }
  .divider { border: none; border-top: 1px solid var(--vscode-panel-border, #444); margin: 20px 0; }
  #outputSection { display: none; }
  #outputSection.visible { display: block; }
  .section-label { font-weight: 600; margin-bottom: 8px; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vscode-descriptionForeground); }
  #spinner { display: none; font-style: italic; color: var(--vscode-descriptionForeground); margin-bottom: 8px; font-size: 0.9em; }
  #spinner.visible { display: block; }
  #outputPre {
    white-space: pre-wrap;
    word-break: break-word;
    background: var(--vscode-textBlockQuote-background, #1e1e1e);
    border-left: 3px solid var(--vscode-textBlockQuote-border, #555);
    padding: 12px;
    max-height: 360px;
    overflow-y: auto;
    font-size: 0.85em;
  }
  #issueSection { display: none; margin-top: 16px; padding: 12px; background: var(--vscode-textBlockQuote-background); border-radius: 3px; }
  #issueSection.visible { display: block; }
  #issueSection.error { border-left: 3px solid var(--vscode-errorForeground); }
  #issueSection.success { border-left: 3px solid #4caf50; }
  .issue-label { font-weight: 600; margin-bottom: 6px; font-size: 0.9em; }
  button.link-btn {
    background: none; border: none; padding: 0;
    color: var(--vscode-textLink-foreground);
    cursor: pointer; text-decoration: underline;
    font-size: inherit; font-family: inherit;
    margin-top: 0;
  }
  button.link-btn:hover { color: var(--vscode-textLink-activeForeground); }
  #filesSection { display: none; margin-top: 16px; }
  #filesSection.visible { display: block; }
  .file-list { list-style: none; margin-top: 6px; }
  .file-list li { margin: 3px 0; }
</style>
</head>
<body>
<h1>${this._phase.label}</h1>
<p class="subtitle">Fill in the fields and generate planning artifacts + a GitHub issue.</p>

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
<button class="primary" id="submitBtn" onclick="submitForm()">Generate &amp; Create GitHub Issue</button>

<hr class="divider">

<div id="outputSection">
  <div class="section-label">AI Output</div>
  <div id="spinner">Generating artifacts…</div>
  <pre id="outputPre"></pre>
</div>

<div id="issueSection">
  <div class="issue-label" id="issueLabel"></div>
  <div id="issueContent"></div>
</div>

<div id="filesSection">
  <div class="section-label">Local Files</div>
  <ul class="file-list" id="fileList"></ul>
</div>

<script>
  const vscode = acquireVsCodeApi();
  let rawOutput = '';

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

    vscode.postMessage({ command: 'submit', moduleName, reqId, description });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { submitForm(); }
  });

  window.addEventListener('message', event => {
    const msg = event.data;

    if (msg.command === 'validationError') {
      document.getElementById('validationError').textContent = msg.text;

    } else if (msg.command === 'started') {
      rawOutput = '';
      document.getElementById('submitBtn').disabled = true;
      document.getElementById('outputPre').textContent = '';
      document.getElementById('issueSection').className = '';
      document.getElementById('filesSection').classList.remove('visible');
      document.getElementById('fileList').innerHTML = '';
      document.getElementById('outputSection').classList.add('visible');
      document.getElementById('spinner').classList.add('visible');

    } else if (msg.command === 'appendChunk') {
      rawOutput += msg.text;
      const pre = document.getElementById('outputPre');
      pre.textContent = rawOutput;
      pre.scrollTop = pre.scrollHeight;

    } else if (msg.command === 'aiDone') {
      document.getElementById('spinner').classList.remove('visible');
      document.getElementById('submitBtn').disabled = false;

    } else if (msg.command === 'aiError') {
      document.getElementById('spinner').classList.remove('visible');
      document.getElementById('submitBtn').disabled = false;
      document.getElementById('outputPre').textContent += '\\n\\nError: ' + msg.text;

    } else if (msg.command === 'issueReady') {
      const sec = document.getElementById('issueSection');
      sec.className = 'visible success';
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
      sec.className = 'visible error';
      document.getElementById('issueLabel').textContent = 'GitHub Issue — Not Created';
      document.getElementById('issueContent').textContent = msg.text;

    } else if (msg.command === 'filesReady') {
      const list = document.getElementById('fileList');
      list.innerHTML = '';
      for (const f of msg.files) {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.className = 'link-btn';
        btn.textContent = f;
        btn.onclick = () => vscode.postMessage({ command: 'openFile', text: f });
        li.appendChild(btn);
        list.appendChild(li);
      }
      document.getElementById('filesSection').classList.add('visible');
    }
  });
</script>
</body>
</html>`;
    }
}
exports.RequirementPanel = RequirementPanel;
//# sourceMappingURL=requirementPanel.js.map