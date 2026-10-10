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
    {id:'old', name:'古い項目', created_at:'2026-09-01T00:00:00Z', item_no:1},
    {id:'new', name:'新しい項目', created_at:'2026-10-01T00:00:00Z', item_no:5},
    {id:'same-b', name:'削除後の項目', created_at:'2026-09-15T00:00:00Z', item_no:4},
    {id:'same-a', name:'途中の項目', created_at:'2026-09-15T00:00:00Z', item_no:3}
  ];
  refreshItemNumbers();
`, ctx);
const items = vm.runInContext('allItems', ctx);

assert.equal(ctx.itemNo(items[0]), 1, '古い項目は保存済みの No. 1 を表示する');
assert.equal(ctx.itemNo(items[1]), 5, '新しい項目は次に追加された番号を表示する');
assert.equal(ctx.itemNo(items[3]), 3, '同日時でも保存済みの番号を使う');
assert.match(ctx.itemNameHtml(items[1]), /No\. 5.*新しい項目/, '項目名に固定番号を表示する');
assert.equal(ctx.itemNo(items[2]), 4, '削除された番号があっても残りの番号は変わらない');
vm.runInContext(`applyTimelineData([{id:'fresh', name:'更新直後', created_at:'2026-10-02T00:00:00Z', item_no:6}], [{item_id:'fresh'}, {item_id:'fresh'}])`, ctx);
assert.equal(ctx.itemNo(vm.runInContext('allItems[0]', ctx)), 6, '更新後の一覧キャッシュにもDBの固定番号を反映する');
assert.equal(vm.runInContext('factCounts.fresh', ctx), 2, '更新後の一覧キャッシュにも情報件数を反映する');
console.log('PASS: item numbers are fixed, gap-safe, and included with item names');
