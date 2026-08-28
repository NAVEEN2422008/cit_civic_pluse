import React from 'react';
import { CheckCircle2, Clock, MapPin, Building, ShieldCheck, AlertCircle, X, Eye } from 'lucide-react';
import ResponsiblePersonPanel from './ResponsiblePersonPanel';
import CitizenProofTimeline from './CitizenProofTimeline';
import { t } from '../../i18n/translations';

export default function ComplaintTimelineModal({ issueDetail, isOpen, onClose, lang = 'English' }) {
  if (!isOpen || !issueDetail) return null;

  const steps = issueDetail.timeline_steps || [
    { step_key: "SUBMITTED", title: "Submitted", description: "Citizen intake created & uploaded", is_completed: true, is_current: false },
    { step_key: "PROCESSED", title: "Processed", description: "Audio/Voice STT & regional text processed", is_completed: true, is_current: false },
    { step_key: "CATEGORIZED", title: "Categorized", description: "Defect classified by AI", is_completed: true, is_current: false },
    { step_key: "DEDUPLICATED", title: "Duplicate Checked", description: "Spatial/text deduplication verified", is_completed: true, is_current: false },
    { step_key: "ROUTED", title: "Routed", description: "Auto-routed to department", is_completed: true, is_current: false },
    { step_key: "ASSIGNED", title: "Assigned", description: "Assigned to field officer", is_completed: true, is_current: true },
    { step_key: "IN_PROGRESS", title: "In Progress", description: "Officer is working on the issue", is_completed: false, is_current: false },
    { step_key: "RESOLVED", title: "Resolved", description: "Work completed with photo proof", is_completed: false, is_current: false },
    { step_key: "VERIFIED", title: "Citizen Verification", description: "Your confirmation that the fix is real", is_completed: false, is_current: false }
  ];

  const severityColors = {
    CRITICAL: { bg: '#fff1f2', fg: '#ef4444', label: 'CRITICAL' },
    HIGH:     { bg: '#fff7ed', fg: '#f97316', label: 'HIGH' },
    MEDIUM:   { bg: '#fefce8', fg: '#eab308', label: 'MEDIUM' },
    LOW:      { bg: '#f0fdf4', fg: '#22c55e', label: 'LOW' },
  };
  const sev = severityColors[(issueDetail.priority || 'MEDIUM').toUpperCase()] || severityColors.MEDIUM;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      zIndex: 3000, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-panel" style={{ maxWidth: '640px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(56,189,248,0.1)', padding: '3px 8px', borderRadius: 5, border: '1px solid rgba(56,189,248,0.2)', letterSpacing: '0.4px' }}>
                {issueDetail.id || issueDetail.complaint_id || 'N/A'}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, background: sev.bg, color: sev.fg, padding: '3px 8px', borderRadius: 5 }}>
                {sev.label} PRIORITY
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(99,102,241,0.1)', color: '#818cf8', padding: '3px 8px', borderRadius: 5 }}>
                {issueDetail.department || 'Corporation'}
              </span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-main)' }}>
              {issueDetail.processed_description || issueDetail.titleEn || issueDetail.description || 'Civic Issue'}
            </h3>
          </div>
          <button onClick={onClose} className="glass-btn" style={{ padding: '4px 10px', flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Location & SLA */}
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px', padding: '10px 14px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
          <span>📍 {issueDetail.location_ward || issueDetail.ward || 'Location not set'}</span>
          <span>🕐 Filed: {issueDetail.created_at ? new Date(issueDetail.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'}</span>
          {issueDetail.ai_confidence != null && (
            <span>🤖 AI: {Math.round(issueDetail.ai_confidence * 100)}% confidence</span>
          )}
        </div>

        {/* Routing */}
        <div style={{ marginBottom: '20px' }}>
          <ResponsiblePersonPanel
            category={issueDetail.category || issueDetail.categoryEn}
            ward={issueDetail.location_ward || issueDetail.ward}
            district={issueDetail.district}
          />
        </div>

        {/* ===== REAL OFFICER PROGRESS PROOF TIMELINE ===== */}
        <div style={{ marginBottom: '20px' }}>
          <CitizenProofTimeline issue={issueDetail} onVerify={(proofId, confirmed) => {
            import('../../utils/progressStore').then(m => {
              m.updateCitizenVerification(proofId, confirmed);
            });
          }} lang={lang} />
        </div>

        {/* 9-Step Pipeline */}
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Eye size={13} /> {lang === 'Tamil' ? '9-படி தீர்வு குழாவ்' : '9-Step Resolution Pipeline'}
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', paddingLeft: '8px' }}>
          <div style={{ position: 'absolute', left: '19px', top: '12px', bottom: '12px', width: '2px', background: 'var(--border-color)', zIndex: 1 }} />

          {steps.map((step, idx) => {
            const isDone = step.is_completed;
            const isCurrent = step.is_current;

            return (
              <div key={step.step_key} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', zIndex: 2, position: 'relative' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: isCurrent ? '#0ea5e9' : isDone ? '#10b981' : 'rgba(30, 41, 59, 0.9)',
                  border: isCurrent ? '3px solid #38bdf8' : isDone ? '2px solid #6ee7b7' : '2px solid var(--border-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '0.68rem', fontWeight: 700,
                  boxShadow: isCurrent ? '0 0 10px rgba(14, 165, 233, 0.8)' : undefined, flexShrink: 0,
                }}>
                  {isDone ? '✓' : idx + 1}
                </div>
                <div style={{
                  flex: 1, padding: '8px 12px',
                  background: isCurrent ? 'rgba(14, 165, 233, 0.12)' : 'rgba(15, 23, 42, 0.5)',
                  borderRadius: '10px', border: isCurrent ? '1px solid #0ea5e9' : '1px solid var(--border-color)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isCurrent ? '#38bdf8' : isDone ? '#6ee7b7' : 'var(--text-muted)' }}>
                      {lang === 'Tamil' ? translateStepTa(step.title) : step.title}
                    </span>
                    {isCurrent && <span className="badge badge-medium" style={{ fontSize: '0.65rem' }}>{lang === 'Tamil' ? 'தற்போதைய கட்டம்' : 'Current'}</span>}
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {lang === 'Tamil' ? translateDescTa(step.step_key) : step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '20px', padding: '10px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: '#818cf8' }}>
          <ShieldCheck size={14} />
          {lang === 'Tamil'
            ? 'அனைத்து அதிகாரி நடவடிக்கைகளும் புகைப்பட சான்று + GPS + நேர முத்திரையுடன் பதிவு செய்யப்படுகின்றன.'
            : 'All officer actions are recorded with photo proof, GPS, and timestamp for full transparency.'}
        </div>

        <button onClick={onClose} className="glass-btn glass-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '12px' }}>
          {lang === 'Tamil' ? 'மூடு' : 'Close Status Timeline'}
        </button>
      </div>
    </div>
  );
}

function translateStepTa(title) {
  const map = {
    'Submitted': 'சமர்ப்பிக்கப்பட்டது', 'Processed': 'செயலாக்கப்பட்டது',
    'Categorized': 'வகைப்படுத்தப்பட்டது', 'Duplicate Checked': 'நகல் சரிபார்ப்பு',
    'Routed': 'வழிநிர்ணயிக்கப்பட்டது', 'Assigned': 'ஒதுக்கப்பட்டது',
    'In Progress': 'செயல்பாட்டில்', 'Resolved': 'தீர்க்கப்பட்டது',
    'Citizen Verification': 'குடிமக்கள் சரிபார்ப்பு',
  };
  return map[title] || title;
}

function translateDescTa(key) {
  const map = {
    SUBMITTED: 'குடிமக்கள் புகார் பதிவு செய்யப்பட்டது', PROCESSED: 'AI மூலம் உரை/குரல் செயலாக்கம்',
    CATEGORIZED: 'AI மூலம் குறைபாடு வகைப்படுத்தப்பட்டது', DEDUPLICATED: 'நகல்/மோசடி சரிபார்ப்பு',
    ROUTED: 'துறையை நோக்கி வழிநிர்ணயம்', ASSIGNED: 'அதிகாரிக்கு ஒதுக்கப்பட்டது',
    IN_PROGRESS: 'அதிகாரி வேலையில் உள்ளார்', RESOLVED: 'புகைப்பட சான்றுடன் தீர்க்கப்பட்டது',
    VERIFIED: 'குடிமக்கள் தீர்வை உறுதிசெய்ய வேண்டும்',
  };
  return map[key] || '';
}
