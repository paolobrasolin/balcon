import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import SunCalc from 'suncalc';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TimeResult {
  time: Date;
  azimuth: number;
}

interface Results {
  east: Date[];
  south: Date[];
  west: Date[];
  north: Date[];
}

// Component to handle map updates
const MapUpdater: React.FC<{ lat: number; lon: number; orientation: number }> = ({ lat, lon, orientation }) => {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lon], 18);
  }, [lat, lon, map]);

  return null;
};

const SunlightTimer: React.FC = () => {
  const [lat, setLat] = useState<number>(parseFloat(import.meta.env.PUBLIC_DEFAULT_LAT));
  const [lon, setLon] = useState<number>(parseFloat(import.meta.env.PUBLIC_DEFAULT_LON));
  const [orientation, setOrientation] = useState<number>(parseFloat(import.meta.env.PUBLIC_DEFAULT_ORIENTATION));
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [results, setResults] = useState<Results>({ east: [], south: [], west: [], north: [] });

  const computeTimes = () => {
    const intervalMinutes = 10;
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    const times: TimeResult[] = [];
    for (let d = new Date(start); d <= end; d.setMinutes(d.getMinutes() + intervalMinutes)) {
      const pos = SunCalc.getPosition(d, lat, lon);
      let azimuth = (pos.azimuth * 180 / Math.PI + 180 + orientation) % 360;
      times.push({ time: new Date(d), azimuth });
    }

    const newResults: Results = { east: [], south: [], west: [], north: [] };
    for (const t of times) {
      if (t.azimuth >= 80 && t.azimuth <= 100) newResults.east.push(t.time);
      else if (t.azimuth >= 170 && t.azimuth <= 190) newResults.south.push(t.time);
      else if (t.azimuth >= 260 && t.azimuth <= 280) newResults.west.push(t.time);
      else if ((t.azimuth >= 350 && t.azimuth <= 360) || (t.azimuth >= 0 && t.azimuth <= 10)) newResults.north.push(t.time);
    }

    setResults(newResults);
  };

  // Compute times on initial load
  useEffect(() => {
    computeTimes();
  }, []); // Only run once on mount

  const formatTimes = (times: Date[]): string => {
    return times.map(t => t.toTimeString().slice(0, 5)).join(', ') || 'No direct light';
  };

  const getPolygonCorners = () => {
    const size = 0.0001; // ~5 meters
    const angleRad = orientation * Math.PI / 180;

    const corners = [
      [0.5, 0.5],
      [-0.5, 0.5],
      [-0.5, -0.5],
      [0.5, -0.5]
    ].map(([dx, dy]) => {
      const dxRot = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
      const dyRot = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
      return [lat + dyRot * size, lon + dxRot * size] as [number, number];
    });

    return corners;
  };

  return (
    <div>
      <h1>Sunlight Window Timer</h1>

      <div style={{ marginBottom: '1em' }}>
        <label style={{ display: 'block', margin: '1em 0 0.5em' }}>
          Latitude:
          <input
            type="number"
            step="0.0001"
            value={lat}
            onChange={(e) => setLat(parseFloat(e.target.value))}
            style={{ width: '100%', padding: '0.5em' }}
          />
        </label>

        <label style={{ display: 'block', margin: '1em 0 0.5em' }}>
          Longitude:
          <input
            type="number"
            step="0.0001"
            value={lon}
            onChange={(e) => setLon(parseFloat(e.target.value))}
            style={{ width: '100%', padding: '0.5em' }}
          />
        </label>

        <label style={{ display: 'block', margin: '1em 0 0.5em' }}>
          Orientation (degrees from North):
          <input
            type="number"
            step="1"
            value={orientation}
            onChange={(e) => setOrientation(parseFloat(e.target.value))}
            style={{ width: '100%', padding: '0.5em' }}
          />
        </label>

        <label style={{ display: 'block', margin: '1em 0 0.5em' }}>
          Date:
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: '100%', padding: '0.5em' }}
          />
        </label>
      </div>

      <button
        onClick={computeTimes}
        style={{
          marginTop: '1em',
          padding: '0.5em 1em',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
      >
        Compute Times
      </button>

      <div className="results-container">
        {Object.entries(results).map(([direction, times]) => (
          <div key={direction}>
            <strong>{direction.toUpperCase()} Window:</strong> {formatTimes(times)}
          </div>
        ))}
      </div>

      <div style={{ height: '400px', marginTop: '1em' }}>
        <MapContainer
          center={[lat, lon]}
          zoom={18}
          style={{ height: '100%', width: '100%' }}
        >
          <MapUpdater lat={lat} lon={lon} orientation={orientation} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <Marker position={[lat, lon]} />
          <Polygon
            positions={getPolygonCorners()}
            pathOptions={{
              color: 'red',
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.2
            }}
          />
        </MapContainer>
      </div>
    </div>
  );
};

export default SunlightTimer;
