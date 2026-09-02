import { useLanguage } from "../i18n/LanguageContext";
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
                <a
                  href="#home"
                  className="hover:text-accent-strong transition-colors"
                >
                  {t("nav.home")}
                </a>
              </li>
              <li>
                <a
                  href="#categories"
                  className="hover:text-accent-strong transition-colors"
                >
                  {t("nav.categories")}
                </a>
              </li>
              <li>
                <a
                  href="#featured"
                  className="hover:text-accent-strong transition-colors"
                >
                  {t("nav.featured")}
                </a>
              </li>
              <li>
                <a
                  href="#brands"
                  className="hover:text-accent-strong transition-colors"
                >
                  {t("nav.brands")}
                </a>
              </li>
              <li>
                <a
                  href="#advantages"
                  className="hover:text-accent-strong transition-colors"
                >
                  {t("nav.advantages")}
                </a>
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
                  Termos &amp; Condições
                </a>
              </li>
              <li>
                <a
                  href="#home"
                  className="hover:text-accent-strong transition-colors"
                >
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a
                  href="#home"
                  className="hover:text-accent-strong transition-colors"
                >
                  Licenciamento &amp; Legislação
                </a>
              </li>
              <li>
                <a
                  href="#home"
                  className="hover:text-accent-strong transition-colors"
                >
                  Trocas &amp; Devoluções
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
          <div className="flex gap-6 justify-center mt-4">
            <a
              href={STORE_CONFIG.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-ink"
            >
              <span className="sr-only">Facebook</span>FB
            </a>
            <a
              href={STORE_CONFIG.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-ink"
            >
              <span className="sr-only">Instagram</span>IG
            </a>
            <a
              href={STORE_CONFIG.socials.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-ink"
            >
              <span className="sr-only">YouTube</span>YT
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
