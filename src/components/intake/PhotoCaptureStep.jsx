import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, RefreshCw, Trash2, CheckCircle2, MapPin, AlertTriangle, ShieldCheck, ShieldX, Loader2 } from 'lucide-react';
import { extractExifGps, heuristicAiCheck } from '../../utils/mediaVerifier';
import { detectAiGenerated } from '../../utils/geminiService';
import { t, formatMsg } from '../../i18n/translations';

export default function PhotoCaptureStep({ photoUrl, setPhotoUrl, onExifLocationDetected, language = 'English' }) {
  const fileInputRef = useRef(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoExif, setPhotoExif] = useState(null);
  const [aiCheck, setAiCheck] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const sampleDemoImages = [
    { label: 'Pothole Defect', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80', lat: 13.0827, lng: 80.2707, ward: 'Ward 104, Anna Nagar, Chennai' },
    { label: 'Streetlight Cable Fault', url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80', lat: 9.9252, lng: 78.1198, ward: 'Ward 45, Madurai Main' },
    { label: 'Garbage Dump', url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80', lat: 11.0168, lng: 76.9558, ward: 'Ward 12, Gandhipuram, Coimbatore' },
  ];

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);

    if (!file.type.startsWith('image/')) {
      setErrorMsg(language === 'Tamil' ? 'செல்லுபடியாகும் புகைப்பட கோப்பை பதிவேற்றவும்.' : 'Please upload a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(language === 'Tamil' ? 'புகைப்படம் 5MB க்கும் குறைவாக இருக்க வேண்டும்.' : 'Image size must be less than 5MB.');
      return;
    }

    setPhotoFile(file);
    setVerifying(true);
    setAiCheck(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      setPhotoUrl(dataUrl);

      // 1) Real EXIF GPS extraction
      let exif = null;
      try {
        exif = await extractExifGps(file);
      } catch (err) {
        exif = { hasGps: false, lat: null, lng: null, cameraMake: '', cameraModel: '', software: '' };
      }
      setPhotoExif(exif);

      if (onExifLocationDetected) {
        onExifLocationDetected({
          lat: exif?.lat || 13.0827,
          lng: exif?.lng || 80.2707,
          ward: '',
          source: exif?.hasGps ? 'EXIF' : 'FALLBACK_GPS',
          exif,
        });
      }

      // 2) Gemini Vision AI-image detection
      try {
        const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (m) {
          const gem = await detectAiGenerated(m[2], m[1]);
          if (gem) {
            setAiCheck(gem);
          } else {
            // Fallback to local heuristic
            const h = heuristicAiCheck(exif, file.size);
            setAiCheck({ ...h, _source: 'heuristic_fallback' });
          }
        }
      } catch {
        const h = heuristicAiCheck(exif, file.size);
        setAiCheck({ ...h, _source: 'heuristic_fallback' });
      }
      setVerifying(false);
    };
    reader.readAsDataURL(file);
  };

  const selectSampleImage = (item) => {
    setPhotoFile(null);
    setPhotoExif(null);
    setAiCheck(null);
    setErrorMsg(null);
    setPhotoUrl(item.url);
    if (onExifLocationDetected) {
      onExifLocationDetected({ lat: item.lat, lng: item.lng, ward: item.ward, source: 'EXIF' });
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoExif(null);
    setAiCheck(null);
    setErrorMsg(null);
    setPhotoUrl('');
  };

  const isAiRejected = aiCheck?.isAiGenerated && (aiCheck?.confidence || 0) >= 0.7;

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
        <Camera size={22} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t('report.step1Title', language)}</h3>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        {t('report.step1Hint', language)}
      </p>

      <p style={{ fontSize: '0.78rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
        <ShieldX size={14} /> {t('report.aiWarning', language)}
      </p>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {photoUrl ? (
        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: `2px solid ${isAiRejected ? '#f87171' : '#0ea5e9'}` }}>
          <img src={photoUrl} alt="Preview" style={{ width: '100%', maxHeight: '260px', objectFit: 'cover' }} />

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              {verifying ? (
                <><Loader2 size={14} className="animate-spin" /> {t('photoVerification.verifying', language)}</>
              ) : (
                <><CheckCircle2 size={16} /> {t('photoVerification.photoAttached', language)}</>
              )}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="glass-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                <RefreshCw size={13} /> Replace
              </button>
              <button type="button" onClick={removePhoto} className="glass-btn glass-btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                <Trash2 size={13} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="glass-btn glass-btn-primary" style={{ flex: 1, padding: '16px', justifyContent: 'center', fontSize: '0.95rem' }}>
              <Camera size={20} /> <span>{t('report.takePhoto', language)}</span>
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="glass-btn" style={{ flex: 1, padding: '16px', justifyContent: 'center', fontSize: '0.95rem' }}>
              <ImageIcon size={20} /> <span>{t('report.gallery', language)}</span>
            </button>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Or choose a sample defect photo for testing:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {sampleDemoImages.map((item, idx) => (
                <button key={idx} type="button" onClick={() => selectSampleImage(item)} className="glass-btn" style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'center' }}>
                  📸 {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'rgba(248, 113, 113, 0.15)', border: '1px solid rgba(248, 113, 113, 0.4)', padding: '10px 12px', borderRadius: '10px', color: '#fca5a5', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={14} /> {errorMsg}
        </div>
      )}

      {aiCheck && (
        <div style={{ background: isAiRejected ? 'rgba(248, 113, 113, 0.12)' : 'rgba(110, 231, 183, 0.08)', border: `1px solid ${isAiRejected ? 'rgba(248, 113, 113, 0.4)' : 'rgba(110, 231, 183, 0.3)'}`, padding: '12px 14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isAiRejected ? '#fca5a5' : '#86efac', fontWeight: 700, fontSize: '0.88rem' }}>
            {isAiRejected ? <ShieldX size={16} /> : <ShieldCheck size={16} />}
            {isAiRejected
              ? (language === 'Tamil' ? 'AI-உருவாக்கப்பட்ட புகைப்படம் — நிராகரிக்கப்படும்' : 'AI-generated photo — will be rejected')
              : (language === 'Tamil' ? 'உண்மையான புகைப்படம்' : 'Authentic physical photo')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {language === 'Tamil' ? 'AI ஆய்வு: ' : 'AI assessment: '}
            {aiCheck.isAiGenerated ? 'AI-synthesized' : 'Real'}
            {' · '}
            {language === 'Tamil' ? 'நம்பகத்தன்மை' : 'confidence'} {Math.round((aiCheck.confidence || 0.5) * 100)}%
            {aiCheck._source ? ` · ${aiCheck._source}` : ''}
          </div>
          {aiCheck.reasoning && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '2px' }}>
              {aiCheck.reasoning}
            </div>
          )}
        </div>
      )}

      {photoExif && (
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>📍 EXIF Metadata</div>
          {photoExif.hasGps ? (
            <div>
              <div>Lat: {photoExif.lat.toFixed(6)}, Lng: {photoExif.lng.toFixed(6)}</div>
              {photoExif.cameraMake && <div>Camera: {photoExif.cameraMake} {photoExif.cameraModel}</div>}
              {photoExif.software && <div>Software: {photoExif.software}</div>}
            </div>
          ) : (
            <div>{language === 'Tamil' ? 'EXIF GPS இல்லை — வரைபடம்/GPS பயன்படுத்தவும்' : 'No EXIF GPS — map/GPS location will be used'}</div>
          )}
        </div>
      )}
    </div>
  );
}
