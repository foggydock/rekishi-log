const { readFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');

assert.match(html, /const MAPTILER_PUBLIC_KEY = '[A-Za-z0-9]+'/,
  'MapTiler の公開キーを利用する');
assert.match(html, /cdn\.maptiler\.com\/leaflet-maptilersdk\/v4\.1\.0\/leaflet-maptilersdk\.umd\.min\.js/,
  'MapTiler の Leaflet 用SDKを読み込む');
for(const url of [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.maptiler.com/maptiler-sdk-js/v4.1.0/maptiler-sdk.css',
  'https://cdn.maptiler.com/maptiler-sdk-js/v4.1.0/maptiler-sdk.umd.min.js',
  'https://cdn.maptiler.com/leaflet-maptilersdk/v4.1.0/leaflet-maptilersdk.umd.min.js'
]){
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(html, new RegExp(`src='${escaped}'|href='${escaped}'`), `${url} のURLを固定する`);
}
assert.equal((html.match(/\.integrity='sha384-[A-Za-z0-9+/]+={0,2}'/g)||[]).length, 5,
  '動的に読む地図リソースすべてにSRIハッシュを設定する');
assert.equal((html.match(/\.crossOrigin='anonymous'/g)||[]).length >= 5, true,
  '動的に読む地図リソースは匿名CORSでSRIを検証する');
assert.match(html, /style: L\.maptiler\.MapStyle\.STREETS/,
  'MapTiler の標準地図を利用する');
assert.match(html, /language: L\.maptiler\.Language\.JAPANESE/,
  '地名ラベルの言語を日本語に指定する');
assert.match(html, /location\.protocol === 'file:'/,
  'file:// で直接開いた場合を判定する');
assert.match(html, /https:\/\/tile\.openstreetmap\.jp\/styles\/osm-bright-ja\/\{z\}\/\{x\}\/\{y\}\.png/,
  'file:// ではOSMFJの日本語地図を使う');
assert.match(html, /addBaseMapLayer\(leafMap\)/,
  '表示環境に応じた背景地図を追加する');
assert.match(html, /scrollWheelZoom:false, minZoom:2/,
  '世界中の地点を表示するときも読める縮尺を保つ');
assert.match(html, /baseLayer\.on\('tileerror', \(\)=>showMapTileRecovery\(leafMap\)\)/,
  '背景タイルだけの失敗も検知する');
assert.match(html, /外部地図で開く/,
  'タイル障害時に登録済み地点を外部地図でも確認できる');
assert.match(html, /もう一度読み込む/,
  'タイル障害時に再試行できる');

console.log('PASS: hosted map uses Japanese MapTiler; file preview has a fallback');
