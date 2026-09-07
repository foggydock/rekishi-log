const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = readFileSync('index.html','utf8');
for(const [,script] of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(script);
const code = html.slice(html.indexOf('let deletingItem = false;'),html.indexOf('function openEdit(item)'));
async function run({confirm=true,fetchError=false,error=null,data=[{id:'a'}],backup=true}={}){
  const buttons=[{disabled:false}], btn={disabled:false,textContent:'この項目を削除'};
  let deletes=0,backups=0,picks=0,alerts=0;
  const query={eq(){return this},select(){return {data,error}}};
  const ctx=vm.createContext({
    console:{error(){}},confirm:()=>confirm,alert:()=>alerts++,currentUid:'owner',
    $:()=>({querySelectorAll:()=>buttons}),
    fetchAllRows:async()=>{if(fetchError) throw Error('offline'); return [{item_id:'a',fact_text:'知識'}]},
    downloadBackupMd:(items,facts)=>{assert.equal(facts.length,1);backups++;return backup},
    supa:{from:()=>({delete:()=>{deletes++;return query}})},
    allItems:[{id:'a'},{id:'b'}],factCounts:{a:1,b:2},lastUpdate:{born:[{id:'a'}],grew:[]},
    closeDetail(){},pickReview(){picks++},updateFreshToggle(){},renderTypeChips(){},renderChips(){},renderTimeline(){}
  });
  vm.runInContext(code,ctx);
  await ctx.deleteItem({id:'a',name:'項目'},btn);
  assert.equal(btn.disabled,false);assert.equal(buttons[0].disabled,false);
  return {ctx,deletes,backups,picks,alerts};
}
(async()=>{
  let r=await run();assert.deepEqual(Array.from(r.ctx.allItems,i=>i.id),['b']);assert.equal(r.picks,1);assert.equal(r.backups,1);assert.equal(r.ctx.lastUpdate.born.length,0);
  r=await run({confirm:false});assert.equal(r.deletes,0);assert.equal(r.backups,0);
  r=await run({fetchError:true});assert.equal(r.deletes,0);assert.equal(r.alerts,1);
  for(const options of [{error:{message:'offline'}},{data:[]}]){
    r=await run(options);assert.equal(r.ctx.allItems.length,2);assert.equal(r.picks,0);assert.equal(r.alerts,1);
  }
  const pickCode=html.slice(html.indexOf('function pickReview(){'),html.indexOf('function goToMapFor(item)'));
  const wrap={style:{},innerHTML:'',querySelectorAll:()=>[]};
  const elements={};
  const ctx=vm.createContext({$:s=>s==='#review'?wrap:(elements[s]??={}),allItems:[],esc:x=>x,typeClass:()=>'',validCoord:()=>false,markReviewed(){},openDetail(){},deleteItem(){}});
  vm.runInContext(pickCode,ctx);ctx.pickReview();assert.equal(wrap.style.display,'none');
  ctx.allItems=[{id:'b',name:'残る項目'}];ctx.pickReview();assert.match(wrap.innerHTML,/rev-delete/);assert.match(wrap.innerHTML,/残る項目/);assert.equal(typeof elements['#rev-delete'].onclick,'function');
  console.log('PASS: syntax, delete success, cancellation, backup read failure, API failure, zero rows, cache cleanup, empty review and delete button');
})();
