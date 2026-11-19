# dev-tools/

Helpers the **owner** runs on their own machine. The scheduled agents never run anything here, and
nothing in this folder is deployed (the Dockerfile copies only `lib/`, `public/`, `content/` and the server).

## set-x-secrets.mjs

Puts the X (Twitter) API keys into this repo's GitHub Actions secrets, and flips the `X_POSTING` switch
that `.github/workflows/post-to-x.yml` reads. Needs Node 20+ and the GitHub CLI (`gh`) logged in.

```
node dev-tools/set-x-secrets.mjs                 # paste the four keys at hidden prompts, confirm, upload
node dev-tools/set-x-secrets.mjs --posting off   # X_POSTING=off: the Action only prints the post (dry run)
node dev-tools/set-x-secrets.mjs --posting on    # X_POSTING=on: the Action posts to X for real
```

| Secret | Where to find it (X Developer Console → app → Keys & Tokens) |
|---|---|
| `X_API_KEY` | OAuth 1.0 Keys → Consumer Key |
| `X_API_SECRET` | OAuth 1.0 Keys → Consumer Secret |
| `X_ACCESS_TOKEN` | OAuth 1.0 Keys → Access Token (for @gamerinfo_in, Read and write) |
| `X_ACCESS_SECRET` | OAuth 1.0 Keys → Access Token Secret |

- Run it from **cmd, PowerShell or Windows Terminal**. Git Bash's terminal can't hide input, so the script
  refuses to run there.
- Keys are never echoed, never put on a command line and never written to a file; they go to `gh` on stdin.
- Press Enter on an empty prompt to leave that secret unchanged (handy when rotating one key).
- This repo is public: never paste a key into a file, an issue, a commit or a chat.
