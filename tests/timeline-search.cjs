const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');
assert.match(html, /名前・説明・時代・地域・テーマで検索/, '検索欄が対象を案内する');
assert.match(html, /id="search-clear"/, '検索を消すボタンがある');
assert.match(html, /id="search-result"/, '検索件数を表示する場所がある');
assert.match(html, /\.search-hidden\{display:none!important\}/, '既存カードを隠す表示ルールがある');

const start = html.indexOf('function itemMatchesSearch(');
const end = html.indexOf('function updateSearchResult(', start);
const ctx = vm.createContext({});
vm.runInContext(html.slice(start, end), ctx);
const item = {name:'織田信長', summary:'戦国時代の武将', era_label:'安土桃山', region:'京都', theme:'天下統一', type:'人物'};
for(const query of ['織田', '戦国', '安土', '京都', '天下', '人物']){
  assert.equal(ctx.itemMatchesSearch(item, query), true, `${query} でも見つかる`);
}
assert.equal(ctx.itemMatchesSearch(item, '鎌倉'), false, '関係ない語では見つからない');
assert.match(html, /else applySearchFilter\(\);/, '通常の一覧は入力時に再描画せず表示を切り替える');
console.log('PASS: timeline search covers item details and filters existing cards');
