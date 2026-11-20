import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Category, Post } from '../types/content';
import { formatPersianDate, toPersianDigits } from '../utils/slugify';
import { getThemeTokens } from '../utils/theme';
import { PostCover } from './IllustrationArt';

interface PostCardProps {
  post: Post;
  category?: Category;
  onNavigate: (path: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, category, onNavigate }) => {
  const theme = getThemeTokens(category?.colorTheme);
  const postHref = `/post/${post.slug}`;

  const handleOpen = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onNavigate(postHref);
  };

  return (
    <article
      className={`group flex flex-col bg-white rounded-3xl border-2 ${theme.cardBorder} overflow-hidden transition-transform duration-200 hover:-translate-y-1`}
    >
      <a
        href={postHref}
        onClick={handleOpen}
        className="block aspect-[4/3] overflow-hidden bg-slate-50"
      >
        <PostCover
          src={post.coverImage || category?.illustration || 'preset:science'}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </a>

      <div className="flex-1 flex flex-col p-5">
        {/* Zero-pill clean unboxed metadata */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mb-2.5">
          <a
            href={`/category/${category?.slug ?? 'all'}`}
            onClick={(e) => {
              e.preventDefault();
              if (category?.slug) onNavigate(`/category/${category.slug}`);
            }}
            className={`${theme.textAccent} hover:underline`}
          >
            {post.categoryName || category?.name || 'دانستنی'}
          </a>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{toPersianDigits(post.readingMinutes)} دقیقه خواندن</span>
          <span aria-hidden="true">·</span>
          <span>{formatPersianDate(post.createdAt)}</span>
        </div>

        <h3 className="text-lg font-extrabold text-slate-900 leading-snug mb-2.5">
          <a
            href={postHref}
            onClick={handleOpen}
            className="hover:text-[#0284C7] transition-colors"
          >
            {post.title}
          </a>
        </h3>

        <p className="text-sm text-slate-600 leading-7 line-clamp-3 mb-5 flex-1">
          {post.summary}
        </p>

        <div className="pt-2 flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
            مناسب {post.ageGroup || '۸ تا ۱۰ سال'}
          </span>

          <a
            href={postHref}
            onClick={handleOpen}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl ${theme.btnBg} ${theme.btnHover} ${theme.btnBorderBottom} ${theme.btnText} font-bold text-xs transition-all active:translate-y-0.5 whitespace-nowrap shrink-0`}
          >
            <span>بخوانیم</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
};
