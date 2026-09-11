const {readFileSync} = require('node:fs');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');
const fn = readFileSync('supabase/functions/history-gemini/index.ts', 'utf8');

assert.doesNotMatch(html, /generativelanguage\.googleapis\.com/);
assert.doesNotMatch(html, /id="gkey"|id="btn-savekey"|getGeminiKey|hist_settings/);
assert.match(html, /supa\.functions\.invoke\('history-gemini'/);
assert.match(html, /localStorage\.removeItem\('gemini_key'\)/);
assert.match(fn, /Deno\.env\.get\("GEMINI_API_KEY"\)/);
assert.match(fn, /supabase\.auth\.getUser\(\)/);
assert.match(fn, /from\("hist_items"\)\.select\("id"\)/);
assert.match(fn, /120_000/);
console.log('PASS: Gemini key is server-side and the function requires an authenticated history-log user');
