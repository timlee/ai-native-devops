import * as vscode from "vscode";
import { PHASES, Phase } from "./phases";
import { LifecycleProvider } from "./lifecycleProvider";
import { PhasePanel } from "./phasePanel";
import { ChecklistPanel } from "./checklistPanel";
import { AiRunner } from "./aiRunner";

export function activate(context: vscode.ExtensionContext) {
  // ── Tree view ─────────────────────────────────────────────────────────────
  const lifecycleProvider = new LifecycleProvider(context);
  vscode.window.registerTreeDataProvider(
    "aiNativeDevOps.lifecycle",
    lifecycleProvider
  );

  // ── AI runner ─────────────────────────────────────────────────────────────
  const aiRunner = new AiRunner(context.secrets);

  // ── Commands ──────────────────────────────────────────────────────────────

  context.subscriptions.push(
    // Open phase lifecycle guide panel
    vscode.commands.registerCommand(
      "aiNativeDevOps.openPhase",
      (phase?: Phase) => {
        const p = phase ?? pickCurrentPhase();
        if (!p) return;
        PhasePanel.show(p, context, (ph, prompt, panel) =>
          aiRunner.run(ph, prompt ?? "", panel)
        );
      }
    ),

    // Run AI prompt for a phase
    vscode.commands.registerCommand(
      "aiNativeDevOps.runPrompt",
      async (phase?: Phase) => {
        const p = phase ?? pickCurrentPhase();
        if (!p) return;
        const input = await vscode.window.showInputBox({
          title: `Run AI Prompt · ${p.label}`,
          prompt: "Enter your prompt (leave blank to use the default phase prompt)",
          placeHolder: "Describe what you need help with...",
        });
        if (input === undefined) return; // cancelled
        const panel = PhasePanel.show(p, context, (ph, pr, pnl) =>
          aiRunner.run(ph, pr ?? "", pnl)
        );
        await aiRunner.run(p, input.trim() || `Follow the AI-native DevOps guidelines for phase: ${p.label}`, panel);
      }
    ),

    // Open checklist panel
    vscode.commands.registerCommand(
      "aiNativeDevOps.openChecklist",
      (phase?: Phase) => {
        const p = phase ?? pickCurrentPhase();
        if (!p) return;
        ChecklistPanel.show(p, context);
      }
    ),

    // Dashboard — opens the current phase guide
    vscode.commands.registerCommand("aiNativeDevOps.openDashboard", () => {
      const p = pickCurrentPhase();
      if (!p) return;
      PhasePanel.show(p, context, (ph, prompt, panel) =>
        aiRunner.run(ph, prompt ?? "", panel)
      );
    }),

    // Select AI provider and securely store API keys
    vscode.commands.registerCommand(
      "aiNativeDevOps.selectProvider",
      async () => {
        const provider = await vscode.window.showQuickPick(
          [
            {
              label: "$(copilot) GitHub Copilot",
              description: "Uses VS Code Copilot Chat API — no key needed",
              value: "copilot",
            },
            {
              label: "$(sparkle) Anthropic Claude",
              description: "claude-3-5-sonnet or newer",
              value: "claude",
            },
            {
              label: "$(symbol-event) OpenAI / Codex",
              description: "gpt-4o or any OpenAI model",
              value: "openai",
            },
          ],
          { title: "Select AI Provider", placeHolder: "Choose the AI provider to use" }
        );
        if (!provider) return;

        await vscode.workspace
          .getConfiguration("aiNativeDevOps")
          .update("provider", provider.value, vscode.ConfigurationTarget.Global);

        if (provider.value === "claude") {
          const key = await vscode.window.showInputBox({
            title: "Anthropic API Key",
            prompt: "Enter your Anthropic API key (stored securely in VS Code secret storage)",
            password: true,
            placeHolder: "sk-ant-...",
          });
          if (key) {
            await aiRunner.setClaudeKey(key);
            vscode.window.showInformationMessage("Claude API key saved securely.");
          }
        } else if (provider.value === "openai") {
          const key = await vscode.window.showInputBox({
            title: "OpenAI API Key",
            prompt: "Enter your OpenAI API key (stored securely in VS Code secret storage)",
            password: true,
            placeHolder: "sk-...",
          });
          if (key) {
            await aiRunner.setOpenAiKey(key);
            vscode.window.showInformationMessage("OpenAI API key saved securely.");
          }
        } else {
          vscode.window.showInformationMessage(
            "GitHub Copilot selected. No API key needed — ensure the Copilot Chat extension is installed and signed in."
          );
        }
      }
    ),

    // Run a custom prompt against any phase
    vscode.commands.registerCommand(
      "aiNativeDevOps.runCustomPrompt",
      async () => {
        const phaseItems = PHASES.map((p) => ({
          label: p.label,
          phase: p,
        }));
        const selected = await vscode.window.showQuickPick(phaseItems, {
          title: "Select Lifecycle Phase",
          placeHolder: "Which phase is this prompt for?",
        });
        if (!selected) return;

        const input = await vscode.window.showInputBox({
          title: `Custom Prompt · ${selected.phase.label}`,
          prompt: "Enter your custom prompt",
          placeHolder: "Describe what you want the AI to help with...",
        });
        if (!input) return;

        const panel = PhasePanel.show(
          selected.phase,
          context,
          (ph, pr, pnl) => aiRunner.run(ph, pr ?? "", pnl)
        );
        await aiRunner.run(selected.phase, input, panel);
      }
    )
  );

  // ── Status bar ────────────────────────────────────────────────────────────
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    10
  );
  statusBar.command = "aiNativeDevOps.openDashboard";
  updateStatusBar(statusBar);
  statusBar.show();
  context.subscriptions.push(statusBar);

  // Refresh tree + status bar when configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("aiNativeDevOps")) {
        lifecycleProvider.refresh();
        updateStatusBar(statusBar);
      }
    })
  );

  vscode.window.showInformationMessage(
    "AI-Native DevOps extension activated. Open the sidebar to begin."
  );
}

function pickCurrentPhase(): Phase | undefined {
  const id = vscode.workspace
    .getConfiguration("aiNativeDevOps")
    .get<number>("currentPhase", 1);
  return PHASES.find((p) => p.id === id);
}

function updateStatusBar(item: vscode.StatusBarItem) {
  const phase = pickCurrentPhase();
  if (phase) {
    item.text = `$(rocket) AI DevOps · ${phase.label}`;
    item.tooltip = "Click to open the AI-Native DevOps dashboard";
  }
}

export function deactivate() {}
