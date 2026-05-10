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
exports.AiRunner = void 0;
const vscode = __importStar(require("vscode"));
const SECRET_CLAUDE = "aiNativeDevOps.claudeApiKey";
const SECRET_OPENAI = "aiNativeDevOps.openaiApiKey";
class AiRunner {
    constructor(secrets) {
        this.secrets = secrets;
    }
    async run(phase, userPrompt, output) {
        const cfg = vscode.workspace.getConfiguration("aiNativeDevOps");
        const provider = cfg.get("provider", "copilot");
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            output.aiError(message);
        }
    }
    // ── Claude ───────────────────────────────────────────────────────────────
    async _runClaude(prompt, cfg, output) {
        const apiKey = await this.secrets.get(SECRET_CLAUDE);
        if (!apiKey) {
            throw new Error("No Anthropic API key found. Run 'AI DevOps: Select AI Provider' to set it.");
        }
        const model = cfg.get("claudeModel", "claude-sonnet-4-6");
        // Dynamic import so the extension doesn't fail to activate if the SDK
        // is not installed (users who don't need Claude).
        let Anthropic;
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            Anthropic = require("@anthropic-ai/sdk").default ?? require("@anthropic-ai/sdk");
        }
        catch {
            throw new Error("The @anthropic-ai/sdk package is not installed. Run: npm install @anthropic-ai/sdk inside the extension folder.");
        }
        const client = new Anthropic({ apiKey });
        const stream = await client.messages.stream({
            model,
            max_tokens: 4096,
            messages: [{ role: "user", content: prompt }],
            system: "You are an expert AI-native DevOps assistant. Produce structured, production-ready guidance and code following the AI-native DevOps lifecycle framework. Be concise, precise, and always consider security and governance.",
        });
        for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" &&
                chunk.delta.type === "text_delta") {
                output.appendAiChunk(chunk.delta.text);
            }
        }
        output.aiDone();
    }
    // ── OpenAI ───────────────────────────────────────────────────────────────
    async _runOpenAI(prompt, cfg, output) {
        const apiKey = await this.secrets.get(SECRET_OPENAI);
        if (!apiKey) {
            throw new Error("No OpenAI API key found. Run 'AI DevOps: Select AI Provider' to set it.");
        }
        const model = cfg.get("openaiModel", "gpt-4o");
        let OpenAI;
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            OpenAI = require("openai").default ?? require("openai");
        }
        catch {
            throw new Error("The openai package is not installed. Run: npm install openai inside the extension folder.");
        }
        const client = new OpenAI({ apiKey });
        const stream = await client.chat.completions.create({
            model,
            stream: true,
            messages: [
                {
                    role: "system",
                    content: "You are an expert AI-native DevOps assistant. Produce structured, production-ready guidance and code following the AI-native DevOps lifecycle framework. Be concise, precise, and always consider security and governance.",
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
    async _runCopilot(prompt, phase, output) {
        // Use VS Code's built-in Copilot language model API (1.90+).
        const models = await vscode.lm.selectChatModels({ vendor: "copilot" });
        if (!models || models.length === 0) {
            throw new Error("GitHub Copilot Chat is not available. Install the GitHub Copilot Chat extension and sign in.");
        }
        const model = models[0];
        const messages = [
            vscode.LanguageModelChatMessage.User(`You are an expert AI-native DevOps assistant helping with lifecycle phase: ${phase.label}.\n\n` +
                "Produce structured, production-ready guidance and code following the AI-native DevOps lifecycle framework. " +
                "Be concise, precise, and always consider security and governance.\n\n" +
                prompt),
        ];
        const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
        for await (const chunk of response.text) {
            output.appendAiChunk(chunk);
        }
        output.aiDone();
    }
    // ── Key management helpers ────────────────────────────────────────────────
    async setClaudeKey(key) {
        await this.secrets.store(SECRET_CLAUDE, key);
    }
    async setOpenAiKey(key) {
        await this.secrets.store(SECRET_OPENAI, key);
    }
    async deleteClaudeKey() {
        await this.secrets.delete(SECRET_CLAUDE);
    }
    async deleteOpenAiKey() {
        await this.secrets.delete(SECRET_OPENAI);
    }
}
exports.AiRunner = AiRunner;
//# sourceMappingURL=aiRunner.js.map