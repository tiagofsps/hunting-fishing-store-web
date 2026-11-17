/**
 * Shared Tailwind class strings for the form atoms in `components/ui/`.
 * Keep these in one place so every form control looks the same.
 */
export const FIELD_CONTROL_CLASS =
  'w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong text-ink font-medium';

export const FIELD_LABEL_CLASS = 'mb-1 block text-xs font-bold text-ink';

/** Joins the base classes with an optional caller-supplied className. */
export function joinClasses(base: string, extra?: string): string {
  return extra ? `${base} ${extra}` : base;
}
