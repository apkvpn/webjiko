import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { STARTER_CATEGORIES, STARTER_POSTS } from '../data/starterContent';
import type { Category, Post } from '../types/content';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

function timestampToIso(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return new Date().toISOString();
}

export function subscribeCategories(
  onData: (categories: Category[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'categories';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Category[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id ?? d.id),
          name: String(data.name ?? ''),
          slug: String(data.slug ?? d.id),
          description: String(data.description ?? ''),
          colorTheme: (data.colorTheme ?? 'sky') as Category['colorTheme'],
          illustration: String(data.illustration ?? 'preset:science'),
          order: typeof data.order === 'number' ? data.order : 10,
          authorUid: data.authorUid ? String(data.authorUid) : undefined,
          createdAt: timestampToIso(data.createdAt),
          updatedAt: timestampToIso(data.updatedAt),
        };
      });
      items.sort((a, b) => a.order - b.order);
      onData(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError) onError(wrapped as Error);
      }
    }
  );
}

export function subscribePosts(
  isAdmin: boolean,
  onData: (posts: Post[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'posts';
  const ref = isAdmin
    ? collection(db, path)
    : query(collection(db, path), where('published', '==', true));

  return onSnapshot(
    ref,
    (snapshot) => {
      const items: Post[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id ?? d.id),
          title: String(data.title ?? ''),
          slug: String(data.slug ?? d.id),
          summary: String(data.summary ?? ''),
          contentHtml: String(data.contentHtml ?? ''),
          categoryId: String(data.categoryId ?? ''),
          categoryName: String(data.categoryName ?? ''),
          coverImage: String(data.coverImage ?? 'preset:science'),
          keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
          ageGroup: String(data.ageGroup ?? '۸ تا ۱۰ سال'),
          readingMinutes: typeof data.readingMinutes === 'number' ? data.readingMinutes : 3,
          published: Boolean(data.published),
          authorName: String(data.authorName ?? 'مدیر وب‌جیکو'),
          authorUid: data.authorUid ? String(data.authorUid) : undefined,
          createdAt: timestampToIso(data.createdAt),
          updatedAt: timestampToIso(data.updatedAt),
        };
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError) onError(wrapped as Error);
      }
    }
  );
}

export async function notifySeoRefresh(): Promise<void> {
  try {
    await fetch('/api/seo-refresh', { method: 'POST' });
  } catch {
    // Non-fatal if offline
  }
}

export async function ensureStarterSeededInFirestore(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const existingCats = await getDocs(collection(db, 'categories'));
    if (existingCats.empty) {
      for (const cat of STARTER_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          colorTheme: cat.colorTheme,
          illustration: cat.illustration,
          order: cat.order,
          authorUid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    const existingPosts = await getDocs(collection(db, 'posts'));
    if (existingPosts.empty) {
      for (const post of STARTER_POSTS) {
        await setDoc(doc(db, 'posts', post.id), {
          id: post.id,
          title: post.title,
          slug: post.slug,
          summary: post.summary,
          contentHtml: post.contentHtml.trim(),
          categoryId: post.categoryId,
          categoryName: post.categoryName,
          coverImage: post.coverImage,
          keywords: post.keywords.slice(0, 10),
          ageGroup: post.ageGroup,
          readingMinutes: post.readingMinutes,
          published: post.published,
          authorName: post.authorName,
          authorUid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
    await notifySeoRefresh();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'categories/posts seed');
  }
}

export async function saveCategory(
  category: Omit<Category, 'authorUid' | 'createdAt' | 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('ابتدا باید با حساب گوگل مدیر وارد شوید.');
  const docPath = `categories/${category.id}`;

  try {
    if (isNew) {
      await setDoc(doc(db, 'categories', category.id), {
        id: category.id,
        name: category.name.slice(0, 60),
        slug: category.slug.slice(0, 80),
        description: category.description.slice(0, 300),
        colorTheme: category.colorTheme,
        illustration: category.illustration.slice(0, 60),
        order: category.order,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'categories', category.id), {
        name: category.name.slice(0, 60),
        slug: category.slug.slice(0, 80),
        description: category.description.slice(0, 300),
        colorTheme: category.colorTheme,
        illustration: category.illustration.slice(0, 60),
        order: category.order,
        updatedAt: serverTimestamp(),
      });
    }
    await notifySeoRefresh();
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, docPath);
  }
}

export async function removeCategory(categoryId: string): Promise<void> {
  const docPath = `categories/${categoryId}`;
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
    await notifySeoRefresh();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}

export async function savePost(
  post: Omit<Post, 'authorUid' | 'createdAt' | 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('ابتدا باید با حساب گوگل مدیر وارد شوید.');
  const docPath = `posts/${post.id}`;

  const cleanKeywords = post.keywords
    .map((k) => k.trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 10);

  try {
    if (isNew) {
      await setDoc(doc(db, 'posts', post.id), {
        id: post.id,
        title: post.title.slice(0, 140),
        slug: post.slug.slice(0, 140),
        summary: post.summary.slice(0, 320),
        contentHtml: post.contentHtml.slice(0, 200000),
        categoryId: post.categoryId.slice(0, 64),
        categoryName: post.categoryName.slice(0, 60),
        coverImage: post.coverImage.slice(0, 300000),
        keywords: cleanKeywords,
        ageGroup: post.ageGroup.slice(0, 40),
        readingMinutes: Math.max(1, Math.min(120, Math.round(post.readingMinutes))),
        published: Boolean(post.published),
        authorName: post.authorName.slice(0, 60),
        authorUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'posts', post.id), {
        title: post.title.slice(0, 140),
        slug: post.slug.slice(0, 140),
        summary: post.summary.slice(0, 320),
        contentHtml: post.contentHtml.slice(0, 200000),
        categoryId: post.categoryId.slice(0, 64),
        categoryName: post.categoryName.slice(0, 60),
        coverImage: post.coverImage.slice(0, 300000),
        keywords: cleanKeywords,
        ageGroup: post.ageGroup.slice(0, 40),
        readingMinutes: Math.max(1, Math.min(120, Math.round(post.readingMinutes))),
        published: Boolean(post.published),
        authorName: post.authorName.slice(0, 60),
        updatedAt: serverTimestamp(),
      });
    }
    await notifySeoRefresh();
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, docPath);
  }
}

export async function removePost(postId: string): Promise<void> {
  const docPath = `posts/${postId}`;
  try {
    await deleteDoc(doc(db, 'posts', postId));
    await notifySeoRefresh();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}
