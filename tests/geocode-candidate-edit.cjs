// 地域項目の編集画面にある「AIで座標候補を探す」の動きを確かめる（#8）
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('index.html', 'utf8');

// ボタンは地域の項目だけに出す
assert.match(source, /item\.type==='地域' \? '<button class="edit-btn" id="e-geo">AIで座標候補を探す<\/button>/);

const start = source.indexOf("if($('#e-geo')) $('#e-geo').onclick=async()=>{");
const end = source.indexOf('\n  let saving = false;', start);
assert(start >= 0 && end > start, 'e-geo の処理が見つかりません');
const handler = source.slice(start, end);

// 画面部品の代わり。待っている間の入力変更は duringWait で再現する。
async function run({ name = '架空地点', lat = '', lng = '', geocode, duringWait }) {
  const el = (value) => ({ value, textContent: '', disabled: false, isConnected: true });
  const parts = {
    '#e-geo': el(''), '#e-geo-status': el(''), '#e-name': el(name),
    '#e-era': el('古代'), '#e-region': el('架空国'), '#e-lat': el(lat), '#e-lng': el(lng),
  };
  const ctx = {
    $: (s) => parts[s], currentUid: 'user',
    norm: (s) => String(s ?? '').trim(),
    validCoord: (a, b) => (a == null || b == null || Number.isNaN(Number(a)) || Number.isNaN(Number(b))) ? null : { lat: Number(a), lng: Number(b) },
    geocodeBatch: async (rows, onRetry) => { if (duringWait) duringWait(parts); return geocode(rows, onRetry); },
  };
  vm.runInNewContext(handler, ctx);
  await parts['#e-geo'].onclick();
  return { status: parts['#e-geo-status'].textContent, lat: parts['#e-lat'].value, lng: parts['#e-lng'].value, disabled: parts['#e-geo'].disabled };
}

(async () => {
  // 候補が見つかったら入力する（保存はしない。利用者が確認して保存する）
  let r = await run({ geocode: async () => [{ name: '架空地点', lat: 35.68, lng: 139.77 }] });
  assert.equal(r.lat, 35.68); assert.equal(r.lng, 139.77);
  assert.match(r.status, /確認・修正してから保存/);
  assert.equal(r.disabled, false);

  // 特定できなければ入力せず、手入力を案内する
  r = await run({ geocode: async () => [{ name: '架空地点', lat: null, lng: null }] });
  assert.equal(r.lat, ''); assert.match(r.status, /特定できませんでした/);

  // 別の名前の候補は使わない
  r = await run({ geocode: async () => [{ name: '別の場所', lat: 1, lng: 2 }] });
  assert.equal(r.lat, ''); assert.match(r.status, /特定できませんでした/);

  // 通信に失敗しても、ボタンは押せる状態に戻る
  r = await run({ geocode: async () => { throw new Error('通信エラー'); } });
  assert.match(r.status, /候補を取得できませんでした：通信エラー/); assert.equal(r.disabled, false);

  // 待っている間に手で座標を入れたら、上書きしない
  r = await run({ geocode: async () => [{ name: '架空地点', lat: 10, lng: 20 }], duringWait: (p) => { p['#e-lat'].value = '1'; } });
  assert.equal(r.lat, '1'); assert.equal(r.lng, ''); assert.match(r.status, /座標が変更されたため、候補は入力しませんでした/);

  // 待っている間に名前を変えたら、入力しない
  r = await run({ geocode: async () => [{ name: '架空地点', lat: 10, lng: 20 }], duringWait: (p) => { p['#e-name'].value = '別の名前'; } });
  assert.equal(r.lat, ''); assert.match(r.status, /名前が変わったため/);

  // 名前が空なら問い合わせない
  let asked = false;
  r = await run({ name: '', geocode: async () => { asked = true; return []; } });
  assert.equal(asked, false); assert.match(r.status, /名前を入れてください/);

  console.log('PASS: region edit screen fetches a coordinate candidate without overwriting user edits');
})().catch((e) => { console.error(e); process.exitCode = 1; });
