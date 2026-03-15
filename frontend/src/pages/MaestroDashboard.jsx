import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';

const STATUS_STYLES = {
  attending: { dot: 'bg-green-500', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  not_attending: { dot: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  maybe: { dot: 'bg-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
};

export default function MaestroDashboard() {
  const { user } = useAuth();
  const { t, currentLang } = useLanguage();
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [rehearsals, setRehearsals] = useState([]);
  const [selectedRehearsal, setSelectedRehearsal] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Message state
  const [showMsgForm, setShowMsgForm] = useState(false);
  const [msgForm, setMsgForm] = useState({ title: '', body: '' });
  const [msgSaving, setMsgSaving] = useState(false);
  const [msgError, setMsgError] = useState('');
  const [msgSuccess, setMsgSuccess] = useState('');

  useEffect(() => { loadSeasons(); }, []);

  useEffect(() => {
    if (selectedSeason) loadRehearsals(selectedSeason);
  }, [selectedSeason]);

  const loadSeasons = async () => {
    try {
      const res = await apiClient.get('/maestro/seasons');
      const data = res.data.data;
      setSeasons(data);
      if (data.length > 0) setSelectedSeason(data[0].id);
    } catch (e) {
      console.error('Failed to load seasons:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadRehearsals = async (seasonId) => {
    try {
      const res = await apiClient.get(`/maestro/seasons/${seasonId}/rehearsals`);
      setRehearsals(res.data.data);
      setSelectedRehearsal(null);
      setAttendanceData(null);
    } catch (e) {
      console.error('Failed to load rehearsals:', e);
    }
  };

  const loadAttendance = async (rehearsalId) => {
    if (selectedRehearsal === rehearsalId) {
      setSelectedRehearsal(null);
      setAttendanceData(null);
      return;
    }
    try {
      const res = await apiClient.get(`/maestro/rehearsals/${rehearsalId}/attendance`);
      setAttendanceData(res.data.data);
      setSelectedRehearsal(rehearsalId);
    } catch (e) {
      console.error('Failed to load attendance:', e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setMsgSaving(true);
    setMsgError('');
    setMsgSuccess('');
    try {
      await apiClient.post('/maestro/messages', msgForm);
      setMsgForm({ title: '', body: '' });
      setShowMsgForm(false);
      setMsgSuccess(t('maestroDashboard.messageSent'));
      setTimeout(() => setMsgSuccess(''), 3000);
    } catch (err) {
      setMsgError(err.response?.data?.message || 'Failed to send');
    } finally {
      setMsgSaving(false);
    }
  };

  const locale = currentLang.locale;
  const formatDate = (d) => new Date(String(d).replace('Z', '')).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (d) => new Date(String(d).replace('Z', '')).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-primary-400 outline-none text-sm dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500";

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  if (seasons.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('maestroDashboard.hello', { name: user?.name })}</h1>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <span className="text-4xl">&#127932;</span>
          <p className="text-gray-500 dark:text-gray-400 mt-3">{t('maestroDashboard.noSeasons')}</p>
        </div>
      </div>
    );
  }

  const currentSeason = seasons.find((s) => s.id === selectedSeason);
  const now = new Date();
  const upcomingRehearsals = rehearsals.filter((r) => new Date(r.rehearsal_date) >= now);
  const pastRehearsals = rehearsals.filter((r) => new Date(r.rehearsal_date) < now);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('maestroDashboard.hello', { name: user?.name })}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.maestro')}</p>
        </div>
        <button onClick={() => { setShowMsgForm(true); setMsgError(''); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">
          {t('maestroDashboard.newMessage')}
        </button>
      </div>

      {msgSuccess && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm p-3 rounded-lg">{msgSuccess}</div>
      )}

      {/* Season selector */}
      {seasons.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {seasons.map((s) => (
            <button key={s.id} onClick={() => setSelectedSeason(s.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                selectedSeason === s.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Season info */}
      {currentSeason && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{currentSeason.name}</h2>
          {currentSeason.concerts && currentSeason.concerts.length > 0 && (
            <div className="mt-2 space-y-1">
              {currentSeason.concerts.map((c, i) => (
                <div key={i} className="text-sm text-gray-500 dark:text-gray-400">
                  &#127926; {formatDate(c.concert_date)}
                  {c.label && <span className="ml-1">&mdash; {c.label}</span>}
                  {c.venue && <span className="ml-2">&#128205; {c.venue}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rehearsals list */}
      <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('maestroDashboard.rehearsals')}</h2>
      {rehearsals.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <p className="text-gray-400 dark:text-gray-500 text-sm">{t('noSeasonsRehearsals')}</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {[...upcomingRehearsals, ...pastRehearsals].map((r) => {
            const isPast = new Date(r.rehearsal_date) < now;
            const isSelected = selectedRehearsal === r.id;
            return (
              <div key={r.id}>
                <button onClick={() => loadAttendance(r.id)}
                  className={`w-full text-left bg-white dark:bg-gray-800 shadow-sm border p-3 transition-colors ${
                    isSelected
                      ? 'border-primary-400 dark:border-primary-500 rounded-t-xl rounded-b-none'
                      : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl'
                  } ${isPast ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{r.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(r.rehearsal_date)} &middot; {formatTime(r.rehearsal_date)}
                        {r.location && <span className="ml-2">&#128205; {r.location}</span>}
                      </p>
                    </div>
                    <svg className={`w-4 h-4 text-primary-600 dark:text-primary-400 transition-transform ${isSelected ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isSelected && attendanceData && (
                  <div className="bg-white dark:bg-gray-800 border border-t-0 border-primary-400 dark:border-primary-500 rounded-b-xl p-4">
                    {/* Summary cards */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[
                        { label: t('attendance.attending'), count: attendanceData.summary.attending, color: 'bg-green-500' },
                        { label: t('attendance.notComing'), count: attendanceData.summary.not_attending, color: 'bg-red-500' },
                        { label: t('attendance.maybe'), count: attendanceData.summary.maybe, color: 'bg-yellow-500' },
                        { label: t('attendance.noReply'), count: Math.max(0, attendanceData.responses.length - attendanceData.summary.total_responses), color: 'bg-gray-400' },
                      ].map((item) => (
                        <div key={item.label} className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                          <div className={`w-2.5 h-2.5 rounded-full ${item.color} mx-auto mb-1`}></div>
                          <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{item.count}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">{item.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Grouped by instrument */}
                    {(() => {
                      const attending = attendanceData.responses.filter((resp) => resp.status === 'attending');
                      const notAttending = attendanceData.responses.filter((resp) => resp.status === 'not_attending');
                      const maybe = attendanceData.responses.filter((resp) => resp.status === 'maybe');
                      const noReply = attendanceData.responses.filter((resp) => !resp.status);

                      const instrumentGroups = {};
                      attending.forEach((resp) => {
                        let group = resp.instrument || t('adminAttendance.unknownInstrument');
                        if (group.toLowerCase() === 'violin' && resp.part) group = `${resp.instrument} ${resp.part}`;
                        if (!instrumentGroups[group]) instrumentGroups[group] = [];
                        instrumentGroups[group].push(resp);
                      });

                      const sortedGroups = Object.entries(instrumentGroups).sort(([a], [b]) => a.localeCompare(b));

                      const renderList = (label, list, color) => list.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${color}`}></div>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{label} ({list.length})</span>
                          </div>
                          {list.map((resp) => (
                            <p key={resp.user_id} className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                              {resp.name}
                              {resp.instrument && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{resp.instrument}{resp.part ? ` ${resp.part}` : ''}</span>}
                            </p>
                          ))}
                        </div>
                      );

                      return (
                        <div className="space-y-2">
                          {sortedGroups.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                              {sortedGroups.map(([group, members]) => (
                                <div key={group} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{group} ({members.length})</span>
                                  </div>
                                  {members.map((resp) => (
                                    <p key={resp.user_id} className="text-sm text-gray-700 dark:text-gray-300 ml-4">{resp.name}</p>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            {renderList(t('attendance.notComing'), notAttending, 'bg-red-500')}
                            {renderList(t('attendance.maybe'), maybe, 'bg-yellow-500')}
                            {renderList(t('attendance.noReply'), noReply, 'bg-gray-400')}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Message form modal */}
      {showMsgForm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleSendMessage} className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('maestroDashboard.newMessage')}</h2>

            {msgError && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">{msgError}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('adminMessages.messageTitle')}</label>
              <input type="text" value={msgForm.title} onChange={(e) => setMsgForm({ ...msgForm, title: e.target.value })}
                className={inputClass} placeholder={t('adminMessages.titlePlaceholder')} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('adminMessages.messageBody')}</label>
              <textarea value={msgForm.body} onChange={(e) => setMsgForm({ ...msgForm, body: e.target.value })}
                className={inputClass + " min-h-[120px] resize-y"} placeholder={t('adminMessages.bodyPlaceholder')} required rows={5} />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setShowMsgForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={msgSaving}
                className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {msgSaving ? t('common.saving') : t('maestroDashboard.send')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
