/** Circular loading indicator. Callers position it inside their own layout. */
export function Spinner() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="h-10 w-10 animate-spin rounded-full border-4 border-accent-strong border-t-transparent"
    />
  );
}
