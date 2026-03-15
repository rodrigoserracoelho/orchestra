import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';
import RichTextEditor from '../components/Common/RichTextEditor';

const emptyForm = { slug: '', title: '', body: '', active: true, show_in_nav: true, sort_order: 0 };

export default function AdminPages() {
  const { t } = useLanguage();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [dialog, setDialog] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { loadPages(); }, []);

  const loadPages = async () => {
    try {
      const res = await apiClient.get('/admin/pages');
      setPages(res.data.data);
    } catch (e) {
      console.error('Failed to load pages:', e);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ ...emptyForm });
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    setEditId(null);
    setSaveError('');
    setShowForm(true);
  };

  const handleEdit = (page) => {
    setForm({
      slug: page.slug,
      title: page.title,
      body: page.body,
      active: page.active,
      show_in_nav: page.show_in_nav,
      sort_order: page.sort_order || 0,
    });
    setImageFile(null);
    setImagePreview(page.cover_image || null);
    setRemoveImage(false);
    setEditId(page.id);
    setSaveError('');
    setShowForm(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileRef.current) fileRef.current.value = '';
  };

  const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleTitleChange = (title) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: editId ? prev.slug : slugify(title),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const fd = new FormData();
      fd.append('slug', form.slug);
      fd.append('title', form.title);
      fd.append('body', form.body);
      fd.append('active', form.active);
      fd.append('show_in_nav', form.show_in_nav);
      fd.append('sort_order', form.sort_order);
      if (imageFile) fd.append('cover_image', imageFile);
      if (removeImage) fd.append('remove_image', 'true');

      if (editId) {
        await apiClient.patch(`/admin/pages/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await apiClient.post('/admin/pages', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowForm(false);
      setEditId(null);
      loadPages();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (page) => {
    setDialog({
      title: t('common.delete'),
      message: t('adminPages.deleteConfirm'),
      onConfirm: async () => {
        try {
          await apiClient.delete(`/admin/pages/${page.id}`);
          loadPages();
        } catch (e) {
          setDialog({ title: t('common.error'), message: t('adminPages.deleteFailed'), onConfirm: null });
          return;
        }
        setDialog(null);
      },
    });
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-primary-400 outline-none text-sm dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1";

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('adminPages.title')}</h1>
        <button onClick={openCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">
          {t('adminPages.newPage')}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {editId ? t('adminPages.editPage') : t('adminPages.newPageForm')}
            </h2>

            {saveError && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">{saveError}</div>}

            <div>
              <label className={labelClass}>{t('adminPages.pageTitle')}</label>
              <input type="text" value={form.title} onChange={(e) => handleTitleChange(e.target.value)}
                className={inputClass} placeholder={t('adminPages.titlePlaceholder')} required />
            </div>

            <div>
              <label className={labelClass}>{t('adminPages.slug')}</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 dark:text-gray-500">/site/</span>
                <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  className={inputClass} placeholder="about-us" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('adminPages.sortOrder')}</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  className={inputClass} min="0" />
              </div>
              <div className="flex flex-col justify-end gap-2 pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('adminPages.activePage')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.show_in_nav} onChange={(e) => setForm({ ...form, show_in_nav: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('adminPages.showInNav')}</span>
                </label>
              </div>
            </div>

            <div>
              <label className={labelClass}>{t('adminPages.coverImage')}</label>
              {imagePreview && (
                <div className="relative mb-2">
                  <img src={imagePreview} alt="Cover" className="w-full h-48 object-cover rounded-xl" />
                  <button type="button" onClick={handleRemoveImage}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center text-sm hover:bg-black/70">
                    &#10005;
                  </button>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 dark:file:bg-primary-900/30 dark:file:text-primary-300 hover:file:bg-primary-100" />
            </div>

            <div>
              <label className={labelClass}>{t('adminPages.content')}</label>
              <RichTextEditor value={form.body} onChange={(html) => setForm({ ...form, body: html })}
                placeholder={t('adminPages.contentPlaceholder')} />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {saving ? t('common.saving') : editId ? t('common.update') : t('common.create')}
              </button>
            </div>
          </form>
        </div>
      )}

      {pages.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <span className="text-4xl">&#128196;</span>
          <p className="text-gray-500 dark:text-gray-400 mt-3">{t('adminPages.noPages')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <div key={page.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4${!page.active ? ' opacity-60' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{page.title}</h3>
                    {!page.active && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400">{t('common.inactive')}</span>
                    )}
                    {page.show_in_nav && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">{t('adminPages.inNav')}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">/site/{page.slug}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0 ml-2">
                  <button onClick={() => handleEdit(page)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg text-sm">
                    &#9999;&#65039;
                  </button>
                  <button onClick={() => handleDelete(page)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-sm">
                    &#128465;&#65039;
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {dialog && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{dialog.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{dialog.message}</p>
            <div className="flex gap-2">
              {dialog.onConfirm ? (
                <>
                  <button onClick={() => setDialog(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                    {t('common.cancel')}
                  </button>
                  <button onClick={() => { dialog.onConfirm(); }}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700">
                    {t('common.delete')}
                  </button>
                </>
              ) : (
                <button onClick={() => setDialog(null)}
                  className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">
                  {t('common.ok')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
