import React from 'react';
import { Lock, PenSquare, Unlock } from 'lucide-react';
import type { Category } from '../types/content';

interface FooterProps {
  categories: Category[];
  isUnlocked: boolean;
  onOpenAdminEditor: () => void;
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  categories,
  isUnlocked,
  onOpenAdminEditor,
  onNavigate,
}) => {
  return (
    <footer id="about-webjiko" className="mt-16 bg-white border-t-2 border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-200">
          <div className="md:col-span-6">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
              className="font-display text-3xl text-[#FF6B4A] inline-block mb-3"
            >
              webjiko
            </a>
            <p className="text-sm text-slate-600 leading-7 max-w-md">
              وب‌جیکو یک پلتفرم ایرانی و شاد برای بچه‌های ۸ تا ۱۰ ساله است؛ پر از آزمایش‌های علمی،
              قصه‌های کوتاه، معماهای فکری و کاردستی‌های رنگارنگ که همه‌شان با عشق و دقت نوشته شده‌اند.
            </p>
          </div>

          <div className="md:col-span-3">
            <h3 className="font-extrabold text-sm text-slate-900 mb-3">دسته‌بندی‌های وب‌جیکو</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`/category/${cat.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/category/${cat.slug}`);
                    }}
                    className="hover:text-[#0284C7] hover:underline"
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="font-extrabold text-sm text-slate-900 mb-3">دسترسی سریع</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/');
                  }}
                  className="hover:text-[#FF6B4A] hover:underline"
                >
                  صفحه نخست
                </a>
              </li>
              <li>
                <a
                  href="/#all-posts-links"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/');
                    window.setTimeout(() => {
                      document.getElementById('all-posts-links')?.scrollIntoView({
                        behavior: 'smooth',
                      });
                    }, 60);
                  }}
                  className="hover:text-[#10B981] hover:underline"
                >
                  فهرست لینک همه نوشته‌ها
                </a>
              </li>
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#8B5CF6] hover:underline"
                >
                  نقشه سایت گوگل (Sitemap)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Minimized Admin Editor Trigger in Footer */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © ۱۴۰۵ وب‌جیکو (webjiko) · تمامی مطالب مناسب کودکان ۸ تا ۱۰ سال و دوست‌دار کنجکاوی است.
          </p>

          <button
            type="button"
            onClick={onOpenAdminEditor}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:translate-y-0.5 ${
              isUnlocked
                ? 'bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] border-2 border-[#A7F3D0]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            {isUnlocked ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <PenSquare className="w-3.5 h-3.5" />
                <span>ادیتور پست‌نویس مدیر (باز کردن)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>ادیتور مینیمایز ادمین</span>
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
};
