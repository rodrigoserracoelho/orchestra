import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';
import BackLink from '../components/Common/BackLink';

const CHOICES = [
  { key: 'yes', mark: '✓', on: 'bg-green-600 text-white', off: 'border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400' },
  { key: 'maybe', mark: '?', on: 'bg-yellow-500 text-white', off: 'border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400' },
  { key: 'no', mark: '✗', on: 'bg-red-600 text-white', off: 'border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400' },
];

export default function MusicianPolls() {
  const { t, tp, currentLang } = useLanguage();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [myVotes, setMyVotes] = useState({});
  const [openId, setOpenId] = useState(null);
  const [saving, setSaving] = useState(null);

  useEffect(() => { loadPolls(); }, []);

  const loadPolls = async () => {
    try {
      const res = await apiClient.get('/musician/polls');
      setPolls(res.data.data);
    } catch (e) {
      console.error('Failed to load polls:', e);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (pollId) => {
    if (openId === pollId) { setOpenId(null); setDetail(null); return; }
    try {
      const res = await apiClient.get(`/musician/polls/${pollId}`);
      setDetail(res.data.data);
      setMyVotes(res.data.data.myVotes);
      setOpenId(pollId);
    } catch (e) {
      console.error('Failed to load poll:', e);
    }
  };

  const handleVote = async (pollId, optionId, availability) => {
    setSaving(optionId);
    const previous = myVotes[optionId];
    setMyVotes((prev) => ({ ...prev, [optionId]: availability }));
    try {
      await apiClient.post(`/musician/polls/${pollId}/vote`, { option_id: optionId, availability });
      loadPolls();
    } catch (err) {
      setMyVotes((prev) => ({ ...prev, [optionId]: previous }));
      alert(err.response?.data?.message || t('musicianPolls.voteFailed'));
    } finally {
      setSaving(null);
    }
  };

  const locale = currentLang.locale;
  const formatSlot = (d) => {
    const dt = new Date(String(d).replace('Z', ''));
    return dt.toLocaleString(locale, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <BackLink />
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">{t('musicianPolls.title')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('musicianPolls.subtitle')}</p>

      {polls.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <span className="text-4xl">&#128197;</span>
          <p className="text-gray-500 dark:text-gray-400 mt-3">{t('musicianPolls.noPolls')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {polls.map((p) => {
            const answered = p.my_vote_count >= p.option_count;
            return (
              <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{p.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{p.season_name}</span>
                      {p.location_name && <span>&#128205; {p.location_name}</span>}
                      {p.closes_at && <span>&#9201; {t('musicianPolls.closesOn')} {formatSlot(p.closes_at)}</span>}
                    </div>
                    {p.description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{p.description}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                    answered
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                  }`}>
                    {answered ? t('musicianPolls.answered') : tp('musicianPolls.pending', p.option_count - p.my_vote_count)}
                  </span>
                </div>

                <button onClick={() => openDetail(p.id)}
                  className="block w-full mt-3 text-center py-2 rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/50">
                  {openId === p.id ? t('musicianPolls.hide') : t('musicianPolls.respond')}
                </button>

                {openId === p.id && detail && (
                  <div className="mt-3 space-y-2">
                    {detail.options.map((o) => (
                      <div key={o.id} className="flex items-center justify-between gap-3 py-2 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-sm text-gray-700 dark:text-gray-200">{formatSlot(o.option_date)}</span>
                        <div className="flex gap-1">
                          {CHOICES.map((c) => (
                            <button key={c.key} disabled={saving === o.id}
                              onClick={() => handleVote(p.id, o.id, c.key)}
                              title={t(`musicianPolls.${c.key}`)}
                              className={`w-9 h-9 rounded-xl text-sm font-semibold disabled:opacity-50 ${
                                myVotes[o.id] === c.key ? c.on : c.off
                              }`}>
                              {c.mark}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
