/* وب‌جیکو — client for the static site: search, hidden admin dock, rich editor.
 * Publishing works by committing content/posts.json to the GitHub repo that hosts the site;
 * GitHub Pages then rebuilds the page automatically. */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var BASE = window.WJ_BASE || "/";
  var REPO = window.WJ_REPO || "apkvpn/webjiko";
  var BRANCH = "main";
  var DATA_PATH = "site/content/posts.json";
  var PASS = "1213";
  var TOKEN_KEY = "wj_gh_token";
  var ADMIN_KEY = "wj_admin_ok";

  /* ------------------------------ helpers -------------------------------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function enc(s) { return encodeURIComponent(String(s)); }
  function postHref(slug) { return BASE + "post/" + enc(slug) + "/"; }

  function faDate(iso) {
    try {
      return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Tehran" }).format(new Date(iso));
    } catch (e) { return String(iso || "").slice(0, 10); }
  }
  function faNum(n) {
    try { return new Intl.NumberFormat("fa-IR").format(n); } catch (e) { return String(n); }
  }
  $$("[data-date]").forEach(function (el) {
    var txt = faDate(el.getAttribute("data-date"));
    if (txt) el.textContent = txt;
  });

  var COLORS = ["sky", "mint", "sun", "grape", "coral"];
  var EMOJI = ["📚", "🚀", "🐱", "🎨", "🔬", "⭐", "🎈", "🧩", "🌻", "🦄", "🍭", "🧠"];
  function toneFor(str) {
    var h = 0, s = String(str || "");
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
    return { color: COLORS[h % COLORS.length], emoji: EMOJI[h % EMOJI.length] };
  }
  function readingTime(html) {
    var words = String(html || "").replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 180));
  }
  function slugify(input) {
    var base = String(input || "").trim().toLowerCase()
      .replace(/[\u200c\u200f\u200e]/g, " ")
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    return base.slice(0, 80) || "post";
  }
  function cardHtml(p) {
    var t = toneFor(p.slug || p.title);
    var cover = p.cover
      ? '<img class="card-cover-img" src="' + esc(p.cover) + '" alt="' + esc(p.title) + '" loading="lazy" />'
      : '<div class="card-cover-fallback cover-' + t.color + '"><span>' + t.emoji + "</span></div>";
    return '<article class="card" data-cat="' + esc(p.category || "عمومی") + '" data-title="' + esc((p.title || "") + " " + (p.excerpt || "")) + '">' +
      '<a class="card-link" href="' + postHref(p.slug) + '" aria-label="' + esc(p.title) + '">' +
        '<div class="card-cover">' + cover + '<span class="badge badge-' + t.color + '">' + esc(p.category || "عمومی") + "</span></div>" +
        '<div class="card-body"><h3 class="card-title">' + esc(p.title) + "</h3>" +
        '<p class="card-excerpt">' + esc(p.excerpt || "") + "</p>" +
        '<div class="card-meta"><time datetime="' + esc(p.created_at) + '" data-date="' + esc(p.created_at) + '">' + faDate(p.created_at) + "</time>" +
        '<span class="dot">•</span><span>' + readingTime(p.content) + " دقیقه مطالعه</span></div></div>" +
      "</a></article>";
  }

  var seed = {};
  try { seed = JSON.parse(($("#postsData") || {}).textContent || "{}"); } catch (e) { seed = {}; }
  var postsCache = (seed && seed.posts) || [];

  /* ------------------------------ home search ---------------------------- */
  var searchInput = $("#searchInput");
  var noResult = $("#noResult");
  function applySearch(q) {
    q = String(q || "").trim();
    var cards = $$("#postsGrid .card");
    var shown = 0;
    cards.forEach(function (card) {
      var hay = (card.getAttribute("data-title") || "").toLowerCase();
      var ok = !q || hay.indexOf(q.toLowerCase()) !== -1;
      card.style.display = ok ? "" : "none";
      if (ok) shown++;
    });
    if (noResult) noResult.hidden = shown !== 0 || !cards.length;
  }
  if (searchInput) {
    var qs = new URLSearchParams(location.search).get("q");
    if (qs) { searchInput.value = qs; applySearch(qs); }
    searchInput.addEventListener("input", function () { applySearch(searchInput.value); });
  }

  /* ------------------------------ admin dock ----------------------------- */
  var dock = $("#adminDock");
  if (!dock) return;
  var panel = $("#dockPanel");
  var toggle = $("#dockToggle");
  var minBtn = $("#dockMin");
  var logoutBtn = $("#logoutBtn");
  var loginForm = $("#loginForm");
  var loginMsg = $("#loginMsg");
  var passInput = $("#adminPass");
  var tokenForm = $("#tokenForm");
  var tokenInput = $("#ghToken");
  var tokenMsg = $("#tokenMsg");
  var editorApp = $("#editorApp");
  var editorMsg = $("#editorMsg");

  var state = { loggedIn: false, editingId: null };

  function openPanel() {
    panel.hidden = false;
    dock.setAttribute("data-state", "open");
    toggle.setAttribute("aria-expanded", "true");
    if (!state.loggedIn) setTimeout(function () { try { passInput.focus(); } catch (e) {} }, 60);
  }
  function closePanel() {
    panel.hidden = true;
    dock.setAttribute("data-state", "closed");
    toggle.setAttribute("aria-expanded", "false");
  }
  toggle.addEventListener("click", function () {
    if (panel.hidden) openPanel(); else closePanel();
  });
  minBtn.addEventListener("click", closePanel);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) closePanel();
  });

  function setMsg(el, text, kind) {
    if (!el) return;
    el.textContent = text || "";
    el.classList.remove("is-error", "is-ok");
    if (kind) el.classList.add("is-" + kind);
  }

  function token() { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; } }

  function showEditor() {
    state.loggedIn = true;
    loginForm.hidden = true;
    tokenForm.hidden = true;
    editorApp.hidden = false;
    logoutBtn.hidden = false;
    toggle.innerHTML = '<span class="dock-dot"></span> ادیتور';
    renderAdminList(postsCache);
  }
  function showLogin() {
    state.loggedIn = false;
    editorApp.hidden = true;
    tokenForm.hidden = true;
    loginForm.hidden = false;
    logoutBtn.hidden = true;
    toggle.innerHTML = '<span class="dock-dot"></span> پنل مدیر';
  }
  function enter() {
    if (!token()) {
      state.loggedIn = true;
      loginForm.hidden = true;
      editorApp.hidden = true;
      tokenForm.hidden = false;
      logoutBtn.hidden = false;
      toggle.innerHTML = '<span class="dock-dot"></span> ادیتور';
      setTimeout(function () { try { tokenInput.focus(); } catch (e) {} }, 60);
      return;
    }
    showEditor();
  }

  function renderAdminList(posts) {
    var list = $("#adminList");
    var datalist = $("#catList");
    if (!list) return;
    if (datalist) {
      var cats = {};
      posts.forEach(function (p) { cats[p.category || "عمومی"] = 1; });
      datalist.innerHTML = Object.keys(cats).map(function (c) { return '<option value="' + esc(c) + '"></option>'; }).join("");
    }
    list.innerHTML = posts.length
      ? posts.map(function (p) {
          return '<li data-id="' + p.id + '"><span class="t">' + esc(p.title) + '</span><span class="c">' + esc(p.category || "عمومی") + "</span>" +
            '<button type="button" data-act="edit">ویرایش</button><button type="button" class="del" data-act="del">حذف</button></li>';
        }).join("")
      : '<li style="justify-content:center;color:#8c84a3">هنوز پستی نیست — اولین پست را بنویس!</li>';
  }

  function refreshHome() {
    var grid = $("#postsGrid");
    var archive = $("#archiveList");
    var sorted = postsCache.slice().sort(function (a, b) {
      return a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : b.id - a.id;
    });
    if (grid) {
      grid.innerHTML = sorted.length
        ? sorted.map(cardHtml).join("")
        : '<p class="empty">هنوز پستی منتشر نشده. از پنل مدیر پایین صفحه اولین نوشته را بساز ✨</p>';
      applySearch(searchInput ? searchInput.value : "");
    }
    if (archive) {
      archive.innerHTML = sorted.map(function (p) {
        return '<li><a href="' + postHref(p.slug) + '"><span class="a-title">' + esc(p.title) + '</span>' +
          '<span class="a-cat">' + esc(p.category || "عمومی") + '</span><time data-date="' + esc(p.created_at) + '">' + faDate(p.created_at) + "</time></a></li>";
      }).join("");
    }
    renderAdminList(sorted);
  }

  /* -------------------------------- login -------------------------------- */
  /* کیبورد فارسی عددها را ۱۲۱۳ می‌نویسد؛ هر دو شکل را یکی می‌کنیم. */
  function normalizePass(value) {
    return String(value == null ? "" : value)
      .replace(/[\u06F0-\u06F9]/g, function (d) { return String(d.charCodeAt(0) - 0x06f0); })
      .replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); })
      .replace(/[\u200c\u200d\u200e\u200f\u00a0\s]/g, "");
  }
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var password = normalizePass(passInput.value);
    if (!password) { setMsg(loginMsg, "رمز را وارد کن.", "error"); return; }
    if (password !== PASS) {
      setMsg(loginMsg, "رمز اشتباه است. عددها را با کیبورد انگلیسی یا فارسی وارد کن.", "error");
      passInput.select();
      return;
    }
    try { localStorage.setItem(ADMIN_KEY, "1"); } catch (err) {}
    passInput.value = "";
    setMsg(loginMsg, "خوش آمدی مدیر! ✨", "ok");
    enter();
    if (!tokenForm.hidden) return;
    setTimeout(function () { try { $("#postTitle").focus(); } catch (err) {} }, 80);
  });

  tokenForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var value = String(tokenInput.value || "").trim();
    if (!value) { setMsg(tokenMsg, "توکن را وارد کن.", "error"); return; }
    setMsg(tokenMsg, "در حال بررسی…");
    var previous = token();
    try { localStorage.setItem(TOKEN_KEY, value); } catch (err) {}
    ghRead().then(function (data) {
      postsCache = data.posts;
      tokenInput.value = "";
      setMsg(tokenMsg, "");
      showEditor();
      refreshHome();
    }).catch(function (err) {
      try {
        if (previous) localStorage.setItem(TOKEN_KEY, previous); else localStorage.removeItem(TOKEN_KEY);
      } catch (e2) {}
      setMsg(tokenMsg, err.message || "توکن کار نکرد.", "error");
    });
  });

  logoutBtn.addEventListener("click", function () {
    try { localStorage.removeItem(ADMIN_KEY); } catch (e) {}
    showLogin();
    closePanel();
  });

  /* ------------------------------- github -------------------------------- */
  function toB64(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function fromB64(b64) {
    var bin = atob(String(b64 || "").replace(/\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function ghFetch(path, opts) {
    var headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    var tk = token();
    if (tk) headers.Authorization = "Bearer " + tk;
    var init = { headers: headers, cache: "no-store" };
    if (opts) for (var k in opts) init[k] = opts[k];
    return fetch("https://api.github.com/repos/" + REPO + path, init);
  }
  function ghRead() {
    return ghFetch("/contents/" + DATA_PATH + "?ref=" + encodeURIComponent(BRANCH)).then(function (r) {
      if (r.status === 401 || r.status === 403) throw new Error("توکن گیت‌هاب نامعتبر است یا اجازه‌ی نوشتن ندارد.");
      if (r.status === 404) throw new Error("فایل پست‌ها روی گیت‌هاب پیدا نشد.");
      if (!r.ok) throw new Error("خطای گیت‌هاب: " + r.status);
      return r.json().then(function (f) {
        var list = [];
        try { list = JSON.parse(fromB64(f.content)); } catch (e) { list = []; }
        return { sha: f.sha, posts: list };
      });
    });
  }
  function ghWrite(list, sha, message) {
    return ghFetch("/contents/" + DATA_PATH, {
      method: "PUT",
      body: JSON.stringify({ message: message, content: toB64(JSON.stringify(list, null, 2)), sha: sha, branch: BRANCH }),
    }).then(function (r) {
      if (r.status === 401 || r.status === 403) throw new Error("توکن اجازه‌ی انتشار ندارد.");
      if (r.status === 409) throw new Error("همین لحظه یک تغییر دیگر ثبت شد؛ یک‌بار دیگر تلاش کن.");
      if (!r.ok) throw new Error("انتشار انجام نشد (خطای " + r.status + ").");
      return r.json();
    });
  }

  /* -------------------------------- editor ------------------------------- */
  var area = $("#editorArea");
  var titleIn = $("#postTitle");
  var catIn = $("#postCategory");
  var coverIn = $("#postCover");
  var excerptIn = $("#postExcerpt");
  var wordCount = $("#wordCount");
  var saveBtn = $("#savePost");
  var resetBtn = $("#resetPost");

  try { document.execCommand("styleWithCSS", false, false); } catch (e) {}

  function focusArea() {
    if (document.activeElement !== area) area.focus();
  }
  function updateCount() {
    if (!wordCount) return;
    var words = (area.innerText || "").trim().split(/\s+/).filter(Boolean).length;
    wordCount.textContent = faNum(words) + " کلمه · " + faNum(readingTime(area.innerHTML)) + " دقیقه مطالعه";
  }
  if (area) {
    area.addEventListener("input", updateCount);
    updateCount();
  }

  function run(cmd, value) {
    focusArea();
    try { document.execCommand(cmd, false, value == null ? null : value); } catch (e) {}
    area.focus();
    updateCount();
  }

  var toolbar = $(".toolbar");
  if (toolbar) {
    toolbar.addEventListener("mousedown", function (e) {
      if (e.target.closest("button") || e.target.closest("label")) e.preventDefault();
    });
    toolbar.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var cmd = btn.getAttribute("data-cmd");
      var block = btn.getAttribute("data-block");
      var act = btn.getAttribute("data-act");

      if (cmd) { run(cmd); return; }
      if (block) { run("formatBlock", "<" + block + ">"); return; }
      if (act === "link") {
        var sel = String(window.getSelection());
        var url = window.prompt("لینک را وارد کن (https://…)", "https://");
        if (!url) return;
        if (sel && sel.trim()) run("createLink", url);
        else run("insertHTML", '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(url) + "</a>&nbsp;");
        return;
      }
      if (act === "image") {
        var src = window.prompt("آدرس عکس را وارد کن (https://…)", "https://");
        if (!src || !/^https?:\/\//i.test(src)) return;
        var alt = window.prompt("توضیح کوتاه عکس (برای گوگل):", "");
        run("insertHTML", '<img src="' + esc(src) + '" alt="' + esc(alt || "") + '" loading="lazy" />');
        return;
      }
      if (act === "video") {
        var v = window.prompt("لینک ویدیوی یوتیوب را بگذار:", "");
        if (!v) return;
        var id = "";
        var m = v.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{6,})/);
        if (m) id = m[1];
        if (!id) { setMsg(editorMsg, "لینک یوتیوب درست نیست.", "error"); return; }
        run("insertHTML", '<iframe src="https://www.youtube.com/embed/' + id + '" loading="lazy" allowfullscreen frameborder="0" title="ویدیو"></iframe>');
        return;
      }
      if (act === "emoji") {
        toggleEmojiBar();
        return;
      }
    });
  }

  var foreColor = $("#foreColor");
  var hiliteColor = $("#hiliteColor");
  if (foreColor) foreColor.addEventListener("input", function () { run("foreColor", foreColor.value); });
  if (hiliteColor) hiliteColor.addEventListener("input", function () { run("hiliteColor", hiliteColor.value); });

  var emojiBar = null;
  var EMOJI_SET = ["😀","😍","🤩","😎","🥳","🤔","👍","👏","🙌","✨","🌟","🔥","💡","📌","🎉","❤️","🦄","🐣","🐳","🦉","🍀","🌈","🚀","🧪","📚","✏️","🎨","⚽","🎈","🧩"];
  function toggleEmojiBar() {
    if (!emojiBar) {
      emojiBar = document.createElement("div");
      emojiBar.className = "toolbar";
      emojiBar.style.cssText = "border-bottom:1px solid var(--line);border-radius:16px;margin:6px 0 8px;max-height:110px;overflow-y:auto";
      emojiBar.innerHTML = EMOJI_SET.map(function (em) {
        return '<button type="button" data-em="' + em + '" style="font-size:18px">' + em + "</button>";
      }).join("");
      emojiBar.addEventListener("mousedown", function (e) { e.preventDefault(); });
      emojiBar.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-em]");
        if (!b) return;
        run("insertText", b.getAttribute("data-em"));
      });
      toolbar.parentNode.insertBefore(emojiBar, toolbar.nextSibling);
    } else {
      emojiBar.hidden = !emojiBar.hidden;
    }
  }

  function resetForm() {
    state.editingId = null;
    titleIn.value = "";
    catIn.value = "";
    coverIn.value = "";
    excerptIn.value = "";
    area.innerHTML = "";
    saveBtn.textContent = "انتشار پست";
    updateCount();
  }
  resetBtn.addEventListener("click", function () {
    resetForm();
    setMsg(editorMsg, "فرم پاک شد.");
  });

  function save() {
    if (!state.loggedIn) return;
    var title = String(titleIn.value || "").trim();
    if (!title) { setMsg(editorMsg, "عنوان پست را بنویس.", "error"); titleIn.focus(); return; }
    var content = String(area.innerHTML || "").trim();
    if (!content) { setMsg(editorMsg, "متن پست خالی است.", "error"); area.focus(); return; }

    var isEdit = !!state.editingId;
    var label = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = "در حال انتشار…";
    setMsg(editorMsg, "در حال ثبت روی گیت‌هاب…");

    ghRead().then(function (data) {
      var list = data.posts || [];
      var now = new Date().toISOString();
      var payload = {
        title: title,
        category: String(catIn.value || "").trim() || "عمومی",
        excerpt: String(excerptIn.value || "").trim().slice(0, 400),
        cover: /^https?:\/\//i.test(String(coverIn.value || "").trim()) ? String(coverIn.value).trim() : "",
        content: content,
      };
      var message;
      if (isEdit) {
        var existing = null;
        for (var i = 0; i < list.length; i++) if (Number(list[i].id) === Number(state.editingId)) existing = list[i];
        if (!existing) throw new Error("پست برای ویرایش پیدا نشد؛ صفحه را دوباره باز کن.");
        existing.title = payload.title;
        existing.category = payload.category;
        existing.excerpt = payload.excerpt;
        existing.cover = payload.cover;
        existing.content = payload.content;
        existing.updated_at = now;
        message = "edit post: " + payload.title;
      } else {
        var maxId = 0;
        list.forEach(function (p) { if (Number(p.id) > maxId) maxId = Number(p.id); });
        var base = slugify(payload.title);
        var slug = base, n = 1, taken = {};
        list.forEach(function (p) { taken[p.slug] = 1; });
        while (taken[slug]) { n += 1; slug = base + "-" + n; }
        list.push({
          id: maxId + 1,
          slug: slug,
          title: payload.title,
          category: payload.category,
          excerpt: payload.excerpt,
          cover: payload.cover,
          content: payload.content,
          created_at: now,
          updated_at: now,
        });
        message = "new post: " + payload.title;
      }
      return ghWrite(list, data.sha, message).then(function () { return list; });
    }).then(function (list) {
      postsCache = list;
      saveBtn.disabled = false;
      saveBtn.textContent = isEdit ? "ذخیره‌ی تغییرات" : "انتشار پست";
      setMsg(editorMsg, (isEdit ? "تغییرات ثبت شد ✅" : "پست منتشر شد 🎉") + " صفحه‌ی نخست همین حالا به‌روز شد و سایت برای همه تا حدود یک دقیقه دیگر به‌روز می‌شود.", "ok");
      resetForm();
      refreshHome();
    }).catch(function (err) {
      saveBtn.disabled = false;
      saveBtn.textContent = label;
      setMsg(editorMsg, err.message || "انتشار انجام نشد.", "error");
      if (err && /توکن/.test(err.message || "")) { tokenForm.hidden = false; editorApp.hidden = true; }
    });
  }
  saveBtn.addEventListener("click", save);

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && !editorApp.hidden) {
      e.preventDefault();
      save();
    }
  });

  /* ---------------------------- admin list acts -------------------------- */
  var adminList = $("#adminList");
  adminList.addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn) return;
    var li = e.target.closest("li[data-id]");
    if (!li) return;
    var id = Number(li.getAttribute("data-id"));
    var post = null;
    postsCache.forEach(function (p) { if (Number(p.id) === id) post = p; });
    if (!post) return;

    if (btn.getAttribute("data-act") === "edit") {
      state.editingId = id;
      titleIn.value = post.title || "";
      catIn.value = post.category || "";
      coverIn.value = post.cover || "";
      excerptIn.value = post.excerpt || "";
      area.innerHTML = post.content || "";
      updateCount();
      saveBtn.textContent = "ذخیره‌ی تغییرات";
      setMsg(editorMsg, "پست در حال ویرایش است.");
      panel.scrollTop = 0;
      try { titleIn.focus(); } catch (err) {}
      return;
    }

    if (btn.getAttribute("data-act") === "del") {
      if (!window.confirm('پست «' + post.title + '» حذف شود؟')) return;
      setMsg(editorMsg, "در حال حذف…");
      ghRead().then(function (data) {
        var list = (data.posts || []).filter(function (p) { return Number(p.id) !== id; });
        return ghWrite(list, data.sha, "delete post: " + post.title).then(function () { return list; });
      }).then(function (list) {
        postsCache = list;
        if (state.editingId === id) resetForm();
        setMsg(editorMsg, "پست حذف شد. سایت تا حدود یک دقیقه دیگر به‌روز می‌شود.", "ok");
        refreshHome();
      }).catch(function (err) { setMsg(editorMsg, err.message || "حذف نشد.", "error"); });
    }
  });

  /* ------------------------------- bootstrap ----------------------------- */
  var remembered = false;
  try { remembered = localStorage.getItem(ADMIN_KEY) === "1"; } catch (e) {}
  if (remembered) {
    enter();
    if (location.hash === "#admin") openPanel();
  }
})();
