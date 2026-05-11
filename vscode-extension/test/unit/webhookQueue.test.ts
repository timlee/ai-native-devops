import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

import {
  readQueuedEvents,
  resolvePhaseAndSpec,
  resolveTrigger,
  buildQueueContext,
  resolveQueueFilePath,
} from '../../src/webhookQueue';

beforeEach(() => {
  jest.clearAllMocks();
  (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
    get: jest.fn((key: string, def: any) => {
      if (key === 'webhookQueueFile') return '.ai-native-devops/events.jsonl';
      return def;
    }),
  });
});

// ── readQueuedEvents ─────────────────────────────────────────────────────────

describe('readQueuedEvents', () => {
  it('returns empty array when file does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(readQueuedEvents('/repo/events.jsonl')).toEqual([]);
  });

  it('returns empty array when file is empty', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('');
    expect(readQueuedEvents('/repo/events.jsonl')).toEqual([]);
  });

  it('returns empty array when file contains only whitespace', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('   \n  \n  ');
    expect(readQueuedEvents('/repo/events.jsonl')).toEqual([]);
  });

  it('parses a single valid JSONL line', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{"id":"1","phaseId":0}');
    const events = readQueuedEvents('/repo/events.jsonl');
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('1');
    expect(events[0].phaseId).toBe(0);
  });

  it('parses multiple valid JSONL lines', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      '{"id":"1","phaseId":0}\n{"id":"2","phaseKey":"code"}'
    );
    const events = readQueuedEvents('/repo/events.jsonl');
    expect(events).toHaveLength(2);
  });

  it('skips malformed JSON lines without throwing', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      '{"id":"1","phaseId":0}\nNOT JSON\n{"id":"2","phaseId":3}'
    );
    const events = readQueuedEvents('/repo/events.jsonl');
    expect(events).toHaveLength(2);
    expect(events[0].id).toBe('1');
    expect(events[1].id).toBe('2');
  });

  it('handles Windows CRLF line endings', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{"id":"1"}\r\n{"id":"2"}');
    const events = readQueuedEvents('/repo/events.jsonl');
    expect(events).toHaveLength(2);
  });

  it('handles blank lines between valid lines', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{"id":"1"}\n\n{"id":"2"}');
    const events = readQueuedEvents('/repo/events.jsonl');
    expect(events).toHaveLength(2);
  });
});

// ── resolvePhaseAndSpec ──────────────────────────────────────────────────────

describe('resolvePhaseAndSpec', () => {
  it('resolves by phaseId number', () => {
    const result = resolvePhaseAndSpec({ phaseId: 0 });
    expect(result).toBeDefined();
    expect(result!.phase.id).toBe(0);
    expect(result!.spec.agentName).toBe('REQUIREMENT agent');
  });

  it('resolves by phaseKey string', () => {
    const result = resolvePhaseAndSpec({ phaseKey: 'code' });
    expect(result).toBeDefined();
    expect(result!.phase.key).toBe('code');
  });

  it('prefers phaseId over phaseKey when both present', () => {
    const result = resolvePhaseAndSpec({ phaseId: 0, phaseKey: 'code' });
    expect(result).toBeDefined();
    expect(result!.phase.id).toBe(0);
  });

  it('returns undefined for unknown phaseId', () => {
    expect(resolvePhaseAndSpec({ phaseId: 99 })).toBeUndefined();
  });

  it('returns undefined for unknown phaseKey', () => {
    expect(resolvePhaseAndSpec({ phaseKey: 'nonexistent-phase' })).toBeUndefined();
  });

  it('returns undefined when neither phaseId nor phaseKey is given', () => {
    expect(resolvePhaseAndSpec({})).toBeUndefined();
  });

  it('SECURITY: string "0" phaseId does not resolve to phase 0 (type guard)', () => {
    // phaseId should be a number; a string should not match
    const result = resolvePhaseAndSpec({ phaseId: '0' as any });
    expect(result).toBeUndefined();
  });

  it('SECURITY: very large context field does not throw', () => {
    const largeContext = 'x'.repeat(100 * 1024);
    expect(() => resolvePhaseAndSpec({ phaseId: 0, context: largeContext })).not.toThrow();
  });

  it('returns undefined for null phaseId and null phaseKey', () => {
    expect(resolvePhaseAndSpec({ phaseId: null as any, phaseKey: null as any })).toBeUndefined();
  });
});

// ── resolveTrigger ───────────────────────────────────────────────────────────

describe('resolveTrigger', () => {
  const spec = {
    phaseId: 5,
    phaseKey: 'test',
    agentName: 'TEST agent',
    objective: 'Test',
    triggers: [
      { id: 'pr_opened', label: 'PR opened', description: 'PR trigger' },
      { id: 'ci_failed', label: 'CI failed', description: 'CI trigger' },
    ],
    automatedFlow: [],
    outputs: [],
    artifactPaths: [],
  };

  it('returns the matching trigger by triggerId', () => {
    const trigger = resolveTrigger(spec, 'ci_failed');
    expect(trigger.id).toBe('ci_failed');
  });

  it('returns the first trigger when triggerId is not found', () => {
    const trigger = resolveTrigger(spec, 'unknown_trigger');
    expect(trigger.id).toBe('pr_opened');
  });

  it('returns the first trigger when triggerId is undefined', () => {
    const trigger = resolveTrigger(spec, undefined);
    expect(trigger.id).toBe('pr_opened');
  });
});

// ── buildQueueContext ────────────────────────────────────────────────────────

describe('buildQueueContext', () => {
  it('includes title when present', () => {
    const ctx = buildQueueContext({ title: 'My Issue' });
    expect(ctx).toContain('Title: My Issue');
  });

  it('includes source when present', () => {
    const ctx = buildQueueContext({ source: 'github' });
    expect(ctx).toContain('Source: github');
  });

  it('includes context string when present', () => {
    const ctx = buildQueueContext({ context: 'Must use MFA' });
    expect(ctx).toContain('Must use MFA');
  });

  it('includes metadata as JSON when present', () => {
    const ctx = buildQueueContext({ metadata: { pr: 42 } });
    expect(ctx).toContain('Metadata:');
    expect(ctx).toContain('"pr": 42');
  });

  it('returns fallback string when all fields are empty', () => {
    const ctx = buildQueueContext({});
    expect(ctx).toBe('No additional context provided.');
  });

  it('combines all fields with double newlines', () => {
    const ctx = buildQueueContext({
      title: 'Title',
      source: 'github',
      context: 'Extra context',
    });
    expect(ctx).toContain('Title: Title');
    expect(ctx).toContain('Source: github');
    expect(ctx).toContain('Extra context');
  });
});

// ── resolveQueueFilePath ─────────────────────────────────────────────────────

describe('resolveQueueFilePath', () => {
  it('joins repoRoot with relative configured path', () => {
    const result = resolveQueueFilePath('/repo');
    expect(result).toBe(path.join('/repo', '.ai-native-devops/events.jsonl'));
  });

  it('returns absolute configured path as-is', () => {
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn((key: string, def: any) => {
        if (key === 'webhookQueueFile') return '/absolute/path/events.jsonl';
        return def;
      }),
    });
    const result = resolveQueueFilePath('/repo');
    expect(result).toBe('/absolute/path/events.jsonl');
  });
});
