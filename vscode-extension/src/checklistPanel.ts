import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Phase } from "./phases";
import { resolveRepoRoot } from "./phasePanel";

interface ChecklistItem {
  text: string;
  checked: boolean;
  section: string;
}

export class ChecklistPanel {
  static readonly viewType = "aiNativeDevOps.checklistPanel";
  private static panels = new Map<number, ChecklistPanel>();

  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _items: ChecklistItem[] = [];

  static show(phase: Phase, context: vscode.ExtensionContext): ChecklistPanel {
    const existing = ChecklistPanel.panels.get(phase.id);
    if (existing) {
      existing._panel.reveal();
      return existing;
    }

    const panel = vscode.window.createWebviewPanel(
      ChecklistPanel.viewType,
      `Checklist · ${phase.label}`,
      vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    const instance = new ChecklistPanel(panel, phase, context);
    ChecklistPanel.panels.set(phase.id, instance);
    return instance;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private phase: Phase,
    private context: vscode.ExtensionContext
  ) {
    this._panel = panel;
    this._items = this._parseChecklist();
    this._render();

    this._panel.onDidDispose(
      () => {
        ChecklistPanel.panels.delete(phase.id);
        this._disposables.forEach((d) => d.dispose());
      },
      null,
      this._disposables
    );

    this._panel.webview.onDidReceiveMessage(
      (msg: { command: string; index: number; checked: boolean }) => {
        if (msg.command === "toggle" && msg.index !== undefined) {
          this._items[msg.index].checked = msg.checked;
          this._updateProgress();
        } else if (msg.command === "markAll") {
          this._items.forEach((item) => {
            item.checked = true;
          });
          this._render();
        } else if (msg.command === "resetAll") {
          this._items.forEach((item) => {
            item.checked = false;
          });
          this._render();
        }
      },
      null,
      this._disposables
    );
  }

  private _parseChecklist(): ChecklistItem[] {
    const repoRoot = resolveRepoRoot(this.context);
    const filePath = path.join(repoRoot, this.phase.checklistFile);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const content = fs.readFileSync(filePath, "utf8");
    const items: ChecklistItem[] = [];
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

  private _updateProgress() {
    const done = this._items.filter((i) => i.checked).length;
    const total = this._items.length;
    this._panel.webview.postMessage({ command: "progress", done, total });
  }

  private _render() {
    const sections = new Map<string, { text: string; index: number }[]>();
    this._items.forEach((item, idx) => {
      if (!sections.has(item.section)) sections.set(item.section, []);
      sections.get(item.section)!.push({ text: item.text, index: idx });
    });

    let sectionsHtml = "";
    sections.forEach((items, section) => {
      const done = items.filter(({ index }) => this._items[index].checked).length;
      const itemsHtml = items
        .map(
          ({ text, index }) =>
            `<li class="cl-item">
              <label>
                <input type="checkbox" data-index="${index}" onchange="toggle(this)" ${this._items[index].checked ? "checked" : ""}/>
                <span>${escapeHtml(text)}</span>
              </label>
            </li>`
        )
        .join("");
      sectionsHtml += `<div class="section"><h3>${escapeHtml(section)} <span class="section-progress">${done}/${items.length}</span></h3><ul>${itemsHtml}</ul></div>`;
    });

    const total = this._items.length;
    const done = this._items.filter((i) => i.checked).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

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
  .toolbar { display: flex; gap: 8px; margin: 10px 0 14px; }
  .btn { border: 1px solid var(--vscode-panel-border); background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border-radius: 4px; padding: 4px 10px; cursor: pointer; }
  .btn:hover { background: var(--vscode-button-secondaryHoverBackground); }
  .section-progress { font-size: 11px; color: var(--vscode-descriptionForeground); font-weight: normal; }
</style>
</head>
<body>
<h2>${escapeHtml(this.phase.label)} Checklist</h2>
<div class="progress-label" id="progressLabel">${done} / ${total} complete</div>
<div class="progress-bar-wrap"><div class="progress-bar" id="progressBar" style="width:${pct}%"></div></div>
<div class="toolbar">
  <button class="btn" onclick="markAll()">Mark all complete</button>
  <button class="btn" onclick="resetAll()">Reset</button>
</div>
${sectionsHtml}
<script>
  const vscode = acquireVsCodeApi();

  function toggle(el) {
    const index = parseInt(el.dataset.index, 10);
    const li = el.closest('li');
    li.classList.toggle('done', el.checked);
    vscode.postMessage({ command: 'toggle', index, checked: el.checked });
  }

  function markAll() {
    vscode.postMessage({ command: 'markAll' });
  }

  function resetAll() {
    vscode.postMessage({ command: 'resetAll' });
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

    function escapeHtml(str: string): string {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
