        var all = read("wjf_notes", {});
        delete all[location.pathname];
        write("wjf_notes", all);
        var btn = $('[data-a="notes"]');
        if (btn) btn.classList.remove("is-on");
        say("یادداشت حذف شد");
        close();
      });
    });
  }

  /* ========================= ۵۶–۵۷ متن و هایلایت ========================= */

  function selectionTools() {
    var content = $(".post-content");
    if (!content) return;
    var pop = null;

    function hide() { if (pop) { pop.remove(); pop = null; } }
    function wrapSelection(sel, range) {
      var quote = sel.toString().trim();
      if (quote.length < 3) return;
      var id = "hl" + Date.now();
      var mark = document.createElement("mark");
      mark.className = "wjf-hl";
      mark.setAttribute("data-hl", id);
      try {
        mark.appendChild(range.extractContents());
        range.insertNode(mark);
      } catch (e) {
        return;
      }
      var all = read("wjf_hl", {});
      if (!all[location.pathname]) all[location.pathname] = [];
      all[location.pathname].push({ id: id, q: quote });
      write("wjf_hl", all);
      sel.removeAllRanges();
      say("هایلایت ذخیره شد");
    }

    on(document, "mouseup", function (e) {
      if (pop && pop.contains(e.target)) return;
      setTimeout(function () {
        var sel = window.getSelection();
        if (!sel || !sel.rangeCount || sel.isCollapsed) { hide(); return; }
        var range = sel.getRangeAt(0);
        if (!content.contains(range.commonAncestorContainer)) { hide(); return; }
        var text = sel.toString().trim();
        if (text.length < 3) { hide(); return; }
        hide();
        var rect = range.getBoundingClientRect();
        pop = el("div", "wjf-sel");
        pop.innerHTML = '<span class="wjf-sel-count">' + faNum(text.split(/\s+/).length) + " کلمه</span>" +
          '<button type="button" data-s="copy">کپی</button>' +
          '<button type="button" data-s="hl">هایلایت</button>' +
          '<button type="button" data-s="share">اشتراک</button>';
        document.body.appendChild(pop);
        var top = Math.max(8, rect.top - pop.offsetHeight - 8);
        var left = Math.min(window.innerWidth - pop.offsetWidth - 8, Math.max(8, rect.left + rect.width / 2 - pop.offsetWidth / 2));
        pop.style.top = top + "px";
        pop.style.left = left + "px";
        on(pop, "mousedown", function (ev) { ev.preventDefault(); });
        on(pop, "click", function (ev) {
          var btn = ev.target.closest("button[data-s]");
          if (!btn) return;
          var act = btn.getAttribute("data-s");
          if (act === "copy") copyText(text);
          else if (act === "hl") wrapSelection(sel, range);
          else if (act === "share") {
            if (navigator.share) navigator.share({ text: text, url: location.href }).catch(function () {});
            else copyText(text + " — " + location.href);
          }
          hide();
        });
      }, 10);
    });
    on(document, "mousedown", function (e) { if (pop && !pop.contains(e.target)) hide(); });
    on(window, "scroll", hide, { passive: true });

    /* بازگرداندن هایلایت‌های ذخیره‌شده */
    var saved = read("wjf_hl", {})[location.pathname] || [];
    saved.forEach(function (item) {
      if (content.querySelector('[data-hl="' + item.id + '"]')) return;
      var walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, null);
      var node;
      while ((node = walker.nextNode())) {
        var at = node.nodeValue.indexOf(item.q);
        if (at < 0) continue;
        if (node.parentNode.closest("mark.wjf-hl")) continue;
        var range = document.createRange();
        range.setStart(node, at);
        range.setEnd(node, at + item.q.length);
        var mark = document.createElement("mark");
        mark.className = "wjf-hl";
        mark.setAttribute("data-hl", item.id);
        try { range.surroundContents(mark); } catch (e) {}
        break;
      }
    });
    void content;
  }

  /* ==================== ۵۹–۷۴ ابزارها و آمار محلی ====================== */

  function dataBackup() {
    var data = {};
    for (var i = 0; i < localStorage.length; i += 1) {
      var key = localStorage.key(i);
      if (!/^wj/.test(key)) continue;
      if (/token|gh_|auth|pass/i.test(key)) continue;
      data[key] = localStorage.getItem(key);
    }
    download("webjiko-backup-" + today() + ".json", JSON.stringify({ app: "webjiko", v: 1, at: new Date().toISOString(), data: data }, null, 2), "application/json");
    say("پشتیبان دانلود شد ✅");
  }

  function dataRestore() {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    on(input, "change", function () {
      var file = input.files && input.files[0];
      if (!file) return;
      file.text().then(function (text) {
        var parsed;
        try { parsed = JSON.parse(text); } catch (e) { say("فایل پشتیبان درست نیست."); return; }
        var data = parsed && parsed.data ? parsed.data : null;
        if (!data) { say("ساختار فایل پشتیبان درست نیست."); return; }
        if (!window.confirm("داده‌های محلی فعلی با این پشتیبان جایگزین شوند؟")) return;
        Object.keys(data).forEach(function (key) {
          if (!/^wj/.test(key) || /token|gh_|auth|pass/i.test(key)) return;
          try { localStorage.setItem(key, data[key]); } catch (e) {}
        });
        say("بازگردانی شد؛ صفحه تازه می‌شود…");
        setTimeout(function () { location.reload(); }, 800);
      });
    });
    input.click();
  }

  function openArchive() {
    openDialog("آرشیو کامل نوشته‌ها", '<input type="search" class="wjf-input" id="wjfArchQ" placeholder="جستجو در آرشیو…" style="width:100%" />' +
      '<ul class="wjf-list" id="wjfArchList"><li class="wjf-muted">در حال بارگذاری…</li></ul>', function (box) {
      var list = $("#wjfArchList", box);
      var q = $("#wjfArchQ", box);
      postsAsync().then(function (posts) {
        function draw() {
          var value = q.value.trim().toLowerCase();
          var rows = posts.filter(function (p) { return !value || (p.title + p.category + (p.excerpt || "")).toLowerCase().indexOf(value) >= 0; });
          list.innerHTML = rows.length ? rows.map(function (p) {
            return '<li><a href="' + esc(p.url) + '">' + esc(p.title) + "<small>" + esc(p.category) + "</small></a></li>";
          }).join("") : '<li class="wjf-muted">چیزی پیدا نشد.</li>';
        }
        on(q, "input", draw);
        draw();
        q.focus();
      });
    });
  }

  function statsPane(pane) {
    var views = read("wjf_views", []);
    var total = views.reduce(function (sum, v) { return sum + (v.n || 0); }, 0);
    var cats = {};
    views.forEach(function (v) { if (v.c) cats[v.c] = (cats[v.c] || 0) + (v.n || 0); });
    var top = Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a]; }).slice(0, 3);
    var minutes = views.reduce(function (sum, v) { return sum + 2 * (v.n || 0); }, 0);
    var streak = streakDays();
    var achievements = [
      ["اولین قدم", "حداقل یک نوشته خوانده‌ای", total >= 1],
      ["کتاب‌خوان", "۵ نوشته خوانده‌ای", total >= 5],
      ["کاوشگر", "۱۰ نوشته خوانده‌ای", total >= 10],
      ["وفادار", "۳ روز پیوسته خوانده‌ای", streak >= 3],
      ["هفتهٔ پرمطالعه", "۷ روز پیوسته خوانده‌ای", streak >= 7],
      ["ذخیره‌کار", "چیزی برای بعد ذخیره کرده‌ای", read("wj_saved", []).length > 0],
    ];
    pane.innerHTML =
      '<h4>آمار مطالعهٔ من</h4>' +
      '<div class="wjf-row"><label>کل بازدید از نوشته‌ها</label><span class="wjf-badge">' + faNum(total) + "</span></div>" +
      '<div class="wjf-row"><label>نوشته‌های خوانده‌شده</label><span class="wjf-badge">' + faNum(views.length) + "</span></div>" +
      '<div class="wjf-row"><label>دقیقهٔ تقریبی مطالعه</label><span class="wjf-badge">' + faNum(minutes) + "</span></div>" +
      '<div class="wjf-row"><label>روزهای پیوسته</label><span class="wjf-badge">' + faNum(streak) + " روز</span></div>" +
      '<div class="wjf-row"><label>دسته‌های محبوب</label><span class="wjf-badge">' + (top.length ? esc(top.join("، ")) : "—") + "</span></div>" +
      '<h4>نشان‌ها</h4><div class="wjf-chipset">' + achievements.map(function (a) {
        return '<span class="wjf-badge' + (a[2] ? " is-on" : "") + '" title="' + esc(a[1]) + '">' + (a[2] ? "🏅 " : "🔒 ") + esc(a[0]) + "</span>";
      }).join("") + "</div>" +
      '<h4>تایمر پومودورو</h4>' +
      '<div class="wjf-row"><label id="wjfPomoBox">۲۵:۰۰</label>' +
      '<span><button type="button" class="wjf-btn" data-pomo="start">شروع</button> ' +
      '<button type="button" class="wjf-btn" data-pomo="stop">توقف</button></span></div>' +
      '<h4>ابزار مطالعه</h4>' +
      '<div class="wjf-actions">' +
      '<button type="button" class="wjf-btn" data-act="health">🩺 بررسی سلامت صفحه</button>' +
      '<button type="button" class="wjf-btn" data-act="archive2">📚 آرشیو کامل</button>' +
      "</div>";

    var seconds = 25 * 60;
    var timer = null;
    function paint() {
      var box = $("#wjfPomoBox", pane);
      if (!box) return;
      var m = Math.floor(seconds / 60);
      var s = seconds % 60;
      box.textContent = faNum(String(m).padStart(2, "0")) + ":" + faNum(String(s).padStart(2, "0"));
    }
    on(pane, "click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      if (btn.getAttribute("data-pomo") === "start") {
        if (timer) return;
