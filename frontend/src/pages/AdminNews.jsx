import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';
import RichTextEditor from '../components/Common/RichTextEditor';

export default function AdminNews() {
  const { t, currentLang } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [totalMusicians, setTotalMusicians] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', active: true });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [readersModal, setReadersModal] = useState(null);
  const [dialog, setDialog] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { loadMessages(); }, []);

  const loadMessages = async () => {
    try {
      const res = await apiClient.get('/admin/news');
      setMessages(res.data.data.articles);
      setTotalMusicians(res.data.data.totalMusicians);
    } catch (e) {
      console.error('Failed to load news:', e);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ title: '', body: '', active: true });
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    setEditId(null);
    setSaveError('');
    setShowForm(true);
  };

  const handleEdit = (msg) => {
    setForm({ title: msg.title, body: msg.body, active: msg.active });
    setImageFile(null);
    setImagePreview(msg.cover_image || null);
    setRemoveImage(false);
    setEditId(msg.id);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('body', form.body);
      fd.append('active', form.active);
      if (imageFile) fd.append('cover_image', imageFile);
      if (removeImage) fd.append('remove_image', 'true');

      if (editId) {
        await apiClient.patch(`/admin/news/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await apiClient.post('/admin/news', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowForm(false);
      setEditId(null);
      loadMessages();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (msg) => {
    setDialog({
      title: t('common.delete'),
      message: t('adminNews.deleteConfirm'),
      onConfirm: async () => {
        try {
          await apiClient.delete(`/admin/news/${msg.id}`);
          loadMessages();
        } catch (e) {
          setDialog({ title: t('common.error'), message: t('adminNews.deleteFailed'), onConfirm: null });
          return;
        }
        setDialog(null);
      },
    });
  };

  const handleToggleActive = async (msg) => {
    try {
      const fd = new FormData();
      fd.append('active', !msg.active);
      await apiClient.patch(`/admin/news/${msg.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      loadMessages();
    } catch (e) {
      console.error('Failed to toggle active:', e);
    }
  };

  const showReaders = async (msg) => {
    try {
      const res = await apiClient.get(`/admin/news/${msg.id}/readers`);
      setReadersModal({ title: msg.title, readers: res.data.data, readCount: msg.read_count });
    } catch (e) {
      console.error('Failed to load readers:', e);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString(currentLang.locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-primary-400 outline-none text-sm dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1";

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('adminNews.title')}</h1>
        <button onClick={openCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">
          {t('adminNews.newArticle')}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {editId ? t('adminNews.editArticle') : t('adminNews.newArticleForm')}
            </h2>

            {saveError && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">{saveError}</div>}

            <div>
              <label className={labelClass}>{t('adminNews.articleTitle')}</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass} placeholder={t('adminNews.titlePlaceholder')} required />
            </div>

            <div>
              <label className={labelClass}>{t('adminNews.coverImage')}</label>
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
              <label className={labelClass}>{t('adminNews.content')}</label>
              <RichTextEditor value={form.body} onChange={(html) => setForm({ ...form, body: html })}
                placeholder={t('adminNews.contentPlaceholder')} />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('adminNews.activeArticle')}</span>
            </label>

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

      {messages.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <span className="text-4xl">&#128240;</span>
          <p className="text-gray-500 dark:text-gray-400 mt-3">{t('adminNews.noArticles')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const pct = totalMusicians > 0 ? Math.round((msg.read_count / totalMusicians) * 100) : 0;
            return (
              <div key={msg.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden${!msg.active ? ' opacity-60' : ''}`}>
                {msg.cover_image && (
                  <img src={msg.cover_image} alt="" className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">{msg.title}</h3>
                        {!msg.active && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400">{t('common.inactive')}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 [&_*]:inline" dangerouslySetInnerHTML={{ __html: msg.body }} />
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                        <span>{formatDate(msg.created_at)}</span>
                        <span>{msg.author_name}</span>
                      </div>
                      {/* Read stats bar */}
                      <div className="mt-2">
                        <button onClick={() => showReaders(msg)} className="w-full text-left group">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                              {t('adminNews.readBy', { read: msg.read_count, total: totalMusicians })}
                            </span>
                            <span className="text-gray-400 dark:text-gray-500">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      <button onClick={() => handleToggleActive(msg)}
                        className={`p-2 rounded-lg text-sm ${msg.active ? 'text-green-600 dark:text-green-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'}`}
                        title={msg.active ? t('adminNews.activeArticle') : t('common.inactive')}>
                        {msg.active ? '\u25CF' : '\u25CB'}
                      </button>
                      <button onClick={() => handleEdit(msg)}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg text-sm">
                        &#9999;&#65039;
                      </button>
                      <button onClick={() => handleDelete(msg)}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-sm">
                        &#128465;&#65039;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {readersModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
              {t('adminNews.readers', { count: readersModal.readers.length })}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              {readersModal.readCount}/{totalMusicians} ({totalMusicians > 0 ? Math.round((readersModal.readCount / totalMusicians) * 100) : 0}%)
            </p>
            {readersModal.readers.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">{t('adminNews.noReaders')}</p>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {readersModal.readers.map((r) => (
                  <div key={r.id} className="flex justify-between items-center py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{r.name}</p>
                      {r.instrument && <p className="text-xs text-gray-400 dark:text-gray-500">{r.instrument}</p>}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(r.read_at)}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setReadersModal(null)}
              className="w-full mt-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">
              {t('adminNews.close')}
            </button>
          </div>
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
