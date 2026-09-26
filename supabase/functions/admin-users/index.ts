// Hàm cấp / xóa / đặt lại mật khẩu tài khoản. Chỉ Admin gọi được.
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
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Xác định người gọi
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "Chưa đăng nhập" }, 401);
    const { data: caller } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (caller?.role !== "admin") return json({ error: "Chỉ Admin được quản lý tài khoản" }, 403);

    const body = await req.json();
    if (body.action === "create") {
      const { username, email, name, role, password } = body;
      if (!/^[a-z0-9_.]{3,30}$/.test(username)) return json({ error: "Tên đăng nhập 3–30 ký tự, chữ không dấu, số, dấu chấm, gạch dưới" }, 400);
      if (!password || password.length < 8) return json({ error: "Mật khẩu cần ít nhất 8 ký tự" }, 400);
      if (!["admin", "lead", "member"].includes(role)) return json({ error: "Vai trò không hợp lệ" }, 400);
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) return json({ error: error.message }, 400);
      const { error: e2 } = await admin.from("profiles").insert({ id: data.user.id, username, name: name || username, role });
      if (e2) { await admin.auth.admin.deleteUser(data.user.id); return json({ error: e2.message }, 400); }
      return json({ ok: true });
    }
    if (body.action === "delete") {
      if (body.id === user.id) return json({ error: "Không thể tự xóa chính mình" }, 400);
      const { error } = await admin.auth.admin.deleteUser(body.id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }
    if (body.action === "reset") {
      if (!body.password || body.password.length < 8) return json({ error: "Mật khẩu cần ít nhất 8 ký tự" }, 400);
      const { error } = await admin.auth.admin.updateUserById(body.id, { password: body.password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }
    return json({ error: "Thao tác không hợp lệ" }, 400);
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});
