import * as vscode from 'vscode';
import { LifecycleProvider, LifecycleTreeItem } from '../../src/lifecycleProvider';
import { PHASES } from '../../src/phases';

function makeContext(): vscode.ExtensionContext {
  return {
    extensionPath: '/mock/extension',
    subscriptions: [],
    globalState: { get: jest.fn(), update: jest.fn(), keys: jest.fn().mockReturnValue([]) },
    workspaceState: { get: jest.fn(), update: jest.fn(), keys: jest.fn().mockReturnValue([]) },
    secrets: { get: jest.fn(), store: jest.fn(), delete: jest.fn(), onDidChange: jest.fn() },
    extensionUri: vscode.Uri.file('/mock/extension'),
    environmentVariableCollection: {} as any,
    storagePath: '/mock/storage',
    globalStoragePath: '/mock/global-storage',
    logPath: '/mock/log',
    storageUri: vscode.Uri.file('/mock/storage'),
    globalStorageUri: vscode.Uri.file('/mock/global-storage'),
    logUri: vscode.Uri.file('/mock/log'),
    extensionMode: 3,
    extension: {} as any,
    asAbsolutePath: jest.fn((p: string) => `/mock/extension/${p}`),
    languageModelAccessInformation: {} as any,
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
    get: jest.fn((key: string, def: any) => {
      if (key === 'currentPhase') return 0;
      return def;
    }),
  });
});

describe('LifecycleProvider', () => {
  it('getChildren returns one item per phase in PHASES', () => {
    const provider = new LifecycleProvider(makeContext());
    const items = provider.getChildren();
    expect(items).toHaveLength(PHASES.length);
  });

  it('each item is a LifecycleTreeItem', () => {
    const provider = new LifecycleProvider(makeContext());
    const items = provider.getChildren();
    for (const item of items) {
      expect(item).toBeInstanceOf(LifecycleTreeItem);
    }
  });

  it('item matching currentPhase has description "active"', () => {
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn((key: string, def: any) => key === 'currentPhase' ? 0 : def),
    });
    const provider = new LifecycleProvider(makeContext());
    const items = provider.getChildren();
    const activeItem = items.find(i => i.phase.id === 0);
    expect(activeItem).toBeDefined();
    expect(activeItem!.description).toBe('active');
  });

  it('non-active items have empty description', () => {
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn((key: string, def: any) => key === 'currentPhase' ? 0 : def),
    });
    const provider = new LifecycleProvider(makeContext());
    const items = provider.getChildren();
    const inactiveItem = items.find(i => i.phase.id === 3);
    expect(inactiveItem).toBeDefined();
    expect(inactiveItem!.description).toBe('');
  });

  it('phase 0 item has contextValue "phaseRequirement"', () => {
    const provider = new LifecycleProvider(makeContext());
    const items = provider.getChildren();
    const item = items.find(i => i.phase.id === 0);
    expect(item!.contextValue).toBe('phaseRequirement');
  });

  it('code phase item has contextValue "phaseCode"', () => {
    const provider = new LifecycleProvider(makeContext());
    const items = provider.getChildren();
    const item = items.find(i => i.phase.key === 'code');
    expect(item!.contextValue).toBe('phaseCode');
  });

  it('build phase item has contextValue "phaseBuild"', () => {
    const provider = new LifecycleProvider(makeContext());
    const items = provider.getChildren();
    const item = items.find(i => i.phase.key === 'build');
    expect(item!.contextValue).toBe('phaseBuild');
  });

  it('other phases have contextValue "phase"', () => {
    const provider = new LifecycleProvider(makeContext());
    const items = provider.getChildren();
    const item = items.find(i => i.phase.key === 'test');
    expect(item!.contextValue).toBe('phase');
  });

  it('phase 0 item command is aiNativeDevOps.openRequirement', () => {
    const provider = new LifecycleProvider(makeContext());
    const items = provider.getChildren();
    const item = items.find(i => i.phase.id === 0);
    expect(item!.command!.command).toBe('aiNativeDevOps.openRequirement');
  });

  it('code phase item command is aiNativeDevOps.openCodeWorkflow', () => {
    const provider = new LifecycleProvider(makeContext());
    const items = provider.getChildren();
    const item = items.find(i => i.phase.key === 'code');
    expect(item!.command!.command).toBe('aiNativeDevOps.openCodeWorkflow');
  });

  it('build phase item command is aiNativeDevOps.openBuildWorkflow', () => {
    const provider = new LifecycleProvider(makeContext());
    const items = provider.getChildren();
    const item = items.find(i => i.phase.key === 'build');
    expect(item!.command!.command).toBe('aiNativeDevOps.openBuildWorkflow');
  });

  it('other phases use aiNativeDevOps.openPhase command', () => {
    const provider = new LifecycleProvider(makeContext());
    const items = provider.getChildren();
    const item = items.find(i => i.phase.key === 'test');
    expect(item!.command!.command).toBe('aiNativeDevOps.openPhase');
  });

  it('refresh fires onDidChangeTreeData event', () => {
    const provider = new LifecycleProvider(makeContext());
    const listener = jest.fn();
    provider.onDidChangeTreeData(listener);
    provider.refresh();
    expect(listener).toHaveBeenCalled();
  });

  it('getTreeItem returns the element as-is', () => {
    const provider = new LifecycleProvider(makeContext());
    const items = provider.getChildren();
    const item = items[0];
    expect(provider.getTreeItem(item)).toBe(item);
  });
});
