/* Manual mock for the 'vscode' module — used by Jest via moduleNameMapper. */

const workspaceConfig = {
  get: jest.fn(<T>(_key: string, defaultValue?: T) => defaultValue),
  update: jest.fn().mockResolvedValue(undefined),
  inspect: jest.fn(),
  has: jest.fn().mockReturnValue(false),
};

export const workspace = {
  getConfiguration: jest.fn().mockReturnValue(workspaceConfig),
  workspaceFolders: [
    { uri: { fsPath: '/mock/workspace', toString: () => 'file:///mock/workspace' }, name: 'mock', index: 0 },
  ],
  onDidChangeConfiguration: jest.fn().mockReturnValue({ dispose: jest.fn() }),
  openTextDocument: jest.fn().mockResolvedValue({}),
  fs: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    stat: jest.fn(),
  },
};

export const window = {
  showInformationMessage: jest.fn().mockResolvedValue(undefined),
  showErrorMessage: jest.fn().mockResolvedValue(undefined),
  showWarningMessage: jest.fn().mockResolvedValue(undefined),
  showInputBox: jest.fn().mockResolvedValue(undefined),
  showQuickPick: jest.fn().mockResolvedValue(undefined),
  showTextDocument: jest.fn().mockResolvedValue({}),
  createOutputChannel: jest.fn().mockReturnValue({
    appendLine: jest.fn(),
    append: jest.fn(),
    show: jest.fn(),
    dispose: jest.fn(),
    name: 'mock-channel',
  }),
  createWebviewPanel: jest.fn().mockReturnValue({
    webview: {
      html: '',
      onDidReceiveMessage: jest.fn().mockReturnValue({ dispose: jest.fn() }),
      postMessage: jest.fn().mockResolvedValue(true),
      asWebviewUri: jest.fn((uri: any) => uri),
      cspSource: 'mock-csp',
      options: {},
    },
    onDidDispose: jest.fn().mockReturnValue({ dispose: jest.fn() }),
    reveal: jest.fn(),
    dispose: jest.fn(),
    title: '',
    viewColumn: 1,
    active: true,
    visible: true,
  }),
  createStatusBarItem: jest.fn().mockReturnValue({
    text: '',
    command: '',
    tooltip: '',
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn(),
  }),
  registerTreeDataProvider: jest.fn().mockReturnValue({ dispose: jest.fn() }),
  withProgress: jest.fn().mockImplementation((_opts: any, task: any) => task({ report: jest.fn() })),
};

export const commands = {
  registerCommand: jest.fn().mockReturnValue({ dispose: jest.fn() }),
  executeCommand: jest.fn().mockResolvedValue(undefined),
};

export const authentication = {
  getSession: jest.fn().mockResolvedValue({
    accessToken: 'mock-github-token',
    account: { id: 'mock-user', label: 'Mock User' },
    id: 'mock-session-id',
    scopes: ['repo'],
  }),
};

export const lm = {
  selectChatModels: jest.fn().mockImplementation(async () => [
    {
      id: 'mock-copilot-model',
      name: 'Mock Copilot',
      vendor: 'copilot',
      sendRequest: jest.fn().mockImplementation(async () => ({
        text: (async function* () { yield 'mock copilot response'; })(),
      })),
    },
  ]),
};

export class EventEmitter<T = void> {
  private _listeners: Array<(e: T) => void> = [];
  readonly event = (listener: (e: T) => void) => {
    this._listeners.push(listener);
    return { dispose: () => { this._listeners = this._listeners.filter(l => l !== listener); } };
  };
  fire(data: T): void { this._listeners.forEach(l => l(data)); }
  dispose(): void { this._listeners = []; }
}

export class TreeItem {
  label: string | undefined;
  collapsibleState: number | undefined;
  contextValue?: string;
  description?: string;
  tooltip?: any;
  iconPath?: any;
  command?: any;
  resourceUri?: any;
  constructor(label: string | undefined, collapsibleState?: number) {
    this.label = label;
    this.collapsibleState = collapsibleState;
  }
}

export const TreeItemCollapsibleState = { None: 0, Collapsed: 1, Expanded: 2 };
export const ViewColumn = { One: 1, Two: 2, Three: 3, Active: -1, Beside: -2 };
export const StatusBarAlignment = { Left: 1, Right: 2 };
export const ConfigurationTarget = { Global: 1, Workspace: 2, WorkspaceFolder: 3 };

export class ThemeIcon {
  constructor(public id: string, public color?: any) {}
}

export class ThemeColor {
  constructor(public id: string) {}
}

export class MarkdownString {
  isTrusted?: boolean;
  value: string;
  constructor(value = '') { this.value = value; }
  appendMarkdown(md: string): this { this.value += md; return this; }
}

export const Uri = {
  file: jest.fn((p: string) => ({ fsPath: p, scheme: 'file', toString: () => `file://${p}` })),
  parse: jest.fn((s: string) => ({ fsPath: s, scheme: 'file', toString: () => s })),
  joinPath: jest.fn((base: any, ...parts: string[]) => ({
    fsPath: [base.fsPath, ...parts].join('/'),
    scheme: 'file',
    toString: () => `file://${[base.fsPath, ...parts].join('/')}`,
  })),
};

export class CancellationTokenSource {
  token = { isCancellationRequested: false, onCancellationRequested: jest.fn() };
  cancel = jest.fn();
  dispose = jest.fn();
}

export class Disposable {
  constructor(private _fn: () => void) {}
  dispose(): void { this._fn(); }
  static from(...disposables: { dispose(): any }[]): Disposable {
    return new Disposable(() => disposables.forEach(d => d.dispose()));
  }
}

export const LanguageModelChatMessage = {
  User: jest.fn((content: string) => ({ role: 'user', content })),
  Assistant: jest.fn((content: string) => ({ role: 'assistant', content })),
};

export const ExtensionMode = { Production: 1, Development: 2, Test: 3 };

export const env = {
  appName: 'Visual Studio Code',
  openExternal: jest.fn().mockResolvedValue(true),
};

/* Helper used by some tests to reset all mocks between tests */
export function __resetAllMocks(): void {
  (workspace.getConfiguration as jest.Mock).mockReturnValue(workspaceConfig);
  (workspaceConfig.get as jest.Mock).mockImplementation(<T>(_key: string, defaultValue?: T) => defaultValue);
}
