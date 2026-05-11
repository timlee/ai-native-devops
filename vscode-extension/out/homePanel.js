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
exports.HomePanel = void 0;
const vscode = __importStar(require("vscode"));
const phases_1 = require("./phases");
const phasePanel_1 = require("./phasePanel");
class HomePanel {
    static show(context, onOpenPhase, onRunAi) {
        if (HomePanel._instance) {
            HomePanel._instance._panel.reveal();
            return HomePanel._instance;
        }
        const panel = vscode.window.createWebviewPanel(HomePanel.viewType, "AI DevOps · Lifecycle", vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
        HomePanel._instance = new HomePanel(panel, context, onOpenPhase, onRunAi);
        return HomePanel._instance;
    }
    constructor(panel, context, onOpenPhase, onRunAi) {
        this.context = context;
        this.onOpenPhase = onOpenPhase;
        this.onRunAi = onRunAi;
        this._disposables = [];
        this._panel = panel;
        this._render();
        this._panel.onDidDispose(() => {
            HomePanel._instance = undefined;
            this._disposables.forEach((d) => d.dispose());
        }, null, this._disposables);
        this._panel.webview.onDidReceiveMessage((msg) => {
            const phase = phases_1.PHASES.find((p) => p.id === msg.phaseId);
            if (!phase)
                return;
            if (msg.command === "openPhase")
                this.onOpenPhase(phase);
            else if (msg.command === "runAi")
                this.onRunAi(phase);
        }, null, this._disposables);
    }
    _render() {
        const repoRoot = (0, phasePanel_1.resolveRepoRoot)(this.context);
        const currentPhaseId = vscode.workspace
            .getConfiguration("aiNativeDevOps")
            .get("currentPhase", 0);
        const phaseContents = phases_1.PHASES.map((phase) => {
            const markdown = (0, phasePanel_1.readPhaseFile)(repoRoot, phase.lifecycleFile) ?? "_File not found._";
            return { phase, html: (0, phasePanel_1.mdToHtml)(markdown) };
        });
        this._panel.webview.html = this._buildHtml(phaseContents, currentPhaseId);
    }
    _buildHtml(phaseContents, initialPhaseId) {
        const initialPhase = phases_1.PHASES.find((p) => p.id === initialPhaseId) ?? phases_1.PHASES[0];
        const navItems = phaseContents
            .map(({ phase }) => `<button class="phase-item${phase.id === initialPhase.id ? " active" : ""}" ` +
            `data-phase-id="${phase.id}" onclick="showPhase(${phase.id})">` +
            `${(0, phasePanel_1.escapeHtml)(phase.label)}` +
            `</button>`)
            .join("");
        const contentPanels = phaseContents
            .map(({ phase, html }) => `<div id="phase-${phase.id}" class="phase-body${phase.id === initialPhase.id ? " active" : ""}">` +
            html +
            `</div>`)
            .join("");
        const labelsMap = JSON.stringify(Object.fromEntries(phases_1.PHASES.map((p) => [p.id, p.label])));
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';"/>
<title>AI DevOps · Lifecycle</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; overflow: hidden; }
  body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
    background: var(--vscode-editor-background);
    display: flex;
    flex-direction: column;
  }

  /* ── Layout ── */
  .layout { display: flex; flex: 1; min-height: 0; overflow: hidden; }

  /* ── Phase nav ── */
  .phase-nav {
    width: 160px;
    min-width: 140px;
    flex-shrink: 0;
    overflow-y: auto;
    border-right: 1px solid var(--vscode-panel-border);
    background: var(--vscode-sideBar-background);
    padding: 6px 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .phase-item {
    display: block;
    width: 100%;
    padding: 7px 10px 7px 12px;
    text-align: left;
    background: transparent;
    border: none;
    border-left: 2px solid transparent;
    color: var(--vscode-foreground);
    cursor: pointer;
    font-size: 12px;
    font-family: var(--vscode-font-family);
    line-height: 1.4;
  }
  .phase-item:hover { background: var(--vscode-list-hoverBackground); }
  .phase-item.active {
    background: var(--vscode-list-activeSelectionBackground);
    color: var(--vscode-list-activeSelectionForeground);
    border-left-color: var(--vscode-focusBorder);
    font-weight: 600;
  }
  .phase-item:focus-visible { outline: 1px solid var(--vscode-focusBorder); outline-offset: -1px; }

  /* ── Content area ── */
  .content-area { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }
  .content-header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px 9px;
    border-bottom: 1px solid var(--vscode-panel-border);
    background: var(--vscode-editorGroupHeader-tabsBackground);
    gap: 10px;
  }
  .content-header h2 { margin: 0; font-size: 1rem; font-weight: 600; }
  .btn-row { display: flex; gap: 6px; flex-shrink: 0; }
  .btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 3px; border: none;
    cursor: pointer; font-size: 11px; font-family: var(--vscode-font-family);
  }
  .btn:focus-visible { outline: 1px solid var(--vscode-focusBorder); outline-offset: 1px; }
  .btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
  .btn-primary:hover { background: var(--vscode-button-hoverBackground); }
  .btn-secondary {
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border: 1px solid var(--vscode-panel-border);
  }
  .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }

  /* ── Phase content ── */
  .phase-body { display: none; flex: 1; overflow-y: auto; padding: 16px 20px 24px; }
  .phase-body.active { display: block; }

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
</style>
</head>
<body>
<div class="layout">
  <nav class="phase-nav" role="navigation" aria-label="Lifecycle phases">
    ${navItems}
  </nav>
  <div class="content-area">
    <div class="content-header">
      <h2 id="phaseTitle">${(0, phasePanel_1.escapeHtml)(initialPhase.label)}</h2>
      <div class="btn-row">
        <button class="btn btn-secondary" onclick="openFullGuide()">Open Full Guide</button>
        <button class="btn btn-primary" onclick="runAi()">&#9654; Run AI</button>
      </div>
    </div>
    ${contentPanels}
  </div>
</div>
<script>
  const vscode = acquireVsCodeApi();
  let _activePhaseId = ${initialPhase.id};
  const phaseLabels = ${labelsMap};

  function showPhase(id) {
    document.querySelectorAll('.phase-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.phase-body').forEach(el => el.classList.remove('active'));
    const item = document.querySelector('.phase-item[data-phase-id="' + id + '"]');
    if (item) item.classList.add('active');
    const body = document.getElementById('phase-' + id);
    if (body) body.classList.add('active');
    document.getElementById('phaseTitle').textContent = phaseLabels[id] ?? '';
    _activePhaseId = id;
  }

  function openFullGuide() {
    vscode.postMessage({ command: 'openPhase', phaseId: _activePhaseId });
  }

  function runAi() {
    vscode.postMessage({ command: 'runAi', phaseId: _activePhaseId });
  }

  // Keyboard navigation in phase list
  document.querySelectorAll('.phase-item').forEach((btn, index, all) => {
    btn.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        const next = (index + delta + all.length) % all.length;
        all[next].focus();
        all[next].click();
      }
    });
  });
</script>
</body>
</html>`;
    }
}
exports.HomePanel = HomePanel;
HomePanel.viewType = "aiNativeDevOps.homePanel";
//# sourceMappingURL=homePanel.js.map