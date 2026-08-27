import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';
import BackLink from '../components/Common/BackLink';

const EMPTY = { name: '', address: '', notes: '', active: true };

export default function AdminLocations() {
  const { t, tp } = useLanguage();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadLocations(); }, []);

  const loadLocations = async () => {
    try {
      const res = await apiClient.get('/admin/locations');
      setLocations(res.data.data);
    } catch (e) {
      console.error('Failed to load locations:', e);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm(EMPTY);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (l) => {
    setForm({ name: l.name, address: l.address || '', notes: l.notes || '', active: l.active });
    setEditId(l.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await apiClient.patch(`/admin/locations/${editId}`, form);
      } else {
        await apiClient.post('/admin/locations', form);
      }
      setShowForm(false);
      setEditId(null);
      loadLocations();
    } catch (err) {
      alert(err.response?.data?.message || t('adminLocations.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (l) => {
    if (!confirm(t('adminLocations.deleteConfirm'))) return;
    try {
      await apiClient.delete(`/admin/locations/${l.id}`);
      loadLocations();
    } catch (err) {
      alert(err.response?.data?.message || t('adminLocations.deleteFailed'));
    }
  };

  const toggleActive = async (l) => {
    try {
      await apiClient.patch(`/admin/locations/${l.id}`, { active: !l.active });
      loadLocations();
    } catch (err) {
      alert(err.response?.data?.message || t('adminLocations.saveFailed'));
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-primary-400 outline-none text-sm dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1";

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <BackLink />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('adminLocations.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{tp('adminLocations.locationCount', locations.length)}</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">
          {t('adminLocations.addLocation')}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {editId ? t('adminLocations.editLocation') : t('adminLocations.newLocation')}
            </h2>
            <div>
              <label className={labelClass}>{t('adminLocations.nameLabel')}</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass} placeholder={t('adminLocations.namePlaceholder')} required />
            </div>
            <div>
              <label className={labelClass}>{t('adminLocations.addressLabel')}</label>
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={inputClass} placeholder={t('adminLocations.addressPlaceholder')} />
            </div>
            <div>
              <label className={labelClass}>{t('adminLocations.notesLabel')}</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className={inputClass} rows="2" placeholder={t('adminLocations.notesPlaceholder')} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-600" />
              {t('adminLocations.activeLabel')}
            </label>
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

      {locations.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <span className="text-4xl">&#128205;</span>
          <p className="text-gray-500 dark:text-gray-400 mt-3">{t('adminLocations.noLocations')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map((l) => (
            <div key={l.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 ${l.active ? '' : 'opacity-60'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                    {!l.active && <span className="inline-block text-xs px-1.5 py-0.5 mr-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold">{t('adminLocations.inactive')}</span>}
                    {l.name}
                  </h3>
                  {l.address && (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline mt-1 inline-block">
                      &#128205; {l.address}
                    </a>
                  )}
                  {l.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{l.notes}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleActive(l)} title={l.active ? t('adminLocations.deactivate') : t('adminLocations.activate')}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/30 rounded-lg text-sm">
                    {l.active ? '\u{1F441}️' : '\u{1F6AB}'}
                  </button>
                  <button onClick={() => openEdit(l)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/30 rounded-lg text-sm">&#9999;&#65039;</button>
                  <button onClick={() => handleDelete(l)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 rounded-lg text-sm">&#128465;&#65039;</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
