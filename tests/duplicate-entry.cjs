const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');
const code = html.slice(html.indexOf('const sleep ='), html.indexOf('/* ---------- 下書き自動保存'));
const calls = [];
const pages = [
  Array.from({length:1000}, (_, i)=>({id:String(i), raw_text:'other', created_at:'2026-09-01T00:00:00Z'})),
  [{id:'target', raw_text:'長い文字起こし\n記号も含む?&=.', created_at:'2026-09-02T00:00:00Z'}]
];
const ctx = vm.createContext({
  currentUid:'owner', setTimeout, Promise, Error,
  $:()=>({classList:{contains:()=>false}}),
  supa:{from:table=>({select:columns=>{
    const filters=[];
    const query={
      eq(key, value){filters.push([key, value]); return query;},
      order(){return query;},
      range(from, to){ calls.push({table, columns, filters, from, to}); return Promise.resolve({data:pages.shift(), error:null}); }
    };
    return query;
  }})}
});
vm.runInContext(code, ctx);
(async()=>{
  const row = await ctx.findDuplicateEntry('長い文字起こし\n記号も含む?&=.');
  assert.equal(row.id, 'target');
  assert.equal(calls.length, 2, '1000件を超えても次ページを確認する');
  assert.deepEqual(calls.map(c=>c.filters), [[['user_id','owner']], [['user_id','owner']]]);
  assert.equal(calls[0].columns, 'id,created_at,raw_text');
  console.log('PASS: duplicate check compares text locally and never puts it in a URL filter');
})();
