import React, { useState } from 'react';
import { Send, PhoneCall, Sparkles, CheckCircle2, AlertTriangle, Eye, Clock, RotateCcw, ThumbsUp, ThumbsDown, ShieldCheck, MapPin, WifiOff, RefreshCw, Filter, Search } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import PhotoLocationPicker from './PhotoLocationPicker';
import { TN_DISTRICTS_WARDS, TN_DEPARTMENTS, ESCALATION_LEVELS } from '../mockData';
import { processNewComplaint } from '../utils/AIProcessor';

export default function CitizenPortal({ lang, complaints, setComplaints, userAuth }) {
  const [activeTab, setActiveTab] = useState('raise'); // 'raise' | 'review'
  const [location, setLocation] = useState(TN_DISTRICTS_WARDS[0]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [textDescription, setTextDescription] = useState('');
  const [voiceData, setVoiceData] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState([]);

  // Inspection & Dispute State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputePhoto, setDisputePhoto] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Search & Filter State for Review Page
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const handleSubmitAppReport = (e) => {
    e.preventDefault();
    setFeedback(null);

    const rawReport = {
      titleTa: textDescription || (voiceData ? voiceData.textTa : ''),
      titleEn: textDescription || (voiceData ? voiceData.textEn : ''),
      photoUrl,
      location,
      voiceTranscriptTa: voiceData ? voiceData.textTa : '',
      reporterEmail: userAuth ? userAuth.email : 'citizen@example.com'
    };

    if (isOffline) {
      setOfflineQueue(prev => [...prev, rawReport]);
      setFeedback({
        type: 'merged',
        text: lang === 'ta'
          ? 'இணைய இணைப்பு இல்லை! புகார் சாதனத்தில் பாதுகாப்பாகச் சேமிக்கப்பட்டது. இணையம் வந்ததும் Sarvam AI செயலாக்கும்.'
          : 'Offline Mode! Complaint saved locally. Will translate & process via Sarvam AI automatically when online.'
      });
      setTextDescription('');
      setVoiceData(null);
      return;
    }

    const result = processNewComplaint(rawReport, complaints);

    if (result.status === 'MERGED_DUPLICATE') {
      setComplaints(prev => prev.map(c => c.id === result.masterTicket.id ? result.masterTicket : c));
      setFeedback({ type: 'merged', text: lang === 'ta' ? result.messageTa : result.messageEn });
    } else if (result.status === 'CREATED') {
      setComplaints(prev => [result.newTicket, ...prev]);
      setFeedback({ type: 'success', text: lang === 'ta' ? result.messageTa : result.messageEn });
    } else {
      setFeedback({ type: 'error', text: lang === 'ta' ? result.reasonTa : result.reasonEn });
    }

    setTextDescription('');
    setVoiceData(null);
  };

  // Reporter Approve Action
  const handleReporterApprove = (ticketId) => {
    setComplaints(prev => prev.map(comp => {
      if (comp.id === ticketId) {
        return {
          ...comp,
          status: 'RESOLVED',
          history: [
            ...comp.history,
            { step: "Citizen Approved", note: "Original reporter verified fix in reality. Ticket CLOSED.", timestamp: new Date().toISOString() }
          ]
        };
      }
      return comp;
    }));
    setSelectedTicket(null);
  };

  // Public Fallback Approve Action (15-Day SLA Fallback)
  const handlePublicApprove = (ticketId) => {
    setComplaints(prev => prev.map(comp => {
      if (comp.id === ticketId) {
        return {
          ...comp,
          status: 'RESOLVED',
          history: [
            ...comp.history,
            { step: "Public Community Approved (15-Day Fallback)", note: "Community citizen verified fix after 15-day reporter SLA window. Ticket CLOSED.", timestamp: new Date().toISOString() }
          ]
        };
      }
      return comp;
    }));
    setSelectedTicket(null);
  };

  // Reject Fix with Proof Image + Reason (Triggers AI Vision Check)
  const handleRejectFix = (ticketId) => {
    if (!disputeReason || !disputePhoto) {
      alert(lang === 'ta' ? 'நிராகரிக்க ஆதாரப் புகைப்படம் மற்றும் காரணத்தை உள்ளிடவும்!' : 'Please attach proof photo and state reason for rejection!');
      return;
    }

    setComplaints(prev => prev.map(comp => {
      if (comp.id === ticketId) {
        return {
          ...comp,
          status: 'OPEN',
          priority: 'HIGH',
          priorityScore: Math.min(100, comp.priorityScore + 25),
          disputeProofPhoto: disputePhoto,
          history: [
            ...comp.history,
            {
              step: "Citizen Fix Rejection (AI Vision Verification Triggered)",
              note: `Fix Rejected with Proof Photo! Reason: "${disputeReason}". Gemini Vision AI re-opened ticket with HIGH priority penalty.`,
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return comp;
    }));

    setSelectedTicket(null);
    setDisputeReason('');
    setDisputePhoto('');
  };

  // Filter My Tickets vs Public Area Complaints with Search & Status filters
  const userEmail = userAuth ? userAuth.email : 'citizen@example.com';

  const filterItems = (list) => {
    return list.filter(item => {
      const matchesSearch = (item.titleTa + item.titleEn + item.ward + item.id).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  };

  const myTickets = filterItems(complaints.filter(c => c.reporterEmail === userEmail || c.reporterName.includes('Citizen')));
  const publicComplaints = filterItems(complaints);

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', padding: '10px' }}>
      {/* Top Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('raise')}
          className={`glass-btn ${activeTab === 'raise' ? 'glass-btn-primary' : ''}`}
          style={{ flex: 1, justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
        >
          <Sparkles size={18} />
          <span>{lang === 'ta' ? 'புகார் பதிவு செய்ய (Raise Complaint)' : 'Raise Complaint'}</span>
        </button>

        <button
          onClick={() => setActiveTab('review')}
          className={`glass-btn ${activeTab === 'review' ? 'glass-btn-primary' : ''}`}
          style={{ flex: 1, justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
        >
          <Eye size={18} />
          <span>{lang === 'ta' ? 'மதிப்பாய்வு & நேரலை நிலை (Review & Progress Page)' : 'Review & Tracking Page'}</span>
        </button>
      </div>

      {feedback && (
        <div className="glass-panel" style={{
          padding: '14px 20px',
          marginBottom: '20px',
          borderColor: feedback.type === 'success' ? '#10b981' : feedback.type === 'merged' ? '#f59e0b' : '#ef4444',
          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : feedback.type === 'merged' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {feedback.type === 'error' ? <AlertTriangle color="#ef4444" /> : <CheckCircle2 color={feedback.type === 'success' ? '#10b981' : '#f59e0b'} />}
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{feedback.text}</span>
          </div>
        </div>
      )}

      {activeTab === 'raise' ? (
        <form onSubmit={handleSubmitAppReport} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <VoiceRecorder lang={lang} onTranscriptionComplete={(data) => setVoiceData(data)} />

          <PhotoLocationPicker
            lang={lang}
            location={location}
            setLocation={setLocation}
            photoUrl={photoUrl}
            setPhotoUrl={setPhotoUrl}
          />

          <div className="glass-panel" style={{ padding: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>
              {lang === 'ta' ? 'புகார் உரை விவரம் (விருப்பப்பட்டால்):' : 'Short Text Description (Regional Language or Preferred):'}
            </label>
            <textarea
              className="glass-input"
              rows={3}
              placeholder={lang === 'ta' ? 'எடுத்துக்காட்டு: சாலையில் பெரிய பள்ளம் உள்ளது...' : 'e.g. Deep pothole on main road...'}
              value={textDescription}
              onChange={(e) => setTextDescription(e.target.value)}
            />
          </div>

          <button type="submit" className="glass-btn glass-btn-primary" style={{ padding: '16px', justifyContent: 'center', fontSize: '1.05rem' }}>
            <Send size={20} />
            <span>{isOffline ? (lang === 'ta' ? 'ஆஃப்லைனில் சேமி' : 'Save Complaint Offline') : (lang === 'ta' ? 'புகாரைச் சமர்ப்பி' : 'Submit Complaint to AI Engine')}</span>
          </button>
        </form>
      ) : (
        /* REVIEW & TRACKING PAGE WITH SEARCH & FILTER BAR */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Search & Filter Bar */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="glass-input"
                style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
                placeholder={lang === 'ta' ? 'புகார் ID அல்லது இடம் தேடுக...' : 'Search Ticket ID or Ward location...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} color="var(--text-muted)" />
              <select
                className="glass-input"
                style={{ fontSize: '0.85rem', width: 'auto' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL" style={{ background: '#0f172a' }}>{lang === 'ta' ? 'அனைத்து நிலைகளும்' : 'All Statuses'}</option>
                <option value="OPEN" style={{ background: '#0f172a' }}>{lang === 'ta' ? 'நிலுவையில் உள்ளவை (OPEN)' : 'OPEN'}</option>
                <option value="PENDING_CONFIRMATION" style={{ background: '#0f172a' }}>{lang === 'ta' ? 'ஒப்புதலுக்கு காத்திருப்பவை' : 'PENDING_CONFIRMATION'}</option>
                <option value="RESOLVED" style={{ background: '#0f172a' }}>{lang === 'ta' ? 'நிறைவடைந்தவை (RESOLVED)' : 'RESOLVED'}</option>
              </select>
            </div>
          </div>

          {/* Section 1: My Raised Tickets */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
              <ShieldCheck size={20} />
              <span>{lang === 'ta' ? 'நான் பதிவிட்ட புகார்கள் (My Raised Tickets)' : 'My Raised Tickets'}</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
              {myTickets.length === 0 ? (
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                  {lang === 'ta' ? 'புகார்கள் எதுவும் பெறப்படவில்லை.' : 'No matching complaints found.'}
                </div>
              ) : (
                myTickets.map(item => (
                  <div key={item.id} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>{item.id}</span>
                        <span className={`badge ${item.status === 'RESOLVED' ? 'badge-low' : item.status === 'PENDING_CONFIRMATION' ? 'badge-medium' : 'badge-high'}`}>
                          {item.status}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px' }}>
                        {lang === 'ta' ? item.titleTa : item.titleEn}
                      </h4>

                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {item.ward}</p>
                    </div>

                    <button
                      onClick={() => setSelectedTicket(item)}
                      className="glass-btn glass-btn-primary"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', marginTop: '12px' }}
                    >
                      <Eye size={14} />
                      <span>{lang === 'ta' ? 'நிலை & ஒப்புதல் விவரம்' : 'Track Progress & Approve'}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 2: Public Complaints in Area */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
              <MapPin size={20} />
              <span>{lang === 'ta' ? 'இப்பகுதியின் பொதுப் புகார்கள் (Public Complaints in this Area)' : 'Public Complaints in this Area'}</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
              {publicComplaints.map(item => {
                const is15DaySlaFallbackActive = item.status === 'PENDING_CONFIRMATION';

                return (
                  <div key={item.id} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{item.id}</span>
                        <span className={`badge ${item.status === 'RESOLVED' ? 'badge-low' : item.status === 'PENDING_CONFIRMATION' ? 'badge-medium' : 'badge-high'}`}>
                          {item.status}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px' }}>
                        {lang === 'ta' ? item.titleTa : item.titleEn}
                      </h4>

                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {item.ward}</p>

                      {is15DaySlaFallbackActive && (
                        <div style={{ fontSize: '0.7rem', color: '#fcd34d', marginTop: '6px', fontWeight: 600 }}>
                          ⏱️ {lang === 'ta' ? '15 நாட்கள் கடந்ததால் பொது மக்கள் ஒப்புதலுக்குக் கிடைக்கிறது!' : '15-Day Unapproved Fallback: Open for Public Community Approval!'}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedTicket(item)}
                      className="glass-btn"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', marginTop: '12px' }}
                    >
                      <Eye size={14} />
                      <span>{lang === 'ta' ? 'பொது விவரம் காண்க' : 'Inspect Public Progress'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedTicket && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '620px', width: '100%', padding: '26px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Ticket ID: {selectedTicket.id}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>
                  {lang === 'ta' ? selectedTicket.titleTa : selectedTicket.titleEn}
                </h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="glass-btn" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>✕</button>
            </div>

            {/* Before / After Proof Comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  📸 1. Original Defect Photo:
                </span>
                <img src={selectedTicket.photoUrl} alt="Before" style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  ✅ 2. Officer Fix Proof Photo:
                </span>
                {selectedTicket.afterPhotoUrl ? (
                  <img src={selectedTicket.afterPhotoUrl} alt="After" style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #10b981' }} />
                ) : (
                  <div style={{ height: '130px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Fix Proof Not Uploaded Yet
                  </div>
                )}
              </div>
            </div>

            {/* Approval / Rejection Controls */}
            {selectedTicket.status === 'PENDING_CONFIRMATION' && (
              <div style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#fcd34d', marginBottom: '10px', fontWeight: 700 }}>
                  ❓ {lang === 'ta' ? 'பழுதுநீக்க ஒப்புதல் அளிப்பு / நிராகரிப்பு:' : 'Approve or Reject Resolution Proof:'}
                </h4>

                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="Proof Photo URL (e.g. https://...)"
                    value={disputePhoto}
                    onChange={(e) => setDisputePhoto(e.target.value)}
                    style={{ marginBottom: '8px', fontSize: '0.8rem' }}
                  />
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="Reason for rejection (e.g. Pothole still open)..."
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleRejectFix(selectedTicket.id)}
                    className="glass-btn glass-btn-danger"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                  >
                    <ThumbsDown size={14} />
                    <span>{lang === 'ta' ? 'நிராகரி (Reject with Proof)' : 'Reject with Proof'}</span>
                  </button>

                  <button
                    onClick={() => handleReporterApprove(selectedTicket.id)}
                    className="glass-btn glass-btn-primary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                  >
                    <ThumbsUp size={14} />
                    <span>{lang === 'ta' ? 'புகாரளித்தவர் ஒப்புதல்' : 'Reporter Approve'}</span>
                  </button>

                  <button
                    onClick={() => handlePublicApprove(selectedTicket.id)}
                    className="glass-btn"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', borderColor: '#f59e0b', color: '#fcd34d' }}
                  >
                    <UserCheck size={14} />
                    <span>{lang === 'ta' ? 'பொதுமக்கள் 15-நாள் ஒப்புதல்' : '15-Day Public Fallback Approve'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
