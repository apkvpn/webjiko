/* وب‌جیکو — اشتراک‌گذاری، ذخیره برای بعد، کپی کد و ابزارهای تازه‌ی ادیتور */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function toast(msg) {
    if (window.WJToast) return window.WJToast(msg);
    window.alert(msg);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ------------------------------ کپی کد -------------------------------- */
  $$(".post-content pre").forEach(function (pre) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-code";
    btn.textContent = "کپی";
    btn.addEventListener("click", function () {
      var text = pre.innerText || "";
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast("کد کپی شد ✅"); });
      else toast("کپی در این مرورگر پشتیبانی نمی‌شود.");
    });
    pre.appendChild(btn);
  });

  /* ------------------- اشتراک‌گذاری و ذخیره در صفحه‌ی پست ---------------- */
  var post = $(".post");
  var title = $(".post-title");
  if (post && title) {
    var url = location.href.split("#")[0];
    var text = title.textContent.trim();
    var savedKey = "wj_saved";
    function savedList() {
      try { return JSON.parse(localStorage.getItem(savedKey) || "[]"); } catch (e) { return []; }
    }
    function isSaved() {
      return savedList().some(function (item) { return item.u === url; });
    }
    var row = document.createElement("div");
    row.className = "share-row";
    row.innerHTML =
      '<a class="share-btn" target="_blank" rel="noopener" href="https://t.me/share/url?url=' + encodeURIComponent(url) +
      "&text=" + encodeURIComponent(text) + '">تلگرام</a>' +
      '<a class="share-btn" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(text + " " + url) + '">واتساپ</a>' +
      '<a class="share-btn" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) +
      "&text=" + encodeURIComponent(text) + '">ایکس</a>' +
      '<button type="button" class="share-btn" data-act="copy">کپی لینک</button>' +
      '<button type="button" class="share-btn" data-act="save">ذخیره برای بعد</button>';

    var saveBtn = row.querySelector('[data-act="save"]');
    function paintSave() {
      var on = isSaved();
      saveBtn.classList.toggle("is-on", on);
      saveBtn.textContent = on ? "ذخیره شد ✓" : "ذخیره برای بعد";
    }
    row.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-act]");
      if (!btn) return;
      if (btn.getAttribute("data-act") === "copy") {
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast("لینک کپی شد ✅"); });
        return;
      }
      var list = savedList();
      if (btn.getAttribute("data-act") === "save") {
        if (isSaved()) {
          list = list.filter(function (item) { return item.u !== url; });
          toast("از فهرست ذخیره‌شده‌ها برداشته شد");
        } else {
          list.unshift({ u: url, t: text, d: new Date().toISOString() });
          toast("برای بعد ذخیره شد 🔖");
        }
        try { localStorage.setItem(savedKey, JSON.stringify(list.slice(0, 60))); } catch (err) {}
        paintSave();
      }
    });
    paintSave();

    var foot = $(".post-foot");
    if (foot && foot.parentNode) foot.parentNode.insertBefore(row, foot);
    else post.appendChild(row);
  }

  /* --------------------------- ابزارهای ادیتور --------------------------- */
  var toolbar = $(".toolbar");
  var area = $("#editorArea");
  if (toolbar && area) {
    var extra = document.createElement("div");
    extra.className = "editor-tools-extra";
    extra.innerHTML =
      '<button type="button" data-x="callout">کادر نکته</button>' +
      '<button type="button" data-x="warn">کادر هشدار</button>' +
      '<button type="button" data-x="aparat">ویدیو آپارات</button>' +
      '<button type="button" data-x="download">کادر دانلود</button>';
    extra.addEventListener("mousedown", function (e) { e.preventDefault(); });
    extra.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-x]");
      if (!btn) return;
      var kind = btn.getAttribute("data-x");
      area.focus();
      if (kind === "callout" || kind === "warn") {
        var label = kind === "warn" ? "هشدار" : "نکته";
        document.execCommand("insertHTML", false,
          '<div class="callout' + (kind === "warn" ? " warn" : "") + '"><b>' + label + "</b>متن خود را اینجا بنویس…</div><p><br></p>");
        return;
      }
      if (kind === "download") {
        var link = window.prompt("لینک دانلود را بگذار:", "https://");
        if (!link || !/^https?:\/\//i.test(link)) return;
        var size = window.prompt("حجم فایل (مثلاً ۱۲ مگابایت):", "") || "";
        var ver = window.prompt("نسخه (مثلاً 2.1.0):", "") || "";
        document.execCommand("insertHTML", false,
          '<div class="callout"><b>دانلود</b>نسخه ' + esc(ver) + " — حجم " + esc(size) +
          '<p><a class="btn btn-primary" href="' + esc(link) + '" target="_blank" rel="noopener">دانلود فایل</a></p></div><p><br></p>');
        return;
      }
      if (kind === "aparat") {
        var v = window.prompt("لینک ویدیوی آپارات:", "https://www.aparat.com/v/");
        if (!v) return;
        var m = v.match(/aparat\.com\/v\/([A-Za-z0-9]+)/);
        if (!m) { toast("لینک آپارات درست نیست."); return; }
        document.execCommand("insertHTML", false,
          '<iframe src="https://www.aparat.com/video/video/embed/videohash/' + m[1] +
          '/vt/frame" loading="lazy" allowfullscreen frameborder="0" title="ویدیو"></iframe><p><br></p>');
      }
    });
    toolbar.parentNode.insertBefore(extra, toolbar);
  }
})();
