# social/

`x-post.md` is the next post for X (@gamerinfo_in). **Any commit that changes it posts it**: the GitHub
Action `.github/workflows/post-to-x.yml` reads it and sends it, with no checks of its own.

- Only the hourly news agent writes it, and only in a posting slot (even IST hours 06–22), after
  `node tools/check-x-post.mjs --slot` says so and `node tools/check-x-post.mjs` passes. Rules: the
  "X posts" section of `CLAUDE.md`; the plan: `docs/SOCIAL_X_PLAN.md`.
- Never edit it by hand to fix a typo after it went out: the edit is a new post. Delete the post on X
  instead.
- The posting switch is the repository variable `X_POSTING` (`on` posts; anything else is a dry run that
  prints the post in the Action log).
