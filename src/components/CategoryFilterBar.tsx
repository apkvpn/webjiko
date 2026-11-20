import React from 'react';
import { Search, X } from 'lucide-react';
import type { Category, Post } from '../types/content';
import { toPersianDigits } from '../utils/slugify';
import { getThemeTokens } from '../utils/theme';

interface CategoryFilterBarProps {
  categories: Category[];
  posts: Post[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  categories,
  posts,
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  searchInputRef,
}) => {
  return (
    <section
      id="categories-section"
      aria-label="دسته‌بندی نوشته‌ها و جستجو"
      className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              selectedCategoryId === 'all'
                ? 'bg-slate-900 text-white border-b-4 border-slate-700'
                : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300'
            }`}
          >
            همه نوشته‌ها ({toPersianDigits(posts.length)})
          </button>

          {categories.map((cat) => {
            const theme = getThemeTokens(cat.colorTheme);
            const count = posts.filter((p) => p.categoryId === cat.id).length;
            const isActive = selectedCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap shrink-0 active:translate-y-0.5 ${
                  isActive
                    ? `${theme.btnBg} ${theme.btnText} ${theme.btnBorderBottom}`
                    : `bg-white text-slate-700 border-2 ${theme.cardBorder} hover:${theme.surfaceTint}`
                }`}
              >
                {cat.name} ({toPersianDigits(count)})
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="جستجوی داستان، علم یا معما..."
            aria-label="جستجوی نوشته‌ها"
            className="w-full pr-10 pl-9 py-2.5 rounded-2xl bg-white border-2 border-slate-200 focus:border-[#0EA5E9] focus:outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="پاک کردن جستجو"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
