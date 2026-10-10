import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, ArrowRight, Loader2, Activity, ShieldCheck, Zap, FileText } from 'lucide-react';

const PERKS = [
  { icon: <ShieldCheck size={16} />, text: 'Données sécurisées & chiffrées' },
  { icon: <Zap size={16} />,         text: 'Résultat en moins de 3 secondes' },
  { icon: <FileText size={16} />,    text: 'Rapports PDF automatiques' },
];

export default function Login() {
  const { t, i18n } = useTranslation();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) return setError(t('auth.error_creds'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(t('auth.error_email_invalid'));

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const resp = await fetch('http://localhost:8000/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept-Language': i18n.language,
        },
        body: params.toString(),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ detail: t('auth.error_login') }));
        throw new Error(body.detail || t('auth.error_login'));
      }

      const data = await resp.json();
      if (!data.access_token) throw new Error(t('auth.error_token'));

      localStorage.setItem('token', data.access_token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Left panel (brand) ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}
      >
        {/* grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v1H0zM0 39h40v1H0zM0 0h1v40H0zM39 0h1v40h-1z' fill='%23ffffff'/%3E%3C/svg%3E")` }}
        />
        {/* radial glow */}
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Activity size={19} className="text-white" />
          </div>
          <span className="font-bold text-white text-xl tracking-tight">GlaucomaAI</span>
        </div>

        {/* Headline */}
        <div className="relative">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            {t('auth.welcome_back')}
          </h2>
          <p className="text-blue-200/80 text-base mb-10 leading-relaxed">
            {t('auth.promo_text')}
          </p>
          <ul className="space-y-3">
            {PERKS.map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-blue-100/70 text-sm">
                <span className="text-blue-400">{icon}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-blue-300/40">© 2025 GlaucomaAI — Outil d'aide médicale</p>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md fade-up">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity size={17} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">GlaucomaAI</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">{t('auth.login_title')}</h1>
          <p className="text-slate-500 text-sm mb-8">{t('auth.login_subtitle')}</p>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder={t('auth.placeholder_email')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-blue-600/20 hover:-translate-y-0.5 mt-2"
            >
              {loading
                ? <Loader2 className="animate-spin h-4 w-4" />
                : <>{t('auth.login_btn')} <ArrowRight size={16} /></>
              }
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
            {t('auth.no_account')}{' '}
            <Link to="/signup" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              {t('auth.create_account')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
