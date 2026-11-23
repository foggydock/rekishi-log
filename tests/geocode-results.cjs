const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('index.html', 'utf8');
const start = source.indexOf("$('#btn-geocode').onclick = async ()=>{");
const end = source.indexOf('\n/* ---------- 重複項目', start);
assert(start >= 0 && end > start);
const handler = source.slice(start, end);

async function run(result){
  const button = {disabled:false}, status = {textContent:''};
  const row = {id:1,name:'架空地点',type:'地域',lat:null,lng:null};
  const query = {update(){return this},eq(){return this},is(){return this},select(){return Promise.resolve(result)}};
  const ctx = { $: s=>s==='#btn-geocode'?button:status, currentUid:'user', fetchAllRows:async()=>[row],
    validCoord:(lat,lng)=>lat==null || lng==null ? null : {lat,lng},
    geocodeBatch:async()=>[{name:row.name,lat:35,lng:135}], norm:s=>s,
    supa:{from:()=>query}, console, sleep:async()=>{}, allItems:[], itemCacheOwnerId:null };
  vm.runInNewContext(handler, ctx);
  await button.onclick();
  return status.textContent;
}
(async()=>{
  assert.match(await run({data:[{id:1}],error:null}), /1件に座標/);
  assert.match(await run({data:[],error:null}), /1件は保存対象が変わったため反映されませんでした/);
  assert.match(await run({data:null,error:{message:'保存エラー'}}), /1件は座標の保存に失敗/);
  assert.match(source, /AIで座標候補を探す/);
  assert.match(source, /座標が変更されたため、候補は入力しませんでした/);
  console.log('PASS: geocoding reports saved, unchanged, and failed rows; candidate entry protects edits');
})().catch(e=>{console.error(e); process.exitCode=1;});
