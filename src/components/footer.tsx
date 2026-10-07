import { Link } from "react-router";
import { useLanguage } from "../i18n/useLanguage";
import { STORE_CONFIG } from "../config/store";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-surface-raised py-16 text-xs text-body">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Col */}
          <div>
            <a
              href="#home"
              className="flex shrink-0 items-center gap-3 text-ink group"
              aria-label={STORE_CONFIG.name}
            >
              <img
                src="/logo.png"
                alt={STORE_CONFIG.name}
                className="h-20 group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="text-[15px] font-black uppercase tracking-[0.18em] text-ink leading-tight">
                  {STORE_CONFIG.name}
                </span>
                <span className="text-[10px] font-bold tracking-widest text-accent-strong uppercase">
                  {STORE_CONFIG.shortDescription}
                </span>
              </div>
            </a>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              {t("footer.description")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold uppercase tracking-wider text-ink mb-4">
              {t("footer.storeHeading")}
            </h4>
            <ul className="space-y-2 font-medium">
              <li>
                <Link
                  to="/"
                  className="hover:text-accent-strong transition-colors"
                >
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link
                  to="/shop"
                  className="hover:text-accent-strong transition-colors"
                >
                  {t("nav.shop")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="font-bold uppercase tracking-wider text-ink mb-4">
              {t("footer.supportHeading")}
            </h4>
            <ul className="space-y-2 font-medium">
              <li>
                <a
                  href="#home"
                  className="hover:text-accent-strong transition-colors"
                >
                  {t("footer.terms")}
                </a>
              </li>
              <li>
                <a
                  href="#home"
                  className="hover:text-accent-strong transition-colors"
                >
                  {t("footer.privacy")}
                </a>
              </li>
              <li>
                <a
                  href="#home"
                  className="hover:text-accent-strong transition-colors"
                >
                  {t("footer.licensing")}
                </a>
              </li>
              <li>
                <a
                  href="#home"
                  className="hover:text-accent-strong transition-colors"
                >
                  {t("footer.returns")}
                </a>
              </li>
            </ul>
          </div>

          {/* Store Contacts */}
          <div>
            <h4 className="font-bold uppercase tracking-wider text-ink mb-4">
              {t("footer.locationHeading")}
            </h4>
            <p className="font-medium text-ink">{STORE_CONFIG.name} Store</p>
            <p className="mt-1 text-muted">{STORE_CONFIG.address.street}</p>
            <p className="text-muted">
              {STORE_CONFIG.address.postalCode} {STORE_CONFIG.address.city},{" "}
              {STORE_CONFIG.address.country}
            </p>
            <p className="mt-3 font-semibold text-accent-strong">
              <a
                href={`mailto:${STORE_CONFIG.email}`}
                className="hover:underline"
              >
                {STORE_CONFIG.email}
              </a>
            </p>
            <p className="font-semibold text-ink">
              <a href={`tel:${STORE_CONFIG.phone}`} className="hover:underline">
                {STORE_CONFIG.phone}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-[11px] text-muted">
          <p>
            © {new Date().getFullYear()} {STORE_CONFIG.name}.{" "}
            {t("footer.rights")}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <a
              href={STORE_CONFIG.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("footer.facebook")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent-border hover:text-ink"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
                />
              </svg>
            </a>
            <a
              href={STORE_CONFIG.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("footer.instagram")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent-border hover:text-ink"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 6.5h.01" />
              </svg>
            </a>
            <a
              href={STORE_CONFIG.socials.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("footer.youtube")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent-border hover:text-ink"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" />
              </svg>
            </a>
            <a
              href={STORE_CONFIG.socials.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("footer.tiktok")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent-border hover:text-ink"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
