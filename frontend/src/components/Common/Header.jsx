import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// Deliberately link-free: navigation lives in the FeatureGrid on each role's
// home, so the bar stays usable on a phone. The logo is the way back home.
export default function Header() {
  const { user, logout, hasRoleSwitch, viewMode, setViewMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, cycleLanguage, currentLang } = useLanguage();
  const navigate = useNavigate();

  const handleViewSwitch = () => {
    setViewMode(viewMode === 'musician' ? 'role' : 'musician');
    navigate('/');
  };

  const roleLabel = viewMode === 'musician' ? t('common.musician') : t(`common.${user?.role}`);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/30 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Philharmonique d'Uccle" className="h-10" />
          <span className="font-bold text-lg text-gray-800 dark:text-gray-100 hidden sm:inline">Philharmonique d'Uccle</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Language cycler */}
          <button
            onClick={cycleLanguage}
            className="px-2 py-1 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1"
            title="Change language"
          >
            <span>{currentLang.flag}</span>
            <span className="hidden sm:inline">{currentLang.label}</span>
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

          {/* Role label — a button when there is another view to switch to */}
          {hasRoleSwitch ? (
            <button
              onClick={handleViewSwitch}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                viewMode === 'musician'
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60'
                  : 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/60'
              }`}
              title={viewMode === 'musician' ? t('nav.switchToRole') : t('nav.switchToMusician')}
            >
              {roleLabel}
            </button>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {roleLabel}
            </span>
          )}

          <button onClick={logout} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </header>
  );
}
