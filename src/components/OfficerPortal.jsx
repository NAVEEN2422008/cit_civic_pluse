import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, ListChecks, Satellite, Bell, User, LogOut,
  AlertTriangle, Clock, CheckCircle2, TrendingUp, Activity,
  ChevronRight, MapPin, Filter, Search, ArrowUpRight, Phone,
  Mail, Building2, ChevronDown, Eye, Edit3, Send, MoreHorizontal,
  X, RefreshCw, Layers, BarChart3, Users, Zap
} from 'lucide-react';
import { apiService } from '../utils/apiService';

const KolamSVG = ({ size = 100, opacity = 0.06, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
    <g stroke={color} strokeWidth="0.6" fill="none">
      <circle cx="50" cy="50" r="46" />
      <circle cx="50" cy="50" r="34" />
      <circle cx="50" cy="50" r="22" />
      <circle cx="50" cy="50" r="10" />
    </g>
  </svg>
);

export default function OfficerPortal({ officer, onLogout, onOpenProfile }) {
  const [tab, setTab] = useState('dashboard');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [satellite, setSatellite] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const list = await apiService.getOfficerIssues();
        setIssues(list || []);
      } catch {
        setIssues([
          { id: 'TN-2026-8801', title: 'Streetlight not working, Sector 4', category: 'Electricity', severity: 'high', status: 'OPEN', created_at: '2026-08-28T08:30:00Z', location: 'Ward 64, Coimbatore', description: 'Streetlight near bus stop has been off for 3 days, causing safety concerns at night.' },
          { id: 'TN-2026-8802', title: 'Pothole on main road, T. Nagar', category: 'Roads', severity: 'critical', status: 'PROCESSING', created_at: '2026-08-28T07:15:00Z', location: 'T. Nagar, Chennai', description: 'Large pothole causing traffic disruption near the bus terminus.' },
          { id: 'TN-2026-8803', title: 'Garbage overflow at junction', category: 'Sanitation', severity: 'medium', status: 'PROCESSING', created_at: '2026-08-28T05:45:00Z', location: 'Ward 12, Madurai', description: 'Municipal bins overflowing, attracting stray dogs and causing hygiene issues.' },
          { id: 'TN-2026-8804', title: 'Broken footpath slab', category: 'Roads', severity: 'low', status: 'PENDING_CONFIRMATION', created_at: '2026-08-27T18:20:00Z', location: 'Sector 9, Trichy', description: 'Footpath slab raised and unsafe for pedestrians.' },
          { id: 'TN-2026-8805', title: 'Water supply disruption', category: 'Water', severity: 'high', status: 'OPEN', created_at: '2026-08-27T14:00:00Z', location: 'RS Puram, Coimbatore', description: 'No water supply in the area since yesterday morning.' },
          { id: 'TN-2026-8806', title: 'Illegal parking blocking lane', category: 'Traffic', severity: 'medium', status: 'RESOLVED', created_at: '2026-08-26T11:00:00Z', location: 'Anna Nagar, Chennai', description: 'Cars blocking the service lane, preventing emergency vehicle access.' },
        ]);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const counts = {
    total: issues.length,
    critical: issues.filter(i => i.severity === 'critical').length,
    open: issues.filter(i => i.status === 'OPEN').length,
    processing: issues.filter(i => i.status === 'PROCESSING').length,
    resolved: issues.filter(i => i.status === 'RESOLVED').length,
    avgResolution: '4.2h',
  };

  const filtered = issues.filter(i => {
    if (departmentFilter !== 'all' && i.category !== departmentFilter) return false;
    if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
    return true;
  });

  const sevColor = (s) => ({
    critical: { bg: '#fff1f2', fg: 'var(--danger)', label: 'Critical' },
    high:     { bg: '#fff7ed', fg: 'var(--terra-400)', label: 'High' },
    medium:   { bg: 'var(--amber-50)', fg: 'var(--amber-600)', label: 'Medium' },
    low:      { bg: 'var(--green-50)', fg: 'var(--green-500)', label: 'Low' },
  }[s] || { bg: 'var(--bg-alt)', fg: 'var(--ink-muted)', label: s });

  const statusColor = (s) => ({
    OPEN: { bg: 'var(--info-bg)', fg: 'var(--info)' },
    PROCESSING: { bg: 'var(--amber-50)', fg: 'var(--amber-600)' },
    PENDING_CONFIRMATION: { bg: '#f5f3ff', fg: '#7c3aed' },
    RESOLVED: { bg: 'var(--green-50)', fg: 'var(--green-500)' },
  }[s] || { bg: 'var(--bg-alt)', fg: 'var(--ink-muted)' });

  return (
    <div className="officer-shell">

      {/* === SIDEBAR === */}
      <aside className="officer-sidebar">
        <div className="flex items-center gap-3" style={{ padding: '0 var(--sp-5) var(--sp-6)', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--r-md)',
            background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={18} color="#fbd77a" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '.95rem', fontWeight: 800 }}>Officer</div>
            <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>Control room</div>
          </div>
        </div>

        <div style={{ padding: 'var(--sp-5)' }}>
          <div className="label-sm" style={{ marginBottom: 'var(--sp-3)' }}>Navigation</div>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
            { id: 'assigned', label: 'Assigned', icon: ListChecks, count: counts.open + counts.processing },
            { id: 'satellite', label: 'Satellite map', icon: Satellite, count: null },
          ].map(item => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button key={item.id} onClick={() => setTab(item.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 'var(--r-md)', marginBottom: '4px',
                  background: active ? 'var(--green-50)' : 'transparent',
                  color: active ? 'var(--green-600)' : 'var(--ink-2)',
                  border: 'none', cursor: 'pointer', fontSize: '.84rem', fontWeight: 600,
                  transition: 'all .15s',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-alt)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                <span className="flex items-center gap-3">
                  <Icon size={16} />
                  {item.label}
                </span>
                {item.count != null && (
                  <span className="badge" style={{ background: active ? 'var(--green-500)' : 'var(--bg-alt)', color: active ? '#fff' : 'var(--ink-3)' }}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ padding: 'var(--sp-5)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          <div className="label-sm" style={{ marginBottom: 'var(--sp-3)' }}>Your role</div>
          <div className="card" style={{ padding: 'var(--sp-3)', background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
              <div className="avatar avatar-sm" style={{ background: 'var(--amber-400)', color: 'var(--ink)' }}>
                {officer?.name?.[0]?.toUpperCase() || 'O'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="bold body-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {officer?.name || 'Officer'}
                </div>
                <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>{officer?.department || 'General'}</div>
              </div>
            </div>
            <button onClick={onLogout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }}>
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* === MAIN === */}
      <main className="officer-main">

        {/* Top bar */}
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--sp-6)' }}>
          <div>
            <div className="section-label">{tab === 'dashboard' ? 'Overview' : tab === 'assigned' ? 'Your queue' : 'Geographic view'}</div>
            <h1 className="display-md" style={{ fontSize: '1.75rem' }}>
              {tab === 'dashboard' && <>Today across <span className="editorial">{officer?.district || 'Tamil Nadu'}</span></>}
              {tab === 'assigned' && <>Issues in <span className="editorial">your queue</span></>}
              {tab === 'satellite' && <>Live <span className="editorial">satellite</span> view</>}
            </h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.location.reload()} className="btn btn-ghost btn-sm" aria-label="Refresh">
              <RefreshCw size={14} />
            </button>
            <button onClick={onOpenProfile} className="btn btn-secondary btn-sm">
              <User size={14} /> Profile
            </button>
          </div>
        </div>

        {tab === 'dashboard' && (
          <>
            {/* KPI grid */}
            <div className="grid-4" style={{ marginBottom: 'var(--sp-6)' }}>
              {[
                { label: 'Total active', v: counts.open + counts.processing, sub: '+12 today', icon: ListChecks, color: 'var(--green-500)', bg: 'var(--green-50)' },
                { label: 'Critical', v: counts.critical, sub: 'needs immediate', icon: AlertTriangle, color: 'var(--danger)', bg: '#fff1f2' },
                { label: 'Resolved today', v: 23, sub: '+18% vs yesterday', icon: CheckCircle2, color: 'var(--green-700)', bg: 'var(--green-50)' },
                { label: 'Avg resolution', v: counts.avgResolution, sub: 'across departments', icon: Clock, color: 'var(--terra-400)', bg: '#fff7ed' },
              ].map((k, i) => {
                const Icon = k.icon;
                return (
                  <div key={i} className="card card-hover" style={{ padding: 'var(--sp-5)' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--sp-4)' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 'var(--r-md)',
                        background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={18} color={k.color} />
                      </div>
                      <div className="badge badge-green" style={{ background: 'transparent', border: 'none', color: 'var(--green-500)' }}>
                        <TrendingUp size={10} /> {k.sub.split(' ')[0]}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em', color: 'var(--ink)' }}>{k.v}</div>
                    <div className="bold body-sm" style={{ marginTop: 6 }}>{k.label}</div>
                    <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>{k.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Department performance + map preview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 'var(--sp-5)' }} className="dept-grid">

              <div className="card" style={{ padding: 'var(--sp-6)' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--sp-5)' }}>
                  <div>
                    <h3 className="display-sm" style={{ marginBottom: '4px' }}>Department load</h3>
                    <p className="body-xs" style={{ color: 'var(--ink-muted)' }}>Active issues by category</p>
                  </div>
                  <button className="btn btn-ghost btn-sm">Export <ArrowUpRight size={12} /></button>
                </div>
                {[
                  { name: 'Roads & Footpaths', load: 87, count: 142, color: 'var(--terra-400)' },
                  { name: 'Sanitation', load: 74, count: 121, color: 'var(--amber-500)' },
                  { name: 'Water Supply', load: 62, count: 98, color: 'var(--info)' },
                  { name: 'Electricity', load: 51, count: 76, color: 'var(--green-500)' },
                  { name: 'Traffic & Transport', load: 38, count: 54, color: 'var(--ink-3)' },
                ].map((d, i) => (
                  <div key={i} style={{ marginBottom: 'var(--sp-4)' }}>
                    <div className="flex justify-between" style={{ marginBottom: '6px' }}>
                      <span className="bold body-sm">{d.name}</span>
                      <span className="mono body-xs" style={{ color: 'var(--ink-muted)' }}>{d.count} issues</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${d.load}%`, background: d.color }}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'relative', height: 280, background: 'linear-gradient(135deg, #0a6850, #064430)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <KolamSVG size={400} opacity={0.06} color="#fbd77a" />
                  <div style={{ textAlign: 'center', color: 'var(--ink-inverse)', position: 'relative', zIndex: 2 }}>
                    <Satellite size={32} color="#fbd77a" style={{ marginBottom: 8 }} />
                    <div className="bold body-sm" style={{ color: '#fbd77a' }}>LIVE SATELLITE</div>
                    <div className="body-xs" style={{ color: 'var(--ink-faint)' }}>Tap to open full view</div>
                  </div>
                  <button onClick={() => setTab('satellite')}
                    style={{ position: 'absolute', inset: 0, background: 'transparent', border: 'none', cursor: 'pointer' }}
                    aria-label="Open satellite view"></button>
                </div>
                <div style={{ padding: 'var(--sp-5)' }}>
                  <h3 className="display-sm" style={{ marginBottom: '6px' }}>Coimbatore cluster</h3>
                  <p className="body-xs" style={{ color: 'var(--ink-muted)', marginBottom: 'var(--sp-4)' }}>14 issues within 1.2 km of RS Puram market.</p>
                  <button onClick={() => setTab('satellite')} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                    Open satellite map <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'assigned' && (
          <>
            {/* Filters */}
            <div className="card" style={{ padding: 'var(--sp-4)', marginBottom: 'var(--sp-4)', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Filter size={14} color="var(--ink-muted)" />
              <span className="bold body-sm">Filter:</span>
              <select className="input" style={{ width: 'auto', minWidth: 160 }} value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                <option value="all">All departments</option>
                <option value="Roads">Roads</option>
                <option value="Sanitation">Sanitation</option>
                <option value="Water">Water</option>
                <option value="Electricity">Electricity</option>
                <option value="Traffic">Traffic</option>
              </select>
              <select className="input" style={{ width: 'auto', minWidth: 140 }} value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                <option value="all">All severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <span className="body-xs" style={{ color: 'var(--ink-muted)', marginLeft: 'auto' }}>
                Showing {filtered.length} of {issues.length}
              </span>
            </div>

            {/* Issue list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer" style={{ height: 110, borderRadius: 'var(--r-lg)' }}></div>)
              ) : filtered.length === 0 ? (
                <div className="card empty-state">
                  <CheckCircle2 size={36} color="var(--green-500)" style={{ marginBottom: 12 }} />
                  <h3 className="display-sm" style={{ marginBottom: 6 }}>Inbox zero</h3>
                  <p className="body-sm" style={{ color: 'var(--ink-muted)' }}>No issues match the current filters.</p>
                </div>
              ) : filtered.map((issue, i) => {
                const sc = sevColor(issue.severity);
                const stc = statusColor(issue.status);
                return (
                  <div key={issue.id} className={`card card-hover reveal d-${Math.min(i, 5)}`}
                    onClick={() => setSelectedIssue(issue)}
                    style={{ cursor: 'pointer', padding: 'var(--sp-5)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 'var(--sp-4)', alignItems: 'center' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 'var(--r-md)',
                        background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <AlertTriangle size={18} color={sc.fg} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="flex items-center gap-2" style={{ marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span className="mono body-xs" style={{ color: 'var(--ink-muted)' }}>{issue.id}</span>
                          <span className="badge" style={{ background: sc.bg, color: sc.fg }}>{sc.label}</span>
                          <span className="badge" style={{ background: stc.bg, color: stc.fg }}>{issue.status.replace('_', ' ')}</span>
                          <span className="badge badge-neutral">{issue.category}</span>
                        </div>
                        <div className="bold body-sm" style={{ marginBottom: '4px' }}>{issue.title}</div>
                        <div className="body-xs" style={{ color: 'var(--ink-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span className="flex items-center gap-1"><MapPin size={11} /> {issue.location}</span>
                          <span className="flex items-center gap-1"><Clock size={11} /> {new Date(issue.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                        </div>
                      </div>
                      <ChevronRight size={18} color="var(--ink-muted)" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'satellite' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'calc(100vh - 200px)' }}>
            <div style={{ height: '100%', background: 'var(--ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-inverse)', position: 'relative' }}>
              <KolamSVG size={500} opacity={0.05} color="#fbd77a" />
              <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                <Satellite size={48} color="#fbd77a" style={{ marginBottom: 16 }} />
                <h3 className="display-md" style={{ color: 'var(--ink-inverse)', marginBottom: 8 }}>Satellite view loading…</h3>
                <p className="body-sm" style={{ color: 'var(--ink-faint)', maxWidth: 400 }}>
                  High-resolution satellite imagery of Tamil Nadu with live complaint pins. See issues exactly where they happen.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Issue detail modal */}
        {selectedIssue && (
          <div className="modal-overlay" onClick={() => setSelectedIssue(null)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--sp-4)' }}>
                <span className="mono body-sm" style={{ color: 'var(--ink-muted)' }}>{selectedIssue.id}</span>
                <button onClick={() => setSelectedIssue(null)} className="btn btn-ghost btn-icon" aria-label="Close">
                  <X size={16} />
                </button>
              </div>
              <h2 className="display-sm" style={{ marginBottom: 'var(--sp-3)' }}>{selectedIssue.title}</h2>
              <div className="flex gap-2" style={{ marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
                <span className="badge" style={{ background: sevColor(selectedIssue.severity).bg, color: sevColor(selectedIssue.severity).fg }}>
                  {sevColor(selectedIssue.severity).label}
                </span>
                <span className="badge" style={{ background: statusColor(selectedIssue.status).bg, color: statusColor(selectedIssue.status).fg }}>
                  {selectedIssue.status.replace('_', ' ')}
                </span>
                <span className="badge badge-neutral">{selectedIssue.category}</span>
              </div>
              <p className="body-sm" style={{ color: 'var(--ink-2)', marginBottom: 'var(--sp-4)' }}>
                {selectedIssue.description}
              </p>
              <div className="card-flat" style={{ padding: 'var(--sp-3)', borderRadius: 'var(--r-md)', marginBottom: 'var(--sp-4)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <MapPin size={14} color="var(--green-500)" />
                <span className="body-sm">{selectedIssue.location}</span>
              </div>
              <div className="grid-2" style={{ gap: 8 }}>
                <button className="btn btn-primary">
                  <Send size={14} /> Mark in progress
                </button>
                <button className="btn btn-success">
                  <CheckCircle2 size={14} /> Mark resolved
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}