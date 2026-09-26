// Hàm gọi AI viết bài. Khóa API nằm trong Secrets của Supabase, không lộ ra trình duyệt.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // Chỉ thành viên của app được dùng AI
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "Chưa đăng nhập" }, 401);
    const { data: prof } = await admin.from("profiles").select("id").eq("id", user.id).single();
    if (!prof) return json({ error: "Tài khoản không thuộc app" }, 403);

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.length > 20000) return json({ error: "Nội dung yêu cầu không hợp lệ" }, 400);

    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ error: "Chưa cài ANTHROPIC_API_KEY trong Secrets" }, 500);

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("AI_MODEL") || "claude-sonnet-5",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await r.json();
    if (!r.ok) return json({ error: data?.error?.message || "Lỗi gọi AI" }, 502);
    const text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    return json({ text });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});
