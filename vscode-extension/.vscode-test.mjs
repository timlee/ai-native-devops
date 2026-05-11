import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'test/e2e/**/*.test.ts',
  workspaceFolder: '.',
  mocha: {
    ui: 'bdd',
    timeout: 60000,
    retries: 1,
  },
});
