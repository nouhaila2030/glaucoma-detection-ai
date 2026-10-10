import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Clock, AlertTriangle, CheckCircle2, ImageOff,
  Calendar, FileText, Eye, User, Loader2, AlertCircle
} from 'lucide-react';
import { generateGlaucomaReport } from '../utils/pdfGenerator';

const API_URL = 'http://localhost:8000';

export default function History() {
  const { t }            = useTranslation();
  const navigate         = useNavigate();
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { window.location.href = '/login'; return; }
      const res = await axios.get(`${API_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data);
    } catch {
      setError(t('history.error_load'));
    } finally {
      setLoading(false);
    }
  };

  /* Group by patient */
  const grouped = history.reduce((acc, item) => {
    const name = item.patient_name || t('history.unknown_patient');
    (acc[name] = acc[name] || []).push(item);
    return acc;
  }, {});

  const handleDownload = async (item) => {
    const reportData = {
      id:            item.id,
      hasGlaucoma:   item.has_glaucoma,
      confidence:    item.confidence,
      timestamp:     item.timestamp,
      patientName:   item.patient_name || t('history.unknown_patient'),
      patientId:     item.patient_id || 'N/A',
      doctorName:    t('report.doctor_default'),
      clinicName:    t('report.clinic_default'),
      patientAge:    item.patient_age || '',
      patientGender: item.patient_gender || '',
      eyeSide:       t('report.right_eye'),
      imageQuality:  t('report.quality_good'),
      aiResult:      item.has_glaucoma ? t('upload.glaucoma_detected') : t('upload.healthy_retina'),
      aiConfidence:  (item.confidence * 100).toFixed(1),
      observations:  t('report.obs_default'),
      diagnosis:     item.has_glaucoma ? t('report.diag_suspect') : t('report.diag_normal'),
      recommendations: item.has_glaucoma
        ? [t('history.reco_consult'), t('history.reco_oct')]
        : [t('history.reco_annual')],
    };
    await generateGlaucomaReport(reportData, item.image_url, item.gradcam_url || null, t);
  };

  const handleViewAnalysis = (item) => {
    navigate('/app', {
      state: {
        replayAnalysis: true,
        imageUrl:       item.image_url,
        analysisData: {
          confidence:       (item.confidence * 100).toFixed(1),
          hasGlaucoma:      item.has_glaucoma,
          prediction_class: item.has_glaucoma ? 1 : 0,
          probability:      item.confidence,
          message:          item.has_glaucoma ? t('history.msg_glaucoma') : t('history.msg_healthy'),
          recommendations:  item.has_glaucoma
            ? [t('history.reco_consult'), t('history.reco_oct')]
            : [t('history.reco_annual')],
          gradcamImage: item.gradcam_url || null,
        },
        gradcamImage: item.gradcam_url || null,
      },
    });
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        <span className="text-sm">{t('history.loading_records')}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto fade-up">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
          <Clock size={22} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('history.title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('history.subtitle')}</p>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* ── Empty ── */}
      {Object.keys(grouped).length === 0 && !error ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <Clock size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">{t('history.empty')}</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([patientName, items]) => (
            <PatientGroup
              key={patientName}
              patientName={patientName}
              items={items}
              t={t}
              onView={handleViewAnalysis}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Patient group ── */
function PatientGroup({ patientName, items, t, onView, onDownload }) {
  const [open, setOpen] = useState(true);

  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Group header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
            <User size={17} className="text-slate-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900 text-sm">{patientName}</h3>
            <p className="text-xs text-slate-400">
              {items.length} {t('history.analysis_unit')}{items.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <span className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {/* Analysis cards */}
      {open && (
        <div className="p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map(item => (
              <AnalysisCard
                key={item.id}
                item={item}
                t={t}
                onView={onView}
                onDownload={onDownload}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ── Analysis card ── */
function AnalysisCard({ item, t, onView, onDownload }) {
  const positive = item.has_glaucoma;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all group">
      {/* Image area */}
      <div className="relative h-36 bg-slate-100 overflow-hidden">
        {item.is_expired ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5">
            <ImageOff size={20} />
            <span className="text-xs font-medium">{t('history.expired')}</span>
          </div>
        ) : (
          <>
            <img
              src={item.image_url}
              alt="Fundus"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* hover overlay */}
            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => onView(item)}
                className="bg-white text-slate-900 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 translate-y-2 group-hover:translate-y-0 transition-transform shadow"
              >
                <Eye size={13} /> {t('history.view_details')}
              </button>
            </div>
          </>
        )}

        {/* Confidence badge */}
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
          {(item.confidence * 100).toFixed(0)}%
        </div>

        {/* Status badge */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
          positive ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
          {positive
            ? <><AlertTriangle size={9} /> {t('history.badge_glaucoma')}</>
            : <><CheckCircle2 size={9} />  {t('history.badge_healthy')}</>
          }
        </div>
      </div>

      {/* Info footer */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-1 text-slate-400 text-[11px] mb-3">
          <Calendar size={11} />
          {new Date(item.timestamp).toLocaleDateString()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onView(item)}
            disabled={item.is_expired}
            className="flex-1 py-1.5 text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            <Eye size={11} /> {t('history.view_btn')}
          </button>
          <button
            onClick={() => onDownload(item)}
            className="flex-1 py-1.5 text-[11px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <FileText size={11} /> {t('history.pdf_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
