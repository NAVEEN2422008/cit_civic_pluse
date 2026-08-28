/* ============================================================
   CivicPulse — Citizen Progress Timeline (Proof View)
   Shows REAL officer progress updates with photo proof,
   GPS coordinates, timestamps, and AI verification badges.
   Citizens can verify or dispute each update.
   ============================================================ */
import React, { useState } from 'react';
import {
  CheckCircle2, Clock, MapPin, ShieldCheck, ShieldX,
  AlertTriangle, Eye, ThumbsUp, ThumbsDown, ChevronDown,
  Camera, Search, TrendingUp, Wrench, Zap, Video
} from 'lucide-react';
import { listProgressForIssue } from '../../utils/progressStore';
import { t as _t } from '../../i18n/translations';

const ICON_MAP = {
  search:   <Search size={13} />,
  play:     <TrendingUp size={13} />,
  trending: <TrendingUp size={13} />,
  check:    <CheckCircle2 size={13} />,
  alert:    <AlertTriangle size={13} />,
};

export default function CitizenProofTimeline({ issue, onVerify, lang = 'English' }) {
  const t = (s) => _t(s, lang);
  const proofs = listProgressForIssue(issue?.id || issue?.complaint_id || '');
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  const handleVerify = (proofId, confirmed) => {
    setVerifyingId(proofId);
    setTimeout(() => {
      if (onVerify) onVerify(proofId, confirmed, issue?.id);
      setVerifyingId(null);
    }, 800);
  };

  const getTypeMeta = (typeKey) => {
    switch (typeKey) {
      case 'INSPECTION':  return { label: 'Site Inspected',       ta: 'தள ஆய்வு',      color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  icon: 'search' };
      case 'WORK_START':  return { label: 'Work Started',           ta: 'வேலை தொடக்கம்',  color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', icon: 'play' };
      case 'PROGRESS':    return { label: 'Progress Update',        ta: 'முன்னேற்றம்',    color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   icon: 'trending' };
      case 'EVIDENCE':    return { label: 'Resolution Proof',      ta: 'தீர்வு சான்று',   color: '#10b981', bg: 'rgba(16,185,129,0.1)',   icon: 'check' };
      case 'BLOCKED':     return { label: 'Work Blocked',           ta: 'வேலை தடை',      color: '#f87171', bg: 'rgba(248,113,113,0.1)',  icon: 'alert' };
      default:            return { label: typeKey,                  ta: typeKey,           color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: 'check' };
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Eye size={16} color="#818cf8" />
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            {t('progress.officialTimeline') || 'Official Progress Timeline'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {proofs.length > 0
              ? `${proofs.length} ${t('progress.updateRecorded') || 'update(s) recorded — tap to expand photos'}`
              : t('progress.noUpdates') || 'No officer updates yet'}
          </div>
        </div>
      </div>

      {proofs.length === 0 ? (
        <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⏳</div>
          {t('progress.awaitingOfficer') || 'Waiting for officer to submit progress updates...'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', paddingLeft: 16 }}>
          {/* Vertical timeline line */}
          <div style={{ position: 'absolute', left: 19, top: 12, bottom: 12, width: 2, background: 'var(--border-color)' }} />

          {proofs.map((proof, idx) => {
            const meta = getTypeMeta(proof.type);
            const isExpanded = expandedPhoto === proof.id;
            const isVerifying = verifyingId === proof.id;

            return (
              <div key={proof.id} style={{ position: 'relative' }}>
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute', left: -16, top: 14,
                  width: 14, height: 14, borderRadius: '50%',
                  background: meta.color,
                  border: '2px solid var(--bg-primary)',
                  zIndex: 2,
                }} />

                <div style={{ background: 'rgba(15,23,42,0.7)', border: `1px solid ${meta.color}33`, borderRadius: 12, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: meta.color, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        {meta.label}
                      </span>
                      {proof.aiCheck && (
                        proof.aiCheck.isAiGenerated
                          ? <span style={{ fontSize: '0.65rem', background: 'rgba(248,113,113,0.15)', color: '#f87171', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>⚠️ AI Generated</span>
                          : <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>✅ Real Photo</span>
                      )}
                      {proof.gpsCheck?.hasExifGps && (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '2px 6px', borderRadius: 4 }}>
                          📍 {proof.gpsCheck.distanceMeters}m
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                      {new Date(proof.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Photo */}
                  {proof.photoUrl && (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={proof.photoUrl}
                        alt="Progress proof"
                        onClick={() => setExpandedPhoto(isExpanded ? null : proof.id)}
                        style={{
                          width: '100%', maxHeight: 180, objectFit: 'cover',
                          cursor: 'pointer', opacity: isExpanded ? 1 : 0.85,
                          borderTop: `1px solid ${meta.color}22`,
                          borderBottom: `1px solid ${meta.color}22`,
                        }}
                      />
                      <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '3px 8px', fontSize: '0.65rem', color: '#fff' }}>
                        <Camera size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        Proof Photo · Tap to {isExpanded ? 'collapse' : 'expand'}
                      </div>
                      {isExpanded && (
                        <div style={{ background: 'rgba(0,0,0,0.8)', padding: '6px 12px', fontSize: '0.7rem', color: '#9ca3af', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          {proof.aiCheck && (
                            <span>
                              {proof.aiCheck.isAiGenerated ? '⚠️ AI Generated' : '✅ Real Photo'}
                              <span style={{ marginLeft: 4, color: 'var(--text-dim)' }}>({(proof.aiCheck.confidence || 0.5) * 100 | 0}% conf)</span>
                            </span>
                          )}
                          {proof.gpsCheck?.hasExifGps && (
                            <span>📍 {proof.gpsCheck.distanceMeters}m from site</span>
                          )}
                          {proof.aiCheck?.reasoning && (
                            <span style={{ fontStyle: 'italic' }}>"{proof.aiCheck.reasoning}"</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Officer info + notes */}
                  <div style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: proof.notes ? 6 : 0 }}>
                      <span>👤 {proof.officerName}</span>
                      <span>🏢 {proof.officerDepartment}</span>
                      {proof.gpsLocation && (
                        <span>📍 {proof.gpsLocation.lat?.toFixed(4)}, {proof.gpsLocation.lng?.toFixed(4)}</span>
                      )}
                      {proof.gpsMeters != null && (
                        <span style={{ color: proof.gpsMeters <= 300 ? '#6ee7b7' : '#fbbf24' }}>
                          ±{proof.gpsMeters}m from issue
                        </span>
                      )}
                    </div>
                    {proof.notes && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: 0 }}>"{proof.notes}"</p>
                    )}
                  </div>

                  {/* Citizen verify action (for EVIDENCE type) */}
                  {proof.type === 'EVIDENCE' && !proof.citizenVerified && (
                    <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flex: 1 }}>
                        {t('progress.isThisCorrect') || 'Is this resolution correct?'}
                      </span>
                      <button
                        onClick={() => handleVerify(proof.id, true)}
                        disabled={isVerifying}
                        className="glass-btn"
                        style={{ padding: '4px 12px', fontSize: '0.75rem', color: '#10b981', borderColor: 'rgba(16,185,129,0.4)' }}
                      >
                        {isVerifying ? '...' : <><ThumbsUp size={12} /> Confirm</>}
                      </button>
                      <button
                        onClick={() => handleVerify(proof.id, false)}
                        disabled={isVerifying}
                        className="glass-btn"
                        style={{ padding: '4px 12px', fontSize: '0.75rem', color: '#f87171', borderColor: 'rgba(248,113,113,0.4)' }}
                      >
                        {isVerifying ? '...' : <><ThumbsDown size={12} /> Dispute</>}
                      </button>
                    </div>
                  )}
                  {proof.citizenVerified === true && (
                    <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.06)', fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ThumbsUp size={13} /> {t('progress.youConfirmed') || 'You confirmed this resolution ✓'}
                    </div>
                  )}
                  {proof.citizenVerified === false && (
                    <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.06)', fontSize: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ThumbsDown size={13} /> {t('progress.youDisputed') || 'You disputed — officer notified'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
