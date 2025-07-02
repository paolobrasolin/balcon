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

interface IntensityResult {
  time: Date;
  east: number;
  south: number;
  west: number;
  north: number;
}

/**
 * Calculate sunlight intensity for each side of the square
 * @param lat Latitude
 * @param lon Longitude
 * @param orientation Orientation in degrees from North
 * @param dateTime Date and time to calculate for
 * @returns Object with intensity values for each side (0-1, where 1 is maximum intensity)
 */
const calculateSunlightIntensity = (
  lat: number,
  lon: number,
  orientation: number,
  dateTime: Date
): { east: number; south: number; west: number; north: number } => {
  // Get sun position
  const sunPos = SunCalc.getPosition(dateTime, lat, lon);

  // Convert sun position to 3D direction vector
  // SunCalc returns azimuth (0-360°) and altitude (0-90°)
  const azimuthRad = sunPos.azimuth; // Already in radians, 0 = North, π/2 = East
  const altitudeRad = sunPos.altitude; // Already in radians, 0 = horizon, π/2 = zenith

  // Convert to 3D direction vector (x, y, z)
  // x = east, y = north, z = up
  const sunDirection = {
    x: Math.sin(azimuthRad) * Math.cos(altitudeRad),
    y: Math.cos(azimuthRad) * Math.cos(altitudeRad),
    z: Math.sin(altitudeRad)
  };

  // Calculate surface normals for each side
  // Orientation is degrees from North, so we need to rotate the coordinate system
  const orientationRad = (orientation * Math.PI) / 180;

  // Surface normals pointing outward from each side
  // East side: points east (positive x in rotated coordinates)
  const eastNormal = {
    x: Math.cos(orientationRad),
    y: -Math.sin(orientationRad),
    z: 0
  };

  // South side: points south (negative y in rotated coordinates)
  const southNormal = {
    x: -Math.sin(orientationRad),
    y: -Math.cos(orientationRad),
    z: 0
  };

  // West side: points west (negative x in rotated coordinates)
  const westNormal = {
    x: -Math.cos(orientationRad),
    y: Math.sin(orientationRad),
    z: 0
  };

  // North side: points north (positive y in rotated coordinates)
  const northNormal = {
    x: Math.sin(orientationRad),
    y: Math.cos(orientationRad),
    z: 0
  };

  // Calculate dot products (intensity = dot product of sun direction and surface normal)
  const dotProduct = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  };

  const eastIntensity = Math.max(0, dotProduct(sunDirection, eastNormal));
  const southIntensity = Math.max(0, dotProduct(sunDirection, southNormal));
  const westIntensity = Math.max(0, dotProduct(sunDirection, westNormal));
  const northIntensity = Math.max(0, dotProduct(sunDirection, northNormal));

  return {
    east: eastIntensity,
    south: southIntensity,
    west: westIntensity,
    north: northIntensity
  };
};

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
  const [intensityData, setIntensityData] = useState<IntensityResult[]>([]);
  const [sunTimes, setSunTimes] = useState<{ sunrise: Date; sunset: Date } | null>(null);

  const computeIntensityData = () => {
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

    const intensityResults: IntensityResult[] = [];
    for (let d = new Date(start); d <= end; d.setMinutes(d.getMinutes() + intervalMinutes)) {
      const intensity = calculateSunlightIntensity(lat, lon, orientation, d);
      intensityResults.push({
        time: new Date(d),
        ...intensity
      });
    }

    setIntensityData(intensityResults);
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
    computeIntensityData(); // Also compute intensity data
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
      {intensityData.length > 0 && (
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
                {[
                  { key: 'east', label: 'East', color: '#FFD300' },
                  { key: 'south', label: 'South', color: '#FF0000' },
                  { key: 'west', label: 'West', color: '#3914AF' },
                  { key: 'north', label: 'North', color: '#00CC00' }
                ].map(({ key, label, color }) => (
                  <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ width: 40, fontSize: '0.75rem' }}>
                      {label}
                    </Typography>
                    <Box sx={{
                      flex: 1,
                      height: 20,
                      position: 'relative',
                      backgroundColor: '#f5f5f5',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}>
                      {intensityData.map((data, index) => {
                        const intensity = data[key as keyof typeof data] as number;
                        const width = 100 / intensityData.length;
                        const opacity = Math.min(intensity * 2, 1); // Scale intensity for better visibility

                        return (
                          <Box
                            key={index}
                            sx={{
                              position: 'absolute',
                              left: `${(index / intensityData.length) * 100}%`,
                              width: `${width}%`,
                              height: '100%',
                              backgroundColor: color,
                              opacity: opacity,
                              transition: 'opacity 0.2s'
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                ))}
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
