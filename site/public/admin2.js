/* وب‌جیکو — پیش‌نویس خودکار، پیش‌نمایش زنده، شمارشگر سئو و پشتیبان JSON */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function ready(attempt) {
    if (!window.WJ) {
      if ((attempt || 0) < 40) return setTimeout(function () { ready((attempt || 0) + 1); }, 120);
      return;
    }
    boot();
  }
  function toast(msg, kind) {
    if (window.WJ && window.WJ.say) window.WJ.say(msg, kind);
    else if (window.WJToast) window.WJToast(msg);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function boot() {
    var E = window.WJ.editor();
    if (!E.title || !E.area) return;
    var panel = window.WJ.panel();

    /* --------------------------- پیش‌نویس خودکار -------------------------- */
    var bar = document.createElement("div");
    bar.className = "draft-bar";
    bar.innerHTML = '<span id="draftState">پیش‌نویس خودکار: روشن</span>' +
      '<button type="button" data-d="restore" hidden>بازیابی پیش‌نویس</button>' +
      '<button type="button" data-d="drop" hidden>دور انداختن</button>';
    E.title.parentNode.insertBefore(bar, E.title.nextSibling);

    function key() {
      var id = window.WJ.editingId ? window.WJ.editingId() : "new";
      return "wj_draft_" + (id || "new");
    }
    function snapshot() {
      return {
        t: E.title.value || "",
        c: E.cat ? E.cat.value || "" : "",
        s: E.slug ? E.slug.value || "" : "",
        e: E.excerpt ? E.excerpt.value || "" : "",
        h: E.area.innerHTML || "",
        at: new Date().toISOString(),
        id: window.WJ.editingId ? window.WJ.editingId() : null,
      };
    }
    function write() {
      var snap = snapshot();
      if (!snap.t && !snap.h.replace(/<[^>]*>/g, "").trim()) return;
      try { localStorage.setItem(key(), JSON.stringify(snap)); } catch (e) {}
      var state = $("#draftState");
      if (state) state.textContent = "پیش‌نویس خودکار ذخیره شد · " + new Date().toLocaleTimeString("fa-IR");
    }
    var timer = null;
    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(write, 1200);
    }
    [E.title, E.area, E.excerpt, E.cat, E.slug].forEach(function (el) {
      if (el) el.addEventListener("input", schedule);
    });

    function readDraft() {
      try { return JSON.parse(localStorage.getItem(key()) || "null"); } catch (e) { return null; }
    }
    function refreshBar() {
      var draft = readDraft();
      var restoreBtn = bar.querySelector('[data-d="restore"]');
      var dropBtn = bar.querySelector('[data-d="drop"]');
      var hasContent = draft && (draft.t || (draft.h || "").replace(/<[^>]*>/g, "").trim());
      var editing = (E.title.value || "").trim() || (E.area.innerHTML || "").replace(/<[^>]*>/g, "").trim();
      var show = !!hasContent && (!editing || (draft && draft.at && draft.h !== E.area.innerHTML));
      if (restoreBtn) restoreBtn.hidden = !show;
      if (dropBtn) dropBtn.hidden = !hasContent;
    }
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-d]");
      if (!btn) return;
      var act = btn.getAttribute("data-d");
      if (act === "restore") {
        var draft = readDraft();
        if (!draft) return;
        E.title.value = draft.t || "";
        if (E.cat) E.cat.value = draft.c || "";
        if (E.slug) E.slug.value = draft.s || "";
        if (E.excerpt) E.excerpt.value = draft.e || "";
        E.area.innerHTML = draft.h || "";
        toast("پیش‌نویس بازیابی شد ✅", "ok");
      } else {
        try { localStorage.removeItem(key()); } catch (err) {}
        toast("پیش‌نویس دور انداخته شد");
      }
      refreshBar();
    });
    E.title.addEventListener("focus", refreshBar);
    refreshBar();

    /* ---------------------------- پیش‌نمایش زنده -------------------------- */
    var footActions = $(".editor-foot-actions");
    if (footActions) {
      var pvBtn = document.createElement("button");
      pvBtn.type = "button";
      pvBtn.className = "btn btn-ghost";
      pvBtn.textContent = "پیش‌نمایش";
      pvBtn.addEventListener("click", function () {
        var modal = document.createElement("div");
        modal.className = "wj-modal";
        modal.innerHTML = '<div class="wj-box pv-box"><button type="button" class="wj-close">✕</button>' +
          '<h3 class="post-title">' + esc(E.title.value || "بدون عنوان") + "</h3>" +
          (E.excerpt && E.excerpt.value ? '<p class="post-lead">' + esc(E.excerpt.value) + "</p>" : "") +
          (E.cover && E.cover.value ? '<img src="' + esc(E.cover.value) + '" alt="" />' : "") +
          '<div class="post-content">' + (E.area.innerHTML || "<p>متن هنوز خالی است.</p>") + "</div></div>";
        modal.addEventListener("click", function (ev) {
          if (ev.target === modal || ev.target.classList.contains("wj-close")) modal.remove();
        });
        document.addEventListener("keydown", function onKey(ev) {
          if (ev.key === "Escape") { modal.remove(); document.removeEventListener("keydown", onKey); }
        });
        document.body.appendChild(modal);
      });
      footActions.insertBefore(pvBtn, footActions.firstChild);
    }

    /* ------------------------- شمارشگر و هشدار سئو ------------------------ */
    var hints = document.createElement("div");
    hints.className = "seo-hints";
    E.title.parentNode.insertBefore(hints, E.title.nextSibling);
    function cls(n, min, max) { return n < min ? "bad" : n > max ? "warn" : "ok"; }
    function paintHints() {
      var t = (E.title.value || "").trim();
      var e = E.excerpt ? (E.excerpt.value || "").trim() : "";
      var words = (E.area.innerText || "").trim().split(/\s+/).filter(Boolean).length;
      hints.innerHTML =
        '<span class="' + cls(t.length, 20, 70) + '">عنوان: ' + t.length + " حرف" + (t.length && t.length < 20 ? " — کمی کوتاه" : t.length > 70 ? " — بلند" : "") + "</span>" +
        '<span class="' + cls(e.length, 70, 180) + '">توضیح: ' + e.length + " حرف</span>" +
        '<span class="' + (words < 250 ? "warn" : "ok") + '">' + words + " کلمه</span>" +
        '<span class="' + (E.cat && E.cat.value ? "ok" : "bad") + '">' + (E.cat && E.cat.value ? "دسته: " + esc(E.cat.value) : "دسته ندارد") + "</span>" +
        '<span class="' + (E.cover && E.cover.value ? "ok" : "warn") + '">' + (E.cover && E.cover.value ? "تصویر شاخص ✓" : "تصویر شاخص ندارد") + "</span>";
    }
    [E.title, E.excerpt, E.cat, E.cover, E.area].forEach(function (el) {
      if (el) el.addEventListener("input", paintHints);
    });
    paintHints();
    setInterval(paintHints, 2500);

    /* ------------------------- پشتیبان و بازگردانی ------------------------ */
    var tools = $(".dock-list-tools");
    if (!tools) {
      tools = document.createElement("div");
      tools.className = "editor-tools-extra dock-list-tools";
      var listHead = $(".admin-list-head");
      if (listHead) listHead.parentNode.insertBefore(tools, listHead.nextSibling);
      tools.innerHTML = '<button type="button" data-b="export">دانلود پشتیبان JSON</button>' +
        '<button type="button" data-b="import">بازگردانی از فایل</button>';
    }
    tools.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-b]");
      if (!btn) return;
      if (btn.getAttribute("data-b") === "export") {
        var blob = new Blob([JSON.stringify(window.WJ.posts(), null, 2)], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "webjiko-posts-" + new Date().toISOString().slice(0, 10) + ".json";
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
        toast("پشتیبان دانلود شد ✅", "ok");
        return;
      }
      var input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json";
      input.addEventListener("change", function () {
        var file = input.files && input.files[0];
        if (!file) return;
        file.text().then(function (text) {
          var list;
          try { list = JSON.parse(text); } catch (err) { toast("فایل JSON درست نیست.", "error"); return; }
          if (!Array.isArray(list)) { toast("فایل باید فهرستی از پست‌ها باشد.", "error"); return; }
          if (!window.confirm("همه‌ی پست‌های فعلی با این فایل جایگزین شود؟ (" + list.length + " پست)")) return;
          window.WJ.ghRead().then(function (data) {
            return window.WJ.ghWrite(list, data.sha, "restore posts backup");
          }).then(function () {
            window.WJ.setPosts(list);
            toast("بازگردانی ثبت شد؛ سایت تا یک دقیقه دیگر به‌روز می‌شود ✅", "ok");
          }).catch(function (err) { toast(err.message || "بازگردانی نشد.", "error"); });
        });
      });
      input.click();
    });

    /* ---------------------- نشان وضعیت در فهرست پست‌ها -------------------- */
    function decorate() {
      var list = $("#adminList");
      if (!list) return;
      $$("li[data-id]", list).forEach(function (li) {
        if (li.querySelector(".st-tag")) return;
        var id = Number(li.getAttribute("data-id"));
        var post = null;
        window.WJ.posts().forEach(function (p) { if (Number(p.id) === id) post = p; });
        if (!post) return;
        var tag = document.createElement("span");
        tag.className = "st-tag badge badge-inline";
        tag.textContent = post.status === "draft" ? "پیش‌نویس" : post.status === "scheduled" ? "زمان‌بندی" : "منتشر";
        li.appendChild(tag);
      });
    }
    setInterval(decorate, 1500);
    if (panel) panel.addEventListener("click", function () { setTimeout(decorate, 200); });
    decorate();
  }

  ready(0);
})();
