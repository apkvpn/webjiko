import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { Category, Post } from '../types/content';
import { formatPersianDate, toPersianDigits } from '../utils/slugify';
import { getThemeTokens } from '../utils/theme';
import { PostCover } from './IllustrationArt';
import { PostCard } from './PostCard';

interface PostDetailViewProps {
  post: Post;
  category?: Category;
  relatedPosts: Post[];
  categories: Category[];
  onNavigate: (path: string) => void;
}

export const PostDetailView: React.FC<PostDetailViewProps> = ({
  post,
  category,
  relatedPosts,
  categories,
  onNavigate,
}) => {
  const theme = getThemeTokens(category?.colorTheme);
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Breadcrumb navigation */}
      <nav aria-label="مسیر صفحه" className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 mb-6">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/');
          }}
          className="hover:text-[#FF6B4A]"
        >
          صفحه نخست
        </a>
        <span aria-hidden="true">/</span>
        {category ? (
          <>
            <a
              href={`/category/${category.slug}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(`/category/${category.slug}`);
              }}
              className={`${theme.textAccent} hover:underline`}
            >
              {category.name}
            </a>
            <span aria-hidden="true">/</span>
          </>
        ) : null}
        <span className="text-slate-800 truncate max-w-xs sm:max-w-md">{post.title}</span>
      </nav>

      <article className="bg-white rounded-[2rem] border-2 border-slate-200 overflow-hidden">
        <div className="aspect-[16/9] max-h-[420px] w-full overflow-hidden bg-slate-50 border-b-2 border-slate-100">
          <PostCover
            src={post.coverImage || category?.illustration || 'preset:science'}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-bold text-slate-500 mb-4">
            <span className={theme.textAccent}>{post.categoryName || category?.name}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{toPersianDigits(post.readingMinutes)} دقیقه زمان مطالعه</span>
            <span aria-hidden="true">·</span>
            <span>مناسب {post.ageGroup || '۸ تا ۱۰ سال'}</span>
            <span aria-hidden="true">·</span>
            <span>{formatPersianDate(post.createdAt)}</span>
          </div>

          <h1
            className="font-display text-3xl sm:text-4xl text-slate-900 leading-snug mb-4"
            style={{ textWrap: 'balance' }}
          >
            {post.title}
          </h1>

          <p className="text-base sm:text-lg font-medium text-slate-600 leading-8 pb-6 mb-6 border-b-2 border-slate-100">
            {post.summary}
          </p>

          <div
            className="webjiko-prose"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          {post.keywords && post.keywords.length > 0 && (
            <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
              <span>کلیدواژه‌ها:</span>
              {post.keywords.map((kw, i) => (
                <React.Fragment key={`${kw}-${i}`}>
                  {i > 0 && <span aria-hidden="true">·</span>}
                  <span className="text-slate-700">{kw}</span>
                </React.Fragment>
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-500">
              نویسنده: {post.authorName || 'تیم تحریریه وب‌جیکو'}
            </span>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0EA5E9] hover:bg-[#0284C7] border-b-4 border-[#0369A1] text-white font-bold text-sm transition-all active:translate-y-0.5"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به صفحه نخست</span>
            </a>
          </div>
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-12">
          <h2 id="related-heading" className="font-display text-2xl text-slate-900 mb-5">
            نوشته‌های پیشنهادی دیگر
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedPosts.slice(0, 2).map((rel) => (
              <PostCard
                key={rel.id}
                post={rel}
                category={categoryMap.get(rel.categoryId)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
