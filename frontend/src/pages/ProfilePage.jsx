import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';
import { INSTRUMENTS, PARTS } from '../constants/orchestra';
import BackLink from '../components/Common/BackLink';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', instrument: '', part: '', birthdate: '', phone: '', bio: '', profile_picture: '', show_in_directory: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/musician/profile')
      .then((res) => {
        const p = res.data.data;
        setForm({
          name: p.name || '',
          instrument: p.instrument || '',
          part: p.part || '',
          birthdate: p.birthdate ? p.birthdate.split('T')[0] : '',
          phone: p.phone || '',
          bio: p.bio || '',
          profile_picture: p.profile_picture || '',
          show_in_directory: p.show_in_directory !== false,
        });
      })
      .catch(() => setError(t('profile.loadFailed')))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(t('profile.nameRequired'));
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await apiClient.patch('/musician/profile', form);
      await refreshUser();
      setMessage(t('profile.updated'));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Downscale to max 400px and re-encode as JPEG to keep base64 small.
  const handlePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const max = 400;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setForm((f) => ({ ...f, profile_picture: canvas.toDataURL('image/jpeg', 0.85) }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-primary-400 outline-none text-sm dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500";
  const selectClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-primary-400 outline-none text-sm bg-white dark:bg-gray-700 dark:text-gray-100";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <BackLink />
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">{t('profile.title')}</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4">
        {message && <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm p-3 rounded-lg">{message}</div>}
        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">{error}</div>}

        <div>
          <label className={labelClass}>{t('profile.email')}</label>
          <input type="email" value={user?.email || ''} readOnly
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-500 dark:text-gray-400" />
        </div>

        <div>
          <label className={labelClass}>{t('profile.name')}</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{t('profile.instrument')}</label>
            <select value={form.instrument} onChange={(e) => setForm({ ...form, instrument: e.target.value })}
              className={selectClass}>
              <option value="">{t('profile.unspecified')}</option>
              {INSTRUMENTS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('profile.part')}</label>
            <select value={form.part} onChange={(e) => setForm({ ...form, part: e.target.value })}
              className={selectClass}>
              <option value="">{t('profile.none')}</option>
              {PARTS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{t('profile.birthdate')}</label>
            <input type="date" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('profile.phone')}</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass} placeholder="+32 ..." />
          </div>
        </div>

        <div>
          <label className={labelClass}>{t('profile.picture')}</label>
          <div className="flex items-center gap-4">
            {form.profile_picture ? (
              <img src={form.profile_picture} alt="" className="w-20 h-20 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl text-gray-400">👤</div>
            )}
            <div className="flex flex-col gap-2">
              <label className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm cursor-pointer">
                {t('profile.pictureChange')}
                <input type="file" accept="image/*" onChange={handlePictureChange} className="hidden" />
              </label>
              {form.profile_picture && (
                <button type="button" onClick={() => setForm({ ...form, profile_picture: '' })}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline text-left">
                  {t('profile.pictureRemove')}
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>{t('profile.bio')}</label>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
            maxLength={500} rows={4}
            className={`${inputClass} resize-y`}
            placeholder={t('profile.bioPlaceholder')} />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{form.bio.length}/500</p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox" checked={form.show_in_directory}
            onChange={(e) => setForm({ ...form, show_in_directory: e.target.checked })}
            className="w-4 h-4 accent-primary-600" />
          <span className="text-sm text-gray-700 dark:text-gray-200">{t('profile.showInDirectory')}</span>
        </label>

        <button type="submit" disabled={saving}
          className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50">
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </form>
    </div>
  );
}
