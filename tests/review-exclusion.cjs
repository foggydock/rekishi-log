const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = readFileSync('index.html','utf8');
const code = html.slice(html.indexOf('async function loadReview(){'),html.indexOf('function goToMapFor(item)'));
function setup({error=null,empty=false}={}){
  const wrap={style:{},innerHTML:'',querySelectorAll:()=>Object.values(elements)};
  const elements={};
  const rows=[{id:'a',name:'除外項目',review_excluded:true},{id:'b',name:'復習項目',review_excluded:false}];
  const calls=[];let alerts=0;
  const ctx=vm.createContext({
    $:s=>s==='#review'?wrap:(elements[s]??={id:s.slice(1),textContent:'今後の振り返りに出さない'}),
    allItems:rows.map(r=>({...r})),currentUid:'owner',esc:x=>x,typeClass:()=>'',validCoord:()=>false,
    console:{error(){}},alert:()=>alerts++,markReviewed(){},openDetail(){},deleteItem(){},
    fetchAllRows:async()=>rows.map(r=>({...r})),
    supa:{from:table=>({update:patch=>{
      const filters={}; const q={eq(k,v){filters[k]=v;return q},async select(){
        calls.push({table,patch,filters});
        if(error || empty) return {error,data:[]};
        const row=rows.find(r=>r.id===filters.id);Object.assign(row,patch);
        return {data:[{...row}],error:null};
      }};return q;
    }})}
  });
  vm.runInContext(code,ctx);
  return {ctx,wrap,elements,rows,calls,alerts:()=>alerts};
}
(async()=>{
  const t=setup();
  for(let n=0;n<100;n++){t.ctx.pickReview();assert.match(t.wrap.innerHTML,/復習項目/);assert.doesNotMatch(t.wrap.innerHTML,/除外項目/);}
  assert.equal(t.ctx.allItems.length,2,'timeline retains both records');
  await t.elements['#rev-exclude'].onclick();
  assert.match(t.wrap.innerHTML,/振り返りの対象がありません/);
  assert.equal(t.rows[1].review_excluded,true);
  assert.equal(t.calls[0].filters.user_id,'owner');
  await t.ctx.loadReview();assert.match(t.wrap.innerHTML,/振り返りの対象がありません/,'persists after reload');
  const btn={id:'d-review',textContent:'振り返りの対象に戻す'};
  await t.ctx.setReviewExcluded(t.ctx.allItems[1],false,btn);
  assert.equal(btn.textContent,'今後の振り返りに出さない');assert.equal(btn.disabled,false);
  await t.ctx.loadReview();assert.match(t.wrap.innerHTML,/復習項目/);
  for(const options of [{error:{message:'offline'}},{empty:true}]){
    const f=setup(options);f.ctx.pickReview();await f.elements['#rev-exclude'].onclick();
    assert.equal(f.ctx.allItems[1].review_excluded,false);assert.equal(f.alerts(),1);
    assert.equal(f.elements['#rev-exclude'].disabled,false);assert.match(f.wrap.innerHTML,/復習項目/);
  }
  console.log('PASS: excluded candidates never selected, records retained, cloud save, reload, restore, all excluded, API error and zero-row failure');
})();
