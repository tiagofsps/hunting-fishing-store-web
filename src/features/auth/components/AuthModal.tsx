import { useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from '../validation';
import * as api from '../api';
import { ApiError } from '../../../lib/apiClient';
import { useLanguage } from '../../../i18n/useLanguage';
import { ForgotPasswordPanel } from './ForgotPasswordPanel';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (payload: LoginFormData) => Promise<void>;
  onRegister: (payload: RegisterFormData) => Promise<void>;
}

type Tab = 'login' | 'register';

/**
 * Sign-in / registration / password-reset dialog. The container owns the tab,
 * error and submission state; each view is a presentational component.
 */
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

  const handleForgotSubmit = async (e: FormEvent<HTMLFormElement>) => {
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

  const backFromForgot = () => {
    setShowForgot(false);
    setError('');
  };

  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
    setError('');
  };

  const tabClass = (tab: Tab) =>
    `flex-1 pb-3 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${
      activeTab === tab ? 'border-accent-strong text-ink' : 'border-transparent text-muted'
    }`;

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
            <ForgotPasswordPanel
              email={forgotEmail}
              onEmailChange={setForgotEmail}
              onSubmit={handleForgotSubmit}
              sent={forgotSent}
              error={error}
              isSubmitting={isSubmitting}
              onBack={backFromForgot}
            />
          ) : (
            <>
              <div className="flex border-b border-border mb-6" role="tablist">
                <button role="tab" aria-selected={activeTab === 'login'} onClick={() => selectTab('login')} className={tabClass('login')}>
                  {t('auth.signIn')}
                </button>
                <button role="tab" aria-selected={activeTab === 'register'} onClick={() => selectTab('register')} className={tabClass('register')}>
                  {t('auth.register')}
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-sale/10 border border-sale/30 p-3 text-xs font-bold text-sale text-center">
                  {error}
                </div>
              )}

              {activeTab === 'login' ? (
                <LoginForm
                  form={loginForm}
                  onSubmit={handleLoginSubmit}
                  isSubmitting={isSubmitting}
                  onForgotPassword={() => setShowForgot(true)}
                />
              ) : (
                <RegisterForm form={registerForm} onSubmit={handleRegisterSubmit} isSubmitting={isSubmitting} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
