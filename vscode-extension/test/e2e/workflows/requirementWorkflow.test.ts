/**
 * E2E Workflow 1: Requirement Intake
 * Runs inside a real VS Code Extension Host via @vscode/test-electron.
 */
import * as vscode from 'vscode';
import * as assert from 'assert';

suite('E2E: Requirement Intake Workflow', () => {
  suiteSetup(async () => {
    // Wait for extension to activate
    await vscode.extensions.getExtension('ai-native-devops.ai-native-devops')?.activate();
  });

  test('openRequirement command executes without throwing', async () => {
    await assert.doesNotReject(
      vscode.commands.executeCommand('aiNativeDevOps.openRequirement'),
      'openRequirement command should not throw'
    );
  });

  test('openChecklist command executes for phase 0 without throwing', async () => {
    const phase = { id: 0, key: 'requirement', label: '1 · Plan', icon: '$(list-ordered)',
      lifecycleFile: 'docs/lifecycle/00-requirement.md',
      promptFile: 'docs/prompts/00-requirement.md',
      checklistFile: 'docs/checklists/00-requirement-checklist.md',
      agentFile: 'docs/agents/requirement-agent.md' };

    await assert.doesNotReject(
      vscode.commands.executeCommand('aiNativeDevOps.openChecklist', phase),
      'openChecklist command should not throw'
    );
  });

  test('extension contributes the aiNativeDevOps.lifecycle tree view', () => {
    const ext = vscode.extensions.getExtension('ai-native-devops.ai-native-devops');
    assert.ok(ext, 'Extension should be registered');
    const views = ext!.packageJSON?.contributes?.views?.['aiNativeDevOps'];
    assert.ok(Array.isArray(views), 'aiNativeDevOps views should be an array');
    const lifecycleView = views.find((v: any) => v.id === 'aiNativeDevOps.lifecycle');
    assert.ok(lifecycleView, 'aiNativeDevOps.lifecycle view should be contributed');
  });

  test('openPhase command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('aiNativeDevOps.openPhase'),
      'aiNativeDevOps.openPhase should be a registered command'
    );
  });

  test('runPrompt command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('aiNativeDevOps.runPrompt'),
      'aiNativeDevOps.runPrompt should be a registered command'
    );
  });
});
