// Phím tắt → tìm tab web Tam Sinh Duyên đang mở → lấy mã tiếp theo ở đó → copy vào clipboard → hiện thông báo.
const SITES = ["https://tamsinhduyenpanel.io.vn/*", "https://*.github.io/tam-sinh-duyen/*"];
let busy = false;

chrome.commands.onCommand.addListener(cmd => { if (cmd === "copy-next-code") run(); });
chrome.action.onClicked.addListener(() => run());

async function run() {
  if (busy) return;
  busy = true;
  try {
    const tabs = await chrome.tabs.query({ url: SITES });
    if (!tabs.length) return notify("Chưa mở web Tam Sinh Duyên", "Mở web, vào tab Phát code và giữ tab đó mở rồi bấm lại.");
    let res = null;
    for (const t of tabs) {
      try {
        const [r] = await chrome.scripting.executeScript({
          target: { tabId: t.id }, world: "MAIN",
          func: () => (typeof window.tsdHotkeyNext === "function" ? window.tsdHotkeyNext() : null),
        });
        if (r && r.result) { res = r.result; break; }
      } catch (e) { /* tab đang tải hoặc bị trình duyệt ngủ đông: thử tab khác */ }
    }
    if (!res) return notify("Chưa bật phím tắt", "Trên web Tam Sinh Duyên, vào Phát code và tích ô “Bật phím tắt”.");
    if (!res.ok) return notify("Không lấy được mã", res.error || "Lỗi không rõ");
    await copy(res.msg);
    chrome.action.setBadgeText({ text: String(res.left) });
    chrome.action.setBadgeBackgroundColor({ color: "#9E1B3A" });
    notify(`Đã copy mã ${res.code}`, `Dán (Ctrl+V) vào tin nhắn. Còn ${res.left} mã · ${res.batch || ""}`);
  } catch (e) {
    notify("Lỗi phím tắt", String(e && e.message || e));
  } finally {
    busy = false;
  }
}

// Service worker không có clipboard: nhờ một trang ẩn (offscreen) copy giúp
async function copy(text) {
  try {
    await chrome.offscreen.createDocument({ url: "offscreen.html", reasons: ["CLIPBOARD"], justification: "Copy mã vào clipboard" });
  } catch (e) { /* trang ẩn đã có sẵn */ }
  const ok = await chrome.runtime.sendMessage({ type: "tsd-copy", text });
  if (!ok) throw new Error("Không copy được vào clipboard");
}

function notify(title, message) {
  chrome.notifications.create({ type: "basic", iconUrl: "icon.png", title, message, priority: 1 });
}
