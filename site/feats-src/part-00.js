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
