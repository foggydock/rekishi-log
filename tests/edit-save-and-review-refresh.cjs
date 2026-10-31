const {readFileSync} = require('node:fs');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');

assert.match(html, /function renderReview\(i, reason=reviewReason\(i\)\)/, '振り返りカードを同じ項目のまま描き直せる');
assert.match(html, /reviewItemId=String\(i\.id\)/, '表示中の振り返り項目を覚える');
assert.match(html, /\.eq\('id', item\.id\)\.eq\('user_id',uid\)\.select\(\)\.maybeSingle\(\)/, '編集保存の対象と保存結果を確認する');
assert.match(html, /保存を確認できませんでした。内容は閉じずに残しているので/, '未保存時は編集画面を閉じずに案内する');
assert.match(html, /const refreshReview = reviewItemId===String\(data\.id\)/, '表示中の振り返りだけを更新対象にする');
assert.match(html, /if\(refreshReview\)[\s\S]*renderReview\(refreshed\)/, '編集後の振り返りには新しい内容を表示する');

console.log('PASS: edit save verifies its result and refreshes only the displayed review card');
