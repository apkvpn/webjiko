/*
 * وب‌جیکو — بستهٔ «۱۰۰ قابلیت تازه» (نسخه ۱)
 * همه‌چیز سمت مرورگر است: بدون سرور، بدون حساب بیرونی و بدون کلید.
 * هر قابلیت مستقل اجرا می‌شود؛ اگر یکی خطا بدهد بقیه سالم می‌مانند.
 */
(function () {
  "use strict";

  var BASE = window.WJ_BASE || "/";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var FEATS = [];
  var FAILED = [];

  function add(n, label, fn) {
    FEATS.push(n);
    try {
      fn();
    } catch (e) {
      FAILED.push(n + " — " + label);
      if (window.console && console.warn) console.warn("WJF " + n + " (" + label + ")", e);
    }
  }

  /* ------------------------------- کمکی‌ها ------------------------------- */

  function read(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value == null ? fallback : JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function setRaw(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }
  function on(node, type, fn, opts) { if (node) node.addEventListener(type, fn, opts); }
  function faNum(n) {
    var digits = "۰۱۲۳۴۵۶۷۸۹";
    return String(n == null ? "" : n).replace(/[0-9]/g, function (d) { return digits.charAt(Number(d)); });
  }
  function toNum(s) {
    var map = { "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9", "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9" };
    return String(s == null ? "" : s).replace(/[۰-۹٠-٩]/g, function (d) { return map[d] || d; });
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function today() { return new Date().toISOString().slice(0, 10); }

  var liveRegion = null;
  function say(msg) {
    try { if (window.WJToast) window.WJToast(msg); } catch (e) {}
    if (!liveRegion) {
      liveRegion = el("div", "sr-only");
      liveRegion.setAttribute("role", "status");
      liveRegion.setAttribute("aria-live", "polite");
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = "";
    setTimeout(function () { liveRegion.textContent = String(msg || ""); }, 40);
  }

  function copyText(text) {
    function fallback() {
      var area = el("textarea");
      area.value = String(text == null ? "" : text);
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) {}
      area.remove();
      say(ok ? "کپی شد ✅" : "کپی نشد؛ دستی انتخاب کن.");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(String(text == null ? "" : text))
        .then(function () { say("کپی شد ✅"); })
        .catch(fallback);
    } else {
      fallback();
    }
  }

  function download(name, text, type) {
    var blob = new Blob([text], { type: type || "text/plain;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 5000);
  }

  /* --------------------------- تنظیمات و وضعیت --------------------------- */

  var DEFAULTS = {
    wide: 0, sepia: 0, focus: 0, line: "2", simple: 0, links: 0,
    contrast: 0, motion: 0, tap: 0, autoDark: 0, tools: 1,
  };
  var SET = Object.assign({}, DEFAULTS, read("wjf_set", {}));

  function applySet() {
    root.setAttribute("data-wjf-wide", SET.wide ? "1" : "0");
    root.setAttribute("data-wjf-sepia", SET.sepia ? "1" : "0");
    root.setAttribute("data-wjf-focus", SET.focus ? "1" : "0");
    root.setAttribute("data-wjf-simple", SET.simple ? "1" : "0");
    root.setAttribute("data-wjf-links", SET.links ? "1" : "0");
    root.setAttribute("data-wjf-contrast", SET.contrast ? "1" : "0");
    root.setAttribute("data-wjf-motion", SET.motion ? "1" : "0");
    root.setAttribute("data-wjf-tap", SET.tap ? "1" : "0");
    root.setAttribute("data-wjf-tools", SET.tools ? "1" : "0");
    if (String(SET.line) === "2") {
      root.removeAttribute("data-wjf-line");
      root.style.removeProperty("--wjf-lh");
    } else {
      root.setAttribute("data-wjf-line", "1");
      root.style.setProperty("--wjf-lh", String(SET.line));
    }
  }
  function saveSet() { write("wjf_set", SET); applySet(); }

  /* ------------------------------ داده‌ها ------------------------------- */

  var postsPromise = null;
  function postsAsync() {
    if (!postsPromise) {
      postsPromise = fetch(BASE + "posts.json", { cache: "force-cache" })
        .then(function (r) { return r.ok ? r.json() : []; })
        .catch(function () { return []; });
    }
    return postsPromise;
  }
  function currentSlug() {
    var m = location.pathname.match(/\/post\/([^/]+)\/?$/);
    return m ? decodeURIComponent(m[1]) : "";
  }
  function postTitle() {
    var t = $(".post-title");
    return t ? t.textContent.trim() : document.title.replace(/\s*\|.*$/, "");
  }
  var scrollHandlers = [];
  function onScroll(fn) { scrollHandlers.push(fn); }
  var scrollQueued = false;
  function scrollTick() {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(function () {
      scrollQueued = false;
      var y = window.scrollY || document.documentElement.scrollTop;
      for (var i = 0; i < scrollHandlers.length; i += 1) {
        try { scrollHandlers[i](y); } catch (e) {}
      }
    });
  }
  on(window, "scroll", scrollTick, { passive: true });

  function trackView() {
    var slug = currentSlug();
    if (!slug) return;
    var list = read("wjf_views", []);
    var hit = null;
    for (var i = 0; i < list.length; i += 1) if (list[i].u === location.pathname) hit = list[i];
    var category = "";
    var badge = $(".badge-inline");
    if (badge) category = badge.textContent.trim();
    if (hit) {
      hit.n = (hit.n || 0) + 1;
      hit.last = Date.now();
      hit.t = postTitle();
    } else {
      list.unshift({ u: location.pathname, t: postTitle(), c: category, n: 1, last: Date.now(), d: today() });
    }
    write("wjf_views", list.slice(0, 150));
    var days = read("wjf_days", []);
    if (days.indexOf(today()) < 0) {
      days.push(today());
      write("wjf_days", days.slice(-500));
    }
  }

  function streakDays() {
    var days = read("wjf_days", []);
    var set = {};
    days.forEach(function (d) { set[d] = 1; });
    var n = 0;
    var cursor = new Date();
    while (set[cursor.toISOString().slice(0, 10)]) {
      n += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return n;
  }

  function relativeDate(iso) {
    var then = new Date(iso).getTime();
    if (!then || isNaN(then)) return "";
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
