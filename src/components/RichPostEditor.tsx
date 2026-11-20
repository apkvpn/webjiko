import React, { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Eraser,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react';
import { estimateReadingMinutes, toPersianDigits } from '../utils/slugify';

interface RichPostEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const INK_COLORS = [
  { label: 'سرمه‌ای تیره', hex: '#0F172A' },
  { label: 'مرجانی', hex: '#E11D48' },
  { label: 'آبی آسمانی', hex: '#0284C7' },
  { label: 'سبز نعنایی', hex: '#059669' },
  { label: 'نارنجی آفتابی', hex: '#D97706' },
  { label: 'بنفش', hex: '#7C3AED' },
];

const HIGHLIGHT_COLORS = [
  { label: 'بدون هایلایت', hex: 'transparent' },
  { label: 'زرد لیمویی', hex: '#FEF08A' },
  { label: 'سبز روشن', hex: '#BBF7D0' },
  { label: 'آبی روشن', hex: '#BAE6FD' },
  { label: 'صورتی روشن', hex: '#FBCFE8' },
];

async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 900;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('تصویر خوانده نشد.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('خطا در خواندن فایل.'));
    reader.readAsDataURL(file);
  });
}

export const RichPostEditor: React.FC<RichPostEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [showInkPicker, setShowInkPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (!sourceMode && editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value, sourceMode]);

  const syncFromDom = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command: string, commandValue?: string) => {
    if (sourceMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncFromDom();
  };

  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = linkUrl.trim();
    if (!cleanUrl) return;
    editorRef.current?.focus();
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    const label = linkText.trim() || selectedText || cleanUrl;
    const safeUrl = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('/')
      ? cleanUrl
      : `https://${cleanUrl}`;
    const anchorHtml = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    document.execCommand('insertHTML', false, anchorHtml);
    syncFromDom();
    setLinkUrl('');
    setLinkText('');
    setShowLinkModal(false);
  };

  const handleInsertImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = imageUrl.trim();
    if (!cleanUrl) return;
    editorRef.current?.focus();
    const alt = (imageAlt.trim() || 'تصویر آموزشی وب‌جیکو').replace(/"/g, '&quot;');
    const imgHtml = `<img src="${cleanUrl}" alt="${alt}" />`;
    document.execCommand('insertHTML', false, imgHtml);
    syncFromDom();
    setImageUrl('');
    setImageAlt('');
    setShowImageModal(false);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      const dataUrl = await compressImageFile(file);
      if (dataUrl.length > 180000) {
        setUploadError('حجم تصویر پس از فشرده‌سازی هنوز زیاد است. لطفاً تصویر سبک‌تری انتخاب کنید.');
        return;
      }
      editorRef.current?.focus();
      const alt = (imageAlt.trim() || file.name.replace(/\.[^.]+$/, '')).replace(/"/g, '&quot;');
      document.execCommand('insertHTML', false, `<img src="${dataUrl}" alt="${alt}" />`);
      syncFromDom();
      setShowImageModal(false);
      setImageAlt('');
    } catch {
      setUploadError('امکان پردازش این تصویر وجود نداشت.');
    }
  };

  const plainText = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(' ').length : 0;
  const charCount = plainText.length;
  const readingMinutes = estimateReadingMinutes(value);

  const ToolBtn: React.FC<{
    title: string;
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
  }> = ({ title, onClick, active, children }) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`p-2 rounded-lg text-slate-700 hover:bg-sky-100 hover:text-sky-800 transition-colors cursor-pointer ${
        active ? 'bg-sky-100 text-sky-900' : ''
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border-2 border-slate-200 rounded-2xl bg-white overflow-hidden">
      {/* Precision Rich Toolbar */}
      <div className="bg-slate-50 border-b-2 border-slate-200 p-2 flex flex-wrap items-center gap-1">
        <ToolBtn title="بازگردانی (Undo)" onClick={() => exec('undo')}>
          <Undo2 className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="تکرار (Redo)" onClick={() => exec('redo')}>
          <Redo2 className="w-4 h-4" />
        </ToolBtn>

        <span className="w-px h-5 bg-slate-300 mx-1" aria-hidden="true" />

        <ToolBtn title="تیتر اصلی (H2)" onClick={() => exec('formatBlock', 'H2')}>
          <Heading2 className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="زیرتیتر (H3)" onClick={() => exec('formatBlock', 'H3')}>
          <Heading3 className="w-4 h-4" />
        </ToolBtn>
        <button
          type="button"
          title="پاراگراف معمولی"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('formatBlock', 'P')}
          className="px-2 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-sky-100 hover:text-sky-800 cursor-pointer"
        >
          متن
        </button>

        <span className="w-px h-5 bg-slate-300 mx-1" aria-hidden="true" />

        <ToolBtn title="ضخیم (Bold)" onClick={() => exec('bold')}>
          <Bold className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="کج (Italic)" onClick={() => exec('italic')}>
          <Italic className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="زیرخط (Underline)" onClick={() => exec('underline')}>
          <Underline className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="خط‌خورده" onClick={() => exec('strikeThrough')}>
          <Strikethrough className="w-4 h-4" />
        </ToolBtn>

        <span className="w-px h-5 bg-slate-300 mx-1" aria-hidden="true" />

        {/* Text Ink Color */}
        <div className="relative">
          <ToolBtn
            title="رنگ متن"
            active={showInkPicker}
            onClick={() => {
              setShowInkPicker((s) => !s);
              setShowHighlightPicker(false);
            }}
          >
            <Palette className="w-4 h-4" />
          </ToolBtn>
          {showInkPicker && (
            <div className="absolute right-0 top-10 z-20 bg-white border-2 border-slate-200 rounded-xl p-2 flex items-center gap-1.5 shadow-lg">
              {INK_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    exec('foreColor', c.hex);
                    setShowInkPicker(false);
                  }}
                  className="w-6 h-6 rounded-full border border-slate-300 cursor-pointer"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Highlight Color */}
        <div className="relative">
          <ToolBtn
            title="هایلایت متن"
            active={showHighlightPicker}
            onClick={() => {
              setShowHighlightPicker((s) => !s);
              setShowInkPicker(false);
            }}
          >
            <Highlighter className="w-4 h-4" />
          </ToolBtn>
          {showHighlightPicker && (
            <div className="absolute right-0 top-10 z-20 bg-white border-2 border-slate-200 rounded-xl p-2 flex items-center gap-1.5 shadow-lg">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    exec('hiliteColor', c.hex);
                    setShowHighlightPicker(false);
                  }}
                  className="w-6 h-6 rounded-full border border-slate-300 cursor-pointer"
                  style={{ backgroundColor: c.hex === 'transparent' ? '#FFFFFF' : c.hex }}
                />
              ))}
            </div>
          )}
        </div>

        <span className="w-px h-5 bg-slate-300 mx-1" aria-hidden="true" />

        <ToolBtn title="راست‌چین" onClick={() => exec('justifyRight')}>
          <AlignRight className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="وسط‌چین" onClick={() => exec('justifyCenter')}>
          <AlignCenter className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="چپ‌چین" onClick={() => exec('justifyLeft')}>
          <AlignLeft className="w-4 h-4" />
        </ToolBtn>

        <span className="w-px h-5 bg-slate-300 mx-1" aria-hidden="true" />

        <ToolBtn title="لیست نقطه‌ای" onClick={() => exec('insertUnorderedList')}>
          <List className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="لیست شماره‌دار" onClick={() => exec('insertOrderedList')}>
          <ListOrdered className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="جعبه نکته جالب / نقل‌قول" onClick={() => exec('formatBlock', 'BLOCKQUOTE')}>
          <Quote className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="خط جداکننده" onClick={() => exec('insertHorizontalRule')}>
          <Minus className="w-4 h-4" />
        </ToolBtn>

        <span className="w-px h-5 bg-slate-300 mx-1" aria-hidden="true" />

        <ToolBtn
          title="افزودن لینک"
          active={showLinkModal}
          onClick={() => {
            setShowLinkModal((s) => !s);
            setShowImageModal(false);
          }}
        >
          <LinkIcon className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn
          title="افزودن تصویر داخل متن"
          active={showImageModal}
          onClick={() => {
            setShowImageModal((s) => !s);
            setShowLinkModal(false);
          }}
        >
          <ImageIcon className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="پاک کردن فرمت متن انتخاب‌شده" onClick={() => exec('removeFormat')}>
          <Eraser className="w-4 h-4" />
        </ToolBtn>

        <div className="mr-auto">
          <button
            type="button"
            onClick={() => setSourceMode((s) => !s)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              sourceMode
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>{sourceMode ? 'نمای دیداری' : 'کد HTML'}</span>
          </button>
        </div>
      </div>

      {/* Inline Link Insertion Bar */}
      {showLinkModal && (
        <form
          onSubmit={handleInsertLink}
          className="bg-sky-50 border-b border-sky-200 p-3 flex flex-wrap items-center gap-2"
        >
          <input
            type="text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder="متن لینک (اختیاری)"
            className="px-3 py-1.5 rounded-lg border border-sky-200 bg-white text-xs w-44"
          />
          <input
            type="text"
            dir="ltr"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com or /post/..."
            className="px-3 py-1.5 rounded-lg border border-sky-200 bg-white text-xs flex-1 min-w-[200px]"
            required
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-[#0EA5E9] text-white text-xs font-bold cursor-pointer"
          >
            درج لینک
          </button>
          <button
            type="button"
            onClick={() => setShowLinkModal(false)}
            className="px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-white cursor-pointer"
          >
            بستن
          </button>
        </form>
      )}

      {/* Inline Image Insertion Bar */}
      {showImageModal && (
        <div className="bg-amber-50 border-b border-amber-200 p-3 space-y-2">
          <form onSubmit={handleInsertImageUrl} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              placeholder="توضیح تصویر (Alt برای سئو)"
              className="px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-xs w-48"
            />
            <input
              type="url"
              dir="ltr"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="آدرس اینترنتی تصویر (https://...)"
              className="px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-xs flex-1 min-w-[200px]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-[#F59E0B] text-slate-950 text-xs font-bold cursor-pointer"
            >
              درج از لینک
            </button>
            <label className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-bold text-slate-800 cursor-pointer hover:bg-amber-100">
              آپلود عکس از سیستم
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowImageModal(false)}
              className="px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-white cursor-pointer"
            >
              بستن
            </button>
          </form>
          {uploadError && <p className="text-xs font-bold text-rose-600">{uploadError}</p>}
        </div>
      )}

      {/* Editor Surface */}
      {sourceMode ? (
        <textarea
          dir="ltr"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={12}
          className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-950/5 focus:outline-none min-h-[260px]"
          placeholder="<p>متن HTML نوشته خود را اینجا بنویسید...</p>"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncFromDom}
          data-placeholder="داستان، آزمایش علمی یا آموزش جذاب خود را اینجا بنویسید..."
          className="webjiko-prose p-4 sm:p-5 min-h-[260px] max-h-[420px] overflow-y-auto focus:outline-none"
        />
      )}

      {/* Precision Stats Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500 tabular-nums">
        <div className="flex items-center gap-4">
          <span>تعداد کلمات: {toPersianDigits(wordCount)}</span>
          <span>تعداد حروف: {toPersianDigits(charCount)}</span>
          <span>زمان تخمینی مطالعه: {toPersianDigits(readingMinutes)} دقیقه</span>
        </div>
        <span>پشتیبانی از تیتربندی، لیست، نکته جالب، رنگ و تصویر</span>
      </div>
    </div>
  );
};
