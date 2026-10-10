import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n';
import ImageUploader from './components/ImageUploader.jsx';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import Home from './components/Home.jsx';
import {
  Activity, LogOut, Clock, Home as HomeIcon,
  LayoutDashboard, Globe, Loader2, ChevronDown
} from 'lucide-react';
import './App.css';
import History from './components/History.jsx';
import ChatBot from './components/ChatBot';
import Dashboard from './components/Dashboard';
import ReportEditor from './components/ReportEditor';

/* ── Route guard ── */
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

/* ── Page loading fallback ── */
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-3 text-slate-400">
      <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      <span className="text-sm font-medium">Loading…</span>
    </div>
  </div>
);

/* ── Single nav link ── */
function NavLink({ to, label, icon: Icon }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {Icon && <Icon size={15} />}
      {label}
    </Link>
  );
}

/* ── Language selector ── */
function LangSelector() {
  const { i18n } = useTranslation();
  const LANGS = [
    { code: 'fr', label: '🇫🇷 Français' },
    { code: 'en', label: '🇬🇧 English' },
    { code: 'es', label: '🇪🇸 Español' },
    { code: 'ar', label: '🇸🇦 العربية' },
  ];
  const current = i18n.language?.slice(0, 2) || 'fr';

  return (
    <div className="relative group">
      <button className="flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-slate-900 text-xs font-bold uppercase rounded-lg hover:bg-slate-100 transition-colors">
        <Globe size={14} />
        {current}
        <ChevronDown size={12} className="opacity-50" />
      </button>
      <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all slide-down z-50">
        {LANGS.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => i18n.changeLanguage(code)}
            className={`block w-full px-4 py-2.5 text-left text-sm transition-colors ${
              current === code
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main navbar ── */
function NavBar() {
  const { t } = useTranslation();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-15 flex items-center justify-between gap-6" style={{ height: '60px' }}>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Activity size={17} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 text-[1.05rem] tracking-tight">
            Glaucoma<span className="text-blue-600">AI</span>
          </span>
        </Link>

        {/* Center navigation (authenticated) */}
        {token && (
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/dashboard" label={t('nav.dashboard')} icon={LayoutDashboard} />
            <NavLink to="/history"   label={t('nav.history')}   icon={Clock} />
            <NavLink to="/app"       label={t('upload.btn_analyze')} icon={Activity} />
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          <LangSelector />

          {!token ? (
            <>
              <Link
                to="/login"
                className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-blue-700 transition-colors rounded-lg hover:bg-blue-50"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                {t('nav.signup')}
              </Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={15} />
              {t('nav.logout')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

/* ── RTL + body class handler ── */
function AppContent() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.body.className = i18n.language === 'ar' ? 'font-arabic' : '';
  }, [i18n.language]);

  return (
    <>
      <NavBar />
      <main className="min-h-screen" style={{ paddingTop: '60px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/app" element={
            <PrivateRoute>
              <div className="px-4 py-8">
                <ImageUploader />
              </div>
            </PrivateRoute>
          } />

          <Route path="/history" element={
            <PrivateRoute>
              <div className="px-4 py-8">
                <History />
              </div>
            </PrivateRoute>
          } />

          <Route path="/dashboard" element={
            <PrivateRoute>
              <div className="px-4 py-8">
                <Dashboard />
              </div>
            </PrivateRoute>
          } />

          <Route path="/report-editor" element={
            <PrivateRoute>
              <div className="px-4 py-6">
                <ReportEditor />
              </div>
            </PrivateRoute>
          } />
        </Routes>
      </main>
      <ChatBot />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <AppContent />
      </Suspense>
    </BrowserRouter>
  );
}
