// Owner-only helper: puts the X (Twitter) API keys into this repo's GitHub Actions secrets with the gh CLI,
// and flips the X_POSTING switch. Never run by the agents. Zero dependencies (Node 20+), needs `gh` logged in.
//
//   node dev-tools/set-x-secrets.mjs                 paste the four keys (hidden), confirm, upload
//   node dev-tools/set-x-secrets.mjs --posting off   set the repo variable X_POSTING (dry run)
//   node dev-tools/set-x-secrets.mjs --posting on    set X_POSTING=on (the Action posts for real)
//
// Keys are typed or pasted at hidden prompts and handed to `gh secret set` on stdin: never echoed, never put on
// a command line (other processes can read those), never written to a file. Run it from cmd, PowerShell or
// Windows Terminal; Git Bash's terminal can't hide input, so the script refuses to run there.
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';

const REPO = 'SahilRS200/gta6-static';
const SECRETS = [
  ['X_API_KEY', 'Consumer Key (OAuth 1.0 Keys)'],
  ['X_API_SECRET', 'Consumer Secret (OAuth 1.0 Keys)'],
  ['X_ACCESS_TOKEN', 'Access Token for @gamerinfo_in (OAuth 1.0 Keys)'],
  ['X_ACCESS_SECRET', 'Access Token Secret for @gamerinfo_in (OAuth 1.0 Keys)'],
];
const MIN_LENGTH = 15;

const gh = (args, input) => spawnSync('gh', args, { input, encoding: 'utf8', stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'] });

const fail = (msg) => { console.error(`\n${msg}`); process.exit(1); };

// Reads one line without echoing it. Ctrl+C aborts; Backspace works; a paste arrives as one chunk.
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

const ask = (question) => new Promise((resolve) => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
});

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

const setSecrets = async () => {
  if (!process.stdin.isTTY) fail('Run this from cmd, PowerShell or Windows Terminal: this terminal cannot hide what you type.');
  checkGh();
  console.log(`Paste each X key for ${REPO}. Input is hidden. Press Enter on an empty line to keep a secret as it is.\n`);
  const values = [];
  for (const [name, label] of SECRETS) {
    const value = await askHidden(`${name}  — ${label}: `);
    if (!value) continue;
    if (/\s/.test(value)) fail(`${name} contains spaces or line breaks; copy it again. Nothing was uploaded.`);
    if (value.length < MIN_LENGTH) fail(`${name} is only ${value.length} characters; that doesn't look like a full key. Nothing was uploaded.`);
    values.push([name, value]);
  }
  if (!values.length) { console.log('\nNothing to update.'); return; }
  console.log(`\nAbout to update on ${REPO}:`);
  for (const [name, value] of values) console.log(`  ${name}  (${value.length} characters)`);
  if ((await ask('Upload these? Type "yes" to continue: ')).toLowerCase() !== 'yes') { console.log('Cancelled. Nothing was uploaded.'); return; }
  for (const [name, value] of values) {
    const res = gh(['secret', 'set', name, '-R', REPO], value);
    if (res.status !== 0) fail(`Failed to set ${name}: ${res.stderr.trim()}`);
    console.log(`  ✓ ${name}`);
  }
  const list = gh(['secret', 'list', '-R', REPO]);
  console.log(`\nSecrets now on ${REPO} (names only):\n${list.stdout.trim()}`);
};

const flag = process.argv.indexOf('--posting');
if (flag !== -1) setPosting(process.argv[flag + 1]);
else await setSecrets();
