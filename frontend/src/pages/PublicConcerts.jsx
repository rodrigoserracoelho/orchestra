import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';

export default function PublicConcerts() {
  const { t, currentLang } = useLanguage();
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/public/concerts')
      .then((res) => setConcerts(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString(currentLang.locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{t('public.concerts')}</h1>

      {concerts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <span className="text-4xl">&#127926;</span>
          <p className="text-gray-500 dark:text-gray-400 mt-3">{t('public.noConcerts')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {concerts.map((c) => (
            <div key={c.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-primary-600 dark:text-primary-400">{formatDate(c.concert_date)}</div>
                  {c.label && <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{c.label}</h2>}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{c.season_name}</p>
                  {c.maestro && <p className="text-sm text-gray-500 dark:text-gray-400">&#127932; {c.maestro}</p>}
                </div>
                {c.venue && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 sm:text-right">
                    <p>&#128205; {c.venue}</p>
                    {c.venue_address && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.venue_address)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs underline hover:text-primary-600 dark:hover:text-primary-400">
                        {c.venue_address}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
