import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';

export default function AdminRehearsals() {
  const { seasonId } = useParams();
  const { t, tp, currentLang } = useLanguage();
  const [season, setSeason] = useState(null);
  const [rehearsals, setRehearsals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', location: '', rehearsal_date: '', duration_minutes: 120, notes: '' });
  const [saving, setSaving] = useState(false);

  const [recurring, setRecurring] = useState(false);
  const [recurDay, setRecurDay] = useState(1);
  const [recurTime, setRecurTime] = useState('19:00');
  const [recurStart, setRecurStart] = useState('');
  const [recurTitle, setRecurTitle] = useState('');
  const [recurLocation, setRecurLocation] = useState('');
  const [recurDuration, setRecurDuration] = useState(120);
  const [recurPreview, setRecurPreview] = useState([]);

  const DAYS = t('adminRehearsals.days');

  useEffect(() => { loadData(); }, [seasonId]);

  const loadData = async () => {
    try {
      const [seasonRes, rehearsalsRes] = await Promise.all([
        apiClient.get(`/admin/seasons/${seasonId}`),
        apiClient.get(`/admin/seasons/${seasonId}/rehearsals`),
      ]);
      setSeason(seasonRes.data.data);
      setRehearsals(rehearsalsRes.data.data);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  const getEndDate = () => {
    if (!season?.concerts || season.concerts.length === 0) return null;
    const dates = season.concerts.map((c) => c.concert_date.split('T')[0]).sort();
    return dates[0];
  };

  useEffect(() => {
    if (!recurring) { setRecurPreview([]); return; }
    const endDate = getEndDate();
    if (!recurStart || !endDate) { setRecurPreview([]); return; }

    const dates = [];
    const start = new Date(recurStart + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    let current = new Date(start);
    const targetDay = parseInt(recurDay);
    while (current.getDay() !== targetDay) {
      current.setDate(current.getDate() + 1);
    }

    while (current < end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 7);
    }

    setRecurPreview(dates);
  }, [recurring, recurDay, recurStart, season]);

  const openCreate = () => {
    setForm({ title: '', location: '', rehearsal_date: '', duration_minutes: 120, notes: '' });
    setEditId(null);
    setRecurring(false);
    setRecurTitle('');
    setRecurLocation('');
    setRecurDuration(120);
    setRecurTime('19:00');
    setRecurStart('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await apiClient.patch(`/admin/rehearsals/${editId}`, form);
      } else {
        await apiClient.post('/admin/rehearsals', { ...form, season_id: parseInt(seasonId) });
      }
      setShowForm(false);
      setEditId(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleRecurringSubmit = async (e) => {
    e.preventDefault();
    if (recurPreview.length === 0) {
      alert(t('adminRehearsals.noDatesGenerated'));
      return;
    }
    setSaving(true);
    try {
      const rehearsalList = recurPreview.map((date) => ({
        title: recurTitle,
        location: recurLocation,
        rehearsal_date: `${date}T${recurTime}:00`,
        duration_minutes: recurDuration,
      }));
      await apiClient.post('/admin/rehearsals/bulk', {
        season_id: parseInt(seasonId),
        rehearsals: rehearsalList,
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || t('adminRehearsals.failedCreate'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (r) => {
    const raw = r.rehearsal_date.replace('Z', '').slice(0, 16);
    setForm({ title: r.title, location: r.location || '', rehearsal_date: raw, duration_minutes: r.duration_minutes, notes: r.notes || '' });
    setEditId(r.id);
    setRecurring(false);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm(t('adminRehearsals.deleteConfirm'))) return;
    try {
      await apiClient.delete(`/admin/rehearsals/${id}`);
      loadData();
    } catch (e) {
      alert(t('adminRehearsals.deleteFailed'));
    }
  };

  const locale = currentLang.locale;
  const formatDate = (d) => {
    const dt = new Date(String(d).replace('Z', ''));
    return dt.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  };
  const formatTime = (d) => {
    const dt = new Date(String(d).replace('Z', ''));
    return dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-primary-400 outline-none text-sm dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1";
  const selectClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-primary-400 outline-none text-sm bg-white dark:bg-gray-700 dark:text-gray-100";

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  const endDate = getEndDate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link to="/admin/seasons" className="text-sm text-primary-600 hover:underline">{t('adminRehearsals.backToSeasons')}</Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{season?.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{tp('adminRehearsals.rehearsalCount', rehearsals.length)}</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">
          {t('adminRehearsals.addRehearsal')}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 px-4">
          {!editId && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setRecurring(false)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium ${!recurring ? 'bg-primary-600 text-white' : 'border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                  {t('adminRehearsals.single')}
                </button>
                <button type="button" onClick={() => setRecurring(true)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium ${recurring ? 'bg-primary-600 text-white' : 'border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                  {t('adminRehearsals.recurring')}
                </button>
              </div>

              {!recurring ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('adminRehearsals.newRehearsal')}</h2>
                  <div>
                    <label className={labelClass}>{t('adminRehearsals.titleLabel')}</label>
                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className={inputClass} placeholder={t('adminRehearsals.titlePlaceholder')} required />
                  </div>
                  <div>
                    <label className={labelClass}>{t('adminRehearsals.dateTime')}</label>
                    <input type="datetime-local" value={form.rehearsal_date} onChange={(e) => setForm({ ...form, rehearsal_date: e.target.value })}
                      className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>{t('adminRehearsals.location')}</label>
                    <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className={inputClass} placeholder={t('adminRehearsals.locationPlaceholder')} />
                  </div>
                  <div>
                    <label className={labelClass}>{t('adminRehearsals.duration')}</label>
                    <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
                      className={inputClass} min="30" max="480" />
                  </div>
                  <div>
                    <label className={labelClass}>{t('adminRehearsals.notes')}</label>
                    <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className={inputClass} rows="2" placeholder={t('adminRehearsals.notesPlaceholder')} />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowForm(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">{t('common.cancel')}</button>
                    <button type="submit" disabled={saving}
                      className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                      {saving ? t('common.saving') : t('common.create')}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRecurringSubmit} className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('adminRehearsals.recurringRehearsal')}</h2>

                  {!endDate && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm p-3 rounded-lg">
                      {t('adminRehearsals.noConcertDates')}
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>{t('adminRehearsals.titleLabel')}</label>
                    <input type="text" value={recurTitle} onChange={(e) => setRecurTitle(e.target.value)}
                      className={inputClass} placeholder={t('adminRehearsals.recurTitlePlaceholder')} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>{t('adminRehearsals.dayOfWeek')}</label>
                      <select value={recurDay} onChange={(e) => setRecurDay(parseInt(e.target.value))}
                        className={selectClass}>
                        {DAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>{t('adminRehearsals.time')}</label>
                      <input type="time" value={recurTime} onChange={(e) => setRecurTime(e.target.value)}
                        className={inputClass} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>{t('adminRehearsals.startFrom')}</label>
                      <input type="date" value={recurStart} onChange={(e) => setRecurStart(e.target.value)}
                        className={inputClass} required />
                    </div>
                    <div>
                      <label className={labelClass}>{t('adminRehearsals.untilAuto')}</label>
                      <input type="text" value={endDate ? formatDate(endDate + 'T00:00:00') : t('adminRehearsals.noConcerts')} disabled
                        className={inputClass + " opacity-60"} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>{t('adminRehearsals.location')}</label>
                      <input type="text" value={recurLocation} onChange={(e) => setRecurLocation(e.target.value)}
                        className={inputClass} placeholder={t('adminRehearsals.locationPlaceholder')} />
                    </div>
                    <div>
                      <label className={labelClass}>{t('adminRehearsals.durationShort')}</label>
                      <input type="number" value={recurDuration} onChange={(e) => setRecurDuration(parseInt(e.target.value))}
                        className={inputClass} min="30" max="480" />
                    </div>
                  </div>

                  {recurPreview.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                        {tp('adminRehearsals.willCreate', recurPreview.length)}
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-0.5">
                        {recurPreview.map((date) => (
                          <p key={date} className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(date + 'T00:00:00')} &mdash; {date} at {recurTime}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowForm(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">{t('common.cancel')}</button>
                    <button type="submit" disabled={saving || recurPreview.length === 0}
                      className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                      {saving ? t('adminRehearsals.creating') : tp('adminRehearsals.createCount', recurPreview.length)}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {editId && (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('adminRehearsals.editRehearsal')}</h2>
              <div>
                <label className={labelClass}>{t('adminRehearsals.titleLabel')}</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClass} placeholder={t('adminRehearsals.titlePlaceholder')} required />
              </div>
              <div>
                <label className={labelClass}>{t('adminRehearsals.dateTime')}</label>
                <input type="datetime-local" value={form.rehearsal_date} onChange={(e) => setForm({ ...form, rehearsal_date: e.target.value })}
                  className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>{t('adminRehearsals.location')}</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className={inputClass} placeholder={t('adminRehearsals.locationPlaceholder')} />
              </div>
              <div>
                <label className={labelClass}>{t('adminRehearsals.duration')}</label>
                <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
                  className={inputClass} min="30" max="480" />
              </div>
              <div>
                <label className={labelClass}>{t('adminRehearsals.notes')}</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={inputClass} rows="2" placeholder={t('adminRehearsals.notesPlaceholder')} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">{t('common.cancel')}</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                  {saving ? t('common.saving') : t('common.update')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {rehearsals.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <span className="text-4xl">&#128197;</span>
          <p className="text-gray-500 dark:text-gray-400 mt-3">{t('adminRehearsals.noRehearsals')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rehearsals.map((r) => (
            <div key={r.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">{r.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>&#128197; {formatDate(r.rehearsal_date)}</span>
                    <span>&#128336; {formatTime(r.rehearsal_date)}</span>
                    {r.location && <span>&#128205; {r.location}</span>}
                    <span>&#9201; {r.duration_minutes} {t('common.min')}</span>
                  </div>
                  {r.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{r.notes}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(r)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/30 rounded-lg text-sm">&#9999;&#65039;</button>
                  <button onClick={() => handleDelete(r.id)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 rounded-lg text-sm">&#128465;&#65039;</button>
                </div>
              </div>
              <Link to={`/admin/rehearsals/${r.id}/attendance`}
                className="block mt-3 text-center py-2 rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/50">
                {t('adminRehearsals.viewAttendance')}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
