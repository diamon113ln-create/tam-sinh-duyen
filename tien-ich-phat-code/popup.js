const $ = s => document.querySelector(s);
function show(on) {
  $("#on").checked = on;
  $("#state").textContent = on ? "Phím tắt: BẬT" : "Phím tắt: TẮT";
  $("#state").style.color = on ? "#2F7D5B" : "#777";
}
(async () => {
  const { enabled = true, left, batch } = await chrome.storage.local.get(["enabled", "left", "batch"]);
  show(enabled);
  const c = (await chrome.commands.getAll()).find(x => x.name === "copy-next-code");
  $("#key").textContent = c && c.shortcut ? c.shortcut : "chưa đặt – bấm Đổi phím tắt";
  if (left !== undefined) $("#left").innerHTML = `Còn <b>${left}</b> mã${batch ? " · " + batch : ""}`;
})();
$("#on").onchange = async () => {
  const on = $("#on").checked;
  await chrome.storage.local.set({ enabled: on });
  show(on);
  chrome.runtime.sendMessage({ type: "tsd-badge" });
};
$("#copy").onclick = async () => {
  $("#msg").textContent = "Đang lấy mã…";
  const r = await chrome.runtime.sendMessage({ type: "tsd-run" });
  $("#msg").textContent = r ? r.text : "";
  const { left, batch } = await chrome.storage.local.get(["left", "batch"]);
  if (left !== undefined) $("#left").innerHTML = `Còn <b>${left}</b> mã${batch ? " · " + batch : ""}`;
};
$("#keys").onclick = () => chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
