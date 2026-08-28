import React, { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, RotateCw, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

/* ============================================================
   Civic3DHeatmapView — 3D extruded heatmap of civic issues.
   Uses MapLibre GL fill-extrusion: each issue cluster becomes a
   3D column whose HEIGHT = issue intensity and COLOR = severity.
   Users can tilt/rotate the camera (right-drag) to inspect the
   "skyline" of civic pressure across the city.
   ============================================================ */

const SEVERITY = {
  critical: { color: '#e11d48', label: 'Critical', min: 0.85 },
  high:     { color: '#f97316', label: 'High',     min: 0.70 },
  medium:   { color: '#eab308', label: 'Medium',   min: 0.50 },
  low:      { color: '#22c55e', label: 'Low',      min: 0.00 },
};

const severityOf = (intensity) => {
  if (intensity >= SEVERITY.critical.min) return SEVERITY.critical;
  if (intensity >= SEVERITY.high.min) return SEVERITY.high;
  if (intensity >= SEVERITY.medium.min) return SEVERITY.medium;
  return SEVERITY.low;
};

const DEFAULT_CLUSTERS = [
  { latitude: 13.0827, longitude: 80.2707, intensity: 0.95, category: 'ROADS', location_ward: 'Ward 104, Anna Nagar, Chennai', reports_count: 28, status: 'OPEN' },
  { latitude: 13.0418, longitude: 80.2341, intensity: 0.92, category: 'GARBAGE', location_ward: 'Ward 112, T. Nagar, Chennai', reports_count: 32, status: 'IN_PROGRESS' },
  { latitude: 12.9815, longitude: 80.2180, intensity: 0.70, category: 'STREETLIGHTS', location_ward: 'Ward 170, Velachery, Chennai', reports_count: 14, status: 'OPEN' },
  { latitude: 13.0067, longitude: 80.2570, intensity: 0.85, category: 'DRAINAGE', location_ward: 'Ward 175, Adyar, Chennai', reports_count: 22, status: 'IN_PROGRESS' },
  { latitude: 9.9252, longitude: 78.1198, intensity: 0.89, category: 'ROADS', location_ward: 'Ward 45, K.K. Nagar, Madurai', reports_count: 24, status: 'OPEN' },
  { latitude: 11.0168, longitude: 76.9558, intensity: 0.94, category: 'GARBAGE', location_ward: 'Ward 14, Gandhipuram, Coimbatore', reports_count: 30, status: 'OPEN' },
  { latitude: 10.7905, longitude: 78.7047, intensity: 0.65, category: 'WATER', location_ward: 'Thillai Nagar, Tiruchirappalli', reports_count: 12, status: 'RESOLVED' },
  { latitude: 11.6643, longitude: 78.1460, intensity: 0.78, category: 'ROADS', location_ward: 'Junction Zone, Salem', reports_count: 19, status: 'OPEN' },
];

export default function Civic3DHeatmapView({ clusters = [], onSelectCluster }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [pitch, setPitch] = useState(60);
  const [selected, setSelected] = useState(null);

  const data = clusters && clusters.length ? clusters : DEFAULT_CLUSTERS;

  // Build GeoJSON features (one extruded column per cluster)
  const features = data
    .filter(c => c.latitude != null && c.longitude != null)
    .map((c, i) => {
      const sev = severityOf(c.intensity || 0);
      return {
        type: 'Feature',
        properties: {
          id: c.id || `cluster-${i}`,
          intensity: c.intensity || 0,
          height: Math.max(200, Math.round((c.intensity || 0) * 4000)),
          color: sev.color,
          severity: sev.label,
          category: c.category || 'GENERAL',
          ward: c.location_ward || c.ward || 'Unknown ward',
          reports: c.reports_count || c.supporters_count || 1,
          status: c.status || 'OPEN',
        },
        geometry: { type: 'Point', coordinates: [c.longitude, c.latitude] },
      };
    });

  const geoJson = { type: 'FeatureCollection', features };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [78.6569, 11.1271],
      zoom: 6.2,
      pitch: 60,
      bearing: 0,
      attributionControl: false,
    });

    map.addControl(new NavigationControl({ showCompass: true }), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('issues', { type: 'geojson', data: geoJson });

      map.addLayer({
        id: 'issue-extrusions',
        type: 'fill-extrusion',
        source: 'issues',
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.85,
        },
      });

      map.addLayer({
        id: 'issue-glow',
        type: 'circle',
        source: 'issues',
        paint: {
          'circle-radius': 6,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.9,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.on('click', 'issue-extrusions', (e) => {
        if (e.features && e.features.length) {
          const p = e.features[0].properties;
          setSelected(p);
          if (onSelectCluster) onSelectCluster(p);
        }
      });

      map.on('move', () => {
        setPitch(Math.round(map.getPitch()));
      });

      setMapReady(true);
    });

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render source when data changes
  useEffect(() => {
    if (mapReady && mapRef.current && mapRef.current.getSource('issues')) {
      mapRef.current.getSource('issues').setData(geoJson);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, clusters]);

  const resetView = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: [78.6569, 11.1271], zoom: 6.2, pitch: 60, bearing: 0, duration: 1200 });
  };

  const stats = {
    total: data.length,
    critical: data.filter(c => (c.intensity || 0) >= 0.85).length,
    high: data.filter(c => (c.intensity || 0) >= 0.70 && (c.intensity || 0) < 0.85).length,
    medium: data.filter(c => (c.intensity || 0) >= 0.50 && (c.intensity || 0) < 0.70).length,
    low: data.filter(c => (c.intensity || 0) < 0.50).length,
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: 'var(--sp-4) var(--sp-5)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-2">
          <div style={{ width: 32, height: 32, borderRadius: 'var(--r-md)', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={15} color="#fbd77a" />
          </div>
          <div>
            <div className="bold body-sm">3D Civic Pressure Map</div>
            <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>Column height = issue intensity · drag to tilt</div>
          </div>
        </div>
        <button onClick={resetView} className="btn btn-ghost btn-sm"><RotateCw size={13} /> Reset view</button>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: 'var(--sp-3) var(--sp-5)', borderBottom: '1px solid var(--border)', background: 'var(--bg-alt)' }}>
        {[
          { l: 'Total', v: stats.total, c: 'var(--ink)', icon: TrendingUp },
          { l: 'Critical', v: stats.critical, c: SEVERITY.critical.color, icon: AlertTriangle },
          { l: 'High', v: stats.high, c: SEVERITY.high.color, icon: AlertTriangle },
          { l: 'Resolved', v: data.filter(c => (c.status || '').toUpperCase() === 'RESOLVED').length, c: SEVERITY.low.color, icon: CheckCircle2 },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center gap-2">
              <Icon size={14} color={s.c} />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1, color: s.c }}>{s.v}</div>
                <div className="body-xs" style={{ color: 'var(--ink-muted)' }}>{s.l}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map */}
      <div ref={containerRef} style={{ width: '100%', height: 480, background: '#0b0f19' }} />

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(10,14,25,.85)', borderRadius: 'var(--r-md)', padding: '10px 12px', zIndex: 10, backdropFilter: 'blur(6px)' }}>
        <div className="label-sm" style={{ color: '#fbd77a', marginBottom: 6 }}>Severity</div>
        {Object.values(SEVERITY).map((s) => (
          <div key={s.label} className="flex items-center gap-2 body-xs" style={{ color: '#e5e7eb', marginBottom: 3 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block' }} />
            {s.label} <span style={{ color: '#9ca3af' }}>≥{Math.round(s.min * 100)}%</span>
          </div>
        ))}
      </div>

      {/* Selected cluster card */}
      {selected && (
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: 'rgba(10,14,25,.92)', borderRadius: 'var(--r-md)', padding: '12px 14px', maxWidth: 260, backdropFilter: 'blur(6px)' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <span className="badge" style={{ background: selected.color, color: '#fff', border: 'none' }}>{selected.severity}</span>
            <span className="body-xs" style={{ color: '#9ca3af' }}>{selected.reports} reports</span>
          </div>
          <div className="bold body-sm" style={{ color: '#fff' }}>{selected.category}</div>
          <div className="body-xs" style={{ color: '#9ca3af' }}>{selected.ward}</div>
          <div className="body-xs" style={{ color: '#fbd77a', marginTop: 4 }}>Intensity {Math.round(selected.intensity * 100)}% · {selected.status}</div>
        </div>
      )}

      {/* Pitch hint */}
      <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 10, background: 'rgba(10,14,25,.7)', borderRadius: 'var(--r-md)', padding: '6px 10px' }}>
        <span className="body-xs" style={{ color: '#9ca3af' }}>Tilt {pitch}°</span>
      </div>
    </div>
  );
}
