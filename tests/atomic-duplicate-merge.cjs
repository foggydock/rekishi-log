const {readFileSync} = require('node:fs');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');
const sql = readFileSync('supabase/migrations/20260918231437_make_hist_duplicate_merge_atomic.sql', 'utf8');

assert.match(html, /supa\.rpc\('merge_hist_items',\s*\{p_keep_id:keep\.id,p_other_ids:otherIds\}\)/);
assert.doesNotMatch(html, /supa\.from\('hist_facts'\)\.update\(\{ item_id: keep\.id \}\)/);
assert.doesNotMatch(html, /supa\.from\('hist_items'\)\.delete\(\)\.in\('id', otherIds\)/);
assert.match(sql, /security invoker/);
assert.doesNotMatch(sql, /security definer/);
assert.match(sql, /v_uid uuid := auth\.uid\(\)/);
assert.match(sql, /for update/);
assert.match(sql, /update public\.hist_facts/);
assert.match(sql, /delete from public\.hist_items/);
assert.match(sql, /revoke all on function public\.merge_hist_items/);
assert.match(sql, /from anon/);
assert.match(sql, /grant execute on function public\.merge_hist_items\(bigint, bigint\[\]\) to authenticated/);

console.log('PASS: duplicate merge is delegated to an authenticated, transactional database function');
