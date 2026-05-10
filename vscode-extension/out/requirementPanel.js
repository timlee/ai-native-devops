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
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const phasePanel_1 = require("./phasePanel");
const SECTION_MAP = [
    { heading: "Product Requirements", file: "plan/product-requirements.md" },
    { heading: "Backlog Items", file: "plan/backlog-items.md" },
    { heading: "User Stories", file: "plan/user-stories.md" },
    { heading: "Acceptance Criteria", file: "plan/acceptance-criteria.md" },
    { heading: "Planning Notes", file: "plan/planning-notes.md" },
];
function buildPrompt(requirementsText) {
    return [
        "You are the REQUIREMENT phase AI agent.",
        "",
        "Raw requirements provided by the user:",
        requirementsText.trim(),
        "",
        "Task:",
        "Analyze the requirements and produce exactly five planning artifacts as structured Markdown.",
        "Use these exact ## headings in this order (no text before the first heading):",
        "",
        "## Product Requirements",
        "## Backlog Items",
        "## User Stories",
        "## Acceptance Criteria",
        "## Planning Notes",
        "",
        "Guidelines:",
        "- Product Requirements: clear, testable requirements as a numbered list.",
        "- Backlog Items: prioritized list with labels (P0/P1/P2) and effort estimate (S/M/L).",
        "- User Stories: 'As a <role>, I want <goal>, so that <benefit>' format, one per bullet.",
        "- Acceptance Criteria: measurable conditions tied to each story, as checkboxes (- [ ]).",
        "- Planning Notes: assumptions, risks, open questions, and dependencies.",
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
function writeArtifacts(repoRoot, markdown) {
    const sections = parseSections(markdown);
    const written = [];
    for (const { heading, file } of SECTION_MAP) {
        const content = sections.get(heading) ?? "";
        const fullPath = path.join(repoRoot, file);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, `# ${heading}\n\n${content}\n`, "utf8");
        written.push(file);
    }
    return written;
}
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
                this._handleSubmit(msg.text ?? "");
            }
            else if (msg.command === "openFile") {
                this._openFile(msg.text ?? "");
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
    async _handleSubmit(text) {
        if (!text.trim()) {
            this._panel.webview.postMessage({ command: "validationError", text: "Requirements cannot be empty." });
            return;
        }
        this._rawOutput = "";
        this._panel.webview.postMessage({ command: "started" });
        const repoRoot = (0, phasePanel_1.resolveRepoRoot)(this._context);
        const prompt = buildPrompt(text);
        const sink = {
            appendAiChunk: (chunk) => {
                this._rawOutput += chunk;
                this._panel.webview.postMessage({ command: "appendChunk", text: chunk });
            },
            aiDone: () => {
                const written = writeArtifacts(repoRoot, this._rawOutput);
                this._panel.webview.postMessage({ command: "aiDone" });
                this._panel.webview.postMessage({ command: "filesReady", files: written });
            },
            aiError: (msg) => {
                this._panel.webview.postMessage({ command: "aiError", text: msg });
            },
        };
        await this._aiRunner.run(this._phase, prompt, sink);
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
        const artifactNames = SECTION_MAP.map(s => s.heading);
        const artifactFiles = SECTION_MAP.map(s => s.file);
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
  label { display: block; font-weight: 600; margin-bottom: 6px; }
  textarea {
    width: 100%;
    min-height: 160px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, #555);
    border-radius: 3px;
    padding: 10px;
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    resize: vertical;
  }
  textarea:focus { outline: 1px solid var(--vscode-focusBorder); border-color: var(--vscode-focusBorder); }
  .error-msg { color: var(--vscode-errorForeground); font-size: 0.85em; margin-top: 4px; min-height: 1em; }
  button {
    margin-top: 12px;
    padding: 8px 18px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.95em;
  }
  button:hover { background: var(--vscode-button-hoverBackground); }
  button:disabled { opacity: 0.5; cursor: default; }
  .divider { border: none; border-top: 1px solid var(--vscode-panel-border, #444); margin: 20px 0; }
  #outputSection { display: none; }
  #outputSection.visible { display: block; }
  .output-label { font-weight: 600; margin-bottom: 8px; }
  #spinner { display: none; font-style: italic; color: var(--vscode-descriptionForeground); margin-bottom: 8px; }
  #spinner.visible { display: block; }
  #outputPre {
    white-space: pre-wrap;
    word-break: break-word;
    background: var(--vscode-textBlockQuote-background, #1e1e1e);
    border-left: 3px solid var(--vscode-textBlockQuote-border, #555);
    padding: 12px;
    max-height: 400px;
    overflow-y: auto;
    font-size: 0.85em;
  }
  #filesSection { display: none; margin-top: 16px; }
  #filesSection.visible { display: block; }
  .files-label { font-weight: 600; margin-bottom: 8px; }
  .file-list { list-style: none; }
  .file-list li { margin: 4px 0; }
  .file-link {
    background: none;
    border: none;
    color: var(--vscode-textLink-foreground);
    cursor: pointer;
    padding: 0;
    font-size: inherit;
    text-decoration: underline;
    margin-top: 0;
  }
  .file-link:hover { color: var(--vscode-textLink-activeForeground); }
</style>
</head>
<body>
<h1>${this._phase.label}</h1>
<p class="subtitle">Enter your requirements and generate the five planning artifacts.</p>

<label for="reqInput">Requirements</label>
<textarea id="reqInput" placeholder="Describe what you need to build. Include goals, constraints, user types, and any known constraints or deadlines..."></textarea>
<div class="error-msg" id="validationError"></div>
<button id="submitBtn" onclick="submitRequirements()">Generate Artifacts</button>

<hr class="divider">

<div id="outputSection">
  <div class="output-label">AI Output</div>
  <div id="spinner">Generating artifacts…</div>
  <pre id="outputPre"></pre>
</div>

<div id="filesSection">
  <div class="files-label">Generated Files</div>
  <ul class="file-list" id="fileList"></ul>
</div>

<script>
  const vscode = acquireVsCodeApi();
  let rawOutput = '';

  function submitRequirements() {
    const text = document.getElementById('reqInput').value;
    document.getElementById('validationError').textContent = '';
    if (!text.trim()) {
      document.getElementById('validationError').textContent = 'Requirements cannot be empty.';
      return;
    }
    vscode.postMessage({ command: 'submit', text });
  }

  document.getElementById('reqInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { submitRequirements(); }
  });

  window.addEventListener('message', event => {
    const msg = event.data;

    if (msg.command === 'validationError') {
      document.getElementById('validationError').textContent = msg.text;

    } else if (msg.command === 'started') {
      rawOutput = '';
      document.getElementById('submitBtn').disabled = true;
      document.getElementById('outputPre').textContent = '';
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

    } else if (msg.command === 'filesReady') {
      const list = document.getElementById('fileList');
      list.innerHTML = '';
      for (const f of msg.files) {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.className = 'file-link';
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