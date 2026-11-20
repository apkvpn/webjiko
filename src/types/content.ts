export type ColorTheme = 'coral' | 'sky' | 'mint' | 'marigold' | 'violet';

export type IllustrationKey = 'hero' | 'science' | 'stories' | 'puzzles' | 'nature';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  colorTheme: ColorTheme;
  illustration: string;
  order: number;
  authorUid?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  summary: string;
  contentHtml: string;
  categoryId: string;
  categoryName: string;
  coverImage: string;
  keywords: string[];
  ageGroup: string;
  readingMinutes: number;
  published: boolean;
  authorName: string;
  authorUid?: string;
  createdAt: string;
  updatedAt: string;
  isStarter?: boolean;
}
