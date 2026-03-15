import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';

export default function LoginPage() {
  const { loginWithToken } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, cycleLanguage, currentLang } = useLanguage();
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setDevCode('');
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/request-code', { email });
      setStep('code');
      setInfo(res.data.message || 'A 6-digit code has been sent to your email.');
      if (res.data.devCode) {
        setDevCode(res.data.devCode);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/verify-code', { email, code });
      loginWithToken(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setCode(cleaned);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4 relative">
      {/* Top-right controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button
          onClick={cycleLanguage}
          className="px-2 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700 flex items-center gap-1 transition-colors"
        >
          <span>{currentLang.flag}</span>
          <span>{currentLang.label}</span>
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Philharmonique d'Uccle" className="h-20 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-3">Philharmonique d'Uccle</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {step === 'email' && t('login.signInEmail')}
            {step === 'code' && t('login.enterCode')}
          </p>
        </div>

        {/* Step 1: Enter email */}
        {step === 'email' && (
          <form onSubmit={handleRequestCode} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/40 p-6 space-y-4">
            {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('login.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 outline-none text-sm dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                placeholder="your@email.com"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('login.sendingCode') : t('login.sendCode')}
            </button>

          </form>
        )}

        {/* Step 2: Enter code */}
        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/40 p-6 space-y-4">
            {info && <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm p-3 rounded-lg">{info}</div>}
            {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">{error}</div>}

            {devCode && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 text-center">
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">{t('login.devCode')}</p>
                <span className="text-2xl font-bold font-mono tracking-[0.3em] text-yellow-700 dark:text-yellow-300">{devCode}</span>
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {devCode
                ? <>{t('login.enterCodeFor')} <span className="font-medium text-gray-700 dark:text-gray-200">{email}</span></>
                : <>{t('login.codeSentTo')} <span className="font-medium text-gray-700 dark:text-gray-200">{email}</span></>
              }
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('login.loginCode')}</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 outline-none text-center text-2xl tracking-[0.5em] font-mono dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                placeholder="000000"
                maxLength={6}
                autoFocus
                required
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{t('login.codeExpires')}</p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('login.verifying') : t('login.signIn')}
            </button>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => { setStep('email'); setCode(''); setError(''); setInfo(''); }}
                className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                &larr; {t('login.changeEmail')}
              </button>
              <button
                type="button"
                onClick={handleRequestCode}
                disabled={loading}
                className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
              >
                {t('login.resendCode')}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
