import * as vscode from "vscode";
import { Phase } from "./phases";

export interface AiOutputSink {
  appendAiChunk(chunk: string): void;
  aiDone(): void;
  aiError(msg: string): void;
}

export type AiProvider = "claude" | "openai" | "copilot";

const SECRET_CLAUDE = "aiNativeDevOps.claudeApiKey";
const SECRET_OPENAI = "aiNativeDevOps.openaiApiKey";

export class AiRunner {
  constructor(private secrets: vscode.SecretStorage) {}

  async run(
    phase: Phase,
    userPrompt: string,
    output: AiOutputSink
  ): Promise<void> {
    const cfg = vscode.workspace.getConfiguration("aiNativeDevOps");
    const provider = cfg.get<AiProvider>("provider", "copilot");

    try {
      switch (provider) {
        case "claude":
          await this._runClaude(userPrompt, cfg, output);
          break;
        case "openai":
          await this._runOpenAI(userPrompt, cfg, output);
          break;
        case "copilot":
          await this._runCopilot(userPrompt, phase, output);
          break;
        default:
          output.aiError(`Unknown provider: ${provider}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      output.aiError(message);
    }
  }

  // ── Claude ───────────────────────────────────────────────────────────────

  private async _runClaude(
    prompt: string,
    cfg: vscode.WorkspaceConfiguration,
    output: AiOutputSink
  ): Promise<void> {
    const apiKey = await this.secrets.get(SECRET_CLAUDE);
    if (!apiKey) {
      throw new Error(
        "No Anthropic API key found. Run 'AI DevOps: Select AI Provider' to set it."
      );
    }
    const model = cfg.get<string>("claudeModel", "claude-sonnet-4-6");

    // Dynamic import so the extension doesn't fail to activate if the SDK
    // is not installed (users who don't need Claude).
    let Anthropic: typeof import("@anthropic-ai/sdk").default;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      Anthropic = require("@anthropic-ai/sdk").default ?? require("@anthropic-ai/sdk");
    } catch {
      throw new Error(
        "The @anthropic-ai/sdk package is not installed. Run: npm install @anthropic-ai/sdk inside the extension folder."
      );
    }

    const client = new Anthropic({ apiKey });

    const stream = await client.messages.stream({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
      system:
        "You are an expert AI-native DevOps assistant. Produce structured, production-ready guidance and code following the AI-native DevOps lifecycle framework. Be concise, precise, and always consider security and governance.",
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        output.appendAiChunk(chunk.delta.text);
      }
    }
    output.aiDone();
  }

  // ── OpenAI ───────────────────────────────────────────────────────────────

  private async _runOpenAI(
    prompt: string,
    cfg: vscode.WorkspaceConfiguration,
    output: AiOutputSink
  ): Promise<void> {
    const apiKey = await this.secrets.get(SECRET_OPENAI);
    if (!apiKey) {
      throw new Error(
        "No OpenAI API key found. Run 'AI DevOps: Select AI Provider' to set it."
      );
    }
    const model = cfg.get<string>("openaiModel", "gpt-4o");

    let OpenAI: typeof import("openai").default;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      OpenAI = require("openai").default ?? require("openai");
    } catch {
      throw new Error(
        "The openai package is not installed. Run: npm install openai inside the extension folder."
      );
    }

    const client = new OpenAI({ apiKey });

    const stream = await client.chat.completions.create({
      model,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are an expert AI-native DevOps assistant. Produce structured, production-ready guidance and code following the AI-native DevOps lifecycle framework. Be concise, precise, and always consider security and governance.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 4096,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        output.appendAiChunk(text);
      }
    }
    output.aiDone();
  }

  // ── Copilot ──────────────────────────────────────────────────────────────

  private async _runCopilot(
    prompt: string,
    phase: Phase,
    output: AiOutputSink
  ): Promise<void> {
    // Use VS Code's built-in Copilot language model API (1.90+).
    const models = await vscode.lm.selectChatModels({ vendor: "copilot" });
    if (!models || models.length === 0) {
      throw new Error(
        "GitHub Copilot Chat is not available. Install the GitHub Copilot Chat extension and sign in."
      );
    }

    const model = models[0];
    const messages = [
      vscode.LanguageModelChatMessage.User(
        `You are an expert AI-native DevOps assistant helping with lifecycle phase: ${phase.label}.\n\n` +
          "Produce structured, production-ready guidance and code following the AI-native DevOps lifecycle framework. " +
          "Be concise, precise, and always consider security and governance.\n\n" +
          prompt
      ),
    ];

    const response = await model.sendRequest(
      messages,
      {},
      new vscode.CancellationTokenSource().token
    );

    for await (const chunk of response.text) {
      output.appendAiChunk(chunk);
    }
    output.aiDone();
  }

  // ── Key management helpers ────────────────────────────────────────────────

  async setClaudeKey(key: string): Promise<void> {
    await this.secrets.store(SECRET_CLAUDE, key);
  }

  async setOpenAiKey(key: string): Promise<void> {
    await this.secrets.store(SECRET_OPENAI, key);
  }

  async deleteClaudeKey(): Promise<void> {
    await this.secrets.delete(SECRET_CLAUDE);
  }

  async deleteOpenAiKey(): Promise<void> {
    await this.secrets.delete(SECRET_OPENAI);
  }
}
