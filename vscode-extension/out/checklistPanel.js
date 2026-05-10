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
exports.ChecklistPanel = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const phasePanel_1 = require("./phasePanel");
class ChecklistPanel {
    static show(phase, context) {
        const existing = ChecklistPanel.panels.get(phase.id);
        if (existing) {
            existing._panel.reveal();
            return existing;
        }
        const panel = vscode.window.createWebviewPanel(ChecklistPanel.viewType, `Checklist · ${phase.label}`, vscode.ViewColumn.Beside, { enableScripts: true, retainContextWhenHidden: true });
        const instance = new ChecklistPanel(panel, phase, context);
        ChecklistPanel.panels.set(phase.id, instance);
        return instance;
    }
    constructor(panel, phase, context) {
        this.phase = phase;
        this.context = context;
        this._disposables = [];
        this._items = [];
        this._panel = panel;
        this._items = this._parseChecklist();
        this._render();
        this._panel.onDidDispose(() => {
            ChecklistPanel.panels.delete(phase.id);
            this._disposables.forEach((d) => d.dispose());
        }, null, this._disposables);
        this._panel.webview.onDidReceiveMessage((msg) => {
            if (msg.command === "toggle" && msg.index !== undefined) {
                this._items[msg.index].checked = msg.checked;
                this._updateProgress();
            }
            else if (msg.command === "markAll") {
                this._items.forEach((item) => {
                    item.checked = true;
                });
                this._render();
            }
            else if (msg.command === "resetAll") {
                this._items.forEach((item) => {
                    item.checked = false;
                });
                this._render();
            }
        }, null, this._disposables);
    }
    _parseChecklist() {
        const repoRoot = (0, phasePanel_1.resolveRepoRoot)(this.context);
        const filePath = path.join(repoRoot, this.phase.checklistFile);
        if (!fs.existsSync(filePath)) {
            return [];
        }
        const content = fs.readFileSync(filePath, "utf8");
        const items = [];
        let currentSection = "General";
        for (const line of content.split("\n")) {
            const hMatch = line.match(/^#{1,4}\s+(.*)/);
            if (hMatch) {
                currentSection = hMatch[1].trim();
                continue;
            }
            const cbMatch = line.match(/^[-*]\s+\[[ xX]\]\s+(.*)/);
            if (cbMatch) {
                items.push({
                    text: cbMatch[1].trim(),
                    checked: false,
                    section: currentSection,
                });
                continue;
            }
            const cbMatch2 = line.match(/^[-*]\s+(.*)/);
            if (cbMatch2 && currentSection) {
                items.push({
                    text: cbMatch2[1].trim(),
                    checked: false,
                    section: currentSection,
                });
            }
        }
        return items;
    }
    _updateProgress() {
        const done = this._items.filter((i) => i.checked).length;
        const total = this._items.length;
        this._panel.webview.postMessage({ command: "progress", done, total });
    }
    _render() {
        const sections = new Map();
        this._items.forEach((item, idx) => {
            if (!sections.has(item.section))
                sections.set(item.section, []);
            sections.get(item.section).push({ text: item.text, index: idx });
        });
        let sectionsHtml = "";
        sections.forEach((items, section) => {
            const done = items.filter(({ index }) => this._items[index].checked).length;
            const itemsHtml = items
                .map(({ text, index }) => `<li class="cl-item">
              <label>
                <input type="checkbox" data-index="${index}" onchange="toggle(this)" ${this._items[index].checked ? "checked" : ""}/>
                <span>${escapeHtml(text)}</span>
              </label>
            </li>`)
                .join("");
            sectionsHtml += `<div class="section"><div class="section-header"><h3>${escapeHtml(section)}</h3><span class="section-count">${done}/${items.length}</span></div><ul>${itemsHtml}</ul></div>`;
        });
        const total = this._items.length;
        const done = this._items.filter((i) => i.checked).length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const emptyState = total === 0
            ? `<div class="empty-state"><p>No checklist items found.</p><p class="empty-hint">Checklist file: <code>${escapeHtml(this.phase.checklistFile)}</code></p></div>`
            : "";
        this._panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';"/>
<title>Checklist</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; overflow: hidden; }
  body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); background: var(--vscode-editor-background); display: flex; flex-direction: column; }

  .header { flex-shrink: 0; padding: 10px 16px 8px; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-editorGroupHeader-tabsBackground); }
  .header-top { display: flex; align-items: baseline; justify-content: space-between; }
  h2 { margin: 0; font-size: 1rem; font-weight: 600; }
  .progress-label { font-size: 11px; color: var(--vscode-descriptionForeground); }
  .progress-track { background: var(--vscode-panel-border); border-radius: 3px; height: 4px; margin-top: 8px; }
  .progress-fill { background: var(--vscode-charts-green, #4ec9b0); height: 4px; border-radius: 3px; transition: width 0.25s ease; }

  .toolbar { flex-shrink: 0; display: flex; gap: 6px; padding: 7px 16px; border-bottom: 1px solid var(--vscode-panel-border); }
  .btn { border: 1px solid var(--vscode-panel-border); background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border-radius: 3px; padding: 3px 10px; cursor: pointer; font-size: 11px; font-family: var(--vscode-font-family); }
  .btn:hover { background: var(--vscode-button-secondaryHoverBackground); }
  .btn:focus-visible { outline: 1px solid var(--vscode-focusBorder); }

  .scroll-area { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 16px 20px; }

  .section { margin-bottom: 18px; }
  .section-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid var(--vscode-panel-border); }
  h3 { margin: 0; font-size: 0.85em; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vscode-descriptionForeground); }
  .section-count { font-size: 10px; color: var(--vscode-descriptionForeground); }

  ul { list-style: none; padding: 0; margin: 0; }
  .cl-item { padding: 3px 0; }
  .cl-item label { display: flex; align-items: flex-start; gap: 8px; cursor: pointer; padding: 3px 6px; border-radius: 4px; margin: 0 -6px; }
  .cl-item label:hover { background: var(--vscode-toolbar-hoverBackground); }
  .cl-item input[type=checkbox] { margin-top: 2px; flex-shrink: 0; cursor: pointer; accent-color: var(--vscode-charts-blue, #0078d4); }
  .cl-item span { line-height: 1.45; font-size: 0.9em; }
  .cl-item.done span { text-decoration: line-through; opacity: 0.5; }

  .empty-state { text-align: center; padding: 40px 20px; color: var(--vscode-descriptionForeground); }
  .empty-state p { margin: 6px 0; }
  .empty-hint { font-size: 11px; }
  .empty-hint code { font-family: var(--vscode-editor-font-family); font-size: 0.9em; }
</style>
</head>
<body>
<div class="header">
  <div class="header-top">
    <h2>${escapeHtml(this.phase.label)} Checklist</h2>
    <span class="progress-label" id="progressLabel">${done} / ${total}</span>
  </div>
  <div class="progress-track"><div class="progress-fill" id="progressBar" style="width:${pct}%"></div></div>
</div>
<div class="toolbar">
  <button class="btn" onclick="markAll()">Mark all complete</button>
  <button class="btn" onclick="resetAll()">Reset all</button>
</div>
<div class="scroll-area">
  ${emptyState}
  ${sectionsHtml}
</div>
<script>
  const vscode = acquireVsCodeApi();

  function toggle(el) {
    const index = parseInt(el.dataset.index, 10);
    const li = el.closest('li');
    li.classList.toggle('done', el.checked);
    vscode.postMessage({ command: 'toggle', index, checked: el.checked });
  }

  function markAll() { vscode.postMessage({ command: 'markAll' }); }
  function resetAll() { vscode.postMessage({ command: 'resetAll' }); }

  window.addEventListener('message', event => {
    const msg = event.data;
    if (msg.command === 'progress') {
      document.getElementById('progressLabel').textContent = msg.done + ' / ' + msg.total;
      const pct = msg.total > 0 ? Math.round(msg.done / msg.total * 100) : 0;
      document.getElementById('progressBar').style.width = pct + '%';
    }
  });
</script>
</body>
</html>`;
        function escapeHtml(str) {
            return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        }
    }
}
exports.ChecklistPanel = ChecklistPanel;
ChecklistPanel.viewType = "aiNativeDevOps.checklistPanel";
ChecklistPanel.panels = new Map();
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
//# sourceMappingURL=checklistPanel.js.map