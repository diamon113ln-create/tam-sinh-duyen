chrome.runtime.onMessage.addListener((m, _sender, reply) => {
  if (m?.type !== "tsd-copy") return;
  const t = document.getElementById("t");
  t.value = m.text;
  t.select();
  reply(document.execCommand("copy"));
});
