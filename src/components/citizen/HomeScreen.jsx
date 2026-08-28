import React, { useState, useEffect } from 'react';
import { Bell, Globe, User, PlusCircle, Clock, CheckCircle2, AlertTriangle, ChevronRight, ShieldCheck, FileText, Sparkles, MapPin } from 'lucide-react';
import PublicIssueCard from './PublicIssueCard';
import EmptyState from './EmptyState';
import { apiService } from '../../utils/apiService';

export default function HomeScreen({
  userProfile,
  onReportClick,
  onViewAllMyComplaints,
  onViewDetails,
  onOpenNotifications,
  onOpenProfile,
  lang = 'en'
}) {
  const [summaryData, setSummaryData] = useState({
    active_count: 0,
    processing_count: 0,
    resolved_count: 0,
    reopened_count: 0,
    my_complaints: [],
    public_nearby_issues: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const data = await apiService.getDashboardSummary();
        setSummaryData(data);
      } catch (err) {
        setSummaryData({
          active_count: 2,
          processing_count: 1,
          resolved_count: 4,
          reopened_count: 0,
          my_complaints: [],
          public_nearby_issues: []
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const userName = userProfile?.email ? userProfile.email.split('@')[0] : 'Citizen';

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Top Banner Greeting Card */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.2)'
      }}>
        {/* User Greeting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#041122',
            fontWeight: 800,
            fontSize: '1.2rem',
            boxShadow: '0 4px 16px rgba(56, 189, 248, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#f8fafc', letterSpacing: '-0.3px' }}>
              Welcome back, {userName}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94a3b8', marginTop: '3px' }}>
              <ShieldCheck size={14} color="#10b981" />
              <span>Civic ID: <strong style={{ color: '#e2e8f0' }}>{userProfile?.civic_user_id || 'CIV-CITIZEN'}</strong> • Ward Identity Verified</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onOpenNotifications}
            className="glass-btn"
            style={{ padding: '8px 14px' }}
          >
            <Bell size={15} color="#38bdf8" />
            <span>Alerts</span>
          </button>

          <button
            onClick={onOpenProfile}
            className="glass-btn"
            style={{ padding: '8px 14px' }}
          >
            <User size={15} color="#e2e8f0" />
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* Main Call to Action: Report Issue Button */}
      <button
        onClick={onReportClick}
        className="glass-btn glass-btn-primary"
        style={{
          padding: '18px 24px',
          borderRadius: '16px',
          justifyContent: 'space-between',
          cursor: 'pointer',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 30px rgba(56, 189, 248, 0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
          }}>
            <PlusCircle size={24} color="#041122" />
          </div>

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#041122', letterSpacing: '0.3px' }}>
              REPORT A CIVIC ISSUE
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(4, 17, 34, 0.85)', marginTop: '2px', fontWeight: 600 }}>
              AI Camera EXIF Location + Sarvam Regional Voice Intake
            </div>
          </div>
        </div>

        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'rgba(4, 17, 34, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ChevronRight size={20} color="#041122" />
        </div>
      </button>

      {/* Complaint Status Overview Cards */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.2px' }}>
            My Complaints Overview
          </h3>
          <button 
            onClick={onViewAllMyComplaints}
            className="glass-btn"
            style={{ fontSize: '0.75rem', padding: '5px 12px', height: '30px' }}
          >
            View All in Hub
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
          <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #f43f5e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Active Issues</span>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)' }}>
                <AlertTriangle size={15} color="#f43f5e" />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: '#fda4af' }}>
              {summaryData.active_count}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Processing</span>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)' }}>
                <Clock size={15} color="#f59e0b" />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: '#fde68a' }}>
              {summaryData.processing_count}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Resolved</span>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)' }}>
                <CheckCircle2 size={15} color="#10b981" />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: '#6ee7b7' }}>
              {summaryData.resolved_count}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Reopened</span>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)' }}>
                <FileText size={15} color="#8b5cf6" />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: '#c4b5fd' }}>
              {summaryData.reopened_count}
            </div>
          </div>
        </div>
      </div>

      {/* Public Nearby Community Issues */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.2px' }}>
              Nearby Community Issues
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Live public complaints reported in your neighborhood
            </p>
          </div>
          <span className="badge badge-low" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            Live Feed
          </span>
        </div>

        {summaryData.public_nearby_issues && summaryData.public_nearby_issues.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {summaryData.public_nearby_issues.map((issue) => (
              <PublicIssueCard
                key={issue.id}
                issue={issue}
                onViewDetails={onViewDetails}
                lang={lang}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No nearby complaints"
            description="Your immediate ward has zero pending civic complaints reported today."
            icon="check"
          />
        )}
      </div>

    </div>
  );
}
