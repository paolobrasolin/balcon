import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import SunCalc from 'suncalc';
import 'leaflet/dist/leaflet.css';
import {
  Typography,
  TextField,
  Paper,
  Box,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import SunRays from './SunRays';
import SunIntensityBar from './SunIntensityBar';
import SunIntensityAxis from './SunIntensityAxis';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});



interface SunPositionData {
  time: Date;
  position: {
    azimuth: number; // in radians
    altitude: number; // in radians
  };
}



// Component to handle map updates
const MapUpdater: React.FC<{ lat: number; lon: number; azm: number }> = ({ lat, lon, azm }) => {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lon], 18);
  }, [lat, lon, map]);

  return null;
};
const SunlightTimer: React.FC = () => {
  const [lat, setLat] = useState<number>(parseFloat(import.meta.env.PUBLIC_DEFAULT_LAT));
  const [lon, setLon] = useState<number>(parseFloat(import.meta.env.PUBLIC_DEFAULT_LON));
  const [azm, setAzm] = useState<number>(parseFloat(import.meta.env.PUBLIC_DEFAULT_AZM));
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sunPositionData, setSunPositionData] = useState<SunPositionData[]>([]);
  const [sunTimes, setSunTimes] = useState<{ sunrise: Date; sunset: Date } | null>(null);

  const computeSunPositionData = () => {
    const intervalMinutes = 15;
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

  // Compute sun position data on initial load and when date changes
  useEffect(() => {
    computeSunPositionData();
  }, [date]); // Run when date changes

  const getPolygonCorners = () => {
    const sizeMeters = 10; // 10 meter square
    const orientationRad = - azm * Math.PI / 180;

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
      const dxRot = dx * Math.cos(orientationRad) - dy * Math.sin(orientationRad);
      const dyRot = dx * Math.sin(orientationRad) + dy * Math.cos(orientationRad);

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
        balcón
      </Typography>

      {/* Inputs and Map side by side */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, mb: 3, alignItems: { xs: 'stretch', sm: 'stretch' } }}>
        {/* Inputs stacked vertically */}
        <Paper elevation={3} sx={{ p: 3, width: { xs: '100%', sm: 300 }, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>
            Settings
          </Typography>
          <Divider sx={{ mb: 4, mt: 1 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            <TextField
              fullWidth
              label="Latitude"
              type="number"
              inputProps={{
                step: 0.0001,
                min: -90,
                max: 90
              }}
              value={lat}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= -90 && value <= 90) {
                  setLat(value);
                }
              }}
              helperText="Range: -90° (S) to +90° (N)"
            />
            <TextField
              fullWidth
              label="Longitude"
              type="number"
              inputProps={{
                step: 0.0001,
                min: -180,
                max: 180
              }}
              value={lon}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= -180 && value <= 180) {
                  setLon(value);
                }
              }}
              helperText="Range: -180° (W) to +180° (E)"
            />
            <TextField
              fullWidth
              label="Northern side azimuth"
              type="number"
              inputProps={{
                step: 1,
                min: -45,
                max: 45
              }}
              value={azm}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= -45 && value <= 45) {
                  setAzm(value);
                }
              }}
              helperText="Range: -45° (NW) to +45° (NE)"
            />
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Paper>

        {/* Map */}
        <Paper elevation={3} sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 2, minHeight: { xs: 400, sm: 'auto' } }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">
              Location map and sun position
            </Typography>
          </Box>
          <Box sx={{ width: '100%', height: { xs: 356, sm: '100%' } }}>
            <MapContainer
              center={[lat, lon]}
              zoom={18}
              style={{ height: '100%', width: '100%' }}
            >
              <MapUpdater lat={lat} lon={lon} azm={-azm} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <Marker position={[lat, lon]} />
              <SunRays lat={lat} lon={lon} date={date} />
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
            </MapContainer>
          </Box>
        </Paper>
      </Box>

      {/* Intensity Diagram - full width */}
      {sunPositionData.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sunlight intensity by surface
            </Typography>
            <Divider sx={{ mb: 4, mt: 1 }} />

            {/* Intensity bars */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <SunIntensityAxis sunTimes={sunTimes} />
              <SunIntensityBar
                sunPositions={sunPositionData}
                color="#FFD300"
                sideAzimuth={(270 - azm) * Math.PI / 180}
                surfaceAltitude={0}
                label="East"
              />
              <SunIntensityBar
                sunPositions={sunPositionData}
                color="#FF0000"
                sideAzimuth={(0 - azm) * Math.PI / 180}
                surfaceAltitude={0}
                label="South"
              />
              <SunIntensityBar
                sunPositions={sunPositionData}
                color="#3914AF"
                sideAzimuth={(90 - azm) * Math.PI / 180}
                surfaceAltitude={0}
                label="West"
              />
              <SunIntensityBar
                sunPositions={sunPositionData}
                color="#00CC00"
                sideAzimuth={(180 - azm) * Math.PI / 180}
                surfaceAltitude={0}
                label="North"
              />
              <SunIntensityBar
                sunPositions={sunPositionData}
                color="#FFFFFF"
                sideAzimuth={0}
                surfaceAltitude={Math.PI / 2}
                label="Roof"
              />
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SunlightTimer;
