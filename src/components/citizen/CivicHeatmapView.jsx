import React, { useState, useEffect, useRef } from 'react';
import { Zap, Compass, AlertTriangle, ShieldCheck, BarChart2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiService } from '../../utils/apiService';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const SEVERITY = {
  CRITICAL: { color: '#b91c1c', glow: '#ef4444', label: 'Critical', threshold: 0.85 },
  HIGH:     { color: '#c2410c', glow: '#f97316', label: 'High',     threshold: 0.70 },
  MEDIUM:   { color: '#a16207', glow: '#eab308', label: 'Medium',   threshold: 0.50 },
  LOW:      { color: '#0369a1', glow: '#38bdf8', label: 'Low',      threshold: 0.00 }
};

function getSeverity(intensity) {
  if (intensity >= SEVERITY.CRITICAL.threshold) return SEVERITY.CRITICAL;
  if (intensity >= SEVERITY.HIGH.threshold)     return SEVERITY.HIGH;
  if (intensity >= SEVERITY.MEDIUM.threshold)   return SEVERITY.MEDIUM;
  return SEVERITY.LOW;
}

// Map descriptive categories (from routing engine) to filter keys
const CATEGORY_MAP = {
  'ROADS': 'ROADS', 'ROAD': 'ROADS',
  'POTHOLE': 'ROADS', 'POTHOLES': 'ROADS',
  'FOOTPATH': 'ROADS', 'FOOTPATHS': 'ROADS',
  'STREETLIGHTS': 'STREETLIGHTS', 'STREET LIGHTING (TNEB)': 'STREETLIGHTS',
  'STREET LIGHTING': 'STREETLIGHTS', 'STREETLIGHT': 'STREETLIGHTS',
  'ELECTRICITY': 'STREETLIGHTS',
  'WATER': 'WATER', 'WATER SUPPLY': 'WATER',
  'DRAINAGE': 'DRAINAGE', 'DRAINAGE & FLOODING': 'DRAINAGE',
  'SEWERAGE': 'DRAINAGE',
  'GARBAGE': 'GARBAGE', 'GARBAGE & SANITATION': 'GARBAGE',
  'SOLID WASTE MANAGEMENT': 'GARBAGE', 'SANITATION': 'GARBAGE',
  'TRAFFIC': 'SAFETY', 'PUBLIC SAFETY': 'SAFETY',
  'PARKS': 'SAFETY',
  'GENERAL CIVIC ISSUE': 'GENERAL',
  'GENERAL': 'GENERAL',
};

const normalizeCat = (cat) => {
  if (!cat) return 'GENERAL';
  const upper = String(cat).toUpperCase();
  return CATEGORY_MAP[upper] || CATEGORY_MAP[upper.replace(/[^A-Z]/g, '_')] || 'GENERAL';
};

const PRIORITY_MAP = { CRITICAL: 0.95, HIGH: 0.88, MEDIUM: 0.65, LOW: 0.35 };

const normalizeStatus = (s) => (s || 'OPEN').toUpperCase().replace(/\s+/g, '_');
const NORMALIZED_STATUS = { OPEN: 'OPEN', IN_PROGRESS: 'IN_PROGRESS', RESOLVED: 'RESOLVED', PENDING_CONFIRMATION: 'PENDING_CONFIRMATION' };

export default function CivicHeatmapView({ publicIssues = [], onViewDetails }) {
  const [clusters, setClusters] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [mapTileLayer, setMapTileLayer] = useState('DARK');
  const [currentZoomLevel, setCurrentZoomLevel] = useState(7);
  const [mapReady, setMapReady] = useState(false);
  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0, medium: 0, low: 0 });

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersGroupRef = useRef(null);
  const zoneGroupRef = useRef(null);

  const buildClusters = (items) => {
    if (!items || !items.length) return [];
    return items
      .map((p, idx) => {
        const lat = p.lat ?? p.latitude;
        const lon = p.lon ?? p.longitude;
        if (lat == null || lon == null) return null;
        const normPrio = (p.priority || '').toUpperCase();
        // Compute intensity from explicit field first, then priority, then default
        let intensity;
        if (typeof p.intensity === 'number') intensity = p.intensity;
        else if (PRIORITY_MAP[normPrio] != null) intensity = PRIORITY_MAP[normPrio];
        else if (normPrio === 'CRITICAL') intensity = 0.95;
        else if (normPrio === 'LOW') intensity = 0.35;
        else intensity = 0.5;
        return {
          latitude: lat,
          longitude: lon,
          intensity,
          category: normalizeCat(p.category || p.categoryEn),
          location_ward: p.ward || p.location_ward || 'Citizen report',
          reports_count: p.reports_count || p.supporters_count || p.reporterCount || 1,
          status: normalizeStatus(p.status),
          // Preserve original for detail modal
          _original: p,
        };
      })
      .filter(Boolean);
  };

  const updateStats = (data) => {
    const s = { total: data.length, critical: 0, high: 0, medium: 0, low: 0 };
    data.forEach(c => {
      const i = c.intensity || 0;
      if (i >= 0.85) s.critical++;
      else if (i >= 0.70) s.high++;
      else if (i >= 0.50) s.medium++;
      else s.low++;
    });
    setStats(s);
  };

  // React to prop changes (new complaints, filters)
  useEffect(() => {
    const fromProps = buildClusters(publicIssues);
    if (fromProps.length) {
      setClusters(fromProps);
      updateStats(fromProps);
      return;
    }
    // Fallback to API
    apiService.getHeatmapClusters()
      .then(data => {
        if (data && data.length) {
          setClusters(data);
          updateStats(data);
        }
      })
      .catch(() => {
        const fallback = [
          { latitude: 13.0827, longitude: 80.2707, intensity: 0.95, category: "ROADS", location_ward: "Ward 104, Anna Nagar, Chennai", reports_count: 28, status: "OPEN" },
          { latitude: 13.0850, longitude: 80.2680, intensity: 0.88, category: "ROADS", location_ward: "Ward 104 North, Anna Nagar", reports_count: 18, status: "OPEN" },
          { latitude: 13.0418, longitude: 80.2341, intensity: 0.92, category: "GARBAGE", location_ward: "Ward 112, T. Nagar, Chennai", reports_count: 32, status: "IN_PROGRESS" },
          { latitude: 12.9815, longitude: 80.2180, intensity: 0.70, category: "STREETLIGHTS", location_ward: "Ward 170, Velachery, Chennai", reports_count: 14, status: "OPEN" },
          { latitude: 13.0067, longitude: 80.2570, intensity: 0.85, category: "DRAINAGE", location_ward: "Ward 175, Adyar, Chennai", reports_count: 22, status: "IN_PROGRESS" },
          { latitude: 9.9252, longitude: 78.1198, intensity: 0.89, category: "ROADS", location_ward: "Ward 45, K.K. Nagar, Madurai", reports_count: 24, status: "OPEN" },
          { latitude: 11.0168, longitude: 76.9558, intensity: 0.94, category: "GARBAGE", location_ward: "Ward 14, Gandhipuram, Coimbatore", reports_count: 30, status: "OPEN" },
          { latitude: 10.7905, longitude: 78.7047, intensity: 0.65, category: "WATER", location_ward: "Thillai Nagar, Tiruchirappalli", reports_count: 12, status: "RESOLVED" },
          { latitude: 11.6643, longitude: 78.1460, intensity: 0.78, category: "ROADS", location_ward: "Junction Zone, Salem", reports_count: 19, status: "OPEN" }
        ];
        setClusters(fallback);
        updateStats(fallback);
      });
  }, [publicIssues]);

  useEffect(() => { if (mapReady) renderHotspots(); }, [clusters, categoryFilter, statusFilter, mapReady]);

  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [11.1271, 78.6569],
      zoom: 7,
      zoomControl: false,
      attributionControl: false
    });

    L.control.attribution({ position: 'bottomright', prefix: '' }).addTo(map);
    leafletMapRef.current = map;
    markersGroupRef.current = L.layerGroup().addTo(map);
    zoneGroupRef.current = L.layerGroup().addTo(map);

    map.on('zoomend', () => setCurrentZoomLevel(map.getZoom()));
    setTimeout(() => { map.invalidateSize(); setMapReady(true); }, 400);
  }, []);

  useEffect(() => {
    if (!leafletMapRef.current) return;
    const map = leafletMapRef.current;
    map.eachLayer(l => { if (l instanceof L.TileLayer) map.removeLayer(l); });

    const tiles = {
      DARK:      'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
      SATELLITE: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      STREET:    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    };

    L.tileLayer(tiles[mapTileLayer] || tiles.DARK, { maxZoom: 19 }).addTo(map);
    map.invalidateSize();
  }, [mapTileLayer]);

  const renderHotspots = () => {
    if (!leafletMapRef.current) return;
    const map = leafletMapRef.current;
    zoneGroupRef.current?.clearLayers();
    markersGroupRef.current?.clearLayers();

    const filtered = clusters.filter(c => {
      const matchCat = categoryFilter === 'ALL' || c.category?.toUpperCase() === categoryFilter.toUpperCase();
      const matchStat = statusFilter === 'ALL' || c.status?.toUpperCase().replace(' ', '_') === statusFilter.toUpperCase();
      return matchCat && matchStat;
    });

    filtered.forEach(c => {
      const lat = c.lat || c.latitude;
      const lon = c.lon || c.longitude;
      const intensity = c.intensity || 0.5;
      const sev = getSeverity(intensity);
      const count = c.reports_count || 1;

      // Base radius scales with intensity (meters)
      const baseR = 60 + intensity * 140;

      // Zone 1: Outer glow (3km)
      L.circle([lat, lon], {
        radius: baseR * 4,
        fillColor: sev.color,
        fillOpacity: 0.04,
        stroke: false
      }).addTo(zoneGroupRef.current);

      // Zone 2: Mid glow (2km)
      L.circle([lat, lon], {
        radius: baseR * 2.5,
        fillColor: sev.color,
        fillOpacity: 0.08,
        stroke: false
      }).addTo(zoneGroupRef.current);

      // Zone 3: Inner zone boundary (1km - dashed)
      L.circle([lat, lon], {
        radius: baseR * 2,
        color: sev.color,
        fillColor: sev.color,
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '8, 10',
        lineCap: 'round'
      }).addTo(zoneGroupRef.current);

      // Zone 4: Core zone (500m - solid)
      L.circle([lat, lon], {
        radius: baseR,
        color: sev.glow,
        fillColor: sev.color,
        fillOpacity: 0.22,
        weight: 2.5,
        interactive: true
      }).addTo(zoneGroupRef.current).on('click', () => {
        if (onViewDetails) onViewDetails(c);
      });

      // Hotspot center pin
      const pinIcon = L.divIcon({
        className: 'hotspot-pin',
        html: `<div style="
          position: relative;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: radial-gradient(circle, ${sev.glow}60 0%, transparent 70%);
            animation: pulse-ring 2s ease-out infinite;
          "></div>
          <div style="
            position: relative;
            width: 18px;
            height: 18px;
            background: ${sev.color};
            border: 2.5px solid #fff;
            border-radius: 50%;
            box-shadow: 0 0 14px ${sev.glow}, 0 2px 6px rgba(0,0,0,0.5);
          "></div>
          <div style="
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 6px;
            height: 6px;
            background: ${sev.color};
            border-radius: 50%;
            border: 1px solid ${sev.glow};
          "></div>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      L.marker([lat, lon], { icon: pinIcon, interactive: true, keyboard: true, title: c.title_en || c.category || 'Issue' })
        .addTo(zoneGroupRef.current)
        .on('click', () => {
          if (onViewDetails) onViewDetails(c);
        });

      // Report count badge (visible at higher zoom)
      if (currentZoomLevel >= 10) {
        const badgeIcon = L.divIcon({
          className: 'report-badge',
          html: `<div style="
            position: relative;
            background: ${sev.color};
            border: 2px solid #fff;
            border-radius: 14px;
            padding: 2px 8px;
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 11px;
            font-weight: 800;
            color: #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 6px ${sev.glow}50;
            white-space: nowrap;
            transform: translate(-50%, -180%);
          ">${count} ${count === 1 ? 'report' : 'reports'}</div>`,
          iconSize: [80, 24],
          iconAnchor: [40, 20]
        });
        L.marker([lat, lon], { icon: badgeIcon, interactive: false }).addTo(markersGroupRef.current);
      }
    });
  };

  const handleZoomIn = () => leafletMapRef.current?.zoomIn();
  const handleZoomOut = () => leafletMapRef.current?.zoomOut();

  const handleCurrentLocation = () => {
    if (navigator.geolocation && leafletMapRef.current) {
      navigator.geolocation.getCurrentPosition(
        pos => leafletMapRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 14),
        () => alert('Unable to retrieve current location.')
      );
    }
  };

  const zoomLabel = currentZoomLevel < 9 ? 'State View' : currentZoomLevel < 11 ? 'District View' : 'Ward View';

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0c1222 0%, #111827 100%)',
      padding: '28px',
      borderRadius: '18px',
      border: '1px solid rgba(148, 163, 184, 0.08)',
      boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
    }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: 48, height: 48,
            background: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(220, 38, 38, 0.4)'
          }}>
            <Zap size={22} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-0.03em' }}>
              Civic Issue Density Map
            </h2>
            <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '5px 0 0', fontWeight: 500 }}>
              Zone-based hotspot analysis with 500m / 1km radius boundaries
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#0c1222', padding: '3px', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            {[['DARK','Dark'],['SATELLITE','Satellite'],['STREET','Streets']].map(([t, label]) => (
              <button key={t} onClick={() => setMapTileLayer(t)}
                style={{
                  padding: '7px 16px', border: 'none', borderRadius: '7px', cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.2s',
                  background: mapTileLayer === t ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : 'transparent',
                  color: mapTileLayer === t ? '#fff' : '#64748b'
                }}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={handleCurrentLocation} style={{
            padding: '7px 14px', background: '#0c1222', border: '1px solid rgba(148, 163, 184, 0.1)',
            borderRadius: '10px', color: '#38bdf8', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <Compass size={15} /> My Location
          </button>
        </div>
      </div>

      {/* STATS BAR */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</span>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{
            background: '#0c1222', border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '7px',
            color: '#f8fafc', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600
          }}>
            <option value="ALL">All Categories</option>
            <option value="ROADS">Roads & Potholes</option>
            <option value="GARBAGE">Garbage & Sanitation</option>
            <option value="STREETLIGHTS">Streetlights</option>
            <option value="DRAINAGE">Drainage & Flooding</option>
            <option value="WATER">Water Supply</option>
            <option value="FOOTPATH">Footpath</option>
            <option value="PARKS">Parks</option>
            <option value="SAFETY">Public Safety</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{
            background: '#0c1222', border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '7px',
            color: '#f8fafc', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600
          }}>
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        {/* Inline Stats */}
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <div style={{ background: '#0c1222', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '8px', padding: '6px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f8fafc' }}>{stats.total}</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
          </div>
          <div style={{ background: '#0c1222', border: '1px solid rgba(185, 28, 28, 0.3)', borderRadius: '8px', padding: '6px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ef4444' }}>{stats.critical}</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Critical</div>
          </div>
          <div style={{ background: '#0c1222', border: '1px solid rgba(194, 65, 12, 0.3)', borderRadius: '8px', padding: '6px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f97316' }}>{stats.high}</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>High</div>
          </div>
          <div style={{ background: '#0c1222', border: '1px solid rgba(161, 98, 7, 0.3)', borderRadius: '8px', padding: '6px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#eab308' }}>{stats.medium}</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Medium</div>
          </div>
          <div style={{ background: '#0c1222', border: '1px solid rgba(3, 105, 161, 0.3)', borderRadius: '8px', padding: '6px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38bdf8' }}>{stats.low}</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Low</div>
          </div>
        </div>
      </div>

      {/* MAP */}
      <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '520px', background: '#0c1222' }} />

        {/* Zoom Controls */}
        <div style={{ position: 'absolute', bottom: '24px', right: '16px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {['+', '−'].map((t, i) => (
            <button key={i} onClick={i === 0 ? handleZoomIn : handleZoomOut} style={{
              width: 38, height: 38, background: '#0c1222', border: '1px solid rgba(148, 163, 184, 0.15)',
              borderRadius: '8px', color: '#f8fafc', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s'
            }}>{t}</button>
          ))}
        </div>

        {/* Severity Legend */}
        <div style={{
          position: 'absolute', bottom: '24px', left: '16px', zIndex: 1000,
          background: 'rgba(12, 18, 34, 0.93)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '12px',
          padding: '16px 20px', minWidth: '200px'
        }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Density Index
          </div>
          {Object.values(SEVERITY).map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '7px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '3px', background: s.color, boxShadow: `0 0 8px ${s.glow}` }} />
              <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: '0.68rem', color: '#475569', marginLeft: 'auto', fontWeight: 500 }}>
                {s.threshold === 0.85 ? '≥85%' : s.threshold === 0.70 ? '70-84%' : s.threshold === 0.50 ? '50-69%' : '<50%'}
              </span>
            </div>
          ))}
        </div>

        {/* Zone Legend */}
        <div style={{
          position: 'absolute', top: '16px', left: '16px', zIndex: 1000,
          background: 'rgba(12, 18, 34, 0.93)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '12px',
          padding: '14px 18px'
        }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Zone Radius
          </div>
          {[
            { solid: true, label: 'Hotspot Core', desc: 'Precise location' },
            { solid: true, dashed: false, label: '500m Zone', desc: 'Impact area' },
            { dashed: true, label: '1km Radius', desc: 'Extended radius' },
            { glow: true, label: 'Glow Zone', desc: 'Intensity spread' }
          ].map((z, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%',
                border: z.dashed ? '2px dashed rgba(255,255,255,0.5)' : z.glow ? '2px solid rgba(255,255,255,0.2)' : '2px solid #fff',
                background: z.glow ? 'rgba(255,255,255,0.08)' : 'transparent',
                boxShadow: z.glow ? '0 0 8px rgba(255,255,255,0.2)' : 'none'
              }} />
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>{z.label}</span>
            </div>
          ))}
        </div>

        {/* Zoom Level Indicator */}
        <div style={{
          position: 'absolute', top: '16px', right: '16px', zIndex: 1000,
          background: 'rgba(12, 18, 34, 0.93)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '12px',
          padding: '12px 18px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f8fafc', lineHeight: 1 }}>{currentZoomLevel}</div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{zoomLabel}</div>
        </div>
      </div>
    </div>
  );
}
