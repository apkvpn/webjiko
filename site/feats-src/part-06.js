        timer = setInterval(function () {
          seconds -= 1;
          paint();
          if (seconds <= 0) {
            clearInterval(timer);
            timer = null;
            seconds = 25 * 60;
            say("۲۵ دقیقه مطالعه تمام شد؛ استراحت کن ☕");
            paint();
          }
        }, 1000);
        say("پومودورو شروع شد");
      } else if (btn.getAttribute("data-pomo") === "stop") {
        clearInterval(timer);
        timer = null;
        seconds = 25 * 60;
        paint();
      } else if (btn.getAttribute("data-act") === "health") healthCheck();
      else if (btn.getAttribute("data-act") === "archive2") openArchive();
    });
    paint();
  }

  function healthCheck() {
    var imgs = $$("img").filter(function (img) { return img.complete && img.naturalWidth === 0; });
    var links = $$('a[href^="' + BASE + '"], a[href^="/"]').slice(0, 12);
    var results = [];
    say("در حال بررسی صفحه…");
    Promise.all(links.map(function (a) {
      return fetch(a.href, { method: "HEAD" })
        .then(function (r) { if (!r.ok) results.push(a.getAttribute("href") + " → " + r.status); })
        .catch(function () { results.push(a.getAttribute("href") + " → خطا"); });
    })).then(function () {
      var rows = "";
      rows += '<div class="wjf-row"><label>تصویر خراب</label><span class="wjf-badge">' + faNum(imgs.length) + "</span></div>";
      rows += '<div class="wjf-row"><label>لینک بررسی‌شده</label><span class="wjf-badge">' + faNum(links.length) + "</span></div>";
      rows += '<div class="wjf-row"><label>لینک مشکل‌دار</label><span class="wjf-badge">' + faNum(results.length) + "</span></div>";
      if (imgs.length) rows += "<h4>تصاویر خراب</h4><ul class=\"wjf-list\">" + imgs.slice(0, 8).map(function (i) {
        return "<li><span>" + esc(i.getAttribute("src") || "") + "</span></li>";
      }).join("") + "</ul>";
      if (results.length) rows += "<h4>لینک‌های مشکل‌دار</h4><ul class=\"wjf-list\">" + results.slice(0, 8).map(function (r) {
        return "<li><span>" + esc(r) + "</span></li>";
      }).join("") + "</ul>";
      openDialog("سلامت این صفحه", rows + '<p class="wjf-muted">نتیجهٔ بررسی فقط برای همین صفحه است.</p>');
    });
  }

  /* ========================= ۸۸–۹۰ تصاویر =============================== */

  function lightbox() {
    var imgs = $$(".post-content img, .post-cover").filter(function (img) { return img.src; });
    if (!imgs.length) return;
    var box = el("div", "wjf-lightbox");
    box.hidden = true;
    box.innerHTML = '<button type="button" class="wjf-x" aria-label="بستن">✕</button>' +
      '<button type="button" class="wjf-lb-nav wjf-lb-prev" aria-label="تصویر قبلی">‹</button>' +
      '<img alt="" />' +
      '<button type="button" class="wjf-lb-nav wjf-lb-next" aria-label="تصویر بعدی">›</button>' +
      '<p class="wjf-lb-cap"></p>';
    document.body.appendChild(box);
    var img = $("img", box);
    var cap = $(".wjf-lb-cap", box);
    var index = 0;
    function show(i) {
      index = (i + imgs.length) % imgs.length;
      var source = imgs[index];
      img.src = source.currentSrc || source.src;
      img.alt = source.alt || "";
      cap.textContent = source.alt || "";
      box.hidden = false;
    }
    function close() { box.hidden = true; }
    imgs.forEach(function (source, i) {
      source.style.cursor = "zoom-in";
      on(source, "click", function (e) {
        if (source.closest("a")) e.preventDefault();
        show(i);
      });
    });
    on($(".wjf-x", box), "click", close);
    on($(".wjf-lb-prev", box), "click", function () { show(index - 1); });
    on($(".wjf-lb-next", box), "click", function () { show(index + 1); });
    on(box, "click", function (e) { if (e.target === box) close(); });
    on(document, "keydown", function (e) {
      if (box.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(index + 1);
      if (e.key === "ArrowLeft") show(index - 1);
    });
  }

  /* ====================== ۹۱–۹۴ آفلاین و نصب =========================== */

  function offlineSupport() {
    var banner = el("div", "wjf-offline", "آفلاین هستی — صفحه‌های دیده‌شده از حافظه نمایش داده می‌شوند.");
    banner.hidden = navigator.onLine;
    document.body.appendChild(banner);
    on(window, "online", function () { banner.hidden = true; say("اینترنت وصل شد"); });
    on(window, "offline", function () { banner.hidden = false; });
    if ("serviceWorker" in navigator && location.protocol === "https:") {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register(BASE + "sw.js", { scope: BASE }).catch(function () {});
      });
    }
  }

  var installEvent = null;
  on(window, "beforeinstallprompt", function (e) {
    e.preventDefault();
    installEvent = e;
  });
  function installApp() {
    if (installEvent) {
      installEvent.prompt();
      installEvent = null;
      say("پنجرهٔ نصب باز شد");
    } else {
      say("اگر مرورگر امکان نصب بدهد، از منوی مرورگر «افزودن به صفحهٔ اصلی» را بزن.");
    }
  }

  /* ====================== ۹۵–۱۰۰ ادیتور و آرشیو ========================= */

  function editorTools() {
    var area = $("#editorArea");
    if (!area) return;

    var foot = $(".editor-foot-actions");
    if (foot && !$("#wjfFocusBtn")) {
      var btn = el("button", "btn btn-ghost", "🔍 حالت تمرکز");
      btn.type = "button";
      btn.id = "wjfFocusBtn";
      on(btn, "click", function () {
        var app = $("#editorApp");
        app.classList.toggle("wjf-editor-focus");
        btn.textContent = app.classList.contains("wjf-editor-focus") ? "✕ خروج از تمرکز" : "🔍 حالت تمرکز";
      });
      foot.insertBefore(btn, foot.firstChild);
    }

    var extra = $(".editor-tools-extra");
    if (!extra || $("#wjfTocInsert")) return;

    var tocBtn = el("button", "wjf-btn", "درج فهرست مطالب");
    tocBtn.type = "button";
    tocBtn.id = "wjfTocInsert";
    on(tocBtn, "click", function () {
      area.focus();
      var headings = $$("h2, h3", area).map(function (h) { return h.textContent.trim(); }).filter(Boolean);
      if (!headings.length) { say("اول چند تیتر (H2/H3) در متن بساز."); return; }
      var html = '<div class="callout"><b>فهرست مطالب</b><ul>' + headings.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + "</ul></div><p><br></p>";
      document.execCommand("insertHTML", false, html);
    });

    var qaBtn = el("button", "wjf-btn", "کادر پرسش و پاسخ");
    qaBtn.type = "button";
    on(qaBtn, "click", function () {
      area.focus();
      var question = window.prompt("پرسش:", "");
      if (!question) return;
      var answer = window.prompt("پاسخ:", "") || "";
      document.execCommand("insertHTML", false,
        '<div class="callout"><b>❓ ' + esc(question) + "</b>" + esc(answer) + "</div><p><br></p>");
    });

    extra.appendChild(tocBtn);
    extra.appendChild(qaBtn);
  }

  function notFoundHelper() {
    var is404 = /404/.test(location.pathname) || /صفحه پیدا نشد/.test(document.title);
    if (!is404) return;
    var main = $("main");
    if (!main) return;
    var host = el("section", "section");
    host.innerHTML = '<div class="section-head"><h2>دنبال چه چیزی بودی؟</h2></div>' +
      '<div class="nf-search"><input type="search" id="wjfNfQ" placeholder="جستجو در نوشته‌ها…" aria-label="جستجو" /></div>' +
      '<p class="search-note" id="wjfNfNote"></p><div class="grid" id="wjfNfGrid"></div>';
    main.appendChild(host);
    var q = $("#wjfNfQ");
    var grid = $("#wjfNfGrid");
    var note = $("#wjfNfNote");
    postsAsync().then(function (posts) {
      function card(p) {
        return '<article class="card"><a class="card-link" href="' + esc(p.url) + '"><div class="card-body">' +
          '<h3 class="card-title">' + esc(p.title) + "</h3><p class=\"card-excerpt\">" + esc(p.excerpt || "") +
          '</p><div class="card-meta"><span class="badge badge-inline">' + esc(p.category) + "</span></div></div></a></article>";
      }
      function draw() {
        var value = q.value.trim().toLowerCase();
        var rows = posts.filter(function (p) {
          return !value || (p.title + p.category + (p.excerpt || "")).toLowerCase().indexOf(value) >= 0;
        }).slice(0, 6);
        grid.innerHTML = rows.map(card).join("");
        note.textContent = rows.length ? "" : "چیزی پیدا نشد؛ این‌ها شاید جالب باشند:";
        if (!rows.length) {
          var rnd = posts.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 3);
          grid.innerHTML = rnd.map(card).join("");
        }
      }
      on(q, "input", draw);
      draw();
      q.focus();
    });
  }

  /* ============================ کشوی تنظیمات ============================ */

  var TOGGLES = [
    ["wide", "عریض کردن ستون نوشته"],
