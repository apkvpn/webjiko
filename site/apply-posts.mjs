/**
 * وب‌جیکو — پست‌ها و صفحه‌ها:
 *  ۱) وضعیت پست (پیش‌نویس/زمان‌بندی/منتشرشده) و فیلتر کردن آن‌ها در بیلد
 *  ۲) اجازه‌ی class امن، iframe آپارات و decoding در پاک‌سازی HTML
 *  ۳) بلوک «مطالب مرتبط»، صفحه‌ی ۴۰۴ تازه، صفحه‌ی تماس با ما
 *  ۴) فهرست جستجوی داخلی (search.json) و فایل عمومی posts.json
 * تکرارشدنی است.
 */
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.argv[2] || dirname(fileURLToPath(import.meta.url));
const part = (name) => readFileSync(join(ROOT, "parts", name), "utf8").trim() + "\n";

const file = join(ROOT, "build.mjs");
const before = readFileSync(file, "utf8");
let src = before;

function must(from, to, label) {
  if (src.includes(to)) return;
  if (!src.includes(from)) {
    console.error(`apply-posts: «${label}» پیدا نشد.`);
    process.exit(1);
  }
  src = src.split(from).join(to);
}

/* ۱) فیلدهای وضعیت و زمان انتشار */
must(
  `    updated_at: String(p.updated_at || p.created_at || new Date().toISOString()),
  }))`,
  `    updated_at: String(p.updated_at || p.created_at || new Date().toISOString()),
    status: String(p.status || "published"),
    publish_at: String(p.publish_at || ""),
  }))`,
  "فیلدهای وضعیت",
);

must(
  `  .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : b.id - a.id));`,
  `  .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : b.id - a.id));

/* پیش‌نویس‌ها و پست‌های زمان‌بندی‌شده تا موعدشان در سایت دیده نمی‌شوند */
const WJ_NOW = new Date().toISOString();
for (const p of posts.slice()) {
  const scheduled = p.status === "scheduled" && (!p.publish_at || p.publish_at > WJ_NOW);
  if (p.status === "draft" || p.status === "archived" || scheduled) posts.splice(posts.indexOf(p), 1);
}`,
  "فیلتر وضعیت",
);

/* ۲) پاک‌سازی HTML */
must(
  `    if (["alt", "title", "width", "height", "loading"].includes(name)) {`,
  `    if (name === "class" && /^[a-z0-9 _-]{1,80}$/i.test(value)) out.push(\`class="\${esc(value)}"\`);
    if (["alt", "title", "width", "height", "loading", "decoding"].includes(name)) {`,
  "ویژگی class/decoding",
);

must(
  `      if (!/^https:\\/\\/(www\\.)?(youtube\\.com|youtube-nocookie\\.com)\\//i.test(src)) return "";`,
  `      if (!/^https:\\/\\/(www\\.)?(youtube\\.com|youtube-nocookie\\.com|aparat\\.com|www\\.aparat\\.com)\\//i.test(src)) return "";`,
  "iframe آپارات",
);

/* ۳) مطالب مرتبط در صفحه‌ی پست */
must(
  `    <div class="post-foot">`,
  `    \${relatedBlock(post)}
    <div class="post-foot">`,
  "بلوک مطالب مرتبط",
);

/* صفحه‌ی ۴۰۴ و تماس با ما */
function replaceFn(text, name, body) {
  const at = text.indexOf("function " + name + "(");
  if (at < 0) return null;
  let depth = 0;
  const start = text.indexOf("{", at);
  for (let j = start; j < text.length; j += 1) {
    if (text[j] === "{") depth += 1;
    else if (text[j] === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(0, at) + body + text.slice(j + 1);
    }
  }
  return null;
}

if (!src.includes("/* WJ-PART:notfound */")) {
  const next = replaceFn(src, "notFoundPage", "/* WJ-PART:notfound */\n" + part("notfound.txt"));
  if (next == null) {
    console.error("apply-posts: notFoundPage پیدا نشد.");
    process.exit(1);
  }
  src = next;
}

must(
  `write("404.html", notFoundPage());`,
  `write("404.html", notFoundPage());
write("contact/index.html", contactPage());`,
  "نوشتن صفحه‌ی تماس",
);

/* فهرست جستجو و فایل عمومی پست‌ها */
must(
  `write("rss.xml", rss());`,
  `write("rss.xml", rss());
write(
  "search.json",
  JSON.stringify(
    posts.map((p) => ({
      t: p.title,
      s: p.slug,
      c: p.category,
      e: p.excerpt,
      x: p.content.replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").slice(0, 1500),
    })),
  ),
);
write(
  "posts.json",
  JSON.stringify(
    posts.map((p) => ({
      title: p.title,
      slug: p.slug,
      category: p.category,
      excerpt: p.excerpt,
      cover: p.cover,
      created_at: p.created_at,
      url: url(\`post/\${enc(p.slug)}/\`),
    })),
    null,
    2,
  ),
);`,
  "search.json و posts.json",
);

if (src !== before) writeFileSync(file, src, "utf8");

/* توابع تازه در پایان فایل: اعلان تابع hoist می‌شود، پس ترتیب مهم نیست */
const extras = [];
for (const [marker, name] of [
  ["/* WJ-PART:related */", "related.txt"],
  ["/* WJ-PART:contact */", "contact.txt"],
]) {
  if (src.includes(marker)) continue;
  extras.push(marker + "\n" + part(name));
}
if (extras.length) {
  appendFileSync(file, "\n" + extras.join("\n"), "utf8");
}

console.log(`apply-posts: ${src !== before ? "build.mjs به‌روز شد" : "0 فایل تغییر کرد"}`);
