import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import apiClient from '../../services/apiClient';
import Icon from './Icon';

// The app's only navigation. The header carries no links, so every feature a
// role can reach has to appear here.
const TILES = {
  admin: [
    { to: '/admin/seasons', icon: 'seasons', key: 'seasons' },
    { to: '/admin/locations', icon: 'locations', key: 'locations' },
    { to: '/admin/musicians', icon: 'manage', key: 'musicians' },
    { to: '/musicians', icon: 'musicians', key: 'directory' },
    { to: '/admin/messages', icon: 'messages', key: 'messages' },
    { to: '/admin/news', icon: 'news', key: 'news' },
    { to: '/admin/pages', icon: 'pages', key: 'pages' },
    { to: '/profile', icon: 'profile', key: 'myProfile' },
  ],
  musician: [
    { to: '/polls', icon: 'polls', key: 'polls' },
    { to: '/inbox', icon: 'inbox', key: 'inbox', badge: 'unread' },
    { to: '/news', icon: 'news', key: 'news' },
    { to: '/musicians', icon: 'musicians', key: 'directory' },
    { to: '/profile', icon: 'profile', key: 'myProfile' },
  ],
  maestro: [
    { to: '/inbox', icon: 'inbox', key: 'inbox', badge: 'unread' },
    { to: '/news', icon: 'news', key: 'news' },
    { to: '/musicians', icon: 'musicians', key: 'directory' },
    { to: '/profile', icon: 'profile', key: 'myProfile' },
  ],
  section_leader: [
    { to: '/polls', icon: 'polls', key: 'polls' },
    { to: '/inbox', icon: 'inbox', key: 'inbox', badge: 'unread' },
    { to: '/news', icon: 'news', key: 'news' },
    { to: '/musicians', icon: 'musicians', key: 'directory' },
    { to: '/profile', icon: 'profile', key: 'myProfile' },
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
    // Bleeds to the screen edges so the row reads as scrollable and the last
    // item is never flush against the viewport.
    <nav className="-mx-4 px-4 mb-6 overflow-x-auto no-scrollbar">
      <div className="flex items-start gap-3 w-max">
        {tiles.map((tile) => {
          const badge = tile.badge === 'unread' ? unreadCount : 0;
          return (
            <Link key={tile.to} to={tile.to}
              className="flex flex-col items-center gap-1.5 shrink-0 w-[60px] group">
              <span className="relative w-[52px] h-[52px] rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:border-primary-300 dark:group-hover:border-primary-700 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 transition-colors">
                <Icon name={tile.icon} />
                {badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span className="h-[26px] flex items-start justify-center text-[11px] font-medium leading-tight text-center text-gray-600 dark:text-gray-300">
                {t(`nav.${tile.key}`)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
