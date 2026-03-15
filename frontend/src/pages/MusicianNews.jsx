import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';

export default function MusicianNews() {
  const { t, currentLang } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadInbox(); }, []);

  const loadInbox = async () => {
    try {
      const res = await apiClient.get('/musician/news');
      setMessages(res.data.data.articles);
    } catch (e) {
      console.error('Failed to load news:', e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (msg) => {
    if (msg.is_read) return;
    try {
      await apiClient.post(`/musician/news/${msg.id}/read`);
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_read: true } : m));
    } catch (e) {
      console.error('Failed to mark as read:', e);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString(currentLang.locale, { year: 'numeric', month: 'long', day: 'numeric' });

  const unreadCount = messages.filter((m) => !m.is_read).length;

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('news.title')}</h1>
        {unreadCount > 0 && (
          <p className="text-sm text-primary-600 dark:text-primary-400 mt-0.5">
            {unreadCount} {t('news.unread').toLowerCase()}
          </p>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <span className="text-4xl">&#128240;</span>
          <p className="text-gray-500 dark:text-gray-400 mt-3">{t('news.noArticles')}</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t('news.allCaughtUp')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <article key={msg.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border overflow-hidden transition-colors ${
                msg.is_read
                  ? 'border-gray-100 dark:border-gray-700'
                  : 'border-primary-200 dark:border-primary-700'
              }`}>
              {msg.cover_image && (
                <img src={msg.cover_image} alt="" className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className={`text-lg font-semibold ${msg.is_read ? 'text-gray-800 dark:text-gray-100' : 'text-primary-800 dark:text-primary-200'}`}>
                        {msg.title}
                      </h2>
                      {!msg.is_read && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium flex-shrink-0">
                          {t('news.unread')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                      <span>{formatDate(msg.created_at)}</span>
                      <span>{msg.author_name}</span>
                    </div>
                  </div>
                  {!msg.is_read && (
                    <button onClick={() => markAsRead(msg)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-primary-600 text-white text-xs font-medium hover:bg-primary-700">
                      {t('news.markRead')}
                    </button>
                  )}
                </div>
                <div
                  className="mt-3 text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none prose-a:text-primary-600 dark:prose-a:text-primary-400"
                  dangerouslySetInnerHTML={{ __html: msg.body }}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
