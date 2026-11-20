/**
 * وب‌جیکو — تصویر شاخص پست، تصویر اشتراک‌گذاری همان صفحه هم می‌شود:
 * og:image و twitter:image صفحه‌ی پست از cover خودِ پست خوانده می‌شوند.
 * آخرین هوک اجرا می‌شود و تکرارشدنی است (با نشانه‌ی WJ-COVER-META).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.argv[2] || dirname(fileURLToPath(import.meta.url));
const file = join(ROOT, "build.mjs");
const src = readFileSync(file, "utf8");

if (src.includes("WJ-COVER-META")) {
  console.log("apply-cover: قبلاً اعمال شده");
  process.exit(0);
}

const OLD = '  return { path: join("post", post.slug, "index.html"), html };';
const NEW = [
  "  /* WJ-COVER-META */",
  "  const finalHtml = post.cover",
  "    ? html",
  "        .replace(",
  '          `<meta property="og:image" content="${esc(url(OG_FILE))}" />`,',
  '          `<meta property="og:image" content="${esc(post.cover)}" />`,',
  "        )",
  "        .replace(",
  '          `<meta name="twitter:card" content="summary_large_image" />`,',
  '          `<meta name="twitter:card" content="summary_large_image" />\\n<meta name="twitter:image" content="${esc(post.cover)}" />`,',
  "        )",
  "    : html;",
  '  return { path: join("post", post.slug, "index.html"), html: finalHtml };',
].join("\n");

if (!src.includes(OLD)) {
  console.error("apply-cover: خط بازگشت صفحه‌ی پست در build.mjs پیدا نشد.");
  process.exit(1);
}

writeFileSync(file, src.replace(OLD, () => NEW), "utf8");
console.log("apply-cover: build.mjs به‌روز شد");
