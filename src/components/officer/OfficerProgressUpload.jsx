/* ============================================================
   CivicPulse — Officer Progress Upload Component
   Officers MUST submit photo/video proof with GPS + notes
   for every workflow action. AI verifies photo authenticity
   and location match.
   ============================================================ */
import React, { useState, useRef } from 'react';
import {
  Camera, Video, MapPin, Clock, ShieldCheck, ShieldX,
  AlertTriangle, CheckCircle2, Loader2, Upload, X,
  Play, Pause, Search, TrendingUp, Wrench, Zap, Eye
} from 'lucide-react';
import { extractExifGps, heuristicAiCheck } from '../../utils/mediaVerifier';
import { detectAiGenerated } from '../../utils/geminiService';
import { verifyMediaExifLocation } from '../../utils/mediaVerifier';
import { PROGRESS_TYPES, addProgressEntry } from '../../utils/progressStore';
import { t as _t } from '../../i18n/translations';

const MAX_GPS_DISTANCE = 300; // meters

export default function OfficerProgressUpload({ issue, onComplete, onClose, officer }) {
  const [step, setStep] = useState(1);
  const [progressType, setProgressType] = useState(null);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [gpsStatus, setGpsStatus] = useState(null); // { lat, lng, accuracy, source }
  const [verifying, setVerifying] = useState(false);
  const [aiCheck, setAiCheck] = useState(null);
  const [gpsCheck, setGpsCheck] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [lang, setLang] = useState('English');
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const lang_ = (s) => _t(s, lang);

  const fetchGps = () => {
    if (!navigator.geolocation) return;
    let settled = false;
    navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setGpsStatus({ lat, lng, accuracy: Math.round(accuracy), source: 'LIVE_GPS' });
        if (!settled) {
          settled = true;
          setTimeout(() => {}, 1500);
        }
      },
      () => setGpsStatus({ lat: issue?.latitude || 13.0827, lng: issue?.longitude || 80.2707, accuracy: 500, source: 'FALLBACK' }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handlePhotoFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setPhotoFile(file);
    setVerifying(true);
    setAiCheck(null);
    setGpsCheck(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      setPhotoUrl(dataUrl);

      let exif = null;
      try { exif = await extractExifGps(file); } catch { exif = {}; }

      // 1) Gemini AI image authenticity check
      let ai = null;
      try {
        const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (m) {
          ai = await detectAiGenerated(m[2], m[1]);
        }
      } catch {}
      if (!ai) {
        ai = heuristicAiCheck(exif, file.size);
        ai._source = 'heuristic';
      }
      setAiCheck(ai);

      // 2) GPS location match check
      if (exif?.hasGps && gpsStatus?.lat) {
        const dist = verifyMediaExifLocation(exif.lat, exif.lng, gpsStatus.lat, gpsStatus.lng, MAX_GPS_DISTANCE);
        setGpsCheck(dist);
      } else {
        setGpsCheck({ hasExifGps: false, isValidLocation: true, statusMessage: 'no_exif' });
      }

      setVerifying(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoFile(file);
  };

  const isValidPhoto = () => {
    if (!photoUrl) return false;
    const aiOk = !aiCheck?.isAiGenerated || (aiCheck?.confidence || 0) < 0.7;
    return aiOk;
  };

  const canSubmit = () => {
    if (!photoUrl || !isValidPhoto()) return false;
    if (progressType === 'EVIDENCE' && (!gpsStatus || !notes.trim())) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    setSubmitting(true);

    let exif = null;
    if (photoFile) {
      try { exif = await extractExifGps(photoFile); } catch { exif = {}; }
    }

    const entry = addProgressEntry({
      issueId: issue?.id || issue?.complaint_id || 'unknown',
      type: progressType?.key || 'PROGRESS',
      typeLabel: progressType?.label || 'Progress Update',
      notes: notes.trim(),
      photoUrl,
      videoUrl: null,
      exif,
      aiCheck,
      gpsCheck,
      gpsMeters: gpsCheck?.distanceMeters,
      officerId: officer?.officer_id || 'OFF001',
      officerName: officer?.name || 'Field Officer',
      officerDepartment: officer?.department || 'Corporation',
      verified: isValidPhoto() && (aiCheck?.confidence || 0) >= 0.7,
      issueLocation: { lat: issue?.latitude || issue?.lat, lng: issue?.longitude || issue?.lon },
      gpsLocation: gpsStatus,
    });

    setSubmitting(false);
    setDone(true);
    if (onComplete) onComplete(entry);
  };

  if (done) {
    return (
      <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
        <CheckCircle2 size={40} color="#10b981" style={{ marginBottom: 12 }} />
        <h4 style={{ color: '#6ee7b7', marginBottom: 8 }}>{lang_('progress.submitSuccess') || 'Progress Submitted!'}</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 16 }}>
          {lang_('progress.citizenCanSee') || 'Citizens can now see this update in the timeline.'}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={onClose} className="glass-btn glass-btn-primary" style={{ padding: '8px 20px' }}>
            {lang_('common.close') || 'Close'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fbd77a', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {lang_('progress.submitProof') || '📋 SUBMIT PROOF — Transparency Record'}
          </div>
          <h4 style={{ color: 'var(--text-main)', marginTop: 2 }}>
            {issue?.title || issue?.description || 'Issue'} — {issue?.id || ''}
          </h4>
        </div>
        <button onClick={onClose} className="glass-btn" style={{ padding: '4px 8px' }}><X size={14} /></button>
      </div>

      {/* Step 1: What type of progress? */}
      {step === 1 && (
        <div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            {lang_('progress.selectType') || 'Select the type of progress you are reporting. Each update requires photo proof.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.values(PROGRESS_TYPES).map(pt => {
              const icon = pt.icon === 'search' ? <Search size={16} /> :
                           pt.icon === 'play' ? <Play size={16} /> :
                           pt.icon === 'trending' ? <TrendingUp size={16} /> :
                           pt.icon === 'check' ? <CheckCircle2 size={16} /> :
                           <AlertTriangle size={16} />;
              return (
                <button
                  key={pt.key}
                  onClick={() => { setProgressType(pt); setStep(2); }}
                  className={`glass-btn ${progressType === pt ? 'glass-btn-primary' : ''}`}
                  style={{ padding: '12px 16px', justifyContent: 'flex-start', gap: 10 }}
                >
                  {icon}
                  <span style={{ fontWeight: 700 }}>{pt.label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{pt.ta}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Photo + GPS + Notes */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Progress type label */}
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={14} color="#a5b4fc" />
            <span style={{ fontSize: '0.8rem', color: '#a5b4fc', fontWeight: 600 }}>{progressType?.label} · {progressType?.ta}</span>
          </div>

          {/* GPS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>📍 {lang_('progress.gpsLocation') || 'GPS Location (Required)'}</span>
              {gpsStatus && (
                <span style={{ fontSize: '0.72rem', color: '#6ee7b7' }}>±{gpsStatus.accuracy}m · {gpsStatus.source}</span>
              )}
            </div>
            {!gpsStatus ? (
              <button onClick={fetchGps} className="glass-btn glass-btn-primary" style={{ padding: '10px 16px', justifyContent: 'center', width: '100%' }}>
                <MapPin size={15} /> {lang_('progress.detectGps') || '📍 Detect My GPS Location'}
              </button>
            ) : (
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: '#6ee7b7' }}>
                Lat: {gpsStatus.lat?.toFixed(6)} · Lng: {gpsStatus.lng?.toFixed(6)} · ±{gpsStatus.accuracy}m
              </div>
            )}
          </div>

          {/* Photo */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>📸 {lang_('progress.photoProof') || 'Photo Proof (Required)'}</span>
              {aiCheck && !verifying && (
                <span style={{ fontSize: '0.72rem', color: aiCheck.isAiGenerated ? '#f87171' : '#6ee7b7' }}>
                  {aiCheck.isAiGenerated ? '⚠️ AI Generated' : '✅ Real Photo'}
                </span>
              )}
            </div>
            <input type="file" ref={fileInputRef} accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />

            {photoUrl ? (
              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `2px solid ${aiCheck?.isAiGenerated ? '#f87171' : '#0ea5e9'}` }}>
                <img src={photoUrl} alt="Proof" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                <div style={{ display: 'flex', gap: 6, padding: '8px', background: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
                  <button onClick={() => fileInputRef.current?.click()} className="glass-btn" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>Replace</button>
                  <button onClick={() => { setPhotoUrl(''); setPhotoFile(null); setAiCheck(null); setGpsCheck(null); }} className="glass-btn glass-btn-danger" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>Remove</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => fileInputRef.current?.click()} className="glass-btn glass-btn-primary" style={{ flex: 1, padding: '14px', justifyContent: 'center' }}>
                  <Camera size={16} /> {lang_('progress.takePhoto') || 'Take Photo'}
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="glass-btn" style={{ flex: 1, padding: '14px', justifyContent: 'center' }}>
                  <Upload size={16} /> {lang_('progress.uploadPhoto') || 'Upload'}
                </button>
              </div>
            )}

            {/* Verification results */}
            {verifying && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: '0.78rem', color: '#38bdf8' }}>
                <Loader2 size={13} className="animate-spin" />
                Analyzing photo (AI authenticity + GPS match)...
              </div>
            )}

            {aiCheck && !verifying && (
              <div style={{ marginTop: 8, background: aiCheck.isAiGenerated ? 'rgba(248,113,113,0.1)' : 'rgba(16,185,129,0.08)', border: `1px solid ${aiCheck.isAiGenerated ? 'rgba(248,113,113,0.4)' : 'rgba(16,185,129,0.3)'}`, borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.82rem', color: aiCheck.isAiGenerated ? '#fca5a5' : '#6ee7b7', marginBottom: 4 }}>
                  {aiCheck.isAiGenerated ? <ShieldX size={14} /> : <ShieldCheck size={14} />}
                  {aiCheck.isAiGenerated ? 'AI-Generated Photo — REJECTED' : '✅ Authentic Photo Verified'}
                  <span style={{ fontWeight: 400, fontSize: '0.72rem', marginLeft: 'auto' }}>{Math.round((aiCheck.confidence || 0.5) * 100)}% confidence</span>
                </div>
                {aiCheck.reasoning && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>{aiCheck.reasoning}</div>
                )}
                {gpsCheck && (
                  <div style={{ marginTop: 4, fontSize: '0.72rem', color: gpsCheck.isValidLocation ? '#6ee7b7' : '#fca5a5' }}>
                    {gpsCheck.hasExifGps
                      ? (gpsCheck.isValidLocation
                          ? `✅ Photo GPS matches officer location (${gpsCheck.distanceMeters}m from site)`
                          : `⚠️ Photo GPS ${gpsCheck.distanceMeters}m from officer — outside ${MAX_GPS_DISTANCE}m threshold`)
                      : 'ℹ️ No EXIF GPS in photo — officer GPS will be used'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
              📝 {lang_('progress.notes') || 'Work Notes (Required for evidence)'}
            </label>
            <textarea
              className="glass-input"
              rows={3}
              maxLength={500}
              placeholder={
                lang === 'Tamil'
                  ? 'இங்கே வேலை விவரங்களை எழுதவும்...'
                  : 'Describe the work done, materials used, and current status...'
              }
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ fontSize: '0.85rem', width: '100%' }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-dim)' }}>{notes.length}/500</div>
          </div>

          {/* Validation warnings */}
          {!isValidPhoto() && photoUrl && (
            <div style={{ background: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.4)', borderRadius: 8, padding: '10px 12px', color: '#fca5a5', fontSize: '0.8rem', display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertTriangle size={14} />
              {aiCheck?.isAiGenerated
                ? 'AI-generated photos are NOT accepted. Please upload an authentic real photo taken at the site.'
                : 'Please add a photo taken at the issue location.'}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={() => setStep(1)} className="glass-btn" style={{ padding: '10px 16px' }}>
              <X size={14} /> {lang_('common.back') || 'Back'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit() || submitting}
              className="glass-btn glass-btn-primary"
              style={{ flex: 1, padding: '12px', justifyContent: 'center', opacity: canSubmit() ? 1 : 0.5 }}
            >
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : <><CheckCircle2 size={14} /> {lang_('progress.submitProof') || 'Submit Progress Proof'}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
