import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from '../validation';
import * as api from '../api';
import { ApiError } from '../../../lib/apiClient';
import { useLanguage } from '../../../i18n/useLanguage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (payload: LoginFormData) => Promise<void>;
  onRegister: (payload: RegisterFormData) => Promise<void>;
}

type Tab = 'login' | 'register';

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }: AuthModalProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      huntingLicenseNumber: '',
      fishingLicenseNumber: '',
    },
  });

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setError('');
      setShowForgot(false);
      setForgotSent(false);
    }
  }

  if (!isOpen) return null;

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof ApiError) {
      if (err.status === 401) return t('auth.errorInvalidCredentials');
      if (err.status === 429) return t('auth.errorRateLimited');
      if (err.status === 409) return t('auth.errorEmailExists');
      return err.message;
    }
    return t('auth.errorGeneric');
  };

  const handleLoginSubmit = async (data: LoginFormData) => {
    setError('');
    setIsSubmitting(true);
    try {
      await onLogin(data);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (data: RegisterFormData) => {
    setError('');
    setIsSubmitting(true);
    try {
      await onRegister(data);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await api.forgotPassword(forgotEmail);
      setForgotSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong text-ink font-medium';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeTab === 'login' ? t('auth.signIn') : t('auth.register')}
          className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-surface-raised p-6 text-left shadow-2xl transition-all sm:p-8 border border-border"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-muted hover:bg-surface-hover hover:text-ink transition-colors"
            aria-label={t('common.close')}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {showForgot ? (
            <div>
              <h2 className="text-xl font-black text-ink">{t('auth.forgotTitle')}</h2>
              <p className="mt-2 text-xs text-muted">{t('auth.forgotDesc')}</p>

              {forgotSent ? (
                <div className="mt-6 rounded-xl bg-accent/10 border border-accent/30 p-4 text-xs font-bold text-ink">
                  {t('auth.forgotSent')}
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
                  {error && (
                    <div className="rounded-xl bg-sale/10 border border-sale/30 p-3 text-xs font-bold text-sale text-center">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">{t('auth.email')}</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-ink py-3.5 mt-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90 active:scale-95 transition-all shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? '...' : t('auth.sendReset')}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowForgot(false);
                  setError('');
                }}
                className="mt-4 text-xs font-bold text-accent-strong hover:underline"
              >
                ← {t('auth.backToLogin')}
              </button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b border-border mb-6">
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setError('');
                  }}
                  className={`flex-1 pb-3 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${
                    activeTab === 'login' ? 'border-accent-strong text-ink' : 'border-transparent text-muted'
                  }`}
                >
                  {t('auth.signIn')}
                </button>
                <button
                  onClick={() => {
                    setActiveTab('register');
                    setError('');
                  }}
                  className={`flex-1 pb-3 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${
                    activeTab === 'register' ? 'border-accent-strong text-ink' : 'border-transparent text-muted'
                  }`}
                >
                  {t('auth.register')}
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-sale/10 border border-sale/30 p-3 text-xs font-bold text-sale text-center">
                  {error}
                </div>
              )}

              {activeTab === 'login' ? (
                <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">{t('auth.email')}</label>
                    <input
                      type="email"
                      {...loginForm.register('email')}
                      className={inputClass}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="mt-1 text-[11px] font-bold text-sale">{t('auth.errorInvalidEmail')}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">{t('auth.password')}</label>
                    <input
                      type="password"
                      {...loginForm.register('password')}
                      className={inputClass}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="mt-1 text-[11px] font-bold text-sale">{t('auth.errorPasswordRequired')}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs font-bold text-accent-strong hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-ink py-3.5 mt-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90 active:scale-95 transition-all shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? '...' : t('auth.submitLogin')}
                  </button>
                </form>
              ) : (
                <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">{t('auth.firstName')}</label>
                      <input
                        type="text"
                        {...registerForm.register('firstName')}
                        className={inputClass}
                      />
                      {registerForm.formState.errors.firstName && (
                        <p className="mt-1 text-[11px] font-bold text-sale">{t('auth.errorRequired')}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">{t('auth.lastName')}</label>
                      <input
                        type="text"
                        {...registerForm.register('lastName')}
                        className={inputClass}
                      />
                      {registerForm.formState.errors.lastName && (
                        <p className="mt-1 text-[11px] font-bold text-sale">{t('auth.errorRequired')}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">{t('auth.email')}</label>
                    <input
                      type="email"
                      {...registerForm.register('email')}
                      className={inputClass}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="mt-1 text-[11px] font-bold text-sale">{t('auth.errorInvalidEmail')}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">{t('auth.password')}</label>
                    <input
                      type="password"
                      {...registerForm.register('password')}
                      className={inputClass}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="mt-1 text-[11px] font-bold text-sale">{t('auth.errorPasswordMin')}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">{t('auth.phone')}</label>
                    <input
                      type="tel"
                      {...registerForm.register('phone')}
                      className={inputClass}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">{t('auth.huntingLicense')}</label>
                      <input
                        type="text"
                        {...registerForm.register('huntingLicenseNumber')}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">{t('auth.fishingLicense')}</label>
                      <input
                        type="text"
                        {...registerForm.register('fishingLicenseNumber')}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-ink py-3.5 mt-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90 active:scale-95 transition-all shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? '...' : t('auth.submitRegister')}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}