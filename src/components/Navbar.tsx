import React from 'react';
import { Search } from 'lucide-react';

interface NavbarProps {
  onNavigate: (path: string) => void;
  onFocusSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onFocusSearch }) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string, hash?: string) => {
    e.preventDefault();
    onNavigate(path);
    if (hash) {
      window.setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FFFDF8]/95 backdrop-blur-sm border-b-2 border-[#E2E8F0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          className="font-display text-2xl sm:text-3xl text-[#FF6B4A] hover:text-[#E85738] transition-colors whitespace-nowrap shrink-0"
        >
          webjiko
        </a>

        {/* Zone 2: 4 concise single-line text links */}
        <nav
          aria-label="منوی اصلی وب‌جیکو"
          className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-700"
        >
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, '/')}
            className="hover:text-[#FF6B4A] hover:underline underline-offset-8 decoration-2 transition-colors whitespace-nowrap shrink-0"
          >
            صفحه نخست
          </a>
          <a
            href="/#categories-section"
            onClick={(e) => handleLinkClick(e, '/', 'categories-section')}
            className="hover:text-[#0EA5E9] hover:underline underline-offset-8 decoration-2 transition-colors whitespace-nowrap shrink-0"
          >
            دسته‌بندی‌ها
          </a>
          <a
            href="/#all-posts-links"
            onClick={(e) => handleLinkClick(e, '/', 'all-posts-links')}
            className="hover:text-[#10B981] hover:underline underline-offset-8 decoration-2 transition-colors whitespace-nowrap shrink-0"
          >
            لینک همه نوشته‌ها
          </a>
          <a
            href="/#about-webjiko"
            onClick={(e) => handleLinkClick(e, '/', 'about-webjiko')}
            className="hover:text-[#8B5CF6] hover:underline underline-offset-8 decoration-2 transition-colors whitespace-nowrap shrink-0"
          >
            درباره وب‌جیکو
          </a>
        </nav>

        {/* Zone 3: 1 primary tactile CTA button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onFocusSearch}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] border-b-4 border-[#0369A1] text-white font-bold text-xs sm:text-sm transition-all active:translate-y-0.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>جستجو</span>
          </button>
        </div>
      </div>
    </header>
  );
};
