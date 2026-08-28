import React from 'react';
import { Send, Edit3, Camera, FileText, Mic, MapPin, Globe, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ReviewSubmitStep({
  photoUrl,
  description,
  voiceData,
  locationData,
  language,
  isSubmitting,
  onEditStep,
  onSubmit
}) {
  const hasPhoto = Boolean(photoUrl);
  const hasText = Boolean(description && (typeof description === 'string' ? description.trim() : ''));
  const hasVoice = Boolean(voiceData);

  const wardDisplay = typeof locationData.ward === 'string' 
    ? locationData.ward 
    : (locationData.ward?.name || 'General Ward');

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
        <CheckCircle2 size={24} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
          {language === 'Tamil' ? 'மதிப்பாய்வு & இறுதி சமர்ப்பம்' : 'Step 5: Review & Submit Complaint'}
        </h3>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        {language === 'Tamil'
          ? 'CivicPulse பதிவு முறைமைக்கு அனுப்பும் முன் உங்கள் புகார் விவரங்களை மதிப்பாய்வு செய்யுங்கள்.'
          : 'Review your complaint details before sending it to the CivicPulse intake system.'}
      </p>

      {/* Inputs Summary Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Photo Preview */}
        <div style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Camera size={16} /> {language === 'Tamil' ? 'புகைப்படம்:' : 'Photo Attachment:'}
            </span>
            <button type="button" onClick={() => onEditStep(1)} style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: '0.75rem', cursor: 'pointer' }}>
              <Edit3 size={13} /> {language === 'Tamil' ? 'திருத்து' : 'Edit'}
            </button>
          </div>

          {hasPhoto ? (
            <img src={photoUrl} alt="Review attachment" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} />
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
              {language === 'Tamil' ? 'புகைப்படம் இல்லை' : 'No photo attached'}
            </span>
          )}
        </div>

        {/* Text Description Preview */}
        <div style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} /> {language === 'Tamil' ? `உரை விவரம் (${language}):` : `Text Description (${language}):`}
            </span>
            <button type="button" onClick={() => onEditStep(2)} style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: '0.75rem', cursor: 'pointer' }}>
              <Edit3 size={13} /> {language === 'Tamil' ? 'திருத்து' : 'Edit'}
            </button>
          </div>

          {hasText ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0 }}>"{description}"</p>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
              {language === 'Tamil' ? 'உரை விவரம் இல்லை' : 'No text description provided'}
            </span>
          )}

          {/* DOWNSIDE: English Translation Preview */}
          {hasText && language !== 'English' && voiceData?.translated && (
            <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(12, 74, 62, 0.15)', border: '1px solid rgba(46, 158, 122, 0.3)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2e9e7a', textTransform: 'uppercase', marginBottom: '2px' }}>
                🌐 English Translation (for Officer Routing):
              </div>
              <div style={{ fontSize: '0.82rem', color: '#e6f0ed', fontStyle: 'italic' }}>
                "{voiceData.translated}"
              </div>
            </div>
          )}
        </div>

        {/* Voice Note Preview */}
        <div style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mic size={16} /> {language === 'Tamil' ? 'குரல் பதிவு:' : 'Voice Recording:'}
            </span>
            <button type="button" onClick={() => onEditStep(2)} style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: '0.75rem', cursor: 'pointer' }}>
              <Edit3 size={13} /> {language === 'Tamil' ? 'திருத்து' : 'Edit'}
            </button>
          </div>

          {hasVoice ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <audio src={voiceData.url || voiceData.audioUrl} controls style={{ width: '100%', height: '32px' }} />
              {voiceData.transcript && (
                <div style={{ fontSize: '0.8rem', color: '#f8fafc', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px' }}>
                  🎙️ {voiceData.transcript}
                </div>
              )}
              {voiceData.translated && language !== 'English' && (
                <div style={{ padding: '8px 12px', background: 'rgba(12, 74, 62, 0.15)', border: '1px solid rgba(46, 158, 122, 0.3)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2e9e7a', textTransform: 'uppercase', marginBottom: '2px' }}>
                    🌐 English Translation (for Officer Routing):
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#e6f0ed', fontStyle: 'italic' }}>
                    "{voiceData.translated}"
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
              {language === 'Tamil' ? 'குரல் பதிவு இல்லை' : 'No voice note recorded'}
            </span>
          )}
        </div>

        {/* Location Summary */}
        <div style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={16} /> {language === 'Tamil' ? 'இடம்:' : 'Location:'}
            </span>
            <button type="button" onClick={() => onEditStep(4)} style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: '0.75rem', cursor: 'pointer' }}>
              <Edit3 size={13} /> {language === 'Tamil' ? 'திருத்து' : 'Edit'}
            </button>
          </div>

          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>📍 {wardDisplay}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Lat: {locationData.lat?.toFixed(4) || '13.0827'}, Lng: {(locationData.lng || locationData.lon || 80.2707).toFixed(4)} ({locationData.source}{locationData.accuracy ? ` · ±${locationData.accuracy}m` : ''})
          </div>
        </div>

      </div>

      {/* Final Submit Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="glass-btn glass-btn-primary"
        style={{ padding: '16px', justifyContent: 'center', fontSize: '1.05rem', marginTop: '8px' }}
      >
        <Send size={20} />
        <span>{isSubmitting
          ? (language === 'Tamil' ? 'சமர்ப்பிக்கப்படுகிறது...' : 'Submitting Issue to Intake API...')
          : (language === 'Tamil' ? 'புகாரைச் சமர்ப்பிக்க' : 'Submit Complaint')}
        </span>
      </button>
    </div>
  );
}
