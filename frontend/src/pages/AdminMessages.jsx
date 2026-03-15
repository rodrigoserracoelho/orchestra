import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';

export default function AdminMessages() {
  const { t, currentLang } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [totalMusicians, setTotalMusicians] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', active: true });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [readersModal, setReadersModal] = useState(null);
  const [dialog, setDialog] = useState(null);

  useEffect(() => { loadMessages(); }, []);

  const loadMessages = async () => {
    try {
      const res = await apiClient.get('/admin/messages');
      setMessages(res.data.data.messages);
      setTotalMusicians(res.data.data.totalMusicians);
    } catch (e) {
      console.error('Failed to load messages:', e);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ title: '', body: '', active: true });
    setEditId(null);
    setSaveError('');
    setShowForm(true);
  };

  const handleEdit = (msg) => {
    setForm({ title: msg.title, body: msg.body, active: msg.active });
    setEditId(msg.id);
    setSaveError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      if (editId) {
        await apiClient.patch(`/admin/messages/${editId}`, form);
      } else {
        await apiClient.post('/admin/messages', form);
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
      message: t('adminMessages.deleteConfirm'),
      onConfirm: async () => {
        try {
          await apiClient.delete(`/admin/messages/${msg.id}`);
          loadMessages();
        } catch (e) {
          setDialog({ title: t('common.error'), message: t('adminMessages.deleteFailed'), onConfirm: null });
          return;
        }
        setDialog(null);
      },
    });
  };

  const handleToggleActive = async (msg) => {
    try {
      await apiClient.patch(`/admin/messages/${msg.id}`, { active: !msg.active });
      loadMessages();
    } catch (e) {
      console.error('Failed to toggle active:', e);
    }
  };

  const showReaders = async (msg) => {
    try {
      const res = await apiClient.get(`/admin/messages/${msg.id}/readers`);
      setReadersModal({ title: msg.title, readers: res.data.data });
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
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('adminMessages.title')}</h1>
        <button onClick={openCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">
          {t('adminMessages.newMessage')}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {editId ? t('adminMessages.editMessage') : t('adminMessages.newMessageForm')}
            </h2>

            {saveError && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">{saveError}</div>}

            <div>
              <label className={labelClass}>{t('adminMessages.messageTitle')}</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass} placeholder={t('adminMessages.titlePlaceholder')} required />
            </div>

            <div>
              <label className={labelClass}>{t('adminMessages.messageBody')}</label>
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                className={inputClass + " min-h-[120px] resize-y"} placeholder={t('adminMessages.bodyPlaceholder')} required rows={5} />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('adminMessages.activeMessage')}</span>
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
          <span className="text-4xl">&#9993;</span>
          <p className="text-gray-500 dark:text-gray-400 mt-3">{t('adminMessages.noMessages')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4${!msg.active ? ' opacity-60' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{msg.title}</h3>
                    {!msg.active && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400">{t('common.inactive')}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-line line-clamp-3">{msg.body}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                    <span>{formatDate(msg.created_at)}</span>
                    <span>{msg.author_name}</span>
                    <button onClick={() => showReaders(msg)}
                      className="text-primary-600 dark:text-primary-400 hover:underline">
                      {t('adminMessages.readBy', { read: msg.read_count, total: totalMusicians })}
                    </button>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0 ml-2">
                  <button onClick={() => handleToggleActive(msg)}
                    className={`p-2 rounded-lg text-sm ${msg.active ? 'text-green-600 dark:text-green-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'}`}
                    title={msg.active ? t('adminMessages.activeMessage') : t('common.inactive')}>
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
          ))}
        </div>
      )}

      {readersModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
              {t('adminMessages.readers', { count: readersModal.readers.length })}
            </h2>
            {readersModal.readers.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">{t('adminMessages.noReaders')}</p>
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
              {t('adminMessages.close')}
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
