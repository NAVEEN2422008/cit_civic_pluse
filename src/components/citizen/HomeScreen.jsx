import React, { useState, useEffect } from 'react';
import {
  Bell, User, PlusCircle, Clock, CheckCircle2, AlertTriangle,
  ChevronRight, ShieldCheck, Sparkles, MapPin, FileText, Mic,
  Camera, TrendingUp, Activity, ChevronDown, ArrowUpRight, Eye,
  MessageSquare, Award
} from 'lucide-react';
import PublicIssueCard from './PublicIssueCard';
import EmptyState from './EmptyState';
import { apiService } from '../../utils/apiService';

const KolamSVG = ({ size = 60, opacity = 0.1 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" strokeWidth="0.6" fill="none">
      <circle cx="30" cy="30" r="26" />
      <circle cx="30" cy="30" r="18" />
      <circle cx="30" cy="30" r="10" />
      <circle cx="30" cy="30" r="3" fill="currentColor" />
    </g>
  </svg>
);

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
    active_count: 2, processing_count: 1, resolved_count: 4, reopened_count: 0,
    my_complaints: [], public_nearby_issues: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const data = await apiService.getDashboardSummary();
        setSummaryData(data);
      } catch {
        setSummaryData({ active_count: 2, processing_count: 1, resolved_count: 4, reopened_count: 0, my_complaints: [], public_nearby_issues: [] });
      } finally { setLoading(false); }
    };
    fetchDashboard();
  }, []);

  const userName = userProfile?.email ? userProfile.email.split('@')[0] : 'Citizen';
  const firstName = userName.charAt(0).toUpperCase() + userName.slice(1);

  const stats = [
    { key: 'active', icon: AlertTriangle, v: summaryData.active_count, l: 'Active', sub: 'being worked on', color: 'var(--danger)', bg: '#fff1f2' },
    { key: 'processing', icon: Clock, v: summaryData.processing_count, l: 'In progress', sub: 'officer assigned', color: 'var(--amber-500)', bg: 'var(--amber-50)' },
    { key: 'resolved', icon: CheckCircle2, v: summaryData.resolved_count, l: 'Resolved', sub: 'you verified', color: 'var(--green-500)', bg: 'var(--green-50)' },
    { key: 'reopened', icon: FileText, v: summaryData.reopened_count, l: 'Reopened', sub: 'needs more work', color: 'var(--info)', bg: 'var(--info-bg)' },
  ];

  return (
    <div className="container" style={{ padding: 'var(--sp-6) var(--sp-4) 120px', maxWidth: 1200 }}>

      {/* === MASTHEAD === */}
      <div className="reveal d-0" style={{
        background: 'var(--ink)', color: 'var(--ink-inverse)',
        borderRadius: 'var(--r-2xl)', padding: 'var(--sp-8)',
        marginBottom: 'var(--sp-6)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 20, right: 20, opacity: 0.08 }}>
          <KolamSVG size={140} opacity={1} />
        </div>
        <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--sp-6)', alignItems: 'center' }}>
          <div>
            <div className="label-sm" style={{ color: '#fbd77a', marginBottom: 'var(--sp-3)' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#86efac', marginRight: 8, verticalAlign: 'middle' }}></span>
              Signed in · {userProfile?.civic_user_id || 'CIV-CITIZEN'}
            </div>
            <h1 className="display-md" style={{ color: 'var(--ink-inverse)', marginBottom: 'var(--sp-2)' }}>
              Vanakkam, <span className="editorial" style={{ color: '#fbd77a' }}>{firstName}.</span>
            </h1>
            <p style={{ color: 'var(--ink-faint)', maxWidth: '500px' }}>
              Your city is moving. See what's happening around you, and report
              what needs fixing.
            </p>
          </div>
          <div className="flex gap-2 hide-mobile">
            <button onClick={onOpenNotifications} className="btn btn-white btn-icon" aria-label="Notifications">
              <Bell size={16} />
            </button>
            <button onClick={onOpenProfile} className="btn btn-white btn-icon" aria-label="Profile">
              <User size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* === PRIMARY CTA — Report === */}
      <button onClick={onReportClick}
        className="reveal d-1"
        style={{
          width: '100%', display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--sp-6)',
          alignItems: 'center', padding: 'var(--sp-6) var(--sp-8)',
          background: 'linear-gradient(135deg, var(--green-500), var(--green-700))',
          color: '#fff', border: 'none', borderRadius: 'var(--r-xl)',
          boxShadow: '0 12px 32px rgba(12,74,62,.3)', cursor: 'pointer',
          marginBottom: 'var(--sp-6)', textAlign: 'left', transition: 'all .2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 20px 44px rgba(12,74,62,.4)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 12px 32px rgba(12,74,62,.3)'; }}
      >
        <div>
          <div className="label-sm" style={{ color: 'rgba(253,252,249,.7)', marginBottom: '8px' }}>
            <Sparkles size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> ONE-TAP REPORT
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 3vw, 1.75rem)', fontWeight: 800, letterSpacing: '-.02em', marginBottom: '4px' }}>
            See something broken?
          </div>
          <div style={{ fontSize: '.85rem', color: 'rgba(253,252,249,.85)' }}>
            Voice · Photo · GPS — under a minute
          </div>
        </div>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--r-full)',
          background: 'rgba(255,255,255,.15)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <PlusCircle size={28} color="#fff" />
        </div>
      </button>

      {/* === QUICK ACTIONS === */}
      <div className="grid-4 reveal d-2" style={{ marginBottom: 'var(--sp-6)' }}>
        {[
          { icon: Mic, label: 'Voice', color: 'var(--green-500)' },
          { icon: Camera, label: 'Photo', color: 'var(--terra-400)' },
          { icon: MapPin, label: 'GPS', color: 'var(--amber-500)' },
          { icon: MessageSquare, label: 'Text', color: 'var(--info)' },
        ].map((a, i) => {
          const Icon = a.icon;
          return (
            <button key={i} onClick={onReportClick} className="card"
              style={{ padding: 'var(--sp-4)', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--r-md)',
                background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} color={a.color} />
              </div>
              <span className="bold body-xs" style={{ color: 'var(--ink-2)' }}>{a.label}</span>
            </button>
          );
        })}
      </div>

      {/* === STATS GRID === */}
      <div className="reveal d-3" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--sp-4)' }}>
          <div>
            <h2 className="display-sm" style={{ marginBottom: '4px' }}>Your impact, at a glance.</h2>
            <p className="body-xs" style={{ color: 'var(--ink-muted)' }}>All your reports, past and present.</p>
          </div>
          <button onClick={onViewAllMyComplaints} className="btn btn-ghost btn-sm">
            View all <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="card card-hover" style={{ padding: 'var(--sp-5)' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 'var(--sp-3)' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--r-md)',
                    background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={18} color={s.color} />
                  </div>
                </div>
                {loading ? (
                  <div className="shimmer" style={{ height: 32, width: 60, marginBottom: 6 }}></div>
                ) : (
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800,
                    color: s.color, lineHeight: 1, letterSpacing: '-.02em',
                  }}>{s.v}</div>
                )}
                <div className="bold body-sm" style={{ marginTop: 6, color: 'var(--ink)' }}>{s.l}</div>
                <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>{s.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* === ACHIEVEMENT BANNER === */}
      <div className="reveal d-4" style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 'var(--sp-5)',
        alignItems: 'center', padding: 'var(--sp-5) var(--sp-6)',
        background: 'var(--amber-50)', border: '1px solid var(--amber-100)',
        borderRadius: 'var(--r-lg)', marginBottom: 'var(--sp-6)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--r-md)',
          background: 'var(--amber-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Award size={22} color="var(--ink)" />
        </div>
        <div>
          <div className="bold body-sm" style={{ color: 'var(--ink)' }}>You're in the top 12% of reporters in your ward.</div>
          <div className="body-xs" style={{ color: 'var(--ink-3)' }}>4 reports verified and resolved. Keep going.</div>
        </div>
        <ChevronRight size={18} color="var(--ink-3)" />
      </div>

      {/* === NEARBY ISSUES === */}
      <div className="reveal d-5">
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--sp-4)' }}>
          <div>
            <div className="section-label">Live from your ward</div>
            <h2 className="display-sm">Community issues nearby</h2>
          </div>
          <div className="live-badge" style={{ alignItems: 'center' }}>
            <span className="live-dot"></span>
            <span>Live</span>
          </div>
        </div>

        {summaryData.public_nearby_issues && summaryData.public_nearby_issues.length > 0 ? (
          <div className="grid-auto" style={{ display: 'grid', gap: 'var(--sp-4)' }}>
            {summaryData.public_nearby_issues.map((issue) => (
              <PublicIssueCard key={issue.id} issue={issue} onViewDetails={onViewDetails} lang={lang} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Your ward is squeaky clean"
            description="No public complaints reported nearby today. Either everything works (rare) or you should be the first to spot something."
            actionText="Report an issue"
            onAction={onReportClick}
          />
        )}
      </div>
    </div>
  );
}