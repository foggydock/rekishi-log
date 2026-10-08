const {readFileSync} = require('node:fs');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');

assert.match(html, /id="btn-paste-draft"/, 'コピー済み文章を取り込む貼り付けボタンがある');
assert.match(html, /navigator\.clipboard\.readText\(\)/, '対応ブラウザではクリップボードを読む');
assert.match(html, /raw\.dispatchEvent\(new Event\('input', \{bubbles:true\}\)\)/,
  '貼り付けた文章も下書きとして保存する');
assert.match(html, /入力欄を長押し／右クリックして貼り付けてください/,
  'クリップボードを読めない端末では手動操作を案内する');

console.log('PASS: copied text can be pasted into the draft with a safe fallback');
