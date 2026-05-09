import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { AgentTrigger, AgentAutomationSpec, getAgentSpecByPhase } from "./agentAutomation";
import { Phase, PHASES } from "./phases";

export interface QueuedAutomationEvent {
  id?: string;
  timestamp?: string;
  source?: string;
  phaseId?: number;
  phaseKey?: string;
  triggerId?: string;
  title?: string;
  context?: string;
  metadata?: Record<string, unknown>;
}

export function resolveQueueFilePath(repoRoot: string): string {
  const cfg = vscode.workspace.getConfiguration("aiNativeDevOps");
  const relative = cfg.get<string>("webhookQueueFile", ".ai-native-devops/events.jsonl");
  if (path.isAbsolute(relative)) {
    return relative;
  }
  return path.join(repoRoot, relative);
}

export function readQueuedEvents(queueFilePath: string): QueuedAutomationEvent[] {
  if (!fs.existsSync(queueFilePath)) {
    return [];
  }
  const raw = fs.readFileSync(queueFilePath, "utf8");
  if (!raw.trim()) {
    return [];
  }

  const events: QueuedAutomationEvent[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const evt = JSON.parse(trimmed) as QueuedAutomationEvent;
      events.push(evt);
    } catch {
      // Ignore malformed lines but keep processing.
    }
  }
  return events;
}

export function resolvePhaseAndSpec(
  event: QueuedAutomationEvent
): { phase: Phase; spec: AgentAutomationSpec } | undefined {
  let phase: Phase | undefined;
  if (typeof event.phaseId === "number") {
    phase = PHASES.find((p) => p.id === event.phaseId);
  }
  if (!phase && event.phaseKey) {
    const key = event.phaseKey.toLowerCase();
    phase = PHASES.find((p) => p.key === key || p.key.includes(key));
  }
  if (!phase) {
    return undefined;
  }
  const spec = getAgentSpecByPhase(phase.id);
  if (!spec) {
    return undefined;
  }
  return { phase, spec };
}

export function resolveTrigger(
  spec: AgentAutomationSpec,
  triggerId?: string
): AgentTrigger {
  if (triggerId) {
    const found = spec.triggers.find((t) => t.id === triggerId);
    if (found) return found;
  }
  return spec.triggers[0];
}

export function buildQueueContext(event: QueuedAutomationEvent): string {
  const contextParts: string[] = [];
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
