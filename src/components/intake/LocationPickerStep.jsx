import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Compass, CheckCircle2, Navigation } from 'lucide-react';
import L from 'leaflet';
import { TN_DISTRICTS_WARDS } from '../../mockData';

// Fix Leaflet Default Icon Assets Path
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

export default function LocationPickerStep({ locationData, setLocationData, onComplete, language = 'English' }) {
  const [loadingGps, setLoadingGps] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);

  const currentLat = locationData.lat || 13.0827;
  const currentLng = locationData.lng || locationData.lon || 80.2707;
  const currentWard = typeof locationData.ward === 'string' ? locationData.ward : (locationData.ward?.name || '');

  // Initialize Interactive Satellite/Street Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 14,
        zoomControl: true
      });

      // Satellite Imagery Tile Layer
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
      }).addTo(map);

      // Draggable Location Pin Marker
      const marker = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);
      marker.bindPopup('<b>Drag to pick exact defect location</b>').openPopup();

      marker.on('dragend', (e) => {
        const newCoords = e.target.getLatLng();
        setLocationData(prev => ({
          ...prev,
          lat: newCoords.lat,
          lng: newCoords.lng,
          source: 'MAP_PIN'
        }));
        setIsConfirmed(true);
      });

      // Map Click Event to move marker & pick coordinates
      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setLocationData(prev => ({
          ...prev,
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          source: 'MAP_CLICK'
        }));
        setIsConfirmed(true);
      });

      leafletMapRef.current = map;
      markerRef.current = marker;
    }
  }, []);

  // Sync Leaflet map center when coordinates change
  useEffect(() => {
    if (leafletMapRef.current && markerRef.current) {
      leafletMapRef.current.setView([currentLat, currentLng], 15);
      markerRef.current.setLatLng([currentLat, currentLng]);
    }
  }, [currentLat, currentLng]);

  const handleFetchGps = () => {
    setLoadingGps(true);
    if (!('geolocation' in navigator)) { setLoadingGps(false); return; }

    let bestPos = null;
    let watchId = null;
    let settleTimer = null;

    const done = () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (settleTimer) clearTimeout(settleTimer);
    };

    // Use watchPosition to continuously improve accuracy, settle after
    // a high-accuracy reading (< 10m) OR after 8 seconds max
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy;

        // Update UI with this reading
        setLocationData(prev => ({
          ...prev,
          lat,
          lng,
          accuracy: Math.round(acc),
          source: 'LIVE_GPS',
          ward: prev.ward || 'Greater Chennai Corporation (Ward 104 - Anna Nagar)',
        }));

        // Accept this reading if accuracy is good (<10m) or this is the first reading
        if (!bestPos || acc < bestPos.coords.accuracy) {
          bestPos = position;
        }

        // Settle: stop watching once accuracy is good or 8s elapsed
        if (acc < 10 || !settleTimer) {
          settleTimer = setTimeout(() => {
            if (bestPos) {
              const lat = bestPos.coords.latitude;
              const lng = bestPos.coords.longitude;
              setLocationData(prev => ({
                ...prev,
                lat, lng,
                accuracy: Math.round(bestPos.coords.accuracy),
                source: 'LIVE_GPS',
              }));
            }
            setLoadingGps(false);
            setIsConfirmed(true);
            done();
          }, 1500);
        }
      },
      (error) => {
        done();
        setLocationData(prev => ({
          ...prev,
          lat: 13.0827,
          lng: 80.2707,
          accuracy: 500,
          source: 'GPS_FALLBACK',
        }));
        setLoadingGps(false);
        setIsConfirmed(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const selectWardOption = (wardName) => {
    if (!wardName) {
      setLocationData(prev => ({ ...prev, ward: '' }));
      return;
    }
    const selectedObj = TN_DISTRICTS_WARDS.find(item => item.name === wardName);
    setLocationData(prev => ({
      ...prev,
      ward: wardName,
      lat: selectedObj ? selectedObj.lat : prev.lat,
      lng: selectedObj ? selectedObj.lon : prev.lng,
      source: 'MANUAL_WARD'
    }));
    setIsConfirmed(true);
  };

  const handleManualCoordinateChange = (field, val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    setLocationData(prev => ({
      ...prev,
      [field]: num,
      source: 'MANUAL_COORDINATES'
    }));
    setIsConfirmed(true);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
          <MapPin size={22} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {language === 'Tamil' ? 'இடம் & ஆய்வுக்கோவை' : 'Step 4: Live Location & Coordinate Picker'}
          </h3>
        </div>

        <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>
          {locationData.source || 'GPS'}
          {locationData.accuracy ? ` · ±${locationData.accuracy}m` : ''}
        </span>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        {language === 'Tamil'
          ? 'GPS-அடிப்படையில் இடத்தைக் கண்டறியவும், வரைபடத்தில் கிளிக் செய்யவும் அல்லது ஆய்வுக்கோவை இடங்களை உள்ளிடவும்.'
          : 'Detect GPS-based location, click on the map, or type latitude/longitude coordinates. Higher accuracy = better location precision.'}
      </p>

      {/* Primary Live GPS Detect Button */}
      <button
        type="button"
        onClick={handleFetchGps}
        disabled={loadingGps}
        className="glass-btn glass-btn-primary"
        style={{ padding: '12px', justifyContent: 'center', fontSize: '0.9rem' }}
      >
        <Navigation size={18} />
        <span>
          {loadingGps
            ? (language === 'Tamil' ? 'GPS கண்டறிதல்...' : 'Detecting Live GPS...')
            : (language === 'Tamil' ? '📍 GPS இடத்தைக் கண்டறி' : 'Detect Live Device GPS Location')}
        </span>
        {locationData.accuracy && !loadingGps && (
          <span style={{ fontSize: '0.75rem', marginLeft: '6px', color: '#86efac' }}>
            ±{locationData.accuracy}m
          </span>
        )}
      </button>

      {/* Live Esri Satellite Leaflet Map Container */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700, marginBottom: '6px' }}>
          {language === 'Tamil' ? '🗺️ செய்லைட் வரைபடம் (மார்க்கர் இழுக்கவும்)' : '🗺️ Live Satellite Map (Drag marker to pick location):'}
        </label>
        <div
          ref={mapContainerRef}
          style={{
            height: '240px',
            width: '100%',
            borderRadius: '14px',
            border: '2px solid var(--border-color)',
            overflow: 'hidden',
            zIndex: 1
          }}
        />
      </div>

      {/* Manual Latitude & Longitude Input Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {language === 'Tamil' ? 'அட்சரேகை (Latitude):' : 'Latitude Coordinate:'}
          </label>
          <input
            type="number"
            step="any"
            className="glass-input"
            value={currentLat}
            onChange={(e) => handleManualCoordinateChange('lat', e.target.value)}
            placeholder="e.g. 13.0827"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {language === 'Tamil' ? 'தீர்க்கரேகை (Longitude):' : 'Longitude Coordinate:'}
          </label>
          <input
            type="number"
            step="any"
            className="glass-input"
            value={currentLng}
            onChange={(e) => handleManualCoordinateChange('lng', e.target.value)}
            placeholder="e.g. 80.2707"
          />
        </div>
      </div>

      {/* Ward Dropdown Picker */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
          {language === 'Tamil' ? 'வார்டைத் தேர்ந்தெடுக்கவும் (விருப்பம்):' : 'Select Ward (Optional):'}
        </label>
        <select
          className="glass-input"
          value={currentWard}
          onChange={(e) => selectWardOption(e.target.value)}
        >
          <option value="" style={{ background: '#0f172a' }}>
            -- {language === 'Tamil' ? 'வார்டு/மாவட்டம் தேர்வு' : 'Select Ward / District'} --
          </option>
          {TN_DISTRICTS_WARDS.map((wardObj, idx) => (
            <option key={idx} value={wardObj.name} style={{ background: '#0f172a' }}>
              {wardObj.name}
            </option>
          ))}
        </select>
      </div>

      {/* Explicit Location Confirmation Button */}
      <button
        type="button"
        onClick={() => setIsConfirmed(!isConfirmed)}
        className={`glass-btn ${isConfirmed ? 'glass-btn-primary' : ''}`}
        style={{ padding: '12px', justifyContent: 'center', fontSize: '0.9rem' }}
      >
        <CheckCircle2 size={18} color={isConfirmed ? '#ffffff' : '#6ee7b7'} />
        <span>
          {isConfirmed
            ? (language === 'Tamil' ? 'இடம் உறுதிசெய்யப்பட்டது ✓' : 'Location Confirmed ✓')
            : (language === 'Tamil' ? 'இடத்தை உறுதிசெய்ய கிளிக் செய்யவும்' : 'Click to Confirm Location')}
        </span>
      </button>
    </div>
  );
}
