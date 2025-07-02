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
    const airMass = 1 / (Math.sin(altitudeRadians) + 0.50572 * Math.pow((altitudeRadians * 180 / Math.PI) + 6.07995, -1.6364));

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
    const k = 0.08;   // Decay rate per air mass unit

    const transmittance = tau0 * Math.exp(-k * (airMass - 1));

    return Math.max(0, Math.min(1, transmittance));
  };

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
      <Typography variant="body2" sx={{
        width: 40,
        fontSize: '0.75rem',
        color: 'white',
        fontWeight: 'bold',
        backgroundColor: color,
        borderRadius: 0.5,
        textAlign: 'center',
        py: 0.25,
        px: 0.5,
        textShadow: '0px 0px 2px rgba(0,0,0,1), 0px 0px 4px rgba(0,0,0,1)'
      }}>
        {label}
      </Typography>
      <Box sx={{
        flex: 1,
        height: 20,
        position: 'relative',
        backgroundColor: 'transparent',
        borderRadius: 1,
        overflow: 'hidden'
      }}>
        {sunPositions.map((data, index) => {
          const intensity = calculateIntensity(data.position, sideAzimuth);
          const width = 100 / sunPositions.length;

          return (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                left: `${(index / sunPositions.length) * 100}%`,
                width: `${width}%`,
                height: '100%',
                backgroundColor: 'white',
                opacity: intensity,
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
