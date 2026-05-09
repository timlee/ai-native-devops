import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Phase } from "./phases";

/** Resolve the root of the ai-native-devops docs folder */
export function resolveRepoRoot(context: vscode.ExtensionContext): string {
  const configured = vscode.workspace
    .getConfiguration("aiNativeDevOps")
    .get<string>("repoRoot", "");
  if (configured && fs.existsSync(configured)) {
    return configured;
  }
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    return folders[0].uri.fsPath;
  }
  return context.extensionPath;
}

export function readPhaseFile(
  repoRoot: string,
  relativePath: string | undefined
): string | null {
  if (!relativePath || typeof relativePath !== "string") {
    return null;
  }
  const full = path.join(repoRoot, relativePath);
  if (!fs.existsSync(full)) {
    return null;
  }
  return fs.readFileSync(full, "utf8");
}

export function ensureTextFile(repoRoot: string, relativePath: string, content: string): string {
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
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Very lightweight markdown → HTML (headings, bold, code, lists, horizontal rules) */
function mdToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inCode = false;
  let inList = false;

  for (const raw of lines) {
    const line = raw;

    if (line.startsWith("```")) {
      if (inList) { out.push("</ul>"); inList = false; }
      if (inCode) {
        out.push("</code></pre>");
        inCode = false;
      } else {
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
      if (inList) { out.push("</ul>"); inList = false; }
      out.push("<hr/>");
      continue;
    }

    const hMatch = line.match(/^(#{1,4})\s+(.*)/);
    if (hMatch) {
      if (inList) { out.push("</ul>"); inList = false; }
      const level = hMatch[1].length;
      const text = inlineHtml(hMatch[2]);
      out.push(`<h${level}>${text}</h${level}>`);
      continue;
    }

    const listMatch = line.match(/^[-*]\s+(.*)/);
    if (listMatch) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${inlineHtml(listMatch[1])}</li>`);
      continue;
    }

    const numMatch = line.match(/^\d+\.\s+(.*)/);
    if (numMatch) {
      if (!inList) { out.push("<ol>"); inList = true; }
      out.push(`<li>${inlineHtml(numMatch[1])}</li>`);
      continue;
    }

    if (inList) { out.push("</ul>"); inList = false; }

    if (line.trim() === "") {
      out.push("<p></p>");
    } else {
      out.push(`<p>${inlineHtml(line)}</p>`);
    }
  }

  if (inList) out.push("</ul>");
  if (inCode) out.push("</code></pre>");

  return out.join("\n");
}

function inlineHtml(text: string): string {
  // Bold
  text = escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  return text;
}

export class PhasePanel {
  static readonly viewType = "aiNativeDevOps.phasePanel";
  private static panels = new Map<number, PhasePanel>();

  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  static show(
    phase: Phase,
    context: vscode.ExtensionContext,
    aiRunner: (
      phase: Phase,
      customPrompt: string | undefined,
      panel: PhasePanel
    ) => Promise<void>
  ): PhasePanel {
    const existing = PhasePanel.panels.get(phase.id);
    if (existing) {
      existing._panel.reveal();
      return existing;
    }

    const panel = vscode.window.createWebviewPanel(
      PhasePanel.viewType,
      `AI DevOps · ${phase.label}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    const instance = new PhasePanel(panel, phase, context, aiRunner);
    PhasePanel.panels.set(phase.id, instance);
    return instance;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private phase: Phase,
    private context: vscode.ExtensionContext,
    private aiRunner: (
      phase: Phase,
      customPrompt: string | undefined,
      panel: PhasePanel
    ) => Promise<void>
  ) {
    this._panel = panel;
    this._render();

    this._panel.onDidDispose(
      () => {
        PhasePanel.panels.delete(phase.id);
        this._disposables.forEach((d) => d.dispose());
      },
      null,
      this._disposables
    );

    this._panel.webview.onDidReceiveMessage(
      (msg) => this._handleMessage(msg),
      null,
      this._disposables
    );
  }

  private _handleMessage(msg: { command: string; text?: string }) {
    switch (msg.command) {
      case "runPrompt":
        this.aiRunner(this.phase, msg.text, this);
        break;
      case "openChecklist":
        vscode.commands.executeCommand(
          "aiNativeDevOps.openChecklist",
          this.phase
        );
        break;
      case "copyPrompt":
        vscode.env.clipboard.writeText(msg.text ?? "");
        vscode.window.showInformationMessage("Prompt copied to clipboard.");
        break;
    }
  }

  /** Append streamed AI response text to the panel */
  appendAiChunk(chunk: string) {
    this._panel.webview.postMessage({ command: "appendChunk", text: chunk });
  }

  /** Mark AI stream as done */
  aiDone() {
    this._panel.webview.postMessage({ command: "aiDone" });
  }

  /** Show an error in the AI output area */
  aiError(msg: string) {
    this._panel.webview.postMessage({ command: "aiError", text: msg });
  }

  private _render() {
    const repoRoot = resolveRepoRoot(this.context);
    const lifecycle = readPhaseFile(repoRoot, this.phase.lifecycleFile) ?? "_File not found._";
    const prompt = readPhaseFile(repoRoot, this.phase.promptFile) ?? "_File not found._";
    const agent = readPhaseFile(repoRoot, this.phase.agentFile) ?? "_File not found._";

    const lifecycleHtml = mdToHtml(lifecycle);
    const promptHtml = mdToHtml(prompt);
    const agentHtml = mdToHtml(agent);

    this._panel.webview.html = this._buildHtml(lifecycleHtml, promptHtml, agentHtml, prompt);
  }

  private _buildHtml(
    lifecycleHtml: string,
    promptHtml: string,
    agentHtml: string,
    rawPrompt: string
  ): string {
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
  .tabs { display: flex; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-editorGroupHeader-tabsBackground); padding: 0 8px; gap: 2px; }
  .tab { padding: 8px 16px; cursor: pointer; border: none; background: transparent; color: var(--vscode-tab-inactiveForeground); font-size: 13px; border-bottom: 2px solid transparent; }
  .tab.active { color: var(--vscode-tab-activeForeground); border-bottom-color: var(--vscode-focusBorder); }
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
  #aiOutput { margin-top: 16px; background: var(--vscode-textCodeBlock-background); border-radius: 4px; padding: 12px; min-height: 60px; white-space: pre-wrap; font-family: var(--vscode-editor-font-family); font-size: 0.9em; display: none; }
  #aiOutput.visible { display: block; }
  .spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid var(--vscode-progressBar-background); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .status-bar { font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 6px; height: 16px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
</style>
</head>
<body>
<div class="tabs">
  <button class="tab active" onclick="showTab('lifecycle')">📋 Lifecycle Guide</button>
  <button class="tab" onclick="showTab('prompt')">🤖 AI Prompt</button>
  <button class="tab" onclick="showTab('agent')">🧠 Agent Guide</button>
  <button class="tab" onclick="showTab('run')">▶ Run AI</button>
</div>

<div id="lifecycle" class="tab-content active">${lifecycleHtml}</div>
<div id="prompt" class="tab-content">
  ${promptHtml}
  <div class="btn-row">
    <button class="btn btn-secondary" onclick="copyDefaultPrompt()">📋 Copy Prompt</button>
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
    <button class="btn btn-secondary" onclick="openChecklist()">☑ Open Checklist</button>
  </div>
  <div class="status-bar" id="statusBar"></div>
  <div id="aiOutput"></div>
</div>

<script>
  const vscode = acquireVsCodeApi();
  const defaultPrompt = \`${escapedPrompt}\`;

  function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    const idx = ['lifecycle','prompt','agent','run'].indexOf(id);
    document.querySelectorAll('.tab')[idx].classList.add('active');
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
