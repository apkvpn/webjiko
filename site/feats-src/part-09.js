/*
 * وب‌جیکو — پایان نوشته
 * ۱) نوار ابزار (پسندیدن، ستاره، اشتراک…) و «فهرست مطالب» را از بالای پست
 *    برمی‌دارد و به انتهای همان نوشته می‌برد.
 * ۲) یک دکمهٔ آبی کوچک «دانلود» بعد از پاراگراف دوم می‌گذارد که به لینک دانلود
 *    داخل متن پست وصل می‌شود (هر پستی لینک خودش را دارد و با ویرایش پست عوض می‌شود).
 */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var DOWN_TEXT = /دانلود|دریافت|نصب|download|apk|install/i;
  var DOWN_HREF = /\.apk|\.ipa|download|dl\.|drive\.google|play\.google|apps\.apple|github\.com\/.*\/releases/i;

  function findDownloadLink(content) {
    var links = $$("a[href]", content);
    for (var i = 0; i < links.length; i += 1) {
      var a = links[i];
      var href = (a.getAttribute("href") || "").trim();
      if (!href || href.charAt(0) === "#" || /^javascript:/i.test(href)) continue;
      var text = (a.textContent || "").trim();
      if (DOWN_HREF.test(href) || DOWN_TEXT.test(text) || DOWN_TEXT.test(a.getAttribute("title") || "")) {
        return a;
      }
    }
    return null;
  }

  function moveToolsToEnd(post, content) {
    var toc = $(".wjf-toc");
    var tools = $(".wjf-tools");
    var box = $(".wjf-endbox");

    if (toc || tools) {
      if (!box) {
        box = document.createElement("div");
        box.className = "wjf-endbox";

        var label = document.createElement("p");
        label.className = "wjf-endbox-title";
        label.textContent = "ابزارها و فهرست این نوشته";
        box.appendChild(label);
      }

      if (toc) { toc.classList.add("wjf-in-end"); box.appendChild(toc); }
      if (tools) { tools.classList.add("wjf-in-end"); box.appendChild(tools); }

      if (!box.parentNode) {
        var foot = $(".post-foot", post);
        if (foot && foot.parentNode) foot.parentNode.insertBefore(box, foot);
        else content.parentNode.insertBefore(box, content.nextSibling);
      }
    }
  }

  function addDownloadButton(content) {
    if ($(".post .wjf-dl")) return;
    var link = findDownloadLink(content);
    if (!link) return;

    var dl = document.createElement("a");
    dl.className = "wjf-dl";
    dl.href = link.getAttribute("href");
    dl.setAttribute("download", "");
    if (/^https?:/i.test(dl.getAttribute("href"))) {
      dl.target = "_blank";
      dl.rel = "noopener";
    }
    dl.innerHTML = '<span class="wjf-dl-ico" aria-hidden="true">⬇</span><span>دانلود</span>';

    /* جای دکمه: بلافاصله بعد از پاراگراف دوم نوشته */
    var paras = $$(".post-content > p", content);
    var anchor = paras[1] || paras[0] || null;
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(dl, anchor.nextSibling);
    else content.insertBefore(dl, content.firstChild);
  }

  function start() {
    try {
      var post = $(".post");
      var content = post && $(".post-content", post);
      if (!post || !content) return;
      moveToolsToEnd(post, content);
      addDownloadButton(content);
    } catch (e) {
      if (window.console && console.warn) console.warn("WJF endbox", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
  /* اگر ابزارها کمی دیرتر ساخته شدند، یک بار دیگر هم تلاش می‌کنیم */
  window.addEventListener("load", start, { once: true });
})();
