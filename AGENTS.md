# Agent Security Rules

These rules apply to all AI agents working in this workspace. They are **mandatory** and must be followed at all times.

---

## 🔒 1. Protected Files — Do NOT Read or Modify

The following files and directories contain sensitive data and must **never** be read, modified, logged, or used in any tool call:

- **`.env`** — Contains API keys, secrets, and environment variables
- **`.env.*`** — All environment file variants (`.env.local`, `.env.production`, etc.)
- **`*.pem`**, **`*.key`**, **`*.crt`** — Private keys and certificates
- **`secrets/`** — Any directory named `secrets`
- **`credentials.json`**, **`token.json`** — OAuth and service account files
- **`config/database.*`** — Database connection configs with credentials

> [!CAUTION]
> **Never** output, log, or include the content of any protected file in a response, code snippet, or tool argument. Treat them as strictly off-limits.

### What to Do Instead

If a task requires environment variables:
- Reference the variable **by name only** (e.g., `process.env.API_KEY`)
- Ask the user to provide the value directly if needed
- Suggest using a `.env.example` file as a safe template

---

## 🚫 2. GitHub Publishing — Do NOT Push or Publish Code

Agents must **never** perform any Git operations that publish, expose, or sync code to remote repositories without explicit user confirmation. Specifically prohibited:

| Action | Rule |
|---|---|
| `git push` | ❌ Never execute without user approval |
| `git push --force` | ❌ Strictly forbidden |
| `gh repo create` | ❌ Never create public repos automatically |
| Publishing secrets in commits | ❌ Strictly forbidden |
| Adding `.env` to a commit | ❌ Strictly forbidden |

### Allowed Git Operations (Local Only)

Agents **may** perform the following local Git operations:
- `git status`, `git log`, `git diff` — Read-only inspection
- `git add`, `git commit` — Stage and commit **after user review**
- `git branch`, `git checkout` — Branch management locally

> [!WARNING]
> Before any `git commit`, verify that no secrets, `.env` files, or credentials are staged. Always check `git diff --staged` first.

### `.gitignore` Enforcement

Ensure the following entries always exist in `.gitignore` before any commit:

```
.env
.env.*
*.pem
*.key
*.crt
secrets/
credentials.json
token.json
node_modules/
```

---

## 🛡️ 3. General Security Principles

1. **Least Privilege**: Only access files and directories necessary for the current task.
2. **No Secret Leakage**: Never print, log, or include secrets in any output.
3. **Confirm Before Destructive Actions**: Always ask the user before deleting files, overwriting data, or making irreversible changes.
4. **No Outbound Secrets**: Never send environment variables or credentials to external APIs, URLs, or services.
5. **Audit Trail**: When modifying sensitive configuration, briefly note what was changed and why.

---

*These rules are enforced workspace-wide. When in doubt, ask the user before proceeding.*
