import * as vscode from 'vscode';
import { AiRunner, AiOutputSink } from '../../src/aiRunner';
import { PHASES } from '../../src/phases';

const MOCK_CLAUDE_KEY = 'sk-ant-TEST_SECRET_CLAUDE_KEY';
const MOCK_OPENAI_KEY = 'sk-TEST_SECRET_OPENAI_KEY';

function makeSecrets(claudeKey?: string, openaiKey?: string): vscode.SecretStorage {
  return {
    get: jest.fn(async (key: string) => {
      if (key === 'aiNativeDevOps.claudeApiKey') return claudeKey;
      if (key === 'aiNativeDevOps.openaiApiKey') return openaiKey;
      return undefined;
    }),
    store: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    onDidChange: jest.fn().mockReturnValue({ dispose: jest.fn() }),
  } as any;
}

function makeOutput(): AiOutputSink & { chunks: string[]; errors: string[]; done: boolean } {
  const chunks: string[] = [];
  const errors: string[] = [];
  let done = false;
  return {
    chunks,
    errors,
    get done() { return done; },
    appendAiChunk: jest.fn((c: string) => chunks.push(c)),
    aiDone: jest.fn(() => { done = true; }),
    aiError: jest.fn((m: string) => errors.push(m)),
  };
}

const phase0 = PHASES.find(p => p.id === 0)!;

beforeEach(() => {
  jest.clearAllMocks();
  // Default provider = copilot
  (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
    get: jest.fn((key: string, def: any) => {
      if (key === 'provider') return 'copilot';
      if (key === 'claudeModel') return 'claude-sonnet-4-6';
      if (key === 'openaiModel') return 'gpt-4o';
      return def;
    }),
  });
});

// ── Claude provider ──────────────────────────────────────────────────────────

describe('AiRunner - Claude provider', () => {
  beforeEach(() => {
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn((key: string, def: any) => {
        if (key === 'provider') return 'claude';
        if (key === 'claudeModel') return 'claude-sonnet-4-6';
        return def;
      }),
    });
  });

  it('reads from the Claude secret key', async () => {
    const secrets = makeSecrets(MOCK_CLAUDE_KEY);
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'test prompt', output);
    expect(secrets.get).toHaveBeenCalledWith('aiNativeDevOps.claudeApiKey');
  });

  it('calls aiError when no Claude key is stored', async () => {
    const secrets = makeSecrets(undefined);
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'test prompt', output);
    expect(output.errors.length).toBeGreaterThan(0);
    expect(output.errors[0]).toContain('No Anthropic API key');
  });

  it('accumulates streaming chunks in order', async () => {
    const secrets = makeSecrets(MOCK_CLAUDE_KEY);
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'test prompt', output);
    // Mock stream yields 'Hello' and ' World'
    expect(output.chunks).toContain('Hello');
    expect(output.chunks).toContain(' World');
  });

  it('calls aiDone exactly once after streaming', async () => {
    const secrets = makeSecrets(MOCK_CLAUDE_KEY);
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'test prompt', output);
    expect(output.aiDone).toHaveBeenCalledTimes(1);
  });

  it('SECURITY: Claude key value does not appear in any output sink call', async () => {
    const secrets = makeSecrets(MOCK_CLAUDE_KEY);
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'test prompt', output);
    const allOutputArgs = [
      ...output.chunks,
      ...output.errors,
    ].join('');
    expect(allOutputArgs).not.toContain(MOCK_CLAUDE_KEY);
  });

  it('SECURITY: Claude provider does not read the OpenAI key', async () => {
    const secrets = makeSecrets(MOCK_CLAUDE_KEY, MOCK_OPENAI_KEY);
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'test prompt', output);
    const getCalls = (secrets.get as jest.Mock).mock.calls.map((c: any[]) => c[0]);
    expect(getCalls).not.toContain('aiNativeDevOps.openaiApiKey');
  });
});

// ── OpenAI provider ──────────────────────────────────────────────────────────

describe('AiRunner - OpenAI provider', () => {
  beforeEach(() => {
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn((key: string, def: any) => {
        if (key === 'provider') return 'openai';
        if (key === 'openaiModel') return 'gpt-4o';
        return def;
      }),
    });
  });

  it('reads from the OpenAI secret key', async () => {
    const secrets = makeSecrets(undefined, MOCK_OPENAI_KEY);
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'test prompt', output);
    expect(secrets.get).toHaveBeenCalledWith('aiNativeDevOps.openaiApiKey');
  });

  it('calls aiError when no OpenAI key is stored', async () => {
    const secrets = makeSecrets(undefined, undefined);
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'test prompt', output);
    expect(output.errors.length).toBeGreaterThan(0);
    expect(output.errors[0]).toContain('No OpenAI API key');
  });

  it('accumulates OpenAI streaming chunks', async () => {
    const secrets = makeSecrets(undefined, MOCK_OPENAI_KEY);
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'test prompt', output);
    expect(output.chunks.length).toBeGreaterThan(0);
  });

  it('calls aiDone exactly once', async () => {
    const secrets = makeSecrets(undefined, MOCK_OPENAI_KEY);
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'test prompt', output);
    expect(output.aiDone).toHaveBeenCalledTimes(1);
  });

  it('SECURITY: OpenAI key does not appear in output sink calls', async () => {
    const secrets = makeSecrets(undefined, MOCK_OPENAI_KEY);
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'test prompt', output);
    const allOutputArgs = [...output.chunks, ...output.errors].join('');
    expect(allOutputArgs).not.toContain(MOCK_OPENAI_KEY);
  });

  it('SECURITY: OpenAI provider does not read the Claude key', async () => {
    const secrets = makeSecrets(MOCK_CLAUDE_KEY, MOCK_OPENAI_KEY);
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'test prompt', output);
    const getCalls = (secrets.get as jest.Mock).mock.calls.map((c: any[]) => c[0]);
    expect(getCalls).not.toContain('aiNativeDevOps.claudeApiKey');
  });
});

// ── Copilot provider ─────────────────────────────────────────────────────────

describe('AiRunner - Copilot provider', () => {
  it('calls vscode.lm.selectChatModels with vendor copilot', async () => {
    const secrets = makeSecrets();
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'test prompt', output);
    expect(vscode.lm.selectChatModels).toHaveBeenCalledWith({ vendor: 'copilot' });
  });

  it('calls aiError when no Copilot models are available', async () => {
    (vscode.lm.selectChatModels as jest.Mock).mockResolvedValueOnce([]);
    const secrets = makeSecrets();
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'test prompt', output);
    expect(output.errors.length).toBeGreaterThan(0);
    expect(output.errors[0]).toContain('GitHub Copilot Chat');
  });

  it('calls aiDone after successful Copilot streaming', async () => {
    const secrets = makeSecrets();
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'test prompt', output);
    expect(output.aiDone).toHaveBeenCalledTimes(1);
  });
});

// ── Unknown provider ─────────────────────────────────────────────────────────

describe('AiRunner - unknown provider', () => {
  it('calls aiError for an unrecognized provider', async () => {
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn((key: string, def: any) => key === 'provider' ? 'unknown-provider' : def),
    });
    const secrets = makeSecrets();
    const runner = new AiRunner(secrets);
    const output = makeOutput();
    await runner.run(phase0, 'test prompt', output);
    expect(output.errors.length).toBeGreaterThan(0);
    expect(output.errors[0]).toContain('Unknown provider');
  });
});

// ── Key management ───────────────────────────────────────────────────────────

describe('AiRunner - key management', () => {
  it('setClaudeKey stores with the correct secret key name', async () => {
    const secrets = makeSecrets();
    const runner = new AiRunner(secrets);
    await runner.setClaudeKey('new-claude-key');
    expect(secrets.store).toHaveBeenCalledWith('aiNativeDevOps.claudeApiKey', 'new-claude-key');
  });

  it('setOpenAiKey stores with the correct secret key name', async () => {
    const secrets = makeSecrets();
    const runner = new AiRunner(secrets);
    await runner.setOpenAiKey('new-openai-key');
    expect(secrets.store).toHaveBeenCalledWith('aiNativeDevOps.openaiApiKey', 'new-openai-key');
  });

  it('deleteClaudeKey deletes with the correct secret key name', async () => {
    const secrets = makeSecrets();
    const runner = new AiRunner(secrets);
    await runner.deleteClaudeKey();
    expect(secrets.delete).toHaveBeenCalledWith('aiNativeDevOps.claudeApiKey');
  });

  it('deleteOpenAiKey deletes with the correct secret key name', async () => {
    const secrets = makeSecrets();
    const runner = new AiRunner(secrets);
    await runner.deleteOpenAiKey();
    expect(secrets.delete).toHaveBeenCalledWith('aiNativeDevOps.openaiApiKey');
  });

  it('SECURITY: after deleteClaudeKey, run produces No Anthropic API key error', async () => {
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn((key: string, def: any) => key === 'provider' ? 'claude' : def),
    });
    const secrets = makeSecrets(undefined);
    const runner = new AiRunner(secrets);
    await runner.deleteClaudeKey();
    const output = makeOutput();
    await runner.run(phase0, 'prompt', output);
    expect(output.errors[0]).toContain('No Anthropic API key');
  });
});
