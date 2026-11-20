import React, { useState } from 'react';
import type { IllustrationKey } from '../types/content';

interface IllustrationArtProps {
  variant?: IllustrationKey | string;
  className?: string;
}

export const IllustrationArt: React.FC<IllustrationArtProps> = ({
  variant = 'science',
  className = 'w-full h-full',
}) => {
  const key = variant.replace('preset:', '') as IllustrationKey;

  if (key === 'hero') {
    return (
      <svg
        viewBox="0 0 640 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect width="640" height="380" rx="28" fill="#E0F2FE" />
        <circle cx="530" cy="82" r="46" fill="#FBBF24" />
        <circle cx="530" cy="82" r="60" fill="#FDE68A" fillOpacity="0.45" />
        {/* Soft clouds */}
        <path
          d="M90 95C90 79 103 66 119 66C125 66 131 68 136 72C142 60 155 52 169 52C190 52 206 69 206 89C206 91 206 93 205 95H90Z"
          fill="#FFFFFF"
        />
        <path
          d="M320 75C320 63 330 53 342 53C347 53 352 55 356 58C361 48 371 42 383 42C399 42 412 55 412 71C412 73 412 74 411 75H320Z"
          fill="#FFFFFF"
          fillOpacity="0.85"
        />
        {/* Rolling green meadow */}
        <path d="M0 290C150 245 270 250 420 285C510 306 585 280 640 265V380H0V290Z" fill="#34D399" />
        <path d="M0 322C190 292 430 330 640 296V380H0V322Z" fill="#10B981" />
        {/* Colorful open storybook desk */}
        <rect x="130" y="168" width="210" height="135" rx="18" fill="#FFFFFF" stroke="#0284C7" strokeWidth="6" />
        <path d="M235 168V303" stroke="#BAE6FD" strokeWidth="5" />
        <rect x="152" y="192" width="64" height="14" rx="7" fill="#FF6B4A" />
        <rect x="152" y="218" width="60" height="10" rx="5" fill="#94A3B8" />
        <rect x="152" y="236" width="52" height="10" rx="5" fill="#CBD5E1" />
        <circle cx="285" cy="222" r="28" fill="#FDE047" />
        <path d="M285 198L291 214L308 215L295 225L299 242L285 233L271 242L275 225L262 215L279 214L285 198Z" fill="#F59E0B" />
        {/* Rocket */}
        <g transform="translate(415 110) rotate(16)">
          <path d="M40 0C62 22 72 52 72 86H8C8 52 18 22 40 0Z" fill="#FF6B4A" />
          <path d="M40 0C48 12 54 24 58 36H22C26 24 32 12 40 0Z" fill="#FBBF24" />
          <circle cx="40" cy="58" r="14" fill="#E0F2FE" stroke="#0284C7" strokeWidth="4" />
          <path d="M8 70L-10 96H14L8 70Z" fill="#8B5CF6" />
          <path d="M72 70L90 96H66L72 70Z" fill="#8B5CF6" />
          <path d="M24 88L40 124L56 88H24Z" fill="#F59E0B" />
        </g>
        {/* Paper airplane */}
        <path d="M84 176L154 148L124 198L114 178L84 176Z" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="4" strokeLinejoin="round" />
        {/* Pencils */}
        <rect x="498" y="218" width="22" height="84" rx="6" transform="rotate(-12 498 218)" fill="#8B5CF6" />
        <polygon points="498,218 520,213 506,192" fill="#FDE68A" />
      </svg>
    );
  }

  if (key === 'stories') {
    return (
      <svg viewBox="0 0 400 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
        <rect width="400" height="260" fill="#FFF1ED" />
        <circle cx="330" cy="58" r="32" fill="#FDE047" />
        <circle cx="72" cy="64" r="18" fill="#BAE6FD" />
        <path d="M62 182C62 170 72 160 84 160H194V220H78C69 220 62 213 62 204V182Z" fill="#FFFFFF" stroke="#FF6B4A" strokeWidth="5" />
        <path d="M338 182C338 170 328 160 316 160H206V220H322C331 220 338 213 338 204V182Z" fill="#FFFFFF" stroke="#FF6B4A" strokeWidth="5" />
        <rect x="200" y="156" width="8" height="68" rx="4" fill="#FF6B4A" />
        <path d="M120 112L218 76L176 138L160 116L120 112Z" fill="#0EA5E9" />
        <circle cx="255" cy="96" r="22" fill="#8B5CF6" />
        <circle cx="264" cy="90" r="6" fill="#FFFFFF" />
        <path d="M276 96L294 90L280 106Z" fill="#F59E0B" />
      </svg>
    );
  }

  if (key === 'puzzles') {
    return (
      <svg viewBox="0 0 400 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
        <rect width="400" height="260" fill="#FEF9C3" />
        <rect x="74" y="64" width="96" height="96" rx="18" fill="#8B5CF6" />
        <rect x="178" y="64" width="96" height="96" rx="18" fill="#FF6B4A" />
        <rect x="126" y="128" width="96" height="96" rx="18" fill="#10B981" />
        <polygon points="295,66 346,154 244,154" fill="#0EA5E9" />
        <circle cx="122" cy="112" r="20" fill="#FDE047" />
        <circle cx="226" cy="112" r="18" fill="#FFFFFF" />
        <path d="M158 176H190M174 160V192" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" />
      </svg>
    );
  }

  if (key === 'nature') {
    return (
      <svg viewBox="0 0 400 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
        <rect width="400" height="260" fill="#ECFDF5" />
        <circle cx="326" cy="56" r="26" fill="#FBBF24" />
        <path d="M0 198C95 162 210 170 400 192V260H0V198Z" fill="#34D399" />
        <rect x="184" y="122" width="28" height="92" rx="10" fill="#92400E" />
        <circle cx="198" cy="102" r="54" fill="#10B981" />
        <circle cx="158" cy="118" r="34" fill="#059669" />
        <circle cx="238" cy="118" r="34" fill="#34D399" />
        <circle cx="176" cy="96" r="9" fill="#FF6B4A" />
        <circle cx="220" cy="106" r="9" fill="#FF6B4A" />
        <circle cx="96" cy="170" r="14" fill="#F59E0B" />
        <circle cx="96" cy="170" r="6" fill="#FFFFFF" />
      </svg>
    );
  }

  // Default: science
  return (
    <svg viewBox="0 0 400 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="400" height="260" fill="#E0F2FE" />
      <circle cx="310" cy="68" r="34" fill="#8B5CF6" />
      <ellipse cx="310" cy="68" rx="54" ry="12" transform="rotate(-18 310 68)" stroke="#FBBF24" strokeWidth="6" />
      <circle cx="86" cy="62" r="14" fill="#FBBF24" />
      <circle cx="142" cy="44" r="7" fill="#FF6B4A" />
      {/* Beakers */}
      <path d="M108 110H156L176 206C178 214 172 222 163 222H101C92 222 86 214 88 206L108 110Z" fill="#FFFFFF" stroke="#0284C7" strokeWidth="5" />
      <path d="M97 172H167L174 205C175 212 170 218 163 218H101C94 218 89 212 90 205L97 172Z" fill="#10B981" />
      <circle cx="122" cy="152" r="7" fill="#34D399" />
      <circle cx="144" cy="138" r="5" fill="#34D399" />
      {/* Magnifier */}
      <circle cx="248" cy="148" r="40" fill="#FEF08A" stroke="#FF6B4A" strokeWidth="8" />
      <rect x="275" y="176" width="16" height="52" rx="8" transform="rotate(-42 275 176)" fill="#0284C7" />
    </svg>
  );
};

interface PostCoverProps {
  src: string;
  alt: string;
  className?: string;
}

export const PostCover: React.FC<PostCoverProps> = ({ src, alt, className = 'w-full h-full object-cover' }) => {
  const [failed, setFailed] = useState(false);

  const isPreset = !src || src.startsWith('preset:');
  if (isPreset || failed) {
    const presetKey = src?.startsWith('preset:') ? src : 'preset:science';
    return <IllustrationArt variant={presetKey} className={className} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
      loading="lazy"
    />
  );
};
