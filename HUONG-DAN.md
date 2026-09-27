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

## Bật Kho ảnh (làm 1 lần)

1. Supabase → **SQL Editor → New query**, dán toàn bộ file `supabase/kho-anh.sql` → **Run**.
2. Deploy lại hàm `write-post` bằng file mới nhất `supabase/functions/write-post/index.ts` (để AI xem được ảnh và tự gắn nhãn).
3. Vào web → **Kho ảnh** → tải ảnh lên. Mỗi ảnh AI gắn nhãn tốn khoảng 100đ.

## Bật AI vẽ tranh (OpenAI, không bắt buộc)

1. Tạo khóa ở https://platform.openai.com/api-keys (nạp credit ở mục Billing). **Không gửi khóa cho ai, không dán vào chat.**
2. Supabase → **Edge Functions → Secrets** → thêm `OPENAI_API_KEY` = khóa vừa tạo → Save.
3. **Edge Functions → Deploy a new function → Via Editor**, tên `draw-image`, dán toàn bộ file `supabase/functions/draw-image/index.ts` → **Deploy**.
4. Vào web → Viết bài nhanh → **AI vẽ tranh mới**. Tranh vẽ xong tự lưu vào Kho ảnh.
- Tùy chọn Secrets: `OPENAI_IMAGE_QUALITY` = `low` (rẻ nhất) / `medium` (mặc định) / `high`; `OPENAI_IMAGE_MODEL` để đổi model.

## Lịch tuần (viết bài theo lịch)

1. Vào tab **Lịch tuần** → **Thêm hoạt động** (hoặc bấm **+** ở ngày muốn thêm).
2. Nhập tên (ví dụ `Tài nguyên chiến`), tích các ngày trong tuần, giờ bắt đầu, chọn **Mẫu bài viết** (hoặc sheet), **Ảnh gắn sẵn** từ Ảnh hoạt động / Kho ảnh, phần thưởng nếu có → **Lưu**.
3. Vào **Viết bài nhanh**: phía trên có ô **Gợi ý theo lịch tuần**, chọn ngày (Hôm nay, Ngày mai…), bấm vào ô hoạt động → AI tự viết bài đúng ngày đó và gắn sẵn ảnh, chỉ việc Copy đăng.
- Lịch lưu chung trong bảng mẫu bài, không cần chạy thêm SQL.

## Sửa code sau này

- Mở kho code trên GitHub, bấm phím **.** (dấu chấm) → hiện trình soạn thảo giống VS Code ngay trên trình duyệt.
- Sửa file, bấm biểu tượng **Source Control** bên trái → gõ ghi chú → **Commit & Push**.
- Khoảng 1 phút sau web tự cập nhật. Nếu chưa thấy thay đổi, nhấn **Ctrl + F5**.

## Gặp lỗi thường gặp

- **Màn hình báo "Chưa cấu hình kết nối"**: kiểm tra lại `config.js`.
- **Đăng nhập báo "chưa được cấp quyền"**: tài khoản có trong Users nhưng chưa chạy lệnh insert ở bước A4.
- **Viết bài báo lỗi khóa API**: kiểm tra Secret `ANTHROPIC_API_KEY` và credit trong tài khoản Anthropic.
- **AI trả về sai định dạng / bị cắt giữa chừng**: deploy lại hàm `write-post` bằng file mới nhất trong repo.
- Muốn AI suy nghĩ kỹ hơn (tốn token hơn): thêm Secret `AI_EFFORT` = `medium` hoặc `high` (mặc định `low`).
- Muốn đổi model AI: thêm Secret `AI_MODEL` (mặc định `claude-sonnet-5`). Danh sách model: https://docs.claude.com/en/docs/about-claude/models/overview
