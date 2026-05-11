/**
 * E2E Workflow 3: Webhook Processing Workflow
 * Runs inside a real VS Code Extension Host via @vscode/test-electron.
 */
import * as vscode from 'vscode';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('E2E: Webhook Processing Workflow', () => {
  let tempDir: string;
  let queueFilePath: string;

  suiteSetup(async () => {
    await vscode.extensions.getExtension('ai-native-devops.ai-native-devops')?.activate();

    // Create a temporary queue file
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-native-devops-e2e-'));
    const queueDir = path.join(tempDir, '.ai-native-devops');
    fs.mkdirSync(queueDir, { recursive: true });
    queueFilePath = path.join(queueDir, 'events.jsonl');

    // Configure extension to use this temp queue file
    await vscode.workspace.getConfiguration('aiNativeDevOps').update(
      'webhookQueueFile',
      queueFilePath,
      vscode.ConfigurationTarget.Global
    );
    await vscode.workspace.getConfiguration('aiNativeDevOps').update(
      'enableWebhookPolling',
      false,
      vscode.ConfigurationTarget.Global
    );
  });

  suiteTeardown(async () => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    // Reset configuration
    await vscode.workspace.getConfiguration('aiNativeDevOps').update(
      'webhookQueueFile',
      undefined,
      vscode.ConfigurationTarget.Global
    );
  });

  test('processWebhookQueue command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('aiNativeDevOps.processWebhookQueue'),
      'aiNativeDevOps.processWebhookQueue should be a registered command'
    );
  });

  test('processWebhookQueue executes without throwing on empty queue', async () => {
    fs.writeFileSync(queueFilePath, '', 'utf8');
    await assert.doesNotReject(
      vscode.commands.executeCommand('aiNativeDevOps.processWebhookQueue'),
      'processWebhookQueue should not throw on empty queue'
    );
  });

  test('processWebhookQueue handles a valid Phase 0 event without throwing', async () => {
    const event = {
      id: 'e2e-test-001',
      timestamp: new Date().toISOString(),
      source: 'e2e-test',
      phaseId: 0,
      triggerId: 'manual_input',
      title: 'E2E test requirement',
      context: 'Automated E2E test context',
    };
    fs.writeFileSync(queueFilePath, JSON.stringify(event) + '\n', 'utf8');

    await assert.doesNotReject(
      vscode.commands.executeCommand('aiNativeDevOps.processWebhookQueue'),
      'processWebhookQueue should process a valid event without throwing'
    );
  });

  test('scaffoldGithubWebhookWorkflows command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('aiNativeDevOps.scaffoldGithubWebhookWorkflows'),
      'scaffoldGithubWebhookWorkflows should be registered'
    );
  });

  test('runAgentAutomation command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('aiNativeDevOps.runAgentAutomation'),
      'runAgentAutomation should be registered'
    );
  });
});
