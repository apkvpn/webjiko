import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'خطای غیرمنتظره رخ داد.' };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen flex items-center justify-center bg-[#FFFDF8] p-6"
        >
          <div className="max-w-lg w-full bg-white border-2 border-[#FFD5CA] rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              اوه! مشکلی پیش آمد
            </h2>
            <p className="text-slate-600 text-sm leading-7 mb-6">
              ارتباط با بخش ذخیره‌سازی با خطا روبه‌رو شد. می‌توانید صفحه را تازه کنید تا دوباره تلاش کنیم.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-2xl bg-[#FF6B4A] hover:bg-[#F25836] border-b-4 border-[#C93B1C] text-white font-bold text-sm transition-transform active:translate-y-0.5 cursor-pointer"
            >
              تازه‌سازی صفحه
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
