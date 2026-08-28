import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutGrid, ClipboardList, Map as MapIcon, BarChart3, LogOut,
  AlertTriangle, Clock, CheckCircle2, TrendingUp, MapPin,
  ChevronRight, Search, RefreshCw, User, X, Wrench,
  ShieldCheck, Award, Flame, MessageSquare, Building2, ListChecks, Users as UsersIcon,
  Layers, Compass, ZoomIn, ZoomOut, Eye, Camera
} from 'lucide-react';
import { apiService } from '../utils/apiService';
import { routeIssue } from '../utils/routingEngine';
import OfficerProgressUpload from './officer/OfficerProgressUpload';
import { listProgressForIssue, addProgressEntry } from '../utils/progressStore';

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

  const isTa = officer.lang === 'Tamil' || officer.lang === 'ta';

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
              {isTa ? (tier === 'ward' ? 'வார்டு கள அதிகாரி' : tier === 'zonal' ? 'மண்டல தலைவர்' : tier === 'collector' ? 'மாவட்ட ஆட்சியர்' : 'மாநில நிர்வாகி') : TIER_META[tier].label}
            </div>
            <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>
              {isTa ? (tier === 'ward' ? 'வார்டு எல்லை' : tier === 'zonal' ? 'மண்டல எல்லை' : tier === 'collector' ? 'மாவட்ட எல்லை' : 'மாநில அளவிலான SLA') : TIER_META[tier].scope}
            </div>
          </div>
        </div>

        <div style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
          <div className="badge badge-green">
            <ShieldCheck size={11} /> {officer.officer_id || 'OFF001'} · {officer.district || 'Coimbatore'}
          </div>
        </div>

        <div style={{ padding: '0 var(--sp-5)' }}>
          <div className="label-sm" style={{ marginBottom: 'var(--sp-2)' }}>{isTa ? 'எனது பணியிடம்' : 'My workspace'}</div>
          {[
            { id: 'today', label: isTa ? "இன்றைய முக்கியத்துவம்" : "Today's focus", icon: LayoutGrid, count: counts.awaitingMe },
            { id: 'tasks', label: isTa ? "எனது பணிகள்" : "My tasks", icon: ClipboardList, count: myTasks.length },
            { id: 'ward', label: isTa ? "வார்டு வரைபடம்" : "My ward map", icon: MapIcon },
            { id: 'performance', label: isTa ? "எனது செயல்திறன்" : "My performance", icon: BarChart3 },
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
              <div className="label-sm" style={{ margin: 'var(--sp-5) 0 var(--sp-2)' }}>{isTa ? "மேற்பார்வை" : "Supervision"}</div>
              {[
                { id: 'team', label: isTa ? "குழு பணிச்சுமை" : "Team workload", icon: UsersIcon, count: 12 },
                { id: 'assign', label: isTa ? "பணி ஒதுக்கீடு & அனுப்பு" : "Assign & dispatch", icon: ListChecks },
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
              <ShieldCheck size={15} /> {isTa ? "மாநில நிர்வாக மையம்" : "Governance portal"}
            </button>
          </div>
        )}

        <div style={{ padding: 'var(--sp-4) var(--sp-5)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          <button onClick={onOpenProfile} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 8 }}>
            <User size={13} /> {isTa ? "எனது சுயவிவரம்" : "My profile"}
          </button>
          <button onClick={onLogout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }}>
            <LogOut size={13} /> {isTa ? "வெளியேறு" : "Sign out"}
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
          <OfficerWardMap
            issues={issues}
            officer={officer}
          />
        )}

        {/* ============ MY PERFORMANCE ============ */}
        {tab === 'performance' && <PerformanceView resolvedCount={counts.resolved} total={issues.length} />}

        {/* ============ TASK DETAIL DRAWER ============ */}
        {selectedIssue && (
          <IssueDetail
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
            onAdvance={advance}
            officer={officer}
            onProgressSubmitted={() => {}}
          />
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

function IssueDetail({ issue, onClose, onAdvance, officer, onProgressSubmitted }) {
  const w = WORKFLOW[issue.workflow] || { label: issue.workflow, next: null, action: null };
  const sc = sevOf(issue.severity);
  const idx = WORKFLOW_STEPS.indexOf(issue.workflow);
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [expandedTimeline, setExpandedTimeline] = useState(true);
  const proofs = listProgressForIssue(issue.id || issue.complaint_id || '');

  const needsProof = ['ACCEPTED', 'INSPECTED', 'IN_PROGRESS', 'EVIDENCE'].includes(issue.workflow);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
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

        {/* Resolution Pipeline */}
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

        {/* REAL PROGRESS PROOF TIMELINE */}
        {proofs.length > 0 && (
          <div style={{ marginBottom: 'var(--sp-5)' }}>
            <button
              onClick={() => setExpandedTimeline(!expandedTimeline)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8 }}
            >
              <Eye size={13} color="#818cf8" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#818cf8' }}>
                {expandedTimeline ? 'Hide' : 'Show'} My Progress Timeline ({proofs.length} update{proofs.length !== 1 ? 's' : ''})
              </span>
              <ChevronRight size={12} color="#818cf8" style={{ transform: expandedTimeline ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
            </button>
            {expandedTimeline && (
              <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '12px' }}>
                <ProofMiniTimeline proofs={proofs} />
              </div>
            )}
          </div>
        )}

        {/* ACTION BUTTONS */}
        {showProofUpload ? (
          <OfficerProgressUpload
            issue={issue}
            officer={officer}
            onComplete={(entry) => {
              setShowProofUpload(false);
              if (onProgressSubmitted) onProgressSubmitted(entry);
              // advance the workflow
              if (issue.workflow !== 'RESOLVED') onAdvance(issue.id);
            }}
            onClose={() => setShowProofUpload(false)}
          />
        ) : w.action ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
              onClick={() => setShowProofUpload(true)}
            >
              <Camera size={15} /> Submit Proof — {w.action}
            </button>
            {needsProof && (
              <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: '0.75rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} />
                {lang === 'Tamil'
                  ? 'இந்த செயலுக்கு ஆதாரம் (புகைப்படம் + GPS + குறிப்புகள்) கட்டாயம்!'
                  : '⚠️ Proof required (photo + GPS + notes) before advancing this step!'}
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ background: 'var(--green-50)', border: '1px solid var(--green-100)', textAlign: 'center', padding: 'var(--sp-4)' }}>
            <CheckCircle2 size={22} color="var(--green-500)" style={{ marginBottom: 6 }} />
            <div className="bold body-sm" style={{ color: 'var(--green-600)' }}>
              {issue.workflow === 'RESOLVED'
                ? (lang === 'Tamil' ? 'தீர்க்கப்பட்டது ✓' : 'Resolved ✓')
                : 'Awaiting citizen confirmation'}
            </div>
            <div className="body-xs" style={{ color: 'var(--ink-3)', marginTop: 4 }}>
              {issue.workflow === 'RESOLVED'
                ? (lang === 'Tamil' ? 'குடிமக்கள் சரிபார்ப்பைக் காத்திருக்கிறது.' : 'Waiting for citizen to verify the fix.')
                : 'Waiting for citizen confirmation.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProofMiniTimeline({ proofs }) {
  if (!proofs.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {proofs.map((p, i) => {
        const colors = ['#38bdf8', '#a78bfa', '#fbbf24', '#10b981', '#f87171'];
        const c = colors[i % colors.length];
        return (
          <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, marginTop: 4, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: c }}>{p.typeLabel || p.type}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{new Date(p.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {p.photoUrl && (
                <img src={p.photoUrl} alt="Proof" style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 6, marginTop: 4, opacity: 0.85 }} />
              )}
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 2 }}>
                {p.officerName} · {p.gpsMeters != null ? `${p.gpsMeters}m from site` : ''}
                {p.aiCheck && (
                  <span style={{ color: p.aiCheck.isAiGenerated ? '#f87171' : '#10b981', marginLeft: 6 }}>
                    {p.aiCheck.isAiGenerated ? '⚠️ AI' : '✅ Real'}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
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

/* ================= OFFICER WARD MAP (real Leaflet map) ================= */

function OfficerWardMap({ issues = [], officer = {} }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState(null);
  const [catFilter, setCatFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const sevColor = (priority) => {
    const p = (priority || 'medium').toUpperCase();
    if (p === 'CRITICAL' || p === 'HIGH') return '#e11d48';
    if (p === 'MEDIUM') return '#f59e0b';
    return '#22c55e';
  };
  const sevGlow = (p) => {
    const c = sevColor(p);
    return `0 0 12px ${c}80`;
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!mapRef.current || leafletRef.current) return;
      // Dynamically import Leaflet to keep it out of the initial bundle
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');
      if (cancelled || !mapRef.current) return;

      // Strict Tamil Nadu Geographic Bounding Box
      const TN_BOUNDS = [
        [8.08, 76.22],  // South-West (Kanyakumari / Kerala border)
        [13.55, 80.35]  // North-East (Tiruvallur / Chennai border)
      ];

      // Tamil Nadu default centre, locked to state
      const map = L.map(mapRef.current, {
        center: [11.1271, 78.6569],
        zoom: 7,
        minZoom: 6,
        maxZoom: 18,
        maxBounds: TN_BOUNDS,
        maxBoundsViscosity: 1.0,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Precise Tamil Nadu State Border Coordinates for Polygon Cut-out Mask
      const TN_STATE_BORDER = [
        [13.50, 80.25], [13.40, 79.90], [13.25, 79.70], [13.00, 79.40], [12.80, 79.10],
        [12.60, 78.70], [12.60, 78.20], [12.30, 77.80], [12.10, 77.50], [11.80, 77.30],
        [11.60, 77.00], [11.50, 76.60], [11.35, 76.40], [11.20, 76.50], [10.80, 76.70],
        [10.50, 76.90], [10.20, 77.20], [9.90, 77.30],  [9.50, 77.40],  [9.00, 77.30],
        [8.70, 77.40],  [8.30, 77.50],  [8.08, 77.55],  [8.15, 77.80],  [8.60, 78.15],
        [9.10, 78.80],  [9.30, 79.30],  [9.80, 79.10],  [10.30, 79.40], [10.75, 79.85],
        [11.20, 79.80], [11.60, 79.80], [12.00, 79.85], [12.50, 80.20], [13.10, 80.30],
        [13.50, 80.25]
      ];

      const WORLD_MASK_POLYGON = [
        [
          [-90, -180],
          [-90, 180],
          [90, 180],
          [90, -180],
          [-90, -180]
        ],
        TN_STATE_BORDER
      ];

      // Blackout everything outside Tamil Nadu
      L.polygon(WORLD_MASK_POLYGON, {
        fillColor: '#070b14',
        fillOpacity: 0.94,
        stroke: false,
        interactive: false,
      }).addTo(map);

      // Glowing golden Tamil Nadu border
      L.polygon(TN_STATE_BORDER, {
        color: '#f59e0b',
        weight: 2,
        opacity: 0.8,
        fill: false,
        dashArray: '5, 5',
        interactive: false,
      }).addTo(map);

      // Focus map exclusively to officer's assigned jurisdiction
      const districtCoords = {
        'Coimbatore': [11.0168, 76.9558],
        'Chennai': [13.0827, 80.2707],
        'Madurai': [9.9252, 78.1198],
        'Salem': [11.6643, 78.1460],
        'Tiruchirappalli': [10.7905, 78.7047],
        'Trichy': [10.7905, 78.7047],
        'Tirunelveli': [8.7139, 77.7567]
      };
      
      const targetCoord = districtCoords[officer.district] || [11.1271, 78.6569];
      const targetZoom = officer.tier === 'ward' ? 14 : officer.tier === 'zonal' ? 12 : 9;
      map.flyTo(targetCoord, targetZoom, { duration: 1.2 });

      leafletRef.current = { map, L, markers: L.layerGroup().addTo(map) };
      setReady(true);
    };
    init();
    return () => { cancelled = true; };
  }, [officer.district, officer.tier]);

  // Render markers strictly filtered to the officer's jurisdiction
  useEffect(() => {
    if (!ready || !leafletRef.current) return;
    const { map, L, markers } = leafletRef.current;
    markers.clearLayers();

    const isWardOfficer = officer.tier === 'ward';
    const isZonalOfficer = officer.tier === 'zonal';

    const filtered = issues.filter(i => {
      // 1. Role-based territorial scoping:
      if (isWardOfficer && officer.ward && i.ward && !i.ward.toLowerCase().includes(officer.ward.toLowerCase())) {
        return false;
      }
      if ((isWardOfficer || isZonalOfficer) && officer.district && i.location && !i.location.toLowerCase().includes(officer.district.toLowerCase())) {
        return false;
      }

      const lat = i.lat ?? i.latitude;
      const lon = i.lon ?? i.longitude;
      if (lat == null || lon == null) return false;
      if (catFilter !== 'ALL' && i.category !== catFilter) return false;
      if (statusFilter !== 'ALL' && i.workflow?.toUpperCase() !== statusFilter.toUpperCase()) return false;
      return true;
    });

    filtered.forEach((issue) => {
      const lat = issue.lat ?? issue.latitude;
      const lon = issue.lon ?? issue.longitude;
      const color = sevColor(issue.severity);
      const glow = sevGlow(issue.severity);

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:26px;height:26px;border-radius:50%;
          background:${color};border:3px solid #fff;
          box-shadow:${glow}, 0 2px 8px rgba(0,0,0,0.5);
          cursor:pointer;
        "></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([lat, lon], { icon })
        .addTo(markers)
        .on('click', () => setSelected(issue));
    });
  }, [ready, issues, catFilter, statusFilter, officer]);

  const categories = ['ALL', ...new Set(issues.map(i => i.category).filter(Boolean))];
  const statuses = ['ALL', 'NEW', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED'];

  return (
    <div style={{ background: '#0f172a', borderRadius: 18, border: '1px solid rgba(148,163,184,.08)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid rgba(148,163,184,.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapIcon size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
              Officer Ward Map
            </div>
            <div style={{ fontSize: '.7rem', color: '#64748b', fontWeight: 500 }}>
              {officer.district || 'TN'} · {officer.zone || 'Zone'} · {officer.officer_id || 'OFF001'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,.15)', borderRadius: 7, color: '#f8fafc', padding: '5px 10px', fontSize: '.78rem', cursor: 'pointer', fontWeight: 600 }}>
            {categories.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All categories' : c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,.15)', borderRadius: 7, color: '#f8fafc', padding: '5px 10px', fontSize: '.78rem', cursor: 'pointer', fontWeight: 600 }}>
            {statuses.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All statuses' : s.replace('_', ' ')}</option>)}
          </select>
          <button
            onClick={() => setSelected(null)}
            style={{ padding: '5px 12px', background: '#1e293b', border: '1px solid rgba(148,163,184,.15)', borderRadius: 7, color: '#94a3b8', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'rgba(148,163,184,.05)', borderBottom: '1px solid rgba(148,163,184,.1)' }}>
        {[
          { l: 'Total issues', v: issues.length, c: '#f8fafc' },
          { l: 'Open', v: issues.filter(i => i.workflow !== 'RESOLVED').length, c: '#e11d48' },
          { l: 'In progress', v: issues.filter(i => i.workflow === 'IN_PROGRESS').length, c: '#f59e0b' },
          { l: 'Resolved', v: issues.filter(i => i.workflow === 'RESOLVED').length, c: '#22c55e' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: '.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 3 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Map + sidebar */}
      <div style={{ display: 'flex', height: 520, position: 'relative' }}>
        {/* Leaflet map container */}
        <div ref={mapRef} style={{ flex: 1, height: '100%', background: '#0f172a' }} />

        {/* Issue sidebar */}
        <div style={{ width: 280, background: '#0f172a', borderLeft: '1px solid rgba(148,163,184,.08)', overflowY: 'auto', padding: '12px 0' }}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.1em', padding: '0 14px 10px', borderBottom: '1px solid rgba(148,163,184,.06)' }}>
            Issues ({issues.length})
          </div>
          {issues.length === 0 ? (
            <div style={{ padding: '24px 14px', textAlign: 'center', color: '#475569', fontSize: '.8rem' }}>
              No issues assigned to your ward.
            </div>
          ) : (
            issues.slice(0, 30).map((issue, i) => {
              const color = sevColor(issue.severity);
              return (
                <button
                  key={issue.id || i}
                  onClick={() => setSelected(issue)}
                  style={{
                    width: '100%', padding: '10px 14px', textAlign: 'left', cursor: 'pointer',
                    background: selected?.id === issue.id ? 'rgba(99,102,241,.15)' : 'transparent',
                    border: 'none', borderBottom: '1px solid rgba(148,163,184,.05)',
                    transition: 'background .15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: sevGlow(issue.severity) }} />
                    <span style={{ fontSize: '.7rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{issue.id}</span>
                    <span style={{ fontSize: '.6rem', padding: '1px 5px', borderRadius: 4, background: '#1e293b', color: '#94a3b8', marginLeft: 'auto' }}>
                      {issue.workflow?.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '.78rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {issue.title}
                  </div>
                  <div style={{ fontSize: '.65rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={9} /> {issue.location || issue.ward}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Selected issue detail card */}
        {selected && (
          <div style={{
            position: 'absolute', top: 12, right: 292, zIndex: 1000,
            background: 'rgba(15,23,42,.94)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(148,163,184,.12)', borderRadius: 14,
            padding: '14px 16px', width: 260, boxShadow: '0 24px 48px rgba(0,0,0,.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="mono body-xs" style={{ color: '#64748b', fontSize: '.7rem' }}>{selected.id}</span>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}><X size={14} /></button>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: 6, lineHeight: 1.3 }}>{selected.title}</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ padding: '2px 7px', borderRadius: 5, background: sevColor(selected.severity) + '33', color: sevColor(selected.severity), fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase' }}>{selected.severity}</span>
              <span style={{ padding: '2px 7px', borderRadius: 5, background: 'rgba(99,102,241,.15)', color: '#a5b4fc', fontSize: '.68rem', fontWeight: 600 }}>{selected.category}</span>
              <span style={{ padding: '2px 7px', borderRadius: 5, background: 'rgba(100,116,139,.2)', color: '#94a3b8', fontSize: '.68rem', fontWeight: 600 }}>{selected.workflow?.replace('_', ' ')}</span>
            </div>
            <div style={{ fontSize: '.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <MapPin size={11} /> {selected.location || selected.ward}
            </div>
            <div style={{ fontSize: '.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <Clock size={11} /> {new Date(selected.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
            {selected.department && (
              <div style={{ fontSize: '.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Building2 size={11} /> {selected.department}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
          background: 'rgba(15,23,42,.9)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(148,163,184,.1)', borderRadius: 10,
          padding: '10px 14px'
        }}>
          <div style={{ fontSize: '.6rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Severity</div>
          {[['Critical/High', '#e11d48'], ['Medium', '#f59e0b'], ['Low', '#22c55e']].map(([l, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}80` }} />
              <span style={{ fontSize: '.72rem', color: '#cbd5e1', fontWeight: 500 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
