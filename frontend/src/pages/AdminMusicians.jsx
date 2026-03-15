import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';

const INSTRUMENTS = ['Violin', 'Viola', 'Cello', 'Double Bass', 'Flute', 'Oboe', 'English Horn', 'Clarinet', 'Bassoon',
  'French Horn', 'Trumpet', 'Trombone', 'Tuba', 'Timpani', 'Percussion', 'Harp', 'Piano', 'Other'];

const PARTS = ['I', 'II', 'Solo'];

export default function AdminMusicians() {
  const { user: currentUser } = useAuth();
  const { t, tp, currentLang } = useLanguage();
  const [musicians, setMusicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editMusician, setEditMusician] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', instrument: '', part: '', birthdate: '', phone: '', role: 'musician' });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [dialog, setDialog] = useState(null);

  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [payments, setPayments] = useState({});
  const [togglingPayment, setTogglingPayment] = useState(null);

  const [activeFilter, setActiveFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [togglingActive, setTogglingActive] = useState(null);

  useEffect(() => { loadMusicians(); loadSeasons(); }, []);

  useEffect(() => {
    if (selectedSeason) loadPayments(selectedSeason);
  }, [selectedSeason]);

  const loadMusicians = async () => {
    try {
      const res = await apiClient.get('/admin/musicians');
      setMusicians(res.data.data);
    } catch (e) {
      console.error('Failed to load musicians:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadSeasons = async () => {
    try {
      const res = await apiClient.get('/admin/seasons');
      const allSeasons = res.data.data;
      setSeasons(allSeasons);
      const withFee = allSeasons.find((s) => s.active && s.season_fee);
      setSelectedSeason(withFee ? withFee.id : allSeasons[0]?.id || null);
    } catch (e) {
      console.error('Failed to load seasons:', e);
    }
  };

  const loadPayments = async (seasonId) => {
    try {
      const res = await apiClient.get(`/admin/seasons/${seasonId}/payments`);
      const map = {};
      res.data.data.forEach((p) => { map[p.user_id] = !!p.paid; });
      setPayments(map);
    } catch (e) {
      console.error('Failed to load payments:', e);
    }
  };

  const togglePayment = async (userId) => {
    if (!selectedSeason) return;
    const newPaid = !payments[userId];
    setTogglingPayment(userId);
    try {
      await apiClient.post(`/admin/seasons/${selectedSeason}/payments/${userId}`, { paid: newPaid });
      setPayments((prev) => ({ ...prev, [userId]: newPaid }));
    } catch (e) {
      console.error('Failed to toggle payment:', e);
    } finally {
      setTogglingPayment(null);
    }
  };

  const openCreate = () => {
    setForm({ name: '', email: '', instrument: '', part: '', birthdate: '', phone: '', role: 'musician' });
    setEditMusician(null);
    setSaveMessage('');
    setShowForm(true);
  };

  const openEdit = (m) => {
    setForm({
      name: m.name,
      email: m.email,
      instrument: m.instrument || '',
      part: m.part || '',
      birthdate: m.birthdate ? m.birthdate.split('T')[0] : '',
      phone: m.phone || '',
      role: m.role || 'musician',
    });
    setEditMusician(m);
    setSaveMessage('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditMusician(null);
    setSaveMessage('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const roleChanged = editMusician && form.role !== editMusician.role;
    const doSave = async () => {
      setSaving(true);
      setSaveMessage('');
      try {
        if (editMusician) {
          await apiClient.patch(`/admin/musicians/${editMusician.id}`, form);
        } else {
          await apiClient.post('/admin/musicians', form);
        }
        closeForm();
        loadMusicians();
      } catch (err) {
        setSaveMessage(err.response?.data?.message || 'Failed to save');
      } finally {
        setSaving(false);
      }
    };
    if (roleChanged) {
      const roleLabel = t(`common.${form.role}`) || form.role;
      showConfirm(
        t('adminMusicians.changeRoleTitle'),
        t('adminMusicians.changeRoleMessage', { name: form.name, role: roleLabel }),
        doSave
      );
    } else {
      doSave();
    }
  };

  const showConfirm = (title, message, onConfirm) => {
    setDialog({ title, message, onConfirm });
  };

  const showAlert = (title, message) => {
    setDialog({ title, message, onConfirm: null });
  };


  const handleDelete = (m) => {
    showConfirm(
      t('adminMusicians.removeTitle'),
      t('adminMusicians.removeMessage', { name: m.name }),
      async () => {
        try {
          await apiClient.delete(`/admin/musicians/${m.id}`);
          loadMusicians();
        } catch (err) {
          showAlert(t('common.error'), err.response?.data?.message || t('adminMusicians.deleteFailed'));
        }
      }
    );
  };

  const handleToggleActive = (m) => {
    const willActivate = !m.active;
    showConfirm(
      willActivate ? t('adminMusicians.activateTitle') : t('adminMusicians.deactivateTitle'),
      willActivate ? t('adminMusicians.activateMessage', { name: m.name }) : t('adminMusicians.deactivateMessage', { name: m.name }),
      async () => {
        setTogglingActive(m.id);
        try {
          await apiClient.patch(`/admin/musicians/${m.id}`, { active: willActivate });
          loadMusicians();
        } catch (err) {
          showAlert(t('common.error'), err.response?.data?.message || t('adminMusicians.statusFailed'));
        } finally {
          setTogglingActive(null);
        }
      }
    );
  };

  const currentSeason = seasons.find((s) => s.id === selectedSeason);
  const showPayments = currentSeason && currentSeason.season_fee;

  const filtered = musicians.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.instrument && m.instrument.toLowerCase().includes(search.toLowerCase())) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === 'active' && !m.active) return false;
    if (activeFilter === 'inactive' && m.active !== false) return false;
    if (showPayments && paymentFilter === 'paid' && !payments[m.id]) return false;
    if (showPayments && paymentFilter === 'unpaid' && payments[m.id]) return false;
    return true;
  });

  const byInstrument = {};
  filtered.forEach((m) => {
    let inst;
    if (m.instrument) {
      inst = m.instrument;
    } else if (m.role !== 'musician') {
      inst = t('common.staff');
    } else {
      inst = t('adminMusicians.unspecified');
    }
    if (!byInstrument[inst]) byInstrument[inst] = [];
    byInstrument[inst].push(m);
  });

  const paidCount = filtered.filter((m) => payments[m.id]).length;

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-primary-400 outline-none text-sm dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500";
  const selectClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-primary-400 outline-none text-sm bg-white dark:bg-gray-700 dark:text-gray-100";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1";

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('adminMusicians.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{tp('adminMusicians.memberCount', filtered.length)}</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">
          {t('adminMusicians.addMusician')}
        </button>
      </div>

      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          className={inputClass}
          placeholder={t('adminMusicians.searchPlaceholder')} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {['all', 'active', 'inactive'].map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === f
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}>
            {t(`adminMusicians.filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
          </button>
        ))}
        {showPayments && (
          <>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            {['all', 'paid', 'unpaid'].map((f) => (
              <button key={f} onClick={() => setPaymentFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  paymentFilter === f
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}>
                {t(`adminMusicians.filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
              </button>
            ))}
          </>
        )}
      </div>

      {seasons.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">{t('adminMusicians.fees')}</label>
          <select value={selectedSeason || ''} onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 outline-none text-sm bg-white dark:bg-gray-700 dark:text-gray-100">
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.season_fee ? ` (${Number(s.season_fee).toFixed(2)} \u20ac)` : ` (${t('common.noFee')})`}
              </option>
            ))}
          </select>
          {showPayments && (
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {t('adminMusicians.paidCount', { paid: paidCount, total: filtered.length })}
            </span>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {editMusician ? t('adminMusicians.editMusician') : t('adminMusicians.addMusicianForm')}
            </h2>

            {saveMessage && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">{saveMessage}</div>}

            <div>
              <label className={labelClass}>{t('adminMusicians.name')}</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass} placeholder={t('adminMusicians.namePlaceholder')} required />
            </div>

            <div>
              <label className={labelClass}>{t('adminMusicians.email')}</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass} placeholder="musician@email.com" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('adminMusicians.instrument')}</label>
                <select value={form.instrument} onChange={(e) => setForm({ ...form, instrument: e.target.value })}
                  className={selectClass}>
                  <option value="">{t('adminMusicians.unspecified')}</option>
                  {INSTRUMENTS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('adminMusicians.part')}</label>
                <select value={form.part} onChange={(e) => setForm({ ...form, part: e.target.value })}
                  className={selectClass}>
                  <option value="">{t('adminMusicians.none')}</option>
                  {PARTS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('adminMusicians.birthdate')}</label>
                <input type="date" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('adminMusicians.phone')}</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass} placeholder="+32 ..." />
              </div>
            </div>

            {editMusician && editMusician.id !== currentUser?.id && (
              <div>
                <label className={labelClass}>{t('adminMusicians.changeRole')}</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={selectClass}>
                  <option value="musician">{t('common.musician')}</option>
                  <option value="section_leader">{t('common.section_leader')}</option>
                  <option value="maestro">{t('common.maestro')}</option>
                  <option value="admin">{t('common.admin')}</option>
                </select>
              </div>
            )}

            {!editMusician && (
              <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs p-3 rounded-lg">
                {t('adminMusicians.codeInfo')}
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={closeForm}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {saving ? t('common.saving') : editMusician ? t('common.save') : t('adminMusicians.addMusicianForm')}
              </button>
            </div>
          </form>
        </div>
      )}

      {Object.keys(byInstrument).length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <span className="text-4xl">&#128101;</span>
          <p className="text-gray-500 dark:text-gray-400 mt-3">{search ? t('adminMusicians.noMatch') : t('adminMusicians.noMusicians')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(byInstrument).sort(([a], [b]) => {
              const staffLabel = t('common.staff');
              if (a === staffLabel) return -1;
              if (b === staffLabel) return 1;
              return a.localeCompare(b);
            }).map(([instrument, members]) => (
            <div key={instrument} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200">{instrument}</h3>
                <span className="text-xs text-gray-400 dark:text-gray-500">{members.length}</span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {members.map((m) => (
                  <div key={m.id} className={`flex justify-between items-center px-5 py-3${m.active === false ? ' opacity-50' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      {showPayments && (
                        <button
                          onClick={() => togglePayment(m.id)}
                          disabled={togglingPayment === m.id}
                          className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-xs font-bold transition-colors ${
                            payments[m.id]
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                              : 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-gray-600 hover:border-primary-400'
                          } ${togglingPayment === m.id ? 'opacity-50' : ''}`}
                        >
                          {payments[m.id] ? '€ ✓' : '€'}
                        </button>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {m.name}
                          {m.part && <span className="ml-1.5 text-xs text-primary-600 dark:text-primary-400 font-normal">{m.part}</span>}
                          {m.role !== 'musician' && <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                            m.role === 'admin' ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                            : m.role === 'maestro' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                            : 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
                          }`}>{t(`common.${m.role}`)}</span>}
                          {m.active === false && <span className="ml-1.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">{t('adminMusicians.inactiveLabel')}</span>}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          {m.email}
                          {m.phone && <span className="ml-2">{m.phone}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="text-right hidden sm:block mr-1">
                        <span className="text-xs text-gray-400 dark:text-gray-500 block">
                          {t('common.joined', { date: new Date(m.created_at).toLocaleDateString(currentLang.locale) })}
                        </span>
                        {m.last_seen_at && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 block">
                            {t('adminMusicians.lastSeen', { date: new Date(m.last_seen_at).toLocaleDateString(currentLang.locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) })}
                          </span>
                        )}
                      </div>
                      {m.id !== currentUser?.id && (
                        <button onClick={() => handleToggleActive(m)}
                          disabled={togglingActive === m.id}
                          className={`p-2 rounded-lg text-sm ${m.active === false ? 'text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30' : 'text-green-600 dark:text-green-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'} ${togglingActive === m.id ? 'opacity-50' : ''}`}
                          title={m.active === false ? t('adminMusicians.activateTooltip') : t('adminMusicians.deactivateTooltip')}>
                          {m.active === false ? '\u25CB' : '\u25CF'}
                        </button>
                      )}
                      <button onClick={() => openEdit(m)}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg text-sm">
                        &#9999;&#65039;
                      </button>
                      {m.id !== currentUser?.id && (
                        <button onClick={() => handleDelete(m)}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-sm">
                          &#128465;&#65039;
                        </button>
                      )}
                    </div>
                  </div>
                ))}
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
                  <button onClick={() => { setDialog(null); dialog.onConfirm(); }}
                    className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">
                    {t('common.confirm')}
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
