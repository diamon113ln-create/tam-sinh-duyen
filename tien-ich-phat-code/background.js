// Phím tắt → tìm tab web Tam Sinh Duyên đang mở → lấy mã tiếp theo ở đó → copy vào clipboard → hiện thông báo.
// Bấm biểu tượng tiện ích: mở bảng nhỏ để BẬT / TẮT phím tắt.
const SITES = ["https://tamsinhduyenpanel.io.vn/*", "https://*.github.io/tam-sinh-duyen/*"];
let busy = false;

chrome.commands.onCommand.addListener(cmd => { if (cmd === "copy-next-code") run(); });
chrome.runtime.onInstalled.addListener(() => badge());
chrome.runtime.onStartup.addListener(() => badge());
chrome.runtime.onMessage.addListener((m, _s, reply) => {
  if (m?.type === "tsd-run") { run(true).then(reply); return true; }
  if (m?.type === "tsd-badge") { badge().then(() => reply(true)); return true; }
});

async function isOn() { const { enabled = true } = await chrome.storage.local.get("enabled"); return enabled; }

// Biểu tượng: số mã còn lại khi BẬT, chữ OFF màu xám khi TẮT
async function badge() {
  const on = await isOn();
  const { left } = await chrome.storage.local.get("left");
  chrome.action.setBadgeText({ text: on ? (left === undefined ? "" : String(left)) : "OFF" });
  chrome.action.setBadgeBackgroundColor({ color: on ? "#9E1B3A" : "#777777" });
}

// fromPopup: bấm nút trong bảng nhỏ thì vẫn chạy dù phím tắt đang tắt
async function run(fromPopup) {
  if (busy) return { ok: false, text: "Đang xử lý mã trước…" };
  if (!fromPopup && !(await isOn())) return { ok: false, text: "Phím tắt đang TẮT" };
  busy = true;
  try {
    const tabs = await chrome.tabs.query({ url: SITES });
    if (!tabs.length) return fail("Chưa mở web Tam Sinh Duyên", "Mở web, vào tab Phát code và giữ tab đó mở rồi bấm lại.");
    let res = null;
    for (const t of tabs) {
      try {
        const [r] = await chrome.scripting.executeScript({
          target: { tabId: t.id }, world: "MAIN",
          // {ext:true}: công tắc của tiện ích đã bật thì không cần tích ô trên web
          func: () => (typeof window.tsdHotkeyNext === "function" ? window.tsdHotkeyNext({ ext: true }) : null),
        });
        if (r && r.result) { res = r.result; break; }
      } catch (e) { /* tab đang tải hoặc bị trình duyệt ngủ đông: thử tab khác */ }
    }
    if (!res) return fail("Web chưa sẵn sàng", "Tải lại (F5) tab web Tam Sinh Duyên, đăng nhập và mở tab Phát code.");
    if (!res.ok) return fail("Không lấy được mã", res.error || "Lỗi không rõ");
    await copy(res.msg);
    await chrome.storage.local.set({ left: res.left, batch: res.batch || "" });
    await badge();
    notify(`Đã copy mã ${res.code}`, `Dán (Ctrl+V) vào tin nhắn. Còn ${res.left} mã · ${res.batch || ""}`);
    return { ok: true, text: `✅ Đã copy mã ${res.code} – dán (Ctrl+V) vào tin nhắn. Còn ${res.left} mã.` };
  } catch (e) {
    return fail("Lỗi phím tắt", String(e && e.message || e));
  } finally {
    busy = false;
  }
}
function fail(title, msg) { notify(title, msg); return { ok: false, text: `⚠️ ${title}: ${msg}` }; }

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
