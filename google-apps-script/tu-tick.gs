// Tam Sinh Duyên – tự tick mã đã phát vào Google Sheet.
// Cài 1 lần trong file sheet chứa mã: Tiện ích mở rộng → Apps Script → dán toàn bộ file này → Triển khai → Ứng dụng web.
// Chỉ làm đúng một việc: đánh / xóa dấu tick ở dòng có mã tương ứng. Không đọc hay gửi dữ liệu nào khác.
const MAT_KHAU = "__MAT_KHAU__"; // web gửi kèm mật khẩu này; người ngoài có link cũng không gọi được

function doGet() {
  return out({ ok: true, msg: "Tự tick Tam Sinh Duyên đang chạy" });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const p = JSON.parse(e.postData.contents || "{}");
    if (p.secret !== MAT_KHAU) return out({ ok: false, error: "Sai mật khẩu tự tick" });
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = p.gid !== undefined && p.gid !== null && p.gid !== ""
      ? ss.getSheets().find(s => String(s.getSheetId()) === String(p.gid))
      : ss.getSheets()[0];
    if (!sh) return out({ ok: false, error: "Không tìm thấy trang tính (gid " + p.gid + ")" });
    if (p.ping) return out({ ok: true, sheet: sh.getName() });

    const codeCol = Number(p.codeCol) + 1, tickCol = Number(p.tickCol) + 1, start = Number(p.start) + 1;
    if (!(codeCol > 0 && tickCol > 0 && start > 0)) return out({ ok: false, error: "Thiếu cột mã / cột tick" });
    const last = sh.getLastRow();
    if (last < start) return out({ ok: true, done: [], missing: p.codes || [] });

    lock.waitLock(20000);
    const n = last - start + 1;
    const codes = sh.getRange(start, codeCol, n, 1).getDisplayValues();
    const where = {};
    codes.forEach((r, i) => { const k = String(r[0]).trim().toUpperCase(); if (k && where[k] === undefined) where[k] = i; });
    // ô tick là checkbox thì ghi TRUE/FALSE, còn lại ghi "x" / để trống
    const rule = sh.getRange(start, tickCol).getDataValidation();
    const isBox = !!rule && rule.getCriteriaType() === SpreadsheetApp.DataValidationCriteria.CHECKBOX;
    const done = [], missing = [];
    (p.codes || []).forEach(c => {
      const i = where[String(c).trim().toUpperCase()];
      if (i === undefined) { missing.push(c); return; }
      sh.getRange(start + i, tickCol).setValue(isBox ? !!p.tick : (p.tick ? "x" : ""));
      done.push(c);
    });
    SpreadsheetApp.flush();
    return out({ ok: true, done: done, missing: missing });
  } catch (err) {
    return out({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
