/** Circular loading indicator. Callers supply its localized accessible name and position it in their layout. */
export function Spinner({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="h-10 w-10 animate-spin rounded-full border-4 border-accent-strong border-t-transparent"
    />
  );
}
