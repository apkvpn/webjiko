const PERSIAN_TO_LATIN: Record<string, string> = {
  آ: 'a', ا: 'a', ب: 'b', پ: 'p', ت: 't', ث: 's', ج: 'j', چ: 'ch',
  ح: 'h', خ: 'kh', د: 'd', ذ: 'z', ر: 'r', ز: 'z', ژ: 'zh', س: 's',
  ش: 'sh', ص: 's', ض: 'z', ط: 't', ظ: 'z', ع: 'a', غ: 'gh', ف: 'f',
  ق: 'gh', ک: 'k', گ: 'g', ل: 'l', م: 'm', ن: 'n', و: 'v', ه: 'h',
  ی: 'y', ي: 'y', ك: 'k', ة: 'h', ؤ: 'o', ئ: 'y', أ: 'a', إ: 'e',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

export function toSeoSlug(input: string, fallbackPrefix = 'post'): string {
  const normalized = input.trim().toLowerCase();
  let out = '';
  for (const ch of normalized) {
    if (PERSIAN_TO_LATIN[ch]) {
      out += PERSIAN_TO_LATIN[ch];
    } else if (/[a-z0-9]/.test(ch)) {
      out += ch;
    } else if (ch === ' ' || ch === '-' || ch === '_' || ch === '\u200c') {
      out += '-';
    }
  }
  const cleaned = out.replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
  if (cleaned.length >= 2) {
    return cleaned;
  }
  return `${fallbackPrefix}-${Date.now().toString(36)}`;
}

export function formatPersianDate(isoString?: string): string {
  if (!isoString) return 'امروز';
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return 'امروز';
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return 'امروز';
  }
}

export function estimateReadingMinutes(html: string): number {
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = plain ? plain.split(' ').length : 0;
  return Math.max(1, Math.min(60, Math.ceil(words / 110)));
}

export function toPersianDigits(num: number | string): string {
  const digits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (d) => digits[Number(d)] ?? d);
}
