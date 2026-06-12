import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useLanguage } from '../context/LanguageContext';

// Mollie redirects users here after they finish (or cancel) on the checkout page.
// We poll status briefly because the webhook (server-to-server) may arrive
// a moment after the user lands here.
export default function PaymentReturn() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const seasonId = params.get('seasonId');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!seasonId) {
      setStatus('unknown');
      return;
    }
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      try {
        const res = await apiClient.get(`/musician/payments/${seasonId}/status`);
        const s = res.data.data.status;
        if (s === 'paid') {
          setStatus('paid');
          return;
        }
        if (['failed', 'canceled', 'expired'].includes(s)) {
          setStatus(s);
          return;
        }
        if (attempts < 6) {
          setTimeout(poll, 1500);
        } else {
          setStatus('pending');
        }
      } catch {
        setStatus('error');
      }
    };
    poll();
  }, [seasonId]);

  const cfg = {
    loading:  { icon: '⏳', title: t('payment.checking'),    color: 'text-gray-600 dark:text-gray-300' },
    paid:     { icon: '✅', title: t('payment.success'),     color: 'text-green-600 dark:text-green-400' },
    pending:  { icon: '⏳', title: t('payment.pending'),     color: 'text-yellow-600 dark:text-yellow-400' },
    failed:   { icon: '❌', title: t('payment.failed'),      color: 'text-red-600 dark:text-red-400' },
    canceled: { icon: '↩️', title: t('payment.canceled'),    color: 'text-gray-600 dark:text-gray-300' },
    expired:  { icon: '⌛', title: t('payment.expired'),     color: 'text-gray-600 dark:text-gray-300' },
    unknown:  { icon: '❓', title: t('payment.unknown'),     color: 'text-gray-600 dark:text-gray-300' },
    error:    { icon: '⚠️', title: t('payment.error'),       color: 'text-red-600 dark:text-red-400' },
  };
  const c = cfg[status] || cfg.unknown;

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">{c.icon}</div>
      <h1 className={`text-2xl font-bold mb-2 ${c.color}`}>{c.title}</h1>
      {status === 'pending' && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('payment.pendingDetails')}</p>
      )}
      <Link to="/" className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold">
        {t('payment.backHome')}
      </Link>
    </div>
  );
}
