import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Eye, Brain, Zap, FileText, ArrowRight,
  ShieldCheck, Activity, CheckCircle2, Microscope
} from 'lucide-react';

/* ─── Inline SVG grid pattern for dark hero ─── */
const GRID_BG = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v1H0zM0 39h40v1H0zM0 0h1v40H0zM39 0h1v40h-1z' fill='%23ffffff' fill-opacity='0.04'/%3E%3C/svg%3E")`;

const STATS = [
  { value: '97.8%', key: 'Sensibilité IA' },
  { value: '< 3s',  key: 'Temps d\'analyse' },
  { value: '50+',   key: 'Cliniques partenaires' },
  { value: '10 k+', key: 'Analyses effectuées' },
];

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-white text-slate-900">

      {/* ══════════════════════════════
          HERO — dark background
      ══════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg,#020617 0%,#0f172a 55%,#f8fafc 100%)' }}
      >
        {/* subtle grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: GRID_BG }} />

        {/* radial glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, #3B82F6 0%, transparent 70%)' }}
        />

        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-32 flex flex-col lg:flex-row items-center gap-16">

          {/* Left ─ headline & CTA */}
          <div className="lg:w-1/2 text-center lg:text-left fade-up">
            {/* badge */}
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative rounded-full h-2 w-2 bg-blue-500" />
              </span>
              {t('home.new_ia_badge')}
            </div>

            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.05] tracking-tight text-white mb-6">
              {t('home.hero_title')}<br />
              <span className="gradient-text">{t('home.hero_highlight')}</span>
            </h1>

            <p className="text-slate-400 text-lg lg:text-xl mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {t('home.hero_desc')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all shadow-lg shadow-blue-600/30 hover:-translate-y-0.5"
              >
                {t('home.cta_start')} <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all"
              >
                {t('home.cta_login')}
              </Link>
            </div>

            {/* trust logos */}
            <div className="mt-12 pt-10 border-t border-white/5 flex items-center gap-8 justify-center lg:justify-start">
              {['CLINIQUEAI', 'MEDITECH', 'HEALTHLAB'].map(name => (
                <span key={name} className="text-white/25 font-bold tracking-widest text-xs">{name}</span>
              ))}
            </div>
          </div>

          {/* Right ─ floating UI card */}
          <div className="lg:w-1/2 flex justify-center fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="relative">
              {/* glow */}
              <div className="absolute -inset-6 bg-blue-500/15 rounded-3xl blur-2xl pointer-events-none" />

              {/* card */}
              <div className="relative bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl p-5 w-[300px]">
                {/* header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-white text-sm font-semibold">{t('home.img_status')}</span>
                  </div>
                  <span className="text-slate-500 text-xs">12:34</span>
                </div>

                {/* mock fundus */}
                <div className="w-full h-44 bg-slate-800 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                  <Eye size={44} className="text-slate-600" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/80" />
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 size={11} /> No Glaucoma
                    </span>
                    <span className="text-white text-xs font-bold">97.8%</span>
                  </div>
                </div>

                {/* stats rows */}
                <div className="space-y-1.5">
                  {[
                    { label: 'Model', value: 'MobileNetV3', color: 'text-slate-200' },
                    { label: 'GradCAM', value: '✓ Generated', color: 'text-emerald-400' },
                    { label: 'Report',  value: 'PDF Ready',  color: 'text-blue-400'   },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-800 last:border-none">
                      <span className="text-slate-500 text-xs">{label}</span>
                      <span className={`text-xs font-medium ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/signup"
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={14} /> {t('report.download')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          STATS BAR
      ══════════════════════════════ */}
      <section className="py-14 border-b border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map(({ value, key }) => (
              <div key={key} className="fade-up">
                <div className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-1 tabular-nums">{value}</div>
                <div className="text-sm text-slate-500">{key}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          FEATURES
      ══════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-semibold text-sm tracking-wider uppercase mb-3">Plateforme</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t('home.why_title')}</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">{t('home.why_subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Brain size={22} className="text-violet-600" />}
              bg="bg-violet-50"
              title={t('home.feature_dl_title')}
              desc={t('home.feature_dl_desc')}
            />
            <FeatureCard
              icon={<Zap size={22} className="text-amber-600" />}
              bg="bg-amber-50"
              title={t('home.feature_speed_title')}
              desc={t('home.feature_speed_desc')}
            />
            <FeatureCard
              icon={<FileText size={22} className="text-blue-600" />}
              bg="bg-blue-50"
              title={t('home.feature_report_title')}
              desc={t('home.feature_report_desc')}
            />
          </div>

          {/* Extra trust row */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { icon: <ShieldCheck size={18} className="text-emerald-600" />, text: 'Données chiffrées, stockage local sécurisé' },
              { icon: <Microscope size={18} className="text-blue-600" />,    text: 'GradCAM++ — explicabilité clinique complète' },
              { icon: <Eye size={18} className="text-violet-600" />,         text: 'Support DICOM natif pour imagerie médicale' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
                <div className="shrink-0">{icon}</div>
                <span className="text-sm text-slate-600 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          HOW IT WORKS
      ══════════════════════════════ */}
      <section className="py-24 bg-slate-50 border-t border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-semibold text-sm tracking-wider uppercase mb-3">Workflow</p>
            <h2 className="text-3xl font-bold text-slate-900">{t('home.how_title')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <StepCard n="01" title={t('home.step_1_title')} desc={t('home.step_1_desc')} />
            <StepCard n="02" title={t('home.step_2_title')} desc={t('home.step_2_desc')} />
            <StepCard n="03" title={t('home.step_3_title')} desc={t('home.step_3_desc')} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          CTA BANNER
      ══════════════════════════════ */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Activity size={26} className="text-blue-400" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">{t('home.cta_start')}</h2>
          <p className="text-slate-400 text-lg mb-8">{t('home.hero_desc')}</p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all shadow-lg shadow-blue-600/30 hover:-translate-y-0.5"
          >
            {t('home.cta_start')} <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════
          FOOTER
      ══════════════════════════════ */}
      <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 pb-10 border-b border-slate-800">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 text-white mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Activity size={16} className="text-white" />
                </div>
                <span className="font-bold text-lg">GlaucomaAI</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">{t('home.footer_desc')}</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">{t('home.footer_links')}</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/" className="hover:text-white transition-colors">{t('nav.home')}</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">{t('nav.login')}</Link></li>
                <li><Link to="/signup" className="hover:text-white transition-colors">{t('nav.signup')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">{t('home.footer_legal')}</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer_privacy')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer_terms')}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
            <span>{t('home.footer_copyright')}</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-500" />
              Outil d'aide à la décision médicale — non substitutif à un diagnostic médical
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ── Sub-components ── */
const FeatureCard = ({ icon, bg, title, desc }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-7 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
    <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-5`}>
      {icon}
    </div>
    <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const StepCard = ({ n, title, desc }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-8 relative overflow-hidden hover:shadow-md transition-shadow">
    <span className="absolute top-4 right-5 text-6xl font-black text-slate-100 select-none leading-none">{n}</span>
    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm mb-5 relative z-10">
      {n}
    </div>
    <h3 className="font-bold text-slate-900 text-base mb-2 relative z-10">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed relative z-10">{desc}</p>
  </div>
);

export default Home;
