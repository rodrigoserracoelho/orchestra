import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';

export default function PublicNewsPage() {
  const { t, currentLang } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/public/news')
      .then((res) => setArticles(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString(currentLang.locale, { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{t('public.news')}</h1>

      {articles.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <span className="text-4xl">&#128240;</span>
          <p className="text-gray-500 dark:text-gray-400 mt-3">{t('public.noNews')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => (
            <article key={article.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              {article.cover_image && (
                <img src={article.cover_image} alt="" className="w-full h-56 object-cover" />
              )}
              <div className="p-5">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{article.title}</h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                  <span>{formatDate(article.created_at)}</span>
                  {article.author_name && <span>{article.author_name}</span>}
                </div>
                <div className="mt-4 text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none prose-a:text-primary-600 dark:prose-a:text-primary-400"
                  dangerouslySetInnerHTML={{ __html: article.body }} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
