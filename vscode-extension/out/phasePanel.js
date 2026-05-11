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
exports.escapeHtml = escapeHtml;
exports.mdToHtml = mdToHtml;
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
    const allItems = [
        ...requirements.repositoryDirectories,
        ...requirements.mandatoryInputFiles,
        ...requirements.requiredOutputFiles,
    ];
    const availableCount = allItems.filter((item) => fs.existsSync(path.join(repoRoot, item))).length;
    const totalCount = allItems.length;
    const statsLabel = totalCount > 0 ? `${availableCount} / ${totalCount} available` : "";
    const hasOutputs = requirements.requiredOutputFiles.length > 0;
    const missingOutputs = requirements.requiredOutputFiles.filter((f) => !fs.existsSync(path.join(repoRoot, f)));
    return [
        '<section class="requirements-summary">',
        '<div class="requirements-header">',
        '<h2>Requirements</h2>',
        statsLabel ? `<span class="req-stats">${escapeHtml(statsLabel)}</span>` : "",
        "</div>",
        '<div class="requirements-body">',
        renderRequirementList("Directories", requirements.repositoryDirectories, {
            repoRoot,
            entryKind: "directory",
            allowCreate: false,
        }),
        renderRequirementList("Input Files", requirements.mandatoryInputFiles, {
            repoRoot,
            entryKind: "file",
            allowCreate: false,
        }),
        renderRequirementList("Output Files", requirements.requiredOutputFiles, {
            repoRoot,
            entryKind: "file",
            allowCreate: true,
        }),
        hasOutputs && missingOutputs.length > 0
            ? '<div class="btn-row"><button class="btn btn-secondary" id="createMissingOutputsBtn">Create ' + missingOutputs.length + ' Missing Output' + (missingOutputs.length !== 1 ? 's' : '') + '</button></div>'
            : "",
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
  *, *::before, *::after { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; overflow: hidden; }
  body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); background: var(--vscode-editor-background); display: flex; flex-direction: column; }

  /* ── Hero ── */
  .hero { flex-shrink: 0; display: flex; align-items: baseline; gap: 10px; padding: 10px 20px 9px; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-editorGroupHeader-tabsBackground); }
  .hero-title { margin: 0; font-size: 1rem; font-weight: 600; }
  .hero-sub { margin: 0; font-size: 0.8rem; color: var(--vscode-descriptionForeground); }

  /* ── Tabs ── */
  .tabs { flex-shrink: 0; display: flex; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-editorGroupHeader-tabsBackground); padding: 0 8px; gap: 2px; }
  .tab { padding: 7px 14px; cursor: pointer; border: none; background: transparent; color: var(--vscode-tab-inactiveForeground); font-size: 12px; font-family: var(--vscode-font-family); border-bottom: 2px solid transparent; white-space: nowrap; }
  .tab:hover { color: var(--vscode-tab-activeForeground); background: var(--vscode-toolbar-hoverBackground); }
  .tab.active { color: var(--vscode-tab-activeForeground); border-bottom-color: var(--vscode-focusBorder); }
  .tab:focus-visible { outline: 1px solid var(--vscode-focusBorder); outline-offset: -1px; }

  /* ── Tab panels ── */
  .tab-content { display: none; flex: 1; min-height: 0; overflow-y: auto; padding: 16px 20px 24px; }
  .tab-content.active { display: block; }

  /* ── Typography ── */
  h1 { font-size: 1.3em; margin-top: 0; }
  h2 { font-size: 1.1em; margin-top: 1.3em; margin-bottom: 0.4em; color: var(--vscode-symbolIcon-classForeground); }
  h3 { font-size: 0.95em; margin-top: 1em; margin-bottom: 0.3em; color: var(--vscode-symbolIcon-functionForeground); }
  h4 { font-size: 0.9em; margin-top: 0.8em; margin-bottom: 0.25em; }
  p { margin: 0.5em 0; line-height: 1.5; }
  pre { background: var(--vscode-textCodeBlock-background); border-radius: 4px; padding: 10px 12px; overflow-x: auto; margin: 8px 0; }
  code { font-family: var(--vscode-editor-font-family); font-size: 0.88em; }
  p code, li code { background: var(--vscode-textCodeBlock-background); padding: 1px 4px; border-radius: 3px; }
  ul, ol { padding-left: 1.4em; margin: 0.4em 0; }
  li { margin: 3px 0; line-height: 1.5; }
  hr { border: none; border-top: 1px solid var(--vscode-panel-border); margin: 14px 0; }
  a { color: var(--vscode-textLink-foreground); }
  a:hover { color: var(--vscode-textLink-activeForeground); }

  /* ── Buttons ── */
  .btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 3px; border: none; cursor: pointer; font-size: 12px; font-family: var(--vscode-font-family); }
  .btn:focus-visible { outline: 1px solid var(--vscode-focusBorder); outline-offset: 1px; }
  .btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
  .btn-primary:hover { background: var(--vscode-button-hoverBackground); }
  .btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: 1px solid var(--vscode-panel-border); }
  .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
  .btn-row { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }

  /* ── Requirements ── */
  .requirements-summary { margin-bottom: 18px; border: 1px solid var(--vscode-panel-border); border-radius: 6px; background: var(--vscode-sideBar-background); overflow: hidden; }
  .requirements-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px 8px; border-bottom: 1px solid var(--vscode-panel-border); }
  .requirements-header h2 { margin: 0; font-size: 0.95em; }
  .req-stats { font-size: 11px; color: var(--vscode-descriptionForeground); }
  .requirements-body { padding: 0 14px 12px; }
  .requirement-card { margin-top: 12px; }
  .requirement-card h3 { font-size: 0.8em; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vscode-descriptionForeground); margin-bottom: 6px; }
  .requirement-card ul { margin: 0; padding: 0; list-style: none; }
  .requirement-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 4px 0; border-bottom: 1px solid var(--vscode-panel-border,rgba(128,128,128,.15)); }
  .requirement-item:last-child { border-bottom: none; }
  .requirement-meta { display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1; }
  .requirement-meta code { overflow-wrap: anywhere; font-size: 0.85em; }
  .req-state { flex-shrink: 0; font-size: 10px; border-radius: 10px; padding: 1px 7px; font-weight: 500; }
  .req-state.ok { background: color-mix(in srgb, var(--vscode-testing-iconPassed) 15%, transparent); color: var(--vscode-testing-iconPassed); }
  .req-state.missing { background: color-mix(in srgb, var(--vscode-testing-iconFailed) 15%, transparent); color: var(--vscode-testing-iconFailed); }
  .path-action { flex-shrink: 0; background: transparent; color: var(--vscode-textLink-foreground); border: none; padding: 1px 6px; cursor: pointer; font-size: 11px; border-radius: 3px; }
  .path-action:hover:enabled { background: var(--vscode-toolbar-hoverBackground); }
  .path-action:disabled { cursor: not-allowed; opacity: 0.45; color: var(--vscode-descriptionForeground); }
  .path-action:focus-visible { outline: 1px solid var(--vscode-focusBorder); }

  /* ── Run AI tab ── */
  .run-header { margin-bottom: 12px; }
  .run-header h2 { margin: 0 0 4px; }
  .run-hint { font-size: 11px; color: var(--vscode-descriptionForeground); margin: 0; }
  textarea { width: 100%; min-height: 110px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border,var(--vscode-panel-border)); border-radius: 3px; padding: 8px 10px; font-family: var(--vscode-font-family); font-size: 0.9em; resize: vertical; line-height: 1.5; }
  textarea:focus { outline: 1px solid var(--vscode-focusBorder); border-color: var(--vscode-focusBorder); }
  .error-msg { font-size: 11px; color: var(--vscode-inputValidation-errorForeground, var(--vscode-testing-iconFailed)); background: var(--vscode-inputValidation-errorBackground, transparent); border-radius: 3px; padding: 2px 6px; margin-top: 4px; display: none; }
  .error-msg.visible { display: block; }
  .status-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; min-height: 20px; }
  .status-text { font-size: 11px; color: var(--vscode-descriptionForeground); }
  .spinner { display: inline-block; width: 11px; height: 11px; border: 2px solid var(--vscode-foreground); border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; opacity: 0.6; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── AI Output ── */
  #aiOutput { display: none; margin-top: 14px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; overflow: hidden; }
  #aiOutput.visible { display: block; }
  #aiOutputPre { margin: 0; padding: 12px 14px; background: var(--vscode-textCodeBlock-background); font-family: var(--vscode-editor-font-family); font-size: 0.88em; white-space: pre-wrap; line-height: 1.55; max-height: 420px; overflow-y: auto; }
  #aiOutputHtml { padding: 12px 14px; display: none; }
  #aiOutputHtml.visible { display: block; }
  .ai-output-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 5px 10px; background: var(--vscode-editorGroupHeader-tabsBackground); border-bottom: 1px solid var(--vscode-panel-border); font-size: 11px; color: var(--vscode-descriptionForeground); }
  .ai-output-toolbar button { background: transparent; border: none; color: var(--vscode-textLink-foreground); cursor: pointer; font-size: 11px; padding: 1px 4px; border-radius: 3px; }
  .ai-output-toolbar button:hover { background: var(--vscode-toolbar-hoverBackground); }
</style>
</head>
<body>
<header class="hero">
  <h1 class="hero-title">${escapeHtml(this.phase.label)}</h1>
  <span class="hero-sub">Lifecycle guide · AI prompts · Requirements</span>
</header>
<div class="tabs" role="tablist" aria-label="Phase content tabs">
  <button class="tab active" role="tab" aria-selected="true" aria-controls="lifecycle" onclick="showTab('lifecycle',this)">Guide</button>
  <button class="tab" role="tab" aria-selected="false" aria-controls="prompt" onclick="showTab('prompt',this)">AI Prompt</button>
  <button class="tab" role="tab" aria-selected="false" aria-controls="agent" onclick="showTab('agent',this)">Agent</button>
  <button class="tab" role="tab" aria-selected="false" aria-controls="run" onclick="showTab('run',this)">Run AI</button>
</div>

<div id="lifecycle" class="tab-content active">${requirementsHtml}${lifecycleHtml}</div>
<div id="prompt" class="tab-content">
  ${promptHtml}
  <div class="btn-row">
    <button class="btn btn-secondary" onclick="copyDefaultPrompt()">Copy Prompt</button>
    <button class="btn btn-primary" onclick="loadDefaultAndRun()">Use in Run AI &rarr;</button>
  </div>
</div>
<div id="agent" class="tab-content">${agentHtml}</div>
<div id="run" class="tab-content">
  <div class="run-header">
    <h2>Run AI &mdash; ${escapeHtml(this.phase.label)}</h2>
    <p class="run-hint">Enter a custom prompt or load the default. Press Ctrl+Enter to run.</p>
  </div>
  <textarea id="customPrompt" placeholder="Describe what you need help with, or click &quot;Load Default&quot; to use the phase prompt..."></textarea>
  <div class="error-msg" id="promptError">Please enter a prompt before running.</div>
  <div class="btn-row">
    <button class="btn btn-primary" onclick="runPrompt()">&#9654; Run</button>
    <button class="btn btn-secondary" onclick="useDefault()">Load Default</button>
    <button class="btn btn-secondary" onclick="openChecklist()">Open Checklist</button>
  </div>
  <div class="status-row" id="statusRow" style="display:none">
    <span class="spinner" id="spinner"></span>
    <span class="status-text" id="statusText"></span>
  </div>
  <div id="aiOutput">
    <div class="ai-output-toolbar">
      <span id="aiOutputLabel">AI Response</span>
      <button id="copyOutputBtn" onclick="copyOutput()" style="display:none">Copy</button>
    </div>
    <pre id="aiOutputPre"></pre>
    <div id="aiOutputHtml"></div>
  </div>
</div>

<script>
  const vscode = acquireVsCodeApi();
  const defaultPrompt = \`${escapedPrompt}\`;
  let _rawOutput = '';

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function inlineHtmlJs(t) {
    return escHtml(t)
      .replace(/\\*\\*(.+?)\\*\\*/g,'<strong>$1</strong>')
      .replace(/\`(.+?)\`/g,'<code>$1</code>')
      .replace(/\\[(.+?)\\]\\((.+?)\\)/g,'<a href="$2">$1</a>');
  }
  function mdToHtmlJs(md) {
    const lines = md.split('\\n'), out = [];
    let inCode = false, inList = false, listTag = 'ul';
    for (const line of lines) {
      if (line.startsWith('\`\`\`')) {
        if (inList) { out.push('</' + listTag + '>'); inList = false; }
        if (inCode) { out.push('</code></pre>'); inCode = false; }
        else { out.push('<pre><code>'); inCode = true; }
        continue;
      }
      if (inCode) { out.push(escHtml(line)); continue; }
      if (/^---+$/.test(line)) { if (inList) { out.push('</' + listTag + '>'); inList = false; } out.push('<hr/>'); continue; }
      const hm = line.match(/^(#{1,4})\\s+(.*)/);
      if (hm) { if (inList) { out.push('</' + listTag + '>'); inList = false; } const lv = hm[1].length; out.push('<h' + lv + '>' + inlineHtmlJs(hm[2]) + '</h' + lv + '>'); continue; }
      const lm = line.match(/^[-*]\\s+(.*)/);
      if (lm) { if (!inList || listTag !== 'ul') { if (inList) out.push('</' + listTag + '>'); out.push('<ul>'); inList = true; listTag = 'ul'; } out.push('<li>' + inlineHtmlJs(lm[1]) + '</li>'); continue; }
      const nm = line.match(/^\\d+\\.\\s+(.*)/);
      if (nm) { if (!inList || listTag !== 'ol') { if (inList) out.push('</' + listTag + '>'); out.push('<ol>'); inList = true; listTag = 'ol'; } out.push('<li>' + inlineHtmlJs(nm[1]) + '</li>'); continue; }
      if (inList) { out.push('</' + listTag + '>'); inList = false; }
      out.push(line.trim() === '' ? '<p></p>' : '<p>' + inlineHtmlJs(line) + '</p>');
    }
    if (inList) out.push('</' + listTag + '>');
    if (inCode) out.push('</code></pre>');
    return out.join('\\n');
  }

  function showTab(id, buttonEl) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(el => { el.classList.remove('active'); el.setAttribute('aria-selected','false'); });
    document.getElementById(id).classList.add('active');
    if (!buttonEl) {
      const idx = ['lifecycle','prompt','agent','run'].indexOf(id);
      buttonEl = document.querySelectorAll('.tab')[idx];
    }
    if (buttonEl) { buttonEl.classList.add('active'); buttonEl.setAttribute('aria-selected','true'); }
  }

  function setError(msg) {
    const el = document.getElementById('promptError');
    el.textContent = msg || 'Please enter a prompt before running.';
    el.classList.toggle('visible', !!msg);
  }

  function runPrompt() {
    const text = document.getElementById('customPrompt').value.trim();
    if (!text) { setError('Please enter a prompt before running.'); return; }
    setError('');
    _rawOutput = '';
    const pre = document.getElementById('aiOutputPre');
    const htmlDiv = document.getElementById('aiOutputHtml');
    pre.textContent = '';
    htmlDiv.innerHTML = '';
    htmlDiv.classList.remove('visible');
    pre.style.display = 'block';
    document.getElementById('aiOutput').classList.add('visible');
    document.getElementById('copyOutputBtn').style.display = 'none';
    const statusRow = document.getElementById('statusRow');
    statusRow.style.display = 'flex';
    document.getElementById('statusText').textContent = 'Running…';
    document.getElementById('spinner').style.display = 'inline-block';
    vscode.postMessage({ command: 'runPrompt', text });
  }

  function useDefault() {
    document.getElementById('customPrompt').value = defaultPrompt;
    setError('');
  }

  function loadDefaultAndRun() {
    showTab('run', null);
    document.getElementById('customPrompt').value = defaultPrompt;
    setError('');
  }

  function copyDefaultPrompt() {
    vscode.postMessage({ command: 'copyPrompt', text: defaultPrompt });
  }

  function copyOutput() {
    vscode.postMessage({ command: 'copyPrompt', text: _rawOutput });
  }

  function openChecklist() {
    vscode.postMessage({ command: 'openChecklist' });
  }

  document.getElementById('customPrompt').addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runPrompt(); }
  });

  const createMissingOutputsBtn = document.getElementById('createMissingOutputsBtn');
  if (createMissingOutputsBtn) {
    createMissingOutputsBtn.addEventListener('click', () => vscode.postMessage({ command: 'createMissingOutputs' }));
  }

  document.querySelectorAll('.tab').forEach((tab, index, tabs) => {
    tab.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const delta = e.key === 'ArrowRight' ? 1 : -1;
      const next = (index + delta + tabs.length) % tabs.length;
      tabs[next].focus(); tabs[next].click();
    });
  });

  document.addEventListener('click', e => {
    const target = e.target;
    if (!(target instanceof HTMLElement) || !target.classList.contains('path-action')) return;
    vscode.postMessage({ command: 'openPath', relativePath: target.dataset.path, kind: target.dataset.kind, createIfMissing: target.dataset.create === 'true' });
  });

  window.addEventListener('message', event => {
    const msg = event.data;
    const pre = document.getElementById('aiOutputPre');
    const htmlDiv = document.getElementById('aiOutputHtml');
    if (msg.command === 'appendChunk') {
      _rawOutput += msg.text;
      pre.textContent = _rawOutput;
      pre.scrollTop = pre.scrollHeight;
    } else if (msg.command === 'aiDone') {
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('statusText').textContent = 'Done';
      // Render markdown
      htmlDiv.innerHTML = mdToHtmlJs(_rawOutput);
      htmlDiv.classList.add('visible');
      pre.style.display = 'none';
      document.getElementById('copyOutputBtn').style.display = 'inline';
    } else if (msg.command === 'aiError') {
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('statusText').textContent = 'Error';
      pre.textContent += '\\n\\nError: ' + msg.text;
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