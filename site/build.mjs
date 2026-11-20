/**
 * وب‌جیکو — static builder for GitHub Pages.
 * Reads content/posts.json and writes a fully indexable static site into dist/.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const SITE_URL = process.env.SITE_URL || "https://apkvpn.github.io/webjiko/";
const ORIGIN = new URL(SITE_URL).origin;
const BASE = new URL(SITE_URL).pathname.replace(/\/?$/, "/"); // "/" or "/webjiko/"

const SITE_NAME = "وب‌جیکو";
const SITE_TAGLINE = "دنیای نوشته‌های باحال برای بچه‌های باهوش";
const SITE_DESC =
  "وب‌جیکو مجله‌ی فارسی نوشته‌های کوتاه، آموزشی و سرگرم‌کننده است؛ مطلب‌های تازه درباره‌ی علم، فضا، حیوانات، بازی و داستان برای بچه‌های ۸ تا ۱۰ ساله.";

const ROOT = process.cwd();
const DIST = join(ROOT, "dist");
// Prefer a raster social image; fall back to the vector artwork when no JPEG is present.
const OG_FILE = existsSync(join(ROOT, "public", "og.jpg")) ? "og.jpg" : "og.svg";

/* ---------------------------------- utils --------------------------------- */

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const enc = (s) => encodeURIComponent(String(s));
const url = (p) => ORIGIN + BASE + String(p || "");

function faDate(iso) {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Tehran",
    }).format(new Date(iso));
  } catch (e) {
    return String(iso || "").slice(0, 10);
  }
}

function readingTime(html) {
  const words = String(html || "")
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

function slugify(input) {
  const base = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[\u200c\u200f\u200e]/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base.slice(0, 80) || "post";
}

/* -------------------------------- sanitation ------------------------------- */

const ALLOWED_TAGS = new Set([
  "p","br","strong","b","em","i","u","s","strike","h2","h3","h4","ul","ol","li",
  "blockquote","code","pre","a","img","hr","span","div","figure","figcaption",
  "font","iframe","table","tbody","thead","tr","td","th",
]);

function cleanAttrs(tag, attrString) {
  const out = [];
  const re = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let m;
  while ((m = re.exec(attrString))) {
    const name = m[1].toLowerCase();
    const value = (m[3] ?? m[4] ?? m[5] ?? "").trim();
    if (name.startsWith("on")) continue;
    if (value.toLowerCase().replace(/\s+/g, "").startsWith("javascript:")) continue;
    if (tag === "a" && name === "href") {
      if (/^(https?:|mailto:|#|\/)/i.test(value)) out.push(`href="${esc(value)}"`);
      continue;
    }
    if ((tag === "img" && name === "src") || (tag === "iframe" && name === "src")) {
      if (/^https?:\/\//i.test(value)) out.push(`src="${esc(value)}"`);
      continue;
    }
    if (["alt", "title", "width", "height", "loading"].includes(name)) {
      out.push(`${name}="${esc(value)}"`);
    } else if (name === "target") {
      out.push(`target="_blank" rel="noopener"`);
    } else if (name === "color") {
      if (/^#[0-9a-f]{3,8}$/i.test(value) || /^[a-z]{3,20}$/i.test(value)) out.push(`color="${esc(value)}"`);
    } else if (name === "style") {
      const safe = value
        .split(";")
        .map((d) => d.trim())
        .filter((d) => /^(color|background-color|text-align|font-weight|font-style|text-decoration)\s*:/i.test(d))
        .join("; ");
      if (safe) out.push(`style="${esc(safe)}"`);
    }
  }
  return out.join(" ");
}

function sanitizeHtml(html) {
  let out = String(html == null ? "" : html);
  out = out.replace(/<\s*(script|style|object|embed|form|input|button|link|meta|svg|math)[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  out = out.replace(/<\s*(script|style|object|embed|form|input|button|link|meta)[^>]*>/gi, "");
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g, (whole, slash, rawTag, attrs) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (slash) return `</${tag}>`;
    const srcMatch = attrs.match(/src\s*=\s*("([^"]*)"|'([^']*)')/i) || [];
    const src = srcMatch[2] || srcMatch[3] || "";
    if (tag === "iframe") {
      if (!/^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com)\//i.test(src)) return "";
      return `<iframe src="${esc(src)}" loading="lazy" allowfullscreen frameborder="0" title="ویدیو"></iframe>`;
    }
    if (tag === "img" && !/^https?:\/\//i.test(src)) return "";
    const clean = cleanAttrs(tag, attrs);
    return clean ? `<${tag} ${clean}>` : `<${tag}>`;
  });
  return out.trim();
}

/* ---------------------------------- data --------------------------------- */

const posts = JSON.parse(readFileSync(join(ROOT, "content", "posts.json"), "utf8"))
  .map((p) => ({
    id: Number(p.id) || 0,
    slug: String(p.slug || slugify(p.title)),
    title: String(p.title || ""),
    excerpt: String(p.excerpt || ""),
    content: sanitizeHtml(p.content || ""),
    category: String(p.category || "").trim() || "عمومی",
    cover: /^https?:\/\//i.test(String(p.cover || "")) ? String(p.cover) : "",
    created_at: String(p.created_at || new Date().toISOString()),
    updated_at: String(p.updated_at || p.created_at || new Date().toISOString()),
  }))
  .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : b.id - a.id));

const cats = (() => {
  const map = new Map();
  for (const p of posts) map.set(p.category, (map.get(p.category) || 0) + 1);
  return [...map.entries()].map(([name, count]) => ({ name, count, slug: slugify(name) }));
})();

/* ---------------------------------- views --------------------------------- */

const PALETTE = ["sky", "mint", "sun", "grape", "coral"];
const EMOJI = ["📚", "🚀", "🐱", "🎨", "🔬", "⭐", "🎈", "🧩", "🌻", "🦄", "🍭", "🧠"];

function toneFor(str) {
  let h = 0;
  for (const ch of String(str || "")) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return { color: PALETTE[h % PALETTE.length], emoji: EMOJI[h % EMOJI.length] };
}

const postHref = (slug) => `${BASE}post/${enc(slug)}/`;
const catHref = (slug) => `${BASE}category/${enc(slug)}/`;

function postCard(p) {
  const tone = toneFor(p.slug || p.title);
  const cover = p.cover
    ? `<img class="card-cover-img" src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy" />`
    : `<div class="card-cover-fallback cover-${tone.color}"><span>${tone.emoji}</span></div>`;
  return `<article class="card" data-cat="${esc(p.category)}" data-title="${esc(
    (p.title || "") + " " + (p.excerpt || ""),
  )}">
    <a class="card-link" href="${postHref(p.slug)}" aria-label="${esc(p.title)}">
      <div class="card-cover">${cover}<span class="badge badge-${tone.color}">${esc(p.category)}</span></div>
      <div class="card-body">
        <h3 class="card-title">${esc(p.title)}</h3>
        <p class="card-excerpt">${esc(p.excerpt)}</p>
        <div class="card-meta"><time datetime="${esc(p.created_at)}" data-date="${esc(
          p.created_at,
        )}">${faDate(p.created_at)}</time><span class="dot">•</span><span>${readingTime(
          p.content,
        )} دقیقه مطالعه</span></div>
      </div>
    </a>
  </article>`;
}

function header(active) {
  const chips = [`<a class="chip${active ? "" : " is-active"}" href="${BASE}">همه</a>`]
    .concat(
      cats.map(
        (c) =>
          `<a class="chip${active === c.name ? " is-active" : ""}" href="${catHref(c.slug)}">${esc(
            c.name,
          )} <b>${c.count}</b></a>`,
      ),
    )
    .join("");
  return `<header class="topbar">
    <div class="wrap topbar-inner">
      <a class="brand" href="${BASE}"><span class="brand-mark">و</span><span class="brand-text">وب‌جیکو</span></a>
      <nav class="topnav" aria-label="دسته‌بندی‌ها">${chips}</nav>
      <div class="search">
        <input id="searchInput" type="search" placeholder="جستجو در نوشته‌ها…" aria-label="جستجو" />
        <span class="search-ico">🔍</span>
      </div>
    </div>
  </header>`;
}

function dock() {
  return `<div class="dock" id="adminDock" data-state="closed">
      <button class="dock-pill" id="dockToggle" type="button" aria-expanded="false" aria-controls="dockPanel">
        <span class="dock-dot"></span> پنل مدیر
      </button>
      <section class="dock-panel" id="dockPanel" hidden aria-label="پنل مدیر">
        <div class="dock-head">
          <strong>✏️ ادیتور وب‌جیکو</strong>
          <div class="dock-head-actions">
            <button class="mini-btn" id="logoutBtn" type="button" hidden>خروج</button>
            <button class="icon-btn" id="dockMin" type="button" title="کوچک کردن" aria-label="کوچک کردن">✕</button>
          </div>
        </div>

        <form class="login" id="loginForm" autocomplete="off">
          <p class="login-hint">برای نوشتن پست، رمز مدیر را وارد کن.</p>
          <div class="login-row">
            <input id="adminPass" type="password" inputmode="numeric" placeholder="رمز مدیر" aria-label="رمز مدیر" />
            <button class="btn btn-primary" type="submit">باز کن</button>
          </div>
          <p class="msg" id="loginMsg" role="status"></p>
        </form>

        <form class="login" id="tokenForm" autocomplete="off" hidden>
          <p class="login-hint">یک‌بار «توکن گیت‌هاب» را وارد کن تا انتشار پست‌ها ممکن شود. فقط در همین مرورگر ذخیره می‌شود.</p>
          <div class="login-row">
            <input id="ghToken" type="password" placeholder="ghp_…" aria-label="توکن گیت‌هاب" />
            <button class="btn btn-primary" type="submit">ذخیره</button>
          </div>
          <p class="msg" id="tokenMsg" role="status"></p>
        </form>

        <div class="editor" id="editorApp" hidden>
          <div class="editor-fields">
            <input id="postTitle" class="inp inp-title" placeholder="عنوان پست" aria-label="عنوان پست" />
            <div class="field-row">
              <input id="postCategory" class="inp" list="catList" placeholder="دسته‌بندی (مثلاً فضا)" aria-label="دسته‌بندی" />
              <datalist id="catList"></datalist>
              <input id="postCover" class="inp" placeholder="لینک عکس کاور (اختیاری)" aria-label="لینک عکس کاور" />
            </div>
            <textarea id="postExcerpt" class="inp" rows="2" placeholder="خلاصه‌ی کوتاه (برای گوگل و کارت پست)" aria-label="خلاصه"></textarea>
          </div>

          <div class="toolbar" role="toolbar" aria-label="ابزارهای ادیتور">
            <div class="tool-group">
              <button type="button" data-cmd="undo" title="برگرداندن">↶</button>
              <button type="button" data-cmd="redo" title="تکرار">↷</button>
            </div>
            <div class="tool-group">
              <button type="button" data-cmd="bold" title="پُررنگ"><b>B</b></button>
              <button type="button" data-cmd="italic" title="کج"><i>I</i></button>
              <button type="button" data-cmd="underline" title="زیرخط"><u>U</u></button>
              <button type="button" data-cmd="strikeThrough" title="خط‌خورده"><s>S</s></button>
            </div>
            <div class="tool-group">
              <button type="button" data-block="h2" title="تیتر بزرگ">H2</button>
              <button type="button" data-block="h3" title="تیتر کوچک">H3</button>
              <button type="button" data-block="p" title="متن معمولی">¶</button>
              <button type="button" data-block="blockquote" title="نقل‌قول">❝</button>
              <button type="button" data-block="pre" title="کد">{ }</button>
            </div>
            <div class="tool-group">
              <button type="button" data-cmd="insertUnorderedList" title="لیست نقطه‌ای">•</button>
              <button type="button" data-cmd="insertOrderedList" title="لیست شماره‌دار">1.</button>
              <button type="button" data-cmd="insertHorizontalRule" title="خط جداکننده">—</button>
            </div>
            <div class="tool-group">
              <button type="button" data-cmd="justifyRight" title="راست">⇥</button>
              <button type="button" data-cmd="justifyCenter" title="وسط">↔</button>
              <button type="button" data-cmd="justifyLeft" title="چپ">⇤</button>
            </div>
            <div class="tool-group">
              <label class="color-tool" title="رنگ متن">A<input type="color" id="foreColor" value="#ff6f61" /></label>
              <label class="color-tool" title="هایلایت">▨<input type="color" id="hiliteColor" value="#ffe066" /></label>
            </div>
            <div class="tool-group">
              <button type="button" data-act="link" title="لینک">🔗</button>
              <button type="button" data-act="image" title="عکس">🖼️</button>
              <button type="button" data-act="video" title="ویدیو یوتیوب">▶</button>
              <button type="button" data-act="emoji" title="ایموجی">😀</button>
              <button type="button" data-cmd="removeFormat" title="پاک کردن قالب">🧹</button>
            </div>
          </div>

          <div class="editor-area" id="editorArea" contenteditable="true" role="textbox" aria-multiline="true"
               data-placeholder="اینجا بنویس… می‌توانی تیتر بزنی، عکس بگذاری، لیست بسازی و رنگ عوض کنی."></div>

          <div class="editor-foot">
            <span class="count" id="wordCount">۰ کلمه</span>
            <div class="editor-foot-actions">
              <button type="button" class="btn btn-ghost" id="resetPost">پاک کردن</button>
              <button type="button" class="btn btn-primary" id="savePost">انتشار پست</button>
            </div>
          </div>
          <p class="msg" id="editorMsg" role="status"></p>

          <div class="admin-list-head">
            <strong>پست‌های سایت</strong>
            <span class="hint">برای ویرایش یا حذف روی پست بزن</span>
          </div>
          <ul class="admin-list" id="adminList"></ul>
        </div>
      </section>
    </div>`;
}

function footer(withDock) {
  return `<footer class="footer">
    <div class="wrap footer-inner">
      <div class="footer-brand">
        <a class="brand brand-light" href="${BASE}"><span class="brand-mark">و</span><span class="brand-text">وب‌جیکو</span></a>
        <p>${esc(SITE_TAGLINE)}</p>
        <p class="footer-links"><a href="${BASE}sitemap.xml">نقشه‌ی سایت</a><a href="${BASE}rss.xml">خوراک RSS</a></p>
      </div>
      <div class="footer-note">
        <p>ساخته‌شده با ❤️ برای بچه‌های کنجکاو</p>
        <p class="copyright">© ${new Date().getFullYear()} وب‌جیکو</p>
      </div>
    </div>
    ${withDock ? dock() : ""}
  </footer>`;
}

function layout({ title, description, canonical, body, jsonld, activeCat, withDock, postsData }) {
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(canonical)}" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
<meta name="theme-color" content="#ff6f61" />
<meta name="author" content="وب‌جیکو" />
<meta property="og:site_name" content="${esc(SITE_NAME)}" />
<meta property="og:locale" content="fa_IR" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(canonical)}" />
<meta property="og:image" content="${esc(url(OG_FILE))}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<link rel="icon" href="${BASE}favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="${BASE}favicon.svg" />
<link rel="alternate" type="application/rss+xml" title="وب‌جیکو" href="${BASE}rss.xml" />
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" />
<link rel="stylesheet" href="${BASE}styles.css" />
<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>
</head>
<body>
${header(activeCat)}
<main class="wrap">${body}</main>
${footer(!!withDock)}
${postsData ? `<script id="postsData" type="application/json">${JSON.stringify(postsData).replace(/</g, "\\u003c")}</script>` : ""}
<script>window.WJ_BASE=${JSON.stringify(BASE)};window.WJ_REPO=${JSON.stringify(
    process.env.REPO_SLUG || "apkvpn/webjiko",
  )};</script>
<script src="${BASE}app.js" defer></script>
</body>
</html>`;
}

/* ---------------------------------- pages --------------------------------- */

const homeBody = () => {
  const cards = posts.length
    ? posts.map(postCard).join("")
    : `<p class="empty">هنوز پستی منتشر نشده. از پنل مدیر پایین صفحه اولین نوشته را بساز ✨</p>`;
  const archive = posts
    .map(
      (p) =>
        `<li><a href="${postHref(p.slug)}"><span class="a-title">${esc(p.title)}</span><span class="a-cat">${esc(
          p.category,
        )}</span><time data-date="${esc(p.created_at)}">${faDate(p.created_at)}</time></a></li>`,
    )
    .join("");
  return `
  <section class="hero">
    <div class="hero-inner">
      <p class="hero-eyebrow">✨ تازه‌ترین نوشته‌ها</p>
      <h1>${esc(SITE_NAME)}<span class="hero-dot">.</span></h1>
      <p class="hero-sub">${esc(SITE_TAGLINE)}</p>
      <p class="hero-text">داستان، علم، فضا، حیوانات و بازی — همه در یک جا، ساده و خوش‌رنگ. ${posts.length} نوشته آماده‌ی خواندن است.</p>
    </div>
    <div class="hero-blob hero-blob-1"></div>
    <div class="hero-blob hero-blob-2"></div>
    <div class="hero-blob hero-blob-3"></div>
  </section>

  <section class="section" aria-labelledby="latest">
    <div class="section-head">
      <h2 id="latest">تازه‌ترین نوشته‌ها</h2>
      <p>مرتب شده از جدید به قدیم</p>
    </div>
    <div class="grid" id="postsGrid">${cards}</div>
    <p class="empty" id="noResult" hidden>چیزی پیدا نشد. یک کلمه‌ی دیگر امتحان کن 🔎</p>
  </section>

  <section class="section" aria-labelledby="allposts">
    <div class="section-head">
      <h2 id="allposts">همه‌ی پست‌ها</h2>
      <p>فهرست کامل با لینک مستقیم</p>
    </div>
    <ul class="archive" id="archiveList">${archive}</ul>
  </section>`;
};

function homePage() {
  return layout({
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESC,
    canonical: url(""),
    body: homeBody(),
    activeCat: "",
    withDock: true,
    postsData: { posts, base: BASE },
    jsonld: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": url("") + "#website",
          url: url(""),
          name: SITE_NAME,
          description: SITE_DESC,
          inLanguage: "fa-IR",
          publisher: { "@type": "Organization", name: SITE_NAME, url: url("") },
          potentialAction: {
            "@type": "SearchAction",
            target: `${url("")}?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
        {
          "@type": "ItemList",
          name: "تازه‌ترین نوشته‌های وب‌جیکو",
          itemListElement: posts.slice(0, 20).map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: url(`post/${enc(p.slug)}/`),
            name: p.title,
          })),
        },
      ],
    },
  });
}

function postPage(post) {
  const canonical = url(`post/${enc(post.slug)}/`);
  const body = `
  <article class="post">
    <nav class="crumbs" aria-label="مسیر"><a href="${BASE}">خانه</a> / <a href="${catHref(
      slugify(post.category),
    )}">${esc(post.category)}</a></nav>
    <span class="badge badge-inline">${esc(post.category)}</span>
    <h1 class="post-title">${esc(post.title)}</h1>
    ${post.excerpt ? `<p class="post-lead">${esc(post.excerpt)}</p>` : ""}
    <div class="post-meta">
      <time datetime="${esc(post.created_at)}" data-date="${esc(post.created_at)}">${faDate(
        post.created_at,
      )}</time>
      <span class="dot">•</span><span>${readingTime(post.content)} دقیقه مطالعه</span>
    </div>
    ${post.cover ? `<img class="post-cover" src="${esc(post.cover)}" alt="${esc(post.title)}" />` : ""}
    <div class="post-content">${post.content}</div>
    <div class="post-foot">
      <a class="btn btn-primary" href="${BASE}">← برگشت به صفحه‌ی اصلی</a>
    </div>
    <nav class="crumbs" aria-label="مسیر پایین"><a href="${BASE}">خانه</a> / <a href="${catHref(
      slugify(post.category),
    )}">${esc(post.category)}</a></nav>
  </article>`;

  const html = layout({
    title: `${post.title} | ${SITE_NAME}`,
    description: post.excerpt || SITE_DESC,
    canonical,
    body,
    activeCat: post.category,
    jsonld: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt || "",
          url: canonical,
          mainEntityOfPage: canonical,
          datePublished: post.created_at,
          dateModified: post.updated_at || post.created_at,
          inLanguage: "fa-IR",
          image: post.cover ? [post.cover] : [url(OG_FILE)],
          articleSection: post.category,
          author: { "@type": "Organization", name: SITE_NAME, url: url("") },
          publisher: { "@type": "Organization", name: SITE_NAME, url: url("") },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "خانه", item: url("") },
            { "@type": "ListItem", position: 2, name: post.category, item: url(`category/${enc(slugify(post.category))}/`) },
            { "@type": "ListItem", position: 3, name: post.title, item: canonical },
          ],
        },
      ],
    },
  });
  return { path: join("post", post.slug, "index.html"), html };
}

function categoryPage(cat) {
  const list = posts.filter((p) => p.category === cat.name);
  const body = `
  <section class="hero hero-small">
    <div class="hero-inner">
      <p class="hero-eyebrow">دسته‌بندی</p>
      <h1>${esc(cat.name)}</h1>
      <p class="hero-sub">${cat.count} نوشته در این دسته</p>
    </div>
  </section>
  <section class="section">
    <div class="grid">${list.map(postCard).join("")}</div>
    <p class="back-home"><a class="btn btn-ghost" href="${BASE}">همه‌ی پست‌ها ←</a></p>
  </section>`;

  return {
    path: join("category", cat.slug, "index.html"),
    html: layout({
      title: `${cat.name} | ${SITE_NAME}`,
      description: `همه‌ی نوشته‌های دسته‌ی ${cat.name} در وب‌جیکو — ${SITE_TAGLINE}.`,
      canonical: url(`category/${enc(cat.slug)}/`),
      body,
      activeCat: cat.name,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: cat.name,
        inLanguage: "fa-IR",
        url: url(`category/${enc(cat.slug)}/`),
        mainEntity: {
          "@type": "ItemList",
          itemListElement: list.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: url(`post/${enc(p.slug)}/`),
            name: p.title,
          })),
        },
      },
    }),
  };
}

function notFoundPage() {
  return layout({
    title: `صفحه پیدا نشد | ${SITE_NAME}`,
    description: "این صفحه در وب‌جیکو وجود ندارد.",
    canonical: url("404.html"),
    activeCat: "",
    body: `<section class="hero hero-small"><div class="hero-inner"><h1>۴۰۴</h1>
        <p class="hero-sub">این صفحه پیدا نشد!</p>
        <p><a class="btn btn-primary" href="${BASE}">برگشت به خانه</a></p></div></section>`,
    jsonld: { "@context": "https://schema.org", "@type": "WebPage", name: "صفحه پیدا نشد" },
  });
}

/* ------------------------------ feeds & seo ------------------------------- */

function sitemap() {
  const urls = [
    `<url><loc>${url("")}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...cats.map(
      (c) =>
        `<url><loc>${url(`category/${enc(c.slug)}/`)}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`,
    ),
    ...posts.map(
      (p) =>
        `<url><loc>${url(`post/${enc(p.slug)}/`)}</loc><lastmod>${String(
          p.updated_at || p.created_at,
        ).slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join(
    "\n",
  )}\n</urlset>`;
}

function rss() {
  const items = posts
    .slice(0, 30)
    .map(
      (p) => `<item><title>${esc(p.title)}</title><link>${url(`post/${enc(p.slug)}/`)}</link>
      <guid>${url(`post/${enc(p.slug)}/`)}</guid>
      <description>${esc(p.excerpt)}</description>
      <pubDate>${new Date(p.created_at).toUTCString()}</pubDate></item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>${esc(SITE_NAME)}</title><link>${url("")}</link>
<description>${esc(SITE_DESC)}</description><language>fa-IR</language>${items}</channel></rss>`;
}

/* ---------------------------------- write --------------------------------- */

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

function write(relPath, content) {
  const target = join(DIST, relPath);
  mkdirSync(join(target, ".."), { recursive: true });
  writeFileSync(target, content, "utf8");
}

writeFileSync(join(DIST, ".nojekyll"), "");
cpSync(join(ROOT, "public"), DIST, { recursive: true });

write("index.html", homePage());
for (const post of posts) {
  const page = postPage(post);
  write(page.path, page.html);
}
for (const cat of cats) {
  const page = categoryPage(cat);
  write(page.path, page.html);
}
write("404.html", notFoundPage());
write("sitemap.xml", sitemap());
write("rss.xml", rss());
write(
  "robots.txt",
  `User-agent: *\nAllow: /\n\nSitemap: ${url("sitemap.xml")}\n`,
);

console.log(
  `Built ${posts.length} posts, ${cats.length} categories → dist/  (site: ${ORIGIN + BASE})`,
);
if (!existsSync(join(DIST, "index.html"))) process.exit(1);
