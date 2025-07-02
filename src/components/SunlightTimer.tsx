import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import SunCalc from 'suncalc';
import 'leaflet/dist/leaflet.css';
import {
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { Calculate } from '@mui/icons-material';
import SunRays from './SunRays';
import SunIntensityBar from './SunIntensityBar';

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

interface SunPositionData {
  time: Date;
  position: {
    azimuth: number; // in radians
    altitude: number; // in radians
  };
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
  const [sunPositionData, setSunPositionData] = useState<SunPositionData[]>([]);
  const [sunTimes, setSunTimes] = useState<{ sunrise: Date; sunset: Date } | null>(null);

  const computeSunPositionData = () => {
    const intervalMinutes = 10;
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    // Get sunrise and sunset times
    const times = SunCalc.getTimes(selectedDate, lat, lon);
    setSunTimes({
      sunrise: times.sunrise,
      sunset: times.sunset
    });

    const sunPositions: SunPositionData[] = [];
    for (let d = new Date(start); d <= end; d.setMinutes(d.getMinutes() + intervalMinutes)) {
      const position = SunCalc.getPosition(d, lat, lon);
      sunPositions.push({
        time: new Date(d),
        position: {
          azimuth: position.azimuth,
          altitude: position.altitude
        }
      });
    }

    setSunPositionData(sunPositions);
  };

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
    computeSunPositionData(); // Also compute sun position data
  };

  // Compute times on initial load and when date changes
  useEffect(() => {
    computeTimes();
  }, [date]); // Run when date changes

  const formatTimes = (times: Date[]): string => {
    return times.map(t => t.toTimeString().slice(0, 5)).join(', ') || 'No direct light';
  };

  const getPolygonCorners = () => {
    const sizeMeters = 10; // 10 meter square
    const angleRad = orientation * Math.PI / 180;

    // Convert meters to lat/lon offsets
    // 1 degree latitude ≈ 111,320 meters
    // 1 degree longitude ≈ 111,320 * cos(latitude) meters
    const latOffset = sizeMeters / 111320;
    const lonOffset = sizeMeters / (111320 * Math.cos(lat * Math.PI / 180));

    const corners = [
      [0.5, 0.5],
      [-0.5, 0.5],
      [-0.5, -0.5],
      [0.5, -0.5]
    ].map(([dx, dy]) => {
      // Apply rotation
      const dxRot = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
      const dyRot = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);

      // Convert to lat/lon coordinates
      const newLat = lat + dyRot * latOffset;
      const newLon = lon + dxRot * lonOffset;

      return [newLat, newLon] as [number, number];
    });

    return corners;
  };

  const getSidePolygons = () => {
    const corners = getPolygonCorners();

    // Define the sides with their colors
    const sides = [
      { name: 'east', color: '#FFD300', positions: [corners[0], corners[3]] },
      { name: 'south', color: '#FF0000', positions: [corners[3], corners[2]] },
      { name: 'west', color: '#3914AF', positions: [corners[2], corners[1]] },
      { name: 'north', color: '#00CC00', positions: [corners[1], corners[0]] }
    ];

    return sides;
  };

  return (
    <Box>
      <Typography variant="h2" component="h1" gutterBottom sx={{ mb: 4 }}>
        Sunlight Window Timer
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
            <TextField
              fullWidth
              label="Latitude"
              type="number"
              inputProps={{ step: 0.0001 }}
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value))}
            />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
            <TextField
              fullWidth
              label="Longitude"
              type="number"
              inputProps={{ step: 0.0001 }}
              value={lon}
              onChange={(e) => setLon(parseFloat(e.target.value))}
            />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
            <TextField
              fullWidth
              label="Orientation (degrees from North)"
              type="number"
              inputProps={{ step: 1 }}
              value={orientation}
              onChange={(e) => setOrientation(parseFloat(e.target.value))}
            />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={computeTimes}
            startIcon={<Calculate />}
          >
            Compute Times
          </Button>
        </Box>
      </Paper>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Results
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {Object.entries(results).map(([direction, times]) => (
              <Box key={direction} sx={{ flex: '1 1 200px', minWidth: 0 }}>
                <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                  {direction.toUpperCase()} Window:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                  {formatTimes(times)}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Intensity Diagram */}
      {sunPositionData.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sunlight Intensity by Side
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Legend */}
            {sunTimes && (
              <Box sx={{ mb: 2, display: 'flex', gap: 3, fontSize: '0.75rem', color: 'text.secondary' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, backgroundColor: '#ff9800', borderRadius: 1 }} />
                  <span>Sunrise: {sunTimes.sunrise.toTimeString().slice(0, 5)}</span>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, backgroundColor: '#f57c00', borderRadius: 1 }} />
                  <span>Sunset: {sunTimes.sunset.toTimeString().slice(0, 5)}</span>
                </Box>
              </Box>
            )}
            <Box sx={{ height: 200, position: 'relative' }}>
              {/* Time axis labels */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 1,
                px: 2,
                fontSize: '0.75rem',
                color: 'text.secondary'
              }}>
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:59</span>
              </Box>

              {/* Sunrise/Sunset markers */}
              {sunTimes && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 20,
                  pointerEvents: 'none',
                  zIndex: 1
                }}>
                  {/* Sunrise marker */}
                  <Box sx={{
                    position: 'absolute',
                    left: `${((sunTimes.sunrise.getHours() * 60 + sunTimes.sunrise.getMinutes()) / (24 * 60)) * 100}%`,
                    width: 2,
                    height: '100%',
                    backgroundColor: '#ff9800',
                    transform: 'translateX(-50%)'
                  }} />
                  {/* Sunset marker */}
                  <Box sx={{
                    position: 'absolute',
                    left: `${((sunTimes.sunset.getHours() * 60 + sunTimes.sunset.getMinutes()) / (24 * 60)) * 100}%`,
                    width: 2,
                    height: '100%',
                    backgroundColor: '#f57c00',
                    transform: 'translateX(-50%)'
                  }} />
                </Box>
              )}

              {/* Intensity bars */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: 150 }}>
                <SunIntensityBar
                  sunPositions={sunPositionData}
                  color="#FFD300"
                  sideAzimuth={90 + orientation} // East side
                  label="East"
                />
                <SunIntensityBar
                  sunPositions={sunPositionData}
                  color="#FF0000"
                  sideAzimuth={180 + orientation} // South side
                  label="South"
                />
                <SunIntensityBar
                  sunPositions={sunPositionData}
                  color="#3914AF"
                  sideAzimuth={270 + orientation} // West side
                  label="West"
                />
                <SunIntensityBar
                  sunPositions={sunPositionData}
                  color="#00CC00"
                  sideAzimuth={0 + orientation} // North side
                  label="North"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Paper elevation={3} sx={{ height: 400, overflow: 'hidden', borderRadius: 2 }}>
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
          {getSidePolygons().map((side) => (
            <Polyline
              key={side.name}
              positions={side.positions}
              pathOptions={{
                color: side.color,
                weight: 6,
                opacity: 0.8
              }}
            />
          ))}
          <SunRays lat={lat} lon={lon} date={date} />
        </MapContainer>
      </Paper>
    </Box>
  );
};

export default SunlightTimer;
