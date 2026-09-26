// Hàm vẽ tranh nền bằng OpenAI (GPT Image). Khóa OPENAI_API_KEY nằm trong Secrets của Supabase.
// Tranh vẽ xong được lưu thẳng vào Kho ảnh (bucket + bảng artworks) để dùng lại.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Rules added to every picture
const BASE = "Style: Chinese wuxia / xianxia mobile game key art, semi-realistic anime illustration, cinematic lighting, rich detail, epic atmosphere. ";
const NO_TEXT = "Absolutely NO text, letters, numbers, logos, watermarks or UI anywhere in the image. Keep the central area slightly calmer so a big title can be placed over it later.";
const WITH_TEXT = "Render every quoted Vietnamese text EXACTLY as written, letter by letter with all diacritics correct, crisp and legible; do not add any other text, watermark or UI.";
const SIZES = ["1536x1024", "1024x1024", "1024x1536"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "Chưa đăng nhập" }, 401);
    const { data: prof } = await admin.from("profiles").select("id").eq("id", user.id).single();
    if (!prof) return json({ error: "Tài khoản không thuộc app" }, 403);

    const key = Deno.env.get("OPENAI_API_KEY");
    if (!key) return json({ error: "Chưa cài OPENAI_API_KEY trong Secrets của Supabase" }, 500);

    const { prompt, ref, refs, name, tags, text, size } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.length > 4000) return json({ error: "Đề bài vẽ không hợp lệ" }, 400);
    const model = Deno.env.get("OPENAI_IMAGE_MODEL") || "gpt-image-1";
    const quality = Deno.env.get("OPENAI_IMAGE_QUALITY") || "medium";
    const dim = SIZES.includes(size) ? size : "1536x1024";
    const fullPrompt = `${prompt}\n\n${BASE}${text ? WITH_TEXT : NO_TEXT}`;

    // Reference pictures (logo, style sample) are sent along so the model reuses them
    const urls = (Array.isArray(refs) ? refs : ref ? [ref] : []).filter((u: unknown) => typeof u === "string" && /^https:\/\//.test(u)).slice(0, 3);
    const blobs: Blob[] = [];
    for (const u of urls) {
      const got = await fetch(u);
      const type = got.headers.get("content-type") || "";
      if (got.ok && type.startsWith("image/")) {
        const b = await got.blob();
        if (b.size <= 8_000_000) blobs.push(b);
      }
    }
    let r: Response;
    if (blobs.length) {
      const form = new FormData();
      form.append("model", model);
      form.append("prompt", "The attached image(s) are references: keep the logo exactly as given where the brief asks for it; otherwise paint a NEW scene. " + fullPrompt);
      form.append("size", dim);
      form.append("quality", quality);
      blobs.forEach((b, i) => form.append("image[]", new File([b], `ref${i}.` + (b.type.split("/")[1] || "png"), { type: b.type })));
      r = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
    } else {
      r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt: fullPrompt, size: dim, quality, n: 1 }),
      });
    }
    const out = await r.json();
    if (!r.ok) return json({ error: out?.error?.message || "Lỗi khi gọi AI vẽ ảnh" }, 502);
    const b64 = out?.data?.[0]?.b64_json;
    if (!b64) return json({ error: "AI vẽ ảnh không trả về ảnh" }, 502);

    // Save into Kho ảnh so the picture can be reused later
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `ai-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}.png`;
    const up = await admin.storage.from("artworks").upload(path, bytes, { contentType: "image/png" });
    if (up.error) return json({ error: "Không lưu được ảnh vào kho: " + up.error.message }, 500);
    const publicUrl = admin.storage.from("artworks").getPublicUrl(path).data.publicUrl;
    const data = {
      name: String(name || "Tranh AI vẽ").slice(0, 60), desc: prompt.slice(0, 300),
      tags: ["ai vẽ", ...(Array.isArray(tags) ? tags.map((t: unknown) => String(t).toLowerCase()).slice(0, 10) : [])],
      mood: "", event: "", focus: { x: 0.5, y: 0.45 }, logo: null, path, url: publicUrl, w: +dim.split("x")[0], h: +dim.split("x")[1], addedBy: user.id, created: Date.now(), ai: true,
    };
    const ins = await admin.from("artworks").insert({ data, created_by: user.id }).select("id").single();
    if (ins.error) return json({ error: "Không ghi được vào kho: " + ins.error.message }, 500);
    return json({ id: ins.data.id, url: publicUrl });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});
