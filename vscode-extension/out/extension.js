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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const phases_1 = require("./phases");
const lifecycleProvider_1 = require("./lifecycleProvider");
const phasePanel_1 = require("./phasePanel");
const checklistPanel_1 = require("./checklistPanel");
const aiRunner_1 = require("./aiRunner");
function activate(context) {
    // ── Tree view ─────────────────────────────────────────────────────────────
    const lifecycleProvider = new lifecycleProvider_1.LifecycleProvider(context);
    vscode.window.registerTreeDataProvider("aiNativeDevOps.lifecycle", lifecycleProvider);
    // ── AI runner ─────────────────────────────────────────────────────────────
    const aiRunner = new aiRunner_1.AiRunner(context.secrets);
    // ── Commands ──────────────────────────────────────────────────────────────
    context.subscriptions.push(
    // Open phase lifecycle guide panel
    vscode.commands.registerCommand("aiNativeDevOps.openPhase", (phase) => {
        const p = phase ?? pickCurrentPhase();
        if (!p)
            return;
        phasePanel_1.PhasePanel.show(p, context, (ph, prompt, panel) => aiRunner.run(ph, prompt ?? "", panel));
    }), 
    // Run AI prompt for a phase
    vscode.commands.registerCommand("aiNativeDevOps.runPrompt", async (phase) => {
        const p = phase ?? pickCurrentPhase();
        if (!p)
            return;
        const input = await vscode.window.showInputBox({
            title: `Run AI Prompt · ${p.label}`,
            prompt: "Enter your prompt (leave blank to use the default phase prompt)",
            placeHolder: "Describe what you need help with...",
        });
        if (input === undefined)
            return; // cancelled
        const panel = phasePanel_1.PhasePanel.show(p, context, (ph, pr, pnl) => aiRunner.run(ph, pr ?? "", pnl));
        await aiRunner.run(p, input.trim() || `Follow the AI-native DevOps guidelines for phase: ${p.label}`, panel);
    }), 
    // Open checklist panel
    vscode.commands.registerCommand("aiNativeDevOps.openChecklist", (phase) => {
        const p = phase ?? pickCurrentPhase();
        if (!p)
            return;
        checklistPanel_1.ChecklistPanel.show(p, context);
    }), 
    // Dashboard — opens the current phase guide
    vscode.commands.registerCommand("aiNativeDevOps.openDashboard", () => {
        const p = pickCurrentPhase();
        if (!p)
            return;
        phasePanel_1.PhasePanel.show(p, context, (ph, prompt, panel) => aiRunner.run(ph, prompt ?? "", panel));
    }), 
    // Select AI provider and securely store API keys
    vscode.commands.registerCommand("aiNativeDevOps.selectProvider", async () => {
        const provider = await vscode.window.showQuickPick([
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
        ], { title: "Select AI Provider", placeHolder: "Choose the AI provider to use" });
        if (!provider)
            return;
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
        }
        else if (provider.value === "openai") {
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
        }
        else {
            vscode.window.showInformationMessage("GitHub Copilot selected. No API key needed — ensure the Copilot Chat extension is installed and signed in.");
        }
    }), 
    // Run a custom prompt against any phase
    vscode.commands.registerCommand("aiNativeDevOps.runCustomPrompt", async () => {
        const phaseItems = phases_1.PHASES.map((p) => ({
            label: p.label,
            phase: p,
        }));
        const selected = await vscode.window.showQuickPick(phaseItems, {
            title: "Select Lifecycle Phase",
            placeHolder: "Which phase is this prompt for?",
        });
        if (!selected)
            return;
        const input = await vscode.window.showInputBox({
            title: `Custom Prompt · ${selected.phase.label}`,
            prompt: "Enter your custom prompt",
            placeHolder: "Describe what you want the AI to help with...",
        });
        if (!input)
            return;
        const panel = phasePanel_1.PhasePanel.show(selected.phase, context, (ph, pr, pnl) => aiRunner.run(ph, pr ?? "", pnl));
        await aiRunner.run(selected.phase, input, panel);
    }));
    // ── Status bar ────────────────────────────────────────────────────────────
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
    statusBar.command = "aiNativeDevOps.openDashboard";
    updateStatusBar(statusBar);
    statusBar.show();
    context.subscriptions.push(statusBar);
    // Refresh tree + status bar when configuration changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("aiNativeDevOps")) {
            lifecycleProvider.refresh();
            updateStatusBar(statusBar);
        }
    }));
    vscode.window.showInformationMessage("AI-Native DevOps extension activated. Open the sidebar to begin.");
}
function pickCurrentPhase() {
    const id = vscode.workspace
        .getConfiguration("aiNativeDevOps")
        .get("currentPhase", 1);
    return phases_1.PHASES.find((p) => p.id === id);
}
function updateStatusBar(item) {
    const phase = pickCurrentPhase();
    if (phase) {
        item.text = `$(rocket) AI DevOps · ${phase.label}`;
        item.tooltip = "Click to open the AI-Native DevOps dashboard";
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map