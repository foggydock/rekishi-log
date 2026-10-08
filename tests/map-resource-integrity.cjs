const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');
const code = html.slice(html.indexOf('function ensureLeaflet(){'), html.indexOf('async function renderMapView'));
const appended = [];
const window = {};
const document = {
  head:{appendChild(el){
    appended.push(el);
    if(el.tagName !== 'script') return;
    if(el.src.includes('leaflet.js')) window.L = {};
    if(el.src.includes('leaflet-maptilersdk')) window.L.maptiler = {};
    el.onload?.();
  }},
  createElement(tag){ return {tagName:tag}; }
};
const ctx = vm.createContext({window, document, Promise, Error});
vm.runInContext(code, ctx);

(async()=>{
  await ctx.ensureLeaflet();
  const byUrl = new Map(appended.map(el=>[el.src || el.href, el]));
  const expectedSRI = new Map([
    ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H'],
    ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', 'sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH']
  ]);
  assert.equal(byUrl.size, 5, '地図に必要な外部リソースをすべて読む');
  for(const [url, integrity] of expectedSRI){
    assert.equal(byUrl.get(url)?.integrity, integrity, `${url} に正しいSRIを付ける`);
    assert.equal(byUrl.get(url)?.crossOrigin, 'anonymous', `${url} は匿名CORSで検証する`);
  }
  for(const url of [
    'https://cdn.maptiler.com/maptiler-sdk-js/v4.1.0/maptiler-sdk.css',
    'https://cdn.maptiler.com/maptiler-sdk-js/v4.1.0/maptiler-sdk.umd.min.js',
    'https://cdn.maptiler.com/leaflet-maptilersdk/v4.1.0/leaflet-maptilersdk.umd.min.js'
  ]){
    assert.equal(byUrl.get(url)?.integrity, undefined, `${url} はCORS未対応のためSRIを付けない`);
    assert.equal(byUrl.get(url)?.crossOrigin, undefined, `${url} はCORS読み込みを要求しない`);
  }
  console.log('PASS: map resources use SRI only where the CDN supports anonymous CORS');
})();
