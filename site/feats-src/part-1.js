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

  function smartHeader() {
    var last = 0;
    onScroll(function (y) {
      if (y < 220) { root.classList.remove("wjf-head-hide"); return; }
      root.classList.toggle("wjf-head-hide", y > last + 6);
      if (y < last - 6) root.classList.remove("wjf-head-hide");
      last = y;
    });
  }

  /* ========================== ۲۱–۲۵ تاریخ و آمار ========================= */

  function relativeDates() {
    $$("time[data-date]").forEach(function (time) {
      var iso = time.getAttribute("data-date");
      if (!iso) return;
      var rel = relativeDate(iso);
      if (!rel) return;
      if (!time.getAttribute("title")) time.setAttribute("title", time.textContent.trim());
      if (time.textContent.trim() !== rel) time.textContent = rel;
    });
  }

  function persianDigits() {
    var content = $(".post-content");
    if (!content) return;
    var walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var tag = node.parentNode && node.parentNode.tagName;
        if (tag === "CODE" || tag === "PRE" || tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
        return /[0-9]/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });
    var nodes = [];
    var n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) { node.nodeValue = node.nodeValue.replace(/[0-9]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".charAt(Number(d)); }); });
  }

  function cardBadges() {
    var updated = {};
    var seed = $("#postsData");
    if (seed) {
      try {
        var data = JSON.parse(seed.textContent || "{}");
        (data.posts || []).forEach(function (p) {
          if (p.updated_at && p.created_at && new Date(p.updated_at) - new Date(p.created_at) > 86400000) updated[p.slug] = p.updated_at;
        });
      } catch (e) {}
    }
    $$(".card").forEach(function (card) {
      if (card.querySelector(".wjf-new")) return;
      var link = card.querySelector("a[href*='/post/']");
      var slug = "";
      if (link) {
        var m = link.getAttribute("href").match(/\/post\/([^/]+)\//);
        if (m) slug = decodeURIComponent(m[1]);
      }
      var time = card.querySelector("time[data-date]");
      if (time) {
        var diff = Date.now() - new Date(time.getAttribute("data-date")).getTime();
        if (diff >= 0 && diff < 7 * 86400000) {
          var badge = el("span", "wjf-new", "تازه");
          (card.querySelector(".card-cover") || card).appendChild(badge);
        }
      }
      if (updated[slug]) {
        var up = el("span", "wjf-upd", "به‌روزشده");
        (card.querySelector(".card-cover") || card).appendChild(up);
      }
    });
  }

  function postBadges() {
    if (!currentSlug()) return;
    var time = $(".post-meta time[data-date]");
    if (!time) return;
    var diff = Date.now() - new Date(time.getAttribute("data-date")).getTime();
    if (diff >= 0 && diff < 7 * 86400000) {
      var fresh = el("span", "wjf-new", "تازه");
      fresh.style.position = "static";
      fresh.style.display = "inline-block";
      fresh.style.marginInlineStart = "6px";
      time.parentNode.insertBefore(fresh, time.nextSibling);
    }
    var ld = null;
    $$('script[type="application/ld+json"]').forEach(function (s) {
      if (ld) return;
      try {
        var data = JSON.parse(s.textContent);
        var graph = data["@graph"] || (Array.isArray(data) ? data : [data]);
        graph.forEach(function (node) { if (node && node["@type"] === "BlogPosting") ld = node; });
      } catch (e) {}
    });
    if (ld && ld.dateModified && ld.datePublished && new Date(ld.dateModified) - new Date(ld.datePublished) > 86400000) {
      var up = el("span", "wjf-upd", "به‌روز شده");
      up.style.position = "static";
      up.style.display = "inline-block";
      up.style.marginInlineStart = "6px";
      time.parentNode.insertBefore(up, time.nextSibling);
    }
  }

  function postCounts() {
    var content = $(".post-content");
    var meta = $(".post-meta");
    if (!content || !meta || meta.querySelector(".wjf-meta-count")) return;
    var text = content.innerText.trim();
    var words = text.split(/\s+/).filter(Boolean).length;
    var chars = text.replace(/\s+/g, "").length;
    var imgs = $$("img", content).length;
    var span = el("span", "wjf-meta-count");
    span.textContent = " • " + faNum(words) + " کلمه · " + faNum(chars) + " نویسه";
    if (imgs) span.textContent += " · با تصاویر ≈ " + faNum(Math.max(1, Math.round(words / 180 + (imgs * 12) / 60))) + " دقیقه";
    meta.appendChild(span);
  }

  /* ====================== ۲۶–۳۶ صفحهٔ اصلی و جستجو ====================== */

  var gridState = { sort: "new", shown: 12, cat: "", short: false, cover: false, searching: false };

  function searchQuery() {
    var input = $("#searchInput");
    return input ? input.value.trim() : "";
  }

  function refreshGrid() {
    var grid = $("#postsGrid");
    if (!grid) return;
    gridState.searching = searchQuery().length >= 2;
    var cards = $$(".card", grid);
    var shown = 0;
    cards.forEach(function (card) {
      var cat = card.getAttribute("data-cat") || "";
      var hide = false;
      if (gridState.cat && cat !== gridState.cat) hide = true;
      if (gridState.short) {
        var meta = card.querySelector(".card-meta");
        var minutes = meta ? Number(toNum(meta.textContent).match(/(\d+)/) ? toNum(meta.textContent).match(/(\d+)/)[1] : 99) : 99;
        if (minutes > 5) hide = true;
      }
      if (gridState.cover && !card.querySelector(".card-cover-img")) hide = true;
      if (!hide && !gridState.searching) {
        shown += 1;
        if (shown > gridState.shown) hide = true;
      }
      card.hidden = hide;
    });
    var count = grid.querySelector(".wjf-count") || null;
    void count;
    var note = $("#wjfHomeCount");
    if (note) {
      var visible = cards.filter(function (c) { return !c.hidden; }).length;
      note.textContent = gridState.searching ? "" : faNum(visible) + " نوشته نمایش داده می‌شود";
    }
    var more = $("#wjfMoreBtn");
    if (more) {
      var eligible = cards.filter(function (c) {
        return !gridState.cat || c.getAttribute("data-cat") === gridState.cat;
      });
      var remaining = Math.max(0, eligible.length - cards.filter(function (c) { return !c.hidden; }).length);
      more.hidden = gridState.searching || remaining === 0;
      more.textContent = "نمایش " + faNum(Math.min(9, remaining)) + " نوشتهٔ دیگر";
    }
    var meta = $("#wjfSearchMeta");
    if (meta) {
      meta.textContent = gridState.searching
        ? faNum(cards.filter(function (c) { return !c.hidden; }).length) + " نتیجه"
        : "";
    }
  }

  function homeTools() {
    var grid = $("#postsGrid");
    if (!grid) return;
    var bar = el("div", "wjf-homebar");
    var cats = [];
    $$(".card", grid).forEach(function (card) {
      var cat = card.getAttribute("data-cat");
      if (cat && cats.indexOf(cat) < 0) cats.push(cat);
    });
    bar.innerHTML =
      '<select class="wjf-select" id="wjfSort" aria-label="مرتب‌سازی نوشته‌ها">' +
      '<option value="new">تازه‌ترین</option><option value="old">قدیمی‌ترین</option><option value="az">الفبا</option></select>' +
      '<select class="wjf-select" id="wjfCat" aria-label="فیلتر دسته‌بندی"><option value="">همهٔ دسته‌ها</option>' +
      cats.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + "</option>"; }).join("") + "</select>" +
      '<button type="button" class="wjf-btn" id="wjfView">☰ فهرستی</button>' +
      '<label class="wjf-muted"><input type="checkbox" id="wjfShort" /> زیر ۵ دقیقه</label>' +
      '<label class="wjf-muted"><input type="checkbox" id="wjfCover" /> تصویردار</label>' +
      '<button type="button" class="wjf-btn" id="wjfRandom">🎲 یک نوشتهٔ تصادفی</button>' +
      '<button type="button" class="wjf-btn" id="wjfArchive">📚 آرشیو کامل</button>' +
      '<span class="wjf-count" id="wjfHomeCount"></span>';
    grid.parentNode.insertBefore(bar, grid);

    var more = el("div", "wjf-morewrap");
    more.innerHTML = '<button type="button" class="wjf-btn" id="wjfMoreBtn">نمایش بیشتر</button>';
    grid.parentNode.insertBefore(more, grid.nextSibling);

    on($("#wjfSort"), "change", function (e) {
      gridState.sort = e.target.value;
      var cards = $$(".card", grid);
      cards.sort(function (a, b) {
        var ta = a.querySelector("time[data-date]");
        var tb = b.querySelector("time[data-date]");
        var da = ta ? new Date(ta.getAttribute("data-date")).getTime() : 0;
        var db = tb ? new Date(tb.getAttribute("data-date")).getTime() : 0;
        if (gridState.sort === "az") {
          var na = (a.querySelector(".card-title") || {}).textContent || "";
          var nb = (b.querySelector(".card-title") || {}).textContent || "";
          return na.localeCompare(nb, "fa");
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
