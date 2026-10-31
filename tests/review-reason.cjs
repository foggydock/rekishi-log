const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = readFileSync('index.html','utf8');

const start = html.indexOf('function reviewReason(');
const end = html.indexOf('\n}', start) + 2;
const ctx = vm.createContext({});
vm.runInContext(html.slice(start, end), ctx);

const now = new Date('2026-10-31T00:00:00Z').getTime();
assert.equal(ctx.reviewReason({last_reviewed_at:null}, now), 'まだ振り返っていない項目です', '未復習の項目はその旨を示す');
assert.equal(ctx.reviewReason({last_reviewed_at:new Date(now).toISOString()}, now), '今日はじめて振り返る項目です', '今日復習済みなら今日の分として扱う');
const fiveDaysAgo = new Date(now - 5*86400000).toISOString();
assert.equal(ctx.reviewReason({last_reviewed_at:fiveDaysAgo}, now), '前回の振り返りから5日たっています', '経過日数を表示する');

assert.match(html, /class="rev-reason"/, '振り返りカードに理由を表示する場所がある');
assert.match(html, /renderReview\(i, reviewReason\(i, now\)\)/, '選んだ項目の理由を描画に渡す');

console.log('PASS: review card shows why the item was picked today');
