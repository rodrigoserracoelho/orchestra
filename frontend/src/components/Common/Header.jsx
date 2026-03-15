import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import apiClient from '../../services/apiClient';

export default function Header() {
  const { user, logout, isAdmin, viewMode, setViewMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, cycleLanguage, currentLang } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await apiClient.get('/musician/inbox/unread-count');
        setUnreadCount(res.data.data.count);
      } catch (e) { /* ignore */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleViewSwitch = () => {
    setViewMode(viewMode === 'admin' ? 'musician' : 'admin');
    setMenuOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path
    ? 'text-primary-600 dark:text-primary-400 font-semibold'
    : 'text-gray-600 dark:text-gray-300';

  const adminLinks = [
    { to: '/', label: t('nav.dashboard') },
    { to: '/admin/seasons', label: t('nav.seasons') },
    { to: '/admin/musicians', label: t('nav.musicians') },
    { to: '/admin/messages', label: t('nav.messages') },
    { to: '/admin/news', label: t('nav.news') },
    { to: '/admin/pages', label: t('nav.pages') },
  ];

  const inboxLabel = t('nav.inbox') + (unreadCount > 0 ? ` (${unreadCount})` : '');

  const musicianLinks = [
    { to: '/', label: t('nav.myRehearsals') },
    { to: '/inbox', label: inboxLabel, badge: unreadCount },
    { to: '/news', label: t('nav.news') },
  ];

  const maestroLinks = [
    { to: '/', label: t('nav.dashboard') },
    { to: '/inbox', label: inboxLabel, badge: unreadCount },
    { to: '/news', label: t('nav.news') },
  ];

  const sectionLeaderLinks = [
    { to: '/', label: t('nav.dashboard') },
    { to: '/inbox', label: inboxLabel, badge: unreadCount },
    { to: '/news', label: t('nav.news') },
  ];

  const getLinks = () => {
    if (isAdmin && viewMode === 'admin') return adminLinks;
    if (user?.role === 'maestro') return maestroLinks;
    if (user?.role === 'section_leader') return sectionLeaderLinks;
    return musicianLinks;
  };

  const links = getLinks();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/30 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Philharmonique d'Uccle" className="h-10" />
          <span className="font-bold text-lg text-gray-800 dark:text-gray-100 hidden sm:inline">Philharmonique d'Uccle</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={`text-sm hover:text-primary-600 dark:hover:text-primary-400 relative ${isActive(link.to)}`}>
              {link.label}
              {link.badge > 0 && (
                <span className="absolute -top-1.5 -right-3 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {link.badge > 9 ? '9+' : link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language cycler */}
          <button
            onClick={cycleLanguage}
            className="px-2 py-1 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1"
            title="Change language"
          >
            <span>{currentLang.flag}</span>
            <span>{currentLang.label}</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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

          <Link to="/profile" className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hidden sm:inline">{user?.name}</Link>
          {isAdmin && (
            <button
              onClick={handleViewSwitch}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                viewMode === 'admin'
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/60'
                  : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60'
              }`}
              title={viewMode === 'admin' ? t('nav.switchToMusician') : t('nav.switchToAdmin')}
            >
              {viewMode === 'admin' ? t('common.admin') : t('common.musician')}
            </button>
          )}
          <button onClick={logout} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
            {t('nav.logout')}
          </button>

          {/* Mobile inbox shortcut */}
          <Link to="/inbox" className="md:hidden relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Mobile hamburger */}
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

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-4 py-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`block py-2.5 px-3 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${isActive(link.to)}`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/profile"
            onClick={() => setMenuOpen(false)}
            className={`block py-2.5 px-3 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${isActive('/profile')}`}
          >
            {t('nav.myProfile')}
          </Link>
          {isAdmin && (
            <button
              onClick={handleViewSwitch}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              {viewMode === 'admin' ? t('nav.switchToMusician') : t('nav.switchToAdmin')}
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
