import * as vscode from 'vscode';

jest.mock('child_process');
jest.mock('https');

import * as cp from 'child_process';
import * as https from 'https';
import { getGithubRepoInfo, getGithubToken, githubRequest } from '../../src/githubUtils';

const mockExecSync = cp.execSync as jest.Mock;

beforeEach(() => jest.clearAllMocks());

// ── getGithubRepoInfo ────────────────────────────────────────────────────────

describe('getGithubRepoInfo', () => {
  it('parses HTTPS remote URL with .git suffix', () => {
    mockExecSync.mockReturnValue('https://github.com/owner/my-repo.git\n');
    const info = getGithubRepoInfo('/repo');
    expect(info).toEqual({ owner: 'owner', repo: 'my-repo' });
  });

  it('parses HTTPS remote URL without .git suffix', () => {
    mockExecSync.mockReturnValue('https://github.com/owner/my-repo\n');
    const info = getGithubRepoInfo('/repo');
    expect(info).toEqual({ owner: 'owner', repo: 'my-repo' });
  });

  it('parses SSH remote URL', () => {
    mockExecSync.mockReturnValue('git@github.com:owner/my-repo.git\n');
    const info = getGithubRepoInfo('/repo');
    expect(info).toEqual({ owner: 'owner', repo: 'my-repo' });
  });

  it('returns null when execSync throws', () => {
    mockExecSync.mockImplementation(() => { throw new Error('not a git repo'); });
    const info = getGithubRepoInfo('/repo');
    expect(info).toBeNull();
  });

  it('returns null when remote URL does not match GitHub patterns', () => {
    mockExecSync.mockReturnValue('https://gitlab.com/owner/repo.git\n');
    const info = getGithubRepoInfo('/repo');
    expect(info).toBeNull();
  });

  it('SECURITY: execSync is called with the provided cwd', () => {
    mockExecSync.mockReturnValue('https://github.com/owner/repo.git\n');
    getGithubRepoInfo('/my/repo/root');
    expect(mockExecSync).toHaveBeenCalledWith(
      'git remote get-url origin',
      expect.objectContaining({ cwd: '/my/repo/root' })
    );
  });

  it('SECURITY: execSync is called with a timeout', () => {
    mockExecSync.mockReturnValue('https://github.com/owner/repo.git\n');
    getGithubRepoInfo('/repo');
    expect(mockExecSync).toHaveBeenCalledWith(
      'git remote get-url origin',
      expect.objectContaining({ timeout: 5000 })
    );
  });
});

// ── getGithubToken ───────────────────────────────────────────────────────────

describe('getGithubToken', () => {
  it('calls getSession with github provider and default scopes', async () => {
    const token = await getGithubToken();
    expect(vscode.authentication.getSession).toHaveBeenCalledWith(
      'github',
      expect.arrayContaining(['public_repo', 'repo']),
      { createIfNone: true }
    );
    expect(token).toBe('mock-github-token');
  });

  it('calls getSession with custom scopes', async () => {
    await getGithubToken(['read:user']);
    expect(vscode.authentication.getSession).toHaveBeenCalledWith(
      'github',
      ['read:user'],
      { createIfNone: true }
    );
  });

  it('returns the accessToken from the session', async () => {
    (vscode.authentication.getSession as jest.Mock).mockResolvedValue({
      accessToken: 'custom-token-xyz',
      account: { id: 'user', label: 'User' },
      id: 'session-1',
      scopes: ['repo'],
    });
    const token = await getGithubToken();
    expect(token).toBe('custom-token-xyz');
  });
});

// ── githubRequest ────────────────────────────────────────────────────────────

function setupHttpsMock(statusCode: number, responseBody: object): {
  reqMock: jest.Mock;
  writeMock: jest.Mock;
  endMock: jest.Mock;
} {
  const writeMock = jest.fn();
  const endMock = jest.fn();
  const reqMock = jest.fn();
  const capturedHeaders: Record<string, string> = {};

  (https.request as jest.Mock).mockImplementation(
    (options: any, callback: (res: any) => void) => {
      // Capture headers for assertions
      Object.assign(capturedHeaders, options.headers);

      const resMock = {
        statusCode,
        on: jest.fn((event: string, handler: (...args: any[]) => void) => {
          if (event === 'data') handler(JSON.stringify(responseBody));
          if (event === 'end') handler();
        }),
      };
      callback(resMock);
      return {
        on: jest.fn(),
        write: writeMock,
        end: endMock,
      };
    }
  );

  return { reqMock, writeMock, endMock };
}

describe('githubRequest', () => {
  it('sets Authorization header with Bearer token', async () => {
    let capturedOptions: any;
    (https.request as jest.Mock).mockImplementation(
      (options: any, callback: (res: any) => void) => {
        capturedOptions = options;
        const res = {
          statusCode: 200,
          on: jest.fn((ev: string, fn: any) => {
            if (ev === 'data') fn('{"ok":true}');
            if (ev === 'end') fn();
          }),
        };
        callback(res);
        return { on: jest.fn(), write: jest.fn(), end: jest.fn() };
      }
    );
    await githubRequest('GET', '/repos/owner/repo', 'my-secret-token');
    expect(capturedOptions.headers['Authorization']).toBe('Bearer my-secret-token');
  });

  it('SECURITY: token is in Authorization header only, not in path or body', async () => {
    let capturedPath = '';
    let capturedBody = '';
    const writeMock = jest.fn((data: string) => { capturedBody += data; });
    (https.request as jest.Mock).mockImplementation(
      (options: any, callback: (res: any) => void) => {
        capturedPath = options.path;
        const res = {
          statusCode: 200,
          on: jest.fn((ev: string, fn: any) => {
            if (ev === 'data') fn('{}');
            if (ev === 'end') fn();
          }),
        };
        callback(res);
        return { on: jest.fn(), write: writeMock, end: jest.fn() };
      }
    );
    await githubRequest('POST', '/repos/owner/repo/issues', 'SECRET-TOKEN', { title: 'test' });
    expect(capturedPath).not.toContain('SECRET-TOKEN');
    expect(capturedBody).not.toContain('SECRET-TOKEN');
  });

  it('sets required GitHub API headers', async () => {
    let capturedHeaders: any;
    (https.request as jest.Mock).mockImplementation(
      (options: any, callback: (res: any) => void) => {
        capturedHeaders = options.headers;
        const res = {
          statusCode: 200,
          on: jest.fn((ev: string, fn: any) => {
            if (ev === 'data') fn('{}');
            if (ev === 'end') fn();
          }),
        };
        callback(res);
        return { on: jest.fn(), write: jest.fn(), end: jest.fn() };
      }
    );
    await githubRequest('GET', '/repos/owner/repo', 'token');
    expect(capturedHeaders['Accept']).toBe('application/vnd.github+json');
    expect(capturedHeaders['X-GitHub-Api-Version']).toBe('2022-11-28');
    expect(capturedHeaders['User-Agent']).toBe('ai-native-devops-vscode');
  });

  it('uses api.github.com as hostname', async () => {
    let capturedHostname = '';
    (https.request as jest.Mock).mockImplementation(
      (options: any, callback: (res: any) => void) => {
        capturedHostname = options.hostname;
        const res = {
          statusCode: 200,
          on: jest.fn((ev: string, fn: any) => {
            if (ev === 'data') fn('{}');
            if (ev === 'end') fn();
          }),
        };
        callback(res);
        return { on: jest.fn(), write: jest.fn(), end: jest.fn() };
      }
    );
    await githubRequest('GET', '/repos/owner/repo', 'token');
    expect(capturedHostname).toBe('api.github.com');
  });

  it('resolves with status and parsed data', async () => {
    setupHttpsMock(200, { id: 1, name: 'test-repo' });
    const result = await githubRequest<{ id: number; name: string }>(
      'GET', '/repos/owner/repo', 'token'
    );
    expect(result.status).toBe(200);
    expect(result.data.id).toBe(1);
    expect(result.data.name).toBe('test-repo');
  });

  it('serializes POST body as JSON and sets Content-Length', async () => {
    let capturedHeaders: any;
    const capturedBody: string[] = [];
    (https.request as jest.Mock).mockImplementation(
      (options: any, callback: (res: any) => void) => {
        capturedHeaders = options.headers;
        const res = {
          statusCode: 201,
          on: jest.fn((ev: string, fn: any) => {
            if (ev === 'data') fn('{"id":42}');
            if (ev === 'end') fn();
          }),
        };
        callback(res);
        return {
          on: jest.fn(),
          write: jest.fn((d: string) => capturedBody.push(d)),
          end: jest.fn(),
        };
      }
    );
    const body = { title: 'New Issue', body: 'description' };
    await githubRequest('POST', '/repos/owner/repo/issues', 'token', body);
    const expectedPayload = JSON.stringify(body);
    expect(capturedBody.join('')).toBe(expectedPayload);
    expect(capturedHeaders['Content-Length']).toBe(Buffer.byteLength(expectedPayload));
  });

  it('rejects when response JSON is invalid', async () => {
    (https.request as jest.Mock).mockImplementation(
      (_options: any, callback: (res: any) => void) => {
        const res = {
          statusCode: 200,
          on: jest.fn((ev: string, fn: any) => {
            if (ev === 'data') fn('NOT VALID JSON {{{{');
            if (ev === 'end') fn();
          }),
        };
        callback(res);
        return { on: jest.fn(), write: jest.fn(), end: jest.fn() };
      }
    );
    await expect(githubRequest('GET', '/path', 'token')).rejects.toThrow(
      'Failed to parse GitHub API response'
    );
  });

  it('rejects on network error', async () => {
    (https.request as jest.Mock).mockImplementation(
      (_options: any, _callback: any) => {
        return {
          on: jest.fn((ev: string, fn: any) => {
            if (ev === 'error') fn(new Error('ECONNREFUSED'));
          }),
          write: jest.fn(),
          end: jest.fn(),
        };
      }
    );
    await expect(githubRequest('GET', '/path', 'token')).rejects.toThrow('ECONNREFUSED');
  });
});
