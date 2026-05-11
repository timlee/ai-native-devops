/**
 * Integration test: GitHub auth flow
 * Tests the interaction between getGithubToken, getGithubRepoInfo, and githubRequest.
 */
import * as vscode from 'vscode';

jest.mock('child_process');
jest.mock('https');

import * as cp from 'child_process';
import * as https from 'https';
import { getGithubToken, getGithubRepoInfo, githubRequest } from '../../src/githubUtils';

const mockExecSync = cp.execSync as jest.Mock;

function setupHttpsMock(statusCode: number, responseBody: object) {
  let capturedHeaders: any;
  let capturedMethod: string;
  let capturedPath: string;
  let capturedBody = '';
  const writeMock = jest.fn((d: string) => { capturedBody += d; });

  (https.request as jest.Mock).mockImplementation(
    (options: any, callback: (res: any) => void) => {
      capturedHeaders = options.headers;
      capturedMethod = options.method;
      capturedPath = options.path;
      const res = {
        statusCode,
        on: jest.fn((ev: string, fn: any) => {
          if (ev === 'data') fn(JSON.stringify(responseBody));
          if (ev === 'end') fn();
        }),
      };
      callback(res);
      return { on: jest.fn(), write: writeMock, end: jest.fn() };
    }
  );

  return {
    getHeaders: () => capturedHeaders,
    getMethod: () => capturedMethod,
    getPath: () => capturedPath,
    getBody: () => capturedBody,
  };
}

beforeEach(() => jest.clearAllMocks());

describe('GitHub auth flow - token retrieval and usage', () => {
  it('token from getSession appears in Authorization header of githubRequest', async () => {
    const mock = setupHttpsMock(200, { id: 1 });
    (vscode.authentication.getSession as jest.Mock).mockResolvedValue({
      accessToken: 'integration-test-token',
      account: { id: 'user', label: 'User' },
      id: 'session',
      scopes: ['repo'],
    });

    const token = await getGithubToken();
    await githubRequest('GET', '/repos/owner/repo', token);

    expect(mock.getHeaders()['Authorization']).toBe('Bearer integration-test-token');
  });

  it('POST body Content-Length matches actual serialized body size', async () => {
    const mock = setupHttpsMock(201, { id: 42 });
    const token = await getGithubToken();
    const body = { title: 'New Issue', body: 'description here', labels: ['bug'] };

    await githubRequest('POST', '/repos/owner/repo/issues', token, body);

    const expectedPayload = JSON.stringify(body);
    expect(mock.getBody()).toBe(expectedPayload);
    expect(mock.getHeaders()['Content-Length']).toBe(Buffer.byteLength(expectedPayload));
  });

  it('401 response status propagates correctly', async () => {
    setupHttpsMock(401, { message: 'Bad credentials' });
    const token = 'invalid-token';
    const result = await githubRequest<{ message: string }>('GET', '/user', token);
    expect(result.status).toBe(401);
    expect(result.data.message).toBe('Bad credentials');
  });

  it('SECURITY: token is not in the request path', async () => {
    const mock = setupHttpsMock(200, {});
    const token = 'SENSITIVE-SECRET-TOKEN';
    await githubRequest('GET', '/repos/owner/repo', token);
    expect(mock.getPath()).not.toContain('SENSITIVE-SECRET-TOKEN');
  });
});

describe('GitHub auth flow - repo info', () => {
  it('getGithubRepoInfo parses remote URL and returns owner/repo', () => {
    mockExecSync.mockReturnValue('https://github.com/myorg/my-repo.git\n');
    const info = getGithubRepoInfo('/repo');
    expect(info).toEqual({ owner: 'myorg', repo: 'my-repo' });
  });

  it('getGithubRepoInfo with SSH URL', () => {
    mockExecSync.mockReturnValue('git@github.com:myorg/my-repo.git\n');
    const info = getGithubRepoInfo('/repo');
    expect(info).toEqual({ owner: 'myorg', repo: 'my-repo' });
  });

  it('getGithubRepoInfo returns null when execSync throws', () => {
    mockExecSync.mockImplementation(() => { throw new Error('not a git repo'); });
    expect(getGithubRepoInfo('/repo')).toBeNull();
  });

  it('repo info and token can be used together to make an API request', async () => {
    mockExecSync.mockReturnValue('https://github.com/myorg/my-repo.git\n');
    setupHttpsMock(200, { full_name: 'myorg/my-repo' });

    const info = getGithubRepoInfo('/repo');
    const token = await getGithubToken();
    const result = await githubRequest<{ full_name: string }>(
      'GET', `/repos/${info!.owner}/${info!.repo}`, token
    );

    expect(result.status).toBe(200);
    expect(result.data.full_name).toBe('myorg/my-repo');
  });
});
