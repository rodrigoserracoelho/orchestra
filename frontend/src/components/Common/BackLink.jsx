import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

// The header carries no navigation, so every page below the home grid needs its
// own way back. Pages with a parent show it first and still offer Home, so the
// grid is always one tap away no matter how deep you are.
export default function BackLink({ to = '/', label }) {
  const { t } = useLanguage();
  const isHome = to === '/';
  const linkClass = "inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:underline";

  return (
    <div className="mb-4 flex items-center gap-2">
      <Link to={to} className={linkClass}>
        <span aria-hidden="true">&larr;</span>
        {isHome ? t('nav.backToHome') : label}
      </Link>
      {!isHome && (
        <>
          <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">&middot;</span>
          <Link to="/" className={linkClass}>{t('nav.backToHome')}</Link>
        </>
      )}
    </div>
  );
}
