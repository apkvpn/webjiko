import React, { useEffect, useState } from 'react';
import { signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  CheckCircle2,
  Edit3,
  FolderPlus,
  KeyRound,
  LogOut,
  Minimize2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import {
  ensureStarterSeededInFirestore,
  removeCategory,
  removePost,
  saveCategory,
  savePost,
} from '../lib/firestoreService';
import type { Category, ColorTheme, Post } from '../types/content';
import { estimateReadingMinutes, toPersianDigits, toSeoSlug } from '../utils/slugify';
import { THEME_MAP } from '../utils/theme';
import { RichPostEditor } from './RichPostEditor';

const ADMIN_PASSCODE = '1213+';
const UNLOCK_STORAGE_KEY = 'webjiko_admin_unlocked_v1';
const DRAFT_STORAGE_KEY = 'webjiko_admin_draft_v1';
const ADMIN_EMAIL = 'roomfa.ir67@gmail.com';

interface AdminEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
  onUnlockSuccess: () => void;
  firebaseUser: User | null;
  categories: Category[];
  posts: Post[];
  hasFirestoreDocs: boolean;
}

type AdminTab = 'write' | 'posts' | 'categories';

const ILLUSTRATION_OPTIONS = [
  { key: 'preset:science', label: 'تصویر علم و فضا' },
  { key: 'preset:stories', label: 'تصویر کتاب و داستان' },
  { key: 'preset:puzzles', label: 'تصویر معما و بازی فکری' },
  { key: 'preset:nature', label: 'تصویر طبیعت و کاردستی' },
  { key: 'preset:hero', label: 'تصویر کتابخانه درختی' },
];

export const AdminEditorDrawer: React.FC<AdminEditorDrawerProps> = ({
  isOpen,
  onClose,
  isUnlocked,
  onUnlockSuccess,
  firebaseUser,
  categories,
  posts,
  hasFirestoreDocs,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('write');

  // Post Form State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [summary, setSummary] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [coverImage, setCoverImage] = useState('preset:science');
  const [keywordsText, setKeywordsText] = useState('');
  const [ageGroup, setAgeGroup] = useState('۸ تا ۱۰ سال');
  const [authorName, setAuthorName] = useState('مدیر وب‌جیکو');
  const [published, setPublished] = useState(true);

  // Quick Inline Category Creator inside Write tab
  const [showQuickCat, setShowQuickCat] = useState(false);
  const [quickCatName, setQuickCatName] = useState('');
  const [quickCatTheme, setQuickCatTheme] = useState<ColorTheme>('coral');

  // Category Management State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catTheme, setCatTheme] = useState<ColorTheme>('sky');
  const [catIllustration, setCatIllustration] = useState('preset:science');
  const [catOrder, setCatOrder] = useState(1);

  // Action feedback & confirmation states
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<string | null>(null);
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null);

  const isGoogleAdmin =
    Boolean(firebaseUser?.emailVerified) && firebaseUser?.email === ADMIN_EMAIL;

  // Restore saved draft when opening new post
  useEffect(() => {
    if (!editingPostId && isUnlocked) {
      try {
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.slug) setSlug(parsed.slug);
          if (parsed.summary) setSummary(parsed.summary);
          if (parsed.contentHtml) setContentHtml(parsed.contentHtml);
          if (parsed.categoryId) setCategoryId(parsed.categoryId);
          if (parsed.coverImage) setCoverImage(parsed.coverImage);
          if (parsed.keywordsText) setKeywordsText(parsed.keywordsText);
        }
      } catch {
        // ignore invalid draft
      }
    }
  }, [isUnlocked, editingPostId]);

  // Persist draft automatically while typing
  useEffect(() => {
    if (!editingPostId && isUnlocked) {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            title,
            slug,
            summary,
            contentHtml,
            categoryId,
            coverImage,
            keywordsText,
          })
        );
      } catch {
        // ignore storage quota
      }
    }
  }, [title, slug, summary, contentHtml, categoryId, coverImage, keywordsText, editingPostId, isUnlocked]);

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugTouched && !editingPostId) {
      setSlug(toSeoSlug(val, 'webjiko'));
    }
  };

  const resetPostForm = () => {
    setEditingPostId(null);
    setTitle('');
    setSlug('');
    setSlugTouched(false);
    setSummary('');
    setContentHtml('');
    setCoverImage('preset:science');
    setKeywordsText('');
    setAgeGroup('۸ تا ۱۰ سال');
    setPublished(true);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === ADMIN_PASSCODE) {
      localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
      setPasswordError('');
      setPasswordInput('');
      onUnlockSuccess();
    } else {
      setPasswordError('رمز عبور نادرست است! لطفاً رمز صحیح را وارد کنید.');
    }
  };

  const handleGoogleConnect = async () => {
    setFeedback(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user.email !== ADMIN_EMAIL) {
        setFeedback({
          type: 'err',
          text: `شما با ایمیل ${cred.user.email} وارد شدید، اما دسترسی مدیر فقط برای ایمیل ${ADMIN_EMAIL} فعال است.`,
        });
        return;
      }
      await ensureStarterSeededInFirestore();
      setFeedback({
        type: 'ok',
        text: 'حساب گوگل مدیر با موفقیت متصل شد و دسترسی همیشگی شما فعال است.',
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'خطا در ورود با حساب گوگل.',
      });
    }
  };

  const ensureSeedBeforeWrite = async () => {
    if (!hasFirestoreDocs) {
      await ensureStarterSeededInFirestore();
    }
  };

  const handleQuickCategoryCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCatName.trim()) return;
    if (!isGoogleAdmin) {
      setFeedback({
        type: 'err',
        text: 'لطفاً ابتدا دکمه «اتصال یک‌باره با حساب گوگل مدیر» را بزنید تا تغییرات ذخیره شوند.',
      });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await ensureSeedBeforeWrite();
      const newSlug = toSeoSlug(quickCatName, 'category');
      const newId = `cat-${newSlug.slice(0, 40)}-${Date.now().toString(36).slice(-4)}`;
      await saveCategory(
        {
          id: newId,
          name: quickCatName.trim(),
          slug: newSlug,
          description: `مطالب جذاب و خواندنی درباره ${quickCatName.trim()} برای کودکان ۸ تا ۱۰ ساله.`,
          colorTheme: quickCatTheme,
          illustration: 'preset:science',
          order: categories.length + 1,
        },
        true
      );
      setCategoryId(newId);
      setQuickCatName('');
      setShowQuickCat(false);
      setFeedback({ type: 'ok', text: `دسته‌بندی «${quickCatName.trim()}» ساخته شد و انتخاب گردید.` });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'خطا در ساخت دسته‌بندی.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGoogleAdmin) {
      setFeedback({
        type: 'err',
        text: 'برای ذخیره پست در پایگاه داده، یک‌بار اتصال حساب گوگل مدیر را در بالای ادیتور انجام دهید.',
      });
      return;
    }
    if (!title.trim() || !contentHtml.trim()) {
      setFeedback({ type: 'err', text: 'عنوان و متن نوشته نمی‌تواند خالی باشد.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await ensureSeedBeforeWrite();
      const targetCat = categories.find((c) => c.id === categoryId) ?? categories[0];
      if (!targetCat) {
        throw new Error('ابتدا یک دسته‌بندی ایجاد کنید.');
      }

      const finalSlug = toSeoSlug(slug || title, 'post');
      const postId = editingPostId || `post-${finalSlug.slice(0, 48)}-${Date.now().toString(36).slice(-4)}`;
      const plainSummary =
        summary.trim() ||
        contentHtml
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 155);

      const keywords = keywordsText
        .split(/[،,]/)
        .map((k) => k.trim())
        .filter(Boolean);

      await savePost(
        {
          id: postId,
          title: title.trim(),
          slug: finalSlug,
          summary: plainSummary,
          contentHtml: contentHtml.trim(),
          categoryId: targetCat.id,
          categoryName: targetCat.name,
          coverImage: coverImage.trim() || targetCat.illustration || 'preset:science',
          keywords,
          ageGroup: ageGroup.trim() || '۸ تا ۱۰ سال',
          readingMinutes: estimateReadingMinutes(contentHtml),
          published,
          authorName: authorName.trim() || 'مدیر وب‌جیکو',
        },
        !editingPostId
      );

      setFeedback({
        type: 'ok',
        text: editingPostId
          ? 'نوشته با موفقیت ویرایش شد و در سایت به‌روزرسانی گردید!'
          : 'پست جدید با موفقیت منتشر شد و هم‌اکنون در صفحه نخست و فهرست لینک‌ها قرار گرفت!',
      });
      resetPostForm();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'خطا در ذخیره نوشته.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditPostClick = (post: Post) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setSlugTouched(true);
    setCategoryId(post.categoryId);
    setSummary(post.summary);
    setContentHtml(post.contentHtml);
    setCoverImage(post.coverImage);
    setKeywordsText((post.keywords || []).join('، '));
    setAgeGroup(post.ageGroup || '۸ تا ۱۰ سال');
    setAuthorName(post.authorName || 'مدیر وب‌جیکو');
    setPublished(post.published);
    setActiveTab('write');
    setFeedback(null);
  };

  const handleTogglePostPublish = async (post: Post) => {
    if (!isGoogleAdmin) return;
    setSaving(true);
    try {
      await ensureSeedBeforeWrite();
      await savePost({ ...post, published: !post.published }, false);
      setFeedback({
        type: 'ok',
        text: !post.published ? 'نوشته منتشر شد.' : 'نوشته به حالت پیش‌نویس رفت.',
      });
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'خطا در تغییر وضعیت.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!isGoogleAdmin) return;
    setSaving(true);
    try {
      await ensureSeedBeforeWrite();
      await removePost(postId);
      setConfirmDeletePostId(null);
      setFeedback({ type: 'ok', text: 'نوشته حذف شد.' });
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'خطا در حذف نوشته.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGoogleAdmin) {
      setFeedback({
        type: 'err',
        text: 'ابتدا حساب گوگل مدیر را متصل کنید.',
      });
      return;
    }
    if (!catName.trim()) return;

    setSaving(true);
    setFeedback(null);
    try {
      await ensureSeedBeforeWrite();
      const finalSlug = toSeoSlug(catSlug || catName, 'cat');
      const catId = editingCatId || `cat-${finalSlug.slice(0, 40)}-${Date.now().toString(36).slice(-4)}`;
      await saveCategory(
        {
          id: catId,
          name: catName.trim(),
          slug: finalSlug,
          description:
            catDescription.trim() || `مطالب آموزشی و سرگرم‌کننده درباره ${catName.trim()}`,
          colorTheme: catTheme,
          illustration: catIllustration,
          order: Number(catOrder) || categories.length + 1,
        },
        !editingCatId
      );
      setEditingCatId(null);
      setCatName('');
      setCatSlug('');
      setCatDescription('');
      setCatOrder(categories.length + 2);
      setFeedback({ type: 'ok', text: 'دسته‌بندی با موفقیت ذخیره شد.' });
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'خطا در ذخیره دسته.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!isGoogleAdmin) return;
    const usedByPosts = posts.some((p) => p.categoryId === catId);
    if (usedByPosts) {
      setFeedback({
        type: 'err',
        text: 'این دسته‌بندی هنوز دارای نوشته است. ابتدا نوشته‌های آن را به دسته دیگری منتقل یا حذف کنید.',
      });
      setConfirmDeleteCatId(null);
      return;
    }
    setSaving(true);
    try {
      await ensureSeedBeforeWrite();
      await removeCategory(catId);
      setConfirmDeleteCatId(null);
      setFeedback({ type: 'ok', text: 'دسته‌بندی حذف شد.' });
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'خطا در حذف دسته.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Password Gate Modal (shown only once before permanent unlock)
  if (!isUnlocked) {
    return (
      <div
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-lock-title"
      >
        <div className="bg-white w-full max-w-md rounded-3xl border-2 border-[#BAE6FD] p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 text-[#0284C7] font-extrabold text-sm">
              <KeyRound className="w-5 h-5" />
              <span id="admin-lock-title">ورود یک‌باره مدیر وب‌جیکو</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-slate-600 leading-7 mb-5">
            رمز عبور مدیریت را یک بار وارد کنید تا ادیتور حرفه‌ای پست‌نویس برای همیشه روی این دستگاه فعال شود.
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-passcode-input" className="block text-xs font-bold text-slate-700 mb-1.5">
                رمز عبور ادمین
              </label>
              <input
                id="admin-passcode-input"
                type="password"
                dir="ltr"
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="•••••"
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-[#0EA5E9] focus:outline-none text-center text-lg font-bold tracking-widest"
                required
              />
            </div>

            {passwordError && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                {passwordError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#FF6B4A] hover:bg-[#F25836] border-b-4 border-[#C93B1C] text-white font-extrabold text-sm transition-all active:translate-y-0.5 cursor-pointer"
            >
              باز کردن دائمی ادیتور
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Unlocked Slide-up Full Precision Admin Editor Drawer
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 bg-white border-t-4 border-[#0EA5E9] shadow-2xl max-h-[88vh] flex flex-col"
      role="dialog"
      aria-label="پنل ادیتور حرفه‌ای وب‌جیکو"
    >
      {/* Top Drawer Header */}
      <div className="bg-[#FFFDF8] border-b-2 border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display text-xl text-[#FF6B4A]">ادیتور وب‌جیکو</span>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                activeTab === 'write' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {editingPostId ? 'ویرایش نوشته' : 'نوشتن پست جدید'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors tabular-nums ${
                activeTab === 'posts' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              همه نوشته‌ها ({toPersianDigits(posts.length)})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors tabular-nums ${
                activeTab === 'categories' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              دسته‌بندی‌ها ({toPersianDigits(categories.length)})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isGoogleAdmin ? (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">متصل: {firebaseUser?.email}</span>
              <button
                type="button"
                onClick={() => void signOut(auth)}
                title="خروج از حساب گوگل"
                className="text-slate-500 hover:text-rose-600 cursor-pointer mr-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleConnect}
              className="px-3.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] border-b-4 border-[#047857] text-white font-bold text-xs cursor-pointer transition-all active:translate-y-0.5"
            >
              اتصال یک‌باره حساب گوگل مدیر
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            title="مینیمایز کردن ادیتور به فوتر"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
          >
            <Minimize2 className="w-4 h-4" />
            <span>مینیمایز در فوتر</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`px-6 py-2.5 text-xs font-bold border-b ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-6xl w-full mx-auto">
        {activeTab === 'write' && (
          <form onSubmit={handleSavePost} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Editor Column */}
            <div className="lg:col-span-8 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  عنوان نوشته (تیتر H1 و سئو)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="مثلاً: چرا آسمان آبی است و در غروب قرمز می‌شود؟"
                  maxLength={140}
                  required
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-[#0EA5E9] focus:outline-none text-base font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  متن کامل و قالب‌بندی‌شده پست
                </label>
                <RichPostEditor value={contentHtml} onChange={setContentHtml} />
              </div>
            </div>

            {/* SEO & Metadata Side Column */}
            <div className="lg:col-span-4 space-y-4 bg-[#FFFDF8] border-2 border-slate-200 rounded-3xl p-4 sm:p-5 h-fit">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">تنظیمات انتشار و سئو گوگل</h3>
                {editingPostId && (
                  <button
                    type="button"
                    onClick={resetPostForm}
                    className="text-xs font-bold text-[#0284C7] hover:underline cursor-pointer"
                  >
                    + پست جدید
                  </button>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">دسته‌بندی</label>
                  <button
                    type="button"
                    onClick={() => setShowQuickCat((s) => !s)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0284C7] hover:underline cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>افزودن دسته جدید</span>
                  </button>
                </div>

                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                {showQuickCat && (
                  <div className="mt-2.5 p-3 rounded-xl bg-sky-50 border border-sky-200 space-y-2">
                    <input
                      type="text"
                      value={quickCatName}
                      onChange={(e) => setQuickCatName(e.target.value)}
                      placeholder="نام دسته‌بندی جدید..."
                      className="w-full px-3 py-1.5 rounded-lg border border-sky-200 bg-white text-xs font-bold"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={quickCatTheme}
                        onChange={(e) => setQuickCatTheme(e.target.value as ColorTheme)}
                        className="px-2.5 py-1.5 rounded-lg border border-sky-200 bg-white text-xs font-bold"
                      >
                        {Object.entries(THEME_MAP).map(([key, t]) => (
                          <option key={key} value={key}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleQuickCategoryCreate}
                        disabled={saving}
                        className="px-3 py-1.5 rounded-lg bg-[#0EA5E9] text-white text-xs font-bold cursor-pointer"
                      >
                        ایجاد دسته
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  آدرس لینک سئو (Slug)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                  }}
                  placeholder="why-sky-is-blue"
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-slate-200 bg-white text-xs font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1 dir-ltr truncate" dir="ltr">
                  /post/{slug || '...'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">توضیحات متا سئو (Summary)</label>
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    {toPersianDigits(summary.length)} / ۱۶۰
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={320}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="خلاصه جذاب ۱ تا ۲ جمله‌ای برای نمایش در گوگل و کارت صفحه نخست..."
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-slate-200 bg-white text-xs leading-6"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تصویر جلد نوشته (پیشنهادی یا لینک تصویر)
                </label>
                <select
                  value={coverImage.startsWith('preset:') ? coverImage : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') setCoverImage(e.target.value);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold mb-2"
                >
                  {ILLUSTRATION_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                  <option value="custom">آدرس تصویر دلخواه</option>
                </select>
                {!coverImage.startsWith('preset:') && (
                  <input
                    type="url"
                    dir="ltr"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 rounded-xl border-2 border-slate-200 bg-white text-xs"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">گروه سنی</label>
                  <input
                    type="text"
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نام نویسنده</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  کلمات کلیدی سئو (با ویرگول جدا کنید)
                </label>
                <input
                  type="text"
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  placeholder="علم کودکان، داستان فارسی، بازی فکری"
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-slate-200 bg-white text-xs"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-4 h-4 accent-[#10B981]"
                />
                <span className="text-xs font-extrabold text-slate-800">
                  انتشار فوری در صفحه نخست و فهرست گوگل
                </span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#FF6B4A] hover:bg-[#F25836] border-b-4 border-[#C93B1C] text-white font-extrabold text-sm transition-all active:translate-y-0.5 cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>
                  {saving
                    ? 'در حال ذخیره...'
                    : editingPostId
                    ? 'ذخیره تغییرات نوشته'
                    : 'انتشار فوری در صفحه نخست'}
                </span>
              </button>
            </div>
          </form>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-base text-slate-900">مدیریت تمام نوشته‌های وب‌جیکو</h3>
              <button
                type="button"
                onClick={() => {
                  resetPostForm();
                  setActiveTab('write');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6B4A] text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>نوشته جدید</span>
              </button>
            </div>

            {posts.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border-2 border-slate-200 bg-white"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-slate-900 truncate">{p.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                    <span>{p.categoryName}</span>
                    <span>·</span>
                    <span dir="ltr">/post/{p.slug}</span>
                    <span>·</span>
                    <span className={p.published ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                      {p.published ? 'منتشرشده' : 'پیش‌نویس'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditPostClick(p)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>ویرایش</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePostPublish(p)}
                    disabled={!isGoogleAdmin || saving}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {p.published ? 'تبدیل به پیش‌نویس' : 'انتشار'}
                  </button>

                  {confirmDeletePostId === p.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeletePost(p.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
                      >
                        تأیید حذف
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeletePostId(null)}
                        className="px-2 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        لغو
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeletePostId(p.id)}
                      disabled={!isGoogleAdmin}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-40"
                      title="حذف نوشته"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveCategory}
              className="lg:col-span-5 bg-[#FFFDF8] border-2 border-slate-200 rounded-3xl p-5 space-y-4 h-fit"
            >
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingCatId ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نام دسته‌بندی</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!editingCatId) setCatSlug(toSeoSlug(e.target.value, 'category'));
                  }}
                  placeholder="مثلاً: نجوم و ستاره‌شناسی"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">آدرس سئو (Slug)</label>
                <input
                  type="text"
                  dir="ltr"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="astronomy-kids"
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-slate-200 bg-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات دسته</label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="توضیح کوتاه برای بچه‌ها و موتورهای جستجو..."
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-slate-200 bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رنگ دکمه‌ها</label>
                  <select
                    value={catTheme}
                    onChange={(e) => setCatTheme(e.target.value as ColorTheme)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold"
                  >
                    {Object.entries(THEME_MAP).map(([key, t]) => (
                      <option key={key} value={key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ترتیب نمایش</label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={catOrder}
                    onChange={(e) => setCatOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تصویر پیش‌فرض</label>
                <select
                  value={catIllustration}
                  onChange={(e) => setCatIllustration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold"
                >
                  {ILLUSTRATION_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-2xl bg-[#10B981] hover:bg-[#059669] border-b-4 border-[#047857] text-white font-extrabold text-xs cursor-pointer"
                >
                  {editingCatId ? 'ذخیره تغییرات دسته' : 'افزودن دسته‌بندی'}
                </button>
                {editingCatId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCatId(null);
                      setCatName('');
                      setCatSlug('');
                      setCatDescription('');
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    انصراف
                  </button>
                )}
              </div>
            </form>

            <div className="lg:col-span-7 space-y-3">
              {categories.map((cat) => {
                const theme = THEME_MAP[cat.colorTheme] ?? THEME_MAP.sky;
                const count = posts.filter((p) => p.categoryId === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border-2 border-slate-200 bg-white"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: theme.swatchHex }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900">{cat.name}</div>
                        <div className="text-xs text-slate-500">
                          <span dir="ltr">/category/{cat.slug}</span> · {toPersianDigits(count)} نوشته
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setCatName(cat.name);
                          setCatSlug(cat.slug);
                          setCatDescription(cat.description);
                          setCatTheme(cat.colorTheme);
                          setCatIllustration(cat.illustration);
                          setCatOrder(cat.order);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold cursor-pointer"
                      >
                        ویرایش
                      </button>

                      {confirmDeleteCatId === cat.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
                          >
                            حذف شود؟
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCatId(null)}
                            className="px-2 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                          >
                            خیر
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCatId(cat.id)}
                          disabled={!isGoogleAdmin}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
