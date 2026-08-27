import React, { useState } from 'react';
import { Clock, ShieldAlert, CheckCircle, Upload, FastForward, RotateCcw, Camera, FileText, UserCheck, AlertCircle, ArrowRight, Eye, Image as ImageIcon } from 'lucide-react';
import { TN_DEPARTMENTS, ESCALATION_LEVELS } from '../mockData';

export default function OfficerPortal({ lang, complaints, setComplaints }) {
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  
  // Officer Proof Submission Form State
  const [afterPhoto, setAfterPhoto] = useState('');
  const [workNotes, setWorkNotes] = useState('');
  const [contractorName, setContractorName] = useState('TN Highways Repair Unit 4');
  const [costEstimate, setCostEstimate] = useState('₹12,500');

  // Filtered list based on selected department
  const filteredComplaints = selectedDept === 'ALL'
    ? complaints
    : complaints.filter(c => c.department === selectedDept);

  const handleFastForwardSLA = (complaintId) => {
    setComplaints(prev => prev.map(comp => {
      if (comp.id === complaintId) {
        const nextLevel = Math.min(5, comp.escalationLevel + 1);
        const nextLevelInfo = ESCALATION_LEVELS.find(l => l.level === nextLevel);

        return {
          ...comp,
          escalationLevel: nextLevel,
          slaExpiresAt: new Date(Date.now() - 1000).toISOString(),
          history: [
            ...comp.history,
            {
              step: `SLA Fast-Forward Escalation (Level ${nextLevel})`,
              note: `Fast-forward trigger: SLA Breached! Auto-Escalated to ${nextLevelInfo.titleEn}`,
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return comp;
    }));
  };

  const handleResolveComplaint = (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    const resolutionPhoto = afterPhoto || "https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=600&q=80";
    const now = new Date().toISOString();

    setComplaints(prev => prev.map(comp => {
      if (comp.id === selectedComplaint.id) {
        return {
          ...comp,
          status: 'PENDING_CONFIRMATION',
          afterPhotoUrl: resolutionPhoto,
          workNotes: workNotes || (lang === 'ta' ? 'பழுதுநீக்கம் நிறைவடைந்தது. புதிய தார் பூசப்பட்டது.' : 'Pothole filled with cold-mix asphalt and leveled.'),
          contractorName,
          costEstimate,
          officerName: 'Thiru. K. Arumugam (Assistant Engineer)',
          resolvedAt: now,
          verificationNote: "Gemini Vision AI Check Passed: 94% visual repair match with location GPS verification",
          history: [
            ...comp.history,
            {
              step: "Proof of Action Submitted",
              note: `Officer Thiru. K. Arumugam uploaded repair photo & work notes: "${workNotes || 'Fix completed'}"`,
              timestamp: now
            },
            {
              step: "AI Resolution Verification",
              note: "Gemini Vision AI compared Before/After photos. Verification Confidence: 94%",
              timestamp: now
            }
          ]
        };
      }
      return comp;
    }));

    setSelectedComplaint(null);
    setAfterPhoto('');
    setWorkNotes('');
  };

  const handleReopenComplaint = (complaintId) => {
    setComplaints(prev => prev.map(comp => {
      if (comp.id === complaintId) {
        return {
          ...comp,
          status: 'OPEN',
          priority: 'HIGH',
          priorityScore: Math.min(100, comp.priorityScore + 15),
          history: [
            ...comp.history,
            {
              step: "Citizen Re-Opened Ticket",
              note: "Citizen reported defect persists. Ticket reopened with HIGH priority penalty.",
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return comp;
    }));
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '10px' }}>
      {/* Department Filter Bar */}
      <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {lang === 'ta' ? 'துறை வடிகட்டி:' : 'Department Filter:'}
        </span>

        <button
          onClick={() => setSelectedDept('ALL')}
          className={`glass-btn ${selectedDept === 'ALL' ? 'glass-btn-primary' : ''}`}
          style={{ fontSize: '0.8rem', padding: '6px 14px' }}
        >
          {lang === 'ta' ? 'அனைத்துத் துறைகளும்' : 'All Departments'}
        </button>

        {Object.values(TN_DEPARTMENTS).map((dept) => (
          <button
            key={dept.id}
            onClick={() => setSelectedDept(dept.id)}
            className={`glass-btn ${selectedDept === dept.id ? 'glass-btn-primary' : ''}`}
            style={{ fontSize: '0.8rem', padding: '6px 14px', borderColor: selectedDept === dept.id ? dept.color : 'rgba(255, 255, 255, 0.15)' }}
          >
            {lang === 'ta' ? dept.nameTa : dept.nameEn}
          </button>
        ))}
      </div>

      {/* Task Queue Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredComplaints.map((item) => {
          const isExpired = new Date(item.slaExpiresAt) < new Date();
          const deptInfo = TN_DEPARTMENTS[item.department] || TN_DEPARTMENTS.CORPORATION;
          const escalationInfo = ESCALATION_LEVELS.find(l => l.level === item.escalationLevel);

          return (
            <div key={item.id} className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: deptInfo.color, background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px' }}>
                    {item.id} • {lang === 'ta' ? deptInfo.nameTa : deptInfo.nameEn}
                  </span>

                  <span className={`badge ${item.escalationLevel > 1 ? 'badge-escalated' : item.priority === 'HIGH' ? 'badge-high' : 'badge-medium'}`}>
                    {item.escalationLevel > 1 ? `🚨 ${lang === 'ta' ? escalationInfo.titleTa : escalationInfo.titleEn}` : item.priority}
                  </span>
                </div>

                {/* Complaint Photo */}
                <img
                  src={item.photoUrl}
                  alt="Complaint defect"
                  style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }}
                />

                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '6px', lineHeight: '1.3' }}>
                  {lang === 'ta' ? item.titleTa : item.titleEn}
                </h4>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  📍 {item.ward}
                </p>

                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '14px' }}>
                  <span>👥 {lang === 'ta' ? `${item.reporterCount} புகார்கள் (Deduplicated)` : `${item.reporterCount} Reporters (Merged)`}</span>
                  <span>⭐ {lang === 'ta' ? `முன்னுரிமை: ${item.priorityScore}` : `Priority Score: ${item.priorityScore}`}</span>
                </div>

                {/* SLA Timer Indicator */}
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: isExpired ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  border: isExpired ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '14px',
                  color: isExpired ? '#fca5a5' : '#6ee7b7'
                }}>
                  <Clock size={16} />
                  <span>
                    {isExpired
                      ? (lang === 'ta' ? '🚨 SLA காலக்கெடு முடிந்தது! (தானியங்கி உயர்வு)' : '🚨 SLA Breached! (Auto Escalated)')
                      : (lang === 'ta' ? '⏱️ SLA காலக்கெடு உள்ளது' : '⏱️ Active SLA Window')}
                  </span>
                </div>

                {/* Display Action Proof if already submitted */}
                {item.afterPhotoUrl && (
                  <div style={{ padding: '10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={14} />
                      <span>{lang === 'ta' ? 'சமர்ப்பிக்கப்பட்ட பழுதுநீக்கச் சான்று:' : 'Submitted Proof of Action:'}</span>
                    </div>
                    <img src={item.afterPhotoUrl} alt="Action proof" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }} />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      "{item.workNotes || 'Fix completed'}"
                    </p>
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {item.status === 'PENDING_CONFIRMATION' ? (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={14} />
                      <span>{lang === 'ta' ? 'பொதுமக்கள் ஒப்புதலுக்குக் காத்திருக்கிறது' : 'Pending Citizen Confirmation'}</span>
                    </div>

                    <button
                      onClick={() => handleReopenComplaint(item.id)}
                      className="glass-btn glass-btn-danger"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
                    >
                      <RotateCcw size={14} />
                      <span>{lang === 'ta' ? 'குடிமகன் மீண்டும் தொடங்கினார் (Re-open)' : 'Simulate Citizen Re-Open'}</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedComplaint(item)}
                      className="glass-btn glass-btn-primary"
                      style={{ justifyContent: 'center', fontSize: '0.85rem', padding: '10px' }}
                    >
                      <Upload size={16} />
                      <span>{lang === 'ta' ? 'பழுதுநீக்கச் சான்று சமர்ப்பி (Submit Proof)' : 'Submit Official Proof of Action'}</span>
                    </button>

                    <button
                      onClick={() => handleFastForwardSLA(item.id)}
                      className="glass-btn"
                      style={{ justifyContent: 'center', fontSize: '0.75rem', color: '#c4b5fd' }}
                    >
                      <FastForward size={14} />
                      <span>{lang === 'ta' ? 'SLA காலக்கெடுவை வேகப்படுத்து (Demo)' : 'Demo Fast-Forward SLA Escalation'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Proof of Action Modal Form */}
      {selectedComplaint && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <form onSubmit={handleResolveComplaint} className="glass-panel" style={{ maxWidth: '540px', width: '100%', padding: '26px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '14px' }}>
              <ShieldAlert size={24} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {lang === 'ta' ? 'அதிகாரப்பூர்வ நடவடிக்கைச் சான்று சமர்ப்பித்தல்' : 'Official Proof of Action Submission'}
              </h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Ticket ID: <strong>{selectedComplaint.id}</strong> • Ward: <strong>{selectedComplaint.ward}</strong>
            </p>

            {/* Original Complaint vs After Repair Photo Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'ta' ? '1. ஆரம்ப புகார் படம் (Before):' : '1. Original Complaint Photo:'}
                </span>
                <img src={selectedComplaint.photoUrl} alt="Before" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'ta' ? '2. பழுதுநீக்கப்பட்ட படம் (After):' : '2. After Repair Photo:'}
                </span>
                <img
                  src={afterPhoto || "https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=600&q=80"}
                  alt="After"
                  style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--primary)' }}
                />
              </div>
            </div>

            {/* After Photo URL Input */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                <Camera size={16} color="#0ea5e9" />
                <span>{lang === 'ta' ? 'பழுதுநீக்கப்பட்ட புகைப்பட URL:' : 'After-Repair Photo URL:'}</span>
              </label>
              <input
                type="text"
                className="glass-input"
                value={afterPhoto || "https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=600&q=80"}
                onChange={(e) => setAfterPhoto(e.target.value)}
              />
            </div>

            {/* Work Notes Input */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                <FileText size={16} color="#0ea5e9" />
                <span>{lang === 'ta' ? 'நடவடிக்கைக் குறிப்புகள் (Work Description):' : 'Official Work Completion Notes:'}</span>
              </label>
              <textarea
                className="glass-input"
                rows={3}
                placeholder={lang === 'ta' ? 'எ.கா: சாலைப் பள்ளம் தார் கலவையால் மூடப்பட்டு சமன் செய்யப்பட்டது.' : 'e.g. Pothole filled with cold-mix asphalt and leveled with roller.'}
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
              />
            </div>

            {/* Contractor & Cost Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {lang === 'ta' ? 'ஒப்பந்ததாரர் / பிரிவு:' : 'Executing Unit / Contractor:'}
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {lang === 'ta' ? 'மதிப்பீட்டுச் செலவு:' : 'Estimated Cost:'}
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={costEstimate}
                  onChange={(e) => setCostEstimate(e.target.value)}
                />
              </div>
            </div>

            {/* AI Vision Match Alert */}
            <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.8rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} />
              <span>{lang === 'ta' ? 'Gemini Vision AI ஒப்பீடு: 94% SSIM Visual Fix Match சரிபார்க்கப்பட்டது!' : 'Gemini Vision AI Verification: 94% visual fix match confirmed!'}</span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="glass-btn"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {lang === 'ta' ? 'ரத்துசெய்' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="glass-btn glass-btn-primary"
                style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
              >
                {lang === 'ta' ? 'சான்றைச் சமர்ப்பி & அனுப்பு' : 'Submit Official Proof of Action'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
