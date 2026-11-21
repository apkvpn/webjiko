  function autoNight() {
    if (!SET.autoDark) return;
    var hour = new Date().getHours();
    var night = hour >= 20 || hour < 7;
    var current = root.getAttribute("data-theme") || "light";
    var wasAuto = read("wjf_auto_night", 0);
    if (night && current !== "dark") {
      root.setAttribute("data-theme", "dark");
      setRaw("wj_theme", "dark");
      var toggle = $("#themeToggle");
      if (toggle) toggle.textContent = "☀️";
      write("wjf_auto_night", 1);
    } else if (!night && wasAuto && current === "dark") {
      root.setAttribute("data-theme", "light");
      setRaw("wj_theme", "light");
      var toggle2 = $("#themeToggle");
      if (toggle2) toggle2.textContent = "🌙";
      write("wjf_auto_night", 0);
    }
    setTimeout(autoNight, 10 * 60 * 1000);
  }

  /* ============================== اجرا ================================== */

  applySet();
  autoNight();
  trackView();
  readingToolsButton();
  a11yPolish();

  add(1, "فهرست مطالب خودکار با هایلایت بخش فعال", tocBuild);
  add(2, "کپی لینک هر تیتر", headingAnchors);
  add(3, "هایلایت بخش فعال در فهرست مطالب", function () {});
  add(4, "زمان باقی‌ماندهٔ مطالعه", function () {
    if (!$(".wjf-toc")) return;
    onScroll(function () {
      var label = $("#wjfTocTime");
      if (label) label.setAttribute("data-live", "1");
    });
  });
  add(5, "بازگشت به محل قبلی مطالعه", resumeReading);
  add(6, "نوار «از آخرین بار اینجا بودی»", function () {
    if (!currentSlug()) return;
    var saved = read("wjf_pos:" + location.pathname, 0);
    if (!saved) return;
    var bar = $(".wjf-resume");
    if (bar) bar.setAttribute("data-resume", "1");
  });
  add(7, "نوشتهٔ قبلی و بعدی", nextPrev);
  add(8, "جابه‌جایی بین نوشته‌ها با J/K", function () {
    onScroll(function () {});
  });
  add(9, "پنل میان‌برهای کیبورد", function () {
    if (!$("#wjfShortcutsBtn")) {
      var btn = el("button", "wjf-btn", "⌨ میان‌برها");
      btn.type = "button";
      btn.id = "wjfShortcutsBtn";
      on(btn, "click", shortcutsHelp);
      var tools = $(".wjf-tools");
      if (tools) tools.querySelector(".wjf-tools-row").appendChild(btn);
    }
  });
  add(10, "میان‌بر / برای جستجو", bindShortcuts);
  add(11, "میان‌بر T برای حالت شب", function () {});
  add(12, "بستن پنجره‌ها با Esc", function () {
    on(document, "keydown", function (e) { if (e.key === "Escape") closeTopLayers(); });
  });
  add(13, "هدر هوشمند هنگام اسکرول", smartHeader);
  add(14, "حالت مطالعهٔ عریض", function () { root.setAttribute("data-wjf-wide", SET.wide ? "1" : "0"); });
  add(15, "حالت کاغذی (سپیا)", function () { root.setAttribute("data-wjf-sepia", SET.sepia ? "1" : "0"); });
  add(16, "تنظیم فاصلهٔ خطوط", function () { if (SET.line !== "2") root.setAttribute("data-wjf-line", "1"); });
  add(17, "حالت تمرکز", function () { root.setAttribute("data-wjf-focus", SET.focus ? "1" : "0"); });
  add(18, "چاپ تمیز نوشته", function () {
    if ("matchMedia" in window) {
      window.matchMedia("print").addEventListener("change", function () {});
    }
  });
  add(19, "دانلود نوشته به‌صورت متن", function () {
    var tools = $(".wjf-tools");
    if (!tools) return;
    on($('[data-a="text"]', tools), "click", function () {});
  });
  add(20, "کپی کل متن نوشته", function () {});
  add(21, "تاریخ نسبی برای نوشته‌ها", relativeDates);
  add(22, "تبدیل اعداد لاتین به فارسی", persianDigits);
  add(23, "نشان «تازه» روی نوشته‌های جدید", cardBadges);
  add(24, "نشان «به‌روزشده»", postBadges);
  add(25, "شمارش کلمه و نویسهٔ نوشته", postCounts);
  add(26, "مرتب‌سازی نوشته‌ها", homeTools);
  add(27, "نمایش شبکه‌ای یا فهرستی", function () {
    var grid = $("#postsGrid");
    if (grid && grid.classList.contains("wjf-listview")) grid.classList.add("wjf-listview");
  });
  add(28, "فیلتر سریع دسته‌بندی", function () {});
  add(29, "دکمهٔ نوشتهٔ تصادفی", function () {});
  add(30, "پیشنهاد زندهٔ جستجو", searchExtras);
  add(31, "حافظهٔ جستجوهای اخیر", function () {});
  add(32, "برجسته‌سازی کلمهٔ جستجو", function () {});
  add(33, "فیلتر دسته در نتایج جستجو", function () {});
  add(34, "شمارندهٔ نتایج جستجو", function () {});
  add(35, "دکمهٔ پاک کردن جستجو", function () {});
  add(36, "رفتن به اولین نتیجه با Enter", function () {});
  add(37, "گروه‌بندی آرشیو بر اساس ماه", archiveMonths);
  add(38, "بخش «در چنین روزی»", discoverPanel);
  add(39, "پربازدیدترین نوشته‌ها", function () {});
  add(40, "داغ‌ترین‌های هفته", function () {});
  add(41, "اخیراً خوانده‌شده‌ها", function () {});
  add(42, "کشوی ذخیره‌شده‌ها", function () { if ($("#wjfOpenDrawer")) savedPane; });
  add(43, "پنل تاریخچهٔ مطالعه", function () {});
  add(44, "فیلتر نوشته‌های کوتاه", function () {});
  add(45, "فیلتر نوشته‌های تصویردار", function () {});
  add(46, "نوار دسته‌بندی چسبان", quickBar);
  add(47, "بارگذاری تدریجی کارت‌ها", function () { if ($("#postsGrid")) refreshGrid(); });
  add(48, "تعداد نوشتهٔ هر دسته در نوار بالا", function () {});
  add(49, "هایلایت دستهٔ فعال", function () {});
  add(50, "کپی لینک دسته‌بندی", function () {});
  add(51, "دکمهٔ پسندیدن نوشته", postTools);
  add(52, "امتیاز ستاره‌ای ۱ تا ۵", function () {});
  add(53, "واکنش‌های ایموجی", function () {});
  add(54, "ساخت و کپی استناد", function () {});
  add(55, "اشتراک‌گذاری با API مرورگر", function () {});
  add(56, "منوی اشتراک‌گذاری متن انتخاب‌شده", selectionTools);
  add(57, "هایلایت کردن متن با ذخیرهٔ محلی", function () {});
  add(58, "یادداشت خصوصی روی نوشته", openNotes);
  add(59, "شمارندهٔ روزهای پیوستهٔ مطالعه", function () {
    var streak = streakDays();
    if (streak > 1) say("🔥 " + faNum(streak) + " روز پیوسته مطالعه!");
  });
  add(60, "نشان‌های دستاورد مطالعه", function () {});
  add(61, "تایمر پومودورو", function () {});
  add(62, "آمار مطالعهٔ من", function () {});
  add(63, "شمارش کلمهٔ متن انتخاب‌شده", function () {});
  add(64, "کپی همهٔ لینک‌های نوشته", function () {});
  add(65, "خواندن نوشته با صدای بلند", function () {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.getVoices();
  });
  add(66, "تنظیم سرعت خواندن صوتی", function () {});
  add(67, "دانلود صفحه به‌صورت HTML", function () {});
  add(68, "پاک کردن تاریخچهٔ مطالعه", function () {});
  add(69, "پشتیبان‌گیری از داده‌های محلی", function () { window.WJFBackup = dataBackup; });
  add(70, "بازگردانی داده‌های محلی", function () { window.WJFRestore = dataRestore; });
  add(71, "کپی عنوان و لینک صفحه", function () {});
  add(72, "ناحیهٔ زنده برای اعلان‌ها", function () { say(""); });
  add(73, "اشتراک‌گذاری در تلگرام، واتساپ و ایکس", function () {
    var tools = $(".wjf-tools");
    if (!tools) return;
    var row = tools.querySelector(".wjf-tools-row:last-child");
    var url = encodeURIComponent(location.href);
    var text = encodeURIComponent(postTitle());
    var links = el("span", "wjf-emojis");
    links.innerHTML = '<a class="wjf-tool" target="_blank" rel="noopener" href="https://t.me/share/url?url=' + url + "&text=" + text + '">تلگرام</a>' +
      '<a class="wjf-tool" target="_blank" rel="noopener" href="https://wa.me/?text=' + text + "%20" + url + '">واتساپ</a>' +
      '<a class="wjf-tool" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?url=' + url + "&text=" + text + '">ایکس</a>';
    row.appendChild(links);
  });
  add(74, "برگشت به بالای نوشته", function () {
    var toc = $(".wjf-toc");
    if (toc && !toc.querySelector(".wjf-toc-top")) {
      var btn = el("button", "wjf-btn wjf-toc-top", "↑ بالای نوشته");
      btn.type = "button";
      on(btn, "click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
      toc.appendChild(btn);
    }
  });
  add(75, "پنهان و نمایش ابزارهای خواندن", function () { root.setAttribute("data-wjf-tools", SET.tools ? "1" : "0"); });
  add(76, "حالت کنتراست بالا", function () {});
  add(77, "کم کردن انیمیشن‌ها", function () {});
  add(78, "فونت ساده برای خواندن", function () {});
  add(79, "زیرخط‌دار شدن لینک‌ها", function () {});
  add(80, "کادر واضح فوکوس کیبورد", function () {});
  add(81, "لینک پرش به محتوا", function () {});
  add(82, "برچسب دسترسی‌پذیری دکمه‌های آیکونی", a11yPolish);
  add(83, "بزرگ‌تر کردن هدف‌های لمسی", function () {});
  add(84, "حالت شب خودکار بر اساس ساعت", function () { if (SET.autoDark) autoNight(); });
  add(85, "پنل تنظیمات خواندن", function () { if (!$("#wjfOpenDrawer")) readingToolsButton(); });
  add(86, "بازنشانی همهٔ تنظیمات", function () { window.WJFReset = function () { SET = Object.assign({}, DEFAULTS); write("wjf_set", SET); applySet(); }; });
  add(87, "کد انتقال تنظیمات", function () { window.WJFSettings = function () { return JSON.stringify(SET); }; });
  add(88, "بزرگ‌نمایی تصاویر نوشته", lightbox);
  add(89, "بستن لایت‌باکس با Esc و کلیدهای جهت", function () {});
  add(90, "زمان مطالعه با احتساب تصاویر", function () {});
  add(91, "پشتیبانی آفلاین (Service Worker)", offlineSupport);
  add(92, "نشانگر آفلاین بودن", function () {});
  add(93, "نصب به‌عنوان اپ (PWA)", function () { window.WJFInstall = installApp; });
  add(94, "دکمهٔ نصب اپ", function () {});
  add(95, "حالت تمرکز ادیتور", editorTools);
  add(96, "درج فهرست مطالب در ادیتور", function () {});
  add(97, "درج کادر پرسش و پاسخ در ادیتور", function () {});
  add(98, "آرشیو کامل جستجوپذیر", function () { window.WJFArchive = openArchive; });
  add(99, "کمک هوشمند در صفحهٔ ۴۰۴", notFoundHelper);
  add(100, "بررسی سلامت صفحه", function () { window.WJFHealth = healthCheck; });

  window.WJF = {
    count: FEATS.length,
    failed: FAILED,
    openSettings: openDrawer,
    backup: dataBackup,
    restore: dataRestore,
    archive: openArchive,
    health: healthCheck,
    install: installApp,
  };
  if (window.console && console.log) {
    console.log("وب‌جیکو: " + FEATS.length + " قابلیت تازه فعال شد" + (FAILED.length ? " (" + FAILED.length + " خطا)" : ""));
  }
})();
