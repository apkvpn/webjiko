/**
 * وب‌جیکو — چینش تازه: دسته‌بندی‌ها به فوتر، «تماس با ما» به هدر،
 * و بارگذاری دارایی‌های تازه (plus.css / studio.css / plus.js / extra.js / admin2.js / studio.js)
 * با نسخه‌ی کش‌شکن.
 * بعد از apply-theme/slug/editor اجرا می‌شود و تکرارشدنی است.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.argv[2] || dirname(fileURLToPath(import.meta.url));
const part = (name) => readFileSync(join(ROOT, "parts", name), "utf8").trim() + "\n";

const file = join(ROOT, "build.mjs");
const before = readFileSync(file, "utf8");
let src = before;

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

for (const name of ["header", "footer"]) {
  const marker = "/* WJ-PART:" + name + " */";
  if (src.includes(marker)) continue;
  const next = replaceFn(src, name, marker + "\n" + part(name + ".txt"));
  if (next == null) {
    console.error(`apply-layout: تابع ${name} در build.mjs پیدا نشد.`);
    process.exit(1);
  }
  src = next;
}

const OG = 'const OG_FILE = existsSync(join(ROOT, "public", "og.jpg")) ? "og.jpg" : "og.svg";';
const VER = `${OG}

/* نسخه‌ی دارایی‌ها: بعد از هر تغییر، آدرس فایل‌ها عوض می‌شود تا مرورگر نسخه‌ی تازه را بگیرد */
function assetVer() {
  const files = ["styles.css", "theme.css", "panel.css", "plus.css", "studio.css", "app.js", "plus.js", "extra.js", "admin2.js", "studio.js"];
  let h = 7;
  for (const f of files) {
    const p = join(ROOT, "public", f);
    if (!existsSync(p)) continue;
    const s = readFileSync(p, "utf8");
    for (let i = 0; i < s.length; i += 3) h = (h * 33 + s.charCodeAt(i)) % 2147483647;
  }
  return String(h);
}
const ASSET_V = assetVer();`;

if (!src.includes("function assetVer()")) {
  if (!src.includes(OG)) {
    console.error("apply-layout: خط OG_FILE پیدا نشد.");
    process.exit(1);
  }
  src = src.replace(OG, VER);
}

const STYLE_OLD = '<link rel="stylesheet" href="${BASE}styles.css" />';
const STYLE_NEW = [
  '<link rel="stylesheet" href="${BASE}styles.css?v=${ASSET_V}" />',
  '<link rel="stylesheet" href="${BASE}plus.css?v=${ASSET_V}" />',
  '<link rel="stylesheet" href="${BASE}studio.css?v=${ASSET_V}" />',
].join("\n");
if (!src.includes("plus.css?v=")) {
  if (!src.includes(STYLE_OLD)) {
    console.error("apply-layout: خط styles.css پیدا نشد.");
    process.exit(1);
  }
  src = src.replace(STYLE_OLD, STYLE_NEW);
}

const SCRIPT_OLD = '<script src="${BASE}app.js" defer></script>';
const SCRIPT_NEW = [
  '<script src="${BASE}app.js?v=${ASSET_V}" defer></script>',
  '<script src="${BASE}plus.js?v=${ASSET_V}" defer></script>',
  '<script src="${BASE}extra.js?v=${ASSET_V}" defer></script>',
  '<script src="${BASE}admin2.js?v=${ASSET_V}" defer></script>',
  '<script src="${BASE}studio.js?v=${ASSET_V}" defer></script>',
].join("\n");
if (!src.includes("plus.js?v=")) {
  if (!src.includes(SCRIPT_OLD)) {
    console.error("apply-layout: خط app.js پیدا نشد.");
    process.exit(1);
  }
  src = src.replace(SCRIPT_OLD, SCRIPT_NEW);
}

if (src !== before) {
  writeFileSync(file, src, "utf8");
  console.log("apply-layout: build.mjs به‌روز شد");
} else {
  console.log("apply-layout: 0 فایل تغییر کرد");
}
