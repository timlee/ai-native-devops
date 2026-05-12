import * as cp from "child_process";
import * as vscode from "vscode";
import { Phase } from "./phases";
import { resolveRepoRoot } from "./phasePanel";
import { getGithubRepoInfo, getGithubToken, githubRequest } from "./githubUtils";

// ── Types ─────────────────────────────────────────────────────────────────────

type TestStep =
  | "unit-tests"
  | "integration-tests"
  | "e2e-tests"
  | "summary"
  | "complete";

type TestStatus = "pending" | "running" | "pass" | "fail";

interface TestResult {
  step: "unit" | "integration" | "e2e";
  status: TestStatus;
  output: string;
  coveragePct?: number;
  exitCode?: number;
}

interface TestWorkflowContext {
  results: {
    unit?: TestResult;
    integration?: TestResult;
    e2e?: TestResult;
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TEST_COMMANDS: Record<"unit" | "integration" | "e2e", string> = {
  unit:        "npm run test:unit -- --ci --forceExit",
  integration: "npm run test:integration -- --ci --forceExit",
  e2e:         "npm run test:e2e",
};

// ── Panel ─────────────────────────────────────────────────────────────────────

export class TestPanel {
  private static _current: TestPanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private _step: TestStep = "unit-tests";
  private _workflowCtx: TestWorkflowContext = { results: {} };
  private _repoRoot = "";
  private _repoInfo: { owner: string; repo: string } | null = null;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    private readonly _phase: Phase,
    private readonly _context: vscode.ExtensionContext
  ) {
    this._panel = vscode.window.createWebviewPanel(
      "testPanel",
      _phase.label,
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    this._repoRoot = resolveRepoRoot(this._context);
    this._repoInfo = getGithubRepoInfo(this._repoRoot);
    this._panel.webview.html = this._buildHtml();

    this._panel.webview.onDidReceiveMessage(
      (msg: { command: string } & Record<string, unknown>) => {
        switch (msg.command) {
          case "runUnit":
            this._handleRunTest("unit");
            break;
          case "runIntegration":
            this._handleRunTest("integration");
            break;
          case "runE2e":
            this._handleRunTest("e2e");
            break;
          case "goToSummary":
            this._handleGoToSummary();
            break;
          case "triggerWorkflow":
            this._handleTriggerWorkflow();
            break;
          case "openUrl":
            vscode.env.openExternal(vscode.Uri.parse((msg.url as string) ?? ""));
            break;
          case "goBack":
            this._handleGoBack((msg.fromStep as string) ?? "");
            break;
          case "restart":
            this._handleRestart();
            break;
        }
      },
      undefined,
      this._disposables
    );

    this._panel.onDidDispose(() => this._dispose(), undefined, this._disposables);
  }

  static show(phase: Phase, context: vscode.ExtensionContext): void {
    if (TestPanel._current) {
      TestPanel._current._panel.reveal(vscode.ViewColumn.One);
      return;
    }
    TestPanel._current = new TestPanel(phase, context);
  }

  // ── Step handlers ──────────────────────────────────────────────────────────

  private _handleRunTest(key: "unit" | "integration" | "e2e"): void {
    const cmd = TEST_COMMANDS[key];
    const result: TestResult = { step: key, status: "running", output: "" };
    this._workflowCtx.results[key] = result;

    if (key === "e2e" && process.platform !== "linux") {
      this._panel.webview.postMessage({
        command: "e2eWarning",
        platform: process.platform,
      });
    }

    this._panel.webview.postMessage({ command: "testStarted", step: key });

    const child = cp.spawn(cmd, [], { cwd: this._repoRoot, shell: true });

    const onData = (chunk: Buffer) => {
      const text = chunk.toString();
      result.output += text;

      if (key === "unit") {
        const m = text.match(/All files\s*\|\s*([\d.]+)/);
        if (m) { result.coveragePct = parseFloat(m[1]); }
      }

      this._panel.webview.postMessage({ command: "testOutput", step: key, text });
    };

    child.stdout.on("data", onData);
    child.stderr.on("data", onData);

    child.on("close", (code) => {
      result.exitCode = code ?? 1;
      result.status = result.exitCode === 0 ? "pass" : "fail";
      this._panel.webview.postMessage({
        command: "testDone",
        step: key,
        exitCode: result.exitCode,
        coveragePct: result.coveragePct,
      });
    });

    child.on("error", (err) => {
      result.status = "fail";
      this._panel.webview.postMessage({
        command: "testOutput",
        step: key,
        text: `Error: ${err.message}\n`,
      });
      this._panel.webview.postMessage({ command: "testDone", step: key, exitCode: 1 });
    });
  }

  private _handleGoToSummary(): void {
    this._step = "summary";
    const owner = this._repoInfo?.owner ?? "";
    const repo  = this._repoInfo?.repo  ?? "";
    const actionsUrl = owner && repo
      ? `https://github.com/${owner}/${repo}/actions/workflows/ci.yml`
      : "";

    this._panel.webview.postMessage({
      command: "showSummary",
      results: {
        unit:        this._workflowCtx.results.unit,
        integration: this._workflowCtx.results.integration,
        e2e:         this._workflowCtx.results.e2e,
      },
      actionsUrl,
      hasRepoInfo: !!(owner && repo),
    });
  }

  private async _handleTriggerWorkflow(): Promise<void> {
    try {
      const token = await getGithubToken();
      const owner = this._repoInfo?.owner ?? "";
      const repo  = this._repoInfo?.repo  ?? "";

      if (!owner || !repo) {
        this._panel.webview.postMessage({
          command: "triggerResult",
          success: false,
          message: "Cannot detect GitHub repository. Set aiNativeDevOps.githubOwner and githubRepo in settings.",
        });
        return;
      }

      type DispatchResponse = Record<string, unknown>;
      const result = await githubRequest<DispatchResponse>(
        "POST",
        `/repos/${owner}/${repo}/actions/workflows/ci.yml/dispatches`,
        token,
        { ref: "main" }
      );

      const success = result.status === 204 || result.status === 201 || result.status === 200;
      this._panel.webview.postMessage({
        command: "triggerResult",
        success,
        message: success
          ? "CI workflow triggered on branch main. View progress in GitHub Actions."
          : result.status === 422
            ? "Cannot trigger: push to main or open a PR to run CI (workflow_dispatch is not enabled on this workflow)."
            : `GitHub API returned HTTP ${result.status}.`,
      });
    } catch (err) {
      this._panel.webview.postMessage({
        command: "triggerResult",
        success: false,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private _handleGoBack(fromStep: string): void {
    const prev: Record<string, TestStep> = {
      "integration-tests": "unit-tests",
      "e2e-tests":         "integration-tests",
      "summary":           "e2e-tests",
    };
    this._step = prev[fromStep] ?? "unit-tests";
  }

  private _handleRestart(): void {
    this._workflowCtx = { results: {} };
    this._step = "unit-tests";
    this._panel.webview.postMessage({ command: "restart" });
  }

  private _dispose(): void {
    TestPanel._current = undefined;
    for (const d of this._disposables) { d.dispose(); }
    this._disposables = [];
  }

  // ── HTML ───────────────────────────────────────────────────────────────────

  private _buildHtml(): string {
    return /* html */`<!DOCTYPE html>
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
    max-width: 860px;
  }
  h1 { font-size: 1.4em; margin-bottom: 4px; }
  .subtitle { color: var(--vscode-descriptionForeground); margin-bottom: 20px; font-size: 0.9em; }
  h2 { font-size: 1.05em; margin-bottom: 10px; }
  .field { margin-bottom: 14px; }
  label { display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9em; }
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
  button.secondary {
    padding: 8px 16px;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border: none; border-radius: 3px; cursor: pointer;
    font-size: 0.95em; margin-top: 4px;
  }
  button.secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
  button.secondary:disabled { opacity: 0.5; cursor: default; }
  .button-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .divider { border: none; border-top: 1px solid var(--vscode-panel-border, #444); margin: 20px 0; }
  .step-indicator {
    display: flex; align-items: center;
    padding: 14px 0 20px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--vscode-panel-border, #444);
    overflow-x: auto;
  }
  .step-dot {
    display: flex; flex-direction: column; align-items: center;
    opacity: 0.35; min-width: 66px; transition: opacity 0.2s;
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
  .step-dot.active .step-num { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
  .step-dot.done .step-num { background: #4caf50; color: #fff; }
  .step-lbl { font-size: 0.68em; color: var(--vscode-descriptionForeground); text-align: center; }
  .step-connector { flex: 1; height: 1px; background: var(--vscode-panel-border, #444); margin: 0 2px 26px; min-width: 10px; }
  .output-pre {
    white-space: pre-wrap; word-break: break-word;
    background: var(--vscode-textBlockQuote-background, #1e1e1e);
    border-left: 3px solid var(--vscode-textBlockQuote-border, #555);
    padding: 12px; max-height: 300px; overflow-y: auto;
    font-size: 0.85em; margin-bottom: 14px;
    font-family: var(--vscode-editor-font-family, monospace);
  }
  .cmd-card {
    border: 1px solid var(--vscode-panel-border, #444);
    border-radius: 4px; padding: 10px 12px; margin-bottom: 8px;
  }
  .cmd-header { display: flex; align-items: center; gap: 8px; }
  .cmd-text {
    flex: 1; font-family: var(--vscode-editor-font-family, monospace);
    font-size: 0.88em; background: var(--vscode-textBlockQuote-background);
    padding: 2px 6px; border-radius: 2px; word-break: break-all;
  }
  .cmd-status-badge {
    font-size: 0.75em; padding: 2px 8px; border-radius: 10px; font-weight: 700; white-space: nowrap;
  }
  .badge-pending  { background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
  .badge-running  { background: #1976d2; color: #fff; }
  .badge-pass     { background: #4caf50; color: #fff; }
  .badge-fail     { background: var(--vscode-errorForeground, #f44336); color: #fff; }
  .cmd-output-area {
    display: none; margin-top: 8px; max-height: 220px; overflow-y: auto;
    white-space: pre-wrap; word-break: break-word;
    background: var(--vscode-textBlockQuote-background); padding: 8px;
    font-size: 0.82em; font-family: var(--vscode-editor-font-family, monospace);
  }
  .info-block {
    background: var(--vscode-textBlockQuote-background);
    border-left: 3px solid var(--vscode-textBlockQuote-border, #555);
    padding: 8px 12px; margin-bottom: 12px; font-size: 0.88em;
    color: var(--vscode-descriptionForeground);
  }
  .warn-block {
    background: var(--vscode-textBlockQuote-background);
    border-left: 3px solid #ff9800; padding: 8px 12px; margin-bottom: 12px;
    font-size: 0.85em;
  }
  .warn-block strong { color: #ff9800; }
  .coverage-row {
    display: none; margin-top: 6px; padding: 5px 10px;
    background: var(--vscode-textBlockQuote-background);
    border-radius: 3px; font-size: 0.88em;
  }
  .summary-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 12px; margin-bottom: 20px;
  }
  .summary-card {
    border: 1px solid var(--vscode-panel-border, #444);
    border-radius: 6px; padding: 14px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .summary-card-title { font-weight: 600; font-size: 0.9em; color: var(--vscode-descriptionForeground); }
  .summary-card-badge { font-size: 1.1em; font-weight: 700; }
  .summary-card-detail { font-size: 0.82em; color: var(--vscode-descriptionForeground); }
  section { display: none; }
  section.active { display: block; }
</style>
</head>
<body>
<h1>${this._phase.label}</h1>
<p class="subtitle">Run unit, integration, and end-to-end tests locally, then view GitHub Actions CI status.</p>

<!-- Step indicator -->
<div class="step-indicator">
  <div class="step-dot active" id="step-dot-1">
    <div class="step-num" id="step-num-1">1</div>
    <div class="step-lbl">Unit</div>
  </div>
  <div class="step-connector"></div>
  <div class="step-dot" id="step-dot-2">
    <div class="step-num" id="step-num-2">2</div>
    <div class="step-lbl">Integration</div>
  </div>
  <div class="step-connector"></div>
  <div class="step-dot" id="step-dot-3">
    <div class="step-num" id="step-num-3">3</div>
    <div class="step-lbl">E2E</div>
  </div>
  <div class="step-connector"></div>
  <div class="step-dot" id="step-dot-4">
    <div class="step-num" id="step-num-4">4</div>
    <div class="step-lbl">Summary</div>
  </div>
</div>

<!-- ─── Section 1: Unit Tests ──────────────────────────────────────────── -->
<section id="sectionStep1" class="active">
  <h2>Step 1 — Unit Tests</h2>
  <p class="info-block">
    Tests in <code>test/unit/</code> using Jest with VSCode and SDK mocks.<br>
    GitHub Actions job: <strong>unit-tests</strong> in <code>ci.yml</code>
  </p>
  <div class="cmd-card">
    <div class="cmd-header">
      <span class="cmd-text">npm run test:unit -- --ci --forceExit</span>
      <span class="cmd-status-badge badge-pending" id="unit-badge">pending</span>
      <button class="secondary" id="unit-run-btn"
        onclick="vscode.postMessage({ command:'runUnit' }); this.disabled=true;">Run</button>
    </div>
    <div class="cmd-output-area" id="unit-output"></div>
  </div>
  <div class="coverage-row" id="unit-coverage-row">
    Line coverage: <strong id="unit-coverage-pct">—</strong>
  </div>
  <p class="error-msg" id="unit-error"></p>
  <div class="button-row">
    <button class="primary" id="unit-next-btn" disabled
      onclick="vscode.postMessage({ command:'runIntegration' }); markDone(1); markActive(2); showSection(2); document.getElementById('integration-run-btn').disabled=false;">
      Next: Integration Tests
    </button>
  </div>
</section>

<!-- ─── Section 2: Integration Tests ──────────────────────────────────── -->
<section id="sectionStep2">
  <h2>Step 2 — Integration Tests</h2>
  <p class="info-block">
    Tests in <code>test/integration/</code> — multi-component flows with real module interactions.<br>
    GitHub Actions job: <strong>integration-tests</strong> in <code>ci.yml</code>
  </p>
  <div class="cmd-card">
    <div class="cmd-header">
      <span class="cmd-text">npm run test:integration -- --ci --forceExit</span>
      <span class="cmd-status-badge badge-pending" id="integration-badge">pending</span>
      <button class="secondary" id="integration-run-btn" disabled
        onclick="vscode.postMessage({ command:'runIntegration' }); this.disabled=true;">Run</button>
    </div>
    <div class="cmd-output-area" id="integration-output"></div>
  </div>
  <p class="error-msg" id="integration-error"></p>
  <div class="button-row">
    <button class="primary" id="integration-next-btn" disabled
      onclick="markDone(2); markActive(3); showSection(3);">
      Next: E2E Tests
    </button>
    <button class="secondary" onclick="goBack('integration-tests')">Back</button>
  </div>
</section>

<!-- ─── Section 3: E2E Tests ───────────────────────────────────────────── -->
<section id="sectionStep3">
  <h2>Step 3 — End-to-End Tests</h2>
  <div id="e2eWarning" class="warn-block" style="display:none">
    <strong>Platform Warning</strong>
    <p id="e2eWarningText" style="margin-top:5px"></p>
  </div>
  <p class="info-block">
    Tests in <code>test/e2e/</code> using <code>@vscode/test-cli</code> (Mocha) inside a VS Code Extension Host.<br>
    GitHub Actions job: <strong>e2e-tests</strong> in <code>ci.yml</code> — uses Xvfb on Linux for headless display.<br>
    You may skip the local run and proceed directly to Summary.
  </p>
  <div class="cmd-card">
    <div class="cmd-header">
      <span class="cmd-text">npm run test:e2e</span>
      <span class="cmd-status-badge badge-pending" id="e2e-badge">pending</span>
      <button class="secondary" id="e2e-run-btn"
        onclick="vscode.postMessage({ command:'runE2e' }); this.disabled=true;">Run</button>
    </div>
    <div class="cmd-output-area" id="e2e-output"></div>
  </div>
  <p class="error-msg" id="e2e-error"></p>
  <div class="button-row">
    <button class="primary"
      onclick="vscode.postMessage({ command:'goToSummary' });">
      View Summary
    </button>
    <button class="secondary" onclick="goBack('e2e-tests')">Back</button>
  </div>
</section>

<!-- ─── Section 4: Summary ─────────────────────────────────────────────── -->
<section id="sectionStep4">
  <h2>Step 4 — Test Summary</h2>
  <div id="summaryGrid" class="summary-grid"></div>

  <hr class="divider">
  <h2>GitHub Actions CI</h2>

  <div id="actionsBlock" class="info-block" style="display:none">
    <p>The CI workflow in <code>.github/workflows/ci.yml</code> runs all 3 test jobs automatically on every pull request and push to main.</p>
    <div class="button-row" style="margin-top:10px">
      <button class="secondary" id="openActionsBtn"
        onclick="openUrl(document.getElementById('openActionsBtn').dataset.url)">
        Open CI Workflow on GitHub
      </button>
      <button class="secondary" id="triggerWorkflowBtn"
        onclick="vscode.postMessage({ command:'triggerWorkflow' }); this.disabled=true; this.textContent='Triggering…'">
        Trigger CI Now
      </button>
    </div>
    <p id="triggerResultMsg" style="display:none; margin-top:8px; font-size:0.85em;"></p>
  </div>

  <div id="noRepoBlock" class="warn-block" style="display:none">
    <strong>GitHub repository not detected.</strong>
    <p style="margin-top:5px">
      Set <code>aiNativeDevOps.githubOwner</code> and <code>aiNativeDevOps.githubRepo</code>
      in VS Code settings, or push to a GitHub remote, to enable CI links.
    </p>
    <p style="margin-top:5px">
      CI workflow file: <code>.github/workflows/ci.yml</code><br>
      Jobs: <code>unit-tests</code> → <code>integration-tests</code> → <code>e2e-tests</code> → <code>coverage-report</code>
    </p>
  </div>

  <div class="button-row" style="margin-top:20px">
    <button class="secondary" onclick="vscode.postMessage({ command:'restart' })">Run Again</button>
    <button class="secondary" onclick="goBack('summary')">Back</button>
  </div>
</section>

<script>
const vscode = acquireVsCodeApi();

// ── Utilities ─────────────────────────────────────────────────────────────────
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function showSection(n) {
  for (let i = 1; i <= 4; i++) {
    document.getElementById('sectionStep' + i).classList.toggle('active', i === n);
  }
}
function markDone(n) {
  const dot = document.getElementById('step-dot-' + n);
  const num = document.getElementById('step-num-' + n);
  if (!dot || !num) return;
  dot.classList.remove('active'); dot.classList.add('done');
  num.textContent = '✓';
}
function markActive(n) {
  for (let i = 1; i <= 4; i++) {
    const d = document.getElementById('step-dot-' + i);
    if (!d) continue;
    d.classList.toggle('active', i === n);
  }
}
function unmarkDone(n) {
  const dot = document.getElementById('step-dot-' + n);
  const num = document.getElementById('step-num-' + n);
  if (!dot || !num) return;
  dot.classList.remove('done');
  num.textContent = String(n);
}
function setBadge(s, status) {
  const el = document.getElementById(s + '-badge');
  if (!el) return;
  el.className = 'cmd-status-badge badge-' + status;
  el.textContent = status;
}
function appendOutput(s, text) {
  const el = document.getElementById(s + '-output');
  if (!el) return;
  el.textContent += text;
  el.scrollTop = el.scrollHeight;
}
function goBack(fromStep) {
  vscode.postMessage({ command: 'goBack', fromStep });
  const map = { 'integration-tests': 1, 'e2e-tests': 2, 'summary': 3 };
  const target = map[fromStep] || 1;
  for (let i = target + 1; i <= 4; i++) { unmarkDone(i); }
  markActive(target);
  showSection(target);
}
function openUrl(url) { vscode.postMessage({ command: 'openUrl', url }); }

// ── Message handler ───────────────────────────────────────────────────────────
window.addEventListener('message', (ev) => {
  const msg = ev.data;
  switch (msg.command) {

    case 'testStarted': {
      const s = msg.step;
      setBadge(s, 'running');
      const out = document.getElementById(s + '-output');
      if (out) { out.textContent = ''; out.style.display = 'block'; }
      break;
    }

    case 'testOutput': {
      appendOutput(msg.step, msg.text);
      break;
    }

    case 'testDone': {
      const s = msg.step;
      setBadge(s, msg.exitCode === 0 ? 'pass' : 'fail');
      const runBtn = document.getElementById(s + '-run-btn');
      if (runBtn) { runBtn.disabled = false; runBtn.textContent = 'Re-run'; }

      if (s === 'unit') {
        if (msg.coveragePct !== undefined) {
          const row = document.getElementById('unit-coverage-row');
          if (row) row.style.display = 'block';
          const pct = document.getElementById('unit-coverage-pct');
          if (pct) pct.textContent = msg.coveragePct.toFixed(1) + '%' +
            (msg.coveragePct >= 80 ? ' ✅' : ' ❌ (below 80% gate)');
        }
        const nextBtn = document.getElementById('unit-next-btn');
        if (nextBtn) nextBtn.disabled = false;
      }

      if (s === 'integration') {
        const nextBtn = document.getElementById('integration-next-btn');
        if (nextBtn) nextBtn.disabled = false;
      }
      break;
    }

    case 'e2eWarning': {
      const w = document.getElementById('e2eWarning');
      if (w) w.style.display = 'block';
      const t = document.getElementById('e2eWarningText');
      if (t) t.textContent =
        'E2E tests require a VS Code Extension Host and Xvfb (Linux). ' +
        'Current platform: ' + msg.platform + '. ' +
        'The run may fail without a display. Use GitHub Actions CI for reliable E2E results.';
      break;
    }

    case 'showSummary': {
      markDone(3); markActive(4); showSection(4);

      const steps = [
        { key: 'unit',        label: 'Unit Tests' },
        { key: 'integration', label: 'Integration Tests' },
        { key: 'e2e',         label: 'E2E Tests' },
      ];
      const grid = document.getElementById('summaryGrid');
      if (grid) {
        grid.innerHTML = steps.map(s => {
          const r = msg.results && msg.results[s.key];
          const status  = r ? r.status : 'pending';
          const emoji   = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '—';
          const detail  = (s.key === 'unit' && r && r.coveragePct !== undefined)
            ? 'Coverage: ' + r.coveragePct.toFixed(1) + '%'
            : '';
          return '<div class="summary-card">' +
            '<div class="summary-card-title">' + escHtml(s.label) + '</div>' +
            '<div class="summary-card-badge">' + emoji + ' ' + escHtml(status) + '</div>' +
            (detail ? '<div class="summary-card-detail">' + escHtml(detail) + '</div>' : '') +
            '</div>';
        }).join('');
      }

      if (msg.hasRepoInfo && msg.actionsUrl) {
        const ab = document.getElementById('actionsBlock');
        if (ab) ab.style.display = 'block';
        const btn = document.getElementById('openActionsBtn');
        if (btn) btn.dataset.url = msg.actionsUrl;
        const nb = document.getElementById('noRepoBlock');
        if (nb) nb.style.display = 'none';
      } else {
        const ab = document.getElementById('actionsBlock');
        if (ab) ab.style.display = 'none';
        const nb = document.getElementById('noRepoBlock');
        if (nb) nb.style.display = 'block';
      }
      break;
    }

    case 'triggerResult': {
      const el = document.getElementById('triggerResultMsg');
      if (el) {
        el.style.display = 'block';
        el.style.color = msg.success
          ? '#4caf50'
          : 'var(--vscode-errorForeground)';
        el.textContent = msg.message;
      }
      const btn = document.getElementById('triggerWorkflowBtn');
      if (btn) { btn.disabled = false; btn.textContent = 'Trigger CI Now'; }
      break;
    }

    case 'restart': {
      for (let i = 1; i <= 4; i++) { unmarkDone(i); }
      markActive(1); showSection(1);

      ['unit', 'integration', 'e2e'].forEach(s => {
        setBadge(s, 'pending');
        const out = document.getElementById(s + '-output');
        if (out) { out.textContent = ''; out.style.display = 'none'; }
        const runBtn = document.getElementById(s + '-run-btn');
        if (runBtn) { runBtn.disabled = false; runBtn.textContent = 'Run'; }
      });

      const cr = document.getElementById('unit-coverage-row');
      if (cr) cr.style.display = 'none';
      const un = document.getElementById('unit-next-btn');
      if (un) un.disabled = true;
      const inn = document.getElementById('integration-next-btn');
      if (inn) inn.disabled = true;
      const irun = document.getElementById('integration-run-btn');
      if (irun) irun.disabled = true;

      const trm = document.getElementById('triggerResultMsg');
      if (trm) trm.style.display = 'none';
      const tw = document.getElementById('triggerWorkflowBtn');
      if (tw) { tw.disabled = false; tw.textContent = 'Trigger CI Now'; }
      break;
    }
  }
});
</script>
</body>
</html>`;
  }
}
