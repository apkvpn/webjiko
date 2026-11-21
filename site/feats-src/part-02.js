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
      var up = el("span", "wjf-upd", "به‌روزشده");
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
