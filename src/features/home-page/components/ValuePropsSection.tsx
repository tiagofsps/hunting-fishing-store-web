import { useLanguage } from '../../../i18n/useLanguage';

export default function ValuePropsSection() {
  const { t } = useLanguage();

  const features = [
    {
      icon: (
        <svg className="h-7 w-7 text-accent-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      title: t('val.prop1Title'),
      description: t('val.prop1Desc'),
    },
    {
      icon: (
        <svg className="h-7 w-7 text-accent-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: t('val.prop2Title'),
      description: t('val.prop2Desc'),
    },
    {
      icon: (
        <svg className="h-7 w-7 text-accent-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: t('val.prop3Title'),
      description: t('val.prop3Desc'),
    },
    {
      icon: (
        <svg className="h-7 w-7 text-accent-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      title: t('val.prop4Title'),
      description: t('val.prop4Desc'),
    },
  ];

  return (
    <section id="advantages" className="bg-surface py-16 border-y border-border">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="group flex flex-col items-center text-center p-6 rounded-2xl bg-surface-raised border border-border shadow-xs hover:shadow-md hover:border-accent-border transition-all duration-300"
            >
              <div className="h-14 w-14 rounded-2xl bg-surface-hover flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                {feat.icon}
              </div>
              <h3 className="text-base font-bold text-ink mb-2">{feat.title}</h3>
              <p className="text-xs leading-relaxed text-muted">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

