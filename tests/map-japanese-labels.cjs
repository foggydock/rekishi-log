const { readFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');

assert.match(
  html,
  /L\.tileLayer\('https:\/\/tile\.openstreetmap\.jp\/styles\/osm-bright-ja\/\{z\}\/\{x\}\/\{y\}\.png'/,
  '地図は日本語表記のOSMFJタイルを利用する',
);
assert.match(html, /attribution: '&copy; OpenStreetMap Contributors'/);
assert.doesNotMatch(html, /tile\.openstreetmap\.org\/\{z\}\/\{x\}\/\{y\}\.png/);

console.log('PASS: map uses the Japanese-labelled OSMFJ tile style');
