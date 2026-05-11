/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test/unit', '<rootDir>/test/integration'],
  testPathIgnorePatterns: ['/node_modules/', '/test/e2e/', '/out/'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  moduleNameMapper: {
    '^vscode$': '<rootDir>/test/__mocks__/vscode.ts',
    '^@anthropic-ai/sdk$': '<rootDir>/test/__mocks__/@anthropic-ai/sdk.ts',
    '^openai$': '<rootDir>/test/__mocks__/openai.ts',
  },
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    // Webview panel files and extension entry point require VS Code extension host —
    // they are covered by E2E tests, not unit/integration tests.
    '!src/buildPanel.ts',
    '!src/codePanel.ts',
    '!src/requirementPanel.ts',
    '!src/checklistPanel.ts',
    '!src/homePanel.ts',
    '!src/extension.ts',
    // phasePanel.ts: pure utility functions are unit-tested; the webview HTML
    // rendering functions (lines 226-506) require extension host and are E2E tested.
    '!src/phasePanel.ts',
  ],
  coverageThreshold: {
    global: { branches: 80, functions: 85, lines: 85, statements: 85 },
    './src/aiRunner.ts': { branches: 80, functions: 100, lines: 90, statements: 90 },
    './src/githubUtils.ts': { branches: 75, functions: 100, lines: 95, statements: 95 },
    './src/webhookQueue.ts': { branches: 85, functions: 100, lines: 95, statements: 95 },
  },
  maxWorkers: '50%',
  testTimeout: 15000,
};
