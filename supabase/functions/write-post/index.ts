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

    const { prompt, image } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.length > 20000) return json({ error: "Nội dung yêu cầu không hợp lệ" }, 400);
    // Optional picture for the AI to look at (used by Kho ảnh to label uploaded artwork)
    if (image && (!["image/jpeg", "image/png", "image/webp"].includes(image.media_type) || typeof image.data !== "string" || image.data.length > 1_500_000))
      return json({ error: "Ảnh gửi cho AI không hợp lệ hoặc quá lớn" }, 400);
    const content = image
      ? [{ type: "image", source: { type: "base64", media_type: image.media_type, data: image.data } }, { type: "text", text: prompt }]
      : prompt;

    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ error: "Chưa cài ANTHROPIC_API_KEY trong Secrets" }, 500);

    // max_tokens covers the model's thinking as well as the answer; too small cuts the JSON off mid-way.
    // Effort (not supported on Haiku) keeps thinking short for these formatting tasks; override with Secret AI_EFFORT.
    const model = Deno.env.get("AI_MODEL") || "claude-sonnet-5";
    const payload: Record<string, unknown> = { model, max_tokens: 16000, messages: [{ role: "user", content }] };
    if (!model.includes("haiku")) payload.output_config = { effort: Deno.env.get("AI_EFFORT") || "low" };
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) return json({ error: data?.error?.message || "Lỗi gọi AI" }, 502);
    if (data.stop_reason === "max_tokens") return json({ error: "Nội dung quá dài nên AI bị cắt giữa chừng, hãy rút gọn bài rồi thử lại" }, 502);
    if (data.stop_reason === "refusal") return json({ error: "AI từ chối xử lý nội dung này" }, 502);
    const text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    return json({ text });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});
