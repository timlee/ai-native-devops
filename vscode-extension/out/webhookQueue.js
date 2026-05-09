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
exports.resolveQueueFilePath = resolveQueueFilePath;
exports.readQueuedEvents = readQueuedEvents;
exports.resolvePhaseAndSpec = resolvePhaseAndSpec;
exports.resolveTrigger = resolveTrigger;
exports.buildQueueContext = buildQueueContext;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const agentAutomation_1 = require("./agentAutomation");
const phases_1 = require("./phases");
function resolveQueueFilePath(repoRoot) {
    const cfg = vscode.workspace.getConfiguration("aiNativeDevOps");
    const relative = cfg.get("webhookQueueFile", ".ai-native-devops/events.jsonl");
    if (path.isAbsolute(relative)) {
        return relative;
    }
    return path.join(repoRoot, relative);
}
function readQueuedEvents(queueFilePath) {
    if (!fs.existsSync(queueFilePath)) {
        return [];
    }
    const raw = fs.readFileSync(queueFilePath, "utf8");
    if (!raw.trim()) {
        return [];
    }
    const events = [];
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        try {
            const evt = JSON.parse(trimmed);
            events.push(evt);
        }
        catch {
            // Ignore malformed lines but keep processing.
        }
    }
    return events;
}
function resolvePhaseAndSpec(event) {
    let phase;
    if (typeof event.phaseId === "number") {
        phase = phases_1.PHASES.find((p) => p.id === event.phaseId);
    }
    if (!phase && event.phaseKey) {
        const key = event.phaseKey.toLowerCase();
        phase = phases_1.PHASES.find((p) => p.key === key || p.key.includes(key));
    }
    if (!phase) {
        return undefined;
    }
    const spec = (0, agentAutomation_1.getAgentSpecByPhase)(phase.id);
    if (!spec) {
        return undefined;
    }
    return { phase, spec };
}
function resolveTrigger(spec, triggerId) {
    if (triggerId) {
        const found = spec.triggers.find((t) => t.id === triggerId);
        if (found)
            return found;
    }
    return spec.triggers[0];
}
function buildQueueContext(event) {
    const contextParts = [];
    if (event.title) {
        contextParts.push(`Title: ${event.title}`);
    }
    if (event.source) {
        contextParts.push(`Source: ${event.source}`);
    }
    if (event.context) {
        contextParts.push(event.context);
    }
    if (event.metadata && Object.keys(event.metadata).length > 0) {
        contextParts.push(`Metadata: ${JSON.stringify(event.metadata, null, 2)}`);
    }
    return contextParts.join("\n\n") || "No additional context provided.";
}
//# sourceMappingURL=webhookQueue.js.map