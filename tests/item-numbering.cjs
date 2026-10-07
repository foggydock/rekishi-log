const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');
const start = html.indexOf('let allItems=[], factCounts={};');
const end = html.indexOf('async function loadTimeline(){');
const code = html.slice(start, end);
const ctx = vm.createContext({Map, Date, String, esc:x=>x});
vm.runInContext(code, ctx);

vm.runInContext(`
  allItems = [
    {id:'old', name:'古い項目', created_at:'2026-09-01T00:00:00Z'},
    {id:'new', name:'新しい項目', created_at:'2026-10-01T00:00:00Z'},
    {id:'same-b', name:'同日時B', created_at:'2026-09-15T00:00:00Z'},
    {id:'same-a', name:'同日時A', created_at:'2026-09-15T00:00:00Z'}
  ];
  refreshItemNumbers();
`, ctx);
const items = vm.runInContext('allItems', ctx);

assert.equal(ctx.itemNo(items[1]), 1, '登録日時が新しい項目を No. 1 にする');
assert.equal(ctx.itemNo(items[0]), 4, '表示用の年表順ではなく全登録順で番号を決める');
assert.equal(ctx.itemNo(items[3]), 2, '同日時は id で安定して並べる');
assert.match(ctx.itemNameHtml(items[1]), /No\. 1.*新しい項目/, '項目名に番号を表示する');
vm.runInContext(`applyTimelineData([{id:'fresh', name:'更新直後', created_at:'2026-10-02T00:00:00Z'}], [{item_id:'fresh'}, {item_id:'fresh'}])`, ctx);
assert.equal(ctx.itemNo(vm.runInContext('allItems[0]', ctx)), 1, '更新後の一覧キャッシュにも番号を割り振る');
assert.equal(vm.runInContext('factCounts.fresh', ctx), 2, '更新後の一覧キャッシュにも情報件数を反映する');
console.log('PASS: item numbers are global, stable, and included with item names');
