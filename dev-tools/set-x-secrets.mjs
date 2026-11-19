// Owner-only helper: puts the X (Twitter) API keys into this repo's GitHub Actions secrets with the gh CLI,
// and flips the X_POSTING switch. Never run by the agents. Zero dependencies (Node 20+), needs `gh` logged in.
//
//   node dev-tools/set-x-secrets.mjs                 paste the four keys (shown, so you can check them), confirm, upload
//   node dev-tools/set-x-secrets.mjs --hidden        same, but nothing is echoed (use when sharing your screen)
//   node dev-tools/set-x-secrets.mjs --posting off   set the repo variable X_POSTING (dry run)
//   node dev-tools/set-x-secrets.mjs --posting on    set X_POSTING=on (the Action posts for real)
//
// Pasted keys are shown by default (owner's choice, 19 Nov 2026) so a wrong paste is caught before upload;
// the screen and scrollback are cleared afterwards. Keys go to `gh secret set` on stdin: never on a command
// line (other processes can read those) and never written to a file.
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';

const REPO = 'SahilRS200/gta6-static';
const SECRETS = [
  ['X_API_KEY', 'Consumer Key (OAuth 1.0 Keys)', 'usually 25 characters'],
  ['X_API_SECRET', 'Consumer Secret (OAuth 1.0 Keys)', 'usually 50 characters'],
  ['X_ACCESS_TOKEN', 'Access Token for @gamerinfo_in (OAuth 1.0 Keys)', 'starts with your account number and a dash'],
  ['X_ACCESS_SECRET', 'Access Token Secret for @gamerinfo_in (OAuth 1.0 Keys)', 'usually 45 characters'],
];
const MIN_LENGTH = 15;
const HIDDEN = process.argv.includes('--hidden');
// Clears the visible screen and, in terminals that support it (Windows Terminal, most others), the scrollback.
const CLEAR_SCREEN = '\x1b[2J\x1b[3J\x1b[H';

const gh = (args, input) => spawnSync('gh', args, { input, encoding: 'utf8', stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'] });

const fail = (msg) => { console.error(`\n${msg}`); process.exit(1); };

// Shape checks shown right after each paste, so a key in the wrong slot is caught before upload.
const shapeWarning = (name, value) => {
  if (name === 'X_API_KEY' && value.length !== 25) return `a Consumer Key is normally 25 characters, this is ${value.length}. Is this the Consumer Secret or the OAuth 2.0 Client Secret?`;
  if (name === 'X_ACCESS_TOKEN' && !/^\d+-[A-Za-z0-9]+$/.test(value)) return 'an OAuth 1.0 Access Token looks like "<account number>-<letters and digits>". Is this the right token?';
  return '';
};

// Reads one line without echoing it (--hidden). Ctrl+C aborts; Backspace works; a paste arrives as one chunk.
const askHidden = (question) => new Promise((resolve) => {
  const { stdin, stdout } = process;
  stdout.write(question);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  let value = '';
  const cleanup = () => { stdin.removeListener('data', onData); stdin.setRawMode(false); stdin.pause(); };
  const onData = (chunk) => {
    for (const ch of chunk) {
      if (ch === '\u0003') { cleanup(); stdout.write('\n'); process.exit(130); }
      if (ch === '\r' || ch === '\n') { cleanup(); stdout.write(value ? '  (received)\n' : '  (skipped)\n'); resolve(value.trim()); return; }
      if (ch === '\u007f' || ch === '\b') { value = value.slice(0, -1); continue; }
      value += ch;
    }
  };
  stdin.on('data', onData);
});

// One readline interface for the whole session, with a queue: lines pasted faster than the prompts appear
// (several keys at once, or a pasted line break) are kept in order instead of being dropped.
let rl = null;
const pending = []; // lines that arrived before a prompt asked for them
const waiters = []; // prompts waiting for a line
const ask = (question) => {
  if (!rl) {
    rl = createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });
    rl.on('line', (line) => { const next = waiters.shift(); if (next) next(line.trim()); else pending.push(line.trim()); });
    rl.on('close', () => { while (waiters.length) waiters.shift()(''); });
  }
  process.stdout.write(question);
  return new Promise((resolve) => { if (pending.length) resolve(pending.shift()); else waiters.push(resolve); });
};
const closeInput = () => { rl?.close(); rl = null; };

const checkGh = () => {
  const status = gh(['auth', 'status']);
  if (status.error) fail('The GitHub CLI (gh) is not installed or not on PATH.');
  if (status.status !== 0) fail('gh is not logged in. Run: gh auth login');
};

const setPosting = (value) => {
  if (!['on', 'off'].includes(value)) fail('Use --posting on or --posting off.');
  checkGh();
  const res = gh(['variable', 'set', 'X_POSTING', '--body', value, '-R', REPO]);
  if (res.status !== 0) fail(`Could not set X_POSTING: ${res.stderr.trim()}`);
  console.log(`X_POSTING is now "${value}" on ${REPO}.${value === 'on' ? ' The next X post goes out for real.' : ' Posts are dry runs (shown in the Action log only).'}`);
};

const clearScreen = (why) => { process.stdout.write(CLEAR_SCREEN); console.log(`(Screen cleared so the keys don't stay visible. ${why})`); };

const setSecrets = async () => {
  if (HIDDEN && !process.stdin.isTTY) fail('--hidden needs cmd, PowerShell or Windows Terminal: this terminal cannot hide what you type.');
  checkGh();
  console.log(`Paste each X key for ${REPO}. ${HIDDEN ? 'Input is hidden.' : 'What you paste is shown so you can check it; the screen is cleared at the end.'}`);
  console.log('Press Enter on an empty line to keep a secret as it is.\n');
  const values = [];
  for (const [name, label, hint] of SECRETS) {
    const value = await (HIDDEN ? askHidden : ask)(`${name}  — ${label}, ${hint}:\n> `);
    if (!value) { if (!HIDDEN) console.log('  (skipped)\n'); continue; }
    if (/\s/.test(value)) fail(`${name} contains spaces or line breaks; copy it again. Nothing was uploaded.`);
    if (value.length < MIN_LENGTH) fail(`${name} is only ${value.length} characters; that doesn't look like a full key. Nothing was uploaded.`);
    const warning = shapeWarning(name, value);
    console.log(`  ${value.length} characters${warning ? `\n  ⚠️  Check: ${warning}` : ' ✓'}\n`);
    values.push([name, value]);
  }
  if (!values.length) { closeInput(); console.log('Nothing to update.'); return; }
  console.log(`About to update on ${REPO}:`);
  for (const [name, value] of values) console.log(`  ${name.padEnd(16)} ${HIDDEN ? '' : `${value}  `}(${value.length} characters)`);
  const answer = await ask('\nUpload these? Type "yes" to continue: ');
  closeInput();
  if (answer.toLowerCase() !== 'yes') {
    if (!HIDDEN) clearScreen('Cancelled. Nothing was uploaded.');
    else console.log('Cancelled. Nothing was uploaded.');
    return;
  }
  const done = [];
  for (const [name, value] of values) {
    const res = gh(['secret', 'set', name, '-R', REPO], value);
    if (res.status !== 0) {
      if (!HIDDEN) clearScreen('An upload failed.');
      fail(`Failed to set ${name}: ${res.stderr.trim()}${done.length ? ` (already updated: ${done.join(', ')})` : ''}`);
    }
    done.push(name);
  }
  if (!HIDDEN) clearScreen('Upload finished.');
  for (const name of done) console.log(`  ✓ ${name}`);
  const list = gh(['secret', 'list', '-R', REPO]);
  console.log(`\nSecrets now on ${REPO} (names only):\n${list.stdout.trim()}`);
  console.log('\nNext: npm run x:check (free) to confirm X accepts them.');
};

const flag = process.argv.indexOf('--posting');
if (flag !== -1) setPosting(process.argv[flag + 1]);
else await setSecrets();
