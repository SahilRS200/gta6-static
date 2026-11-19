// Owner-run check of the X (Twitter) secrets, via .github/workflows/check-x-access.yml (manual trigger only).
// X_CHECK_MODE picks how far it goes (each mode includes the ones before it):
//   free  (default) — no data is returned, so nothing should be billed (pay-per-use bills per post or user
//                     returned):
//                     1. all four secrets present, with the usual shapes (lengths and patterns only);
//                     2. Consumer Key + Secret accepted by X's app sign-in endpoint (oauth2/token);
//                     3. Access Token + Secret accepted: a signed /2/users/me request with a deliberately
//                        invalid field. X checks the signature first: 401 = rejected, expired or revoked;
//                        400 "invalid field" = the keys were accepted and no user data came back.
//   read  — also GET /2/users/me for real: confirms the token acts as @gamerinfo_in (about $0.01).
//   write — also posts a one-line test post and deletes it straight away (about $0.02): the only way to
//           prove posting works for certain.
// Never prints a key or token. Zero dependencies; reuses the signing in tools/post-to-x.mjs.
import { appendFileSync } from 'node:fs';
import { oauthHeader } from './post-to-x.mjs';

const API = 'https://api.x.com/2';
const TOKEN_URL = 'https://api.x.com/oauth2/token';
const HANDLE = 'gamerinfo_in';
const KEY_NAMES = ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_SECRET'];
const MODES = ['free', 'read', 'write'];
const TEST_TEXT = 'Testing our posting setup. This post will be deleted in a few seconds.';
const PROBE_FIELD = 'gta6info_key_check'; // not a real user field: a valid signature gets a 400, never data
const HINTS = {
  401: 'X rejected the keys: wrong, expired or revoked. Check all four come from the same app, and that the Access Token was generated after the Consumer Key was last regenerated (regenerating it invalidates old tokens). Re-run npm run x:secrets.',
  402: 'The X API account is out of credits. Top up in the X Developer Console.',
  403: 'X refused the request. For the write test this usually means the Access Token predates the "Read and write" permission: regenerate it and re-run npm run x:secrets. Also check the app is in a project with API access.',
  429: 'Rate limited. Wait a few minutes and try again.',
};

const log = (line) => {
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n\n`);
};

const readBody = async (res) => {
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, ok: res.ok, json, text, access: res.headers.get('x-access-level') };
};

// Signs with the bare URL and passes the query string separately: OAuth 1.0a signs query parameters too.
const signed = async (method, url, keys, body) => {
  const u = new URL(url);
  const query = Object.fromEntries(u.searchParams);
  return readBody(await fetch(url, {
    method,
    headers: { Authorization: oauthHeader(method, `${u.origin}${u.pathname}`, keys, query), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  }));
};

const detailOf = (r) => r.json?.detail || r.json?.title || r.json?.errors?.[0]?.message || r.text.slice(0, 200);

const explain = (what, r) => {
  log(`❌ ${what}: X API ${r.status} — ${detailOf(r)}`);
  if (HINTS[r.status]) log(`👉 ${HINTS[r.status]}`);
};

// 1. Shapes only (lengths and patterns, never characters), to spot a key pasted into the wrong slot.
const checkShapes = (keys) => {
  log(`ℹ️ ${KEY_NAMES.map((k) => `${k}: ${keys[k].length} chars`).join(' · ')}`);
  const warnings = [];
  if (keys.X_API_KEY.length !== 25) warnings.push(`X_API_KEY is ${keys.X_API_KEY.length} characters; a Consumer Key is normally 25. A secret may be in the key slot.`);
  if (!/^\d+-[A-Za-z0-9]+$/.test(keys.X_ACCESS_TOKEN)) warnings.push('X_ACCESS_TOKEN does not look like an OAuth 1.0a access token ("<numeric account id>-<letters and digits>").');
  if (/\s/.test(Object.values(keys).join(''))) warnings.push('A secret contains spaces or line breaks: copy it again.');
  for (const w of warnings) log(`⚠️ ${w}`);
};

// 2. Consumer Key + Secret: X's app sign-in endpoint answers 200 for a valid pair. The response contains the
// app's Bearer token; it is never printed.
const checkConsumer = async (keys) => {
  const basic = Buffer.from(`${encodeURIComponent(keys.X_API_KEY)}:${encodeURIComponent(keys.X_API_SECRET)}`).toString('base64');
  const r = await readBody(await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: 'grant_type=client_credentials',
  }));
  if (r.ok && r.json?.token_type === 'bearer') { log('✅ Consumer Key + Consumer Secret: accepted by X.'); return true; }
  explain('Consumer Key + Consumer Secret rejected', r);
  return false;
};

// 3. Access Token + Secret: a signed request X must reject with 400 (bad field) once the signature is valid.
const checkUserToken = async (keys) => {
  const r = await signed('GET', `${API}/users/me?user.fields=${PROBE_FIELD}`, keys);
  if (r.status === 400) { log('✅ Access Token + Access Token Secret: accepted by X (the probe returned no data).'); return true; }
  if (r.ok) { log('✅ Access Token + Access Token Secret: accepted by X.'); return true; }
  explain('Access Token + Access Token Secret rejected', r);
  return false;
};

const checkRead = async (keys) => {
  const me = await signed('GET', `${API}/users/me`, keys);
  if (!me.ok) { explain('Read check failed', me); return false; }
  const username = me.json?.data?.username || '';
  if (username.toLowerCase() !== HANDLE) { log(`❌ The token acts as @${username}, not @${HANDLE}. Generate the Access Token while signed in as @${HANDLE}.`); return false; }
  log(`✅ Read works: the token acts as @${username}.`);
  if (me.access) {
    const canWrite = me.access.includes('write');
    log(`${canWrite ? '✅' : '❌'} Access level reported by X: ${me.access}`);
    if (!canWrite) { log('👉 Regenerate the Access Token after setting the app to "Read and write", then re-run npm run x:secrets.'); return false; }
  }
  return true;
};

const checkWrite = async (keys) => {
  const post = await signed('POST', `${API}/tweets`, keys, { text: TEST_TEXT });
  if (!post.ok) { explain('Write test failed', post); return false; }
  const id = post.json?.data?.id;
  log(`✅ Write works: posted test post ${id}.`);
  const del = await signed('DELETE', `${API}/tweets/${id}`, keys);
  if (del.ok && del.json?.data?.deleted) { log('✅ Test post deleted.'); return true; }
  log(`⚠️ Could not delete the test post (X API ${del.status}). Delete it by hand: https://x.com/${HANDLE}/status/${id}`);
  return false;
};

const main = async () => {
  const mode = MODES.includes(process.env.X_CHECK_MODE) ? process.env.X_CHECK_MODE : 'free';
  log(`Mode: ${mode}${mode === 'free' ? ' (no data returned, nothing billed)' : mode === 'read' ? ' (about $0.01)' : ' (posts and deletes a test post, about $0.02)'}`);
  const keys = Object.fromEntries(KEY_NAMES.map((k) => [k, process.env[k] || '']));
  const missing = KEY_NAMES.filter((k) => !keys[k]);
  if (missing.length) { log(`❌ Missing secrets: ${missing.join(', ')}. Run npm run x:secrets.`); process.exitCode = 1; return; }
  log('✅ All four X secrets are set.');
  checkShapes(keys);

  const consumerOk = await checkConsumer(keys);
  const tokenOk = await checkUserToken(keys);
  if (!consumerOk || !tokenOk) {
    if (consumerOk && !tokenOk) log('👉 The Consumer Key/Secret pair is fine, so the Access Token or its Secret is the problem: regenerate the Access Token (Read and write) and re-run npm run x:secrets.');
    process.exitCode = 1;
    return;
  }
  if (mode === 'free') { log('ℹ️ Free mode proves the keys are accepted; it cannot prove posting. Use mode "write" for that.'); return; }
  if (!await checkRead(keys)) { process.exitCode = 1; return; }
  if (mode === 'write' && !await checkWrite(keys)) process.exitCode = 1;
};

main().catch((err) => { log(`❌ ${err.message}`); process.exitCode = 1; });
