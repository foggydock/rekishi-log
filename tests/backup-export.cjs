const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');
const code = html.slice(html.indexOf('function exportFileDate'), html.indexOf('// 削除・統合のように'));
const ctx = vm.createContext({fmtDate:value=>value});
vm.runInContext(code, ctx);

const createdAt = new Date('2026-10-09T03:04:05Z');
const markdown = ctx.buildBackupMd(
  [{id:'a',name:'項目A',summary:'要約'}],
  [{item_id:'a',added_date:'2026-10-01',fact_text:'知識A'}, {item_id:'a',added_date:'2026-10-02',fact_text:'知識B'}],
  createdAt
);
assert.match(markdown, /作成日時（日本時間）/, '作成日時を出力する');
assert.match(markdown, /項目数: 1/, '項目数を出力する');
assert.match(markdown, /知識数: 2/, '知識数を出力する');
assert.match(markdown, /形式: Markdown（\.md）/, '形式を出力する');
assert.match(markdown, /項目A/, '項目の内容を保持する');
assert.equal(ctx.exportFileDate(createdAt), '2026-10-09', 'ファイル名の日付を端末の現地日付で作る');
assert.match(html, /id="export-status"/, '書き出し後の案内欄がある');
assert.match(html, /ブラウザの「ダウンロード」から開き、先頭の件数を確認してください。/, '確認手順を案内する');

console.log('PASS: backup export contains metadata and guides the user to verify it');
