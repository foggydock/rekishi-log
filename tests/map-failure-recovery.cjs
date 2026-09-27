const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');
const code = html.slice(html.indexOf('function showMapTileRecovery'), html.indexOf('function ensureLeaflet'));
const children = [];
const status = {
  classList: { shown: false, contains(){ return this.shown; }, add(){ this.shown = true; } },
  replaceChildren(...nodes){ children.length = 0; children.push(...nodes); },
  appendChild(node){ children.push(node); }
};
let retried = 0;
const ctx = vm.createContext({
  $: id => { assert.equal(id, '#map-tile-status'); return status; },
  document: {
    createTextNode: text => ({ text }),
    createElement: tag => ({ tag, textContent: '', onclick: null })
  },
  renderTimeline(){ retried++; },
  encodeURIComponent,
});
vm.runInContext(code, ctx);
const map = { getCenter:()=>({lat:35.68,lng:139.77}), getZoom:()=>5 };
ctx.showMapTileRecovery(map);
assert.equal(status.classList.shown, true);
const retry = children.find(x=>x.tag === 'button');
const external = children.find(x=>x.tag === 'a');
assert.equal(retry.textContent, 'もう一度読み込む');
retry.onclick();
assert.equal(retried, 1);
assert.equal(external.textContent, '外部地図で開く');
assert.match(external.href, /google\.com\/maps/);
assert.match(external.href, /35.68%2C139.77/);
ctx.showMapTileRecovery(map);
assert.equal(children.filter(x=>x.tag === 'button').length, 1, '同じ失敗で案内を重複させない');

console.log('PASS: map tile failures provide retry and an external-map fallback');
