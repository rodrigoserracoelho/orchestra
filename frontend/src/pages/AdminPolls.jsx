import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { INSTRUMENTS } from '../constants/orchestra';
import apiClient from '../services/apiClient';
import BackLink from '../components/Common/BackLink';

const EMPTY_FORM = {
  title: '', description: '', rehearsal_type: 'tutti', location_id: '',
  duration_minutes: 120, audience: 'all', audience_instrument: '', closes_at: '',
};

export default function AdminPolls() {
  const { seasonId } = useParams();
  const { t, tp, currentLang } = useLanguage();
  const [season, setSeason] = useState(null);
  const [polls, setPolls] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [dates, setDates] = useState(['']);
  const [saving, setSaving] = useState(false);
  const [openPoll, setOpenPoll] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => { loadData(); }, [seasonId]);

  const loadData = async () => {
    try {
      const [seasonRes, pollsRes, locationsRes] = await Promise.all([
        apiClient.get(`/admin/seasons/${seasonId}`),
        apiClient.get(`/admin/seasons/${seasonId}/polls`),
        apiClient.get('/admin/locations'),
      ]);
      setSeason(seasonRes.data.data);
      setPolls(pollsRes.data.data);
      setLocations(locationsRes.data.data);
    } catch (e) {
      console.error('Failed to load polls:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async (pollId) => {
    if (openPoll === pollId) { setOpenPoll(null); setResults(null); return; }
    try {
      const res = await apiClient.get(`/admin/polls/${pollId}`);
      setResults(res.data.data);
      setOpenPoll(pollId);
    } catch (e) {
      console.error('Failed to load results:', e);
    }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDates(['']);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = async (poll) => {
    const res = await apiClient.get(`/admin/polls/${poll.id}`);
    const { poll: p, options } = res.data.data;
    setForm({
      title: p.title,
      description: p.description || '',
      rehearsal_type: p.rehearsal_type,
      location_id: p.location_id || '',
      duration_minutes: p.duration_minutes,
      audience: p.audience,
      audience_instrument: p.audience_instrument || '',
      closes_at: p.closes_at ? String(p.closes_at).replace('Z', '').slice(0, 16) : '',
    });
    setDates(options.map((o) => String(o.option_date).replace('Z', '').slice(0, 16)));
    setEditId(poll.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const options = dates.filter(Boolean);
    if (options.length === 0) {
      alert(t('adminPolls.needOneDate'));
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, options, location_id: form.location_id || null };
      if (editId) {
        await apiClient.patch(`/admin/polls/${editId}`, payload);
      } else {
        await apiClient.post('/admin/polls', { ...payload, season_id: parseInt(seasonId) });
      }
      setShowForm(false);
      setEditId(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || t('adminPolls.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (pollId, optionId) => {
    if (!confirm(t('adminPolls.closeConfirm'))) return;
    try {
      await apiClient.post(`/admin/polls/${pollId}/close`, { option_id: optionId });
      setOpenPoll(null);
      setResults(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || t('adminPolls.closeFailed'));
    }
  };

  const handleReopen = async (pollId) => {
    try {
      await apiClient.post(`/admin/polls/${pollId}/reopen`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || t('adminPolls.saveFailed'));
    }
  };

  const handleDelete = async (pollId) => {
    if (!confirm(t('adminPolls.deleteConfirm'))) return;
    try {
      await apiClient.delete(`/admin/polls/${pollId}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || t('adminPolls.deleteFailed'));
    }
  };

  const locale = currentLang.locale;
  const formatSlot = (d) => {
    const dt = new Date(String(d).replace('Z', ''));
    return dt.toLocaleString(locale, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-primary-400 outline-none text-sm dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1";
  const selectClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-primary-400 outline-none text-sm bg-white dark:bg-gray-700 dark:text-gray-100";

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  // The slot most people can make, counting a "maybe" as half a yes.
  const bestOptionId = (() => {
    if (!results?.options?.length) return null;
    const score = (o) => o.yes_count + o.maybe_count * 0.5;
    return results.options.reduce((best, o) => (score(o) > score(best) ? o : best)).id;
  })();

  const voteFor = (optionId, userId) =>
    results.votes.find((v) => v.option_id === optionId && v.user_id === userId)?.availability;

  const CELL = {
    yes: { mark: '✓', cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    maybe: { mark: '?', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
    no: { mark: '✗', cls: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300' },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <BackLink to="/admin/seasons" label={t('adminRehearsals.backToSeasons')} />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('adminPolls.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{season?.name} &middot; {tp('adminPolls.pollCount', polls.length)}</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">
          {t('adminPolls.addPoll')}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {editId ? t('adminPolls.editPoll') : t('adminPolls.newPoll')}
            </h2>

            <div>
              <label className={labelClass}>{t('adminRehearsals.titleLabel')}</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass} placeholder={t('adminPolls.titlePlaceholder')} required />
            </div>

            <div>
              <label className={labelClass}>{t('adminPolls.descriptionLabel')}</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputClass} rows="2" placeholder={t('adminPolls.descriptionPlaceholder')} />
            </div>

            <div>
              <label className={labelClass}>{t('adminPolls.dateOptions')}</label>
              <div className="space-y-2">
                {dates.map((d, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="datetime-local" value={d}
                      onChange={(e) => setDates(dates.map((v, j) => (j === i ? e.target.value : v)))}
                      className={inputClass} />
                    <button type="button" onClick={() => setDates(dates.length === 1 ? [''] : dates.filter((_, j) => j !== i))}
                      className="px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setDates([...dates, ''])}
                className="mt-2 text-sm text-primary-600 hover:underline">{t('adminPolls.addDate')}</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('adminRehearsals.typeLabel')}</label>
                <select value={form.rehearsal_type} onChange={(e) => setForm({ ...form, rehearsal_type: e.target.value })}
                  className={selectClass}>
                  <option value="tutti">{t('adminRehearsals.typeTutti')}</option>
                  <option value="sectionelle">{t('adminRehearsals.typeSectionelle')}</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('adminRehearsals.durationShort')}</label>
                <input type="number" value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
                  className={inputClass} min="30" max="480" />
              </div>
            </div>

            <div>
              <label className={labelClass}>{t('adminRehearsals.location')}</label>
              <select value={form.location_id} onChange={(e) => setForm({ ...form, location_id: e.target.value })}
                className={selectClass}>
                <option value="">{t('adminRehearsals.noLocation')}</option>
                {locations.filter((l) => l.active || String(l.id) === String(form.location_id)).map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('adminPolls.audienceLabel')}</label>
                <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className={selectClass}>
                  <option value="all">{t('adminPolls.audienceAll')}</option>
                  <option value="instrument">{t('adminPolls.audienceInstrument')}</option>
                </select>
              </div>
              {form.audience === 'instrument' && (
                <div>
                  <label className={labelClass}>{t('adminMusicians.instrument')}</label>
                  <select value={form.audience_instrument}
                    onChange={(e) => setForm({ ...form, audience_instrument: e.target.value })}
                    className={selectClass} required>
                    <option value="">{t('adminMusicians.unspecified')}</option>
                    {INSTRUMENTS.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>{t('adminPolls.closesAtLabel')}</label>
              <input type="datetime-local" value={form.closes_at}
                onChange={(e) => setForm({ ...form, closes_at: e.target.value })} className={inputClass} />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">{t('common.cancel')}</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {saving ? t('common.saving') : (editId ? t('common.update') : t('common.create'))}
              </button>
            </div>
          </form>
        </div>
      )}

      {polls.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <span className="text-4xl">&#128197;</span>
          <p className="text-gray-500 dark:text-gray-400 mt-3">{t('adminPolls.noPolls')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {polls.map((p) => {
            const closed = p.status === 'closed';
            return (
              <div key={p.id} className={`rounded-2xl shadow-sm border p-4 ${
                closed
                  ? 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700'
                  : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                      <span className={`inline-block text-xs px-1.5 py-0.5 mr-1.5 rounded-full font-semibold ${
                        closed
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                      }`}>
                        {closed ? t('adminPolls.closed') : t('adminPolls.open')}
                      </span>
                      {p.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{tp('adminPolls.optionCount', p.option_count)}</span>
                      <span>&#128100; {t('adminPolls.responseRatio', { answered: p.respondent_count, total: p.eligible_count })}</span>
                      <span>{p.audience === 'instrument' ? p.audience_instrument : t('adminPolls.audienceAll')}</span>
                      {p.location_name && <span>&#128205; {p.location_name}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!closed && (
                      <button onClick={() => openEdit(p)}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/30 rounded-lg text-sm">&#9999;&#65039;</button>
                    )}
                    {closed && (
                      <button onClick={() => handleReopen(p.id)} title={t('adminPolls.reopen')}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/30 rounded-lg text-sm">&#8634;</button>
                    )}
                    <button onClick={() => handleDelete(p.id)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 rounded-lg text-sm">&#128465;&#65039;</button>
                  </div>
                </div>

                {p.eligible_count === 0 && (
                  <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg px-3 py-2">
                    {t('adminPolls.noAudience')}
                  </p>
                )}

                {closed && p.rehearsal_id && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {t('adminPolls.rehearsalCreated')}
                  </p>
                )}

                <button onClick={() => loadResults(p.id)}
                  className="block w-full mt-3 text-center py-2 rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/50">
                  {openPoll === p.id ? t('adminPolls.hideResults') : t('adminPolls.viewResults')}
                </button>

                {openPoll === p.id && results && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left p-2 font-medium text-gray-600 dark:text-gray-300">{t('adminPolls.musician')}</th>
                          {results.options.map((o) => (
                            <th key={o.id} className={`p-2 font-medium whitespace-nowrap ${
                              o.id === bestOptionId ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300'
                            }`}>
                              {formatSlot(o.option_date)}
                              <div className="font-normal text-[11px] text-gray-400 dark:text-gray-500">
                                {o.yes_count} &#10003; &middot; {o.maybe_count} ? &middot; {o.no_count} &#10007;
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.voters.map((v) => (
                          <tr key={v.id} className="border-t border-gray-100 dark:border-gray-700">
                            <td className="p-2 text-gray-700 dark:text-gray-200 whitespace-nowrap">
                              {v.name}
                              {v.instrument && <span className="text-gray-400 dark:text-gray-500"> &middot; {v.instrument}</span>}
                            </td>
                            {results.options.map((o) => {
                              const cell = CELL[voteFor(o.id, v.id)];
                              return (
                                <td key={o.id} className="p-1 text-center">
                                  <span className={`inline-block w-6 h-6 leading-6 rounded-full font-semibold ${
                                    cell ? cell.cls : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500'
                                  }`}>
                                    {cell ? cell.mark : '·'}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {!closed && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{t('adminPolls.pickWinner')}</p>
                        {results.options.map((o) => (
                          <button key={o.id} onClick={() => handleClose(p.id, o.id)}
                            className={`block w-full text-left px-3 py-2 rounded-xl text-sm border ${
                              o.id === bestOptionId
                                ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}>
                            {formatSlot(o.option_date)}
                            <span className="float-right">{o.yes_count} &#10003;</span>
                          </button>
                        ))}
                      </div>
                    )}
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
