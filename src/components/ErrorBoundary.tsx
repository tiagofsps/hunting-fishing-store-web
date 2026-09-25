import { Component, type ReactNode } from 'react';
import { LanguageContext, type LanguageContextType } from '../i18n/languageContext';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static contextType = LanguageContext;
  declare context: LanguageContextType;

  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      const t = this.context?.t ?? ((key: string) => key);
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface p-6">
          <div className="max-w-md rounded-3xl border border-sale/30 bg-sale/10 p-8 text-center">
            <p className="text-lg font-black text-ink">{t('common.errorBoundaryTitle')}</p>
            <p className="mt-2 text-xs text-muted">{t('common.errorBoundaryDesc')}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-ink px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90"
            >
              {t('common.retry')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}