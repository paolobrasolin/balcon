import { Box, Typography } from '@mui/material';
import type React from 'react';

interface SunPosition {
  azimuth: number; // in radians, 0 = North, π/2 = East, π = South, 3π/2 = West (SunCalc format)
  altitude: number; // in radians, 0 = horizon, π/2 = zenith
}

interface SunIntensityBarProps {
  sunPositions: Array<{ time: Date; position: SunPosition }>;
  color: string;
  sideAzimuth: number; // azimuth of the side in radians from North
  surfaceAltitude: number; // altitude of the surface in radians (0 = vertical, π/2 = horizontal, matching SunCalc convention)
  label: string;
}

const SunIntensityBar: React.FC<SunIntensityBarProps> = ({
  sunPositions,
  color,
  sideAzimuth,
  surfaceAltitude,
  label,
}) => {
  /**
   * Calculate air mass factor based on sun altitude using Kasten-Young formula
   * Air mass is the path length of solar radiation through the atmosphere
   * @param altitudeRadians Sun altitude in radians
   * @returns Air mass factor (1 at zenith, increases as sun approaches horizon)
   */
  const calculateAirMass = (altitudeRadians: number): number => {
    // Handle edge case when sun is at or below horizon
    if (altitudeRadians <= 0) return Infinity; // No direct sunlight

    // Use Kasten-Young formula for all angles (more accurate than simple 1/cos)
    // AM = 1 / (sin(altitude) + 0.50572 * (altitude + 6.07995°)^(-1.6364))
    const airMass =
      1 / (Math.sin(altitudeRadians) + 0.50572 * ((altitudeRadians * 180) / Math.PI + 6.07995) ** -1.6364);

    return airMass;
  };

  /**
   * Calculate atmospheric transmittance based on air mass
   * @param airMass Air mass factor
   * @returns Transmittance factor (0-1, where 1 is no atmospheric loss)
   */
  const calculateAtmosphericTransmittance = (airMass: number): number => {
    if (airMass === Infinity) {
      return 0; // No direct sunlight
    }

    // Use a more realistic transmittance model for clear sky conditions
    // This accounts for Rayleigh scattering, molecular absorption, and aerosol scattering
    // Based on empirical data for clear sky conditions

    // For clear sky, typical transmittance values:
    // AM=1 (zenith): ~0.75-0.85
    // AM=2 (60° zenith): ~0.65-0.75
    // AM=5 (78° zenith): ~0.45-0.55
    // AM=10 (84° zenith): ~0.25-0.35

    // Use a two-parameter model: τ = τ0 * exp(-k * (AM - 1))
    // where τ0 is transmittance at AM=1 and k is the decay rate
    const tau0 = 0.8; // Transmittance at zenith (AM=1)
    const k = 0.08; // Decay rate per air mass unit

    const transmittance = tau0 * Math.exp(-k * (airMass - 1));

    return Math.max(0, Math.min(1, transmittance));
  };

  /**
   * Calculate sunlight intensity for a surface with given orientation
   * @param sunPosition Sun position data
   * @param sideAzimuthRadians Azimuth of the side in radians from North
   * @param surfaceAltitudeRadians Altitude of the surface in radians (0 = horizontal, π/2 = vertical)
   * @returns Intensity value (0-1, where 1 is maximum intensity)
   */
  const calculateIntensity = (
    sunPosition: SunPosition,
    sideAzimuthRadians: number,
    surfaceAltitudeRadians: number,
  ): number => {
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
      z: Math.sin(altitudeRad),
    };

    // Calculate surface normal for this surface
    // For vertical walls: surfaceAltitude = 0, normal points horizontally outward
    // For horizontal roof: surfaceAltitude = π/2, normal points upward
    // For angled surfaces: normal points at the specified altitude (matching SunCalc convention)
    const surfaceNormal = {
      x: Math.sin(sideAzimuthRadians) * Math.cos(surfaceAltitudeRadians),
      y: Math.cos(sideAzimuthRadians) * Math.cos(surfaceAltitudeRadians),
      z: Math.sin(surfaceAltitudeRadians),
    };

    // Calculate dot product (intensity = dot product of sun direction and surface normal)
    const dotProduct =
      sunDirection.x * surfaceNormal.x + sunDirection.y * surfaceNormal.y + sunDirection.z * surfaceNormal.z;

    // Apply intensity calculation with proper handling of negative values
    // When dot product is negative, the sun is behind the surface (no direct light)
    // When dot product is positive, the sun is in front of the surface (direct light)
    const geometricIntensity = Math.max(0, dotProduct);

    // Calculate air mass and atmospheric effects
    const airMass = calculateAirMass(altitudeRad);
    const atmosphericTransmittance = calculateAtmosphericTransmittance(airMass);

    // Final intensity combines geometric factor with atmospheric transmittance
    const finalIntensity = geometricIntensity * atmosphericTransmittance;

    return finalIntensity;
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography
        variant="body2"
        sx={{
          width: 40,
          fontSize: '0.75rem',
          color: 'white',
          fontWeight: 'bold',
          backgroundColor: color,
          borderRadius: 0.5,
          textAlign: 'center',
          py: 0.25,
          px: 0.5,
          textShadow: '0px 0px 2px rgba(0,0,0,1), 0px 0px 4px rgba(0,0,0,1)',
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          flex: 1,
          height: 20,
          position: 'relative',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        {sunPositions.map((data, index) => {
          const intensity = calculateIntensity(data.position, sideAzimuth, surfaceAltitude);
          const width = 100 / sunPositions.length;
          const height = `${intensity * 100}%`;

          return (
            <Box
              key={data.time.getTime()}
              sx={{
                position: 'absolute',
                left: `${(index / sunPositions.length) * 100}%`,
                width: `${width}%`,
                height: height,
                bottom: 0,
                backgroundColor: 'white',
                transition: 'height 0.2s',
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default SunIntensityBar;
