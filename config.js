// Điền 2 giá trị lấy từ Supabase: Project Settings → API (hoặc nút "Connect")
// Khóa "anon / publishable" là khóa công khai, để ở đây an toàn vì dữ liệu đã được khóa bằng phân quyền (RLS).
// TUYỆT ĐỐI KHÔNG dán khóa "service_role / secret" vào file này.
window.APP_CONFIG = {
  SUPABASE_URL: "https://tolbejqbdvktdmjbudln.supabase.co/rest/v1/",
  SUPABASE_ANON_KEY: "sb_publishable_p_GG6-6fGgTk0rtKghS8JQ_eIs2tlMh",
  // Đuôi email ẩn dùng để đăng nhập bằng "tên đăng nhập". Không cần sửa.
  USER_DOMAIN: "tsd-app.com"
};
