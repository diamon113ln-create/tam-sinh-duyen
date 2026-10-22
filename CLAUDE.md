# Ghi chú cho Claude

Game của người dùng: **Mộng Kiếm Hiệp** (thể loại kiếm hiệp). Trang quản trị: mongkiemhiep.net/admin (mã nguồn không nằm trong repo này).

## Viết prompt ảnh (poster/banner Tam Sinh Duyên)

Khi người dùng nhờ viết prompt tạo ảnh để gửi cho GPT:

- Viết prompt bằng **tiếng Anh**, giải thích/mẹo bằng tiếng Việt.
- Mặc định **ảnh nằm ngang để đăng Facebook**: tỉ lệ **16:9 (1920×1080)**, bố cục ngang, chừa vùng an toàn ở giữa để Facebook không cắt mất chữ.
- Bộ yêu cầu mặc định của mỗi prompt:
  - 🎨 Tông màu tùy chọn (để placeholder `[choose one: ...]`)
  - 👥 Nền gameplay cực đông người, cảm giác quy mô lớn, làm mờ phía sau
  - 🖌️ Tiêu đề lớn font thư pháp/brush, nổi bật ở trung tâm
  - ✨ Slogan ngắn, giật gân, tạo hype
  - 🌫️ Hiệu ứng mực loang, khói, ánh sáng vàng, tre/lá
  - 🏔️ Phong cách poster kiếm hiệp điện ảnh, bố cục hoành tráng
  - 🏷️ Logo Tam Sinh Duyên ở phía trên
- Luôn nhắc GPT giữ đúng dấu tiếng Việt cho mọi chữ trên ảnh.
- Kèm vài slogan thay thế theo chủ đề.

## Thiết kế giao diện (web, trang quản trị, dashboard)

Khi thiết kế hoặc thiết kế lại giao diện, áp dụng các skill tham khảo đã lưu trong `.claude/skills/`:

- `design-taste-frontend` (nguồn: https://github.com/leonxlnx/taste-skill/tree/main/skills/taste-skill): trang web dùng phần "The run" trong SKILL.md. Màn hình làm việc (dashboard, trang quản trị) phải đọc trọn `references/app-screens.md`. Bản lưu ở đây không kèm thư mục `scripts/`, nên các lệnh `draw.mjs`/`inspect.mjs` chỉ dùng được khi tải đủ repo gốc.
- `web-design-guidelines` (nguồn: https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines): danh sách kiểm tra (accessibility, focus, form, typography, dark mode…). Bản quy tắc đầy đủ nằm ở `guidelines.md`; nên tải lại bản mới khi review.
- awesome-design-md (https://github.com/VoltAgent/awesome-design-md): kho file DESIGN.md mô tả hệ thiết kế của các trang web thật. Khi người dùng muốn "giống trang X", lấy DESIGN.md tương ứng làm chuẩn màu, chữ, khoảng cách.
- image-to-code-skill (https://github.com/leonxlnx/taste-skill/tree/main/skills/image-to-code-skill): thư mục này không còn tồn tại (404 lúc lưu, 22/10/2026). Khi chuyển ảnh chụp thành giao diện, làm theo app-screens.md.

Quy tắc chính cho trang quản trị (rút từ app-screens.md):
- Mỗi màn hình trả lời một câu hỏi trước. Khối lớn nhất (ở trang Tổng quan là biểu đồ doanh thu, đặt trên cùng) mang câu trả lời đó. Dưới tiêu đề có một câu nêu phát hiện quan trọng nhất.
- Màu đặt trên dữ liệu, không đặt trên khung. Mỗi biểu đồ một màu nhấn. Màu xanh/đỏ nói tốt hay xấu, không nói tăng hay giảm. Giá trị 0 để màu xám.
- KPI là chữ và số, không dùng thẻ có icon trong vòng tròn màu, không dùng sparkline. Gom KPI vào một khung chia bằng đường kẻ 1px.
- Bảng: tiêu đề cột viết thường cỡ 12px màu xám (không viết hoa), số căn phải, dùng chữ số đều (tabular-nums), không tô sọc dòng.
- Tiêu đề trang (h1) 24px; không con số nào từ 48px trở lên. Một bộ font grotesk hỗ trợ tiếng Việt (ví dụ Be Vietnam Pro); font thứ hai chỉ dùng cho logo/wordmark.
- Không gradient, glow, kính mờ, emoji. Nền tối trung tính, không dùng tông xanh navy.
- Chữ đạt độ tương phản 4.5:1. Nút có `aria-label` khi chỉ có icon. Có `:focus-visible`. Đặt `color-scheme: dark` cho giao diện tối.
