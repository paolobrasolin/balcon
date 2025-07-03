import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SunRays from './SunRays';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map updates
const MapUpdater: React.FC<{ lat: number; lon: number }> = ({ lat, lon }) => {
  const map = useMap();

  React.useEffect(() => {
    map.setView([lat, lon], 18);
  }, [lat, lon, map]);

  return null;
};

interface LocationMapProps {
  lat: number;
  lon: number;
  azm: number;
  date: string;
}

const LocationMap: React.FC<LocationMapProps> = ({ lat, lon, azm, date }) => {
  const getSidePolygons = () => {
    const sizeMeters = 10; // 10 meter square
    const orientationRad = (-azm * Math.PI) / 180;

    // Convert meters to lat/lon offsets
    // 1 degree latitude ≈ 111,320 meters
    // 1 degree longitude ≈ 111,320 * cos(latitude) meters
    const latOffset = sizeMeters / 111320;
    const lonOffset = sizeMeters / (111320 * Math.cos((lat * Math.PI) / 180));

    const corners = [
      [0.5, 0.5],
      [-0.5, 0.5],
      [-0.5, -0.5],
      [0.5, -0.5],
    ].map(([dx, dy]) => {
      // Apply rotation
      const dxRot = dx * Math.cos(orientationRad) - dy * Math.sin(orientationRad);
      const dyRot = dx * Math.sin(orientationRad) + dy * Math.cos(orientationRad);

      // Convert to lat/lon coordinates
      const newLat = lat + dyRot * latOffset;
      const newLon = lon + dxRot * lonOffset;

      return [newLat, newLon] as [number, number];
    });

    // Define the sides with their colors
    const sides = [
      { name: 'east', color: '#FFD300', positions: [corners[0], corners[3]] },
      { name: 'south', color: '#FF0000', positions: [corners[3], corners[2]] },
      { name: 'west', color: '#3914AF', positions: [corners[2], corners[1]] },
      { name: 'north', color: '#00CC00', positions: [corners[1], corners[0]] },
    ];

    return sides;
  };

  return (
    <Paper
      elevation={3}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 2,
        minHeight: { xs: 400, sm: 'auto' },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Location map and sun position</Typography>
      </Box>
      <Box sx={{ width: '100%', height: { xs: 356, sm: '100%' } }}>
        <MapContainer center={[lat, lon]} zoom={18} style={{ height: '100%', width: '100%' }}>
          <MapUpdater lat={lat} lon={lon} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
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
                opacity: 0.8,
              }}
            />
          ))}
        </MapContainer>
      </Box>
    </Paper>
  );
};

export default LocationMap;
