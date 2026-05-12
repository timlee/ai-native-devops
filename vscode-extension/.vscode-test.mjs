import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'test/e2e/workflows/**/*.test.js',
  extensionDevelopmentPath: '.',
  mocha: {
    ui: 'tdd',
    timeout: 60000,
    retries: 1,
  },
});
