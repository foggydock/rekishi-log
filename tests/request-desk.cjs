const assert = require('node:assert');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');

assert.match(html, /id="v-request"/);
assert.match(html, /id="request-text"/);
assert.match(html, /id="request-prompt" readonly/);
assert.match(html, /id="btn-copy-request"/);
assert.match(html, /id="btn-open-codex"/);
assert.match(html, /const REQUEST_WORKDIR = '\/Users\/okanoyouhei\/claude_work2\/history-db';/);
assert.match(html, /const REQUEST_MISTAKE_DIR = '\/Users\/okanoyouhei\/Library\/Mobile Documents\/iCloud~md~obsidian\/Documents\/ObsidianVault\/mistake';/);
assert.match(html, /自動送信・自動実行・保存はしません/);
assert.match(html, /push直前に私の明確な了承を得てください/);
assert.match(html, /navigator\.clipboard\.writeText\(prompt\.value\)/);
assert.match(html, /function buildCodexRequestUrl\(\)/);
assert.match(html, /new URLSearchParams\(\{ path:REQUEST_WORKDIR, prompt:\$\('#request-prompt'\)\.value \}\)/);
assert.match(html, /return `codex:\/\/new\?\$\{query\.toString\(\)\}`/);
assert.match(html, /window\.location\.href = buildCodexRequestUrl\(\)/);
assert.match(html, /送信・実行は利用者が確認して行う/);

console.log('PASS: request desk generates a local, reviewable Codex prompt and safely copies or opens it in Codex');
