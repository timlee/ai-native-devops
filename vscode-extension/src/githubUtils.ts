import * as cp from "child_process";
import * as https from "https";
import * as vscode from "vscode";

export interface RepoInfo { owner: string; repo: string; }

export function getGithubRepoInfo(repoRoot: string): RepoInfo | null {
  try {
    const remoteUrl = cp
      .execSync("git remote get-url origin", { cwd: repoRoot, encoding: "utf8", timeout: 5000 })
      .trim();
    const httpsMatch = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?$/);
    if (httpsMatch) { return { owner: httpsMatch[1], repo: httpsMatch[2] }; }
    const sshMatch = remoteUrl.match(/git@github\.com:([^/]+)\/([^/.]+?)(?:\.git)?$/);
    if (sshMatch) { return { owner: sshMatch[1], repo: sshMatch[2] }; }
  } catch { /* no remote */ }
  return null;
}

export async function getGithubToken(scopes: string[] = ["public_repo", "repo"]): Promise<string> {
  const session = await vscode.authentication.getSession("github", scopes, { createIfNone: true });
  return session.accessToken;
}

export function githubRequest<T>(
  method: string,
  path: string,
  token: string,
  body?: unknown
): Promise<{ status: number; data: T }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const req = https.request(
      {
        hostname: "api.github.com",
        path,
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          "User-Agent": "ai-native-devops-vscode",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => { raw += chunk; });
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw) as T });
          } catch {
            reject(new Error("Failed to parse GitHub API response"));
          }
        });
      }
    );
    req.on("error", reject);
    if (payload) { req.write(payload); }
    req.end();
  });
}
