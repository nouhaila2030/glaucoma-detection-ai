import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Loader2, Activity, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Signup() {
  const { t, i18n }             = useTranslation();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  const validate = () => {
    if (!email || !password) return t('auth.error_creds');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('auth.error_email_invalid');
    if (password.length < 8) return t('auth.error_password_length');
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const err = validate();
    if (err) return setError(err);

    setLoading(true);
    try {
      await api.post('/signup', { email, password }, {
        headers: { 'Accept-Language': i18n.language },
      });
      setSuccess(t('auth.success_created'));
      setEmail(''); setPassword('');
      setTimeout(() => { window.location.href = '/login'; }, 1000);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || t('auth.error_signup_generic'));
    } finally {
      setLoading(false);
    }
  };

  /* password strength indicator */
  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : 3;
  const strengthColors = ['bg-slate-200', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500'];
  const strengthLabels = ['', 'Faible', 'Moyen', 'Fort'];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 pt-20">
      <div className="w-full max-w-md fade-up">

        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/30">
            <Activity size={19} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 text-xl tracking-tight">GlaucomaAI</span>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          {/* Top accent bar */}
          <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 mb-7 -mt-8 mx-auto" style={{ width: 'calc(100% + 4rem)', marginLeft: '-2rem' }} />

          <h1 className="text-xl font-bold text-slate-900 mb-1">{t('auth.signup_title')}</h1>
          <p className="text-slate-500 text-sm mb-6">{t('auth.signup_subtitle')}</p>

          {/* Feedback messages */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-5">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('auth.email_pro')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder={t('auth.placeholder_email')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all placeholder:text-slate-400"
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
                  autoComplete="new-password"
                  placeholder={t('auth.placeholder_password_min')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Strength meter */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">{strengthLabels[strength]}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-3.5 rounded-xl font-semibold text-sm transition-all shadow-md mt-2 hover:-translate-y-0.5"
            >
              {loading
                ? <Loader2 className="animate-spin h-4 w-4" />
                : <>{t('auth.signup_btn')} <ArrowRight size={16} /></>
              }
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-500">
            {t('auth.already_account')}{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              {t('auth.login_title')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
