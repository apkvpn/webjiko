/**
 * وب‌جیکو — فعال‌سازی طراحی تازه (redesign.css) در بیلد.
 *
 * ۱) فایل public/redesign.css را بعد از همهٔ استایل‌ها (آخر از همه، بعد از theme.css) به <head> اضافه می‌کند.
 * ۲) سربرگ بزرگ صفحهٔ اصلی را از بالای صفحه برمی‌دارد و به انتهای همان صفحه می‌برد،
 *    تا نوشته‌ها و کارت‌ها از همان اول دیده شوند.
 * ۳) نام فایل تازه را به فهرست نسخهٔ کش (assetVer) اضافه می‌کند.
 * ۴) رنگ نوار مرورگر (theme-color) را با پس‌زمینهٔ تازه هم‌رنگ می‌کند.
 *
 * بعد از apply-feats و apply-logout اجرا می‌شود و تکرارشدنی است (نشانه‌ی redesign.css?v=).
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.argv[2] || dirname(fileURLToPath(import.meta.url));
const file = join(ROOT, "build.mjs");
let src = readFileSync(file, "utf8");
const before = src;

/* redesign.css از قطعه‌های redesign-src/part-*.css ساخته می‌شود تا هر فایل کوچک بماند */
const partsDir = join(ROOT, "redesign-src");
if (existsSync(partsDir)) {
  const parts = readdirSync(partsDir).filter((f) => /^part-\d+\.css$/.test(f)).sort();
  if (!parts.length) {
    console.error("apply-redesign: هیچ part-*.css در redesign-src پیدا نشد.");
    process.exit(1);
  }
  const bundle = parts.map((f) => readFileSync(join(partsDir, f), "utf8")).join("");
  writeFileSync(join(ROOT, "public", "redesign.css"), bundle, "utf8");
  console.log("apply-redesign: redesign.css از " + parts.length + " قطعه ساخته شد");
}

if (!existsSync(join(ROOT, "public", "redesign.css"))) {
  console.error("apply-redesign: فایل public/redesign.css پیدا نشد.");
  process.exit(1);
}

if (src.includes("redesign.css?v=")) {
  console.log("apply-redesign: قبلاً اعمال شده");
  process.exit(0);
}

function must(needle, label) {
  if (!src.includes(needle)) {
    console.error(`apply-redesign: «${label}» در build.mjs پیدا نشد.`);
    process.exit(1);
  }
}

/* ۱) استایل تازه، آخرین لینک head */
const THEME = '<link rel="stylesheet" href="${BASE}theme.css" />';
must(THEME, "لینک theme.css");
src = src.replace(
  THEME,
  THEME + '\n<link rel="stylesheet" href="${BASE}redesign.css?v=${ASSET_V}" />',
);

/* ۲) نوشته‌ها بالای صفحه: سربرگ بزرگ صفحهٔ اصلی به پایین همان صفحه می‌رود */
const homeStart = src.indexOf("const homeBody = () =>");
const homeEnd = src.indexOf("function homePage(", homeStart);
if (homeStart < 0 || homeEnd < 0) {
  console.error("apply-redesign: صفحهٔ اصلی (homeBody) پیدا نشد.");
  process.exit(1);
}

let region = src.slice(homeStart, homeEnd);
const heroStart = region.indexOf('  <section class="hero">');
const heroEndMark = "\n  </section>\n";
const heroEnd = heroStart < 0 ? -1 : region.indexOf(heroEndMark, heroStart);

if (heroStart >= 0 && heroEnd >= 0) {
  const heroBlock = region.slice(heroStart, heroEnd + heroEndMark.length);
  region = region.slice(0, heroStart) + region.slice(heroStart + heroBlock.length);

  /* سربرگ را بعد از «همه‌ی پست‌ها» می‌گذاریم، پیش از پایان قالب صفحه */
  const tail = "  </section>`;\n";
  const tailAt = region.lastIndexOf(tail);
  if (tailAt < 0) {
    console.error("apply-redesign: پایان قالب صفحهٔ اصلی پیدا نشد.");
    process.exit(1);
  }
  region =
    region.slice(0, tailAt) +
    "  </section>\n\n" +
    heroBlock.trimEnd() +
    "\n`;\n" +
    region.slice(tailAt + tail.length);

  src = src.slice(0, homeStart) + region + src.slice(homeEnd);
} else {
  console.log("apply-redesign: صفحهٔ اصلی از قبل نوشته‌ها را بالای صفحه دارد");
}

/* ۳) نسخهٔ کش */
must('"feats.js", "sw.js"];', "فهرست assetVer");
src = src.replace('"feats.js", "sw.js"];', '"feats.js", "sw.js", "redesign.css"];');

/* ۴) رنگ نوار مرورگر */
if (src.includes('content="#ff6f61"')) {
  src = src.replace('content="#ff6f61"', 'content="#f6f2ea"');
}

if (src === before) {
  console.error("apply-redesign: هیچ تغییری اعمال نشد.");
  process.exit(1);
}

writeFileSync(file, src, "utf8");
console.log("apply-redesign: redesign.css اضافه شد و سربرگ صفحهٔ اصلی به پایین رفت");
