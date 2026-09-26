# Đưa app Tam Sinh Duyên lên GitHub Pages

Làm lần lượt từ trên xuống. Tổng thời gian khoảng 30–45 phút.

## Phần A. Supabase (dữ liệu, đăng nhập, AI)

1. Vào https://supabase.com → đăng nhập bằng GitHub → **New project**.
   Đặt tên `tam-sinh-duyen`, tạo mật khẩu database (lưu lại), Region chọn **Southeast Asia (Singapore)** → Create.
2. Chờ project tạo xong, vào **SQL Editor → New query**, mở file `supabase/schema.sql`, copy toàn bộ, dán vào, bấm **Run**.
3. Vào **Authentication → Sign In / Providers**, TẮT mục **Allow new users to sign up**, rồi Save.
   (Để người ngoài không tự đăng ký được, chỉ admin mới cấp tài khoản.)
4. Tạo tài khoản admin đầu tiên:
   - **Authentication → Users → Add user → Create new user**
   - Email: `admin@tsd-app.com` (phần trước @ chính là tên đăng nhập, ví dụ muốn đăng nhập bằng `tuan` thì nhập `tuan@tsd-app.com`)
   - Mật khẩu: tối thiểu 8 ký tự, tích **Auto Confirm User** → Create.
   - Quay lại **SQL Editor**, chạy câu sau (sửa tên đăng nhập, họ tên và email cho khớp):
     ```sql
     insert into public.profiles (id, username, name, role)
       select id, 'admin', 'Tên của bạn', 'admin' from auth.users where email = 'admin@tsd-app.com';
     ```
5. Lấy khóa AI: vào https://console.anthropic.com → **API Keys → Create Key**, copy khóa (bắt đầu bằng `sk-ant-`). Nạp credit trong mục Billing.
6. Trong Supabase vào **Edge Functions → Secrets**, thêm:
   - Name: `ANTHROPIC_API_KEY` — Value: khóa vừa copy → Save.
7. Tạo 2 hàm máy chủ: **Edge Functions → Deploy a new function → Via Editor**
   - Tên `write-post`: xóa code mẫu, dán toàn bộ file `supabase/functions/write-post/index.ts` → **Deploy**.
   - Làm tương tự với tên `admin-users`, dán file `supabase/functions/admin-users/index.ts` → **Deploy**.
8. Vào **Project Settings → API** (hoặc nút **Connect** ở trên cùng), copy:
   - **Project URL**
   - Khóa **anon public** (hoặc **publishable**)
   Mở file `config.js`, dán vào 2 chỗ tương ứng. KHÔNG dán khóa `service_role` / `secret`.

## Phần B. GitHub Pages (giao diện web)

1. Vào https://github.com/new → Repository name: `tam-sinh-duyen` → chọn **Public** → Create repository.
2. Bấm **uploading an existing file**, kéo thả vào: `index.html`, `config.js`, thư mục `assets` (và thư mục `supabase` để lưu trữ, không bắt buộc) → **Commit changes**.
3. Vào **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main`, thư mục `/ (root)` → **Save**.
4. Chờ 1–2 phút, tải lại trang Settings → Pages sẽ thấy địa chỉ dạng:
   `https://tentaikhoan.github.io/tam-sinh-duyen/`
5. Mở địa chỉ đó, đăng nhập bằng tên `admin` và mật khẩu ở bước A4. Vào tab **Tài khoản** để cấp tài khoản cho nhóm.

## Sửa code sau này

- Mở kho code trên GitHub, bấm phím **.** (dấu chấm) → hiện trình soạn thảo giống VS Code ngay trên trình duyệt.
- Sửa file, bấm biểu tượng **Source Control** bên trái → gõ ghi chú → **Commit & Push**.
- Khoảng 1 phút sau web tự cập nhật. Nếu chưa thấy thay đổi, nhấn **Ctrl + F5**.

## Gặp lỗi thường gặp

- **Màn hình báo "Chưa cấu hình kết nối"**: kiểm tra lại `config.js`.
- **Đăng nhập báo "chưa được cấp quyền"**: tài khoản có trong Users nhưng chưa chạy lệnh insert ở bước A4.
- **Viết bài báo lỗi khóa API**: kiểm tra Secret `ANTHROPIC_API_KEY` và credit trong tài khoản Anthropic.
- Muốn đổi model AI: thêm Secret `AI_MODEL` (mặc định `claude-sonnet-5`). Danh sách model: https://docs.claude.com/en/docs/about-claude/models/overview
