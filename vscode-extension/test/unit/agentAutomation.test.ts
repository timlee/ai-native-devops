import {
  AGENT_AUTOMATION_SPECS,
  getAgentSpecByPhase,
  buildAutomationPrompt,
} from '../../src/agentAutomation';
import { PHASES } from '../../src/phases';

describe('getAgentSpecByPhase', () => {
  it('returns the correct spec for phase 0 (requirement)', () => {
    const spec = getAgentSpecByPhase(0);
    expect(spec).toBeDefined();
    expect(spec!.agentName).toBe('REQUIREMENT agent');
    expect(spec!.phaseKey).toBe('requirement');
  });

  it('returns the correct spec for phase 3 (code)', () => {
    const spec = getAgentSpecByPhase(3);
    expect(spec).toBeDefined();
    expect(spec!.phaseKey).toBe('code');
  });

  it('returns the correct spec for phase 5 (test)', () => {
    const spec = getAgentSpecByPhase(5);
    expect(spec).toBeDefined();
    expect(spec!.agentName).toBe('TEST agent');
  });

  it('returns undefined for an unknown phase ID', () => {
    const spec = getAgentSpecByPhase(99);
    expect(spec).toBeUndefined();
  });

  it('returns undefined for phase ID -1', () => {
    expect(getAgentSpecByPhase(-1)).toBeUndefined();
  });
});

describe('AGENT_AUTOMATION_SPECS', () => {
  it('each spec has at least one trigger', () => {
    for (const spec of AGENT_AUTOMATION_SPECS) {
      expect(spec.triggers.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('each trigger has id, label, and description', () => {
    for (const spec of AGENT_AUTOMATION_SPECS) {
      for (const trigger of spec.triggers) {
        expect(typeof trigger.id).toBe('string');
        expect(typeof trigger.label).toBe('string');
        expect(typeof trigger.description).toBe('string');
      }
    }
  });

  it('the secure-comply spec has a decisionPolicy', () => {
    const spec = getAgentSpecByPhase(6);
    expect(spec).toBeDefined();
    expect(spec!.decisionPolicy).toBeDefined();
    expect(spec!.decisionPolicy!.length).toBeGreaterThan(0);
  });
});

describe('buildAutomationPrompt', () => {
  const phase = PHASES.find(p => p.id === 0)!;
  const spec = getAgentSpecByPhase(0)!;
  const trigger = spec.triggers[0];
  const context = 'User must authenticate with MFA';

  it('output contains the agent name', () => {
    const prompt = buildAutomationPrompt(phase, spec, trigger, context);
    expect(prompt).toContain('REQUIREMENT agent');
  });

  it('output contains the objective', () => {
    const prompt = buildAutomationPrompt(phase, spec, trigger, context);
    expect(prompt).toContain(spec.objective);
  });

  it('output contains the trigger label', () => {
    const prompt = buildAutomationPrompt(phase, spec, trigger, context);
    expect(prompt).toContain(trigger.label);
  });

  it('output contains the request context', () => {
    const prompt = buildAutomationPrompt(phase, spec, trigger, context);
    expect(prompt).toContain(context);
  });

  it('output contains all required sections', () => {
    const prompt = buildAutomationPrompt(phase, spec, trigger, context);
    expect(prompt).toContain('Objective:');
    expect(prompt).toContain('Request Context:');
    expect(prompt).toContain('Repository Directories:');
    expect(prompt).toContain('Mandatory Input Files:');
    expect(prompt).toContain('Execute this automation workflow:');
    expect(prompt).toContain('Required Output Sections');
    expect(prompt).toContain('Expected Artifacts');
    expect(prompt).toContain('Required Controls:');
    expect(prompt).toContain('Exit Criteria');
  });

  it('numbered workflow steps appear in output', () => {
    const prompt = buildAutomationPrompt(phase, spec, trigger, context);
    expect(prompt).toContain('1. ');
    expect(prompt).toContain('2. ');
  });

  it('falls back to phase doc paths when requirements is undefined', () => {
    const prompt = buildAutomationPrompt(phase, spec, trigger, context, undefined);
    expect(prompt).toContain(phase.lifecycleFile);
    expect(prompt).toContain(phase.promptFile);
  });

  it('uses provided requirements when given', () => {
    const requirements = {
      repositoryDirectories: ['custom-dir/'],
      mandatoryInputFiles: ['custom-input.md'],
      requiredOutputFiles: ['custom-output.md'],
    };
    const prompt = buildAutomationPrompt(phase, spec, trigger, context, requirements);
    expect(prompt).toContain('custom-dir/');
    expect(prompt).toContain('custom-input.md');
    expect(prompt).toContain('custom-output.md');
  });

  it('includes decision policy for secure-comply phase', () => {
    const securePhase = PHASES.find(p => p.id === 6)!;
    const secureSpec = getAgentSpecByPhase(6)!;
    const secureTrigger = secureSpec.triggers[0];
    const prompt = buildAutomationPrompt(securePhase, secureSpec, secureTrigger, 'security findings');
    expect(prompt).toContain('Automation Policy:');
    expect(prompt).toContain('Critical:');
  });

  it('does not include automation policy for phases without decisionPolicy', () => {
    const prompt = buildAutomationPrompt(phase, spec, trigger, context);
    expect(prompt).not.toContain('Automation Policy:');
  });
});
