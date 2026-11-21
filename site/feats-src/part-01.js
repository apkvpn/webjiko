    var diff = Date.now() - then;
    if (diff < 0) return "";
    var day = 86400000;
    if (diff < 3600000) return "همین حالا";
    if (diff < day) return "امروز";
    if (diff < day * 2) return "دیروز";
    if (diff < day * 30) return faNum(Math.floor(diff / day)) + " روز پیش";
    return "";
  }

  /* --------------------------- پنجره‌های عمومی --------------------------- */

  function closeTopLayers() {
    var open = $$(".wjf-dialog, .wjf-lightbox").pop();
    if (open) { open.remove(); var scrim = $(".wjf-scrim"); if (scrim) scrim.remove(); return true; }
    var drawer = $(".wjf-drawer");
    if (drawer && !drawer.hidden) { drawer.hidden = true; var s2 = $(".wjf-scrim"); if (s2) s2.hidden = true; return true; }
    return false;
  }

  function openDialog(title, inner, mount) {
    var scrim = el("div", "wjf-scrim");
    var box = el("div", "wjf-dialog");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.innerHTML = '<div class="wjf-drawer-head"><strong>' + esc(title) + '</strong>' +
      '<button type="button" class="wjf-x" aria-label="بستن">✕</button></div>' +
      '<div class="wjf-drawer-body">' + inner + "</div>";
    document.body.appendChild(scrim);
    document.body.appendChild(box);
    function close() { scrim.remove(); box.remove(); }
    on(scrim, "click", close);
    on(box.querySelector(".wjf-x"), "click", close);
    if (mount) mount(box, close);
    return { box: box, close: close };
  }

  /* =========================== ۱–۶ خواندن =============================== */

  var tocState = { headings: [], links: [], totalMinutes: 0 };

  function tocBuild() {
    var content = $(".post-content");
    if (!content) return;
    var headings = $$("h2, h3", content).filter(function (h) { return h.textContent.trim().length > 1; });
    if (headings.length < 2) return;

    var details = el("details", "wjf-toc");
    details.open = true;
    var items = headings.map(function (h, i) {
      if (!h.id) h.id = "wjf-h-" + i;
      return '<li class="' + (h.tagName === "H3" ? "lv2" : "lv1") + '"><a href="#' + h.id + '" data-h="' + h.id + '">' + esc(h.textContent.trim()) + "</a></li>";
    }).join("");

    var words = content.innerText.trim().split(/\s+/).filter(Boolean).length;
    var imgs = $$("img", content).length;
    tocState.totalMinutes = Math.max(1, Math.round(words / 180 + (imgs * 12) / 60));

    details.innerHTML = '<summary><span>فهرست مطالب</span><span class="wjf-toc-time" id="wjfTocTime">' +
      faNum(tocState.totalMinutes) + " دقیقه</span></summary>" +
      '<ol class="wjf-toc-list">' + items + "</ol>" +
      '<button type="button" class="wjf-btn wjf-toc-top">↑ بالای نوشته</button>';

    var meta = $(".post-meta");
    if (meta && meta.parentNode) meta.parentNode.insertBefore(details, meta.nextSibling);
    else content.parentNode.insertBefore(details, content);

    tocState.headings = headings;
    tocState.links = $$("a[data-h]", details);

    on(details.querySelector(".wjf-toc-top"), "click", function () {
      var top = ($(".post-title") || $(".post")).getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: top, behavior: "smooth" });
    });

    onScroll(function (y) {
      var current = "";
      for (var i = 0; i < headings.length; i += 1) {
        var top = headings[i].getBoundingClientRect().top;
        if (top - 100 <= 0) current = headings[i].id;
      }
      tocState.links.forEach(function (a) {
        a.classList.toggle("is-on", a.getAttribute("data-h") === current);
      });
      var label = $("#wjfTocTime");
      if (label) {
        var rect = content.getBoundingClientRect();
        var ratio = clamp((window.innerHeight * 0.35 - rect.top) / Math.max(1, rect.height), 0, 1);
        var left = Math.max(0, Math.ceil(tocState.totalMinutes * (1 - ratio)));
        label.textContent = left > 0 ? "≈ " + faNum(left) + " دقیقه مانده" : "تمام شد ✓";
      }
    });
    scrollTick();
  }

  function headingAnchors() {
    var content = $(".post-content");
    if (!content) return;
    $$("h2, h3", content).forEach(function (h, i) {
      if (!h.id) h.id = "wjf-h-" + i;
      if (h.querySelector(".wjf-anchor")) return;
      var btn = el("button", "wjf-anchor", "🔗");
      btn.type = "button";
      btn.title = "کپی لینک این تیتر";
      btn.setAttribute("aria-label", "کپی لینک تیتر " + h.textContent.trim());
      on(btn, "click", function () {
        copyText(location.origin + location.pathname + "#" + h.id);
      });
      h.appendChild(btn);
    });
  }

  function resumeReading() {
    if (!currentSlug()) return;
    var key = "wjf_pos:" + location.pathname;
    var pos = Number(read(key, 0));
    var bar = el("div", "wjf-resume");
    bar.innerHTML = '<span>از آخرین بار این نوشته را تا اینجا خوانده بودی.</span>' +
      '<button type="button" class="wjf-btn" data-r="go">ادامه بدهم</button>' +
      '<button type="button" class="wjf-btn" data-r="no">نه، از اول</button>';
    on(bar, "click", function (e) {
      var btn = e.target.closest("button[data-r]");
      if (!btn) return;
      if (btn.getAttribute("data-r") === "go") window.scrollTo({ top: pos, behavior: "smooth" });
      bar.remove();
    });
    if (pos > 350) {
      var meta = $(".post-meta");
      var host = $(".post-content");
      if (meta && meta.parentNode) meta.parentNode.insertBefore(bar, meta.nextSibling);
      else if (host) host.parentNode.insertBefore(bar, host);
    }
    var save = function () { write(key, Math.round(window.scrollY)); };
    on(window, "scroll", function () {
      clearTimeout(save._t);
      save._t = setTimeout(save, 700);
    }, { passive: true });
  }

  function nextPrev() {
    if (!currentSlug()) return;
    postsAsync().then(function (list) {
      if (!Array.isArray(list) || !list.length) return;
      var index = -1;
      list.forEach(function (p, i) { if (p.slug === currentSlug()) index = i; });
      if (index < 0) return;
      var prev = list[index - 1];
      var next = list[index + 1];
      var nav = el("nav", "wjf-nextprev");
      nav.setAttribute("aria-label", "پست قبلی و بعدی");
      nav.innerHTML =
        (prev ? '<a href="' + esc(prev.url) + '" data-dir="prev"><span>→ نوشتهٔ قبلی</span><b>' + esc(prev.title) + "</b></a>" : "<span></span>") +
        (next ? '<a href="' + esc(next.url) + '" data-dir="next"><span>نوشتهٔ بعدی ←</span><b>' + esc(next.title) + "</b></a>" : "<span></span>");
      var foot = $(".post-foot");
      var host = $(".post-content");
      if (foot && foot.parentNode) foot.parentNode.insertBefore(nav, foot);
      else if (host) host.parentNode.appendChild(nav);
    });
  }

  /* ========================= ۹–۱۲ میان‌برها ============================== */

  var SHORTCUTS = [
    ["/", "رفتن به کادر جستجو"],
    ["?", "نمایش همین راهنما"],
    ["T", "روشن/خاموش کردن حالت شب"],
    ["J / K", "نوشتهٔ بعدی / قبلی"],
    ["Esc", "بستن پنجره‌ها"],
    ["G", "باز کردن تنظیمات خواندن"],
    ["H", "نمایش/پنهان کردن ابزارهای خواندن"],
  ];

  function shortcutsHelp() {
    var rows = SHORTCUTS.map(function (s) {
      return '<div class="wjf-row"><label>' + esc(s[1]) + "</label><span class=\"wjf-badge\">" + esc(s[0]) + "</span></div>";
    }).join("");
    openDialog("میان‌برهای کیبورد", rows + '<p class="wjf-muted">این میان‌برها وقتی داخل کادر نوشتن نیستی کار می‌کنند.</p>');
  }

  function bindShortcuts() {
    on(document, "keydown", function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName) ||
        (document.activeElement && document.activeElement.isContentEditable);
      if (e.key === "Escape") { closeTopLayers(); return; }
      if (typing) return;
      if (e.key === "/") {
        e.preventDefault();
        var input = $("#searchInput");
        if (input) { input.focus(); input.select(); }
        return;
      }
      if (e.key === "?") { e.preventDefault(); shortcutsHelp(); return; }
      if (e.key === "t" || e.key === "T") {
        var toggle = $("#themeToggle");
        if (toggle) toggle.click();
        return;
      }
      if (e.key === "h" || e.key === "H") { SET.tools = SET.tools ? 0 : 1; saveSet(); say(SET.tools ? "ابزارهای خواندن روشن شد" : "ابزارهای خواندن پنهان شد"); return; }
      if (e.key === "g" || e.key === "G") { openDrawer("set"); return; }
      if (e.key === "j" || e.key === "J" || e.key === "k" || e.key === "K") {
        var nextLink = $(".wjf-nextprev a[data-dir='next']");
        var prevLink = $(".wjf-nextprev a[data-dir='prev']");
        var target = (e.key === "j" || e.key === "J") ? nextLink : prevLink;
        if (target) location.href = target.href;
      }
    });
  }

  /* ========================== ۱۳–۲۰ ظاهر ================================ */

