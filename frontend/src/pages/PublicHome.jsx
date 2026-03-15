import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';

export default function PublicHome() {
  const { t, currentLang } = useLanguage();
  const [concerts, setConcerts] = useState([]);
  const [news, setNews] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get('/public/concerts'),
      apiClient.get('/public/news'),
      apiClient.get('/public/pages'),
    ]).then(([concertsRes, newsRes, pagesRes]) => {
      setConcerts(concertsRes.data.data.slice(0, 3));
      setNews(newsRes.data.data.slice(0, 3));
      setPages(pagesRes.data.data.pages);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString(currentLang.locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  // Find a homepage page (slug = 'home' or first page)
  const homePage = pages.find((p) => p.slug === 'home');

  return (
    <div className="space-y-10">
      {/* Hero / Homepage content */}
      {homePage ? (
        <section>
          {homePage.cover_image && (
            <img src={homePage.cover_image} alt="" className="w-full h-64 sm:h-80 object-cover rounded-2xl mb-6" />
          )}
          <div className="prose prose-lg dark:prose-invert max-w-none prose-a:text-primary-600 dark:prose-a:text-primary-400"
            dangerouslySetInnerHTML={{ __html: homePage.body }} />
        </section>
      ) : (
        <section className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Association Philharmonique d'Uccle</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-3">{t('public.welcomeSubtitle')}</p>
        </section>
      )}

      {/* Upcoming concerts */}
      {concerts.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('public.upcomingConcerts')}</h2>
            <Link to="/site/concerts" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium">
              {t('public.viewAll')} &rarr;
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {concerts.map((c) => (
              <div key={c.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                <div className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">{formatDate(c.concert_date)}</div>
                {c.label && <h3 className="font-semibold text-gray-800 dark:text-gray-100">{c.label}</h3>}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{c.season_name}</p>
                {c.maestro && <p className="text-sm text-gray-500 dark:text-gray-400">&#127932; {c.maestro}</p>}
                {c.venue && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    &#128205; {c.venue}
                    {c.venue_address && (
                      <> &mdash; <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.venue_address)}`}
                        target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-600 dark:hover:text-primary-400">
                        {c.venue_address}
                      </a></>
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Latest news */}
      {news.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('public.latestNews')}</h2>
            <Link to="/site/news" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium">
              {t('public.viewAll')} &rarr;
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((article) => (
              <div key={article.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {article.cover_image && (
                  <img src={article.cover_image} alt="" className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">{article.title}</h3>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(article.created_at).toLocaleDateString(currentLang.locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                    {article.author_name && <> &mdash; {article.author_name}</>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
