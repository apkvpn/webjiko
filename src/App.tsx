import React, { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { AdminEditorDrawer } from './components/AdminEditorDrawer';
import { AllLinksDirectory } from './components/AllLinksDirectory';
import { CategoryArchiveView } from './components/CategoryArchiveView';
import { CategoryFilterBar } from './components/CategoryFilterBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { PostCard } from './components/PostCard';
import { PostDetailView } from './components/PostDetailView';
import { STARTER_CATEGORIES, STARTER_POSTS } from './data/starterContent';
import { auth } from './lib/firebase';
import { subscribeCategories, subscribePosts } from './lib/firestoreService';
import type { Category, Post } from './types/content';

const UNLOCK_STORAGE_KEY = 'webjiko_admin_unlocked_v1';
const ADMIN_EMAIL = 'roomfa.ir67@gmail.com';

function WebjikoApp() {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname || '/');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [firestoreCategories, setFirestoreCategories] = useState<Category[]>([]);
  const [firestorePosts, setFirestorePosts] = useState<Post[]>([]);
  const [catsLoaded, setCatsLoaded] = useState(false);
  const [postsLoaded, setPostsLoaded] = useState(false);

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(UNLOCK_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);

  const isGoogleAdmin =
    Boolean(firebaseUser?.emailVerified) && firebaseUser?.email === ADMIN_EMAIL;

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const unsubCats = subscribeCategories((items) => {
      setFirestoreCategories(items);
      setCatsLoaded(true);
    });
    return () => unsubCats();
  }, []);

  useEffect(() => {
    const unsubPosts = subscribePosts(isGoogleAdmin, (items) => {
      setFirestorePosts(items);
      setPostsLoaded(true);
    });
    return () => unsubPosts();
  }, [isGoogleAdmin]);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const hasFirestoreDocs = firestoreCategories.length > 0 || firestorePosts.length > 0;

  const categories: Category[] = useMemo(() => {
    if (catsLoaded && firestoreCategories.length > 0) {
      return firestoreCategories;
    }
    return STARTER_CATEGORIES;
  }, [catsLoaded, firestoreCategories]);

  const allPosts: Post[] = useMemo(() => {
    if (postsLoaded && firestorePosts.length > 0) {
      return firestorePosts;
    }
    return STARTER_POSTS;
  }, [postsLoaded, firestorePosts]);

  const publishedPosts = useMemo(
    () => allPosts.filter((p) => p.published),
    [allPosts]
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const navigate = (nextPath: string) => {
    if (nextPath !== pathname) {
      window.history.pushState({}, '', nextPath);
      setPathname(nextPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFocusSearch = () => {
    if (pathname !== '/') {
      navigate('/');
      window.setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
    } else {
      searchInputRef.current?.focus();
      searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Route matching
  const postMatch = pathname.match(/^\/post\/([^/]+)\/?$/);
  const categoryMatch = pathname.match(/^\/category\/([^/]+)\/?$/);

  const activePost = postMatch
    ? allPosts.find((p) => p.slug === decodeURIComponent(postMatch[1]))
    : undefined;

  const activeCategory = categoryMatch
    ? categories.find((c) => c.slug === decodeURIComponent(categoryMatch[1]))
    : undefined;

  // Dynamic Document Title & Meta Description sync
  useEffect(() => {
    const descEl = document.querySelector('meta[name="description"]');
    if (activePost) {
      document.title = `${activePost.title} | webjiko`;
      if (descEl) descEl.setAttribute('content', activePost.summary);
    } else if (activeCategory) {
      document.title = `${activeCategory.name} | webjiko`;
      if (descEl) descEl.setAttribute('content', activeCategory.description);
    } else {
      document.title = 'webjiko | دنیای شاد دانش، داستان و بازی فکری برای بچه‌های ۸ تا ۱۰ ساله';
      if (descEl) {
        descEl.setAttribute(
          'content',
          'وب‌جیکو (webjiko) یک مجله فارسی شاد و رنگارنگ پر از داستان‌های خیال‌انگیز، آزمایش‌های علمی ساده و معماهای جذاب برای بچه‌های ۸ تا ۱۰ ساله است.'
        );
      }
    }
  }, [activePost, activeCategory]);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return publishedPosts.filter((post) => {
      const matchesCat =
        selectedCategoryId === 'all' || post.categoryId === selectedCategoryId;
      const matchesQuery =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.summary.toLowerCase().includes(q) ||
        post.categoryName.toLowerCase().includes(q) ||
        (post.keywords || []).some((k) => k.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [publishedPosts, selectedCategoryId, searchQuery]);

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-[#FFFDF8] text-slate-900">
      <Navbar onNavigate={navigate} onFocusSearch={handleFocusSearch} />

      {activePost ? (
        <PostDetailView
          post={activePost}
          category={categoryMap.get(activePost.categoryId)}
          relatedPosts={publishedPosts.filter(
            (p) => p.id !== activePost.id && p.categoryId === activePost.categoryId
          )}
          categories={categories}
          onNavigate={navigate}
        />
      ) : activeCategory ? (
        <CategoryArchiveView
          category={activeCategory}
          posts={publishedPosts.filter((p) => p.categoryId === activeCategory.id)}
          onNavigate={navigate}
        />
      ) : (
        <main className="flex-1">
          <HeroSection
            totalPosts={publishedPosts.length}
            categories={categories}
            onSelectCategory={setSelectedCategoryId}
            onNavigate={navigate}
          />

          <CategoryFilterBar
            categories={categories}
            posts={publishedPosts}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchInputRef={searchInputRef}
          />

          <section
            id="posts-grid"
            aria-label="جدیدترین نوشته‌های وب‌جیکو"
            className="max-w-6xl mx-auto px-4 sm:px-6 py-4"
          >
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-slate-200 p-10 text-center">
                <p className="text-slate-700 font-bold text-base mb-3">
                  هیچ نوشته‌ای با این جستجو یا دسته‌بندی پیدا نشد!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId('all');
                    setSearchQuery('');
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-[#FF6B4A] hover:bg-[#F25836] border-b-4 border-[#C93B1C] text-white font-bold text-sm cursor-pointer"
                >
                  نمایش همه نوشته‌ها
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    category={categoryMap.get(post.categoryId)}
                    onNavigate={navigate}
                  />
                ))}
              </div>
            )}
          </section>

          <AllLinksDirectory
            posts={publishedPosts}
            categories={categories}
            onNavigate={navigate}
          />
        </main>
      )}

      <Footer
        categories={categories}
        isUnlocked={isUnlocked}
        onOpenAdminEditor={() => setIsEditorOpen(true)}
        onNavigate={navigate}
      />

      <AdminEditorDrawer
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        isUnlocked={isUnlocked}
        onUnlockSuccess={() => setIsUnlocked(true)}
        firebaseUser={firebaseUser}
        categories={categories}
        posts={allPosts}
        hasFirestoreDocs={hasFirestoreDocs}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <WebjikoApp />
    </ErrorBoundary>
  );
}
