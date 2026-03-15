import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../services/apiClient';

export default function PublicLayout() {
  const { t, cycleLanguage, currentLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [nav, setNav] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    apiClient.get('/public/pages').then((res) => {
      setNav(res.data.data.nav.filter((p) => p.show_in_nav));
    }).catch(() => {});
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const isActive = (path) => location.pathname === path
    ? 'text-primary-600 dark:text-primary-400 font-semibold'
    : 'text-gray-600 dark:text-gray-300';

  const fixedLinks = [
    { to: '/site', label: t('public.home') },
    { to: '/site/concerts', label: t('public.concerts') },
    { to: '/site/news', label: t('public.news') },
  ];

  const pageLinks = nav.map((p) => ({ to: `/site/${p.slug}`, label: p.title }));
  const allLinks = [...fixedLinks, ...pageLinks];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/site" className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Philharmonique d'Uccle" className="h-10" />
            <span className="font-bold text-lg text-gray-800 dark:text-gray-100 hidden sm:inline">Philharmonique d'Uccle</span>
          </Link>

          <nav className="hidden md:flex items-center gap-5">
            {allLinks.map((link) => (
              <Link key={link.to} to={link.to} className={`text-sm hover:text-primary-600 dark:hover:text-primary-400 ${isActive(link.to)}`}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={cycleLanguage}
              className="px-2 py-1 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1">
              <span>{currentLang.flag}</span>
              <span>{currentLang.label}</span>
            </button>
            <button onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Toggle theme">
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
            <Link to="/login" className="text-sm px-3 py-1.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700">
              {t('public.memberLogin')}
            </Link>

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="md:hidden bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-4 py-3 space-y-1">
            {allLinks.map((link) => (
              <Link key={link.to} to={link.to}
                className={`block py-2.5 px-3 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${isActive(link.to)}`}>
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="h-8" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Association Philharmonique d'Uccle</span>
            </div>
            <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
              {allLinks.map((link) => (
                <Link key={link.to} to={link.to} className="hover:text-primary-600 dark:hover:text-primary-400">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
