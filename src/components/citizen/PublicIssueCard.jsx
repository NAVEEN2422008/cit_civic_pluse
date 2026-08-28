import React from 'react';
import { MapPin, Users, Calendar, ArrowUpRight, Globe, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function PublicIssueCard({ issue, onViewDetails, lang = 'en' }) {
  if (!issue) return null;

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return { label: 'Active Issue', class: 'badge-high' };
      case 'PROCESSING':
      case 'IN_PROGRESS':
        return { label: 'In Progress', class: 'badge-medium' };
      case 'PENDING_CONFIRMATION':
        return { label: 'Pending Verification', class: 'badge-medium' };
      case 'RESOLVED':
        return { label: 'Resolved', class: 'badge-low' };
      default:
        return { label: status, class: 'badge-low' };
    }
  };

  const badge = getStatusBadge(issue.status);
  const nativeText = issue.original_description || issue.title_ta || issue.title_en;
  const processedText = issue.processed_description || issue.title_en;

  return (
    <div className="glass-panel" style={{
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '14px',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(13, 20, 36, 0.85)'
    }}>
      <div>
        {/* Header: Category & Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ 
            fontSize: '0.72rem', 
            fontWeight: 800, 
            color: '#38bdf8', 
            textTransform: 'uppercase', 
            letterSpacing: '0.8px',
            background: 'rgba(56, 189, 248, 0.1)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(56, 189, 248, 0.2)'
          }}>
            {issue.category || 'CIVIC ISSUE'}
          </span>
          <span className={`badge ${badge.class}`}>
            {badge.label}
          </span>
        </div>

        {/* Original Native Description */}
        <h4 style={{ 
          fontSize: '1rem', 
          fontWeight: 700, 
          marginBottom: '8px', 
          lineHeight: '1.45', 
          color: '#f8fafc' 
        }}>
          "{nativeText}"
        </h4>

        {/* Sarvam AI Processed English Version */}
        {processedText && processedText !== nativeText && (
          <div style={{ 
            fontSize: '0.8rem', 
            color: '#94a3b8', 
            marginBottom: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '6px 10px',
            borderRadius: '8px',
            border: '1px dashed rgba(255, 255, 255, 0.1)'
          }}>
            <Globe size={13} color="#38bdf8" />
            <span style={{ fontStyle: 'italic' }}>AI Translation: "{processedText}"</span>
          </div>
        )}

        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <MapPin size={15} color="#0ea5e9" />
          <span style={{ fontWeight: 500 }}>{issue.location_ward || issue.location || 'Ward Area, Tamil Nadu'}</span>
        </div>
      </div>

      {/* Footer Meta: Supporters & Date */}
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          fontSize: '0.76rem', 
          color: 'var(--text-dim)', 
          paddingTop: '12px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.06)', 
          marginBottom: '14px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6ee7b7', fontWeight: 600 }}>
            <Users size={14} color="#10b981" />
            <span>{issue.supporters_count || 1} Supporters Upvoted</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={13} />
            <span>{issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'Today'}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onViewDetails && onViewDetails(issue)}
          className="glass-btn"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.84rem', padding: '10px 14px', borderRadius: '10px' }}
        >
          <span>View Details & Timeline</span>
          <ArrowUpRight size={15} color="#38bdf8" />
        </button>
      </div>
    </div>
  );
}
