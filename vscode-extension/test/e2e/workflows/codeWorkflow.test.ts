/**
 * E2E Workflow 2: Code Phase Workflow
 * Runs inside a real VS Code Extension Host via @vscode/test-electron.
 */
import * as vscode from 'vscode';
import * as assert from 'assert';

suite('E2E: Code Phase Workflow', () => {
  suiteSetup(async () => {
    await vscode.extensions.getExtension('ai-native-devops.ai-native-devops')?.activate();
  });

  test('openCodeWorkflow command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('aiNativeDevOps.openCodeWorkflow'),
      'aiNativeDevOps.openCodeWorkflow should be a registered command'
    );
  });

  test('openCodeWorkflow command executes without throwing', async () => {
    const phase = { id: 3, key: 'code', label: '2 · Code', icon: '$(code)',
      lifecycleFile: 'docs/lifecycle/03-code.md',
      promptFile: 'docs/prompts/03-code.md',
      checklistFile: 'docs/checklists/03-code-checklist.md',
      agentFile: 'docs/agents/coding-agent.md' };

    await assert.doesNotReject(
      vscode.commands.executeCommand('aiNativeDevOps.openCodeWorkflow', phase),
      'openCodeWorkflow command should not throw'
    );
  });

  test('generateCodePrTemplate command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('aiNativeDevOps.generateCodePrTemplate'),
      'generateCodePrTemplate should be registered'
    );
  });

  test('scaffoldAgentArtifacts command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('aiNativeDevOps.scaffoldAgentArtifacts'),
      'scaffoldAgentArtifacts should be registered'
    );
  });

  test('selectProvider command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('aiNativeDevOps.selectProvider'),
      'selectProvider should be registered'
    );
  });
});
