import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  // verify_jwt=true に加えて、関数内でもトークンの実ユーザーを確認する。
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  // このアプリは個人用。認証だけでは新規登録者もAIを呼べてしまうため、
  // RLSで本人の行だけを見たうえで、既存の歴史ログ利用者に限定する。
  const { data: existingItem, error: accessError } = await supabase
    .from("hist_items").select("id").limit(1).maybeSingle();
  if (accessError || !existingItem) return json({ error: "このアカウントには歴史ログの利用権限がありません。" }, 403);

  let payload: { prompt?: unknown; responseSchema?: unknown };
  try { payload = await req.json(); }
  catch { return json({ error: "Invalid JSON" }, 400); }
  if (typeof payload.prompt !== "string" || !payload.prompt.trim()) return json({ error: "prompt is required" }, 400);
  if (payload.prompt.length > 120_000) return json({ error: "入力が長すぎます。文字起こしを分けてください。" }, 413);

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) return json({ error: "Gemini APIキーがサーバーに設定されていません。" }, 503);

  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: payload.prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          ...(payload.responseSchema ? { responseSchema: payload.responseSchema } : {}),
        },
      }),
    },
  );
  const data = await upstream.json().catch(() => ({ error: "GeminiからJSONを受け取れませんでした。" }));
  return json(data, upstream.status);
});
