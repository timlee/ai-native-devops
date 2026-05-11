import { PHASES, Phase } from '../../src/phases';

describe('PHASES', () => {
  it('has 10 entries', () => {
    expect(PHASES).toHaveLength(10);
  });

  it('each phase has all required fields', () => {
    const requiredFields: (keyof Phase)[] = [
      'id', 'key', 'label', 'icon', 'lifecycleFile', 'promptFile', 'checklistFile', 'agentFile',
    ];
    for (const phase of PHASES) {
      for (const field of requiredFields) {
        expect(phase[field]).toBeDefined();
        expect(typeof phase[field]).toBe(field === 'id' ? 'number' : 'string');
      }
    }
  });

  it('phase IDs are unique', () => {
    const ids = PHASES.map(p => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('phase keys are unique', () => {
    const keys = PHASES.map(p => p.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('phase 0 is the requirement phase', () => {
    const phase = PHASES.find(p => p.id === 0);
    expect(phase).toBeDefined();
    expect(phase!.key).toBe('requirement');
  });

  it('has code phase with id 3', () => {
    const phase = PHASES.find(p => p.key === 'code');
    expect(phase).toBeDefined();
    expect(phase!.id).toBe(3);
  });

  it('has build phase with id 4', () => {
    const phase = PHASES.find(p => p.key === 'build');
    expect(phase).toBeDefined();
    expect(phase!.id).toBe(4);
  });

  it('has test phase with id 5', () => {
    const phase = PHASES.find(p => p.key === 'test');
    expect(phase).toBeDefined();
    expect(phase!.id).toBe(5);
  });

  it('all lifecycleFile paths start with docs/', () => {
    for (const phase of PHASES) {
      expect(phase.lifecycleFile).toMatch(/^docs\//);
    }
  });

  it('all agentFile paths start with docs/agents/', () => {
    for (const phase of PHASES) {
      expect(phase.agentFile).toMatch(/^docs\/agents\//);
    }
  });
});
