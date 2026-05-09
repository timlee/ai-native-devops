# Deploy This Repository to GitHub

## 1. Create a GitHub Repository

Create an empty repository on GitHub.

## 2. Initialize and Push

```bash
git init
git add .
git commit -m "Initial AI-native DevOps guidelines"
git branch -M main
git remote add origin git@github.com:<owner>/<repo>.git
git push -u origin main
```

## 3. Enable GitHub Pages

1. Open repository settings.
2. Go to **Pages**.
3. Select **GitHub Actions** as the source.
4. Run the `Deploy Documentation` workflow.

## 4. Enable Protection Rules

Recommended settings:

- Require pull request before merging.
- Require status checks.
- Require code owner review.
- Prevent force pushes.
- Protect production environment.
- Require approval for production deployment.

## 5. Configure AI Tools

Add or verify:

- `AGENTS.md`
- `CLAUDE.md`
- `CODEX.md`
- `.github/copilot-instructions.md`
- Issue templates
- Pull request template
