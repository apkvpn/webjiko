/**
 * وب‌جیکو — اتصال بستهٔ «۱۰۰ قابلیت تازه» به بیلد.
 * فایل‌های public/feats.css و public/feats.js را با نسخهٔ کش‌شکن به همهٔ صفحه‌ها اضافه می‌کند،
 * مانیفست نصب اپ را در head می‌گذارد و نام فایل‌های تازه را به فهرست assetVer اضافه می‌کند.
 * بعد از apply-layout اجرا می‌شود و تکرارشدنی است (نشانه‌ی feats.js?v=).
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.argv[2] || dirname(fileURLToPath(import.meta.url));
const file = join(ROOT, "build.mjs");
let src = readFileSync(file, "utf8");
const before = src;

/* feats.js از قطعه‌های feats-src/part-*.js ساخته می‌شود تا هر فایل کوچک بماند */
const partsDir = join(ROOT, "feats-src");
if (existsSync(partsDir)) {
  const parts = readdirSync(partsDir).filter((f) => /^part-\d+\.js$/.test(f)).sort();
  if (!parts.length) {
    console.error("apply-feats: هیچ part-*.js در feats-src پیدا نشد.");
    process.exit(1);
  }
  const bundle = parts.map((f) => readFileSync(join(partsDir, f), "utf8")).join("");
  writeFileSync(join(ROOT, "public", "feats.js"), bundle, "utf8");
  console.log("apply-feats: feats.js از " + parts.length + " قطعه ساخته شد");
}

function must(needle, label) {
  if (!src.includes(needle)) {
    console.error(`apply-feats: «${label}» در build.mjs پیدا نشد.`);
    process.exit(1);
  }
}

if (src.includes("feats.js?v=")) {
  console.log("apply-feats: قبلاً اعمال شده");
  process.exit(0);
}

for (const f of ["feats.css", "feats.js", "sw.js", "manifest.webmanifest"]) {
  if (!existsSync(join(ROOT, "public", f))) {
    console.error(`apply-feats: فایل public/${f} پیدا نشد.`);
    process.exit(1);
  }
}

/* ۱) استایل */
must('studio.css?v=${ASSET_V}" />', "لینک studio.css");
src = src.replace(
  'studio.css?v=${ASSET_V}" />',
  'studio.css?v=${ASSET_V}" />\n<link rel="stylesheet" href="${BASE}feats.css?v=${ASSET_V}" />',
);

/* ۲) اسکریپت */
must('studio.js?v=${ASSET_V}" defer></script>', "اسکریپت studio.js");
src = src.replace(
  'studio.js?v=${ASSET_V}" defer></script>',
  'studio.js?v=${ASSET_V}" defer></script>\n<script src="${BASE}feats.js?v=${ASSET_V}" defer></script>',
);

/* ۳) مانیفست نصب اپ */
must('<link rel="icon" href="${BASE}favicon.svg" type="image/svg+xml" />', "لینک favicon");
src = src.replace(
  '<link rel="icon" href="${BASE}favicon.svg" type="image/svg+xml" />',
  '<link rel="icon" href="${BASE}favicon.svg" type="image/svg+xml" />\n<link rel="manifest" href="${BASE}manifest.webmanifest" />',
);

/* ۴) فایل‌های تازه در نسخهٔ کش */
must('"studio.js"];', "فهرست assetVer");
src = src.replace('"studio.js"];', '"studio.js", "feats.css", "feats.js", "sw.js"];');

if (src === before) {
  console.error("apply-feats: هیچ تغییری اعمال نشد.");
  process.exit(1);
}

writeFileSync(file, src, "utf8");
console.log("apply-feats: feats.css + feats.js + manifest به build.mjs اضافه شد");
