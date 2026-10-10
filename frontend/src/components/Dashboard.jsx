import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  Users, Activity, ClipboardList, UserPlus,
  TrendingUp, Calendar, ArrowRight, X, Loader2, AlertCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:8000';

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [newPatient, setNewPatient]     = useState({ full_name: '', age: '', gender: 'M', phone: '' });
  const [submitting, setSubmitting]     = useState(false);
  const [modalError, setModalError]     = useState('');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch {
      /* handled via stats === null */
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/patients`, newPatient, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      setNewPatient({ full_name: '', age: '', gender: 'M', phone: '' });
      fetchStats();
    } catch {
      setModalError(t('modals.error_add'));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading state ── */
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        <span className="text-sm">{t('common.loading')}</span>
      </div>
    </div>
  );

  /* ── Error state ── */
  if (!stats) return (
    <div className="max-w-xl mx-auto mt-16 bg-white border border-red-200 rounded-2xl p-8 text-center">
      <AlertCircle className="text-red-500 mx-auto mb-3 h-10 w-10" />
      <h3 className="font-bold text-slate-800 text-lg mb-2">{t('dashboard.conn_err')}</h3>
      <p className="text-slate-500 text-sm">{t('dashboard.error_re')}</p>
    </div>
  );

  const dataPie = [
    { name: t('dashboard.chart_healthy'),  value: Math.max(0, stats.total_analyses - stats.total_glaucoma) },
    { name: t('dashboard.chart_glaucoma'), value: stats.total_glaucoma },
  ];
  const prevalence = stats.total_analyses > 0
    ? ((stats.total_glaucoma / stats.total_analyses) * 100).toFixed(1)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-7 fade-up">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex gap-2.5">
          <Link
            to="/app"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Activity size={15} /> {t('dashboard.new_analysis')}
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm"
          >
            <UserPlus size={15} /> {t('dashboard.new_patient')}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid sm:grid-cols-3 gap-5">
        <KpiCard
          label={t('dashboard.stats_patients')}
          value={stats.total_patients}
          icon={<Users size={20} className="text-blue-600" />}
          iconBg="bg-blue-50"
          trend={t('dashboard.trend_patients')}
        />
        <KpiCard
          label={t('dashboard.stats_analyses')}
          value={stats.total_analyses}
          icon={<ClipboardList size={20} className="text-violet-600" />}
          iconBg="bg-violet-50"
          trend={t('dashboard.trend_activity')}
        />
        <KpiCard
          label={t('dashboard.stats_glaucoma')}
          value={stats.total_glaucoma}
          icon={<Activity size={20} className="text-red-500" />}
          iconBg="bg-red-50"
          trend={`${prevalence}% ${t('dashboard.prevalence')}`}
          trendColor="text-red-600 bg-red-50"
        />
      </div>

      {/* ── Chart + Table row ── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Donut chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">{t('dashboard.chart_title')}</h3>
          <div className="h-52">
            {stats.total_analyses === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                {t('dashboard.no_data')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-5 mt-3">
            <LegendDot color="bg-emerald-500" label={t('dashboard.chart_healthy')} />
            <LegendDot color="bg-red-500"     label={t('dashboard.chart_glaucoma')} />
          </div>
        </div>

        {/* Recent patients table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Calendar size={15} className="text-slate-400" />
              {t('dashboard.recent_patients')}
            </div>
            <Link to="/history" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
              {t('dashboard.see_all')} <ArrowRight size={12} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {[t('dashboard.table_name'), t('dashboard.table_age'), t('dashboard.table_gender'), t('dashboard.table_phone'), t('dashboard.table_date')].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recent_patients.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400 text-sm">
                      {t('dashboard.empty_table')}
                    </td>
                  </tr>
                ) : (
                  stats.recent_patients.map(p => (
                    <tr key={p.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors">
                      {/* Name with avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {p.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800 text-sm">{p.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{p.age} {t('common.years')}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${
                          p.gender === 'M' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                        }`}>
                          {p.gender === 'M' ? t('dashboard.gender_m') : t('dashboard.gender_f')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{p.phone || '—'}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Add Patient Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md slide-down overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">{t('modals.add_patient_title')}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleAddPatient} className="p-6 space-y-4">
              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm">
                  {modalError}
                </div>
              )}

              <ModalField
                label={t('dashboard.table_name')}
                type="text"
                required
                value={newPatient.full_name}
                onChange={v => setNewPatient(p => ({ ...p, full_name: v }))}
              />

              <div className="grid grid-cols-2 gap-3">
                <ModalField
                  label={t('dashboard.table_age')}
                  type="number"
                  required
                  value={newPatient.age}
                  onChange={v => setNewPatient(p => ({ ...p, age: v }))}
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('dashboard.table_gender')}</label>
                  <select
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={newPatient.gender}
                    onChange={e => setNewPatient(p => ({ ...p, gender: e.target.value }))}
                  >
                    <option value="M">{t('dashboard.gender_m')}</option>
                    <option value="F">{t('dashboard.gender_f')}</option>
                  </select>
                </div>
              </div>

              <ModalField
                label={t('dashboard.table_phone')}
                type="tel"
                value={newPatient.phone}
                onChange={v => setNewPatient(p => ({ ...p, phone: v }))}
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-semibold text-sm transition-colors mt-2"
              >
                {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : t('modals.save_btn')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── KPI Card ── */
function KpiCard({ label, value, icon, iconBg, trend, trendColor = 'text-emerald-700 bg-emerald-50' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-extrabold text-slate-900 tabular-nums mb-1">{value}</div>
      <div className="text-sm text-slate-500 mb-3">{label}</div>
      <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${trendColor}`}>
        <TrendingUp size={11} /> {trend}
      </div>
    </div>
  );
}

/* ── Legend dot ── */
function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

/* ── Modal input field ── */
function ModalField({ label, type = 'text', required = false, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white"
      />
    </div>
  );
}
