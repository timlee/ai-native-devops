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
exports.PhasePanel = void 0;
exports.resolveRepoRoot = resolveRepoRoot;
exports.readPhaseFile = readPhaseFile;
exports.readPhaseRequirements = readPhaseRequirements;
exports.ensureTextFile = ensureTextFile;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/** Resolve the root of the ai-native-devops docs folder */
function resolveRepoRoot(context) {
    const configured = vscode.workspace
        .getConfiguration("aiNativeDevOps")
        .get("repoRoot", "");
    if (configured && fs.existsSync(configured)) {
        return configured;
    }
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
        return folders[0].uri.fsPath;
    }
    return context.extensionPath;
}
function readPhaseFile(repoRoot, relativePath) {
    if (!relativePath || typeof relativePath !== "string") {
        return null;
    }
    const full = path.join(repoRoot, relativePath);
    if (!fs.existsSync(full)) {
        return null;
    }
    return fs.readFileSync(full, "utf8");
}
function normalizeSectionName(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[#:]/g, "")
        .replace(/\s+/g, " ");
}
function parseListSections(content) {
    const sections = new Map();
    let currentSection;
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line === "```text" || line === "```") {
            continue;
        }
        const markdownHeading = line.match(/^##\s+(.+)$/);
        const labelHeading = line.match(/^([A-Za-z/&\- ]+):$/);
        if (markdownHeading || labelHeading) {
            currentSection = normalizeSectionName(markdownHeading?.[1] ?? labelHeading?.[1] ?? "");
            if (!sections.has(currentSection)) {
                sections.set(currentSection, []);
            }
            continue;
        }
        const bullet = line.match(/^-\s+(.+)$/);
        if (bullet && currentSection) {
            sections.get(currentSection)?.push(bullet[1].trim());
        }
    }
    return sections;
}
function unique(items) {
    return Array.from(new Set(items));
}
function readPhaseRequirements(repoRoot, phase) {
    const lifecycleContent = readPhaseFile(repoRoot, phase.lifecycleFile) ?? "";
    const promptContent = readPhaseFile(repoRoot, phase.promptFile) ?? "";
    const lifecycleSections = parseListSections(lifecycleContent);
    const promptSections = parseListSections(promptContent);
    const directories = unique([
        ...(promptSections.get("repository directories") ?? []),
        ...(lifecycleSections.get("repository directories") ?? []),
    ]);
    const mandatoryInputFiles = unique([
        ...(promptSections.get("mandatory input files") ?? []),
        ...(lifecycleSections.get("mandatory input files") ?? []),
    ]);
    const requiredOutputFiles = unique([
        ...(promptSections.get("required output files") ?? []),
        ...(lifecycleSections.get("required output files") ?? []),
    ]);
    return {
        repositoryDirectories: directories,
        mandatoryInputFiles,
        requiredOutputFiles,
    };
}
function ensureTextFile(repoRoot, relativePath, content) {
    const full = path.join(repoRoot, relativePath);
    const dir = path.dirname(full);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(full)) {
        fs.writeFileSync(full, content, "utf8");
    }
    return full;
}
/** Escape HTML for safe injection into webview */
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
/** Very lightweight markdown → HTML (headings, bold, code, lists, horizontal rules) */
function mdToHtml(md) {
    const lines = md.split("\n");
    const out = [];
    let inCode = false;
    let inList = false;
    for (const raw of lines) {
        const line = raw;
        if (line.startsWith("```")) {
            if (inList) {
                out.push("</ul>");
                inList = false;
            }
            if (inCode) {
                out.push("</code></pre>");
                inCode = false;
            }
            else {
                const lang = escapeHtml(line.slice(3).trim());
                out.push(`<pre><code class="language-${lang}">`);
                inCode = true;
            }
            continue;
        }
        if (inCode) {
            out.push(escapeHtml(line));
            continue;
        }
        if (line.match(/^---+$/)) {
            if (inList) {
                out.push("</ul>");
                inList = false;
            }
            out.push("<hr/>");
            continue;
        }
        const hMatch = line.match(/^(#{1,4})\s+(.*)/);
        if (hMatch) {
            if (inList) {
                out.push("</ul>");
                inList = false;
            }
            const level = hMatch[1].length;
            const text = inlineHtml(hMatch[2]);
            out.push(`<h${level}>${text}</h${level}>`);
            continue;
        }
        const listMatch = line.match(/^[-*]\s+(.*)/);
        if (listMatch) {
            if (!inList) {
                out.push("<ul>");
                inList = true;
            }
            out.push(`<li>${inlineHtml(listMatch[1])}</li>`);
            continue;
        }
        const numMatch = line.match(/^\d+\.\s+(.*)/);
        if (numMatch) {
            if (!inList) {
                out.push("<ol>");
                inList = true;
            }
            out.push(`<li>${inlineHtml(numMatch[1])}</li>`);
            continue;
        }
        if (inList) {
            out.push("</ul>");
            inList = false;
        }
        if (line.trim() === "") {
            out.push("<p></p>");
        }
        else {
            out.push(`<p>${inlineHtml(line)}</p>`);
        }
    }
    if (inList)
        out.push("</ul>");
    if (inCode)
        out.push("</code></pre>");
    return out.join("\n");
}
function inlineHtml(text) {
    // Bold
    text = escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/`(.+?)`/g, "<code>$1</code>")
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    return text;
}
function renderRequirementList(title, items, options) {
    if (items.length === 0) {
        return "";
    }
    const list = items.map((item) => {
        const fullPath = path.join(options.repoRoot, item);
        const exists = fs.existsSync(fullPath);
        const actionLabel = exists ? "Open" : options.allowCreate ? "Create" : "Missing";
        const disabled = exists || options.allowCreate ? "" : " disabled";
        const statusText = exists ? "Available" : "Missing";
        const statusClass = exists ? "req-state ok" : "req-state missing";
        return [
            '<li class="requirement-item">',
            '<div class="requirement-meta">',
            `<code>${escapeHtml(item)}</code>`,
            `<span class="${statusClass}">${statusText}</span>`,
            '</div>',
            `<button class="path-action" data-path="${escapeHtml(item)}" data-kind="${options.entryKind}" data-create="${options.allowCreate ? "true" : "false"}"${disabled}>${actionLabel}</button>`,
            "</li>",
        ].join("");
    }).join("");
    return [
        '<section class="requirement-card">',
        `<h3>${escapeHtml(title)}</h3>`,
        `<ul>${list}</ul>`,
        "</section>",
    ].join("");
}
function renderRequirementsSummary(repoRoot, requirements) {
    return [
        '<section class="requirements-summary">',
        '<h2>Repository Requirements</h2>',
        '<p>Read these files first and write outputs to these repository targets.</p>',
        renderRequirementList("Repository Directories", requirements.repositoryDirectories, {
            repoRoot,
            entryKind: "directory",
            allowCreate: false,
        }),
        renderRequirementList("Mandatory Input Files", requirements.mandatoryInputFiles, {
            repoRoot,
            entryKind: "file",
            allowCreate: false,
        }),
        renderRequirementList("Required Output Files", requirements.requiredOutputFiles, {
            repoRoot,
            entryKind: "file",
            allowCreate: true,
        }),
        '<div class="btn-row compact">',
        '<button class="btn btn-secondary" id="createMissingOutputsBtn">Create Missing Outputs</button>',
        "</div>",
        "</section>",
    ].join("");
}
class PhasePanel {
    static show(phase, context, aiRunner) {
        const existing = PhasePanel.panels.get(phase.id);
        if (existing) {
            existing._panel.reveal();
            return existing;
        }
        const panel = vscode.window.createWebviewPanel(PhasePanel.viewType, `AI DevOps · ${phase.label}`, vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        const instance = new PhasePanel(panel, phase, context, aiRunner);
        PhasePanel.panels.set(phase.id, instance);
        return instance;
    }
    constructor(panel, phase, context, aiRunner) {
        this.phase = phase;
        this.context = context;
        this.aiRunner = aiRunner;
        this._disposables = [];
        this._panel = panel;
        this._render();
        this._panel.onDidDispose(() => {
            PhasePanel.panels.delete(phase.id);
            this._disposables.forEach((d) => d.dispose());
        }, null, this._disposables);
        this._panel.webview.onDidReceiveMessage((msg) => this._handleMessage(msg), null, this._disposables);
    }
    async _handleMessage(msg) {
        switch (msg.command) {
            case "runPrompt":
                await this.aiRunner(this.phase, msg.text, this);
                break;
            case "openChecklist":
                await vscode.commands.executeCommand("aiNativeDevOps.openChecklist", this.phase);
                break;
            case "copyPrompt":
                await vscode.env.clipboard.writeText(msg.text ?? "");
                vscode.window.showInformationMessage("Prompt copied to clipboard.");
                break;
            case "openPath":
                await this._openRequirementPath(msg.relativePath, msg.kind, msg.createIfMissing === true);
                break;
            case "createMissingOutputs":
                await this._createMissingOutputFiles();
                break;
        }
    }
    async _createMissingOutputFiles() {
        const repoRoot = resolveRepoRoot(this.context);
        const requirements = readPhaseRequirements(repoRoot, this.phase);
        const created = [];
        for (const relativePath of requirements.requiredOutputFiles) {
            const fullPath = path.join(repoRoot, relativePath);
            if (!fs.existsSync(fullPath)) {
                ensureTextFile(repoRoot, relativePath, "");
                created.push(relativePath);
            }
        }
        if (created.length === 0) {
            vscode.window.showInformationMessage("All required output files already exist.");
            return;
        }
        vscode.window.showInformationMessage(`Created ${created.length} required output file(s).`);
        this._render();
    }
    async _openRequirementPath(relativePath, kind, createIfMissing) {
        if (!relativePath || !kind) {
            return;
        }
        const repoRoot = resolveRepoRoot(this.context);
        const fullPath = path.join(repoRoot, relativePath);
        if (kind === "directory") {
            if (!fs.existsSync(fullPath)) {
                vscode.window.showWarningMessage(`Directory not found: ${relativePath}`);
                return;
            }
            const uri = vscode.Uri.file(fullPath);
            await vscode.commands.executeCommand("revealInExplorer", uri);
            return;
        }
        let targetPath = fullPath;
        if (!fs.existsSync(targetPath)) {
            if (!createIfMissing) {
                vscode.window.showWarningMessage(`File not found: ${relativePath}`);
                return;
            }
            targetPath = ensureTextFile(repoRoot, relativePath, "");
        }
        const doc = await vscode.workspace.openTextDocument(targetPath);
        await vscode.window.showTextDocument(doc, { preview: false });
    }
    /** Append streamed AI response text to the panel */
    appendAiChunk(chunk) {
        this._panel.webview.postMessage({ command: "appendChunk", text: chunk });
    }
    /** Mark AI stream as done */
    aiDone() {
        this._panel.webview.postMessage({ command: "aiDone" });
    }
    /** Show an error in the AI output area */
    aiError(msg) {
        this._panel.webview.postMessage({ command: "aiError", text: msg });
    }
    _render() {
        const repoRoot = resolveRepoRoot(this.context);
        const lifecycle = readPhaseFile(repoRoot, this.phase.lifecycleFile) ?? "_File not found._";
        const prompt = readPhaseFile(repoRoot, this.phase.promptFile) ?? "_File not found._";
        const agent = readPhaseFile(repoRoot, this.phase.agentFile) ?? "_File not found._";
        const requirements = readPhaseRequirements(repoRoot, this.phase);
        const lifecycleHtml = mdToHtml(lifecycle);
        const promptHtml = mdToHtml(prompt);
        const agentHtml = mdToHtml(agent);
        const requirementsHtml = renderRequirementsSummary(repoRoot, requirements);
        this._panel.webview.html = this._buildHtml(lifecycleHtml, promptHtml, agentHtml, requirementsHtml, prompt);
    }
    _buildHtml(lifecycleHtml, promptHtml, agentHtml, requirementsHtml, rawPrompt) {
        const escapedPrompt = rawPrompt.replace(/`/g, "\\`").replace(/\$/g, "\\$");
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';"/>
<title>${escapeHtml(this.phase.label)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); margin: 0; padding: 0; }
  .hero { padding: 14px 20px 10px; border-bottom: 1px solid var(--vscode-panel-border); background: linear-gradient(180deg, var(--vscode-editorGroupHeader-tabsBackground), transparent); }
  .hero h1 { margin: 0; font-size: 1.1rem; }
  .hero p { margin: 4px 0 0; color: var(--vscode-descriptionForeground); }
  .tabs { display: flex; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-editorGroupHeader-tabsBackground); padding: 0 8px; gap: 2px; }
  .tab { padding: 8px 14px; cursor: pointer; border: none; background: transparent; color: var(--vscode-tab-inactiveForeground); font-size: 13px; border-bottom: 2px solid transparent; }
  .tab.active, .tab[aria-selected="true"] { color: var(--vscode-tab-activeForeground); border-bottom-color: var(--vscode-focusBorder); }
  .tab:focus-visible, .btn:focus-visible, .path-action:focus-visible { outline: 1px solid var(--vscode-focusBorder); outline-offset: 1px; }
  .tab-content { display: none; padding: 16px 20px; }
  .tab-content.active { display: block; }
  h1 { font-size: 1.4em; margin-top: 0; }
  h2 { font-size: 1.15em; margin-top: 1.2em; color: var(--vscode-symbolIcon-classForeground); }
  h3 { font-size: 1em; color: var(--vscode-symbolIcon-functionForeground); }
  pre { background: var(--vscode-textCodeBlock-background); border-radius: 4px; padding: 12px; overflow-x: auto; }
  code { font-family: var(--vscode-editor-font-family); font-size: 0.9em; }
  p code { background: var(--vscode-textCodeBlock-background); padding: 1px 4px; border-radius: 3px; }
  ul, ol { padding-left: 1.4em; }
  li { margin: 3px 0; }
  hr { border: none; border-top: 1px solid var(--vscode-panel-border); margin: 12px 0; }
  a { color: var(--vscode-textLink-foreground); }
  textarea { width: 100%; min-height: 120px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 3px; padding: 8px; font-family: var(--vscode-editor-font-family); font-size: 0.9em; resize: vertical; }
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 3px; border: none; cursor: pointer; font-size: 13px; }
  .btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
  .btn-primary:hover { background: var(--vscode-button-hoverBackground); }
  .btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
  .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
  .btn-row { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .btn-row.compact { margin-top: 12px; }
  #aiOutput { margin-top: 16px; background: var(--vscode-textCodeBlock-background); border-radius: 4px; padding: 12px; min-height: 60px; white-space: pre-wrap; font-family: var(--vscode-editor-font-family); font-size: 0.9em; display: none; }
  #aiOutput.visible { display: block; }
  .spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid var(--vscode-progressBar-background); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .status-bar { font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 6px; height: 16px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
  .requirements-summary { margin-bottom: 16px; padding: 14px 16px; border: 1px solid var(--vscode-panel-border); border-radius: 6px; background: var(--vscode-sideBar-background); }
  .requirements-summary h2 { margin-top: 0; }
  .requirement-card { margin-top: 14px; }
  .requirement-card h3 { margin-bottom: 8px; }
  .requirement-card ul { margin: 0; }
  .requirement-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .requirement-meta { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .requirement-meta code { overflow-wrap: anywhere; }
  .req-state { font-size: 11px; border: 1px solid var(--vscode-panel-border); border-radius: 10px; padding: 1px 6px; }
  .req-state.ok { color: var(--vscode-testing-iconPassed); }
  .req-state.missing { color: var(--vscode-testing-iconFailed); }
  .path-action { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 2px 8px; cursor: pointer; }
  .path-action:hover:enabled { background: var(--vscode-button-secondaryHoverBackground); }
  .path-action:disabled { cursor: not-allowed; opacity: 0.6; }
</style>
</head>
<body>
<header class="hero">
  <h1>${escapeHtml(this.phase.label)}</h1>
  <p>Review requirements, inspect lifecycle guidance, and run automation prompts in one workflow.</p>
</header>
<div class="tabs" role="tablist" aria-label="Phase content tabs">
  <button class="tab active" role="tab" aria-selected="true" aria-controls="lifecycle" onclick="showTab('lifecycle', this)">Lifecycle Guide</button>
  <button class="tab" role="tab" aria-selected="false" aria-controls="prompt" onclick="showTab('prompt', this)">AI Prompt</button>
  <button class="tab" role="tab" aria-selected="false" aria-controls="agent" onclick="showTab('agent', this)">Agent Guide</button>
  <button class="tab" role="tab" aria-selected="false" aria-controls="run" onclick="showTab('run', this)">Run AI</button>
</div>

<div id="lifecycle" class="tab-content active">${requirementsHtml}${lifecycleHtml}</div>
<div id="prompt" class="tab-content">
  ${promptHtml}
  <div class="btn-row">
    <button class="btn btn-secondary" onclick="copyDefaultPrompt()">Copy Prompt</button>
    <button class="btn btn-primary" onclick="showTab('run'); document.getElementById('customPrompt').value = defaultPrompt;">Use in AI Runner →</button>
  </div>
</div>
<div id="agent" class="tab-content">${agentHtml}</div>
<div id="run" class="tab-content">
  <h2>Run AI for Phase ${escapeHtml(this.phase.label)}</h2>
  <p>Customize the prompt below, then run it with your configured AI provider (Claude, OpenAI, or Copilot).</p>
  <textarea id="customPrompt" placeholder="Enter your prompt or click 'Use Default Prompt'...">${""}</textarea>
  <div class="btn-row">
    <button class="btn btn-primary" onclick="runPrompt()">▶ Run Prompt</button>
    <button class="btn btn-secondary" onclick="useDefault()">Use Default Prompt</button>
    <button class="btn btn-secondary" onclick="openChecklist()">Open Checklist</button>
  </div>
  <div class="status-bar" id="statusBar"></div>
  <div id="aiOutput"></div>
</div>

<script>
  const vscode = acquireVsCodeApi();
  const defaultPrompt = \`${escapedPrompt}\`;

  function showTab(id, buttonEl) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(el => {
      el.classList.remove('active');
      el.setAttribute('aria-selected', 'false');
    });
    document.getElementById(id).classList.add('active');
    if (!buttonEl) {
      const idx = ['lifecycle','prompt','agent','run'].indexOf(id);
      buttonEl = document.querySelectorAll('.tab')[idx];
    }
    if (buttonEl) {
      buttonEl.classList.add('active');
      buttonEl.setAttribute('aria-selected', 'true');
    }
  }

  function runPrompt() {
    const text = document.getElementById('customPrompt').value.trim();
    if (!text) { alert('Please enter a prompt.'); return; }
    const out = document.getElementById('aiOutput');
    out.textContent = '';
    out.classList.add('visible');
    document.getElementById('statusBar').innerHTML = '<span class="spinner"></span> Running...';
    vscode.postMessage({ command: 'runPrompt', text });
  }

  function useDefault() {
    document.getElementById('customPrompt').value = defaultPrompt;
  }

  function copyDefaultPrompt() {
    vscode.postMessage({ command: 'copyPrompt', text: defaultPrompt });
  }

  function openChecklist() {
    vscode.postMessage({ command: 'openChecklist' });
  }

  const createMissingOutputsBtn = document.getElementById('createMissingOutputsBtn');
  if (createMissingOutputsBtn) {
    createMissingOutputsBtn.addEventListener('click', () => {
      vscode.postMessage({ command: 'createMissingOutputs' });
    });
  }

  document.querySelectorAll('.tab').forEach((tab, index, tabs) => {
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
        return;
      }
      event.preventDefault();
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const next = (index + delta + tabs.length) % tabs.length;
      tabs[next].focus();
      tabs[next].click();
    });
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.classList.contains('path-action')) {
      return;
    }
    vscode.postMessage({
      command: 'openPath',
      relativePath: target.dataset.path,
      kind: target.dataset.kind,
      createIfMissing: target.dataset.create === 'true'
    });
  });

  window.addEventListener('message', event => {
    const msg = event.data;
    const out = document.getElementById('aiOutput');
    if (msg.command === 'appendChunk') {
      out.textContent += msg.text;
      out.scrollTop = out.scrollHeight;
    } else if (msg.command === 'aiDone') {
      document.getElementById('statusBar').textContent = '✅ Done';
    } else if (msg.command === 'aiError') {
      out.textContent += '\\n\\n⚠ Error: ' + msg.text;
      document.getElementById('statusBar').textContent = '❌ Error';
    }
  });
</script>
</body>
</html>`;
    }
}
exports.PhasePanel = PhasePanel;
PhasePanel.viewType = "aiNativeDevOps.phasePanel";
PhasePanel.panels = new Map();
//# sourceMappingURL=phasePanel.js.map