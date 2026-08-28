import React from 'react';
import {
  Building2, User, Landmark, Phone, Mail, ChevronRight, ShieldCheck,
  MapPin, ArrowUpRight, BadgeCheck, Users
} from 'lucide-react';
import { routeIssue } from '../../utils/routingEngine';

/* ============================================================
   ResponsiblePersonPanel — "Who handles this?"
   Shows the department, responsible officer, elected
   representative and escalation path for a given issue,
   derived from its category + location via the routing engine.
   ============================================================ */

export default function ResponsiblePersonPanel({ category, ward, district, compact = false }) {
  const route = routeIssue({ category, ward, district });
  const { department, responsibleOfficer, electedRepresentative, zonalOfficer, zone, escalation } = route;

  return (
    <div className="card" style={{ padding: 'var(--sp-5)', border: '1px solid var(--green-100)', background: 'var(--surface)' }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 'var(--sp-4)' }}>
        <div style={{ width: 34, height: 34, borderRadius: 'var(--r-md)', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Landmark size={16} color="var(--green-600)" />
        </div>
        <div>
          <div className="bold body-sm" style={{ color: 'var(--ink)' }}>Who handles this?</div>
          <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>Auto-routed by image + location</div>
        </div>
      </div>

      {/* Owning department */}
      <div className="card-flat" style={{ padding: 'var(--sp-3)', borderRadius: 'var(--r-md)', marginBottom: 'var(--sp-3)', background: 'var(--bg-alt)' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
          <Building2 size={14} color={department.color} />
          <span className="bold body-sm">{department.name}</span>
        </div>
        <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>{department.agency} · {zone}</div>
      </div>

      {/* Responsible officer */}
      {responsibleOfficer && (
        <div className="flex items-center gap-3" style={{ padding: 'var(--sp-3) 0', borderBottom: '1px solid var(--border)' }}>
          <div className="avatar avatar-sm" style={{ background: 'var(--green-50)', color: 'var(--green-600)' }}>{responsibleOfficer.name[0]}</div>
          <div style={{ flex: 1 }}>
            <div className="bold body-sm">{responsibleOfficer.name}</div>
            <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>{responsibleOfficer.role}</div>
          </div>
          <a href={`tel:${responsibleOfficer.phone}`} className="btn btn-ghost btn-icon" aria-label="Call"><Phone size={14} /></a>
        </div>
      )}

      {/* Elected representative */}
      {electedRepresentative && (
        <div className="flex items-center gap-3" style={{ padding: 'var(--sp-3) 0', borderBottom: '1px solid var(--border)' }}>
          <div className="avatar avatar-sm" style={{ background: 'var(--amber-50)', color: 'var(--amber-600)' }}>{electedRepresentative.name[0]}</div>
          <div style={{ flex: 1 }}>
            <div className="flex items-center gap-1">
              <span className="bold body-sm">{electedRepresentative.name}</span>
              <BadgeCheck size={13} color="var(--green-500)" />
            </div>
            <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>
              Ward Councillor · {electedRepresentative.party}
            </div>
          </div>
          <a href={`tel:${electedRepresentative.phone}`} className="btn btn-ghost btn-icon" aria-label="Call"><Phone size={14} /></a>
        </div>
      )}

      {/* Escalation path */}
      {!compact && (
        <div style={{ marginTop: 'var(--sp-3)' }}>
          <div className="label-sm" style={{ marginBottom: 'var(--sp-2)' }}>Escalation path if unresolved</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {escalation.map((e, i) => (
              <div key={e.level} className="flex items-center gap-2 body-xs" style={{ color: 'var(--ink-2)' }}>
                <span className="badge" style={{ background: i === 0 ? 'var(--green-500)' : 'var(--bg-alt)', color: i === 0 ? '#fff' : 'var(--ink-3)', minWidth: 22, justifyContent: 'center' }}>{e.level}</span>
                <span style={{ fontWeight: i === 0 ? 700 : 500 }}>{e.title}</span>
                {i < escalation.length - 1 && <ChevronRight size={12} color="var(--ink-3)" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
