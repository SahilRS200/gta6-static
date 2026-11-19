// Owner-run check of the X (Twitter) secrets, via .github/workflows/check-x-access.yml (manual trigger only).
//   1. All four secrets are set.
//   2. Read: GET /2/users/me signed with them must answer as @gamerinfo_in (about $0.01). Reports the access
//      level X returns, if it returns one.
//   3. Only when X_WRITE_TEST=true: posts a one-line test post and deletes it straight away. That is the only
//      way to prove write access for certain (about $0.02; visible for a second or two).
// Zero dependencies; reuses the signing in tools/post-to-x.mjs.
import { appendFileSync } from 'node:fs';
import { oauthHeader } from './post-to-x.mjs';

const API = 'https://api.x.com/2';
const HANDLE = 'gamerinfo_in';
const KEY_NAMES = ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_SECRET'];
const TEST_TEXT = 'Testing our posting setup. This post will be deleted in a few seconds.';
const HINTS = {
  401: 'The keys were rejected. Check that all four come from the same app, and that the Access Token was generated after the Consumer Key was last regenerated (regenerating it invalidates old tokens). Re-run npm run x:secrets.',
  402: 'The X API account is out of credits. Top up in the X Developer Console.',
  403: 'X refused the request. If this is the write test, the Access Token probably predates the "Read and write" permission: regenerate it and re-run npm run x:secrets. Also check the app is in a project with API access.',
  429: 'Rate limited. Wait a few minutes and try again.',
};

const log = (line) => {
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n\n`);
};

const call = async (method, url, keys, body) => {
  const res = await fetch(url, {
    method,
    headers: { Authorization: oauthHeader(method, url, keys), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, ok: res.ok, json, text, access: res.headers.get('x-access-level') };
};

const explain = (what, r) => {
  const detail = r.json?.detail || r.json?.title || r.json?.errors?.[0]?.message || r.text.slice(0, 200);
  log(`❌ ${what} failed: X API ${r.status} — ${detail}`);
  if (HINTS[r.status]) log(`👉 ${HINTS[r.status]}`);
};

const main = async () => {
  const keys = Object.fromEntries(KEY_NAMES.map((k) => [k, process.env[k] || '']));
  const missing = KEY_NAMES.filter((k) => !keys[k]);
  if (missing.length) { log(`❌ Missing secrets: ${missing.join(', ')}. Run npm run x:secrets.`); process.exitCode = 1; return; }
  log('✅ All four X secrets are set.');

  const me = await call('GET', `${API}/users/me`, keys);
  if (!me.ok) { explain('Read check', me); process.exitCode = 1; return; }
  const username = me.json?.data?.username || '';
  if (username.toLowerCase() !== HANDLE) {
    log(`❌ The token acts as @${username}, not @${HANDLE}. Generate the Access Token while signed in as @${HANDLE}.`);
    process.exitCode = 1;
    return;
  }
  log(`✅ Read works: the token acts as @${username}.`);
  if (me.access) {
    const canWrite = me.access.includes('write');
    log(`${canWrite ? '✅' : '❌'} Access level reported by X: ${me.access}`);
    if (!canWrite) { log('👉 Regenerate the Access Token after setting the app to "Read and write", then re-run npm run x:secrets.'); process.exitCode = 1; return; }
  } else {
    log('ℹ️ X did not report an access level on this request, so only the write test can prove posting works.');
  }

  if (process.env.X_WRITE_TEST !== 'true') { log('ℹ️ Write test skipped. Run this workflow with "write test" ticked to post and delete a test post.'); return; }
  const post = await call('POST', `${API}/tweets`, keys, { text: TEST_TEXT });
  if (!post.ok) { explain('Write test', post); process.exitCode = 1; return; }
  const id = post.json?.data?.id;
  log(`✅ Write works: posted test post ${id}.`);
  const del = await call('DELETE', `${API}/tweets/${id}`, keys);
  if (del.ok && del.json?.data?.deleted) log('✅ Test post deleted.');
  else { log(`⚠️ Could not delete the test post (X API ${del.status}). Delete it by hand: https://x.com/${HANDLE}/status/${id}`); process.exitCode = 1; }
};

main().catch((err) => { log(`❌ ${err.message}`); process.exitCode = 1; });
