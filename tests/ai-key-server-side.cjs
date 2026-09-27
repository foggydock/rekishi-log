const {readFileSync} = require('node:fs');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');
const fn = readFileSync('supabase/functions/history-gemini/index.ts', 'utf8');
const migration = readFileSync('supabase/migrations/20260927064237_restrict_history_gemini_to_authorized_users.sql', 'utf8');

assert.doesNotMatch(html, /generativelanguage\.googleapis\.com/);
assert.doesNotMatch(html, /id="gkey"|id="btn-savekey"|getGeminiKey|hist_settings/);
assert.match(html, /supa\.functions\.invoke\('history-gemini'/);
assert.match(html, /localStorage\.removeItem\('gemini_key'\)/);
assert.match(fn, /Deno\.env\.get\("GEMINI_API_KEY"\)/);
assert.match(fn, /supabase\.auth\.getUser\(\)/);
assert.match(fn, /from\("hist_ai_users"\)\.select\("user_id"\)/);
assert.doesNotMatch(fn, /from\("hist_items"\)\.select\("id"\)/);
assert.match(migration, /alter table public\.hist_ai_users enable row level security/);
assert.match(migration, /for select\s+to authenticated\s+using \(\(select auth\.uid\(\)\) = user_id\)/);
assert.match(migration, /revoke all on table public\.hist_ai_users from authenticated/);
assert.doesNotMatch(migration, /grant insert on table public\.hist_ai_users to authenticated/);
assert.match(fn, /120_000/);
console.log('PASS: Gemini key is server-side and the function requires an authorized history-log user');
