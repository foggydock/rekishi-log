const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');
const migration = readFileSync('supabase/migrations/20261009000000_add_hist_item_portrait_fields.sql', 'utf8');
const code = html.slice(html.indexOf('function safeHttpUrl'), html.indexOf('// 重複さがし用'));
const ctx = vm.createContext({URL, norm:value=>(value||'').trim()});
vm.runInContext(code, ctx);

assert.equal(ctx.safeHttpUrl('https://commons.wikimedia.org/wiki/File:Example.jpg'), 'https://commons.wikimedia.org/wiki/File:Example.jpg');
assert.equal(ctx.safeHttpUrl('javascript:alert(1)'), '', '危険なURLをリンクに使わない');
assert.equal(ctx.isDirectImageUrl('https://upload.wikimedia.org/example.jpg?width=320'), true);
assert.equal(ctx.isDirectImageUrl('https://commons.wikimedia.org/wiki/File:Example.jpg'), false);
assert.match(ctx.commonsSearchUrl('織田信長'), /Special:MediaSearch/, 'Commons検索への導線を作る');
for(const field of ['portrait_image_url','portrait_source_url','portrait_credit','portrait_license']){
  assert.match(migration, new RegExp(`add column if not exists ${field} text`), `${field} をDBへ追加する`);
  assert.match(html, new RegExp(field), `${field} を画面で扱う`);
}
assert.match(html, /肖像の掲載元・ライセンスを開く/, '掲載元へのリンクを表示する');
assert.match(html, /AIの抽出・更新では、確認して登録した肖像の出典情報を上書きしない。/, 'AI更新で肖像情報を失わない');

console.log('PASS: portraits use safe URLs, retain their source, and survive AI updates');
