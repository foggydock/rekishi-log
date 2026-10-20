const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = readFileSync('index.html','utf8');
const slice = (from, to) => html.slice(html.indexOf(from), html.indexOf(to));
const el = () => ({textContent:'', innerHTML:'', hidden:false, disabled:false, style:{}, classList:{add(){},remove(){},contains:()=>false}});

(async()=>{
  // 再試行中の表示は、「更新する」の処理中だけボタンに出す
  {
    const els = {'#btn-update':el(), '#btn-label':el(), '#geo-status':el()};
    els['#btn-label'].textContent = '更新する';
    const ctx = vm.createContext({$:s=>els[s]});
    vm.runInContext(slice('// 再試行中の案内は', '// Supabase通信を'), ctx);
    ctx.retryNote('通信を再試行中…');
    assert.equal(els['#btn-label'].textContent, '更新する', '年表・振り返りの読み込み中はボタンを書き換えない');
    els['#btn-update'].disabled = true;
    ctx.retryNote('通信を再試行中…');
    assert.equal(els['#btn-label'].textContent, '通信を再試行中…', '更新中はボタンに出す');
    vm.runInContext("activeStatusSel = '#geo-status'", ctx);
    ctx.retryNote('混雑のため再試行中…');
    assert.equal(els['#geo-status'].textContent, '混雑のため再試行中…', '設定画面の処理はその状態欄に出す');
  }

  // AIの返事を待つのをやめる・時間切れでやめる
  {
    const code = slice('const sleep =', '// PostgRESTはデフォルトで').replace('const AI_WAIT_MS = 160000;', 'const AI_WAIT_MS = 50;');
    let mode = 'hang', calls = 0;
    const ctx = vm.createContext({
      setTimeout, clearTimeout, Promise, Error, AbortController, console:{error(){}},
      $:()=>({disabled:false}),
      supa:{functions:{invoke:(_name, {signal})=>{
        calls++;
        if(mode==='ok') return Promise.resolve({data:{candidates:[]}, error:null});
        // 実物と同じく、止められると「送信失敗」のエラーを返す
        return new Promise(r=>signal.addEventListener('abort', ()=>r({data:null, error:{message:'Failed to send a request to the Edge Function'}}), {once:true}));
      }}}
    });
    vm.runInContext(code, ctx);
    mode = 'ok';
    assert.deepEqual(await ctx.geminiCall('p', {}), {candidates:[]}, '返事のデータをそのまま返す');
    assert.equal(vm.runInContext('aiAbort', ctx), null);

    mode = 'hang'; calls = 0;
    const waiting = ctx.geminiCall('p', {});
    vm.runInContext('aiAbort.abort()', ctx);
    await assert.rejects(waiting, e => e._aiStopped && /待つのをやめました/.test(e.message));
    assert.equal(calls, 1, 'やめたら再試行しない');
    assert.equal(vm.runInContext('aiAbort', ctx), null);

    calls = 0;
    await assert.rejects(ctx.geminiCall('p', {}), e => e._aiStopped && /秒以上なかったため/.test(e.message));
    assert.equal(calls, 1, '時間切れでも再試行しない');
  }

  // 編集画面：AIが付けた種類（役職など）を選択肢に残し、文字はエスケープする
  {
    const els = {};
    const ctx = vm.createContext({
      $:s=>(els[s] ??= el()), esc:s=>String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
      commonsSearchUrl:()=>'#', closeDetail(){}, openDetail(){}
    });
    vm.runInContext(slice('function openEdit(item){', 'let detailReturnFocus = null;'), ctx);
    ctx.openEdit({id:1, name:'奉行', type:'役職'});
    assert.match(els['#sheet'].innerHTML, /<option value="役職" selected>役職<\/option>/, '既存の種類を選んだ状態で開く');
    ctx.openEdit({id:2, name:'x', type:'<b>城</b>'});
    assert.doesNotMatch(els['#sheet'].innerHTML, /<b>城<\/b>/, '種類の文字をそのままHTMLにしない');
    ctx.openEdit({id:3, name:'x', type:'人物'});
    assert.equal((els['#sheet'].innerHTML.match(/<option/g)||[]).length, 5, '基本の種類なら選択肢は5つのまま');
  }

  // ログイン状態：同じ人の再確認では読み直さず、ログアウト・切替では前の人の内容を消す
  {
    let handler, reviews = 0, cleanups = 0, cleared = 0;
    const els = {};
    const ctx = vm.createContext({
      $:s=>(els[s] ??= el()), localStorage:{setItem(){}},
      authScreen:{classList:{add(){}, remove(){}}},
      supa:{auth:{onAuthStateChange:cb=>{ handler = cb; }}},
      loadReview(){ reviews++; }, cleanupOldEntries(){ cleanups++; },
      aiAbort:null, allItems:[{id:'a'}], factCounts:{a:1}, itemCacheOwnerId:'u1', lastUpdate:{born:[],grew:[]}, focusMapItemId:null, searchQuery:'q',
      refreshItemNumbers(){}, hideResult(){}, closeDetail(){}, destroyMap(){}, updateSearchResult(){}
    });
    vm.runInContext('let currentUid = null;\n' + slice('// ログアウト・別アカウントへの切替時に、前の利用者の内容を', "$('#au-form').onsubmit"), ctx);
    const origClear = ctx.clearUserScopedState;
    ctx.clearUserScopedState = ()=>{ cleared++; origClear(); };
    vm.runInContext('clearUserScopedState = this.clearUserScopedState', ctx);
    const session = id => ({user:{id, email:id+'@example.test'}});
    handler('INITIAL_SESSION', session('u1'));
    assert.equal(reviews, 1); assert.equal(cleanups, 1);
    handler('SIGNED_IN', session('u1'));        // アプリに戻るたびに届く
    handler('TOKEN_REFRESHED', session('u1'));
    assert.equal(reviews, 1, '同じ利用者なら振り返りを選び直さない');
    assert.equal(cleared, 0);
    handler('SIGNED_OUT', null);
    assert.equal(cleared, 1, 'ログアウトで前の利用者の内容を消す');
    assert.equal(vm.runInContext('allItems.length', ctx), 0);
    assert.equal(vm.runInContext('itemCacheOwnerId', ctx), null);
    assert.equal(vm.runInContext('lastUpdate', ctx), null);
    assert.equal(els['#who'].textContent, '');
    handler('SIGNED_IN', session('u2'));
    assert.equal(reviews, 2, '別の利用者でログインしたら読み直す');
    vm.runInContext("allItems=[{id:'b'}]", ctx);
    handler('SIGNED_IN', session('u3'));        // ログアウトを挟まない切替
    assert.equal(cleared, 2); assert.equal(vm.runInContext('allItems.length', ctx), 0);
  }
  console.log('PASS: retry note only while updating, AI wait cancel/timeout, edit keeps AI types, login switch clears and same-user recheck does not reload');
})();
