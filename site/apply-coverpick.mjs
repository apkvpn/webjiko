/**
 * وب‌جیکو — انتخاب تصویر شاخص از دستگاه.
 * یک قطعه‌ی مستقل به انتهای public/admin2.js اضافه می‌کند: پیش‌نمایش تصویر شاخص،
 * انتخاب فایل از کامپیوتر، آپلود خودکار به پوشه‌ی covers و پر کردن فیلد پست.
 * آخرین هوک اجرا می‌شود و تکرارشدنی است (نشانه‌ی WJ-COVERPICK).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.argv[2] || dirname(fileURLToPath(import.meta.url));
const file = join(ROOT, "public", "admin2.js");
const src = readFileSync(file, "utf8");

if (src.includes("WJ-COVERPICK")) {
  console.log("apply-coverpick: قبلاً اعمال شده");
  process.exit(0);
}

const BLOCK = `
/* WJ-COVERPICK */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function say(msg, kind) {
    if (window.WJ && window.WJ.say) window.WJ.say(msg, kind);
  }
  function b64(buf) {
    var arr = new Uint8Array(buf), bin = "";
    for (var i = 0; i < arr.length; i += 1) bin += String.fromCharCode(arr[i]);
    return btoa(bin);
  }
  function start(n) {
    var WJ = window.WJ;
    if (!WJ || !WJ.editor) {
      if ((n || 0) < 60) return setTimeout(function () { start((n || 0) + 1); }, 150);
      return;
    }
    var E = WJ.editor();
    if (!E || !E.cover || $(".cover-pick")) return;

    var box = document.createElement("div");
    box.className = "cover-pick";
    box.innerHTML = '<img class="cover-thumb" alt="پیش‌نمایش تصویر شاخص" hidden />' +
      '<div class="cover-actions">' +
      '<button type="button" class="btn btn-ghost" data-cp="upload">🖼️ انتخاب عکس از دستگاه</button>' +
      '<button type="button" class="btn btn-ghost" data-cp="remove">حذف تصویر شاخص</button>' +
      "</div>" +
      '<p class="cover-note">عکس ۱۲۰۰×۶۳۰ بهترین نتیجه را می‌دهد. فایل خودکار روی مخزن آپلود و همین‌جا ثبت می‌شود؛ بعد فقط «انتشار پست» را بزن.</p>';
    E.cover.parentNode.insertBefore(box, E.cover.nextSibling);

    function paint() {
      var url = String(E.cover.value || "").trim();
      var img = $(".cover-thumb", box);
      var ok = /^https?:\\/\\//i.test(url);
      img.hidden = !ok;
      if (ok && img.getAttribute("src") !== url) img.src = url;
      box.classList.toggle("has-cover", ok);
    }
    E.cover.addEventListener("input", paint);
    paint();
    setInterval(paint, 1200);

    box.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-cp]");
      if (!btn || btn.disabled) return;
      if (btn.getAttribute("data-cp") === "remove") {
        E.cover.value = "";
        paint();
        return;
      }
      var tk = WJ.token();
      if (!tk) { say("برای آپلود عکس، اول توکن گیت‌هاب را وارد کن.", "error"); return; }
      var input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.addEventListener("change", function () {
        var file = input.files && input.files[0];
        if (!file) return;
        if (file.size > 6 * 1024 * 1024) { say("حجم عکس بیش از ۶ مگابایت است؛ عکس کوچک‌تری انتخاب کن.", "error"); return; }
        var slug = WJ.slugify((E.slug && E.slug.value) || (E.title && E.title.value) || "cover");
        var ext = String(file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
        var name = slug + "-" + Date.now() + "." + ext;
        btn.disabled = true;
        say("در حال آپلود عکس شاخص…", "ok");
        file.arrayBuffer().then(function (buf) {
          return fetch("https://api.github.com/repos/" + WJ.REPO + "/contents/site/public/covers/" + name, {
            method: "PUT",
            headers: { Authorization: "Bearer " + tk, Accept: "application/vnd.github+json" },
            body: JSON.stringify({ message: "cover: " + slug, content: b64(buf), branch: WJ.BRANCH }),
          });
        }).then(function (r) {
          if (!r.ok) throw new Error("آپلود نشد (خطای " + r.status + "). اجازه‌ی Contents روی توکن را چک کن.");
          E.cover.value = location.origin + WJ.BASE + "covers/" + name;
          paint();
          say("تصویر شاخص ثبت شد ✅ حالا «انتشار پست» را بزن.", "ok");
        }).catch(function (err) {
          say(err.message || "آپلود عکس نشد.", "error");
        }).then(function () { btn.disabled = false; });
      });
      input.click();
    });
  }
  start(0);
})();
`;

writeFileSync(file, src.replace(/\s*$/, "\n") + BLOCK, "utf8");
console.log("apply-coverpick: admin2.js به‌روز شد");
