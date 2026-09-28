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

## Chỉ Admin xem danh sách tài khoản (làm 1 lần)

Supabase → **SQL Editor → New query**, dán toàn bộ file `supabase/chi-admin-xem-tai-khoan.sql` → **Run**.
Sau đó Thành viên / Trưởng nhóm chỉ thấy tên hiển thị của mọi người (để giao việc), không xem được tên đăng nhập và vai trò; tab **Tài khoản** chỉ Admin thấy.

## Report ngày (tab Công việc)

1. Tab **Công việc → 📝 Report ngày**: chọn ngày (mặc định hôm nay).
2. Mỗi dự án (jx2, Phong Vân…) có 3 ô: **Đã fix**, **Đang fix**, **Việc làm tiếp theo**. Ô để trống sẽ hiện là `Trống`.
3. Bấm **🔄 Cập nhật** để lưu; khung bên phải hiện report đúng mẫu (`# Report: dd/mm/yyyy` …), bấm **📋 Copy report** để gửi.
- **📥 Lấy từ report trước**: chép "Đang fix" + "Việc làm tiếp theo" của report gần nhất vào ô "Đang fix" còn trống.
- Thêm / bỏ dự án bằng các nhãn phía trên (dùng chung cả nhóm). Danh sách **Report đã lưu** xem lại được report của mọi người.
- **✏️ Sửa mẫu report** (nút cạnh Copy report): sửa tiêu đề, thứ tự, chữ khi để trống. Dùng `{ngay}`, `{thu}`; phần giữa `{moi_du_an}` … `{het}` lặp cho từng dự án, trong đó có `{du_an}`, `{da_fix}`, `{dang_fix}`, `{tiep_theo}`. Có nút Khôi phục mẫu gốc.
- Bảng việc cũ vẫn ở **📋 Bảng việc fanpage**.

## Lịch tuần (viết bài theo lịch)

1. Vào tab **Lịch tuần** → **Thêm hoạt động** (hoặc bấm **+** ở ngày muốn thêm).
2. Nhập tên (ví dụ `Tài nguyên chiến`), tích các ngày trong tuần, giờ bắt đầu, chọn **Mẫu bài viết** (hoặc sheet), **Ảnh gắn sẵn** từ Ảnh hoạt động / Kho ảnh, phần thưởng nếu có → **Lưu**.
3. Vào **Viết bài nhanh**: phía trên có ô **Gợi ý theo lịch tuần**, chọn ngày (Hôm nay, Ngày mai…), bấm vào ô hoạt động → AI tự viết bài đúng ngày đó và gắn sẵn ảnh, chỉ việc Copy đăng.
- Lịch lưu chung trong bảng mẫu bài, không cần chạy thêm SQL.

## Hỏi AI (tạo code không trùng)

1. Vào tab **Hỏi AI**, gõ câu hỏi (ví dụ `Tạo 20 code fan cứng, 8 ký tự, bắt đầu bằng TSD`) → **Hỏi AI** (hoặc Ctrl+Enter).
2. Ô **Đã gửi / đã dùng** bên phải: mỗi dòng một mục (code đã phát, tên đã dùng…) → **Lưu danh sách**. AI tránh các mục này, web còn tự kiểm tra lại: mục nào trùng bị loại và AI tạo bù.
3. Câu trả lời hiện ở khung **Kết quả** bên phải: bài viết xuống dòng rõ ràng, có icon đầu dòng; danh sách code đánh số. Bấm **Copy** (hoặc **Copy chỉ danh sách** để lấy mỗi dòng một code), rồi **Thêm N mục vào danh sách đã gửi** để lần sau không bị trùng.
4. Câu hỏi hay dùng: gõ vào ô rồi bấm **+ Lưu câu hỏi thành thẻ**; lần sau chỉ cần bấm thẻ.
- Bấm **💾 Lưu bài viết** dưới khung Kết quả để lưu bài thành Mẫu bài viết; qua **Viết bài nhanh** chọn mẫu đó, đổi ngày rồi bấm Viết bài.
- Danh sách đã gửi và thẻ hỏi dùng chung cả nhóm; đoạn hội thoại chỉ lưu trên máy đang dùng.

## Phát code riêng cho mem

1. Trong Google Sheet chứa mã: **Chia sẻ → Quyền truy cập chung → Bất kỳ ai có đường liên kết (Người xem)**. Mở đúng trang tính có mã rồi copy link.
2. Vào tab **Phát code → Thêm đợt code**: đặt tên, dán link sheet (hoặc chọn file Excel/CSV, hoặc dán danh sách mã), sửa **tin nhắn mẫu** (`{code}` là chỗ điền mã) → **Lưu**.
   - Web tự tìm cột mã. Nếu sheet có cột ô tick (TRUE/FALSE) thì mã đã tick được coi là đã phát.
   - Muốn chọn đúng cột: bấm **📑 Đọc sheet & chọn cột**, chọn **Cột chứa mã**, **Cột tick** và **dòng bắt đầu**, xem trước 5 mã đầu rồi Lưu. Lựa chọn được nhớ cho lần lấy mã mới.
   - Đã lỡ lấy sai cột: bấm **Chọn lại cột mã** ở tab Phát code, chọn lại cột rồi Lưu (tự tích *Thay toàn bộ danh sách*; mã đã phát vẫn giữ trạng thái).
3. Mỗi lần bấm **📋 Copy mã tiếp theo**: web copy 1 mã chưa tick (từ trên xuống) kèm tin nhắn và tự tick mã đó. Dán vào tin nhắn gửi mem.
   - Lỡ bấm mà chưa gửi: bấm **Hoàn tác** để trả mã lại.
   - Cả nhóm dùng chung, 2 người bấm cùng lúc cũng không bị trùng mã (web báo nếu mã vừa bị người khác lấy).
4. **Web tự đồng bộ với sheet** khoảng 20 giây một lần khi đang mở tab Phát code (hoặc khi đã bật phím tắt): mã tick trong sheet được tick theo trên web, mã mới thêm vào sheet được thêm vào cuối. Muốn cập nhật ngay thì bấm **🔄 Đồng bộ với Google Sheet ngay**.
   - Bỏ tick trong sheet **không** bỏ tick trên web (để tránh phát trùng). Muốn trả mã lại thì bỏ tick trong danh sách trên web.
- **Tự tick vào Google Sheet** (không bắt buộc, cài 1 lần cho mỗi file sheet): trong hộp **Sửa tin nhắn / nguồn mã**, chọn **Cột tick**, mở mục **🔗 Tự tick vào Google Sheet** rồi làm theo 4 bước:
  1. Google Sheet → **Tiện ích mở rộng → Apps Script**.
  2. Xóa code có sẵn, bấm **📋 Copy đoạn script** trên web rồi dán vào (mật khẩu đã có sẵn trong script) → **Lưu dự án**.
  3. **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**, Thực thi với tư cách **Tôi**, Người có quyền truy cập **Bất kỳ ai** → Triển khai → cấp quyền (Nâng cao → Đi tới… → Cho phép).
  4. Copy **URL ứng dụng web** (…/exec) dán vào ô **Link tự tick** → **Thử kết nối** → **Lưu**.
  - Từ đó mỗi lần Copy mã / Hoàn tác / tick tay, web tự đánh "x" (hoặc tích ô checkbox) vào đúng dòng trong sheet. Mã đã phát từ trước: bấm **📗 Tick lên sheet các mã đã phát**.
  - Đổi mật khẩu thì phải copy lại script và **Triển khai → Quản lý các lần triển khai → Chỉnh sửa → Phiên bản mới**.
  - Nếu không cài: dùng **Copy các mã đã phát** hoặc **Tải Excel** để cập nhật sheet bằng tay.
- **Phím tắt copy mã**: tích ô **⌨️ Bật phím tắt** trong tab Phát code, rồi bấm `Alt + Shift + C` để copy mã tiếp theo.
  - Muốn bấm phím khi đang ở tab khác (Vpage, Messenger…): cài tiện ích **Phát code nhanh** (1 lần). Trên web bấm **⬇️ Tải tiện ích** → giải nén → mở `chrome://extensions` (Cốc Cốc: `coccoc://extensions`) → bật **Chế độ dành cho nhà phát triển** → **Tải tiện ích đã giải nén** → chọn thư mục `tien-ich-phat-code`.
  - Giữ 1 tab web đang mở ở Phát code (đúng đợt code, đã tích Bật phím tắt). Ở tab bất kỳ bấm `Alt + Shift + C` rồi `Ctrl + V` để dán. Góc màn hình báo mã vừa copy và số mã còn lại.
  - **Bấm biểu tượng tiện ích** (ghim qua 🧩 → 📌) để mở bảng nhỏ: công tắc **Bật / Tắt** phím tắt, số mã còn lại, nút Copy mã, nút **Đổi phím tắt**. Khi tắt, biểu tượng hiện chữ OFF.
  - Cập nhật tiện ích: tải bản mới, giải nén đè lên thư mục cũ, vào `chrome://extensions` bấm ⟳ ở tiện ích.
  - Đổi phím: `chrome://extensions/shortcuts`. Sửa file trong thư mục `tien-ich-phat-code` thì chạy lại lệnh đóng gói zip (hoặc nhờ Claude) để nút Tải tiện ích có bản mới.

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
