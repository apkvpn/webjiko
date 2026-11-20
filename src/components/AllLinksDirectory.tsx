import React from 'react';
import { BookOpen } from 'lucide-react';
import type { Category, Post } from '../types/content';
import { formatPersianDate, toPersianDigits } from '../utils/slugify';
import { getThemeTokens } from '../utils/theme';

interface AllLinksDirectoryProps {
  posts: Post[];
  categories: Category[];
  onNavigate: (path: string) => void;
}

export const AllLinksDirectory: React.FC<AllLinksDirectoryProps> = ({
  posts,
  categories,
  onNavigate,
}) => {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <section
      id="all-posts-links"
      aria-labelledby="all-links-heading"
      className="max-w-6xl mx-auto px-4 sm:px-6 py-12"
    >
      <div className="bg-white rounded-3xl border-2 border-[#BAE6FD] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200">
          <div>
            <h2
              id="all-links-heading"
              className="font-display text-2xl sm:text-3xl text-slate-900"
            >
              فهرست کامل همه نوشته‌ها و لینک‌ها
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              دسترسی مستقیم و سریع به تمام مطالب منتشرشده در وب‌جیکو برای مطالعه و جستجو
            </p>
          </div>
          <div className="text-sm font-bold text-[#0369A1] tabular-nums">
            مجموع: {toPersianDigits(posts.length)} نوشته
          </div>
        </div>

        {posts.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center">
            هنوز نوشته‌ای منتشر نشده است. از بخش مدیریت در فوتر اولین نوشته را اضافه کنید!
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {posts.map((post, idx) => {
              const cat = categoryMap.get(post.categoryId);
              const theme = getThemeTokens(cat?.colorTheme);
              const href = `/post/${post.slug}`;

              return (
                <li
                  key={post.id}
                  className="flex items-start justify-between gap-3 py-2.5 border-b border-slate-100 last:border-b-0"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className={`mt-1 inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-extrabold shrink-0 tabular-nums ${theme.surfaceTint} ${theme.textAccent}`}
                    >
                      {toPersianDigits(idx + 1)}
                    </span>
                    <div className="min-w-0">
                      <a
                        href={href}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(href);
                        }}
                        className="font-bold text-slate-900 hover:text-[#0284C7] hover:underline underline-offset-4 text-sm leading-6 block"
                      >
                        {post.title}
                      </a>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <a
                          href={`/category/${cat?.slug ?? 'all'}`}
                          onClick={(e) => {
                            e.preventDefault();
                            if (cat?.slug) onNavigate(`/category/${cat.slug}`);
                          }}
                          className={`${theme.textAccent} font-semibold hover:underline`}
                        >
                          {post.categoryName || cat?.name}
                        </a>
                        <span aria-hidden="true">·</span>
                        <span>{formatPersianDate(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={href}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(href);
                    }}
                    aria-label={`خواندن ${post.title}`}
                    className="p-2 rounded-xl text-slate-400 hover:text-[#0284C7] hover:bg-sky-50 transition-colors shrink-0"
                  >
                    <BookOpen className="w-4 h-4" />
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
