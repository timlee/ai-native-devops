# AI-Native DevOps — VS Code Extension

A VS Code extension that guides software development through the **11-phase AI-native DevOps lifecycle** using Claude, OpenAI (Codex/GPT-4o), or GitHub Copilot.

## Features

| Feature | Description |
|---------|-------------|
| **Lifecycle Sidebar** | Visual tree of all 11 phases with the current phase highlighted |
| **Phase Guide Panel** | Tabbed webview showing lifecycle guide, AI prompt template, and agent guidance for each phase |
| **AI Runner** | Run phase prompts against Claude, OpenAI, or Copilot — streamed output in the panel |
| **Phase Checklist** | Interactive checklist with progress bar for each phase's entry/exit criteria |
| **Status Bar** | Shows current phase; click to open the dashboard |
| **Secure Key Storage** | API keys stored in VS Code's encrypted secret storage — never in settings files |
| **11 Agent Automation Flows** | Trigger-aware PLAN→INCIDENT workflows with required output sections |
| **Artifact Scaffolding** | Creates expected docs/artifact files for each agent phase |

## Getting Started

### 1. Install dependencies

```bash
cd vscode-extension
npm install
```

### 2. Build the extension

```bash
npm run compile
# or watch mode during development:
npm run watch
```

### 3. Launch in development

Press **F5** in VS Code (from the repo root or the `vscode-extension` folder) to open an Extension Development Host.

### 4. Configure your AI provider

Open the Command Palette (`Ctrl+Shift+P`) and run:

```
AI DevOps: Select AI Provider
```

Choose one of:

- **GitHub Copilot** — No API key needed. Requires the [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) extension.
- **Anthropic Claude** — Requires an [Anthropic API key](https://console.anthropic.com/).
- **OpenAI / Codex** — Requires an [OpenAI API key](https://platform.openai.com/api-keys).

### 5. Set your current lifecycle phase

Open VS Code settings (`Ctrl+,`) and search for `aiNativeDevOps.currentPhase`. Set it to 1–11.

Or configure `aiNativeDevOps.repoRoot` to point to your clone of the `ai-native-devops` repo if it's not your workspace root.

## Commands

| Command | Description |
|---------|-------------|
| `AI DevOps: Open Phase Guide` | Open the lifecycle guide for the current phase |
| `AI DevOps: Run AI Prompt for Phase` | Enter a prompt and run it with your AI provider |
| `AI DevOps: Open Phase Checklist` | Open the interactive checklist for the current phase |
| `AI DevOps: Open AI DevOps Dashboard` | Open the dashboard for the current phase |
| `AI DevOps: Select AI Provider` | Choose Claude / OpenAI / Copilot and store API keys |
| `AI DevOps: Run Custom Prompt` | Pick any phase and enter a free-form prompt |
| `AI DevOps: Run Agent Automation Flow` | Select phase + trigger and run the full automation prompt template |
| `AI DevOps: Scaffold Agent Artifacts` | Create expected artifact files for selected phase |
| `AI DevOps: Process Webhook Queue` | Consume queued GitHub/Jira/Slack/custom webhook events and run matching agent automation |
| `AI DevOps: Generate CODE Agent PR Draft` | One-click PR body generator with required governance sections |
| `AI DevOps: Scaffold GitHub Webhook Workflows` | Generate ready-to-use GitHub Actions workflows for issue intake and CI failure routing |

## Full AI Automation Design (11 Agents)

The extension now includes a complete trigger-driven automation profile for all lifecycle agents:

1. PLAN agent
2. DESIGN agent
3. CODE agent
4. BUILD agent
5. TEST agent
6. SECURE / COMPLY agent
7. RELEASE agent
8. DEPLOY agent
9. OPERATE agent
10. MONITOR / OBSERVE agent
11. INCIDENT / LEARN agent

Each agent run includes:

- Trigger context selection
- Structured automation steps
- Required markdown output sections
- Artifact path targets
- Governance requirements (approval gates, risk, rollback)

Security/compliance and operational policies are built into the generated prompts, including risk tier behavior for secure/comply, deployment gate guidance, and incident learning feedback loop expectations.

## Webhook Integration (GitHub / Jira / Slack)

The extension supports queued webhook automation events.

### 1. Start webhook bridge

```bash
cd vscode-extension
npm run start:webhook-bridge
```

Default endpoint:

- `POST http://localhost:8787/github`
- `POST http://localhost:8787/jira`
- `POST http://localhost:8787/slack`
- `POST http://localhost:8787/custom`

The bridge writes events to `.ai-native-devops/events.jsonl` by default.

### 2. Process events in VS Code

- Run command: `AI DevOps: Process Webhook Queue`
- Or enable polling with settings:
	- `aiNativeDevOps.enableWebhookPolling = true`
	- `aiNativeDevOps.webhookPollingSeconds = 30`

### 2.5. Scaffold GitHub Actions workflow files

- Run command: `AI DevOps: Scaffold GitHub Webhook Workflows`
- This creates:
	- `.github/workflows/ai-webhook-issue-intake.yml`
	- `.github/workflows/ai-webhook-ci-failures.yml`
	- `.github/workflows/ai-webhook-pr-routing.yml`

PR routing behavior:

- Pull request `opened/reopened/synchronize` routes to TEST (`pr-opened`)
- Pull request labeled `ai-code` routes to CODE (`ai-code`)

Required GitHub repo secrets:

- `AI_DEVOPS_WEBHOOK_URL` (example: https://your-webhook-endpoint.example.com)
- `AI_DEVOPS_WEBHOOK_TOKEN`

Note:

- GitHub-hosted runners cannot reach localhost on your machine. Use a reachable bridge endpoint (public service, tunnel, or self-hosted runner).

### 3. Optional shared secret

Set env var `WEBHOOK_TOKEN` before starting the bridge, then pass header:

- `x-ai-native-devops-token: <token>`

### 4. Example payload

```json
{
	"source": "github",
	"phaseKey": "plan",
	"triggerId": "github-issue",
	"title": "New feature request",
	"context": "Need multi-tenant RBAC with audit logging",
	"metadata": {
		"issueNumber": 128,
		"severity": "medium"
	}
}
```

## The 11 Lifecycle Phases

1. **Plan** — Requirements, user stories, acceptance criteria
2. **Design** — Architecture, ADRs, API specs, threat modeling
3. **Code** — Implementation, code review
4. **Build** — Artifact generation, dependency resolution
5. **Test** — Unit, integration, coverage, performance
6. **Secure & Comply** — SAST, DAST, SCA, secret scanning, IaC
7. **Release** — Release notes, versioning, artifact staging
8. **Deploy** — Environment readiness, progressive rollout, health checks
9. **Operate** — Runtime config, troubleshooting, runbooks
10. **Monitor & Observe** — Metrics, dashboards, alerting
11. **Incident & Learn** — RCA, postmortems, action items

## Settings Reference

| Setting | Default | Description |
|---------|---------|-------------|
| `aiNativeDevOps.provider` | `copilot` | AI provider: `claude`, `openai`, `copilot` |
| `aiNativeDevOps.claudeModel` | `claude-3-5-sonnet-20241022` | Claude model |
| `aiNativeDevOps.openaiModel` | `gpt-4o` | OpenAI model |
| `aiNativeDevOps.currentPhase` | `1` | Current lifecycle phase (1–11) |
| `aiNativeDevOps.repoRoot` | _(workspace root)_ | Path to the ai-native-devops repo |

## Security

- API keys are stored in **VS Code's encrypted secret storage** — never in `settings.json` or any file.
- The extension never logs or transmits keys.
- All AI responses are streamed only to the local webview panel.
- No data is sent anywhere except the selected AI provider's API endpoint.

## Install by Others (VSIX)

Build a distributable package:

```bash
cd vscode-extension
npm install
npm run compile
npm run package
```

This creates a `.vsix` file in `vscode-extension/`.

Anyone can install it with:

```bash
code --install-extension ai-native-devops-0.1.4.vsix
```

or in VS Code:

1. Open Extensions view.
2. Click `...`.
3. Select `Install from VSIX...`.
4. Choose the generated `.vsix` file.

## Publish to VS Code Marketplace

To make installation one-click for all users:

```bash
cd vscode-extension
npm install -g @vscode/vsce
vsce login <publisher>
vsce publish
```

After publishing, users can install from the Marketplace by searching the extension name.

## Packaging

To create a `.vsix` package:

```bash
npm install -g @vscode/vsce
vsce package
```

## License

MIT
