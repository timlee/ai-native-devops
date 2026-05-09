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
            const itemsHtml = items
                .map(({ text, index }) => `<li class="cl-item">
              <label>
                <input type="checkbox" data-index="${index}" onchange="toggle(this)"/>
                <span>${escapeHtml(text)}</span>
              </label>
            </li>`)
                .join("");
            sectionsHtml += `<div class="section"><h3>${escapeHtml(section)}</h3><ul>${itemsHtml}</ul></div>`;
        });
        const total = this._items.length;
        this._panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';"/>
<title>Checklist</title>
<style>
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 16px 20px; }
  h2 { margin-top: 0; font-size: 1.2em; }
  h3 { font-size: 0.95em; color: var(--vscode-symbolIcon-classForeground); margin: 14px 0 6px; }
  ul { list-style: none; padding: 0; margin: 0; }
  .cl-item { padding: 4px 0; }
  .cl-item label { display: flex; align-items: flex-start; gap: 8px; cursor: pointer; }
  .cl-item input[type=checkbox] { margin-top: 2px; flex-shrink: 0; }
  .cl-item span { line-height: 1.4; }
  .cl-item.done span { text-decoration: line-through; opacity: 0.55; }
  .progress-bar-wrap { background: var(--vscode-progressBar-background, #444); border-radius: 4px; height: 6px; margin: 8px 0 16px; }
  .progress-bar { background: var(--vscode-charts-green, #4ec9b0); height: 6px; border-radius: 4px; transition: width 0.3s; }
  .progress-label { font-size: 12px; color: var(--vscode-descriptionForeground); margin-bottom: 4px; }
  .section { margin-bottom: 16px; }
</style>
</head>
<body>
<h2>☑ ${escapeHtml(this.phase.label)} Checklist</h2>
<div class="progress-label" id="progressLabel">0 / ${total} complete</div>
<div class="progress-bar-wrap"><div class="progress-bar" id="progressBar" style="width:0%"></div></div>
${sectionsHtml}
<script>
  const vscode = acquireVsCodeApi();
  const total = ${total};

  function toggle(el) {
    const index = parseInt(el.dataset.index, 10);
    const li = el.closest('li');
    li.classList.toggle('done', el.checked);
    vscode.postMessage({ command: 'toggle', index, checked: el.checked });
  }

  window.addEventListener('message', event => {
    const msg = event.data;
    if (msg.command === 'progress') {
      document.getElementById('progressLabel').textContent = msg.done + ' / ' + msg.total + ' complete';
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