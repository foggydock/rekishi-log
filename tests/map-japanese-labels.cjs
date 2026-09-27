const { readFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');

assert.match(html, /const MAPTILER_PUBLIC_KEY = '[A-Za-z0-9]+'/,
  'MapTiler の公開キーを利用する');
assert.match(html, /cdn\.maptiler\.com\/leaflet-maptilersdk\/v4\.1\.0\/leaflet-maptilersdk\.umd\.min\.js/,
  'MapTiler の Leaflet 用SDKを読み込む');
assert.match(html, /style: L\.maptiler\.MapStyle\.STREETS/,
  'MapTiler の標準地図を利用する');
assert.match(html, /language: L\.maptiler\.Language\.JAPANESE/,
  '地名ラベルの言語を日本語に指定する');
assert.match(html, /location\.protocol === 'file:'/,
  'file:// で直接開いた場合を判定する');
assert.match(html, /https:\/\/\{s\}\.tile\.openstreetmap\.org\/\{z\}\/\{x\}\/\{y\}\.png/,
  'file:// ではキー制限に影響されない代替地図を使う');
assert.match(html, /addBaseMapLayer\(leafMap\)/,
  '表示環境に応じた背景地図を追加する');

console.log('PASS: hosted map uses Japanese MapTiler; file preview has a fallback');
