/**
 * وب‌جیکو — خروج روشن از حالت مدیر.
 * بعد از بقیه‌ی هوک‌ها اجرا می‌شود و به‌جای بستن بی‌صدا، پنل را روی فرم ورود
 * باز می‌گذارد و پیام «خارج شدی» نشان می‌دهد. همچنین جلوی باز‌شدن خودکار
 * پنجره‌ی «یادداشت خصوصی» را در بارگذاری صفحه می‌گیرد. تکرارشدنی است.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.argv[2] || dirname(fileURLToPath(import.meta.url));
const file = join(ROOT, "public", "app.js");
let src = readFileSync(file, "utf8");

const MARK = "از حساب خارج شدی";
const NOTE_BAD = 'add(58, "یادداشت خصوصی روی نوشته", openNotes);';
const NOTE_OK = 'add(58, "یادداشت خصوصی روی نوشته", function () {});';

/* قابلیت ۵۸ فقط باید با دکمه‌اش باز شود؛ باز‌شدن خودکارش کل صفحه را می‌پوشاند */
const feats = join(ROOT, "public", "feats.js");
if (existsSync(feats)) {
  const bundle = readFileSync(feats, "utf8");
  if (bundle.includes(NOTE_BAD)) {
    writeFileSync(feats, bundle.replace(NOTE_BAD, NOTE_OK), "utf8");
    console.log("apply-logout: باز شدن خودکار یادداشت خاموش شد");
  }
}

if (src.includes(MARK)) {
  console.log("apply-logout: قبلاً اعمال شده");
  process.exit(0);
}

const from = `  logoutBtn.addEventListener("click", function () {
    try { localStorage.removeItem(ADMIN_KEY); } catch (e) {}
    showLogin();
    closePanel();
  });`;

const to = `  logoutBtn.addEventListener("click", function () {
    try { localStorage.removeItem(ADMIN_KEY); } catch (e) {}
    showLogin();
    openPanel();
    setMsg(loginMsg, "از حساب خارج شدی. برای ورود دوباره رمز مدیر را بزن.", "ok");
    setTimeout(function () { try { passInput.focus(); } catch (e) {} }, 60);
  });`;

if (!src.includes(from)) {
  console.error("apply-logout: دکمه‌ی خروج در public/app.js پیدا نشد.");
  process.exit(1);
}

writeFileSync(file, src.replace(from, to), "utf8");
console.log("apply-logout: پیام خروج به app.js اضافه شد");
