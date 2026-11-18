import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

export interface NavLinkItem {
  id: number;
  label: string;
  to: string;
  meta?: string;
  image?: string;
  children?: NavLinkItem[];
}

interface NavMenuListProps {
  items: NavLinkItem[];
  onNavigate: () => void;
  className?: string;
}

/** Renders a (optionally nested) list of catalog links; shared by the desktop dropdowns and the mobile drawer. */
export function NavMenuList({ items, onNavigate, className = '' }: NavMenuListProps): ReactNode {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to={item.to}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-body transition-colors hover:bg-surface-hover hover:text-accent-strong"
          >
            {item.image && (
              <img src={item.image} alt="" className="h-5 w-auto max-w-[72px] object-contain" aria-hidden="true" />
            )}
            <span className="flex-1">{item.label}</span>
            {item.meta && <span className="text-xs font-semibold text-muted">{item.meta}</span>}
          </Link>
          {item.children && item.children.length > 0 && (
            <ul className="ml-4 border-l border-border pl-2">
              <NavMenuList items={item.children} onNavigate={onNavigate} />
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

interface NavDropdownProps {
  label: string;
  items: NavLinkItem[];
}

export default function NavDropdown({ label, items }: NavDropdownProps) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        // Hovering already opens the menu before a mouse click. Keep click
        // idempotent rather than toggling it closed in the same interaction.
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[13px] font-bold tracking-wide text-body transition-colors hover:text-accent-strong"
      >
        {label}
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50">
          {/* The padding keeps the hover bridge over the gap between trigger and panel. */}
          <div className="pt-3">
            <div className="max-h-[70vh] min-w-60 overflow-y-auto rounded-2xl border border-border bg-surface-raised p-2 shadow-xl">
              <NavMenuList items={items} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
