import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Phase } from "./phases";
import { AiOutputSink, AiRunner } from "./aiRunner";
import { resolveRepoRoot } from "./phasePanel";
import { getGithubRepoInfo, getGithubToken, githubRequest } from "./githubUtils";

// ── Types ─────────────────────────────────────────────────────────────────────

type BuildWorkflowStep =
  | "detect-project"
  | "generate-pipeline"
  | "review-pipeline"
  | "run-local-validation"
  | "commit-pipeline"
  | "complete";

type ProjectType = "nodejs" | "python" | "go" | "java" | "unknown";
type NotificationChannel = "slack" | "email" | "none";
type ArtifactRegistry = "github-packages" | "npm" | "docker-hub" | "custom";

interface ProjectDetection {
  type: ProjectType;
  packageManager: string;
  testCommand: string;
  buildCommand: string;
  lintCommand: string;
  detectedFiles: string[];
}

interface BuildUserConfig {
  notificationChannel: NotificationChannel;
  slackWebhookSecret: string;
  emailRecipient: string;
  artifactRegistry: ArtifactRegistry;
  customRegistryUrl: string;
  triggerBranches: string[];
}

interface ValidationResult {
  index: number;
  status: "pending" | "running" | "pass" | "fail";
  output: string;
}

interface BuildWorkflowContext {
  detection?: ProjectDetection;
  userConfig?: BuildUserConfig;
  generatedYaml?: string;
  editedYaml?: string;
  validationResults: ValidationResult[];
  prUrl?: string;
  prNumber?: number;
  commitBranch?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectProject(repoRoot: string): ProjectDetection {
  const probe = (f: string) => fs.existsSync(path.join(repoRoot, f));
  const detected: string[] = [];

  if (probe("package.json")) { detected.push("package.json"); }
  if (probe("requirements.txt")) { detected.push("requirements.txt"); }
  if (probe("pyproject.toml")) { detected.push("pyproject.toml"); }
  if (probe("go.mod")) { detected.push("go.mod"); }
  if (probe("pom.xml")) { detected.push("pom.xml"); }
  if (probe("build.gradle") || probe("build.gradle.kts")) { detected.push("build.gradle"); }
  if (probe("Cargo.toml")) { detected.push("Cargo.toml"); }

  if (probe("package.json")) {
    return {
      type: "nodejs", packageManager: "npm",
      testCommand: "npm test", buildCommand: "npm run build", lintCommand: "npm run lint",
      detectedFiles: detected,
    };
  }
  if (probe("go.mod")) {
    return {
      type: "go", packageManager: "go",
      testCommand: "go test ./...", buildCommand: "go build ./...", lintCommand: "golangci-lint run",
      detectedFiles: detected,
    };
  }
  if (probe("pyproject.toml")) {
    return {
      type: "python", packageManager: "poetry",
      testCommand: "poetry run pytest --cov", buildCommand: "poetry build", lintCommand: "poetry run flake8 .",
      detectedFiles: detected,
    };
  }
  if (probe("requirements.txt")) {
    return {
      type: "python", packageManager: "pip",
      testCommand: "pytest --cov", buildCommand: "python -m build", lintCommand: "flake8 .",
      detectedFiles: detected,
    };
  }
  if (probe("pom.xml")) {
    return {
      type: "java", packageManager: "maven",
      testCommand: "mvn test", buildCommand: "mvn package", lintCommand: "mvn checkstyle:check",
      detectedFiles: detected,
    };
  }
  if (probe("build.gradle") || probe("build.gradle.kts")) {
    return {
      type: "java", packageManager: "gradle",
      testCommand: "./gradlew test", buildCommand: "./gradlew build", lintCommand: "./gradlew checkstyleMain",
      detectedFiles: detected,
    };
  }
  return {
    type: "unknown", packageManager: "", testCommand: "", buildCommand: "", lintCommand: "",
    detectedFiles: detected,
  };
}

function deriveValidationCommands(detection: ProjectDetection): string[] {
  switch (detection.type) {
    case "nodejs":
      return ["npm install", "npm run lint", "npm test", "npm run build"];
    case "python":
      return detection.packageManager === "poetry"
        ? ["poetry install", "poetry run flake8 .", "poetry run pytest --cov", "poetry build"]
        : ["pip install -r requirements.txt", "flake8 .", "pytest --cov", "python -m build"];
    case "go":
      return ["go mod download", "golangci-lint run", "go test ./...", "go build ./..."];
    case "java":
      return detection.packageManager === "gradle"
        ? ["./gradlew dependencies", "./gradlew checkstyleMain", "./gradlew test", "./gradlew build"]
        : ["mvn dependency:resolve", "mvn checkstyle:check", "mvn test", "mvn package"];
    default:
      return [];
  }
}

function buildBuildPrompt(detection: ProjectDetection, cfg: BuildUserConfig): string {
  const branches = cfg.triggerBranches.join(", ");
  const notifSection = cfg.notificationChannel === "slack"
    ? `- Notification: Slack (secret name: ${cfg.slackWebhookSecret || "SLACK_WEBHOOK_URL"})`
    : cfg.notificationChannel === "email"
      ? `- Notification: Email (recipient: ${cfg.emailRecipient})`
      : `- Notification: none`;
  const registrySection = cfg.artifactRegistry === "custom"
    ? `- Artifact Registry: custom (${cfg.customRegistryUrl})`
    : `- Artifact Registry: ${cfg.artifactRegistry}`;

  const sastStep = detection.type === "go"
    ? `10. SAST: install gosec (go install github.com/securego/gosec/v2/cmd/gosec@latest) then run gosec ./...`
    : detection.type === "python"
      ? `10. SAST: pip install bandit then run bandit -r . -ll`
      : `10. SAST: use github/codeql-action/init@v3 (language: javascript-typescript) followed by github/codeql-action/analyze@v3`;

  const coverageStep = detection.type === "nodejs"
    ? `9. Coverage gate (shell): read coverage/coverage-summary.json, fail if lines.pct < 80`
    : detection.type === "go"
      ? `9. Coverage gate (shell): parse go test -coverprofile output, fail if total coverage < 80%`
      : `9. Coverage gate (shell): parse coverage output, fail if coverage < 80%`;

  const artifactPath = detection.type === "nodejs" ? "dist/"
    : detection.type === "python" ? "dist/"
      : detection.type === "go" ? "bin/"
        : "target/";

  const notifAction = cfg.notificationChannel === "slack"
    ? `11. Failure notification: slackapi/slack-github-action@v2, send message on job failure using secret $\{{ secrets.${cfg.slackWebhookSecret || "SLACK_WEBHOOK_URL"} }}`
    : cfg.notificationChannel === "email"
      ? `11. Failure notification: dawidd6/action-send-mail@v3, send to ${cfg.emailRecipient} on job failure`
      : `11. (No failure notification configured)`;

  return [
    "You are the BUILD phase AI agent in an AI-native DevOps workflow.",
    "",
    "## Project Context",
    `- Project Type: ${detection.type}`,
    `- Package Manager: ${detection.packageManager || "unknown"}`,
    `- Detected Files: ${detection.detectedFiles.join(", ") || "none"}`,
    `- Test Command: ${detection.testCommand || "N/A"}`,
    `- Build Command: ${detection.buildCommand || "N/A"}`,
    `- Lint Command: ${detection.lintCommand || "N/A"}`,
    "",
    "## Pipeline Configuration",
    `- Trigger Branches: ${branches}`,
    notifSection,
    registrySection,
    "",
    "## Requirements",
    `Generate a complete, production-ready GitHub Actions workflow file.`,
    ``,
    `The workflow MUST include ALL of the following job steps in this exact order:`,
    `1. actions/checkout@v4`,
    `2. Set up language runtime (setup-node@v4 / setup-python@v5 / setup-go@v5 as appropriate)`,
    `3. Cache dependencies (actions/cache@v4 with appropriate cache key)`,
    `4. Install dependencies (${detection.packageManager ? detection.packageManager + " install" : "install dependencies"})`,
    `5. Lint: ${detection.lintCommand || "(skip if unknown)"}`,
    `6. Build: ${detection.buildCommand || "(skip if unknown)"}`,
    `7. Test with coverage: ${detection.testCommand || "(skip if unknown)"}`,
    `8. Upload test results (if supported by project type)`,
    coverageStep,
    sastStep,
    `11. Upload build artifact: actions/upload-artifact@v4, name: build-artifact-\${{ github.sha }}, path: ${artifactPath}`,
    notifAction,
    "",
    "## Constraints",
    `- job timeout-minutes: 10`,
    `- triggers: push and pull_request targeting branches: ${branches}`,
    `- List all required GitHub secrets as comments at the TOP of the file`,
    `- The coverage gate step must use shell arithmetic and exit 1 if below 80%`,
    `- The SAST stage must be non-skippable (no if: conditions that could skip it)`,
    `- Use ubuntu-latest for runs-on`,
    "",
    "## Output Format",
    "Output ONLY valid YAML. Do not include any explanation before or after the YAML.",
    "Do not wrap in markdown code fences.",
    "Start directly with:",
    "name: CI Pipeline",
  ].join("\n");
}

function computeRequiredSecrets(cfg: BuildUserConfig): string[] {
  const secrets: string[] = [];
  if (cfg.notificationChannel === "slack") {
    secrets.push(cfg.slackWebhookSecret || "SLACK_WEBHOOK_URL");
  }
  if (cfg.notificationChannel === "email") {
    secrets.push("MAIL_USERNAME", "MAIL_PASSWORD");
  }
  if (cfg.artifactRegistry === "npm") { secrets.push("NPM_TOKEN"); }
  if (cfg.artifactRegistry === "docker-hub") { secrets.push("DOCKER_USERNAME", "DOCKER_PASSWORD"); }
  if (cfg.artifactRegistry === "github-packages") { secrets.push("GITHUB_TOKEN"); }
  return secrets;
}

function stripYamlFences(raw: string): string {
  const fenced = raw.match(/^```(?:yaml)?\s*\n([\s\S]*?)\n```\s*$/);
  return fenced ? fenced[1] : raw;
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export class BuildPanel {
  private static _current: BuildPanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private _step: BuildWorkflowStep = "detect-project";
  private _cancelled = false;
  private _rawAiOutput = "";
  private _workflowCtx: BuildWorkflowContext = { validationResults: [] };
  private _repoRoot = "";
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    private readonly _phase: Phase,
    private readonly _context: vscode.ExtensionContext,
    private readonly _aiRunner: AiRunner
  ) {
    this._panel = vscode.window.createWebviewPanel(
      "buildPanel",
      _phase.label,
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    this._repoRoot = resolveRepoRoot(this._context);
    this._panel.webview.html = this._buildHtml();

    this._panel.webview.onDidReceiveMessage(
      (msg: { command: string } & Record<string, unknown>) => {
        switch (msg.command) {
          case "detectProject":
            this._handleDetectProject();
            break;
          case "confirmConfig":
            this._handleConfirmConfig({
              notificationChannel: (msg.notificationChannel as NotificationChannel) ?? "none",
              slackWebhookSecret: (msg.slackWebhookSecret as string) ?? "",
              emailRecipient: (msg.emailRecipient as string) ?? "",
              artifactRegistry: (msg.artifactRegistry as ArtifactRegistry) ?? "github-packages",
              customRegistryUrl: (msg.customRegistryUrl as string) ?? "",
              triggerBranches: ((msg.triggerBranches as string) ?? "main,develop")
                .split(",").map((b) => b.trim()).filter(Boolean),
            });
            break;
          case "regeneratePipeline":
            this._handleGeneratePipeline();
            break;
          case "editYaml":
            this._workflowCtx.editedYaml = (msg.yaml as string) ?? "";
            break;
          case "continueToValidation":
            this._handleContinueToValidation();
            break;
          case "runValidation":
            this._handleRunValidation(msg.index as number);
            break;
          case "continueToCommit":
            this._handleContinueToCommit();
            break;
          case "commitPipeline":
            this._handleCommitPipeline();
            break;
          case "goBack":
            this._handleGoBack((msg.fromStep as string) ?? "");
            break;
          case "restart":
            this._handleRestart();
            break;
          case "openUrl":
            vscode.env.openExternal(vscode.Uri.parse((msg.url as string) ?? ""));
            break;
        }
      },
      undefined,
      this._disposables
    );

    this._panel.onDidDispose(() => this._dispose(), undefined, this._disposables);
  }

  static show(phase: Phase, context: vscode.ExtensionContext, aiRunner: AiRunner): void {
    if (BuildPanel._current) {
      BuildPanel._current._panel.reveal(vscode.ViewColumn.One);
      return;
    }
    BuildPanel._current = new BuildPanel(phase, context, aiRunner);
  }

  // ── Step handlers ──────────────────────────────────────────────────────────

  private _handleDetectProject(): void {
    try {
      const detection = detectProject(this._repoRoot);
      this._workflowCtx.detection = detection;
      this._panel.webview.postMessage({ command: "detectionResult", detection });
    } catch (err) {
      this._panel.webview.postMessage({
        command: "detectionError",
        text: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private _handleConfirmConfig(config: BuildUserConfig): void {
    if (config.triggerBranches.length === 0) {
      this._panel.webview.postMessage({
        command: "configError",
        text: "At least one trigger branch is required.",
      });
      return;
    }
    this._workflowCtx.userConfig = config;
    this._step = "generate-pipeline";
    this._handleGeneratePipeline();
  }

  private _handleGeneratePipeline(): void {
    const detection = this._workflowCtx.detection;
    const userConfig = this._workflowCtx.userConfig;
    if (!detection || !userConfig) { return; }

    this._cancelled = true;
    this._rawAiOutput = "";
    setImmediate(() => { this._cancelled = false; });

    this._panel.webview.postMessage({ command: "started", step: "generate-pipeline" });

    const prompt = buildBuildPrompt(detection, userConfig);

    const sink: AiOutputSink = {
      appendAiChunk: (chunk) => {
        if (this._cancelled) { return; }
        this._rawAiOutput += chunk;
        this._panel.webview.postMessage({ command: "appendChunk", text: chunk });
      },
      aiDone: () => {
        if (this._cancelled) { return; }
        const yaml = stripYamlFences(this._rawAiOutput.trim());
        this._workflowCtx.generatedYaml = yaml;
        this._workflowCtx.editedYaml = yaml;
        this._step = "review-pipeline";
        const warnings = computeRequiredSecrets(userConfig);
        this._panel.webview.postMessage({ command: "pipelineGenerated", yaml, warnings });
      },
      aiError: (msg) => {
        if (this._cancelled) { return; }
        this._panel.webview.postMessage({ command: "aiError", text: msg });
      },
    };

    this._aiRunner.run(this._phase, prompt, sink);
  }

  private _handleContinueToValidation(): void {
    this._step = "run-local-validation";
    const detection = this._workflowCtx.detection;
    const commands = detection ? deriveValidationCommands(detection) : [];
    this._workflowCtx.validationResults = commands.map((_, i) => ({
      index: i, status: "pending", output: "",
    }));
    this._panel.webview.postMessage({ command: "validationCommandsLoaded", commands });
  }

  private _handleRunValidation(index: number): void {
    const commands = this._workflowCtx.validationResults.map((_, i) => {
      const detection = this._workflowCtx.detection;
      return detection ? deriveValidationCommands(detection)[i] ?? "" : "";
    });
    const cmd = commands[index];
    if (!cmd) { return; }

    const result = this._workflowCtx.validationResults[index];
    if (result) { result.status = "running"; result.output = ""; }

    this._panel.webview.postMessage({ command: "commandStarted", index });

    const child = cp.spawn(cmd, [], { cwd: this._repoRoot, shell: true });

    const onData = (chunk: Buffer) => {
      const text = chunk.toString();
      if (result) { result.output += text; }
      this._panel.webview.postMessage({ command: "commandOutput", index, text });
    };

    child.stdout.on("data", onData);
    child.stderr.on("data", onData);

    child.on("close", (code) => {
      const exitCode = code ?? 1;
      if (result) { result.status = exitCode === 0 ? "pass" : "fail"; }
      const toolNotFound = exitCode === 127;
      this._panel.webview.postMessage({ command: "commandDone", index, exitCode, toolNotFound });
    });

    child.on("error", (err) => {
      if (result) { result.status = "fail"; }
      this._panel.webview.postMessage({ command: "commandOutput", index, text: `Error: ${err.message}\n` });
      this._panel.webview.postMessage({ command: "commandDone", index, exitCode: 1, toolNotFound: false });
    });
  }

  private _handleContinueToCommit(): void {
    this._step = "commit-pipeline";
    const date = new Date().toISOString().slice(0, 10);
    const branchName = `ci/add-pipeline-${date}`;
    this._panel.webview.postMessage({
      command: "commitPrefill",
      branchName,
      prTitle: "ci: add automated CI pipeline",
      filePath: ".github/workflows/ci.yml",
    });
  }

  private async _handleCommitPipeline(): Promise<void> {
    const yaml = this._workflowCtx.editedYaml ?? this._workflowCtx.generatedYaml ?? "";
    if (!yaml.trim()) {
      this._panel.webview.postMessage({ command: "commitError", text: "No pipeline YAML to commit." });
      return;
    }

    this._panel.webview.postMessage({ command: "commitCreating" });

    // Write .github/workflows/ci.yml
    try {
      const workflowDir = path.join(this._repoRoot, ".github", "workflows");
      fs.mkdirSync(workflowDir, { recursive: true });
      fs.writeFileSync(path.join(workflowDir, "ci.yml"), yaml, "utf8");
    } catch (err) {
      this._panel.webview.postMessage({
        command: "commitError",
        text: `Failed to write ci.yml: ${err instanceof Error ? err.message : String(err)}`,
      });
      return;
    }

    const date = new Date().toISOString().slice(0, 10);
    const branchName = `ci/add-pipeline-${date}`;
    this._workflowCtx.commitBranch = branchName;

    const exec = (cmd: string): Promise<void> =>
      new Promise((res, rej) =>
        cp.exec(cmd, { cwd: this._repoRoot, timeout: 30000 }, (err) => (err ? rej(err) : res()))
      );

    // Git operations
    try {
      await exec(`git checkout -b ${branchName}`).catch(() => exec(`git checkout ${branchName}`));
      await exec(`git add .github/workflows/ci.yml`);
      await exec(`git commit -m "ci: add automated CI pipeline via AI-Native DevOps extension"`);
      await exec(`git push -u origin ${branchName}`);
    } catch (err) {
      // File is written locally — push can be done manually
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("push") || msg.includes("remote") || msg.includes("origin")) {
        this._panel.webview.postMessage({
          command: "commitError",
          text: `ci.yml written locally but push failed: ${msg}\n\nPush manually: git push -u origin ${branchName}`,
        });
      } else {
        this._panel.webview.postMessage({
          command: "commitError",
          text: `Git operation failed: ${msg}`,
        });
      }
      return;
    }

    // Create GitHub PR
    try {
      const token = await getGithubToken();
      const repoInfo = getGithubRepoInfo(this._repoRoot);
      const settingsCfg = vscode.workspace.getConfiguration("aiNativeDevOps");
      const owner = repoInfo?.owner ?? settingsCfg.get<string>("githubOwner", "");
      const repo = repoInfo?.repo ?? settingsCfg.get<string>("githubRepo", "");

      if (!owner || !repo) {
        this._panel.webview.postMessage({
          command: "commitError",
          text: "ci.yml committed and pushed, but could not detect GitHub repo for PR creation. Set aiNativeDevOps.githubOwner and githubRepo in settings.",
        });
        return;
      }

      const prBody = [
        "## CI Pipeline — Automated Setup",
        "",
        "This PR adds a GitHub Actions CI pipeline generated by the AI-Native DevOps extension.",
        "",
        "### What's included",
        "- Dependency installation and caching",
        "- Lint, build, and test stages",
        "- Code coverage gate (≥80%)",
        "- SAST security scanning",
        "- Build artifact upload",
        ...(this._workflowCtx.userConfig?.notificationChannel !== "none"
          ? ["- Failure notifications"]
          : []),
        "",
        "### Required secrets",
        ...computeRequiredSecrets(this._workflowCtx.userConfig ?? {
          notificationChannel: "none", slackWebhookSecret: "", emailRecipient: "",
          artifactRegistry: "github-packages", customRegistryUrl: "", triggerBranches: [],
        }).map((s) => `- \`${s}\``),
        "",
        "_Generated by AI-Native DevOps extension — Build Phase_",
      ].join("\n");

      type PrResponse = { html_url?: string; number?: number; message?: string };
      const prResult = await githubRequest<PrResponse>(
        "POST",
        `/repos/${owner}/${repo}/pulls`,
        token,
        { title: "ci: add automated CI pipeline", body: prBody, head: branchName, base: "main", draft: false }
      );

      if (prResult.status === 422) {
        this._panel.webview.postMessage({
          command: "commitError",
          text: "ci.yml pushed but GitHub rejected the PR (HTTP 422). The branch may already have an open PR.",
        });
        return;
      }

      if (!prResult.data.html_url || !prResult.data.number) {
        this._panel.webview.postMessage({
          command: "commitError",
          text: prResult.data.message ?? `GitHub PR API returned ${prResult.status}`,
        });
        return;
      }

      this._workflowCtx.prUrl = prResult.data.html_url;
      this._workflowCtx.prNumber = prResult.data.number;
      this._step = "complete";

      this._panel.webview.postMessage({
        command: "pipelineCommitted",
        prUrl: prResult.data.html_url,
        prNumber: prResult.data.number,
        branchName,
      });
    } catch (err) {
      this._panel.webview.postMessage({
        command: "commitError",
        text: `ci.yml pushed but PR creation failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  private _handleGoBack(fromStep: string): void {
    this._cancelled = true;
    this._rawAiOutput = "";
    const prev: Record<string, BuildWorkflowStep> = {
      "generate-pipeline": "detect-project",
      "review-pipeline": "detect-project",
      "run-local-validation": "review-pipeline",
      "commit-pipeline": "run-local-validation",
    };
    this._step = prev[fromStep] ?? "detect-project";
    setImmediate(() => { this._cancelled = false; });
  }

  private _handleRestart(): void {
    this._cancelled = true;
    this._rawAiOutput = "";
    this._workflowCtx = { validationResults: [] };
    this._step = "detect-project";
    setImmediate(() => { this._cancelled = false; });
  }

  private _dispose(): void {
    BuildPanel._current = undefined;
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
  input[type="text"], textarea, select {
    width: 100%;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, #555);
    border-radius: 3px;
    padding: 7px 10px;
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
  }
  select { cursor: pointer; }
  input[type="text"]:focus, textarea:focus, select:focus {
    outline: 1px solid var(--vscode-focusBorder);
    border-color: var(--vscode-focusBorder);
  }
  textarea { resize: vertical; }
  textarea.yaml-area { min-height: 380px; font-family: var(--vscode-editor-font-family, monospace); font-size: 0.88em; }
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
  .spinner-row {
    display: flex; align-items: center; gap: 8px;
    font-style: italic; color: var(--vscode-descriptionForeground);
    margin-bottom: 8px; font-size: 0.9em;
  }
  .spinner {
    display: inline-block; width: 13px; height: 13px;
    border: 2px solid var(--vscode-foreground);
    border-top-color: transparent; border-radius: 50%;
    animation: spin 0.7s linear infinite; opacity: 0.55; flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
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
    display: none; margin-top: 8px; max-height: 180px; overflow-y: auto;
    white-space: pre-wrap; word-break: break-word;
    background: var(--vscode-textBlockQuote-background); padding: 8px;
    font-size: 0.82em; font-family: var(--vscode-editor-font-family, monospace);
  }
  .result-box {
    margin-top: 14px; padding: 12px;
    background: var(--vscode-textBlockQuote-background);
    border-left: 3px solid #4caf50; border-radius: 3px;
  }
  .result-box a { color: var(--vscode-textLink-foreground); cursor: pointer; text-decoration: underline; }
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
  .detect-card {
    border: 1px solid var(--vscode-panel-border, #444);
    border-radius: 4px; padding: 12px; margin-bottom: 14px;
    display: flex; gap: 12px; align-items: flex-start;
  }
  .detect-badge {
    background: var(--vscode-button-background); color: var(--vscode-button-foreground);
    border-radius: 4px; padding: 3px 10px; font-size: 0.85em; font-weight: 700; white-space: nowrap;
  }
  .detect-info { flex: 1; font-size: 0.88em; color: var(--vscode-descriptionForeground); }
  .tag-list { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
  .tag {
    font-size: 0.72em; padding: 2px 6px; border-radius: 10px;
    background: var(--vscode-badge-background); color: var(--vscode-badge-foreground);
  }
  .conditional-field { display: none; margin-top: 10px; }
  .conditional-field.visible { display: block; }
  .commit-summary {
    background: var(--vscode-textBlockQuote-background);
    border-radius: 4px; padding: 12px; margin-bottom: 14px; font-size: 0.88em;
  }
  .commit-summary table { width: 100%; border-collapse: collapse; }
  .commit-summary td { padding: 3px 8px; }
  .commit-summary td:first-child { font-weight: 600; color: var(--vscode-descriptionForeground); white-space: nowrap; }
  section { display: none; }
  section.active { display: block; }
</style>
</head>
<body>
<h1>${this._phase.label}</h1>
<p class="subtitle">Detect your project, generate a GitHub Actions CI pipeline, review, validate, and commit.</p>

<!-- Step indicator -->
<div class="step-indicator">
  <div class="step-dot active" id="step-dot-1">
    <div class="step-num" id="step-num-1">1</div>
    <div class="step-lbl">Detect</div>
  </div>
  <div class="step-connector"></div>
  <div class="step-dot" id="step-dot-2">
    <div class="step-num" id="step-num-2">2</div>
    <div class="step-lbl">Generate</div>
  </div>
  <div class="step-connector"></div>
  <div class="step-dot" id="step-dot-3">
    <div class="step-num" id="step-num-3">3</div>
    <div class="step-lbl">Review</div>
  </div>
  <div class="step-connector"></div>
  <div class="step-dot" id="step-dot-4">
    <div class="step-num" id="step-num-4">4</div>
    <div class="step-lbl">Validate</div>
  </div>
  <div class="step-connector"></div>
  <div class="step-dot" id="step-dot-5">
    <div class="step-num" id="step-num-5">5</div>
    <div class="step-lbl">Commit</div>
  </div>
</div>

<!-- ─── Section 1: Detect Project ─────────────────────────────────────── -->
<section id="sectionStep1" class="active">
  <h2>Step 1 — Detect Project &amp; Configure Pipeline</h2>
  <p class="info-block">Scan your workspace to detect the project type, then configure your CI pipeline preferences.</p>

  <div id="scanArea">
    <button class="primary" id="scanBtn" onclick="vscode.postMessage({ command:'detectProject' }); this.disabled=true; this.textContent='Scanning…'">
      Scan Project
    </button>
    <p class="error-msg" id="detectError"></p>
  </div>

  <div id="configForm" style="display:none">
    <div id="detectCard" class="detect-card">
      <div class="detect-badge" id="detectTypeBadge">unknown</div>
      <div class="detect-info">
        <div id="detectCommandSummary"></div>
        <div class="tag-list" id="detectFileTags"></div>
      </div>
    </div>

    <hr class="divider">
    <h2>Pipeline Configuration</h2>

    <div class="field">
      <label for="triggerBranches">Trigger Branches (comma-separated)</label>
      <input type="text" id="triggerBranches" value="main, develop" placeholder="main, develop">
    </div>

    <div class="field">
      <label for="notifChannel">Failure Notification Channel</label>
      <select id="notifChannel" onchange="onNotifChange()">
        <option value="none">None</option>
        <option value="slack">Slack</option>
        <option value="email">Email</option>
      </select>
    </div>
    <div class="conditional-field" id="slackField">
      <label for="slackSecret">Slack Webhook Secret Name</label>
      <input type="text" id="slackSecret" value="SLACK_WEBHOOK_URL" placeholder="SLACK_WEBHOOK_URL">
    </div>
    <div class="conditional-field" id="emailField">
      <label for="emailRecipient">Email Recipient</label>
      <input type="text" id="emailRecipient" placeholder="dev-team@example.com">
    </div>

    <div class="field">
      <label for="artifactRegistry">Artifact Registry</label>
      <select id="artifactRegistry" onchange="onRegistryChange()">
        <option value="github-packages">GitHub Packages</option>
        <option value="npm">npm Registry</option>
        <option value="docker-hub">Docker Hub</option>
        <option value="custom">Custom</option>
      </select>
    </div>
    <div class="conditional-field" id="customRegistryField">
      <label for="customRegistryUrl">Custom Registry URL</label>
      <input type="text" id="customRegistryUrl" placeholder="https://registry.example.com">
    </div>

    <p class="error-msg" id="configError"></p>

    <div class="button-row">
      <button class="primary" onclick="submitConfig()">Generate Pipeline</button>
    </div>
  </div>
</section>

<!-- ─── Section 2: Generate Pipeline ──────────────────────────────────── -->
<section id="sectionStep2">
  <h2>Step 2 — Generating CI Pipeline</h2>
  <div class="spinner-row"><span class="spinner"></span> AI is generating your GitHub Actions workflow…</div>
  <div class="output-pre" id="aiOutput"></div>
  <p class="error-msg" id="genError"></p>
  <div class="button-row">
    <button class="secondary" onclick="goBack('generate-pipeline')">Back</button>
  </div>
</section>

<!-- ─── Section 3: Review Pipeline ────────────────────────────────────── -->
<section id="sectionStep3">
  <h2>Step 3 — Review &amp; Edit CI Pipeline</h2>
  <div id="secretsWarning" class="warn-block" style="display:none">
    <strong>⚠ Required GitHub Secrets</strong>
    <p style="margin-top:5px">Configure these secrets in <em>GitHub → Repo Settings → Secrets and variables → Actions</em> before running the pipeline:</p>
    <ul id="secretsList" style="margin-top:6px;padding-left:18px;font-family:var(--vscode-editor-font-family,monospace);font-size:0.9em;"></ul>
  </div>
  <div class="info-block" id="triggerPreview"></div>
  <div class="field">
    <label for="yamlEditor">ci.yml — edit before committing</label>
    <textarea class="yaml-area" id="yamlEditor" oninput="onYamlEdit()"></textarea>
  </div>
  <div class="button-row">
    <button class="primary" onclick="continueToValidation()">Continue to Validation</button>
    <button class="secondary" onclick="regenerate()">Regenerate</button>
    <button class="secondary" onclick="goBack('review-pipeline')">Back</button>
  </div>
</section>

<!-- ─── Section 4: Local Validation ──────────────────────────────────── -->
<section id="sectionStep4">
  <h2>Step 4 — Local Validation</h2>
  <p class="info-block">Run commands locally to verify your code builds before committing the pipeline. You can skip this step if tools are not installed.</p>
  <div id="noCommandsMsg" style="display:none" class="info-block">
    Could not detect project type — skipping local validation. Proceed to commit when ready.
  </div>
  <div id="commandList"></div>
  <p class="error-msg" id="validationError"></p>
  <div class="button-row">
    <button class="primary" onclick="continueToCommit()">Commit Pipeline</button>
    <button class="secondary" onclick="goBack('run-local-validation')">Back</button>
  </div>
</section>

<!-- ─── Section 5: Commit Pipeline ────────────────────────────────────── -->
<section id="sectionStep5">
  <h2>Step 5 — Commit CI Pipeline</h2>
  <div class="commit-summary">
    <table>
      <tr><td>File:</td><td id="commitFilePath">.github/workflows/ci.yml</td></tr>
      <tr><td>Branch:</td><td id="commitBranchName">—</td></tr>
      <tr><td>PR Title:</td><td id="commitPrTitle">—</td></tr>
    </table>
  </div>
  <div id="commitSpinnerRow" style="display:none" class="spinner-row">
    <span class="spinner"></span> Writing file, committing, and creating PR…
  </div>
  <div id="commitResultSection" style="display:none" class="result-box">
    <strong>Pipeline committed!</strong><br>
    Pull Request: <a id="prResultLink" onclick="openUrl(this.dataset.url)">View PR</a>
  </div>
  <p class="error-msg" id="commitError"></p>
  <div class="button-row" id="commitBtnRow">
    <button class="primary" id="commitBtn" onclick="doCommit()">Commit Pipeline</button>
    <button class="secondary" onclick="goBack('commit-pipeline')">Back</button>
  </div>
  <div class="button-row" id="restartRow" style="display:none">
    <button class="secondary" onclick="doRestart()">Start Over</button>
  </div>
</section>

<script>
const vscode = acquireVsCodeApi();
let detectionData = null;

// ── Utilities ─────────────────────────────────────────────────────────────────
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function showSection(n) {
  for (let i = 1; i <= 5; i++) {
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
  for (let i = 1; i <= 5; i++) {
    const dot = document.getElementById('step-dot-' + i);
    if (!dot) continue;
    dot.classList.toggle('active', i === n);
    if (i !== n) dot.classList.remove('active');
  }
  const d = document.getElementById('step-dot-' + n);
  if (d) d.classList.add('active');
}
function unmarkDone(n) {
  const dot = document.getElementById('step-dot-' + n);
  const num = document.getElementById('step-num-' + n);
  if (!dot || !num) return;
  dot.classList.remove('done');
  num.textContent = String(n);
}

// ── Step 1 actions ────────────────────────────────────────────────────────────
function onNotifChange() {
  const v = document.getElementById('notifChannel').value;
  document.getElementById('slackField').classList.toggle('visible', v === 'slack');
  document.getElementById('emailField').classList.toggle('visible', v === 'email');
}
function onRegistryChange() {
  const v = document.getElementById('artifactRegistry').value;
  document.getElementById('customRegistryField').classList.toggle('visible', v === 'custom');
}
function submitConfig() {
  document.getElementById('configError').textContent = '';
  vscode.postMessage({
    command: 'confirmConfig',
    notificationChannel: document.getElementById('notifChannel').value,
    slackWebhookSecret: document.getElementById('slackSecret').value.trim(),
    emailRecipient: document.getElementById('emailRecipient').value.trim(),
    artifactRegistry: document.getElementById('artifactRegistry').value,
    customRegistryUrl: document.getElementById('customRegistryUrl').value.trim(),
    triggerBranches: document.getElementById('triggerBranches').value,
  });
}

// ── Step 3 actions ────────────────────────────────────────────────────────────
function onYamlEdit() {
  vscode.postMessage({ command: 'editYaml', yaml: document.getElementById('yamlEditor').value });
}
function continueToValidation() {
  vscode.postMessage({ command: 'continueToValidation' });
}
function regenerate() {
  document.getElementById('aiOutput').textContent = '';
  markActive(2); unmarkDone(2); showSection(2);
  vscode.postMessage({ command: 'regeneratePipeline' });
}

// ── Step 4 actions ────────────────────────────────────────────────────────────
function continueToCommit() {
  vscode.postMessage({ command: 'continueToCommit' });
}

// ── Step 5 actions ────────────────────────────────────────────────────────────
function doCommit() {
  document.getElementById('commitError').textContent = '';
  document.getElementById('commitBtn').disabled = true;
  document.getElementById('commitSpinnerRow').style.display = 'flex';
  vscode.postMessage({ command: 'commitPipeline' });
}
function doRestart() { vscode.postMessage({ command: 'restart' }); }
function openUrl(url) { vscode.postMessage({ command: 'openUrl', url }); }
function goBack(fromStep) {
  vscode.postMessage({ command: 'goBack', fromStep });
  const stepMap = {
    'generate-pipeline': 1, 'review-pipeline': 1,
    'run-local-validation': 3, 'commit-pipeline': 4,
  };
  const target = stepMap[fromStep] || 1;
  for (let i = target; i <= 5; i++) { unmarkDone(i); }
  markActive(target);
  showSection(target);
  if (fromStep === 'generate-pipeline' || fromStep === 'review-pipeline') {
    // re-enable scan button
    const scanBtn = document.getElementById('scanBtn');
    if (scanBtn) { scanBtn.disabled = false; scanBtn.textContent = 'Scan Project'; }
  }
  if (fromStep === 'commit-pipeline') {
    document.getElementById('commitBtn').disabled = false;
    document.getElementById('commitSpinnerRow').style.display = 'none';
  }
}

// ── Message handler ───────────────────────────────────────────────────────────
window.addEventListener('message', (ev) => {
  const msg = ev.data;
  switch (msg.command) {

    // Step 1
    case 'detectionResult': {
      detectionData = msg.detection;
      const d = msg.detection;
      document.getElementById('detectTypeBadge').textContent = d.type.toUpperCase();
      document.getElementById('detectCommandSummary').innerHTML =
        (d.testCommand ? '<b>Test:</b> ' + escHtml(d.testCommand) + '  ' : '') +
        (d.buildCommand ? '<b>Build:</b> ' + escHtml(d.buildCommand) : '');
      const tags = document.getElementById('detectFileTags');
      tags.innerHTML = d.detectedFiles.map(f => '<span class="tag">' + escHtml(f) + '</span>').join('');
      document.getElementById('configForm').style.display = 'block';
      break;
    }
    case 'detectionError':
      document.getElementById('detectError').textContent = msg.text;
      document.getElementById('scanBtn').disabled = false;
      document.getElementById('scanBtn').textContent = 'Scan Project';
      break;
    case 'configError':
      document.getElementById('configError').textContent = msg.text;
      break;

    // Step 2
    case 'started':
      markDone(1); markActive(2); showSection(2);
      document.getElementById('aiOutput').textContent = '';
      document.getElementById('genError').textContent = '';
      break;
    case 'appendChunk': {
      const pre = document.getElementById('aiOutput');
      pre.textContent += msg.text;
      pre.scrollTop = pre.scrollHeight;
      break;
    }
    case 'aiError':
      document.getElementById('genError').textContent = msg.text;
      break;

    // Step 3
    case 'pipelineGenerated': {
      markDone(2); markActive(3); showSection(3);
      document.getElementById('yamlEditor').value = msg.yaml;
      const cfg = {
        notificationChannel: document.getElementById('notifChannel').value,
        triggerBranches: document.getElementById('triggerBranches').value,
      };
      document.getElementById('triggerPreview').textContent =
        'Will trigger on push and pull_request targeting: ' + cfg.triggerBranches;
      const warnings = msg.warnings || [];
      const warnBox = document.getElementById('secretsWarning');
      if (warnings.length > 0) {
        warnBox.style.display = 'block';
        document.getElementById('secretsList').innerHTML =
          warnings.map(s => '<li>' + escHtml(s) + '</li>').join('');
      } else {
        warnBox.style.display = 'none';
      }
      break;
    }

    // Step 4
    case 'validationCommandsLoaded': {
      markDone(3); markActive(4); showSection(4);
      const commands = msg.commands || [];
      const list = document.getElementById('commandList');
      document.getElementById('noCommandsMsg').style.display = commands.length === 0 ? 'block' : 'none';
      list.innerHTML = commands.map((cmd, i) => \`
        <div class="cmd-card" id="cmd-card-\${i}">
          <div class="cmd-header">
            <span class="cmd-text" id="cmd-text-\${i}">\${escHtml(cmd)}</span>
            <span class="cmd-status-badge badge-pending" id="cmd-status-badge-\${i}">pending</span>
            <button class="secondary" id="cmd-run-\${i}" onclick="vscode.postMessage({ command:'runValidation', index:\${i} })" style="padding:4px 10px;margin-top:0">Run</button>
          </div>
          <div class="cmd-output-area" id="cmd-out-\${i}"></div>
        </div>
      \`).join('');
      break;
    }
    case 'commandStarted': {
      const i = msg.index;
      document.getElementById('cmd-status-badge-' + i).className = 'cmd-status-badge badge-running';
      document.getElementById('cmd-status-badge-' + i).textContent = 'running';
      document.getElementById('cmd-run-' + i).disabled = true;
      const out = document.getElementById('cmd-out-' + i);
      out.style.display = 'block'; out.textContent = '';
      break;
    }
    case 'commandOutput': {
      const out = document.getElementById('cmd-out-' + msg.index);
      if (out) { out.textContent += msg.text; out.scrollTop = out.scrollHeight; }
      break;
    }
    case 'commandDone': {
      const i = msg.index;
      const badge = document.getElementById('cmd-status-badge-' + i);
      const btn = document.getElementById('cmd-run-' + i);
      if (msg.exitCode === 0) {
        badge.className = 'cmd-status-badge badge-pass'; badge.textContent = 'pass';
      } else if (msg.toolNotFound) {
        badge.className = 'cmd-status-badge badge-fail'; badge.textContent = 'not installed';
        const out = document.getElementById('cmd-out-' + i);
        if (out) out.textContent += '\\n(Tool not installed — will run in CI)';
      } else {
        badge.className = 'cmd-status-badge badge-fail'; badge.textContent = 'fail';
      }
      if (btn) btn.disabled = false;
      break;
    }

    // Step 5
    case 'commitPrefill':
      markDone(4); markActive(5); showSection(5);
      document.getElementById('commitBranchName').textContent = msg.branchName || '—';
      document.getElementById('commitPrTitle').textContent = msg.prTitle || '—';
      document.getElementById('commitFilePath').textContent = msg.filePath || '.github/workflows/ci.yml';
      break;
    case 'commitCreating':
      document.getElementById('commitSpinnerRow').style.display = 'flex';
      document.getElementById('commitError').textContent = '';
      break;
    case 'pipelineCommitted': {
      document.getElementById('commitSpinnerRow').style.display = 'none';
      document.getElementById('commitBtnRow').style.display = 'none';
      const res = document.getElementById('commitResultSection');
      res.style.display = 'block';
      const link = document.getElementById('prResultLink');
      link.textContent = 'PR #' + msg.prNumber + ' — ' + escHtml(msg.branchName);
      link.dataset.url = msg.prUrl;
      document.getElementById('restartRow').style.display = 'flex';
      markDone(5);
      break;
    }
    case 'commitError':
      document.getElementById('commitSpinnerRow').style.display = 'none';
      document.getElementById('commitBtn').disabled = false;
      document.getElementById('commitError').textContent = msg.text;
      break;

    // Restart
    case 'restart':
      for (let i = 1; i <= 5; i++) { unmarkDone(i); }
      markActive(1); showSection(1);
      document.getElementById('configForm').style.display = 'none';
      document.getElementById('aiOutput').textContent = '';
      document.getElementById('commandList').innerHTML = '';
      document.getElementById('commitResultSection').style.display = 'none';
      document.getElementById('commitBtnRow').style.display = 'flex';
      document.getElementById('restartRow').style.display = 'none';
      document.getElementById('commitError').textContent = '';
      const scanBtn2 = document.getElementById('scanBtn');
      if (scanBtn2) { scanBtn2.disabled = false; scanBtn2.textContent = 'Scan Project'; }
      break;
  }
});
</script>
</body>
</html>`;
  }
}
