const assert = require('node:assert');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');

assert.match(html, /id="v-request"/);
assert.match(html, /id="request-text"/);
assert.match(html, /id="request-prompt" readonly/);
assert.match(html, /id="btn-copy-request"/);
assert.match(html, /const REQUEST_WORKDIR = '\/Users\/okanoyouhei\/claude_work2\/history-db';/);
assert.match(html, /const REQUEST_MISTAKE_DIR = '\/Users\/okanoyouhei\/Library\/Mobile Documents\/iCloud~md~obsidian\/Documents\/ObsidianVault\/mistake';/);
assert.match(html, /自動送信・自動実行・保存はしません/);
assert.match(html, /push直前に私の明確な了承を得てください/);
assert.match(html, /navigator\.clipboard\.writeText\(prompt\.value\)/);

console.log('PASS: request desk generates a local, reviewable Codex prompt and copies it safely');
