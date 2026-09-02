import React from 'react';

interface CategoryIconProps {
  slug?: string;
  name?: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ slug = '', name = '', className = 'h-7 w-7' }) => {
  const key = (slug || name).toLowerCase();

  if (key.includes('fish') || key.includes('pesca') || key.includes('rod') || key.includes('anzol')) {
    // Fishing Hook / Fish icon
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.242-4.243a3 3 0 00-4.243 4.243L12 21" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4m0 0a2 2 0 100-4 2 2 0 000 4z" />
      </svg>
    );
  }

  if (key.includes('hunt') || key.includes('caça') || key.includes('caca') || key.includes('target') || key.includes('optics')) {
    // Target Crosshair / Hunting icon
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
      </svg>
    );
  }

  if (key.includes('camp') || key.includes('tent') || key.includes('tenda') || key.includes('outdoor')) {
    // Tent / Camping icon
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18L12 3 3 21z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21l4-7h-8l4 7z" />
      </svg>
    );
  }

  if (key.includes('reel') || key.includes('carreto') || key.includes('gear') || key.includes('mecan')) {
    // Reel / Gear icon
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  if (key.includes('apparel') || key.includes('vestuario') || key.includes('roupa') || key.includes('jacket') || key.includes('boot')) {
    // Shirt / Jacket icon
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }

  if (key.includes('knife') || key.includes('canivete') || key.includes('ferramenta') || key.includes('tool')) {
    // Pocket Knife / Tool icon
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    );
  }

  // Default Mountain / Compass Outdoor Icon
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 14l4-4 4 4m-4-4v9m0-13a9 9 0 110 18 9 9 0 010-18z" />
    </svg>
  );
};
