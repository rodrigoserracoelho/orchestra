import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t, currentLang } = useLanguage();
  const [stats, setStats] = useState({ seasons: [], musicians: [], upcomingRehearsals: [], emailsSent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const [seasonsRes, musiciansRes, rehearsalsRes, statsRes] = await Promise.all([
        apiClient.get('/admin/seasons'),
        apiClient.get('/admin/musicians'),
        apiClient.get('/musician/rehearsals'),
        apiClient.get('/admin/stats'),
      ]);
      setStats({
        seasons: seasonsRes.data.data,
        musicians: musiciansRes.data.data,
        upcomingRehearsals: rehearsalsRes.data.data.slice(0, 5),
        emailsSent: statsRes.data.data.emailsSent,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(String(dateStr).replace('Z', '')).toLocaleDateString(currentLang.locale, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('adminDashboard.welcome', { name: user?.name })}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('adminDashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: t('adminDashboard.musicians'), value: stats.musicians.length, icon: '\u{1F465}', to: '/admin/musicians' },
          { label: t('adminDashboard.seasons'), value: stats.seasons.length, icon: '\u{1F3BC}', to: '/admin/seasons' },
          { label: t('adminDashboard.upcoming'), value: stats.upcomingRehearsals.length, icon: '\u{1F4C5}', to: stats.seasons[0] ? `/admin/seasons/${stats.seasons[0].id}/rehearsals` : '#' },
          { label: t('adminDashboard.emailsSent'), value: stats.emailsSent, icon: '\u{1F4E7}', to: '#' },
        ].map((stat) => (
          <Link key={stat.label} to={stat.to}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="text-2xl">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2">{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
          </Link>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t('adminDashboard.upcomingRehearsals')}</h2>
          {stats.seasons[0] && (
            <Link to={`/admin/seasons/${stats.seasons[0].id}/rehearsals`} className="text-sm text-primary-600 hover:underline">{t('adminDashboard.viewAll')}</Link>
          )}
        </div>

        {stats.upcomingRehearsals.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm py-4 text-center">{t('adminDashboard.noUpcoming')}</p>
        ) : (
          <div className="space-y-2">
            {stats.upcomingRehearsals.map((r) => (
              <Link key={r.id} to={`/admin/rehearsals/${r.id}/attendance`}
                className="flex justify-between items-center py-3 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div>
                  <p className="font-medium text-sm text-gray-800 dark:text-gray-100">{r.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{r.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{formatDate(r.rehearsal_date)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{r.duration_minutes} {t('common.min')}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Link to="/admin/seasons" className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-2xl p-4 text-center font-medium text-sm hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors">
          {t('adminDashboard.newSeason')}
        </Link>
        <Link to="/admin/musicians" className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-2xl p-4 text-center font-medium text-sm hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors">
          {t('adminDashboard.addMusician')}
        </Link>
      </div>
    </div>
  );
}
