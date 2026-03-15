import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';

export default function AdminAttendance() {
  const { rehearsalId } = useParams();
  const { t, currentLang } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const STATUS_STYLES = {
    attending: { label: t('attendance.attending'), bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
    not_attending: { label: t('attendance.notAttending'), bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
    maybe: { label: t('attendance.maybe'), bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
  };

  useEffect(() => { loadData(); }, [rehearsalId]);

  const loadData = async () => {
    try {
      const res = await apiClient.get(`/admin/rehearsals/${rehearsalId}/attendance`);
      setData(res.data.data);
    } catch (e) {
      console.error('Failed to load attendance:', e);
    } finally {
      setLoading(false);
    }
  };

  const locale = currentLang.locale;
  const formatDate = (d) => new Date(String(d).replace('Z', '')).toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const formatTime = (d) => new Date(String(d).replace('Z', '')).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  if (!data) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">{t('adminAttendance.loadFailed')}</div>;

  const { rehearsal, responses, summary } = data;
  const totalMusicians = responses.length;
  const noResponse = totalMusicians - (summary.attending + summary.not_attending + summary.maybe);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link to={`/admin/seasons/${rehearsal.season_id}/rehearsals`} className="text-sm text-primary-600 hover:underline">{t('adminAttendance.backToRehearsals')}</Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{rehearsal.title}</h1>
        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600 dark:text-gray-300">
          <span>&#128197; {formatDate(rehearsal.rehearsal_date)}</span>
          <span>&#128336; {formatTime(rehearsal.rehearsal_date)}</span>
          {rehearsal.location && <span>&#128205; {rehearsal.location}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {[
          { label: t('attendance.attending'), count: summary.attending, color: 'bg-green-500' },
          { label: t('attendance.notComing'), count: summary.not_attending, color: 'bg-red-500' },
          { label: t('attendance.maybe'), count: summary.maybe, color: 'bg-yellow-500' },
          { label: t('attendance.noReply'), count: noResponse >= 0 ? noResponse : 0, color: 'bg-gray-400' },
        ].map((item) => (
          <div key={item.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 text-center">
            <div className={`w-3 h-3 rounded-full ${item.color} mx-auto mb-1`}></div>
            <div className="text-xl font-bold text-gray-800 dark:text-gray-100">{item.count}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
          </div>
        ))}
      </div>

      {(() => {
        const attending = responses.filter((r) => r.status === 'attending');
        const notAttending = responses.filter((r) => r.status === 'not_attending');
        const maybe = responses.filter((r) => r.status === 'maybe');
        const noReply = responses.filter((r) => !r.status);

        // Group attending by instrument, with Violin split by part
        const instrumentGroups = {};
        attending.forEach((r) => {
          let group = r.instrument || t('adminAttendance.unknownInstrument');
          if (group.toLowerCase() === 'violin' && r.part) {
            group = `${r.instrument} ${r.part}`;
          }
          if (!instrumentGroups[group]) instrumentGroups[group] = [];
          instrumentGroups[group].push(r);
        });

        const sortedGroups = Object.entries(instrumentGroups).sort(([a], [b]) => a.localeCompare(b));

        const renderNames = (list) => (
          <div className="mt-2 space-y-1">
            {list.map((r) => (
              <p key={r.user_id} className="text-sm text-gray-700 dark:text-gray-300">{r.name}</p>
            ))}
          </div>
        );

        const renderStatusCard = (label, list, color) => list.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label} ({list.length})</h3>
            </div>
            <div className="mt-2 space-y-1">
              {list.map((r) => (
                <p key={r.user_id} className="text-sm text-gray-700 dark:text-gray-300">
                  {r.name}
                  {r.instrument && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5">{r.instrument}{r.part ? ` ${r.part}` : ''}</span>}
                </p>
              ))}
            </div>
          </div>
        );

        return (
          <>
            {attending.length > 0 && (
              <>
                <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  {t('attendance.attending')} ({attending.length})
                </h2>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {sortedGroups.map(([group, members]) => (
                    <div key={group} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{group} ({members.length})</h3>
                      </div>
                      {renderNames(members)}
                    </div>
                  ))}
                </div>
              </>
            )}

            {(notAttending.length > 0 || maybe.length > 0 || noReply.length > 0) && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {renderStatusCard(t('attendance.notComing'), notAttending, 'bg-red-500')}
                {renderStatusCard(t('attendance.maybe'), maybe, 'bg-yellow-500')}
                {renderStatusCard(t('attendance.noReply'), noReply, 'bg-gray-400')}
              </div>
            )}

            {responses.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <p className="text-gray-400 dark:text-gray-500 text-sm text-center">{t('adminAttendance.noResponses')}</p>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
