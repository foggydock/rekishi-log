const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');
assert.match(html, /id="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"/, '詳細パネルをダイアログとして伝える');
assert.match(html, /id="overlay" aria-hidden="true"/, '閉じているパネルを読み上げ対象から外す');

const code = html.slice(html.indexOf('let detailReturnFocus = null;'), html.indexOf('function fmtDate'));
const classes = new Set();
const attrs = {};
const opener = {isConnected:true, focused:false, focus(){ this.focused=true; }};
const close = {focused:false, focus(){ this.focused=true; }};
let keydown;
const overlay = {
  classList:{contains:name=>classes.has(name),add:name=>classes.add(name),remove:name=>classes.delete(name)},
  setAttribute:(name,value)=>{ attrs[name]=value; }
};
const ctx = vm.createContext({
  $:selector=>selector==='#overlay' ? overlay : {querySelector:()=>close},
  document:{activeElement:opener,addEventListener:(type,listener)=>{ if(type==='keydown') keydown=listener; }}
});
vm.runInContext(code, ctx);

ctx.showDetail();
assert.equal(classes.has('show'), true, 'パネルを開く');
assert.equal(attrs['aria-hidden'], 'false');
assert.equal(close.focused, true, '開いた直後に閉じるボタンへ移動する');

let prevented = false;
keydown({key:'Escape',preventDefault(){ prevented=true; }});
assert.equal(prevented, true, 'Escape の既定動作を止める');
assert.equal(classes.has('show'), false, 'Escape で閉じる');
assert.equal(attrs['aria-hidden'], 'true');
assert.equal(opener.focused, true, '閉じた後に開く前の位置へ戻る');
console.log('PASS: detail dialog supports keyboard close and focus return');
