        }
        return gridState.sort === "old" ? da - db : db - da;
      });
      cards.forEach(function (card) { grid.appendChild(card); });
      refreshGrid();
    });
    on($("#wjfCat"), "change", function (e) { gridState.cat = e.target.value; refreshGrid(); });
    on($("#wjfView"), "click", function () {
      grid.classList.toggle("wjf-listview");
      this.textContent = grid.classList.contains("wjf-listview") ? "▦ شبکه‌ای" : "☰ فهرستی";
    });
    on($("#wjfShort"), "change", function (e) { gridState.short = e.target.checked; refreshGrid(); });
    on($("#wjfCover"), "change", function (e) { gridState.cover = e.target.checked; refreshGrid(); });
    on($("#wjfMoreBtn"), "click", function () { gridState.shown += 9; refreshGrid(); });
    on($("#wjfRandom"), "click", function () {
      postsAsync().then(function (list) {
        if (!list.length) { say("هنوز نوشته‌ای نیست."); return; }
        location.href = list[Math.floor(Math.random() * list.length)].url;
      });
    });
    on($("#wjfArchive"), "click", openArchive);

    /* برگرداندن فیلترها و نمایش تدریجی بعد از هر بار جستجو */
    var observer = new MutationObserver(function () {
      clearTimeout(observer._t);
      observer._t = setTimeout(refreshGrid, 60);
    });
    observer.observe(grid, { childList: true });
    refreshGrid();
  }

  function searchExtras() {
    var input = $("#searchInput");
    if (!input) return;
    var host = input.closest(".search") || input.parentNode;

    var clear = el("button", "wjf-clear", "✕");
    clear.type = "button";
    clear.title = "پاک کردن جستجو";
    clear.setAttribute("aria-label", "پاک کردن جستجو");
    host.appendChild(clear);

    var meta = el("p", "wjf-searchmeta");
    meta.id = "wjfSearchMeta";
    host.parentNode.insertBefore(meta, host.nextSibling);

    var box = el("div", "wjf-sug");
    box.innerHTML = '<div class="wjf-sug-head"><strong>پیشنهادها</strong>' +
      '<select class="wjf-input" id="wjfSearchCat" aria-label="فیلتر دسته در نتایج"><option value="">همه</option></select></div>' +
      '<div id="wjfSugList"></div>';
    host.appendChild(box);

    var sugList = $("#wjfSugList", box);
    var catSelect = $("#wjfSearchCat", box);

    postsAsync().then(function (list) {
      var cats = [];
      list.forEach(function (p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });
      cats.forEach(function (c) { catSelect.appendChild(el("option", "", esc(c))); catSelect.lastChild.value = c; });
    });

    function recent() {
      return read("wjf_searches", []);
    }
    function remember(q) {
      if (!q || q.length < 2) return;
      var list = recent().filter(function (x) { return x !== q; });
      list.unshift(q);
      write("wjf_searches", list.slice(0, 8));
    }

    function paintSuggestions() {
      var q = input.value.trim();
      clear.classList.toggle("is-on", !!q);
      if (q.length < 1) {
        var rec = recent();
        if (!rec.length) { box.classList.remove("is-on"); return; }
        sugList.innerHTML = "<strong class=\"wjf-muted\">جستجوهای اخیر</strong>" +
          rec.map(function (r) { return '<a href="#" data-q="' + esc(r) + '">🕘 ' + esc(r) + "</a>"; }).join("");
        box.classList.add("is-on");
        return;
      }
      postsAsync().then(function (list) {
        var cat = catSelect.value;
        var hits = list.filter(function (p) {
          if (cat && p.category !== cat) return false;
          return (p.title + " " + p.category + " " + (p.excerpt || "")).toLowerCase().indexOf(q.toLowerCase()) >= 0;
        }).slice(0, 6);
        if (!hits.length) { box.classList.remove("is-on"); return; }
        sugList.innerHTML = hits.map(function (p) {
          return '<a href="' + esc(p.url) + '">' + esc(p.title) + "<small>" + esc(p.category) + "</small></a>";
        }).join("");
        box.classList.add("is-on");
      });
    }

    on(input, "input", paintSuggestions);
    on(input, "focus", paintSuggestions);
    on(input, "blur", function () { setTimeout(function () { box.classList.remove("is-on"); }, 160); });
    on(input, "keydown", function (e) {
      if (e.key !== "Enter") return;
      remember(input.value.trim());
      var first = $("a[href]", sugList);
      var card = $("#postsGrid .card:not([hidden]) a[href]");
      if (first && box.classList.contains("is-on")) { e.preventDefault(); location.href = first.href; }
      else if (card) { e.preventDefault(); location.href = card.href; }
    });
    on(clear, "click", function () {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
      say("جستجو پاک شد");
    });
    on(box, "click", function (e) {
      var a = e.target.closest("a[data-q]");
      if (a) {
        e.preventDefault();
        input.value = a.getAttribute("data-q");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        box.classList.remove("is-on");
      }
    });
    on(catSelect, "change", function () {
      var cat = catSelect.value;
      $$("#postsGrid .card").forEach(function (card) {
        var badge = card.querySelector(".badge");
        var name = badge ? badge.textContent.trim() : card.getAttribute("data-cat");
        card.hidden = !!cat && name !== cat;
      });
      paintSuggestions();
    });

    /* شمارش نتایج + برجسته‌سازی کلمه */
    var grid = $("#postsGrid");
    if (grid) {
      var observer = new MutationObserver(function () {
        clearTimeout(observer._t);
        observer._t = setTimeout(function () {
          var q = input.value.trim();
          if (q.length >= 2 && !grid.querySelector("mark.wjf-q")) {
            var re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
            $$(".card-title, .card-excerpt", grid).forEach(function (node) {
              if (!node.textContent.match(re)) return;
              node.innerHTML = esc(node.textContent).replace(re, '<mark class="wjf-q">$1</mark>');
            });
          }
          var note = $("#wjfSearchMeta");
          if (note) {
            var n = $$(".card", grid).filter(function (c) { return !c.hidden; }).length;
            note.textContent = q.length >= 2 ? faNum(n) + " نتیجه" : "";
          }
        }, 80);
      });
      observer.observe(grid, { childList: true });
    }
    paintSuggestions();
  }

  function archiveMonths() {
    var list = $("#archiveList");
    if (!list) return;
    var items = $$("li", list);
    var lastLabel = "";
    items.forEach(function (li) {
      var time = li.querySelector("time[data-date]");
      if (!time) return;
      var label = "";
      try {
        label = new Intl.DateTimeFormat("fa-IR", { month: "long", year: "numeric" }).format(new Date(time.getAttribute("data-date")));
      } catch (e) { label = ""; }
      if (!label || label === lastLabel) return;
      lastLabel = label;
      var head = el("li", "wjf-month", label);
      list.insertBefore(head, li);
    });
  }

  /* ====================== ۳۷–۴۶ کشف محتوا =============================== */

  var viewState = read("wjf_views", []);

  function discoverPanel() {
    var archiveSection = $("section[aria-labelledby='allposts']");
    if (!archiveSection) return;
    var host = el("section", "wjf-discover");
    host.innerHTML = '<div class="section-head"><h2>کشف تازه</h2><p>بر اساس خواندن‌های خودت</p></div><div class="wjf-disc-grid" id="wjfDiscGrid"></div>';
    archiveSection.parentNode.insertBefore(host, archiveSection);
    var grid = $("#wjfDiscGrid", host);

    function block(title, icon, items) {
      if (!items.length) return "";
      return '<div class="wjf-disc-card"><h3>' + icon + " " + title + "</h3><ul>" + items.map(function (p) {
        return '<li><a href="' + esc(p.u) + '">' + esc(p.t) + "</a><small>" + esc(p.c || "") + "</small></li>";
      }).join("") + "</ul></div>";
    }

    postsAsync().then(function (posts) {
      var now = new Date();
      var todayLabel = new Intl.DateTimeFormat("fa-IR", { month: "long", day: "numeric" }).format(now);
      var onThisDay = posts.filter(function (p) {
        var d = new Date(p.created_at);
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
      }).slice(0, 3).map(function (p) { return { u: p.url, t: p.title, c: "سال " + new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(new Date(p.created_at)) }; });

      var viewed = viewState.slice().sort(function (a, b) { return (b.n || 0) - (a.n || 0); }).slice(0, 3);
      var week = viewState.filter(function (v) { return Date.now() - (v.last || 0) < 7 * 86400000; })
        .sort(function (a, b) { return (b.n || 0) - (a.n || 0); }).slice(0, 3);
      var recentList = viewState.slice().sort(function (a, b) { return (b.last || 0) - (a.last || 0); }).slice(0, 3);

      var html = block("در چنین روزی", "📅", onThisDay) +
