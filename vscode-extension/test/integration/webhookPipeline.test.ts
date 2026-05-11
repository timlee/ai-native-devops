/**
 * Integration test: full webhook pipeline chain
 * JSONL file → readQueuedEvents → resolvePhaseAndSpec → resolveTrigger →
 * buildQueueContext → buildAutomationPrompt → output string
 *
 * All functions are pure (no VS Code dependency needed for this chain).
 */
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

import { readQueuedEvents, resolvePhaseAndSpec, resolveTrigger, buildQueueContext } from '../../src/webhookQueue';
import { buildAutomationPrompt } from '../../src/agentAutomation';

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

function loadFixtureContent(): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, 'events.jsonl'), 'utf8');
}

beforeEach(() => {
  jest.clearAllMocks();
  (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
    get: jest.fn((key: string, def: any) => {
      if (key === 'webhookQueueFile') return '.ai-native-devops/events.jsonl';
      return def;
    }),
  });
});

describe('Webhook pipeline - full chain', () => {
  it('processes a valid phaseId=0 event through the full chain', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{"id":"1","phaseId":0,"title":"Login requirement","context":"MFA required"}');

    const events = readQueuedEvents('/repo/events.jsonl');
    expect(events).toHaveLength(1);

    const resolved = resolvePhaseAndSpec(events[0]);
    expect(resolved).toBeDefined();
    expect(resolved!.phase.id).toBe(0);

    const trigger = resolveTrigger(resolved!.spec, events[0].triggerId);
    const context = buildQueueContext(events[0]);
    const prompt = buildAutomationPrompt(resolved!.phase, resolved!.spec, trigger, context);

    expect(prompt).toContain('REQUIREMENT agent');
    expect(prompt).toContain('Login requirement');
    expect(prompt).toContain('MFA required');
  });

  it('processes a valid phaseKey="code" event', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{"id":"2","phaseKey":"code","triggerId":"ai_code","title":"Implement auth"}');

    const events = readQueuedEvents('/repo/events.jsonl');
    const resolved = resolvePhaseAndSpec(events[0]);
    expect(resolved).toBeDefined();
    expect(resolved!.phase.key).toBe('code');

    const trigger = resolveTrigger(resolved!.spec, 'ai_code');
    expect(trigger.id).toBe('ai_code');

    const context = buildQueueContext(events[0]);
    const prompt = buildAutomationPrompt(resolved!.phase, resolved!.spec, trigger, context);
    expect(prompt).toContain('CODE agent');
    expect(prompt).toContain('Implement auth');
  });

  it('phaseId takes precedence over phaseKey when both present', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{"id":"3","phaseId":0,"phaseKey":"code"}');

    const events = readQueuedEvents('/repo/events.jsonl');
    const resolved = resolvePhaseAndSpec(events[0]);
    expect(resolved!.phase.id).toBe(0);
  });

  it('unknown phaseId resolves to undefined — pipeline exits cleanly', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{"id":"4","phaseId":99,"title":"Unknown phase"}');

    const events = readQueuedEvents('/repo/events.jsonl');
    const resolved = resolvePhaseAndSpec(events[0]);
    expect(resolved).toBeUndefined();
  });

  it('malformed JSONL line does not prevent subsequent valid events from processing', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      '{"id":"1","phaseId":0}\nNOT JSON\n{"id":"2","phaseId":3}'
    );

    const events = readQueuedEvents('/repo/events.jsonl');
    expect(events).toHaveLength(2);

    const resolved0 = resolvePhaseAndSpec(events[0]);
    expect(resolved0).toBeDefined();
    expect(resolved0!.phase.id).toBe(0);

    const resolved3 = resolvePhaseAndSpec(events[1]);
    expect(resolved3).toBeDefined();
    expect(resolved3!.phase.id).toBe(3);
  });

  it('event with all context fields builds a rich prompt', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({
      id: '5',
      phaseId: 5,
      title: 'Add tests',
      source: 'github',
      context: 'Cover auth module',
      metadata: { pr: 42, repo: 'ai-native-devops' },
    }));

    const events = readQueuedEvents('/repo/events.jsonl');
    const resolved = resolvePhaseAndSpec(events[0]);
    expect(resolved).toBeDefined();

    const trigger = resolveTrigger(resolved!.spec, undefined);
    const context = buildQueueContext(events[0]);
    expect(context).toContain('Title: Add tests');
    expect(context).toContain('Source: github');
    expect(context).toContain('Cover auth module');
    expect(context).toContain('"pr": 42');

    const prompt = buildAutomationPrompt(resolved!.phase, resolved!.spec, trigger, context);
    expect(prompt).toContain('TEST agent');
  });

  it('empty queue file produces zero events — no throw', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('');
    expect(() => {
      const events = readQueuedEvents('/repo/events.jsonl');
      expect(events).toHaveLength(0);
    }).not.toThrow();
  });

  it('resolveTrigger falls back to first trigger for unknown triggerId', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{"id":"1","phaseId":5,"triggerId":"nonexistent"}');

    const events = readQueuedEvents('/repo/events.jsonl');
    const resolved = resolvePhaseAndSpec(events[0]);
    const trigger = resolveTrigger(resolved!.spec, events[0].triggerId);
    expect(trigger.id).toBe('pr_opened');
  });

  it('prompt for phase 0 contains "REQUIREMENT agent"', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{"phaseId":0}');

    const events = readQueuedEvents('/q');
    const resolved = resolvePhaseAndSpec(events[0]);
    const trigger = resolveTrigger(resolved!.spec, undefined);
    const context = buildQueueContext(events[0]);
    const prompt = buildAutomationPrompt(resolved!.phase, resolved!.spec, trigger, context);
    expect(prompt).toContain('REQUIREMENT agent');
  });
});
