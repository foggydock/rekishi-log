const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');
const code = html.slice(html.indexOf('async function loadReview(){'), html.indexOf('function pickReview(){'));

async function run({owner='owner', cachedOwner='owner'}={}){
  let fetched = 0, picked = 0, refreshed = 0;
  const ctx = vm.createContext({
    currentUid:owner, itemCacheOwnerId:cachedOwner, allItems:[{id:'cached'}],
    fetchAllRows:async()=>{ fetched++; return [{id:'fresh'}]; },
    refreshItemNumbers(){ refreshed++; }, pickReview(){ picked++; },
    console:{error(){}}, $:()=>({style:{},innerHTML:''})
  });
  vm.runInContext(code, ctx);
  await ctx.loadReview();
  return {ctx, fetched, picked, refreshed};
}

(async()=>{
  let result = await run();
  assert.equal(result.fetched, 0, '同じ利用者の年表キャッシュは再取得しない');
  assert.equal(result.picked, 1, 'キャッシュから振り返りを表示する');

  result = await run({owner:'next-user', cachedOwner:'owner'});
  assert.equal(result.fetched, 1, '利用者が変わったら必ず取り直す');
  assert.equal(result.refreshed, 1, '取り直した項目番号を更新する');
  assert.equal(result.ctx.itemCacheOwnerId, 'next-user');
  assert.equal(result.ctx.allItems[0].id, 'fresh');
  console.log('PASS: review reuses only the current user cache');
})();
