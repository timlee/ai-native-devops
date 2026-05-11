/**
 * Integration test: AiRunner provider switching, key lifecycle, and streaming.
 */
import * as vscode from 'vscode';
import { AiRunner, AiOutputSink } from '../../src/aiRunner';
import { PHASES } from '../../src/phases';

const phase0 = PHASES.find(p => p.id === 0)!;

function makeSecrets(initial?: Record<string, string>) {
  const store: Record<string, string | undefined> = { ...initial };
  return {
    get: jest.fn(async (key: string) => store[key]),
    store: jest.fn(async (key: string, value: string) => { store[key] = value; }),
    delete: jest.fn(async (key: string) => { delete store[key]; }),
    onDidChange: jest.fn().mockReturnValue({ dispose: jest.fn() }),
    _store: store,
  } as any;
}

function makeOutput() {
  const chunks: string[] = [];
  const errors: string[] = [];
  return {
    chunks,
    errors,
    appendAiChunk: jest.fn((c: string) => chunks.push(c)),
    aiDone: jest.fn(),
    aiError: jest.fn((m: string) => errors.push(m)),
  };
}

function setProvider(provider: string, extra: Record<string, any> = {}) {
  (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
    get: jest.fn((key: string, def: any) => {
      if (key === 'provider') return provider;
      if (key in extra) return extra[key];
      return def;
    }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  setProvider('copilot');
});

describe('AiRunner integration - provider switching', () => {
  it('set Claude key → run with Claude → secrets.get called with Claude key name', async () => {
    setProvider('claude', { claudeModel: 'claude-sonnet-4-6' });
    const secrets = makeSecrets();
    const runner = new AiRunner(secrets);
    await runner.setClaudeKey('my-claude-key');
    const output = makeOutput();
    await runner.run(phase0, 'prompt', output);
    expect(secrets.get).toHaveBeenCalledWith('aiNativeDevOps.claudeApiKey');
  });

  it('set OpenAI key → run with OpenAI → secrets.get called with OpenAI key name', async () => {
    setProvider('openai', { openaiModel: 'gpt-4o' });
    const secrets = makeSecrets();
    const runner = new AiRunner(secrets);
    await runner.setOpenAiKey('my-openai-key');
    const output = makeOutput();
    await runner.run(phase0, 'prompt', output);
    expect(secrets.get).toHaveBeenCalledWith('aiNativeDevOps.openaiApiKey');
  });

  it('delete Claude key → run with Claude → error returned to output', async () => {
    setProvider('claude', { claudeModel: 'claude-sonnet-4-6' });
    const secrets = makeSecrets({ 'aiNativeDevOps.claudeApiKey': 'old-key' });
    const runner = new AiRunner(secrets);
    await runner.deleteClaudeKey();
    const output = makeOutput();
    await runner.run(phase0, 'prompt', output);
    expect(output.errors.length).toBeGreaterThan(0);
    expect(output.errors[0]).toContain('No Anthropic API key');
  });

  it('Copilot provider uses lm.selectChatModels', async () => {
    setProvider('copilot');
    const secrets = makeSecrets();
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'prompt', output);
    expect(vscode.lm.selectChatModels).toHaveBeenCalledWith({ vendor: 'copilot' });
    expect(output.errors).toHaveLength(0);
  });
});

describe('AiRunner integration - Claude streaming', () => {
  it('chunks are accumulated in order on output sink', async () => {
    setProvider('claude', { claudeModel: 'claude-sonnet-4-6' });
    const secrets = makeSecrets({ 'aiNativeDevOps.claudeApiKey': 'test-key' });
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'prompt', output);
    // Mock stream yields 'Hello' then ' World' (from __mocks__/@anthropic-ai/sdk.ts)
    expect(output.chunks.indexOf('Hello')).toBeLessThan(output.chunks.indexOf(' World'));
  });

  it('aiDone called once after Claude streaming', async () => {
    setProvider('claude', { claudeModel: 'claude-sonnet-4-6' });
    const secrets = makeSecrets({ 'aiNativeDevOps.claudeApiKey': 'test-key' });
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'prompt', output);
    expect(output.aiDone).toHaveBeenCalledTimes(1);
  });
});

describe('AiRunner integration - OpenAI streaming', () => {
  it('delta content extracted from choices[0].delta.content', async () => {
    setProvider('openai', { openaiModel: 'gpt-4o' });
    const secrets = makeSecrets({ 'aiNativeDevOps.openaiApiKey': 'test-key' });
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'prompt', output);
    // Mock yields 'mock ' and 'openai response'
    expect(output.chunks).toContain('mock ');
    expect(output.chunks).toContain('openai response');
  });

  it('aiDone called once after OpenAI streaming', async () => {
    setProvider('openai', { openaiModel: 'gpt-4o' });
    const secrets = makeSecrets({ 'aiNativeDevOps.openaiApiKey': 'test-key' });
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'prompt', output);
    expect(output.aiDone).toHaveBeenCalledTimes(1);
  });
});

describe('AiRunner integration - unknown provider', () => {
  it('unknown provider logs error without throwing', async () => {
    setProvider('ftp');
    const secrets = makeSecrets();
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await expect(runner.run(phase0, 'prompt', output)).resolves.not.toThrow();
    expect(output.errors.length).toBeGreaterThan(0);
  });
});
