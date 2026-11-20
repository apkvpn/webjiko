import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { Category, Post } from '../types/content';
import { toPersianDigits } from '../utils/slugify';
import { getThemeTokens } from '../utils/theme';
import { IllustrationArt } from './IllustrationArt';
import { PostCard } from './PostCard';

interface CategoryArchiveViewProps {
  category: Category;
  posts: Post[];
  onNavigate: (path: string) => void;
}

export const CategoryArchiveView: React.FC<CategoryArchiveViewProps> = ({
  category,
  posts,
  onNavigate,
}) => {
  const theme = getThemeTokens(category.colorTheme);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className={`rounded-[2rem] border-2 ${theme.cardBorder} ${theme.surfaceTint} p-6 sm:p-10 mb-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center`}>
        <div className="md:col-span-8">
          <div className={`text-xs font-extrabold ${theme.textAccent} mb-2`}>
            دسته‌بندی موضوعی وب‌جیکو
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-slate-900 mb-3">
            {category.name}
          </h1>
          <p className="text-slate-700 text-base leading-8 mb-5 max-w-2xl">
            {category.description}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl ${theme.btnBg} ${theme.btnHover} ${theme.btnBorderBottom} ${theme.btnText} font-bold text-sm transition-all active:translate-y-0.5`}
            >
              <ArrowRight className="w-4 h-4" />
              <span>همه موضوع‌ها در صفحه نخست</span>
            </a>
            <span className="text-sm font-bold text-slate-600 tabular-nums">
              {toPersianDigits(posts.length)} نوشته در این دسته
            </span>
          </div>
        </div>
        <div className="md:col-span-4 aspect-[4/3] rounded-2xl overflow-hidden border-2 border-white">
          <IllustrationArt variant={category.illustration} className="w-full h-full object-cover" />
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-10 text-center text-slate-600">
          هنوز نوشته‌ای در این دسته‌بندی منتشر نشده است.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              category={category}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </main>
  );
};
