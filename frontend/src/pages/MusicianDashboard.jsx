import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';

export default function MusicianDashboard() {
  const { user } = useAuth();
  const { t, tp, currentLang } = useLanguage();
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [rehearsals, setRehearsals] = useState([]);
  const [myAttendance, setMyAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingRehearsals, setLoadingRehearsals] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState({});
  const [showSeasonDetail, setShowSeasonDetail] = useState(false);

  const STATUS_CONFIG = {
    attending: { label: t('attendance.attending'), bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-400', btnBg: 'bg-green-500 hover:bg-green-600' },
    not_attending: { label: t('attendance.notAttending'), bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', btnBg: 'bg-red-500 hover:bg-red-600' },
    maybe: { label: t('attendance.maybe'), bg: 'bg-yellow-50 dark:bg-yellow-900/30', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-400', btnBg: 'bg-yellow-500 hover:bg-yellow-600' },
  };

  useEffect(() => { loadInitial(); }, []);

  useEffect(() => {
    if (selectedSeason) loadRehearsals(selectedSeason);
  }, [selectedSeason]);

  const loadInitial = async () => {
    try {
      const [seasonsRes, attendanceRes, paymentsRes] = await Promise.all([
        apiClient.get('/musician/seasons'),
        apiClient.get('/musician/attendance'),
        apiClient.get('/musician/payments'),
      ]);

      const allSeasons = seasonsRes.data.data;
      setSeasons(allSeasons);

      const attendanceMap = {};
      attendanceRes.data.data.forEach((a) => {
        attendanceMap[a.rehearsal_id] = a.status;
      });
      setMyAttendance(attendanceMap);
      setPaymentStatus(paymentsRes.data.data);

      if (allSeasons.length > 0) {
        const now = new Date();
        const futureSeason = allSeasons.find((s) => {
          const dates = (s.concerts || []).map((c) => new Date(c.concert_date));
          const latest = dates.length > 0 ? new Date(Math.max(...dates)) : null;
          return latest && latest >= now;
        });
        setSelectedSeason(futureSeason ? futureSeason.id : allSeasons[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRehearsals = async (seasonId) => {
    setLoadingRehearsals(true);
    try {
      const res = await apiClient.get(`/musician/seasons/${seasonId}/rehearsals`);
      setRehearsals(res.data.data);
    } catch (error) {
      console.error('Failed to load rehearsals:', error);
    } finally {
      setLoadingRehearsals(false);
    }
  };

  const handleAttendance = async (rehearsalId, status) => {
    setUpdating(rehearsalId);
    try {
      await apiClient.post('/musician/attendance', { rehearsal_id: rehearsalId, status });
      setMyAttendance((prev) => ({ ...prev, [rehearsalId]: status }));
    } catch (error) {
      console.error('Failed to update attendance:', error);
    } finally {
      setUpdating(null);
    }
  };

  const locale = currentLang.locale;
  const formatDate = (dateStr) => new Date(String(dateStr).replace('Z', '')).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (dateStr) => new Date(String(dateStr).replace('Z', '')).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const isPast = (dateStr) => new Date(String(dateStr).replace('Z', '')) < new Date();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('musicianDashboard.hello', { name: user?.name })}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {user?.instrument && <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 px-2 py-0.5 rounded-full text-xs font-medium">{user.instrument}{user.part ? ` ${user.part}` : ''}</span>}
        </p>
      </div>

      {seasons.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <span className="text-4xl">&#127926;</span>
          <p className="text-gray-500 dark:text-gray-400 mt-3">{t('musicianDashboard.noSeasons')}</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t('musicianDashboard.checkBack')}</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {seasons.map((season) => (
              <button
                key={season.id}
                onClick={() => {
                  if (selectedSeason === season.id) {
                    setShowSeasonDetail(true);
                  } else {
                    setSelectedSeason(season.id);
                  }
                }}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedSeason === season.id
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {season.name}
                {selectedSeason === season.id && <span className="ml-1.5 opacity-75">&#9432;</span>}
              </button>
            ))}
          </div>

          {/* Payment status */}
          {(() => {
            const s = seasons.find((s) => s.id === selectedSeason);
            if (!s || !s.season_fee) return null;
            const paid = paymentStatus[selectedSeason];
            return (
              <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                paid
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}>
                <span>{paid ? '\u2705' : '\u274c'}</span>
                <span>{t('musicianDashboard.seasonFee', { amount: Number(s.season_fee).toFixed(2) })} <strong>{paid ? t('common.paid') : t('common.notPaid')}</strong></span>
              </div>
            );
          })()}

          {/* Rehearsals list */}
          {loadingRehearsals ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          ) : rehearsals.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
              <span className="text-4xl">&#128197;</span>
              <p className="text-gray-500 dark:text-gray-400 mt-3">{t('noSeasonsRehearsals')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">{tp('musicianDashboard.rehearsals', rehearsals.length)}</p>
              {rehearsals.map((rehearsal) => {
                const currentStatus = myAttendance[rehearsal.id];
                const statusConf = currentStatus ? STATUS_CONFIG[currentStatus] : null;
                const isUpdating = updating === rehearsal.id;
                const past = isPast(rehearsal.rehearsal_date);

                return (
                  <div key={rehearsal.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border ${statusConf ? statusConf.border : 'border-gray-100 dark:border-gray-700'} overflow-hidden ${past ? 'opacity-60' : ''}`}>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{rehearsal.title}</h3>
                          {past && <span className="text-xs text-gray-400 dark:text-gray-500 italic">{t('musicianDashboard.past')}</span>}
                        </div>
                        {statusConf && (
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConf.bg} ${statusConf.text}`}>
                            {statusConf.label}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300 mt-3">
                        <span className="flex items-center gap-1">&#128197; {formatDate(rehearsal.rehearsal_date)}</span>
                        <span className="flex items-center gap-1">&#128336; {formatTime(rehearsal.rehearsal_date)}</span>
                        {rehearsal.location && <span className="flex items-center gap-1">&#128205; {rehearsal.location}</span>}
                        <span className="flex items-center gap-1">&#9201; {rehearsal.duration_minutes} {t('common.min')}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {Object.entries(STATUS_CONFIG).map(([status, conf]) => (
                          <button
                            key={status}
                            onClick={() => handleAttendance(rehearsal.id, status)}
                            disabled={isUpdating || past}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                              currentStatus === status
                                ? `${conf.btnBg} text-white shadow-sm`
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            } disabled:opacity-50`}
                          >
                            {conf.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Season detail modal */}
          {showSeasonDetail && (() => {
            const season = seasons.find((s) => s.id === selectedSeason);
            if (!season) return null;
            const formatConcertDate = (d) => new Date(d).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            return (
              <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 px-4" onClick={() => setShowSeasonDetail(false)}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{season.name}</h2>

                  {season.maestro && (
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-300">
                      <span>&#127932;</span>
                      <span><strong>{t('musicianDashboard.maestro')}:</strong> {season.maestro}</span>
                    </div>
                  )}

                  {season.season_fee && (
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-300">
                      <span>&#128182;</span>
                      <span><strong>{t('musicianDashboard.seasonFee', { amount: Number(season.season_fee).toFixed(2) }).replace(/:$/, '')}</strong></span>
                    </div>
                  )}

                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('musicianDashboard.concerts')}</h3>
                    {(!season.concerts || season.concerts.length === 0) ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500">{t('musicianDashboard.noConcerts')}</p>
                    ) : (
                      <div className="space-y-2">
                        {season.concerts.map((c, i) => (
                          <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-100">
                              <span>&#127926;</span>
                              <span>{formatConcertDate(c.concert_date)}</span>
                            </div>
                            {c.label && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 ml-6">{c.label}</p>
                            )}
                            {c.venue && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 ml-6">
                                &#128205; {c.venue}{c.venue_address ? <>{' — '}<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.venue_address)}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-600 dark:hover:text-primary-400">{c.venue_address}</a></> : ''}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button onClick={() => setShowSeasonDetail(false)}
                    className="w-full mt-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                    {t('musicianDashboard.close')}
                  </button>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
