import React from 'react';
import { ArrowDown } from 'lucide-react';
import type { Category } from '../types/content';
import { toPersianDigits } from '../utils/slugify';
import { getThemeTokens } from '../utils/theme';
import { IllustrationArt } from './IllustrationArt';

interface HeroSectionProps {
  totalPosts: number;
  categories: Category[];
  onSelectCategory: (categoryId: string) => void;
  onNavigate: (path: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  totalPosts,
  categories,
  onSelectCategory,
  onNavigate,
}) => {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6">
      <div className="bg-white rounded-[2rem] border-2 border-[#BAE6FD] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="text-xs sm:text-sm font-bold text-[#0284C7] mb-3">
            مجله فارسی دانش، قصه و بازی فکری · ویژه بچه‌های ۸ تا ۱۰ ساله
          </div>

          <h1
            className="font-display text-3xl sm:text-5xl text-slate-900 leading-[1.25] mb-4"
            style={{ textWrap: 'balance' }}
          >
            با <span className="text-[#FF6B4A]">وب‌جیکو</span> دنیا را رنگارنگ‌تر کشف کن!
          </h1>

          <p className="text-slate-600 text-base sm:text-lg leading-8 max-w-2xl mb-6">
            اینجا پر از آزمایش‌های علمی بی‌خطر، داستان‌های خیال‌انگیز، معماهای کارآگاهی و
            کاردستی‌های باحال است تا هر روز چیزهای تازه یاد بگیری و بخندی.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <a
              href="#posts-grid"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('posts-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FF6B4A] hover:bg-[#F25836] border-b-4 border-[#C93B1C] text-white font-extrabold text-sm sm:text-base transition-all active:translate-y-0.5 whitespace-nowrap shrink-0"
            >
              <span>شروع خواندن مطالب</span>
              <ArrowDown className="w-4 h-4" />
            </a>

            <div className="text-sm font-bold text-slate-600 px-3 py-2 tabular-nums">
              {toPersianDigits(totalPosts)} نوشته شاد آماده خواندن
            </div>
          </div>

          {/* Quick tactile category shortcuts */}
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 ml-1">موضوع‌های محبوب:</span>
              {categories.slice(0, 4).map((cat) => {
                const theme = getThemeTokens(cat.colorTheme);
                return (
                  <a
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectCategory(cat.id);
                      onNavigate('/');
                      window.setTimeout(() => {
                        document.getElementById('categories-section')?.scrollIntoView({
                          behavior: 'smooth',
                        });
                      }, 50);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl ${theme.surfaceTint} ${theme.textAccent} border ${theme.cardBorder} font-bold text-xs hover:brightness-95 transition-all whitespace-nowrap shrink-0`}
                  >
                    {cat.name}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 flex items-center">
          <div className="w-full h-full min-h-[240px] rounded-3xl overflow-hidden border-2 border-[#E0F2FE] bg-[#E0F2FE]">
            <IllustrationArt variant="hero" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
};
