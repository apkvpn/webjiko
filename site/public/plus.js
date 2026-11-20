/* وب‌جیکو — خواندن راحت‌تر: حالت شب، اندازه‌ی متن، نوار پیشرفت، برگشت به بالا و جستجوی کامل */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var BASE = window.WJ_BASE || "/";
  var root = document.documentElement;

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
      return value;
    } catch (e) { return null; }
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function toast(msg) {
    var t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove("is-on"); }, 2200);
  }

  /* ------------------------------- حالت شب ------------------------------- */
  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    store("wj_theme", theme);
    var btn = $("#themeToggle");
    if (btn) {
      btn.textContent = theme === "dark" ? "☀️" : "🌙";
      btn.setAttribute("aria-label", theme === "dark" ? "حالت روشن" : "حالت شب");
      btn.title = btn.getAttribute("aria-label");
    }
  }
  var theme = store("wj_theme");
  if (!theme && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) theme = "dark";
  setTheme(theme === "dark" ? "dark" : "light");

  var actions = $(".top-actions");
  if (actions) {
    var tBtn = document.createElement("button");
    tBtn.type = "button";
    tBtn.id = "themeToggle";
    tBtn.className = "icon-toggle";
    tBtn.addEventListener("click", function () {
      setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
    actions.insertBefore(tBtn, actions.firstChild);
    setTheme(root.getAttribute("data-theme") || "light");
  }

  /* --------------------- اندازه‌ی متن و برگشت به بالا -------------------- */
  var tools = document.createElement("div");
  tools.className = "read-tools";
  tools.innerHTML =
    '<button type="button" data-fs="minus" title="متن کوچک‌تر">A−</button>' +
    '<button type="button" data-fs="plus" title="متن بزرگ‌تر">A+</button>' +
    '<button type="button" data-fs="reset" title="اندازه‌ی معمولی">↺</button>';
  document.body.appendChild(tools);

  var scale = Number(store("wj_read") || 1);
  function applyScale(next) {
    scale = Math.min(1.5, Math.max(0.8, Math.round(next * 10) / 10));
    root.style.setProperty("--read", String(scale));
    store("wj_read", String(scale));
  }
  applyScale(scale);
  tools.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-fs]");
    if (!btn) return;
    var act = btn.getAttribute("data-fs");
    applyScale(act === "plus" ? scale + 0.1 : act === "minus" ? scale - 0.1 : 1);
  });

  var topBtn = document.createElement("button");
  topBtn.type = "button";
  topBtn.className = "to-top";
  topBtn.textContent = "↑";
  topBtn.setAttribute("aria-label", "برگشت به بالا");
  topBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  document.body.appendChild(topBtn);

  /* --------------------- نوار پیشرفت مطالعه در پست‌ها -------------------- */
  var article = $(".post");
  var bar = null;
  if (article) {
    bar = document.createElement("div");
    bar.className = "progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY || document.documentElement.scrollTop;
      topBtn.classList.toggle("is-on", y > 400);
      if (bar) {
        var total = article.offsetHeight - window.innerHeight + 120;
        var pct = total > 0 ? Math.min(1, Math.max(0, y / total)) : 0;
        bar.style.transform = "scaleX(" + pct.toFixed(3) + ")";
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* --------------------------- جستجوی کامل متن -------------------------- */
  var box = $("#searchInput");
  var grid = $("#postsGrid");
  var initial = grid ? grid.innerHTML : "";
  var noResult = $("#noResult");
  var indexCache = null;

  function loadIndex() {
    if (indexCache) return Promise.resolve(indexCache);
    return fetch(BASE + "search.json", { cache: "force-cache" })
      .then(function (r) { return r.json(); })
      .then(function (list) { indexCache = list || []; return indexCache; })
      .catch(function () { indexCache = []; return indexCache; });
  }
  function resultCard(row) {
    return '<article class="card"><a class="card-link" href="' + BASE + "post/" + encodeURIComponent(row.s) + '/">' +
      '<div class="card-body"><h3 class="card-title">' + esc(row.t) + "</h3>" +
      '<p class="card-excerpt">' + esc(row.e || "") + "</p>" +
      '<div class="card-meta"><span class="badge badge-inline">' + esc(row.c || "") + "</span></div>" +
      "</div></a></article>";
  }
  function restore() {
    if (grid && initial) grid.innerHTML = initial;
    if (noResult) noResult.hidden = true;
  }
  function search(q) {
    if (!grid) return;
    q = String(q || "").trim().toLowerCase();
    if (q.length < 2) { restore(); return; }
    loadIndex().then(function (list) {
      var hits = list.filter(function (row) {
        var hay = ((row.t || "") + " " + (row.e || "") + " " + (row.c || "") + " " + (row.x || "")).toLowerCase();
        return hay.indexOf(q) !== -1;
      });
      grid.innerHTML = hits.slice(0, 24).map(resultCard).join("") ||
        '<p class="empty">چیزی پیدا نشد. یک کلمه‌ی دیگر امتحان کن 🔎</p>';
      if (noResult) noResult.hidden = hits.length !== 0;
    });
  }
  if (box) {
    var timer = null;
    box.addEventListener("input", function () {
      clearTimeout(timer);
      var value = box.value;
      timer = setTimeout(function () { search(value); }, 220);
    });
    var qs = new URLSearchParams(location.search).get("q");
    if (qs) { box.value = qs; search(qs); }
  }

  /* ------------------------------ تصاویر -------------------------------- */
  var imgs = document.querySelectorAll(".post-content img, .card-cover-img, .post-cover");
  for (var i = 0; i < imgs.length; i += 1) {
    if (!imgs[i].getAttribute("loading")) imgs[i].setAttribute("loading", "lazy");
    imgs[i].setAttribute("decoding", "async");
  }

  /* -------------------------- جدول‌های موبایل ---------------------------- */
  var tables = document.querySelectorAll(".post-content table");
  for (var j = 0; j < tables.length; j += 1) {
    if (tables[j].parentNode && tables[j].parentNode.classList.contains("table-wrap")) continue;
    var wrap = document.createElement("div");
    wrap.className = "table-wrap";
    tables[j].parentNode.insertBefore(wrap, tables[j]);
    wrap.appendChild(tables[j]);
  }

  window.WJToast = toast;
})();
