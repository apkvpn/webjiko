        block("پربازدیدترین‌ها", "🔥", viewed) +
        block("داغ این هفته", "📈", week) +
        block("اخیراً خوانده‌شده", "🕘", recentList);
      if (!html) {
        html = '<div class="wjf-disc-card"><h3>🎲 شروع کن</h3><p class="wjf-muted">با یک نوشتهٔ تصادفی شروع کن تا این بخش پر شود.</p>' +
          '<button type="button" class="wjf-btn" id="wjfDiscRandom">یک نوشتهٔ تصادفی</button></div>';
      }
      grid.innerHTML = html;
      var rnd = $("#wjfDiscRandom");
      if (rnd) on(rnd, "click", function () {
        if (!posts.length) return;
        location.href = posts[Math.floor(Math.random() * posts.length)].url;
      });
      void todayLabel;
    });
  }

  /* ================== ۴۷–۵۰ نوار دسته‌بندی و بارگذاری ==================== */

  function quickBar() {
    var chips = $(".footer-chips");
    var header = $(".topbar");
    if (!chips || !header) return;
    var bar = el("nav", "wjf-quickbar");
    bar.setAttribute("aria-label", "دسته‌بندی‌های سریع");
    var path = location.pathname;
    var isHome = /\/(webjiko)?\/?$/.test(path) || /\/index\.html$/.test(path);
    var html = '<a href="' + BASE + '"' + (isHome ? ' class="is-active"' : "") + ">همه</a>";
    $$(".chip", chips).forEach(function (chip) {
      var href = chip.getAttribute("href") || "";
      var label = chip.textContent.trim();
      var count = chip.querySelector("b");
      html += '<a href="' + esc(href) + '"' + (path.indexOf(href.replace(/^https?:\/\/[^/]+/, "")) === 0 ? ' class="is-active"' : "") + ">" +
        esc(label) + (count ? " <b>" + esc(count.textContent) + "</b>" : "") + "</a>";
    });
    if (/\/category\//.test(path)) {
      html += '<button type="button" class="wjf-btn" id="wjfCopyCat">کپی لینک این دسته</button>';
    }
    bar.innerHTML = html;
    header.parentNode.insertBefore(bar, header.nextSibling);
    var copyCat = $("#wjfCopyCat");
    if (copyCat) on(copyCat, "click", function () { copyText(location.href); });
  }

  /* ======================= ۵۱–۵۸ تعامل با پست ========================== */

  var REACTIONS = ["❤️", "😂", "🤯", "👍"];

  function reactionsStore() {
    var all = read("wjf_react", {});
    if (!all[location.pathname]) all[location.pathname] = { like: 0, star: 0, emo: {} };
    return all;
  }
  function saveReactions(all) { write("wjf_react", all); }
  function currentReaction() { return reactionsStore()[location.pathname]; }

  function postTools() {
    if (!currentSlug()) return;
    var meta = $(".post-meta");
    if (!meta || $(".wjf-tools")) return;
    var me = currentReaction();
    var rate = read("wjf_rate", 1);
    var tools = el("div", "wjf-tools");
    tools.innerHTML =
      '<div class="wjf-tools-row">' +
      '<button type="button" class="wjf-tool' + (me.like ? " is-on" : "") + '" data-a="like">❤️ پسندیدن <b data-like>' + faNum(me.like || 1) + "</b></button>" +
      '<span class="wjf-stars" role="group" aria-label="امتیاز به این نوشته">' +
      [1, 2, 3, 4, 5].map(function (i) {
        return '<button type="button" data-star="' + i + '" aria-label="' + i + ' ستاره" class="' + (me.star >= i ? "is-on" : "") + '">★</button>';
      }).join("") + "</span>" +
      '<span class="wjf-emojis">' + REACTIONS.map(function (emo) {
        return '<button type="button" class="wjf-tool" data-emo="' + emo + '">' + emo + " <b>" + faNum((me.emo || {})[emo] || 0) + "</b></button>";
      }).join("") + "</span>" +
      "</div>" +
      '<div class="wjf-tools-row">' +
      '<button type="button" class="wjf-tool" data-a="cite">❝ استناد</button>' +
      '<button type="button" class="wjf-tool" data-a="share">📤 اشتراک‌گذاری</button>' +
      '<button type="button" class="wjf-tool" data-a="ttsPlay">🔊 بخوان</button>' +
      '<button type="button" class="wjf-tool" data-a="ttsPause">⏸ توقف</button>' +
      '<button type="button" class="wjf-tool" data-a="ttsStop">⏹ پایان</button>' +
      '<select class="wjf-select" id="wjfRate" aria-label="سرعت خواندن صوتی">' +
      [0.8, 1, 1.2, 1.5].map(function (r) { return '<option value="' + r + '"' + (String(rate) === String(r) ? " selected" : "") + ">سرعت " + faNum(r) + "</option>"; }).join("") + "</select>" +
      "</div>" +
      '<div class="wjf-tools-row">' +
      '<button type="button" class="wjf-tool" data-a="notes">📝 یادداشت من</button>' +
      '<button type="button" class="wjf-tool" data-a="print">🖨 چاپ</button>' +
      '<button type="button" class="wjf-tool" data-a="text">⬇ متن</button>' +
      '<button type="button" class="wjf-tool" data-a="html">⬇ HTML</button>' +
      '<button type="button" class="wjf-tool" data-a="copytext">📋 کپی متن</button>' +
      '<button type="button" class="wjf-tool" data-a="copylinks">🔗 کپی لینک‌ها</button>' +
      '<button type="button" class="wjf-tool" data-a="title">📎 عنوان و لینک</button>' +
      "</div>";
    meta.parentNode.insertBefore(tools, meta.nextSibling);

    on(tools, "click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var all = reactionsStore();
      var rec = all[location.pathname];
      var star = btn.getAttribute("data-star");
      var emo = btn.getAttribute("data-emo");
      if (star) {
        rec.star = Number(star);
        saveReactions(all);
        $$(".wjf-stars button", tools).forEach(function (b) {
          b.classList.toggle("is-on", Number(b.getAttribute("data-star")) <= rec.star);
        });
        say("امتیاز " + faNum(star) + " ستاره ثبت شد");
        return;
      }
      if (emo) {
        rec.emo = rec.emo || {};
        rec.emo[emo] = (rec.emo[emo] || 0) + 1;
        saveReactions(all);
        var b = btn.querySelector("b");
        if (b) b.textContent = faNum(rec.emo[emo]);
        say("واکنش ثبت شد " + emo);
        return;
      }
      var act = btn.getAttribute("data-a");
      if (act === "like") {
        rec.like = (rec.like || 0) + 1;
        saveReactions(all);
        btn.classList.add("is-on");
        var like = btn.querySelector("[data-like]");
        if (like) like.textContent = faNum(rec.like);
        say("پسندیدی ❤️");
      } else if (act === "cite") {
        var cite = "«" + postTitle() + "» — وب‌جیکو، " + (($(".post-meta time") || {}).textContent || "") + ". " + location.href;
        copyText(cite.trim());
      } else if (act === "share") {
        if (navigator.share) {
          navigator.share({ title: postTitle(), url: location.href }).catch(function () {});
        } else {
          copyText(location.href);
        }
      } else if (act === "notes") {
        openNotes();
      } else if (act === "print") {
        window.print();
      } else if (act === "text") {
        var content = $(".post-content");
        var text = postTitle() + "\n\n" + (content ? content.innerText : "") + "\n\n" + location.href;
        download((currentSlug() || "post") + ".txt", text);
      } else if (act === "html") {
        download((currentSlug() || "page") + ".html", "<!doctype html>\n" + document.documentElement.outerHTML, "text/html;charset=utf-8");
      } else if (act === "copytext") {
        var c2 = $(".post-content");
        copyText(postTitle() + "\n\n" + (c2 ? c2.innerText : ""));
      } else if (act === "copylinks") {
        var links = $$(".post-content a[href]").map(function (a) { return a.href; });
        copyText(links.join("\n"));
      } else if (act === "title") {
        copyText(postTitle() + " — " + location.href);
      } else if (act === "ttsPlay") {
        speakStart();
      } else if (act === "ttsPause") {
        if (!window.speechSynthesis) { say("مرورگرت خواندن صوتی ندارد."); return; }
        if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); say("ادامه دادم"); }
        else { window.speechSynthesis.pause(); say("متوقف شد"); }
      } else if (act === "ttsStop") {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        say("خواندن صوتی تمام شد");
      }
    });
    on($("#wjfRate"), "change", function (e) { write("wjf_rate", Number(e.target.value)); });
    if (read("wjf_notes", {})[location.pathname]) {
      var notesBtn = $('[data-a="notes"]', tools);
      if (notesBtn) notesBtn.classList.add("is-on");
    }
  }

  var ttsTimer = null;
  function speakStart() {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { say("مرورگرت خواندن صوتی را پشتیبانی نمی‌کند."); return; }
    var content = $(".post-content");
    if (!content) return;
    window.speechSynthesis.cancel();
    var text = postTitle() + ". " + content.innerText.replace(/\s+/g, " ");
    if (text.length > 60000) text = text.slice(0, 60000);
    var utter = new SpeechSynthesisUtterance(text);
    utter.lang = "fa-IR";
    utter.rate = Number(read("wjf_rate", 1)) || 1;
    var voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    for (var i = 0; i < voices.length; i += 1) {
      if ((voices[i].lang || "").toLowerCase().indexOf("fa") === 0) { utter.voice = voices[i]; break; }
    }
    utter.onend = function () { clearTimeout(ttsTimer); say("خواندن تمام شد"); };
    utter.onerror = function () { say("خواندن صوتی ممکن نشد."); };
    window.speechSynthesis.speak(utter);
    say("در حال خواندن… (اگر صدای فارسی نصب نباشد، مرورگر صدای پیش‌فرض را می‌خواند)");
  }

  function openNotes() {
    var notes = read("wjf_notes", {});
    var text = notes[location.pathname] || "";
    openDialog("یادداشت خصوصی این نوشته", '<textarea class="wjf-input" id="wjfNoteBox" rows="8" style="width:100%" placeholder="فقط روی همین مرورگر ذخیره می‌شود…">' + esc(text) + "</textarea>" +
      '<div class="wjf-actions"><button type="button" class="wjf-btn" id="wjfNoteSave">ذخیره</button>' +
      '<button type="button" class="wjf-btn" id="wjfNoteDel">حذف</button></div>' +
      '<p class="wjf-muted">یادداشت‌ها خصوصی‌اند و هیچ‌جا ارسال نمی‌شوند.</p>', function (box, close) {
      on($("#wjfNoteSave", box), "click", function () {
        var all = read("wjf_notes", {});
        all[location.pathname] = $("#wjfNoteBox", box).value;
        write("wjf_notes", all);
        var btn = $('[data-a="notes"]');
        if (btn) btn.classList.toggle("is-on", !!all[location.pathname]);
        say("یادداشت ذخیره شد");
        close();
      });
      on($("#wjfNoteDel", box), "click", function () {
