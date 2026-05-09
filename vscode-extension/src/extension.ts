import * as vscode from "vscode";
import { PHASES, Phase } from "./phases";
import { LifecycleProvider } from "./lifecycleProvider";
import { PhasePanel } from "./phasePanel";
import { ChecklistPanel } from "./checklistPanel";
import { AiOutputSink, AiRunner } from "./aiRunner";
import {
  buildAutomationPrompt,
  getAgentSpecByPhase,
  AgentTrigger,
} from "./agentAutomation";
import { ensureTextFile, resolveRepoRoot } from "./phasePanel";
import {
  buildQueueContext,
  readQueuedEvents,
  resolvePhaseAndSpec,
  resolveQueueFilePath,
  resolveTrigger,
} from "./webhookQueue";

export function activate(context: vscode.ExtensionContext) {
  // ── Tree view ─────────────────────────────────────────────────────────────
  const lifecycleProvider = new LifecycleProvider(context);
  vscode.window.registerTreeDataProvider(
    "aiNativeDevOps.lifecycle",
    lifecycleProvider
  );

  // ── AI runner ─────────────────────────────────────────────────────────────
  const aiRunner = new AiRunner(context.secrets);
  const webhookOutput = vscode.window.createOutputChannel("AI DevOps Webhooks");
  context.subscriptions.push(webhookOutput);

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
    ),

    // Run full agent automation flow (trigger-aware)
    vscode.commands.registerCommand(
      "aiNativeDevOps.runAgentAutomation",
      async () => {
        await runAgentAutomationInteractive(context, aiRunner);
      }
    ),

    // Scaffold expected output artifacts for selected agent
    vscode.commands.registerCommand(
      "aiNativeDevOps.scaffoldAgentArtifacts",
      async () => {
        const phaseItems = PHASES.map((p) => ({
          label: p.label,
          phase: p,
        }));
        const selected = await vscode.window.showQuickPick(phaseItems, {
          title: "Scaffold Agent Artifacts",
          placeHolder: "Choose lifecycle phase",
        });
        if (!selected) return;

        const spec = getAgentSpecByPhase(selected.phase.id);
        if (!spec) {
          vscode.window.showErrorMessage(
            `No automation spec found for phase: ${selected.phase.label}`
          );
          return;
        }

        const repoRoot = resolveRepoRoot(context);
        const created: string[] = [];
        const now = new Date().toISOString();

        for (const relativePath of spec.artifactPaths) {
          const content = [
            `# ${spec.agentName} Artifact`,
            "",
            `- Phase: ${selected.phase.label}`,
            `- Generated: ${now}`,
            "",
            "## Objective",
            spec.objective,
            "",
            "## Trigger",
            "- Fill in trigger details",
            "",
            "## Output",
            "- Fill in AI generated output",
            "",
            "## Risks",
            "- Fill in risks and mitigation",
            "",
            "## Approvals",
            "- Fill in required reviewers/approvers",
            "",
          ].join("\n");
          const fullPath = ensureTextFile(repoRoot, relativePath, content);
          created.push(fullPath);
        }

        const open = await vscode.window.showInformationMessage(
          `Artifact scaffolding completed (${created.length} files).`,
          "Open First"
        );
        if (open === "Open First" && created.length > 0) {
          const doc = await vscode.workspace.openTextDocument(created[0]);
          await vscode.window.showTextDocument(doc);
        }
      }
    ),

    // Process queued webhook events and run matching agent automations
    vscode.commands.registerCommand(
      "aiNativeDevOps.processWebhookQueue",
      async () => {
        await processWebhookQueue(context, aiRunner, webhookOutput);
      }
    ),

    // Generate PR draft body for CODE agent output
    vscode.commands.registerCommand(
      "aiNativeDevOps.generateCodePrTemplate",
      async () => {
        const issueRef = await vscode.window.showInputBox({
          title: "Generate CODE Agent PR Draft",
          prompt: "Issue / ticket reference",
          placeHolder: "Example: #123 or PROJ-456",
          value: "#",
        });
        if (!issueRef) return;

        const summary = await vscode.window.showInputBox({
          title: "PR Summary",
          prompt: "Short summary of what changed",
          placeHolder: "Implemented feature X and fixed Y",
        });
        if (!summary) return;

        const generatedBy = await vscode.window.showQuickPick(
          ["GitHub Copilot", "Claude", "Codex/OpenAI", "Hybrid"],
          { title: "Generated by AI tool" }
        );
        if (!generatedBy) return;

        const template = [
          "## Summary",
          summary,
          "",
          "## Related Issue",
          issueRef,
          "",
          "## Implementation details",
          "- [ ] Describe key code/path changes",
          "- [ ] Describe design decisions",
          "",
          "## Tests run",
          "- [ ] Unit tests",
          "- [ ] Integration tests",
          "- [ ] Commands + results",
          "",
          "## Risk assessment",
          "- [ ] Functional risk",
          "- [ ] Security risk",
          "- [ ] Operational risk",
          "",
          "## Rollback notes",
          "- [ ] Revert strategy",
          "- [ ] Data/backward compatibility considerations",
          "",
          "## Generated-by AI tool",
          generatedBy,
          "",
          "## Human review required",
          "- [ ] Code owner review",
          "- [ ] Security review (if applicable)",
          "- [ ] Release/deploy approver (if applicable)",
          "",
        ].join("\n");

        const doc = await vscode.workspace.openTextDocument({
          language: "markdown",
          content: template,
        });
        await vscode.window.showTextDocument(doc, { preview: false });
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

  const pollingEnabled = vscode.workspace
    .getConfiguration("aiNativeDevOps")
    .get<boolean>("enableWebhookPolling", false);
  if (pollingEnabled) {
    const seconds = vscode.workspace
      .getConfiguration("aiNativeDevOps")
      .get<number>("webhookPollingSeconds", 30);
    const interval = Math.max(10, seconds) * 1000;
    const timer = setInterval(() => {
      processWebhookQueue(context, aiRunner, webhookOutput).catch((err) => {
        webhookOutput.appendLine(`Polling error: ${String(err)}`);
      });
    }, interval);
    context.subscriptions.push(new vscode.Disposable(() => clearInterval(timer)));
    webhookOutput.appendLine(`Webhook polling enabled every ${Math.max(10, seconds)} seconds.`);
  }
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

async function pickTrigger(
  triggers: AgentTrigger[]
): Promise<AgentTrigger | undefined> {
  const picked = await vscode.window.showQuickPick(
    triggers.map((t) => ({
      label: t.label,
      description: t.description,
      trigger: t,
    })),
    {
      title: "Select Trigger",
      placeHolder: "Choose the event that triggered this agent run",
    }
  );
  return picked?.trigger;
}

async function runAgentAutomationInteractive(
  context: vscode.ExtensionContext,
  aiRunner: AiRunner
): Promise<void> {
  const phaseItems = PHASES.map((p) => ({
    label: p.label,
    phase: p,
  }));
  const selected = await vscode.window.showQuickPick(phaseItems, {
    title: "Select Agent Phase",
    placeHolder: "Choose which lifecycle agent to run",
  });
  if (!selected) return;

  const spec = getAgentSpecByPhase(selected.phase.id);
  if (!spec) {
    vscode.window.showErrorMessage(
      `No automation spec found for phase: ${selected.phase.label}`
    );
    return;
  }

  const trigger = await pickTrigger(spec.triggers);
  if (!trigger) return;

  const requestContext = await vscode.window.showInputBox({
    title: `${spec.agentName} · Context`,
    prompt: "Paste issue/ticket/request details to drive automation output",
    placeHolder: "Issue summary, constraints, dependencies, environment notes...",
    ignoreFocusOut: true,
    value:
      "Context: <paste request details here>\nConstraints: \nDependencies: \nSuccess criteria: ",
  });
  if (!requestContext) return;

  const prompt = buildAutomationPrompt(
    selected.phase,
    spec,
    trigger,
    requestContext
  );

  const panel = PhasePanel.show(selected.phase, context, (ph, pr, pnl) =>
    aiRunner.run(ph, pr ?? "", pnl)
  );
  await aiRunner.run(selected.phase, prompt, panel);
}

async function processWebhookQueue(
  context: vscode.ExtensionContext,
  aiRunner: AiRunner,
  output: vscode.OutputChannel
): Promise<void> {
  const repoRoot = resolveRepoRoot(context);
  const queueFile = resolveQueueFilePath(repoRoot);
  const events = readQueuedEvents(queueFile);
  const processedCount = context.globalState.get<number>("webhook.processedCount", 0);

  if (events.length <= processedCount) {
    output.appendLine("No new webhook events to process.");
    return;
  }

  const autoOpenPanel = vscode.workspace
    .getConfiguration("aiNativeDevOps")
    .get<boolean>("autoOpenPanelOnWebhook", true);

  const newEvents = events.slice(processedCount);
  output.appendLine(`Processing ${newEvents.length} webhook event(s) from queue.`);

  for (const event of newEvents) {
    const resolved = resolvePhaseAndSpec(event);
    if (!resolved) {
      output.appendLine(`Skipped event (cannot resolve phase/spec): ${JSON.stringify(event)}`);
      continue;
    }
    const trigger = resolveTrigger(resolved.spec, event.triggerId);
    const prompt = buildAutomationPrompt(
      resolved.phase,
      resolved.spec,
      trigger,
      buildQueueContext(event)
    );

    output.appendLine(
      `Running ${resolved.spec.agentName} for phase ${resolved.phase.label} via trigger ${trigger.id}`
    );

    if (autoOpenPanel) {
      const panel = PhasePanel.show(resolved.phase, context, (ph, pr, pnl) =>
        aiRunner.run(ph, pr ?? "", pnl)
      );
      await aiRunner.run(resolved.phase, prompt, panel);
    } else {
      const sink = createOutputSink(output, resolved.phase.label);
      await aiRunner.run(resolved.phase, prompt, sink);
    }
  }

  await context.globalState.update("webhook.processedCount", events.length);
  output.appendLine(`Done. Processed count updated to ${events.length}.`);
}

function createOutputSink(
  output: vscode.OutputChannel,
  phaseLabel: string
): AiOutputSink {
  return {
    appendAiChunk(chunk: string) {
      output.append(chunk);
    },
    aiDone() {
      output.appendLine(`\n\n[${phaseLabel}] automation complete.`);
    },
    aiError(msg: string) {
      output.appendLine(`\n\n[${phaseLabel}] automation error: ${msg}`);
    },
  };
}
