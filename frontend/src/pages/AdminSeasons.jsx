import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';

const emptyConcert = { concert_date: '', label: '', venue: '', venue_address: '' };
const emptyForm = { name: '', maestro: '', maestro_id: '', active: true, season_fee: '', concerts: [{ ...emptyConcert }] };

export default function AdminSeasons() {
  const { t, currentLang } = useLanguage();
  const [seasons, setSeasons] = useState([]);
  const [maestros, setMaestros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => { loadSeasons(); loadMaestros(); }, []);

  const loadSeasons = async () => {
    try {
      const res = await apiClient.get('/admin/seasons');
      setSeasons(res.data.data);
    } catch (e) {
      console.error('Failed to load seasons:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMaestros = async () => {
    try {
      const res = await apiClient.get('/admin/musicians');
      setMaestros(res.data.data.filter((m) => m.role === 'maestro' && m.active));
    } catch (e) {
      console.error('Failed to load maestros:', e);
    }
  };

  const openCreate = () => {
    setForm({ ...emptyForm, concerts: [{ ...emptyConcert }] });
    setEditId(null);
    setSaveError('');
    setShowForm(true);
  };

  const handleEdit = (season) => {
    setForm({
      name: season.name,
      maestro: season.maestro || '',
      maestro_id: season.maestro_id || '',
      active: season.active !== undefined ? !!season.active : true,
      season_fee: season.season_fee || '',
      concerts: season.concerts && season.concerts.length > 0
        ? season.concerts.map((c) => ({
            id: c.id,
            concert_date: c.concert_date.split('T')[0],
            label: c.label || '',
            venue: c.venue || '',
            venue_address: c.venue_address || '',
          }))
        : [{ ...emptyConcert }],
    });
    setEditId(season.id);
    setSaveError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validConcerts = form.concerts.filter((c) => c.concert_date);
    if (validConcerts.length === 0) {
      setSaveError(t('adminSeasons.concertRequired'));
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const payload = { ...form, season_fee: form.season_fee ? parseFloat(form.season_fee) : null, maestro_id: form.maestro_id ? parseInt(form.maestro_id) : null, concerts: validConcerts };
      if (editId) {
        await apiClient.patch(`/admin/seasons/${editId}`, payload);
      } else {
        await apiClient.post('/admin/seasons', payload);
      }
      setShowForm(false);
      setEditId(null);
      loadSeasons();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('adminSeasons.deleteConfirm'))) return;
    try {
      await apiClient.delete(`/admin/seasons/${id}`);
      loadSeasons();
    } catch (e) {
      alert(t('adminSeasons.deleteFailed'));
    }
  };

  const addConcert = () => {
    setForm({ ...form, concerts: [...form.concerts, { ...emptyConcert }] });
  };

  const updateConcert = (index, field, value) => {
    const updated = form.concerts.map((c, i) => i === index ? { ...c, [field]: value } : c);
    setForm({ ...form, concerts: updated });
  };

  const removeConcert = (index) => {
    if (form.concerts.length <= 1) return;
    setForm({ ...form, concerts: form.concerts.filter((_, i) => i !== index) });
  };

  const formatDate = (d) => new Date(d).toLocaleDateString(currentLang.locale, { year: 'numeric', month: 'long', day: 'numeric' });

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-primary-400 outline-none text-sm dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1";

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('adminSeasons.title')}</h1>
        <button onClick={openCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">
          {t('adminSeasons.newSeason')}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{editId ? t('adminSeasons.editSeason') : t('adminSeasons.newSeasonForm')}</h2>

            {saveError && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">{saveError}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className={labelClass}>{t('adminSeasons.seasonName')}</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass} placeholder={t('adminSeasons.namePlaceholder')} required />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className={labelClass}>{t('adminSeasons.maestro')}</label>
                {maestros.length > 0 ? (
                  <select value={form.maestro_id} onChange={(e) => {
                    const id = e.target.value;
                    const selected = maestros.find((m) => m.id === parseInt(id));
                    setForm({ ...form, maestro_id: id, maestro: selected ? selected.name : '' });
                  }}
                    className={inputClass + " bg-white dark:bg-gray-700"}>
                    <option value="">{t('adminSeasons.noMaestro')}</option>
                    {maestros.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                ) : (
                  <input type="text" value={form.maestro} onChange={(e) => setForm({ ...form, maestro: e.target.value })}
                    className={inputClass} placeholder={t('adminSeasons.maestroPlaceholder')} />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('adminSeasons.seasonFee')}</label>
                <div className="relative">
                  <input type="number" step="0.01" min="0" value={form.season_fee} onChange={(e) => setForm({ ...form, season_fee: e.target.value })}
                    className={inputClass + " pr-8"} placeholder="0.00" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">&euro;</span>
                </div>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('adminSeasons.activeSeason')}</span>
                </label>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className={labelClass + " mb-0"}>{t('adminSeasons.concerts')}</label>
                <button type="button" onClick={addConcert}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                  {t('adminSeasons.addConcert')}
                </button>
              </div>
              <div className="space-y-3">
                {form.concerts.map((c, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-2 relative">
                    {form.concerts.length > 1 && (
                      <button type="button" onClick={() => removeConcert(i)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-xs">
                        &#10005;
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('adminSeasons.date')}</label>
                        <input type="date" value={c.concert_date} onChange={(e) => updateConcert(i, 'concert_date', e.target.value)}
                          className={inputClass} required />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('adminSeasons.label')}</label>
                        <input type="text" value={c.label} onChange={(e) => updateConcert(i, 'label', e.target.value)}
                          className={inputClass} placeholder={t('adminSeasons.labelPlaceholder')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('adminSeasons.venue')}</label>
                        <input type="text" value={c.venue} onChange={(e) => updateConcert(i, 'venue', e.target.value)}
                          className={inputClass} placeholder={t('adminSeasons.venuePlaceholder')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('adminSeasons.venueAddress')}</label>
                        <input type="text" value={c.venue_address} onChange={(e) => updateConcert(i, 'venue_address', e.target.value)}
                          className={inputClass} placeholder={t('adminSeasons.addressPlaceholder')} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">{t('common.cancel')}</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {saving ? t('common.saving') : editId ? t('common.update') : t('common.create')}
              </button>
            </div>
          </form>
        </div>
      )}

      {seasons.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <span className="text-4xl">&#127932;</span>
          <p className="text-gray-500 dark:text-gray-400 mt-3">{t('adminSeasons.noSeasons')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {seasons.map((season) => (
            <div key={season.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{season.name}</h3>
                    {!season.active && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400">{t('common.inactive')}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    {season.maestro && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">&#127932; {season.maestro}</span>
                    )}
                    {season.season_fee && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">&#128182; {Number(season.season_fee).toFixed(2)} &euro;</span>
                    )}
                  </div>
                  {season.concerts && season.concerts.length > 0 && (
                    <div className="mt-1.5 space-y-1">
                      {season.concerts.map((c, i) => (
                        <div key={i} className="text-sm text-gray-500 dark:text-gray-400">
                          <span>&#127926; {formatDate(c.concert_date)}</span>
                          {c.label && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">&mdash; {c.label}</span>}
                          {c.venue && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                              &#128205; {c.venue}
                              {c.venue_address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.venue_address)}`} target="_blank" rel="noopener noreferrer" className="ml-0.5 underline hover:text-primary-600 dark:hover:text-primary-400">({c.venue_address})</a>}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(season)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/30 rounded-lg text-sm">&#9999;&#65039;</button>
                  <button onClick={() => handleDelete(season.id)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 rounded-lg text-sm">&#128465;&#65039;</button>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Link to={`/admin/seasons/${season.id}/rehearsals`}
                  className="flex-1 text-center py-2 rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/50">
                  {t('adminSeasons.rehearsals')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
