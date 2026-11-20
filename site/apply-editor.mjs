/**
 * وب‌جیکو — لینک دستی در ادیتور + جمع‌کردن (مینیمایز) پنل کانتنت.
 * بعد از apply-slug.mjs اجرا می‌شود. تکرارشدنی است.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.argv[2] || dirname(fileURLToPath(import.meta.url));

const MIN = `            <button class="icon-btn" id="dockMin" type="button" title="کوچک کردن" aria-label="کوچک کردن">✕</button>`;

const COLLAPSE_JS = `  var collapseBtn = $("#dockCollapse");
  function setMin(on) {
    panel.classList.toggle("is-min", !!on);
    if (!collapseBtn) return;
    collapseBtn.textContent = on ? "+" : "−";
    collapseBtn.title = on ? "باز کردن پنل" : "جمع کردن پنل";
    collapseBtn.setAttribute("aria-label", collapseBtn.title);
  }
  if (collapseBtn) collapseBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    setMin(!panel.classList.contains("is-min"));
  });
  var dockHead = panel.querySelector(".dock-head");
  if (dockHead) dockHead.addEventListener("click", function (e) {
    if (e.target.closest("button")) return;
    if (panel.classList.contains("is-min")) setMin(false);
  });
`;

const TIP_JS = `  function updateSlugTip() {
    if (!slugTip) return;
    var manual = String((slugIn && slugIn.value) || "").trim();
    var auto = titleIn ? String(titleIn.value || "").trim() : "";
    slugTip.textContent = manual
      ? "/post/" + slugify(manual) + "/"
      : auto ? "پیشنهاد خودکار: /post/" + slugify(auto) + "/" : "لینک خودکار از عنوان ساخته می‌شود";
  }
  if (titleIn) titleIn.addEventListener("input", updateSlugTip);
  if (slugIn) slugIn.addEventListener("input", updateSlugTip);
`;

const edits = {
  "build.mjs": [
    [
      MIN,
      `            <button class="icon-btn" id="dockCollapse" type="button" title="جمع کردن پنل" aria-label="جمع کردن پنل">−</button>
            <button class="icon-btn" id="dockMin" type="button" title="بستن پنل" aria-label="بستن پنل">✕</button>`,
    ],
  ],
  "public/app.js": [
    [`  function postHref(slug) { return BASE + "post/" + enc(slug) + "/"; }`, `  function postHref(slug) { return BASE + "post/" + enc(slugify(slug)) + "/"; }`],
    [
      `  function openPanel() {
    panel.hidden = false;`,
      `  function openPanel() {
    panel.hidden = false;
    if (panel.classList.contains("is-min")) setMin(false);`,
    ],
    [`  minBtn.addEventListener("click", closePanel);`, `${COLLAPSE_JS}minBtn.addEventListener("click", closePanel);`],
    [
      `  var excerptIn = $("#postExcerpt");`,
      `  var excerptIn = $("#postExcerpt");
  var slugIn = $("#postSlug");
  var slugTip = $("#postSlugTip");`,
    ],
    [`  resetBtn.addEventListener("click", function () {`, `${TIP_JS}  resetBtn.addEventListener("click", function () {`],
    [
      `    coverIn.value = "";
    excerptIn.value = "";
    area.innerHTML = "";`,
      `    coverIn.value = "";
    excerptIn.value = "";
    if (slugIn) slugIn.value = "";
    area.innerHTML = "";
    updateSlugTip();`,
    ],
    [
      `      excerptIn.value = post.excerpt || "";`,
      `      excerptIn.value = post.excerpt || "";
      if (slugIn) slugIn.value = post.slug || "";
      updateSlugTip();`,
    ],
    [
      `        var base = slugify(payload.title);`,
      `        var manualSlug = String((slugIn && slugIn.value) || "").trim();
        var base = slugify(manualSlug || payload.title);`,
    ],
    [
      `        existing.content = payload.content;
        existing.updated_at = now;`,
      `        existing.content = payload.content;
        var wanted = slugify(String((slugIn && slugIn.value) || "").trim() || existing.slug || existing.title);
        if (wanted !== existing.slug) {
          var used = {}, k = 1;
          list.forEach(function (p) { if (Number(p.id) !== Number(existing.id)) used[p.slug] = 1; });
          var next = wanted;
          while (used[next]) { k += 1; next = wanted + "-" + k; }
          existing.slug = next;
        }
        existing.updated_at = now;`,
    ],
  ],
};

let changed = 0;
for (const [rel, pairs] of Object.entries(edits)) {
  const file = join(ROOT, rel);
  const before = readFileSync(file, "utf8");
  let src = before;
  for (const [from, to] of pairs) {
    if (src.includes(to)) continue;
    if (!src.includes(from)) {
      console.error(`apply-editor: در ${rel} متن مورد انتظار پیدا نشد:\n${from.slice(0, 120)}…`);
      process.exit(1);
    }
    src = src.split(from).join(to);
  }
  if (src !== before) {
    writeFileSync(file, src, "utf8");
    changed += 1;
    console.log(`apply-editor: ${rel} به‌روز شد`);
  }
}
console.log(`apply-editor: ${changed} فایل تغییر کرد`);
