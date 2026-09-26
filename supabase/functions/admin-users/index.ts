// Hàm cấp / xóa / đặt lại mật khẩu tài khoản. Chỉ Admin gọi được.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const badPass = (p: unknown) => typeof p !== "string" || p.length < 8 || p.length > 72;
// Dịch các lỗi hay gặp của Supabase Auth sang tiếng Việt
const vi = (msg: string) =>
  /already (been )?registered|already exists/i.test(msg) ? "Tên đăng nhập này đã có tài khoản trong Supabase (Authentication → Users)" :
  /duplicate key/i.test(msg) ? "Tên đăng nhập đã có người dùng" :
  /password/i.test(msg) ? "Mật khẩu không hợp lệ: " + msg : msg;

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

    const body = await req.json().catch(() => ({}));
    if (body.action === "create") {
      const { username, email, role, password } = body;
      const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
      if (typeof username !== "string" || !/^[a-z0-9_.]{3,30}$/.test(username)) return json({ error: "Tên đăng nhập 3–30 ký tự, chữ không dấu, số, dấu chấm, gạch dưới" }, 400);
      // Email phải là <tên đăng nhập>@..., nếu không người dùng sẽ không đăng nhập được bằng tên
      if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.split("@")[0].toLowerCase() !== username)
        return json({ error: "Email không khớp với tên đăng nhập" }, 400);
      if (badPass(password)) return json({ error: "Mật khẩu cần từ 8 đến 72 ký tự" }, 400);
      if (!["admin", "lead", "member"].includes(role)) return json({ error: "Vai trò không hợp lệ" }, 400);
      const { data, error } = await admin.auth.admin.createUser({ email: email.toLowerCase(), password, email_confirm: true });
      if (error) return json({ error: vi(error.message) }, 400);
      const { error: e2 } = await admin.from("profiles").insert({ id: data.user.id, username, name: name || username, role });
      if (e2) { await admin.auth.admin.deleteUser(data.user.id); return json({ error: vi(e2.message) }, 400); }
      return json({ ok: true });
    }
    if (body.action === "delete" || body.action === "reset") {
      // Chỉ thao tác trên tài khoản thuộc app (có hồ sơ trong profiles)
      if (typeof body.id !== "string") return json({ error: "Thiếu tài khoản cần thao tác" }, 400);
      const { data: target } = await admin.from("profiles").select("id").eq("id", body.id).maybeSingle();
      if (!target) return json({ error: "Không tìm thấy tài khoản" }, 404);
    }
    if (body.action === "delete") {
      if (body.id === user.id) return json({ error: "Không thể tự xóa chính mình" }, 400);
      const { error } = await admin.auth.admin.deleteUser(body.id);
      if (error) return json({ error: vi(error.message) }, 400);
      return json({ ok: true });
    }
    if (body.action === "reset") {
      if (badPass(body.password)) return json({ error: "Mật khẩu cần từ 8 đến 72 ký tự" }, 400);
      const { error } = await admin.auth.admin.updateUserById(body.id, { password: body.password });
      if (error) return json({ error: vi(error.message) }, 400);
      return json({ ok: true });
    }
    return json({ error: "Thao tác không hợp lệ" }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
