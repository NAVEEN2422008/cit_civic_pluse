import React, { useState } from 'react';
import { Layers, Flame, AlertCircle, TrendingUp, CheckCircle, ZoomIn, ZoomOut, MapPin } from 'lucide-react';
import { TN_DEPARTMENTS, ESCALATION_LEVELS } from '../mockData';
import CivicHeatmapView from './citizen/CivicHeatmapView';

export default function AdminDashboard({ lang, complaints = [] }) {
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Metric counts
  const totalComplaints = complaints.length;
  const openCount = complaints.filter(c => c.status === 'OPEN').length;
  const escalatedCount = complaints.filter(c => c.escalationLevel > 1).length;
  const pendingConfirmation = complaints.filter(c => c.status === 'PENDING_CONFIRMATION').length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px' }}>
      {/* Top Metric Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {lang === 'ta' ? 'மொத்தப் புகார்கள்' : 'Total Complaints'}
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {totalComplaints}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {lang === 'ta' ? 'நிலுவையில் உள்ளவை' : 'Active Open Complaints'}
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0ea5e9' }}>
            {openCount}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={14} color="#8b5cf6" />
            <span>{lang === 'ta' ? 'SLA உயர்வுப் புகார்கள்' : 'SLA Escalated Complaints'}</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#c4b5fd' }}>
            {escalatedCount}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={14} color="#10b981" />
            <span>{lang === 'ta' ? 'ஒப்புதலுக்குக் காத்திருப்பவை' : 'Pending Citizen Approval'}</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#6ee7b7' }}>
            {pendingConfirmation}
          </div>
        </div>
      </div>

      {/* Real Tamil Nadu Satellite Heatmap Visualizer */}
      <CivicHeatmapView />
    </div>
  );
}
