import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

import { escapeHtml, mdToHtml, readPhaseFile, readPhaseRequirements, ensureTextFile } from '../../src/phasePanel';
import { PHASES } from '../../src/phases';

beforeEach(() => jest.clearAllMocks());

// ── escapeHtml ───────────────────────────────────────────────────────────────

describe('escapeHtml', () => {
  it('encodes ampersand', () => expect(escapeHtml('a & b')).toBe('a &amp; b'));
  it('encodes less-than', () => expect(escapeHtml('<div>')).toBe('&lt;div&gt;'));
  it('encodes greater-than', () => expect(escapeHtml('a>b')).toBe('a&gt;b'));
  it('encodes double quote', () => expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;'));
  it('encodes all special chars together', () => {
    expect(escapeHtml('<script>"alert(1)"</script>&')).toBe(
      '&lt;script&gt;&quot;alert(1)&quot;&lt;/script&gt;&amp;'
    );
  });
  it('returns empty string for empty input', () => expect(escapeHtml('')).toBe(''));
  it('returns unchanged string when no special chars', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

// ── mdToHtml ─────────────────────────────────────────────────────────────────

describe('mdToHtml', () => {
  it('converts # heading to h1', () => {
    expect(mdToHtml('# Title')).toContain('<h1>Title</h1>');
  });

  it('converts ## heading to h2', () => {
    expect(mdToHtml('## Section')).toContain('<h2>Section</h2>');
  });

  it('converts #### heading to h4', () => {
    expect(mdToHtml('#### Deep')).toContain('<h4>Deep</h4>');
  });

  it('converts **bold** to <strong>', () => {
    expect(mdToHtml('**bold text**')).toContain('<strong>bold text</strong>');
  });

  it('converts `inline code` to <code>', () => {
    expect(mdToHtml('Use `npm install`')).toContain('<code>npm install</code>');
  });

  it('converts fenced code block to <pre><code>', () => {
    const result = mdToHtml('```js\nconsole.log("hi");\n```');
    expect(result).toContain('<pre><code');
    expect(result).toContain('</code></pre>');
  });

  it('escapes code inside fenced blocks', () => {
    const result = mdToHtml('```\n<script>\n```');
    expect(result).toContain('&lt;script&gt;');
  });

  it('converts - bullet to <ul><li>', () => {
    const result = mdToHtml('- item one\n- item two');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>item one</li>');
    expect(result).toContain('<li>item two</li>');
    expect(result).toContain('</ul>');
  });

  it('converts --- to <hr/>', () => {
    expect(mdToHtml('---')).toContain('<hr/>');
  });

  it('handles empty string input by returning empty paragraph', () => {
    expect(mdToHtml('')).toBe('<p></p>');
  });
});

// ── readPhaseFile ────────────────────────────────────────────────────────────

describe('readPhaseFile', () => {
  it('returns file content when file exists', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('# Hello\n- item');
    const result = readPhaseFile('/repo', 'docs/lifecycle/00-requirement.md');
    expect(result).toBe('# Hello\n- item');
  });

  it('returns null when file does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    const result = readPhaseFile('/repo', 'docs/lifecycle/00-requirement.md');
    expect(result).toBeNull();
  });

  it('returns null when relativePath is undefined', () => {
    const result = readPhaseFile('/repo', undefined as any);
    expect(result).toBeNull();
  });

  it('returns null when relativePath is empty string', () => {
    const result = readPhaseFile('/repo', '');
    expect(result).toBeNull();
  });

  it('joins repoRoot and relativePath correctly', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('content');
    readPhaseFile('/repo', 'docs/file.md');
    expect(mockFs.existsSync).toHaveBeenCalledWith(path.join('/repo', 'docs/file.md'));
  });
});

// ── readPhaseRequirements ────────────────────────────────────────────────────

describe('readPhaseRequirements', () => {
  const phase = PHASES.find(p => p.id === 0)!;

  const lifecycleContent = `
## Repository Directories

- plan/
- docs/lifecycle/

## Mandatory Input Files

- plan/backlog-items.md

## Required Output Files

- plan/product-requirements.md
`;

  const promptContent = `
## Repository Directories

- plan/

## Mandatory Input Files

- plan/user-stories.md

## Required Output Files

- plan/acceptance-criteria.md
`;

  it('parses directories from lifecycle and prompt files', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync
      .mockReturnValueOnce(lifecycleContent)
      .mockReturnValueOnce(promptContent);
    const result = readPhaseRequirements('/repo', phase);
    expect(result.repositoryDirectories).toContain('plan/');
    expect(result.repositoryDirectories).toContain('docs/lifecycle/');
  });

  it('deduplicates items that appear in both files', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync
      .mockReturnValueOnce(lifecycleContent)
      .mockReturnValueOnce(promptContent);
    const result = readPhaseRequirements('/repo', phase);
    const planCount = result.repositoryDirectories.filter(d => d === 'plan/').length;
    expect(planCount).toBe(1);
  });

  it('parses mandatory input files from both sources', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync
      .mockReturnValueOnce(lifecycleContent)
      .mockReturnValueOnce(promptContent);
    const result = readPhaseRequirements('/repo', phase);
    expect(result.mandatoryInputFiles).toContain('plan/backlog-items.md');
    expect(result.mandatoryInputFiles).toContain('plan/user-stories.md');
  });

  it('returns empty arrays when files do not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    const result = readPhaseRequirements('/repo', phase);
    expect(result.repositoryDirectories).toEqual([]);
    expect(result.mandatoryInputFiles).toEqual([]);
    expect(result.requiredOutputFiles).toEqual([]);
  });
});

// ── ensureTextFile ───────────────────────────────────────────────────────────

describe('ensureTextFile', () => {
  it('creates dir and file when both are missing', () => {
    mockFs.existsSync.mockReturnValue(false);
    mockFs.mkdirSync.mockReturnValue(undefined as any);
    mockFs.writeFileSync.mockReturnValue(undefined as any);
    ensureTextFile('/repo', 'plan/notes.md', '# Notes');
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      path.dirname(path.join('/repo', 'plan/notes.md')),
      { recursive: true }
    );
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      path.join('/repo', 'plan/notes.md'),
      '# Notes',
      'utf8'
    );
  });

  it('does not overwrite an existing file', () => {
    mockFs.existsSync
      .mockReturnValueOnce(true)  // dir exists
      .mockReturnValueOnce(true); // file exists
    ensureTextFile('/repo', 'plan/notes.md', '# Notes');
    expect(mockFs.writeFileSync).not.toHaveBeenCalled();
  });

  it('returns the full path to the file', () => {
    mockFs.existsSync.mockReturnValue(false);
    mockFs.mkdirSync.mockReturnValue(undefined as any);
    mockFs.writeFileSync.mockReturnValue(undefined as any);
    const result = ensureTextFile('/repo', 'plan/notes.md', '# Notes');
    expect(result).toBe(path.join('/repo', 'plan/notes.md'));
  });
});
