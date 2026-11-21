    ["sepia", "حالت کاغذی (سپیا)"],
    ["focus", "حالت تمرکز"],
    ["simple", "فونت ساده‌تر"],
    ["links", "همیشه زیرخط‌دار بودن لینک‌ها"],
    ["contrast", "کنتراست بالا"],
    ["motion", "کم کردن انیمیشن‌ها"],
    ["tap", "بزرگ‌تر کردن دکمه‌ها"],
    ["autoDark", "حالت شب خودکار (۲۰ تا ۷)"],
    ["tools", "نمایش ابزارهای خواندن"],
  ];

  function settingsPane(pane) {
    var rows = TOGGLES.map(function (t) {
      var checked = t[0] === "tools" ? !!SET.tools : !!SET[t[0]];
      return '<div class="wjf-row"><label for="wjfS_' + t[0] + '">' + esc(t[1]) + "</label>" +
        '<input type="checkbox" id="wjfS_' + t[0] + '" data-set="' + t[0] + '"' + (checked ? " checked" : "") + " /></div>";
    }).join("");
    pane.innerHTML = "<h4>خواندن</h4>" + rows +
      '<div class="wjf-row"><label for="wjfLine">فاصلهٔ خطوط</label>' +
      '<select class="wjf-select" id="wjfLine">' +
      [["1.8", "فشرده"], ["2", "معمولی"], ["2.2", "باز"], ["2.4", "خیلی باز"]].map(function (o) {
        return '<option value="' + o[0] + '"' + (String(SET.line) === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
      }).join("") + "</select></div>" +
      "<h4>داده‌ها</h4><div class=\"wjf-actions\">" +
      '<button type="button" class="wjf-btn" data-s="backup">⬇ پشتیبان‌گیری</button>' +
      '<button type="button" class="wjf-btn" data-s="restore">⬆ بازگردانی</button>' +
      '<button type="button" class="wjf-btn" data-s="code">کد تنظیمات</button>' +
      '<button type="button" class="wjf-btn" data-s="reset">بازنشانی تنظیمات</button>' +
      "</div>" +
      "<h4>اپ و آفلاین</h4><div class=\"wjf-actions\">" +
      '<button type="button" class="wjf-btn" data-s="install">📲 نصب به‌عنوان اپ</button>' +
      '<button type="button" class="wjf-btn" data-s="health2">🩺 بررسی سلامت</button>' +
      "</div>" +
      '<p class="wjf-muted">همه‌چیز فقط در همین مرورگر ذخیره می‌شود؛ هیچ داده‌ای جایی فرستاده نمی‌شود.</p>';

    on(pane, "change", function (e) {
      var box = e.target;
      if (box.id === "wjfLine") { SET.line = box.value; saveSet(); return; }
      var key = box.getAttribute("data-set");
      if (!key) return;
      SET[key] = box.checked ? 1 : 0;
      saveSet();
      if (key === "autoDark" && box.checked) autoNight();
      say(box.checked ? "روشن شد" : "خاموش شد");
    });
    on(pane, "click", function (e) {
      var btn = e.target.closest("button[data-s]");
      if (!btn) return;
      var act = btn.getAttribute("data-s");
      if (act === "backup") dataBackup();
      else if (act === "restore") dataRestore();
      else if (act === "install") installApp();
      else if (act === "health2") healthCheck();
      else if (act === "reset") {
        if (!window.confirm("همهٔ تنظیمات خواندن به حالت اولیه برگردد؟")) return;
        SET = Object.assign({}, DEFAULTS);
        write("wjf_set", SET);
        applySet();
        openDrawer("set");
        say("تنظیمات بازنشانی شد");
      } else if (act === "code") {
        copyText(JSON.stringify(SET));
        var code = window.prompt("کد تنظیمات را برای انتقال بچسبان (خالی = فقط کپی شد):", "");
        if (code) {
          try {
            var parsed = JSON.parse(code);
            SET = Object.assign({}, DEFAULTS, parsed);
            saveSet();
            openDrawer("set");
            say("تنظیمات اعمال شد");
          } catch (err) { say("کد تنظیمات درست نبود."); }
        }
      }
    });
  }

  function savedPane(pane) {
    var list = read("wj_saved", []);
    pane.innerHTML = "<h4>ذخیره‌شده‌ها</h4>" + (list.length
      ? '<ul class="wjf-list">' + list.map(function (item, i) {
        return '<li><a href="' + esc(item.u) + '">' + esc(item.t || item.u) + "<small>" + esc(item.d ? new Date(item.d).toLocaleDateString("fa-IR") : "") + "</small></a>" +
          '<button type="button" class="wjf-x" data-del="' + i + '" aria-label="حذف">✕</button></li>';
      }).join("") + "</ul>"
      : '<p class="wjf-muted">هنوز چیزی ذخیره نکرده‌ای. در پایین هر نوشته دکمهٔ «ذخیره برای بعد» را بزن.</p>');
    pane.onclick = function (e) {
      var btn = e.target.closest("button[data-del]");
      if (!btn) return;
      var index = Number(btn.getAttribute("data-del"));
      var items = read("wj_saved", []);
      items.splice(index, 1);
      write("wj_saved", items);
      savedPane(pane);
      say("از ذخیره‌ها حذف شد");
    };
  }

  function historyPane(pane) {
    var list = read("wjf_views", []).sort(function (a, b) { return (b.last || 0) - (a.last || 0); });
    pane.innerHTML = "<h4>تاریخچهٔ مطالعه</h4>" + (list.length
      ? '<div class="wjf-actions"><button type="button" class="wjf-btn" data-h="clear">پاک کردن تاریخچه</button></div>' +
        '<ul class="wjf-list">' + list.map(function (v) {
          return '<li><a href="' + esc(v.u) + '">' + esc(v.t) + "<small>" + esc(v.c || "") + " · " + faNum(v.n || 0) + " بار" +
            (v.d ? " · " + esc(new Date(v.d).toLocaleDateString("fa-IR")) : "") + "</small></a></li>";
        }).join("") + "</ul>"
      : '<p class="wjf-muted">هنوز نوشته‌ای نخوانده‌ای.</p>');
    pane.onclick = function (e) {
      var btn = e.target.closest("button[data-h='clear']");
      if (!btn) return;
      if (!window.confirm("تاریخچهٔ مطالعه پاک شود؟")) return;
      write("wjf_views", []);
      historyPane(pane);
      say("تاریخچه پاک شد");
    };
  }

  var drawer = null;

  function openDrawer(tab) {
    if (drawer && drawer.parentNode) drawer.parentNode.removeChild(drawer);
    var scrim = $(".wjf-scrim");
    if (scrim) scrim.remove();
    drawer = el("section", "wjf-drawer");
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", "تنظیمات و ابزارهای وب‌جیکو");
    drawer.innerHTML =
      '<div class="wjf-drawer-head"><strong>⚙️ ابزارهای وب‌جیکو</strong><button type="button" class="wjf-x" aria-label="بستن">✕</button></div>' +
      '<div class="wjf-tabs">' +
      '<button type="button" class="wjf-tab" data-tab="set">تنظیمات</button>' +
      '<button type="button" class="wjf-tab" data-tab="saved">ذخیره‌ها</button>' +
      '<button type="button" class="wjf-tab" data-tab="hist">تاریخچه</button>' +
      '<button type="button" class="wjf-tab" data-tab="stats">آمار و نشان‌ها</button>' +
      "</div>" +
      '<div class="wjf-drawer-body">' +
      '<div class="wjf-pane" data-pane="set"></div>' +
      '<div class="wjf-pane" data-pane="saved"></div>' +
      '<div class="wjf-pane" data-pane="hist"></div>' +
      '<div class="wjf-pane" data-pane="stats"></div>' +
      "</div>";
    var layer = el("div", "wjf-scrim");
    on(layer, "click", function () { drawer.remove(); layer.remove(); });
    document.body.appendChild(layer);
    document.body.appendChild(drawer);

    var panes = {
      set: $("[data-pane='set']", drawer),
      saved: $("[data-pane='saved']", drawer),
      hist: $("[data-pane='hist']", drawer),
      stats: $("[data-pane='stats']", drawer),
    };
    settingsPane(panes.set);
    savedPane(panes.saved);
    historyPane(panes.hist);
    statsPane(panes.stats);

    function show(name) {
      $$(".wjf-tab", drawer).forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-tab") === name); });
      Object.keys(panes).forEach(function (k) { panes[k].classList.toggle("is-on", k === name); });
    }
    on(drawer, "click", function (e) {
      var tab = e.target.closest(".wjf-tab");
      if (tab) show(tab.getAttribute("data-tab"));
      if (e.target.closest(".wjf-x")) { drawer.remove(); layer.remove(); }
    });
    show(tab || "set");
    var settingsButton = $("#wjfOpenDrawer");
    if (settingsButton) settingsButton.setAttribute("aria-expanded", "true");
    on(document, "keydown", function escClose(e) {
      if (e.key === "Escape") { drawer.remove(); layer.remove(); document.removeEventListener("keydown", escClose); }
    });
  }

  function readingToolsButton() {
    var tools = $(".read-tools");
    if (!tools) {
      tools = el("div", "read-tools");
      document.body.appendChild(tools);
    }
    if ($("#wjfOpenDrawer")) return;
    var btn = el("button", "", "⚙");
    btn.type = "button";
    btn.id = "wjfOpenDrawer";
    btn.title = "تنظیمات و ابزارهای خواندن";
    btn.setAttribute("aria-label", "تنظیمات و ابزارهای خواندن");
    btn.setAttribute("aria-expanded", "false");
    on(btn, "click", function () { openDrawer("set"); });
    tools.insertBefore(btn, tools.firstChild);
  }

  function a11yPolish() {
    var header = $(".topbar");
    var main = $("main");
    if (main && !main.id) main.id = "main";
    if (main && !main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    if (header && !$(".wjf-skip")) {
      var skip = el("a", "wjf-skip", "پرش به محتوای اصلی");
      skip.href = "#main";
      header.parentNode.insertBefore(skip, header);
    }
    $$("button.icon-toggle, .to-top, .dock-pill, .copy-code, .cover-actions button").forEach(function (b) {
      if (!b.getAttribute("aria-label")) {
        var label = b.getAttribute("title") || b.textContent.trim() || "دکمه";
        b.setAttribute("aria-label", label);
      }
    });
    $$(".share-row a.share-btn").forEach(function (a) {
      if (!a.getAttribute("aria-label")) a.setAttribute("aria-label", "اشتراک‌گذاری در " + a.textContent.trim());
    });
  }

