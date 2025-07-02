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
    const orientationRad = - orientation * Math.PI / 180;

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
        Sunlight Window Timer
      </Typography>

      {/* Inputs and Map side by side */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        {/* Inputs stacked vertically */}
        <Paper elevation={3} sx={{ p: 3, width: 300, flexShrink: 0 }}>
          <Typography variant="h6" gutterBottom>
            Location & Settings
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Latitude"
              type="number"
              inputProps={{ step: 0.0001 }}
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value))}
            />
            <TextField
              fullWidth
              label="Longitude"
              type="number"
              inputProps={{ step: 0.0001 }}
              value={lon}
              onChange={(e) => setLon(parseFloat(e.target.value))}
            />
            <TextField
              fullWidth
              label="Orientation (degrees from North)"
              type="number"
              inputProps={{ step: 1 }}
              value={orientation}
              onChange={(e) => setOrientation(parseFloat(e.target.value))}
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
        <Paper elevation={3} sx={{ height: 400, overflow: 'hidden', borderRadius: 2, flex: 1 }}>
          <MapContainer
            center={[lat, lon]}
            zoom={18}
            style={{ height: '100%', width: '100%' }}
          >
            <MapUpdater lat={lat} lon={lon} orientation={-orientation} />
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

      {/* Intensity Diagram - full width */}
      {sunPositionData.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sunlight Intensity by Side
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Intensity bars */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <SunIntensityAxis sunTimes={sunTimes} />
              <SunIntensityBar
                sunPositions={sunPositionData}
                color="#FFD300"
                sideAzimuth={(270 - orientation) * Math.PI / 180}
                label="East"
              />
              <SunIntensityBar
                sunPositions={sunPositionData}
                color="#FF0000"
                sideAzimuth={(0 - orientation) * Math.PI / 180}
                label="South"
              />
              <SunIntensityBar
                sunPositions={sunPositionData}
                color="#3914AF"
                sideAzimuth={(90 - orientation) * Math.PI / 180}
                label="West"
              />
              <SunIntensityBar
                sunPositions={sunPositionData}
                color="#00CC00"
                sideAzimuth={(180 - orientation) * Math.PI / 180}
                label="North"
              />
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SunlightTimer;
