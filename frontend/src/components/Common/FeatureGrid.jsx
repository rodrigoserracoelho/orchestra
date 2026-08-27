import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import apiClient from '../../services/apiClient';

// The app's only navigation. The header carries no links, so every feature a
// role can reach has to appear here.
const TILES = {
  admin: [
    { to: '/admin/seasons', icon: '\u{1F3BC}', key: 'seasons' },
    { to: '/admin/locations', icon: '\u{1F4CD}', key: 'locations' },
    { to: '/admin/musicians', icon: '\u{1F5C2}\uFE0F', key: 'musicians' },
    { to: '/musicians', icon: '\u{1F465}', key: 'directory' },
    { to: '/admin/messages', icon: '\u2709\uFE0F', key: 'messages' },
    { to: '/admin/news', icon: '\u{1F4F0}', key: 'news' },
    { to: '/admin/pages', icon: '\u{1F4C4}', key: 'pages' },
    { to: '/profile', icon: '\u{1F464}', key: 'myProfile' },
  ],
  musician: [
    { to: '/polls', icon: '\u{1F5F3}\uFE0F', key: 'polls' },
    { to: '/inbox', icon: '\u{1F4EC}', key: 'inbox', badge: 'unread' },
    { to: '/news', icon: '\u{1F4F0}', key: 'news' },
    { to: '/musicians', icon: '\u{1F465}', key: 'directory' },
    { to: '/profile', icon: '\u{1F464}', key: 'myProfile' },
  ],
  maestro: [
    { to: '/inbox', icon: '\u{1F4EC}', key: 'inbox', badge: 'unread' },
    { to: '/news', icon: '\u{1F4F0}', key: 'news' },
    { to: '/musicians', icon: '\u{1F465}', key: 'directory' },
    { to: '/profile', icon: '\u{1F464}', key: 'myProfile' },
  ],
  section_leader: [
    { to: '/polls', icon: '\u{1F5F3}\uFE0F', key: 'polls' },
    { to: '/inbox', icon: '\u{1F4EC}', key: 'inbox', badge: 'unread' },
    { to: '/news', icon: '\u{1F4F0}', key: 'news' },
    { to: '/musicians', icon: '\u{1F465}', key: 'directory' },
    { to: '/profile', icon: '\u{1F464}', key: 'myProfile' },
  ],
};

export default function FeatureGrid() {
  const { viewMode } = useAuth();
  const { t } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);

  const tiles = TILES[viewMode] || TILES.musician;
  const needsUnread = tiles.some((tile) => tile.badge === 'unread');

  useEffect(() => {
    if (!needsUnread) return;
    const fetchUnread = async () => {
      try {
        const res = await apiClient.get('/musician/inbox/unread-count');
        setUnreadCount(res.data.data.count);
      } catch (e) { /* ignore */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [needsUnread]);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 mb-6">
      {tiles.map((tile) => {
        const badge = tile.badge === 'unread' ? unreadCount : 0;
        return (
          <Link key={tile.to} to={tile.to}
            className="relative flex flex-col items-center justify-center gap-1.5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 py-4 px-2 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all">
            <span className="text-2xl leading-none">{tile.icon}</span>
            <span className="text-xs font-medium text-center leading-tight text-gray-700 dark:text-gray-200">
              {t(`nav.${tile.key}`)}
            </span>
            {badge > 0 && (
              <span className="absolute top-2 right-2 min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
