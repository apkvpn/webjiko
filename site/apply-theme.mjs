/**
 * وب‌جیکو — هوک چینش جمع‌وجور.
 *
 * این اسکریپت پیش از build.mjs اجرا می‌شود و دو فایل سایت را به نسخه‌ی
 * جمع‌وجور به‌روز می‌کند: حذف سربرگ بزرگ صفحه‌ی نخست، گذاشتن دکمه‌ی
 * «کانتنت» در هدر (به‌جای فوتر) و اضافه‌کردن لایه‌ی theme.css.
 *
 * تکرارشدنی است: اگر تغییری از قبل اعمال شده باشد، دوباره کاری نمی‌کند؛
 * و اگر متن مورد انتظار پیدا نشود، با خطا متوقف می‌شود تا خرابی بی‌صدا نماند.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.argv[2] || dirname(fileURLToPath(import.meta.url));

const edits = {
  "build.mjs": [
    [
      `      <nav class="topnav" aria-label="دسته‌بندی‌ها">\${chips}</nav>
      <div class="search">
        <input id="searchInput" type="search" placeholder="جستجو در نوشته‌ها…" aria-label="جستجو" />
        <span class="search-ico">🔍</span>
      </div>
    </div>`,
      `      <nav class="topnav" aria-label="دسته‌بندی‌ها">\${chips}</nav>
      <div class="top-actions">
        <div class="search">
          <input id="searchInput" type="search" placeholder="جستجو…" aria-label="جستجو" />
          <span class="search-ico">🔍</span>
        </div>
        \${dock()}
      </div>
    </div>`,
    ],
    [
      `        <span class="dock-dot"></span> پنل مدیر
      </button>
      <section class="dock-panel" id="dockPanel" hidden aria-label="پنل مدیر">
        <div class="dock-head">
          <strong>✏️ ادیتور وب‌جیکو</strong>`,
      `        <span class="dock-dot"></span> کانتنت
      </button>
      <section class="dock-panel" id="dockPanel" hidden aria-label="کانتنت">
        <div class="dock-head">
          <strong>✏️ کانتنت وب‌جیکو</strong>`,
    ],
    [
      `  return \`
  <section class="hero">
    <div class="hero-inner">
      <p class="hero-eyebrow">✨ تازه‌ترین نوشته‌ها</p>
      <h1>\${esc(SITE_NAME)}<span class="hero-dot">.</span></h1>
      <p class="hero-sub">\${esc(SITE_TAGLINE)}</p>
      <p class="hero-text">داستان، علم، فضا، حیوانات و بازی — همه در یک جا، ساده و خوش‌رنگ. \${posts.length} نوشته آماده‌ی خواندن است.</p>
    </div>
    <div class="hero-blob hero-blob-1"></div>
    <div class="hero-blob hero-blob-2"></div>
    <div class="hero-blob hero-blob-3"></div>
  </section>

  <section class="section" aria-labelledby="latest">`,
      `  return \`
  <h1 class="sr-only">\${esc(SITE_NAME)} — \${esc(SITE_TAGLINE)}</h1>

  <section class="section section-first" aria-labelledby="latest">`,
    ],
    [
      `    : \`<p class="empty">هنوز پستی منتشر نشده. از پنل مدیر پایین صفحه اولین نوشته را بساز ✨</p>\`;`,
      `    : \`<p class="empty">هنوز پستی منتشر نشده. از دکمه‌ی «کانتنت» بالای صفحه اولین نوشته را بساز ✨</p>\`;`,
    ],
    [`function footer(withDock) {`, `function footer() {`],
    [
      `      </div>
    </div>
    \${withDock ? dock() : ""}
  </footer>\`;`,
      `      </div>
    </div>
  </footer>\`;`,
    ],
    [`activeCat, withDock, postsData }) {`, `activeCat, postsData }) {`],
    [`\${footer(!!withDock)}`, `\${footer()}`],
    [`    activeCat: "",\n    withDock: true,\n    postsData:`, `    activeCat: "",\n    postsData:`],
    [
      `<link rel="stylesheet" href="\${BASE}styles.css" />\n<script type="application/ld+json">`,
      `<link rel="stylesheet" href="\${BASE}styles.css" />\n<link rel="stylesheet" href="\${BASE}theme.css" />\n<script type="application/ld+json">`,
    ],
  ],
  "public/app.js": [
    [
      `    toggle.innerHTML = '<span class="dock-dot"></span> ادیتور';
    renderAdminList(postsCache);`,
      `    toggle.innerHTML = '<span class="dock-dot"></span> کانتنت';
    renderAdminList(postsCache);
    /* در صفحه‌های داخلی، لیست پست‌ها را تازه از گیت‌هاب می‌گیریم */
    if (!postsCache.length && token()) {
      ghRead().then(function (data) {
        postsCache = data.posts || [];
        renderAdminList(postsCache);
        refreshHome();
      }).catch(function () {});
    }`,
    ],
    [
      `    toggle.innerHTML = '<span class="dock-dot"></span> پنل مدیر';`,
      `    toggle.innerHTML = '<span class="dock-dot"></span> کانتنت';`,
    ],
    [
      `      toggle.innerHTML = '<span class="dock-dot"></span> ادیتور';`,
      `      toggle.innerHTML = '<span class="dock-dot"></span> کانتنت';`,
    ],
    [
      `        : '<p class="empty">هنوز پستی منتشر نشده. از پنل مدیر پایین صفحه اولین نوشته را بساز ✨</p>';`,
      `        : '<p class="empty">هنوز پستی منتشر نشده. از دکمه‌ی «کانتنت» بالای صفحه اولین نوشته را بساز ✨</p>';`,
    ],
    [
      `    return '<article class="card" data-cat="'`,
      `    return '<article class="card card-' + t.color + '" data-cat="'`,
    ],
  ],
};

let changed = 0;
for (const [rel, pairs] of Object.entries(edits)) {
  const file = join(ROOT, rel);
  let src = readFileSync(file, "utf8");
  const before = src;
  for (const [from, to] of pairs) {
    if (src.includes(from)) {
      src = src.split(from).join(to);
    } else if (!src.includes(to)) {
      console.error(`apply-theme: در ${rel} متن مورد انتظار پیدا نشد:\n${from.slice(0, 120)}…`);
      process.exit(1);
    }
  }
  if (src !== before) {
    writeFileSync(file, src, "utf8");
    changed += 1;
    console.log(`apply-theme: ${rel} به‌روز شد`);
  }
}
console.log(`apply-theme: ${changed} فایل تغییر کرد`);
