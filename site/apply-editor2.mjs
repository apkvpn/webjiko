/**
 * وب‌جیکو — ادیتور نسخه‌ی دو:
 *  • فیلد وضعیت (منتشر/پیش‌نویس/زمان‌بندی) و زمان انتشار در فرم
 *  • save() تازه با پشتیبانی لینک دستی، وضعیت و زمان‌بندی
 *  • API کوچک window.WJ برای اسکریپت‌های کمکی (پیش‌نویس خودکار، استودیو تصویر)
 *  • قفل موقت بعد از رمز اشتباه و خروج خودکار بعد از بی‌عملی
 * بعد از apply-editor اجرا می‌شود و تکرارشدنی است.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.argv[2] || dirname(fileURLToPath(import.meta.url));
const part = (name) => readFileSync(join(ROOT, "parts", name), "utf8").trim() + "\n";

function replaceFn(text, name, body) {
  const at = text.indexOf("function " + name + "(");
  if (at < 0) return null;
  let depth = 0;
  const start = text.indexOf("{", at);
  for (let j = start; j < text.length; j += 1) {
    if (text[j] === "{") depth += 1;
    else if (text[j] === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(0, at) + body + text.slice(j + 1);
    }
  }
  return null;
}

/* ------------------------------- build.mjs ------------------------------- */

const bFile = join(ROOT, "build.mjs");
const bBefore = readFileSync(bFile, "utf8");
let b = bBefore;

const EXCERPT = `            <textarea id="postExcerpt" class="inp" rows="2" placeholder="خلاصه‌ی کوتاه (برای گوگل و کارت پست)" aria-label="خلاصه"></textarea>`;
const EXCERPT_NEW = `${EXCERPT}
            <div class="field-row field-status">
              <select id="postStatus" class="inp" aria-label="وضعیت پست">
                <option value="published">منتشر شود</option>
                <option value="draft">پیش‌نویس (منتشر نشود)</option>
                <option value="scheduled">زمان‌بندی انتشار</option>
              </select>
              <input id="postPublishAt" class="inp" type="datetime-local" aria-label="زمان انتشار" title="زمان انتشار" />
            </div>`;

if (!b.includes('id="postStatus"')) {
  if (!b.includes(EXCERPT)) {
    console.error("apply-editor2: کادر خلاصه پیدا نشد.");
    process.exit(1);
  }
  b = b.replace(EXCERPT, EXCERPT_NEW);
}
if (b !== bBefore) writeFileSync(bFile, b, "utf8");

/* ------------------------------- public/app.js ---------------------------- */

const aFile = join(ROOT, "public", "app.js");
const aBefore = readFileSync(aFile, "utf8");
let a = aBefore;

function must(from, to, label) {
  if (a.includes(to)) return;
  if (!a.includes(from)) {
    console.error(`apply-editor2: «${label}» پیدا نشد.`);
    process.exit(1);
  }
  a = a.split(from).join(to);
}

const next = replaceFn(a, "save", "  /* WJ-PART:save */\n" + part("save.txt"));
if (next == null) {
  console.error("apply-editor2: تابع save پیدا نشد.");
  process.exit(1);
}
a = next;

/* API عمومی برای اسکریپت‌های کمکی */
const API = `  /* WJ-API */
  window.WJ = {
    BASE: BASE, REPO: REPO, BRANCH: BRANCH,
    token: token, ghFetch: ghFetch, ghRead: ghRead, ghWrite: ghWrite, toB64: toB64, slugify: slugify,
    posts: function () { return postsCache; },
    setPosts: function (list) { postsCache = list; },
    refresh: refreshHome,
    editor: function () {
      return { title: titleIn, area: area, cover: coverIn, excerpt: excerptIn, cat: catIn,
               slug: $("#postSlug"), status: $("#postStatus"), when: $("#postPublishAt") };
    },
    panel: function () { return panel; },
    loggedIn: function () { return state.loggedIn; },
    editingId: function () { return state.editingId; },
    edit: function (id) { state.editingId = id; },
    say: function (msg, kind) { setMsg(editorMsg, msg, kind); }
  };

`;
must(
  `  /* ------------------------------- bootstrap ----------------------------- */`,
  API + `  /* ------------------------------- bootstrap ----------------------------- */`,
  "نقطه‌ی bootstrap",
);

/* قفل موقت بعد از چند رمز اشتباه + خروج خودکار */
const GUARD = `  /* WJ-GUARD */
  var LOCK_KEY = "wj_lock_until";
  var FAIL_KEY = "wj_fail_count";
  var MAX_TRIES = 5;
  var LOCK_MINUTES = 5;
  function lockLeft() {
    try {
      var until = Number(localStorage.getItem(LOCK_KEY) || 0);
      if (until > Date.now()) return Math.ceil((until - Date.now()) / 60000);
      if (until) { localStorage.removeItem(LOCK_KEY); localStorage.removeItem(FAIL_KEY); }
    } catch (e) {}
    return 0;
  }
  function armIdle() {
    var timer = null;
    function reset() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        try { localStorage.removeItem(ADMIN_KEY); } catch (e) {}
        if (state.loggedIn) { showLogin(); closePanel(); }
      }, 30 * 60 * 1000);
    }
    ["click", "keydown", "input"].forEach(function (ev) { document.addEventListener(ev, reset, true); });
    reset();
  }
`;
must(
  `  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();`,
  `${GUARD}  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var wait = lockLeft();
    if (wait) {
      setMsg(loginMsg, "چند بار رمز اشتباه بود؛ " + wait + " دقیقه بعد دوباره تلاش کن.", "error");
      return;
    }`,
  "بررسی قفل ورود",
);

must(
  `    if (password !== PASS) {
      setMsg(loginMsg, "رمز اشتباه است. عددها را با کیبورد انگلیسی یا فارسی وارد کن.", "error");
      passInput.select();
      return;
    }`,
  `    if (password !== PASS) {
      var tries = 0;
      try { tries = Number(localStorage.getItem(FAIL_KEY) || 0) + 1; } catch (e1) { tries = 1; }
      try { localStorage.setItem(FAIL_KEY, String(tries)); } catch (e2) {}
      if (tries >= MAX_TRIES) {
        try {
          localStorage.setItem(LOCK_KEY, String(Date.now() + LOCK_MINUTES * 60000));
          localStorage.removeItem(FAIL_KEY);
        } catch (e3) {}
        setMsg(loginMsg, "رمز " + MAX_TRIES + " بار اشتباه بود؛ " + LOCK_MINUTES + " دقیقه صبر کن.", "error");
        return;
      }
      setMsg(loginMsg, "رمز اشتباه است. " + (MAX_TRIES - tries) + " تلاش دیگر مانده.", "error");
      passInput.select();
      return;
    }`,
  "شمارش رمز اشتباه",
);

must(
  `    try { localStorage.setItem(ADMIN_KEY, "1"); } catch (err) {}`,
  `    try { localStorage.setItem(ADMIN_KEY, "1"); localStorage.removeItem(FAIL_KEY); } catch (err) {}
    armIdle();`,
  "ورود موفق",
);

must(
  `      if (slugIn) slugIn.value = post.slug || "";`,
  `      if (slugIn) slugIn.value = post.slug || "";
      var statusField = $("#postStatus"), whenField = $("#postPublishAt");
      if (statusField) statusField.value = post.status || "published";
      if (whenField) whenField.value = post.publish_at ? String(post.publish_at).slice(0, 16) : "";`,
  "فیلد وضعیت در ویرایش",
);

must(
  `    if (slugIn) slugIn.value = "";`,
  `    if (slugIn) slugIn.value = "";
    var resetStatusField = $("#postStatus"), resetWhenField = $("#postPublishAt");
    if (resetStatusField) resetStatusField.value = "published";
    if (resetWhenField) resetWhenField.value = "";`,
  "پاک‌سازی وضعیت",
);

if (a !== aBefore) writeFileSync(aFile, a, "utf8");
console.log(`apply-editor2: ${b !== bBefore || a !== aBefore ? "به‌روز شد" : "0 فایل تغییر کرد"}`);
