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

Press **F5** in VS Code (with the `vscode-extension` folder open) to open an Extension Development Host.

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

## Packaging

To create a `.vsix` package:

```bash
npm install -g @vscode/vsce
vsce package
```

## License

MIT
