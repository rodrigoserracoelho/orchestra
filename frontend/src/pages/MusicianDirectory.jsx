import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';
import BackLink from '../components/Common/BackLink';

export default function MusicianDirectory() {
  const { t } = useLanguage();
  const [musicians, setMusicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    apiClient.get('/musician/directory')
      .then((res) => setMusicians(res.data.data))
      .catch(() => setError(t('directory.loadFailed')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Group by instrument. People without an instrument fall into "Unspecified".
  const groups = {};
  musicians.forEach((m) => {
    const key = m.instrument || t('directory.unspecified');
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const u = t('directory.unspecified');
    if (a === u) return 1;
    if (b === u) return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <BackLink />
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('directory.title')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('directory.subtitle', { count: musicians.length })}</p>

      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg mb-4">{error}</div>}

      {musicians.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">{t('directory.empty')}</div>
      ) : (
        <div className="space-y-6">
          {sortedKeys.map((instrument) => (
            <section key={instrument}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                {instrument} <span className="font-normal normal-case text-gray-400">({groups[instrument].length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {groups[instrument].map((m) => {
                  const isOpen = expanded === m.id;
                  return (
                    <button key={m.id}
                      onClick={() => setExpanded(isOpen ? null : m.id)}
                      className={`text-left bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-4 transition-colors ${
                        isOpen ? 'border-primary-400 dark:border-primary-500' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}>
                      <div className="flex items-center gap-3">
                        {m.profile_picture ? (
                          <img src={m.profile_picture} alt="" className="w-14 h-14 rounded-full object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl text-gray-400">👤</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{m.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {m.instrument || t('directory.unspecified')}
                            {m.part && <span className="ml-1">· {m.part}</span>}
                          </p>
                        </div>
                      </div>
                      {isOpen && m.bio && (
                        <p className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{m.bio}</p>
                      )}
                      {isOpen && !m.bio && (
                        <p className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-400 dark:text-gray-500 italic">{t('directory.noBio')}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
