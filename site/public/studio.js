/* وب‌جیکو — استودیوی تصویر شاخص: متن فارسی/انگلیسی + پس‌زمینه‌ی هنری رایگان + آپلود خودکار */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var W = 1200, H = 630;

  var STYLES = [
    { id: "sunset", a: "#ff6f61", b: "#ffc44d", ink: "#2b1930" },
    { id: "grape", a: "#7c4dff", b: "#ff5f9e", ink: "#ffffff" },
    { id: "mint", a: "#0fbfa8", b: "#6ee7b7", ink: "#08312b" },
    { id: "sky", a: "#1f6feb", b: "#5ad1ff", ink: "#ffffff" },
    { id: "night", a: "#1b1035", b: "#4b2a72", ink: "#ffffff" },
    { id: "paper", a: "#fff3e0", b: "#ffe0c7", ink: "#2b2440" }
  ];

  function toast(msg) {
    if (window.WJ && window.WJ.say) return window.WJ.say(msg, "ok");
    if (window.WJToast) return window.WJToast(msg);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function b64(bytes) {
    var arr = new Uint8Array(bytes), bin = "";
    for (var i = 0; i < arr.length; i += 1) bin += String.fromCharCode(arr[i]);
    return btoa(bin);
  }

  function boot() {
    if (!window.WJ) return setTimeout(boot, 150);
    var toolbarRow = $(".editor-tools-extra");
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "🎨 تصویر شاخص";
    btn.addEventListener("click", open);
    if (toolbarRow) toolbarRow.appendChild(btn);
    else {
      var foot = $(".editor-foot-actions");
      if (foot) foot.appendChild(btn);
    }
  }

  function open() {
    var E = window.WJ.editor();
    var modal = document.createElement("div");
    modal.className = "wj-modal";
    modal.innerHTML = '<div class="wj-box">' +
      '<button type="button" class="wj-close">✕</button>' +
      "<h3>سازنده‌ی تصویر شاخص</h3>" +
      '<p class="hint">متن را فارسی یا انگلیسی بنویس؛ تصویر با فونت تمیز و پس‌زمینه‌ی هنری ساخته می‌شود و با یک کلیک تصویر شاخص پست می‌شود.</p>' +
      '<div class="st-row">' +
      '<label>متن روی تصویر<textarea id="stText" rows="2"></textarea></label>' +
      '<label>زبان و فونت<select id="stLang"><option value="fa">فارسی — وزیرمتن</option><option value="en">English — Serif</option></select></label>' +
      "</div>" +
      '<div class="st-row">' +
      '<label>زیرنویس (اختیاری)<input type="text" id="stSub" placeholder="مثلاً وب‌جیکو · آموزش" /></label>' +
      '<label>پس‌زمینه‌ی هوش مصنوعی<input type="text" id="stAi" placeholder="توصیف صحنه، مثلاً abstract gradient shapes" /></label>' +
      "</div>" +
      '<div class="st-styles" id="stStyles"></div>' +
      '<div class="st-canvas-wrap"><canvas id="stCanvas" width="1200" height="630"></canvas></div>' +
      '<div class="st-actions">' +
      '<button type="button" class="btn btn-primary" id="stBuild">بساز</button>' +
      '<button type="button" class="btn btn-ghost" id="stUse">تصویر شاخص همین پست</button>' +
      '<button type="button" class="btn btn-ghost" id="stInsert">درج در متن</button>' +
      '<button type="button" class="btn btn-ghost" id="stSave">دانلود PNG</button>' +
      "</div>" +
      '<p class="st-note" id="stNote">تصویر ۱۲۰۰×۶۳۰ ساخته می‌شود و در پوشه‌ی covers مخزن ذخیره می‌شود.</p>' +
      "</div>";
    document.body.appendChild(modal);

    var canvas = $("#stCanvas", modal);
    var ctx = canvas.getContext("2d");
    var textIn = $("#stText", modal);
    var subIn = $("#stSub", modal);
    var langIn = $("#stLang", modal);
    var aiIn = $("#stAi", modal);
    var note = $("#stNote", modal);
    var styleId = "sunset";
    var bgImage = null;
    var blob = null;

    textIn.value = (E.title && E.title.value) || "";
    subIn.value = "وب‌جیکو";

    STYLES.forEach(function (s) {
      var sw = document.createElement("button");
      sw.type = "button";
      sw.className = "st-swatch" + (s.id === styleId ? " is-on" : "");
      sw.style.background = "linear-gradient(135deg," + s.a + "," + s.b + ")";
      sw.title = s.id;
      sw.addEventListener("click", function () {
        styleId = s.id;
        Array.prototype.forEach.call(modal.querySelectorAll(".st-swatch"), function (el) { el.classList.remove("is-on"); });
        sw.classList.add("is-on");
        draw();
      });
      $("#stStyles", modal).appendChild(sw);
    });

    function style() {
      for (var i = 0; i < STYLES.length; i += 1) if (STYLES[i].id === styleId) return STYLES[i];
      return STYLES[0];
    }

    function wrap(lines, max, measure) {
      var out = [], line = "";
      for (var i = 0; i < lines.length; i += 1) {
        var test = line ? line + " " + lines[i] : lines[i];
        if (measure(test) > max && line) { out.push(line); line = lines[i]; }
        else line = test;
      }
      if (line) out.push(line);
      return out;
    }

    function draw() {
      var s = style();
      var g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, s.a);
      g.addColorStop(1, s.b);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      if (bgImage) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        var scale = Math.max(W / bgImage.width, H / bgImage.height);
        var w = bgImage.width * scale, h = bgImage.height * scale;
        ctx.drawImage(bgImage, (W - w) / 2, (H - h) / 2, w, h);
        ctx.restore();
        ctx.fillStyle = "rgba(20,10,40,.22)";
        ctx.fillRect(0, 0, W, H);
      }

      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(W - 130, 90, 190, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(90, H - 60, 150, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      var isFa = langIn.value === "fa";
      ctx.direction = isFa ? "rtl" : "ltr";
      ctx.textAlign = isFa ? "right" : "left";
      var x = isFa ? W - 84 : 84;
      var family = isFa ? "'Vazirmatn', Tahoma, sans-serif" : "Georgia, 'Times New Roman', serif";
      var text = (textIn.value || "بدون عنوان").trim();
      var size = isFa ? 78 : 82;
      var max = W - 168;
      var lines = [];
      for (; size > 40; size -= 4) {
        ctx.font = "700 " + size + "px " + family;
        lines = wrap(text.split(/\s+/), max, function (t) { return ctx.measureText(t).width; });
        if (lines.length <= 3) break;
      }
      ctx.fillStyle = s.ink;
      var lh = size * 1.42;
      var startY = H / 2 - ((lines.length - 1) * lh) / 2 + size * 0.12;
      lines.forEach(function (line, i) { ctx.fillText(line, x, startY + i * lh); });

      ctx.fillStyle = s.ink;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(isFa ? W - 214 : 84, startY + lines.length * lh - size * 0.2, 130, 7);
      ctx.globalAlpha = 1;

      ctx.font = "600 30px " + family;
      ctx.textAlign = isFa ? "right" : "left";
      ctx.globalAlpha = 0.85;
      ctx.fillText(subIn.value || "وب‌جیکو", x, H - 62);
      ctx.globalAlpha = 1;

      blob = null;
      try { canvas.toBlob(function (b) { blob = b; }, "image/png"); } catch (e) { blob = null; }
    }

    function aiBackground() {
      var prompt = String(aiIn.value || "").trim();
      if (!prompt) return Promise.resolve();
      note.textContent = "در حال ساخت پس‌زمینه با هوش مصنوعی…";
      var url = "https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt + ", abstract art, no text, high quality") +
        "?width=1200&height=630&nologo=true&seed=" + Math.floor(Math.random() * 9999) + "&referrer=webjiko";
      return new Promise(function (resolve) {
        var img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () { bgImage = img; note.textContent = "پس‌زمینه‌ی هوش مصنوعی آماده شد ✅"; resolve(); };
        img.onerror = function () { bgImage = null; note.textContent = "پس‌زمینه‌ی هوش مصنوعی نشد؛ طرح رنگی ساده استفاده شد."; resolve(); };
        img.src = url;
      });
    }

    function build() {
      $("#stBuild", modal).disabled = true;
      aiBackground().then(function () {
        draw();
        $("#stBuild", modal).disabled = false;
      });
    }

    function upload() {
      if (!blob) return Promise.reject(new Error("اول روی «بساز» بزن."));
      var tk = window.WJ.token();
      if (!tk) return Promise.reject(new Error("برای آپلود، اول توکن گیت‌هاب را وارد کن."));
      var slug = window.WJ.slugify((E.slug && E.slug.value) || (E.title && E.title.value) || "cover");
      var path = "site/public/covers/" + slug + "-" + Date.now() + ".png";
      note.textContent = "در حال آپلود به مخزن…";
      return blob.arrayBuffer().then(function (buf) {
        return fetch("https://api.github.com/repos/" + window.WJ.REPO + "/contents/" + path, {
          method: "PUT",
          headers: { Authorization: "Bearer " + tk, Accept: "application/vnd.github+json" },
          body: JSON.stringify({ message: "cover: " + slug, content: b64(buf), branch: window.WJ.BRANCH }),
        });
      }).then(function (r) {
        if (!r.ok) throw new Error("آپلود نشد (خطای " + r.status + "). اجازه‌ی Contents روی توکن را چک کن.");
        return location.origin + window.WJ.BASE + "covers/" + path.split("/").pop();
      });
    }

    $("#stBuild", modal).addEventListener("click", build);
    textIn.addEventListener("input", draw);
    subIn.addEventListener("input", draw);
    langIn.addEventListener("change", draw);

    $("#stUse", modal).addEventListener("click", function () {
      upload().then(function (url) {
        if (E.cover) E.cover.value = url;
        note.textContent = "تصویر ساخته و آپلود شد. حالا پست را ذخیره کن تا تصویر شاخص ثبت شود.";
        if (window.WJToast) window.WJToast("تصویر شاخص آماده است — پست را ذخیره کن");
        setTimeout(function () { modal.remove(); }, 900);
      }).catch(function (err) { note.textContent = err.message || "آپلود نشد."; });
    });

    $("#stInsert", modal).addEventListener("click", function () {
      upload().then(function (url) {
        note.textContent = "عکس در انتهای متن درج شد.";
        var img = document.createElement("img");
        img.src = url;
        img.alt = (E.title && E.title.value) || "";
        if (E.area) E.area.appendChild(img);
        setTimeout(function () { modal.remove(); }, 700);
      }).catch(function (err) { note.textContent = err.message || "آپلود نشد."; });
    });

    $("#stSave", modal).addEventListener("click", function () {
      if (!blob) { toast("اول روی «بساز» بزن."); return; }
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "webjiko-cover.png";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    });

    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.classList.contains("wj-close")) modal.remove();
    });
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape") { modal.remove(); document.removeEventListener("keydown", onKey); }
    });

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw); else draw();
    void esc;
  }

  boot();
})();
