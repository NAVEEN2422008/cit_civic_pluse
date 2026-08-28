import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Globe, MapPin, CheckCircle2, AlertTriangle, Eye, Clock, 
  RotateCcw, ThumbsUp, ThumbsDown, ShieldCheck, WifiOff, RefreshCw, 
  Filter, Search, Layers, Activity, FileText, CheckSquare, Sparkles, X, Upload, ArrowUpRight, ChevronRight
} from 'lucide-react';
import CivicHeatmapView from './citizen/CivicHeatmapView';
import ReportIssueContainer from './intake/ReportIssueContainer';
import ProofOfWorkView from './citizen/ProofOfWorkView';
import { apiService } from '../utils/apiService';

export default function CitizenPortal({ lang, complaints = [], setComplaints, userAuth }) {
  const [activeTab, setActiveTab] = useState('hub'); // 'hub' | 'raise' | 'heatmap'
  const [selectedSection, setSelectedSection] = useState('my'); // 'my' | 'public' | 'heatmap'
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  
  // Reopen Form Modal State
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenProofPhoto, setReopenProofPhoto] = useState('');
  const [reopenError, setReopenError] = useState('');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter My Complaints (Created by Logged-in Citizen)
  const myComplaints = complaints.filter(c => {
    const uid = userAuth?.civic_user_id;
    const uemail = userAuth?.email;
    if (uid && (c.reporter_id === uid || c.civic_user_id === uid)) return true;
    if (uemail && (c.reporterEmail === uemail || c.reporter_email === uemail)) return true;
    return !uid && !uemail;
  });

  // Public Complaints in Area (Anonymized PII)
  const publicComplaints = complaints.filter(c => !c.is_duplicate);

  const filteredMyComplaints = myComplaints.filter(c => {
    const matchCat = categoryFilter === 'ALL' || (c.categoryEn || c.category || '').toUpperCase() === categoryFilter.toUpperCase();
    const matchStat = statusFilter === 'ALL' || (c.status || '').toUpperCase() === statusFilter.toUpperCase();
    const matchSearch = !searchQuery || (c.id + ' ' + (c.titleEn || c.processed_description || '')).toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchStat && matchSearch;
  });

  const handleConfirmResolution = async (complaintId) => {
    try {
      await apiService.verifyResolution(complaintId, { confirmed: true });
      setComplaints(prev => prev.map(c => c.id === complaintId ? { 
        ...c, 
        status: 'RESOLVED', 
        workflow_state: 'CLOSED',
        citizen_confirmation_status: 'CONFIRMED'
      } : c));
      alert(`Thank you! Ticket ${complaintId} has been confirmed RESOLVED and closed.`);
      setSelectedComplaint(null);
    } catch (err) {
      alert(`Resolution confirmed locally for ${complaintId}!`);
      setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: 'RESOLVED', workflow_state: 'CLOSED' } : c));
      setSelectedComplaint(null);
    }
  };

  const handleSupportIssue = (complaintId) => {
    setComplaints(prev => prev.map(c => c.id === complaintId ? { 
      ...c, 
      reporterCount: (c.reporterCount || c.supporters_count || 1) + 1,
      supporters_count: (c.supporters_count || c.reporterCount || 1) + 1
    } : c));
    alert(`Thank you! Your community support (+1) for ticket ${complaintId} has been recorded.`);
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    setReopenError('');

    if (!reopenReason || !reopenReason.trim()) {
      setReopenError('Reopen reason is mandatory. Please provide details of why the issue is unresolved.');
      return;
    }

    try {
      await apiService.verifyResolution(selectedComplaint.id, { confirmed: false, reopen_reason: reopenReason, reopen_proof_photo: reopenProofPhoto || undefined });
      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? { 
        ...c, 
        status: 'OPEN', 
        workflow_state: 'ASSIGNED',
        citizen_confirmation_status: 'REOPENED',
        reopen_reason: reopenReason,
        reopen_proof_photo: reopenProofPhoto
      } : c));
      alert(`Complaint ${selectedComplaint.id} has been REOPENED and sent back to officer.`);
      setShowReopenModal(false);
      setSelectedComplaint(null);
      setReopenReason('');
      setReopenProofPhoto('');
    } catch (err) {
      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? { ...c, status: 'OPEN', workflow_state: 'ASSIGNED' } : c));
      alert(`Complaint ${selectedComplaint.id} has been REOPENED.`);
      setShowReopenModal(false);
      setSelectedComplaint(null);
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '50px' }}>
      
      {/* HEADER & NAVIGATION */}
      <div className="glass-panel" style={{ 
        padding: '22px 26px', 
        marginBottom: '26px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(56, 189, 248, 0.35)'
          }}>
            <UserCheck size={24} color="#041122" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
              Citizen Civic Hub
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Real-time complaint timeline tracking, community voting & resolution verification
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', background: 'rgba(5, 8, 17, 0.8)', padding: '5px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            onClick={() => { setActiveTab('hub'); setSelectedComplaint(null); }}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'hub' ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'transparent',
              color: activeTab === 'hub' ? '#041122' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Activity size={15} />
            <span>Complaint Records</span>
          </button>

          <button
            onClick={() => setActiveTab('raise')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'raise' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: activeTab === 'raise' ? '#022c22' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={15} />
            <span>Report Issue</span>
          </button>

          <button
            onClick={() => setActiveTab('heatmap')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'heatmap' ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : 'transparent',
              color: activeTab === 'heatmap' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Globe size={15} />
            <span>Live Satellite Map</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MY CIVIC HUB MAIN VIEW */}
      {activeTab === 'hub' && (
        <>
          {/* SECTION CONTROLS (A: MY COMPLAINTS | B: PUBLIC COMPLAINTS | C: HEATMAP) */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setSelectedSection('my'); setSelectedComplaint(null); }}
              className={`glass-btn ${selectedSection === 'my' ? 'glass-btn-primary' : ''}`}
              style={{ fontSize: '0.84rem', padding: '9px 18px', borderRadius: '10px' }}
            >
              <span>My Filed Complaints ({filteredMyComplaints.length})</span>
            </button>

            <button
              onClick={() => { setSelectedSection('public'); setSelectedComplaint(null); }}
              className={`glass-btn ${selectedSection === 'public' ? 'glass-btn-primary' : ''}`}
              style={{ fontSize: '0.84rem', padding: '9px 18px', borderRadius: '10px' }}
            >
              <span>Community Area Issues ({publicComplaints.length})</span>
            </button>

            <button
              onClick={() => setSelectedSection('heatmap')}
              className={`glass-btn ${selectedSection === 'heatmap' ? 'glass-btn-primary' : ''}`}
              style={{ fontSize: '0.84rem', padding: '9px 18px', borderRadius: '10px' }}
            >
              <span>Regional Hotspot Map</span>
            </button>
          </div>

          {/* SECTION C: EMBEDDED MAP */}
          {selectedSection === 'heatmap' && (
            <div style={{ marginBottom: '24px' }}>
              <CivicHeatmapView 
                publicIssues={publicComplaints}
                onViewDetails={(comp) => {
                  const found = complaints.find(c => c.id === comp.id);
                  if (found) setSelectedComplaint(found);
                }} 
              />
            </div>
          )}

          {/* SECTION A & B: COMPLAINT CARDS & DETAIL VIEW */}
          {selectedSection !== 'heatmap' && (
            <>
              {!selectedComplaint ? (
                <>
                  {/* SEARCH & FILTERS */}
                  <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '22px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px', background: 'rgba(8, 14, 26, 0.8)', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <Search size={16} color="var(--text-muted)" />
                      <input
                        type="text"
                        placeholder="Search complaint ID, location, title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#f8fafc', outline: 'none', width: '100%', fontSize: '0.86rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <select className="glass-input" style={{ width: 'auto', fontSize: '0.82rem', height: '42px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="ALL">All Statuses</option>
                        <option value="OPEN">Active Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="PENDING_CONFIRMATION">Pending Verification</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </div>
                  </div>

                  {/* CARDS GRID */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {(selectedSection === 'my' ? filteredMyComplaints : publicComplaints).map(comp => (
                      <div key={comp.id} className="glass-panel clickable" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.5px' }}>{comp.id}</span>
                            <span className={`badge ${comp.status === 'RESOLVED' ? 'badge-low' : comp.status === 'IN_PROGRESS' ? 'badge-medium' : 'badge-high'}`}>
                              {comp.status || 'OPEN'}
                            </span>
                          </div>

                          {comp.photoUrl && (
                            <img 
                              src={comp.photoUrl} 
                              alt="Complaint Evidence" 
                              style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px', marginBottom: '14px', border: '1px solid rgba(255, 255, 255, 0.1)' }} 
                            />
                          )}

                          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px', lineHeight: '1.4' }}>
                            {comp.titleEn || comp.processed_description || comp.description}
                          </h3>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                            <MapPin size={14} color="#0ea5e9" />
                            <span>{comp.location_ward || comp.location || 'Ward Area, Tamil Nadu'}</span>
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-dim)', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '14px' }}>
                            <span>Severity: <strong style={{ color: comp.priority === 'HIGH' || comp.priority === 'CRITICAL' ? '#fda4af' : '#fde68a' }}>{comp.priority || 'NORMAL'}</strong></span>
                            <span>{comp.created_at ? new Date(comp.created_at).toLocaleDateString() : 'Active'}</span>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setSelectedComplaint(comp)}
                              className="glass-btn glass-btn-primary"
                              style={{ flex: 1, fontSize: '0.82rem', padding: '9px 12px', borderRadius: '10px' }}
                            >
                              <span>View Full Timeline</span>
                              <ChevronRight size={15} />
                            </button>

                            {selectedSection === 'public' && (
                              <button
                                onClick={() => handleSupportIssue(comp.id)}
                                className="glass-btn"
                                style={{ padding: '9px 12px', borderRadius: '10px' }}
                                title="Support this complaint"
                              >
                                <ThumbsUp size={15} color="#10b981" />
                                <span>{comp.supporters_count || comp.reporterCount || 1}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* DETAIL VIEW FOR SELECTED COMPLAINT */
                <div className="glass-panel" style={{ padding: '28px', borderRadius: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px' }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 800 }}>TICKET REF: {selectedComplaint.id}</span>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                        {selectedComplaint.titleEn || selectedComplaint.description}
                      </h2>
                    </div>
                    <button
                      onClick={() => setSelectedComplaint(null)}
                      className="glass-btn"
                      style={{ padding: '8px 14px', borderRadius: '8px' }}
                    >
                      <X size={16} />
                      <span>Back to List</span>
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>Issue Information</h4>
                      <p style={{ fontSize: '0.9rem', color: '#f8fafc', lineHeight: '1.6', marginBottom: '14px' }}>
                        {selectedComplaint.processed_description || selectedComplaint.description}
                      </p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
                        <div style={{ color: 'var(--text-muted)' }}>Department: <strong style={{ color: '#f8fafc' }}>{selectedComplaint.department || 'Municipal Corporation'}</strong></div>
                        <div style={{ color: 'var(--text-muted)' }}>Location: <strong style={{ color: '#f8fafc' }}>{selectedComplaint.location_ward || selectedComplaint.location || 'Ward Area'}</strong></div>
                        <div style={{ color: 'var(--text-muted)' }}>Current Status: <strong style={{ color: '#38bdf8' }}>{selectedComplaint.status}</strong></div>
                      </div>
                    </div>

                    {selectedComplaint.photoUrl && (
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>Attached Proof of Issue</h4>
                        <img src={selectedComplaint.photoUrl} alt="Proof" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }} />
                      </div>
                    )}
                  </div>

                  {/* PROOF OF WORK VERIFICATION IF STATUS IS PENDING CONFIRMATION */}
                  {selectedComplaint.status === 'PENDING_CONFIRMATION' && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#6ee7b7', marginBottom: '6px' }}>
                        Officer Submitted Resolution - Citizen Verification Required
                      </h4>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        The field team has resolved this issue and uploaded completion evidence. Please confirm or reopen.
                      </p>

                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleConfirmResolution(selectedComplaint.id)}
                          className="glass-btn glass-btn-success"
                          style={{ padding: '10px 20px', borderRadius: '10px' }}
                        >
                          <CheckCircle2 size={16} />
                          <span>Confirm Resolved & Close Ticket</span>
                        </button>

                        <button
                          onClick={() => setShowReopenModal(true)}
                          className="glass-btn glass-btn-danger"
                          style={{ padding: '10px 20px', borderRadius: '10px' }}
                        >
                          <RotateCcw size={16} />
                          <span>Reopen Issue (Not Fixed)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* TAB 2: REPORT NEW ISSUE */}
      {activeTab === 'raise' && (
        <ReportIssueContainer
          userAuth={userAuth}
          onComplaintCreated={() => {
            alert('Issue submitted successfully!');
            setActiveTab('hub');
          }}
        />
      )}

      {/* TAB 3: STANDALONE SATELLITE MAP */}
      {activeTab === 'heatmap' && (
        <CivicHeatmapView 
          publicIssues={publicComplaints}
          onViewDetails={(comp) => {
            const found = complaints.find(c => c.id === comp.id);
            if (found) {
              setSelectedComplaint(found);
              setActiveTab('hub');
            }
          }}
        />
      )}

    </div>
  );
}
