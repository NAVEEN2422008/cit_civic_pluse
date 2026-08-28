import React, { useState, useEffect } from 'react';
import {
  LayoutGrid, ClipboardList, Map as MapIcon, BarChart3, LogOut,
  AlertTriangle, Clock, CheckCircle2, TrendingUp, MapPin,
  ChevronRight, Search, RefreshCw, User, X, Wrench,
  ShieldCheck, Award, Flame, MessageSquare, Building2, ListChecks, Users as UsersIcon
} from 'lucide-react';
import { apiService } from '../utils/apiService';
import { routeIssue } from '../utils/routingEngine';

/* ============================================================
   OFFICER PORTAL v4 — Role-scoped civic operations workspace.

   Tier model (logical authorization hierarchy):
     'ward'      → Ward Officer (field work, OWN tasks only)
     'zonal'     → Zonal/Dept Head (+ team workload, dispatch)
     'collector' → District Collector (district-wide, governance)
     'admin'     → State Admin (statewide governance portal)
   ============================================================ */

const TIER_META = {
  ward:      { label: 'Ward Officer',  scope: 'Your ward · own tasks', glyph: 'ward' },
  zonal:     { label: 'Zonal Officer', scope: 'Your zone · dept team',  glyph: 'zonal' },
  collector: { label: 'Collector',     scope: 'District-wide oversight', glyph: 'gov' },
  admin:     { label: 'State Admin',   scope: 'Statewide governance',   glyph: 'gov' },
};

const WORKFLOW = {
  NEW:                  { label: 'New',             next: 'ACCEPTED',           action: 'Accept task' },
  ACCEPTED:             { label: 'Accepted',        next: 'INSPECTED',          action: 'Record site inspection' },
  INSPECTED:            { label: 'Inspected',       next: 'BUDGET',              action: 'Request budget' },
  BUDGET:               { label: 'Awaiting budget', next: 'WORK_ORDER',          action: 'Create work order' },
  WORK_ORDER:           { label: 'Work order',      next: 'IN_PROGRESS',         action: 'Start work' },
  IN_PROGRESS:          { label: 'In progress',     next: 'EVIDENCE',            action: 'Update progress' },
  EVIDENCE:             { label: 'Submit evidence', next: 'PENDING_CONFIRMATION', action: 'Submit resolution evidence' },
  PENDING_CONFIRMATION: { label: 'Pending citizen confirm', next: 'RESOLVED',    action: null },
  RESOLVED:             { label: 'Resolved',        next: null,                  action: null },
};

const WORKFLOW_STEPS = ['NEW','ACCEPTED','INSPECTED','BUDGET','WORK_ORDER','IN_PROGRESS','EVIDENCE','PENDING_CONFIRMATION','RESOLVED'];

const KolamSVG = ({ size = 100, opacity = 0.06, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
    <g stroke={color} strokeWidth="0.6" fill="none">
      <circle cx="50" cy="50" r="46" /><circle cx="50" cy="50" r="34" />
      <circle cx="50" cy="50" r="22" /><circle cx="50" cy="50" r="10" />
    </g>
  </svg>
);

const buildDemo = () => [
  { id: 'TN-2026-8801', title: 'Streetlight not working, Sector 4', category: 'Electricity', severity: 'high', workflow: 'NEW', created_at: '2026-08-28T08:30:00Z', location: 'Ward 64, Coimbatore', description: 'Streetlight near bus stop off for 3 days.', ward: 'Ward 64' },
  { id: 'TN-2026-8802', title: 'Pothole on main road, T. Nagar', category: 'Roads', severity: 'critical', workflow: 'ACCEPTED', created_at: '2026-08-28T07:15:00Z', location: 'T. Nagar, Chennai', description: 'Large pothole causing traffic disruption.', ward: 'Ward 22' },
  { id: 'TN-2026-8803', title: 'Garbage overflow at junction', category: 'Sanitation', severity: 'medium', workflow: 'IN_PROGRESS', created_at: '2026-08-28T05:45:00Z', location: 'Ward 12, Madurai', description: 'Bins overflowing, hygiene issues.', ward: 'Ward 12' },
  { id: 'TN-2026-8804', title: 'Broken footpath slab', category: 'Roads', severity: 'low', workflow: 'PENDING_CONFIRMATION', created_at: '2026-08-27T18:20:00Z', location: 'Sector 9, Trichy', description: 'Footpath slab raised, unsafe.', ward: 'Ward 9' },
  { id: 'TN-2026-8805', title: 'Water supply disruption', category: 'Water', severity: 'high', workflow: 'INSPECTED', created_at: '2026-08-27T14:00:00Z', location: 'RS Puram, Coimbatore', description: 'No water since yesterday morning.', ward: 'Ward 18' },
  { id: 'TN-2026-8806', title: 'Illegal parking blocking lane', category: 'Traffic', severity: 'medium', workflow: 'RESOLVED', created_at: '2026-08-26T11:00:00Z', location: 'Anna Nagar, Chennai', description: 'Cars blocking the service lane.', ward: 'Ward 45' },
];

/* Map the app-level complaint registry into the officer workflow vocabulary.
   Bridges the citizen status (OPEN/PROCESSING/RESOLVED/WAITING_FOR_SYNC) and
   the officer workflow pipeline (NEW/ACCEPTED/.../RESOLVED). */
const STATUS_TO_WORKFLOW = {
  OPEN: 'NEW',
  PROCESSING: 'IN_PROGRESS',
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  RESOLVED: 'RESOLVED',
  WAITING_FOR_SYNC: 'NEW',
};

const mapComplaintsToTasks = (complaints) => {
  return complaints.map((c) => {
    const status = (c.status || c.workflow || c.workflow_state || 'OPEN').toUpperCase();
    const category = c.categoryEn || c.category || c.category_en || 'General';
    const ward = c.ward || c.location_ward || '';
    const route = routeIssue({ category, ward, district: c.district });
    return {
      id: c.id || c.complaint_id,
      title: c.titleEn || c.processed_description || c.title_en || 'Civic issue',
      category,
      severity: (c.priority || 'MEDIUM').toLowerCase(),
      workflow: STATUS_TO_WORKFLOW[status] || c.workflow || 'NEW',
      created_at: c.createdAt || c.created_at || new Date().toISOString(),
      location: c.ward || c.location_ward || c.ward_name || 'Location not set',
      ward: ward || '',
      description: c.processed_description || c.titleEn || c.description || '',
      department: route.department.name,
      responsibleOfficer: route.responsibleOfficer,
      electedRepresentative: route.electedRepresentative,
      zone: route.zone,
    };
  });
};

const sevOf = (s) => ({
  critical: { bg: '#fff1f2', fg: 'var(--danger)', l: 'Critical' },
  high:     { bg: '#fff7ed', fg: 'var(--terra-400)', l: 'High' },
  medium:   { bg: 'var(--amber-50)', fg: 'var(--amber-600)', l: 'Medium' },
  low:      { bg: 'var(--green-50)', fg: 'var(--green-500)', l: 'Low' },
}[s] || { bg: 'var(--bg-alt)', fg: 'var(--ink-muted)', l: s });

export default function OfficerPortal({ officer = {}, onLogout, onOpenGovernance, onOpenProfile, complaints = [] }) {
  const tier = ['collector','admin','zonal','ward'].includes(officer.tier) ? officer.tier : 'ward';
  const isSupervisor = ['zonal','collector','admin'].includes(tier);
  const isGov = tier === 'collector' || tier === 'admin';

  const [tab, setTab] = useState('today');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // If the app-level complaint registry has items, mirror those into the
        // officer workflow so newly filed complaints surface in the queue.
        if (complaints.length) {
          setIssues(mapComplaintsToTasks(complaints));
        } else {
          let list = [];
          try {
            list = await apiService.getOfficerIssues();
          } catch (_e) { list = []; }
          setIssues(list && list.length ? list : buildDemo());
        }
      } finally { setLoading(false); }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myTasks = issues.filter(i => i.workflow !== 'RESOLVED');
  const resolved = issues.filter(i => i.workflow === 'RESOLVED');
  const awaitingMe = myTasks.filter(i => ['NEW','ACCEPTED','IN_PROGRESS'].includes(i.workflow));
  const overdue = myTasks.filter(i => new Date(i.created_at) < new Date(Date.now() - 48*3600*1000));
  const pendingConfirm = issues.filter(i => i.workflow === 'PENDING_CONFIRMATION');

  const counts = {
    awaitingMe: awaitingMe.length,
    inProgress: myTasks.filter(i => i.workflow === 'IN_PROGRESS').length,
    pendingConfirm: pendingConfirm.length,
    overdue: overdue.length,
    resolved: resolved.length,
  };

  const filtered = issues.filter(i => {
    if (statusFilter === 'open') return i.workflow !== 'RESOLVED';
    if (statusFilter === 'resolved') return i.workflow === 'RESOLVED';
    if (statusFilter === 'overdue') return new Date(i.created_at) < new Date(Date.now() - 48*3600*1000) && i.workflow !== 'RESOLVED';
    return true;
  });

  const advance = (id) => {
    setIssues(prev => prev.map(p => p.id === id ? { ...p, workflow: WORKFLOW[p.workflow]?.next || p.workflow } : p));
    setSelectedIssue(null);
  };

  return (
    <div className="officer-shell">

      {/* ================= SIDEBAR (role-scoped nav) ================= */}
      <aside className="officer-sidebar">
        <div className="flex items-center gap-3" style={{ padding: '0 var(--sp-5) var(--sp-4)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={18} color="#fbd77a" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '.95rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
              {TIER_META[tier].label}
            </div>
            <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>{TIER_META[tier].scope}</div>
          </div>
        </div>

        <div style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
          <div className="badge badge-green">
            <ShieldCheck size={11} /> {officer.officer_id || 'OFF001'} · {officer.district || 'Coimbatore'}
          </div>
        </div>

        <div style={{ padding: '0 var(--sp-5)' }}>
          <div className="label-sm" style={{ marginBottom: 'var(--sp-2)' }}>My workspace</div>
          {[
            { id: 'today', label: "Today's focus", icon: LayoutGrid, count: counts.awaitingMe },
            { id: 'tasks', label: 'My tasks', icon: ClipboardList, count: myTasks.length },
            { id: 'ward', label: 'My ward map', icon: MapIcon },
            { id: 'performance', label: 'My performance', icon: BarChart3 },
          ].map(n => {
            const Icon = n.icon;
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', borderRadius: 'var(--r-md)', marginBottom: '2px', cursor: 'pointer',
                  background: active ? 'var(--green-50)' : 'transparent',
                  color: active ? 'var(--green-600)' : 'var(--ink-2)',
                  border: 'none', fontSize: '.84rem', fontWeight: 600, transition: 'background .15s' }}>
                <span className="flex items-center gap-3"><Icon size={16} /> {n.label}</span>
                {n.count != null && n.count > 0 && (
                  <span className="badge" style={{ background: active ? 'var(--green-500)' : 'var(--bg-alt)', color: active ? '#fff' : 'var(--ink-3)' }}>{n.count}</span>
                )}
              </button>
            );
          })}

          {isSupervisor && (
            <>
              <div className="label-sm" style={{ margin: 'var(--sp-5) 0 var(--sp-2)' }}>Supervision</div>
              {[
                { id: 'team', label: 'Team workload', icon: UsersIcon, count: 12 },
                { id: 'assign', label: 'Assign & dispatch', icon: ListChecks },
              ].map(n => {
                const Icon = n.icon;
                const active = tab === n.id;
                return (
                  <button key={n.id} onClick={() => setTab(n.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 12px', borderRadius: 'var(--r-md)', marginBottom: '2px', cursor: 'pointer',
                      background: active ? 'var(--amber-50)' : 'transparent',
                      color: active ? 'var(--amber-600)' : 'var(--ink-2)',
                      border: 'none', fontSize: '.84rem', fontWeight: 600 }}>
                    <span className="flex items-center gap-3"><Icon size={16} /> {n.label}</span>
                    {n.count != null && <span className="badge" style={{ background: active ? 'var(--amber-400)' : 'var(--bg-alt)', color: active ? 'var(--ink)' : 'var(--ink-3)' }}>{n.count}</span>}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {(isGov) && onOpenGovernance && (
          <div style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
            <button onClick={onOpenGovernance} className="btn btn-amber" style={{ width: '100%' }}>
              <ShieldCheck size={15} /> Governance portal
            </button>
          </div>
        )}

        <div style={{ padding: 'var(--sp-4) var(--sp-5)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          <button onClick={onOpenProfile} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 8 }}>
            <User size={13} /> My profile
          </button>
          <button onClick={onLogout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="officer-main" style={{ paddingBottom: 60 }}>

        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--sp-5)', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="section-label">{TEAM_FOCUS[tab]?.kicker || 'Workspace'} · {officer.district || 'Coimbatore'}</div>
            <h1 className="display-md" style={{ fontSize: '1.7rem' }}>{TEAM_FOCUS[tab]?.title || 'My workspace'}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.location.reload()} className="btn btn-ghost btn-sm" aria-label="Refresh"><RefreshCw size={14} /></button>
          </div>
        </div>

        {/* ============ TODAY'S FOCUS ============ */}
        {tab === 'today' && (
          <>
            <div className="grid-3" style={{ marginBottom: 'var(--sp-5)' }}>
              <FocusCard title="Awaiting my action" value={counts.awaitingMe} sub="Accept, inspect, progress" color="var(--terra-400)" bg="#fff7ed" icon={Wrench} onClick={() => setTab('tasks')} />
              <FocusCard title="In progress" value={counts.inProgress} sub="Work ongoing in field" color="var(--amber-500)" bg="var(--amber-50)" icon={TrendingUp} onClick={() => setTab('tasks')} />
              <FocusCard title="Overdue > 48h" value={counts.overdue} sub="Needs priority attention" color="var(--danger)" bg="#fff1f2" icon={Flame} onClick={() => setTab('tasks')} />
            </div>

            {pendingConfirm.length > 0 ? (
              <div className="reveal d-2" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)',
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-5)', marginBottom: 'var(--sp-5)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={18} color="var(--info)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="bold body-sm">Waiting on citizen confirmation</div>
                  <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>We pinged {pendingConfirm.length} citizen(s) to verify their fix. Close the loop when they confirm.</div>
                </div>
                <button onClick={() => setTab('tasks')} className="btn btn-secondary btn-sm">Review</button>
              </div>
            ) : (
              <div className="reveal d-2" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)',
                background: 'var(--green-50)', border: '1px solid var(--green-100)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-5)', marginBottom: 'var(--sp-5)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'var(--green-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={18} color="#fff" />
                </div>
                <div>
                  <div className="bold body-sm" style={{ color: 'var(--green-600)' }}>Nothing waiting on citizen confirmation</div>
                  <div className="body-xs" style={{ color: 'var(--ink-3)' }}>All confirmed. Great work.</div>
                </div>
              </div>
            )}

            <div className="reveal d-3">
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--sp-3)' }}>
                <h3 className="display-sm">Next task to act on</h3>
                <button onClick={() => setTab('tasks')} className="btn btn-ghost btn-sm">View all <ChevronRight size={13} /></button>
              </div>
              {myTasks.length > 0 ? (
                <IssueRow issue={myTasks[0]} open={() => setSelectedIssue(myTasks[0])} />
              ) : (
                <div className="card empty-state"><CheckCircle2 size={32} color="var(--green-500)" /><h3 style={{ margin: '8px 0 4px' }}>All caught up</h3><p className="body-sm" style={{ color: 'var(--ink-muted)' }}>No tasks waiting.</p></div>
              )}
            </div>
          </>
        )}

        {/* ============ MY TASKS ============ */}
        {tab === 'tasks' && (
          <>
            <div className="card" style={{ padding: 'var(--sp-4)', marginBottom: 'var(--sp-4)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <Search size={14} color="var(--ink-muted)" />
              <select className="input" style={{ width: 'auto', minWidth: 150 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="open">Open / active</option>
                <option value="overdue">Overdue</option>
                <option value="resolved">Resolved</option>
              </select>
              <span className="body-xs" style={{ color: 'var(--ink-muted)', marginLeft: 'auto' }}>{filtered.length} task(s)</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer" style={{ height: 120, borderRadius: 'var(--r-lg)' }}></div>)
              ) : filtered.length === 0 ? (
                <div className="card empty-state"><CheckCircle2 size={32} color="var(--green-500)" /><h3 style={{ margin: '8px 0 4px' }}>No tasks match</h3><p className="body-sm" style={{ color: 'var(--ink-muted)' }}>Try a different filter.</p></div>
              ) : filtered.map((issue, i) => (
                <IssueRow key={issue.id} issue={issue} open={() => setSelectedIssue(issue)} delay={Math.min(i, 5)} />
              ))}
            </div>
          </>
        )}

        {/* ============ TEAM WORKLOAD (supervisor) ============ */}
        {tab === 'team' && isSupervisor && <SupervisorView issues={issues} />}

        {/* ============ ASSIGN (supervisor) ============ */}
        {tab === 'assign' && isSupervisor && <AssignView issues={myTasks} />}

        {/* ============ MY WARD MAP ============ */}
        {tab === 'ward' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'calc(100vh - 260px)' }}>
            <div style={{ height: '100%', background: 'var(--ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-inverse)', position: 'relative' }}>
              <KolamSVG size={420} opacity={0.05} color="#fbd77a" />
              <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: 'var(--sp-6)' }}>
                <MapPin size={40} color="#fbd77a" style={{ marginBottom: 12 }} />
                <h3 className="display-md" style={{ color: 'var(--ink-inverse)', marginBottom: 8 }}>Your ward's live map</h3>
                <p className="body-sm" style={{ color: 'var(--ink-faint)', maxWidth: 380 }}>
                  All {issues.length} active reports in your jurisdiction, pinned with severity heat and status colours.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============ MY PERFORMANCE ============ */}
        {tab === 'performance' && <PerformanceView resolvedCount={counts.resolved} total={issues.length} />}

        {/* ============ TASK DETAIL DRAWER ============ */}
        {selectedIssue && (
          <IssueDetail issue={selectedIssue} onClose={() => setSelectedIssue(null)} onAdvance={advance} />
        )}
      </main>
    </div>
  );
}

/* ================= Atomic components ================= */

const TEAM_FOCUS = {
  today: { kicker: 'Daily focus', title: 'What needs you today' },
  tasks: { kicker: 'Task queue', title: 'My tasks' },
  ward: { kicker: 'Geographic view', title: 'My ward' },
  performance: { kicker: 'Personal metrics', title: 'My performance' },
  team: { kicker: 'Supervision', title: 'Team workload' },
  assign: { kicker: 'Dispatch', title: 'Assign & dispatch' },
};

function FocusCard({ title, value, sub, color, bg, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="card card-hover" style={{ cursor: 'pointer', padding: 'var(--sp-5)', textAlign: 'left' }}>
      <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--sp-3)' }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color, lineHeight: 1, letterSpacing: '-.02em' }}>{value}</div>
      <div className="bold body-sm" style={{ marginTop: 6, color: 'var(--ink)' }}>{title}</div>
      <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>{sub}</div>
    </button>
  );
}

function IssueRow({ issue, open, delay = 0 }) {
  const sc = sevOf(issue.severity);
  const w = WORKFLOW[issue.workflow] || { label: issue.workflow };
  const isOverdue = new Date(issue.created_at) < new Date(Date.now() - 48*3600*1000) && issue.workflow !== 'RESOLVED';
  return (
    <div className={`card card-hover reveal d-${delay}`} onClick={open}
      style={{ cursor: 'pointer', padding: 'var(--sp-5)', borderLeft: `4px solid ${issue.workflow === 'RESOLVED' ? 'var(--green-500)' : isOverdue ? 'var(--danger)' : sc.fg}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <span className="mono body-xs" style={{ color: 'var(--ink-muted)' }}>{issue.id}</span>
        <span className="badge" style={{ background: sc.bg, color: sc.fg }}>{sc.l}</span>
        <span className="badge badge-neutral">{issue.category}</span>
        <span className="badge" style={{ background: issue.workflow === 'RESOLVED' ? 'var(--green-50)' : 'var(--amber-50)', color: issue.workflow === 'RESOLVED' ? 'var(--green-600)' : 'var(--amber-600)' }}>{w.label}</span>
        {isOverdue && <span className="live-badge"><span className="live-dot"></span> Overdue</span>}
      </div>
      <div className="bold body-sm" style={{ fontSize: '.92rem', marginBottom: 6 }}>{issue.title}</div>
      <div className="body-xs" style={{ color: 'var(--ink-muted)', display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
        <span className="flex items-center gap-1"><MapPin size={11} /> {issue.location}</span>
        <span className="flex items-center gap-1"><Clock size={11} /> {new Date(issue.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      {issue.responsibleOfficer && (
        <div className="body-xs" style={{ color: 'var(--green-600)', display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
          <span className="flex items-center gap-1"><Building2 size={11} /> {issue.department}</span>
          <span className="flex items-center gap-1"><User size={11} /> {issue.responsibleOfficer.name} · {issue.zone}</span>
        </div>
      )}
      {w.action && (
        <div><span className="btn btn-primary btn-sm" style={{ pointerEvents: 'none' }}>{w.action} <ChevronRight size={12} /></span></div>
      )}
    </div>
  );
}

function IssueDetail({ issue, onClose, onAdvance }) {
  const w = WORKFLOW[issue.workflow] || { label: issue.workflow, next: null, action: null };
  const sc = sevOf(issue.severity);
  const idx = WORKFLOW_STEPS.indexOf(issue.workflow);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--sp-4)' }}>
          <span className="mono body-sm" style={{ color: 'var(--ink-muted)' }}>{issue.id}</span>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={16} /></button>
        </div>
        <h2 className="display-sm" style={{ marginBottom: 'var(--sp-3)' }}>{issue.title}</h2>
        <div className="flex gap-2" style={{ marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
          <span className="badge" style={{ background: sc.bg, color: sc.fg }}>{sc.l}</span>
          <span className="badge badge-neutral">{issue.category}</span>
          <span className="badge" style={{ background: 'var(--amber-50)', color: 'var(--amber-600)' }}>{w.label}</span>
        </div>
        <p className="body-sm" style={{ color: 'var(--ink-2)', marginBottom: 'var(--sp-4)' }}>{issue.description}</p>
        <div className="card-flat" style={{ padding: 'var(--sp-3)', borderRadius: 'var(--r-md)', marginBottom: 'var(--sp-5)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <MapPin size={14} color="var(--green-500)" /> <span className="body-sm">{issue.location} · {issue.ward}</span>
        </div>

        {issue.responsibleOfficer && (
          <div className="card-flat" style={{ padding: 'var(--sp-3)', borderRadius: 'var(--r-md)', marginBottom: 'var(--sp-5)', background: 'var(--green-50)', border: '1px solid var(--green-100)' }}>
            <div className="label-sm" style={{ color: 'var(--green-600)', marginBottom: 6 }}>Routing & accountability</div>
            <div className="body-sm" style={{ marginBottom: 4 }}><Building2 size={13} color="var(--green-600)" style={{ verticalAlign: 'middle', marginRight: 6 }} />{issue.department} · {issue.zone}</div>
            <div className="body-sm" style={{ marginBottom: 4 }}><User size={13} color="var(--green-600)" style={{ verticalAlign: 'middle', marginRight: 6 }} />Officer: {issue.responsibleOfficer.name} ({issue.responsibleOfficer.role})</div>
            {issue.electedRepresentative && (
              <div className="body-sm"><ShieldCheck size={13} color="var(--green-600)" style={{ verticalAlign: 'middle', marginRight: 6 }} />Councillor: {issue.electedRepresentative.name} ({issue.electedRepresentative.party})</div>
            )}
          </div>
        )}

        <div className="label-sm" style={{ marginBottom: 'var(--sp-3)' }}>Resolution pipeline</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 'var(--sp-5)' }}>
          {WORKFLOW_STEPS.map((s, i) => {
            const name = WORKFLOW[s].label;
            const done = i < idx;
            const current = i === idx;
            return (
              <div key={s} className="badge" style={{
                background: done ? 'var(--green-500)' : current ? 'var(--amber-400)' : 'var(--bg-alt)',
                color: done || current ? '#fff' : 'var(--ink-3)', border: 'none',
              }}>{i + 1} {name}</div>
            );
          })}
        </div>

        {w.action ? (
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => onAdvance(issue.id)}>
            <CheckCircle2 size={14} /> {w.action}
          </button>
        ) : (
          <div className="card" style={{ background: 'var(--green-50)', border: '1px solid var(--green-100)', textAlign: 'center', padding: 'var(--sp-4)' }}>
            <CheckCircle2 size={22} color="var(--green-500)" style={{ marginBottom: 6 }} />
            <div className="bold body-sm" style={{ color: 'var(--green-600)' }}>Resolved — awaiting citizen confirmation</div>
          </div>
        )}
      </div>
    </div>
  );
}

function PerformanceView({ resolvedCount, total }) {
  const rate = total ? Math.round((resolvedCount / total) * 100) : 0;
  return (
    <div>
      <div className="grid-4" style={{ marginBottom: 'var(--sp-5)' }}>
        {[
          { l: 'Tasks closed', v: resolvedCount, icon: CheckCircle2, color: 'var(--green-500)', bg: 'var(--green-50)' },
          { l: 'Avg cycle time', v: '3.1d', icon: Clock, color: 'var(--info)', bg: 'var(--info-bg)' },
          { l: 'Citizen satisfaction', v: '96%', icon: Award, color: 'var(--amber-500)', bg: 'var(--amber-50)' },
          { l: 'On-time SLA', v: '89%', icon: TrendingUp, color: 'var(--terra-400)', bg: '#fff7ed' },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="card" style={{ padding: 'var(--sp-5)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--sp-3)' }}>
                <Icon size={18} color={k.color} />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{k.v}</div>
              <div className="bold body-sm" style={{ marginTop: 6 }}>{k.l}</div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 'var(--sp-6)' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--sp-5)' }}>
          <h3 className="display-sm">Resolution rate</h3>
          <span className="badge badge-green">{rate}%</span>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div className="progress-fill" style={{ width: `${rate}%`, background: 'linear-gradient(90deg, var(--green-400), var(--green-600))' }}></div>
        </div>
        <div className="body-xs" style={{ color: 'var(--ink-muted)', marginTop: 10 }}>{resolvedCount} of {total} assigned tasks fully resolved with citizen confirmation.</div>
      </div>
    </div>
  );
}

function SupervisorView({ issues }) {
  const depts = [...new Set(issues.map(i => i.category))];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 'var(--sp-5)' }} className="dept-grid">
      <div className="card" style={{ padding: 'var(--sp-6)' }}>
        <h3 className="display-sm" style={{ marginBottom: 'var(--sp-5)' }}>Team workload · your department</h3>
        {depts.map((d, i) => {
          const load = 30 + ((i * 17) % 65);
          const cnt = issues.filter(x => x.category === d).length;
          return (
            <div key={i} style={{ marginBottom: 'var(--sp-4)' }}>
              <div className="flex justify-between" style={{ marginBottom: 6 }}>
                <span className="bold body-sm">{d}</span><span className="mono body-xs" style={{ color: 'var(--ink-muted)' }}>{cnt} tasks</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${load}%`, background: 'var(--green-500)' }}></div></div>
            </div>
          );
        })}
      </div>
      <div className="card" style={{ padding: 'var(--sp-6)' }}>
        <h3 className="display-sm" style={{ marginBottom: 'var(--sp-4)' }}>Team members</h3>
        {['K. Meena', 'R. Arjun', 'S. Divya', 'V. Karthik'].map((n, i) => (
          <div key={i} className="flex items-center gap-3" style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>
            <div className="avatar avatar-sm" style={{ background: 'var(--green-50)', color: 'var(--green-500)' }}>{n[0]}</div>
            <div style={{ flex: 1 }}><div className="bold body-sm">{n}</div><div className="body-xs" style={{ color: 'var(--ink-muted)' }}>Field officer</div></div>
            <span className="badge badge-green">{2 + i} tasks</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssignView({ issues }) {
  return (
    <div className="card" style={{ padding: 'var(--sp-6)' }}>
      <h3 className="display-sm" style={{ marginBottom: 'var(--sp-4)' }}>Dispatch unattended tasks</h3>
      <p className="body-sm" style={{ color: 'var(--ink-3)', marginBottom: 'var(--sp-5)' }}>Assign open tasks to your team. Unassigned tasks stay in the shared queue.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        {issues.filter(i => i.workflow === 'NEW').slice(0, 4).map((issue, i) => (
          <div key={issue.id} className="card" style={{ padding: 'var(--sp-4)', background: 'var(--bg-alt)' }}>
            <div className="flex items-center justify-between gap-3" style={{ flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <div className="mono body-xs" style={{ color: 'var(--ink-muted)' }}>{issue.id}</div>
                <div className="bold body-sm">{issue.title}</div>
                <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>{issue.location}</div>
              </div>
              <select className="input" style={{ width: 'auto', minWidth: 140 }}>
                <option value="">Assign to…</option>
                <option>K. Meena</option><option>R. Arjun</option><option>S. Divya</option><option>V. Karthik</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
