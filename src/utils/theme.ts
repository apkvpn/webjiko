import type { ColorTheme } from '../types/content';

export interface ThemeTokens {
  label: string;
  btnBg: string;
  btnHover: string;
  btnBorderBottom: string;
  btnText: string;
  surfaceTint: string;
  cardBorder: string;
  textAccent: string;
  swatchHex: string;
}

export const THEME_MAP: Record<ColorTheme, ThemeTokens> = {
  coral: {
    label: 'مرجانی شاد',
    btnBg: 'bg-[#FF6B4A]',
    btnHover: 'hover:bg-[#F25836]',
    btnBorderBottom: 'border-b-4 border-[#C93B1C]',
    btnText: 'text-white',
    surfaceTint: 'bg-[#FFF3EF]',
    cardBorder: 'border-[#FFD5CA]',
    textAccent: 'text-[#D84323]',
    swatchHex: '#FF6B4A',
  },
  sky: {
    label: 'آبی آسمانی',
    btnBg: 'bg-[#0EA5E9]',
    btnHover: 'hover:bg-[#0284C7]',
    btnBorderBottom: 'border-b-4 border-[#0369A1]',
    btnText: 'text-white',
    surfaceTint: 'bg-[#EFF8FF]',
    cardBorder: 'border-[#BAE6FD]',
    textAccent: 'text-[#0369A1]',
    swatchHex: '#0EA5E9',
  },
  mint: {
    label: 'سبز نعنایی',
    btnBg: 'bg-[#10B981]',
    btnHover: 'hover:bg-[#059669]',
    btnBorderBottom: 'border-b-4 border-[#047857]',
    btnText: 'text-white',
    surfaceTint: 'bg-[#ECFDF5]',
    cardBorder: 'border-[#A7F3D0]',
    textAccent: 'text-[#047857]',
    swatchHex: '#10B981',
  },
  marigold: {
    label: 'زرد آفتابی',
    btnBg: 'bg-[#F59E0B]',
    btnHover: 'hover:bg-[#D97706]',
    btnBorderBottom: 'border-b-4 border-[#B45309]',
    btnText: 'text-slate-950',
    surfaceTint: 'bg-[#FFFBEB]',
    cardBorder: 'border-[#FDE68A]',
    textAccent: 'text-[#B45309]',
    swatchHex: '#F59E0B',
  },
  violet: {
    label: 'بنفش تمشکی',
    btnBg: 'bg-[#8B5CF6]',
    btnHover: 'hover:bg-[#7C3AED]',
    btnBorderBottom: 'border-b-4 border-[#5B21B6]',
    btnText: 'text-white',
    surfaceTint: 'bg-[#F5F3FF]',
    cardBorder: 'border-[#DDD6FE]',
    textAccent: 'text-[#6D28D9]',
    swatchHex: '#8B5CF6',
  },
};

export function getThemeTokens(theme?: string): ThemeTokens {
  if (theme && theme in THEME_MAP) {
    return THEME_MAP[theme as ColorTheme];
  }
  return THEME_MAP.sky;
}
