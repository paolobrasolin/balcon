import React from 'react';
import { Typography, Box } from '@mui/material';

interface SunPosition {
  azimuth: number; // in radians, 0 = North, π/2 = East, π = South, 3π/2 = West (SunCalc format)
  altitude: number; // in radians, 0 = horizon, π/2 = zenith
}

interface SunIntensityBarProps {
  sunPositions: Array<{ time: Date; position: SunPosition }>;
  color: string;
  sideAzimuth: number; // azimuth of the side in radians from North
  label: string;
}

const SunIntensityBar: React.FC<SunIntensityBarProps> = ({
  sunPositions,
  color,
  sideAzimuth,
  label
}) => {
    /**
   * Calculate sunlight intensity for a specific side
   * @param sunPosition Sun position data
   * @param sideAzimuthRadians Azimuth of the side in radians from North
   * @returns Intensity value (0-1, where 1 is maximum intensity)
   */
  const calculateIntensity = (sunPosition: SunPosition, sideAzimuthRadians: number): number => {
    const { azimuth: sunAzimuth, altitude: sunAltitude } = sunPosition;
    
    // Convert sun position to 3D direction vector
    // SunCalc returns azimuth and altitude in radians
    const azimuthRad = sunAzimuth; // Already in radians, 0 = North, π/2 = East, π = South, 3π/2 = West
    const altitudeRad = sunAltitude; // Already in radians, 0 = horizon, π/2 = zenith

    // Convert to 3D direction vector (x, y, z)
    // x = east, y = north, z = up
    const sunDirection = {
      x: Math.sin(azimuthRad) * Math.cos(altitudeRad),
      y: Math.cos(azimuthRad) * Math.cos(altitudeRad),
      z: Math.sin(altitudeRad)
    };

    // Calculate surface normal for this side
    // Surface normal points outward from the side
    const sideNormal = {
      x: Math.sin(sideAzimuthRadians),
      y: Math.cos(sideAzimuthRadians),
      z: 0
    };

    // Calculate dot product (intensity = dot product of sun direction and surface normal)
    const dotProduct =
      sunDirection.x * sideNormal.x +
      sunDirection.y * sideNormal.y +
      sunDirection.z * sideNormal.z;

    // Apply intensity calculation with proper handling of negative values
    // When dot product is negative, the sun is behind the surface (no direct light)
    // When dot product is positive, the sun is in front of the surface (direct light)
    return Math.max(0, dotProduct);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
        {sunPositions.map((data, index) => {
          const intensity = calculateIntensity(data.position, sideAzimuth);
          const width = 100 / sunPositions.length;
          const opacity = Math.min(intensity * 2, 1); // Scale intensity for better visibility

          return (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                left: `${(index / sunPositions.length) * 100}%`,
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
  );
};

export default SunIntensityBar;
