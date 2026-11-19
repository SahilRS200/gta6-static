// Posts social/x-post.md to X as @gamerinfo_in. Run by .github/workflows/post-to-x.yml whenever a commit
// changes that file. It has no checks of its own (owner decision): the news agent validates the post with
// tools/check-x-post.mjs before committing it. Dry run unless X_POSTING=on. No retries: an error fails the
// job and GitHub emails the owner. Zero dependencies (Node 20+).
import { readFileSync, appendFileSync } from 'node:fs';
import { createHmac, randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const FILE = 'social/x-post.md';
const ENDPOINT = 'https://api.x.com/2/tweets';
const HANDLE = 'gamerinfo_in';
const KEY_NAMES = ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_SECRET'];

// RFC 3986 percent-encoding, as OAuth 1.0a requires.
const percent = (s) => encodeURIComponent(String(s)).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

// HMAC-SHA1 signature over the method, URL and every OAuth/request parameter, sorted.
const oauthSignature = (method, url, params, consumerSecret, tokenSecret) => {
  const paramString = Object.keys(params).sort().map((k) => `${percent(k)}=${percent(params[k])}`).join('&');
  const base = [method.toUpperCase(), percent(url), percent(paramString)].join('&');
  return createHmac('sha1', `${percent(consumerSecret)}&${percent(tokenSecret)}`).update(base).digest('base64');
};

// OAuth 1.0a user-context header for a JSON POST (a JSON body is not part of the signature).
const oauthHeader = (method, url, keys) => {
  const params = {
    oauth_consumer_key: keys.X_API_KEY,
    oauth_nonce: randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: keys.X_ACCESS_TOKEN,
    oauth_version: '1.0',
  };
  params.oauth_signature = oauthSignature(method, url, params, keys.X_API_SECRET, keys.X_ACCESS_SECRET);
  return `OAuth ${Object.keys(params).sort().map((k) => `${percent(k)}="${percent(params[k])}"`).join(', ')}`;
};

// The post is everything after the front matter (slot/source are the agent's bookkeeping).
const postText = (raw) => raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();

const summary = (line) => { if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`); };

const main = async () => {
  const text = postText(readFileSync(FILE, 'utf8'));
  if (process.env.X_POSTING !== 'on') {
    console.log(`DRY RUN — X_POSTING is not "on", nothing was sent. This would be posted:\n\n${text}`);
    summary(`### Dry run (X_POSTING is not "on")\n\n\`\`\`\n${text}\n\`\`\``);
    return;
  }
  const keys = Object.fromEntries(KEY_NAMES.map((k) => [k, process.env[k] || '']));
  const missing = KEY_NAMES.filter((k) => !keys[k]);
  if (missing.length) throw new Error(`Missing secrets: ${missing.join(', ')}`);
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: oauthHeader('POST', ENDPOINT, keys), 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`X API ${res.status}: ${body}`);
  const url = `https://x.com/${HANDLE}/status/${JSON.parse(body).data.id}`;
  console.log(`Posted: ${url}`);
  summary(`### Posted\n\n${url}`);
};

export { oauthSignature, postText };

// Run only when executed directly (the tests import the helpers).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => { console.error(err.message); process.exitCode = 1; });
}
