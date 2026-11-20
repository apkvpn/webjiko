/**
 * وب‌جیکو — لینک انگلیسی.
 *
 * بعد از apply-theme.mjs اجرا می‌شود و:
 *  ۱) slugify را با نسخه‌ی فارسی→انگلیسی عوض می‌کند تا لینک پست‌ها انگلیسی باشد.
 *  ۲) یک فیلد «لینک» به فرم ادیتور اضافه می‌کند تا لینک را دستی هم بتوان ساخت.
 *  ۳) فایل panel.css را به صفحه اضافه می‌کند.
 *
 * تکرارشدنی است و اگر جای مورد انتظار پیدا نشود با خطا متوقف می‌شود.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.argv[2] || dirname(fileURLToPath(import.meta.url));

/* عنوان فارسی → لینک انگلیسی */
const SLUG = `var FA_WORDS = {"من":"man","تو":"to","و":"va","برای":"baraye","با":"ba","از":"az","در":"dar","به":"be","که":"ke","این":"in","آن":"an","است":"ast","را":"ra","تا":"ta","یا":"ya","درباره":"darbare","دانلود":"download","اندروید":"android","آیفون":"iphone","ایفون":"iphone","فیلترشکن":"filter-shaken","گوگل":"google","یوتیوب":"youtube","سایت":"site","وب":"web","بازی":"bazi","فضا":"faza","علم":"elm","حیوانات":"heyvanat","آموزش":"amoozesh"};
var FA_CHARS = {"آ":"a","ا":"a","أ":"a","إ":"e","ب":"b","پ":"p","ت":"t","ث":"s","ج":"j","چ":"ch","ح":"h","خ":"kh","د":"d","ذ":"z","ر":"r","ز":"z","ژ":"zh","س":"s","ش":"sh","ص":"s","ض":"z","ط":"t","ظ":"z","ع":"","غ":"gh","ف":"f","ق":"gh","ک":"k","ك":"k","گ":"g","ل":"l","م":"m","ن":"n","و":"o","ه":"h","ی":"i","ي":"i","ء":"","ة":"h","ؤ":"o","ئ":"i","۰":"0","۱":"1","۲":"2","۳":"3","۴":"4","۵":"5","۶":"6","۷":"7","۸":"8","۹":"9","٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9"};
function slugify(input) {
  var s = String(input == null ? "" : input).toLowerCase();
  s = s.split(/[ -]+/).map(function (w) { return FA_WORDS[w] || w; }).join(" ");
  var out = "";
  for (var i = 0; i < s.length; i++) { var c = s.charAt(i), m = FA_CHARS[c]; out += m == null ? c : m; }
  out = out.replace(/[^a-z0-9 -]/g, " ").replace(/ +/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return out.slice(0, 80).replace(/-+$/, "") || "post";
}`;

const SLUG_INPUT = `            <input id="postSlug" class="inp inp-slug" dir="ltr" autocomplete="off" placeholder="link-in-english (خالی = خودکار)" aria-label="لینک پست انگلیسی" />
            <p class="slug-tip" id="postSlugTip" dir="ltr"></p>`;

const TITLE_INPUT = `            <input id="postTitle" class="inp inp-title" placeholder="عنوان پست" aria-label="عنوان پست" />`;

const edits = [
  ["    slug: String(p.slug || slugify(p.title)),", "    slug: slugify(p.slug || p.title),"],
  [TITLE_INPUT, `${TITLE_INPUT}\n${SLUG_INPUT}`],
  [
    '<link rel="stylesheet" href="${BASE}theme.css" />',
    '<link rel="stylesheet" href="${BASE}panel.css" /><link rel="stylesheet" href="${BASE}theme.css" />',
  ],
];

/* جایگزینی کل تابع slugify بدون تکیه بر متن قبلی */
function putSlugFn(src) {
  if (src.includes("var FA_WORDS")) return src;
  const at = src.indexOf("function slugify(input)");
  if (at < 0) return null;
  let depth = 0;
  for (let j = src.indexOf("{", at); j < src.length; j += 1) {
    if (src[j] === "{") depth += 1;
    else if (src[j] === "}") {
      depth -= 1;
      if (depth === 0) return src.slice(0, at) + SLUG + src.slice(j + 1);
    }
  }
  return null;
}

const file = join(ROOT, "build.mjs");
const before = readFileSync(file, "utf8");
let src = putSlugFn(before);
if (src == null) {
  console.error("apply-slug: تابع slugify در build.mjs پیدا نشد.");
  process.exit(1);
}
for (const [from, to] of edits) {
  if (src.includes(to)) continue;
  if (!src.includes(from)) {
    console.error(`apply-slug: در build.mjs متن مورد انتظار پیدا نشد:\n${from.slice(0, 120)}…`);
    process.exit(1);
  }
  src = src.split(from).join(to);
}
if (src !== before) {
  writeFileSync(file, src, "utf8");
  console.log("apply-slug: build.mjs به‌روز شد");
} else {
  console.log("apply-slug: 0 فایل تغییر کرد");
}
