import React from 'react';
import { Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import SunCalc from 'suncalc';

// Component to draw sun rays
const SunRays: React.FC<{ lat: number; lon: number; date: string }> = ({ lat, lon, date }) => {
  // Get sunrise and sunset times for the selected date
  const selectedDate = new Date(date);
  const sunTimes = SunCalc.getTimes(selectedDate, lat, lon);
  const sunrise = sunTimes.sunrise;
  const sunset = sunTimes.sunset;

  // Generate rays for every 30 minutes during daylight hours
  const rays = [];
  const sunriseHour = sunrise.getHours();
  const sunriseMinute = sunrise.getMinutes();
  const sunsetHour = sunset.getHours();
  const sunsetMinute = sunset.getMinutes();

  // Start from sunrise, end at sunset
  const startTime = new Date(selectedDate);
  startTime.setHours(sunriseHour, Math.floor(sunriseMinute / 30) * 30, 0, 0);

  const endTime = new Date(selectedDate);
  endTime.setHours(sunsetHour, Math.ceil(sunsetMinute / 30) * 30, 0, 0);

  // Generate rays every 30 minutes during daylight
  for (let time = new Date(startTime); time <= endTime; time.setMinutes(time.getMinutes() + 30)) {
    const sunPos = SunCalc.getPosition(time, lat, lon);

    // Only draw rays when sun is above horizon (altitude > 0)
    if (sunPos.altitude > 0) {
      // Calculate ray length based on altitude (longer when sun is near horizon)
      // Base length is 150 meters, scale by altitude (0-1 range)
      const baseLength = 150; // meters
      const altitudeFactor = Math.cos(sunPos.altitude); // 1 at horizon, 0 at zenith
      const rayLength = baseLength * altitudeFactor;

      // Convert meters to lat/lon offsets
      const latOffset = rayLength / 111320;
      const lonOffset = rayLength / (111320 * Math.cos((lat * Math.PI) / 180));

      // Calculate end point of ray
      const azimuthRad = sunPos.azimuth;
      // SunCalc azimuth: 0 = North, π/2 = East, π = South, 3π/2 = West
      // We want to point FROM the sun TO our location, so we need to reverse the direction
      const endLat = lat - Math.cos(azimuthRad) * latOffset;
      const endLon = lon - Math.sin(azimuthRad) * lonOffset;

      rays.push({
        start: [lat, lon] as [number, number],
        end: [endLat, endLon] as [number, number],
        time: new Date(time),
        altitude: sunPos.altitude,
        azimuth: sunPos.azimuth,
        isSunrise: false,
        isSunset: false,
      });
    }
  }

  // Add special sunrise and sunset rays
  const addSpecialRay = (time: Date, isSunrise: boolean) => {
    const sunPos = SunCalc.getPosition(time, lat, lon);
    const baseLength = 180; // Slightly longer for special rays
    const rayLength = baseLength * Math.cos(sunPos.altitude); // Long ray for horizon

    const latOffset = rayLength / 111320;
    const lonOffset = rayLength / (111320 * Math.cos((lat * Math.PI) / 180));

    const azimuthRad = sunPos.azimuth;
    const endLat = lat - Math.cos(azimuthRad) * latOffset;
    const endLon = lon - Math.sin(azimuthRad) * lonOffset;

    rays.push({
      start: [lat, lon] as [number, number],
      end: [endLat, endLon] as [number, number],
      time: time,
      altitude: sunPos.altitude,
      azimuth: sunPos.azimuth,
      isSunrise,
      isSunset: !isSunrise,
    });
  };

  addSpecialRay(sunrise, true);
  addSpecialRay(sunset, false);

  return (
    <>
      {rays.map((ray) => (
        <React.Fragment key={ray.time.getTime()}>
          <Polyline
            positions={[ray.start, ray.end]}
            pathOptions={{
              color: ray.isSunrise ? '#FF6B35' : ray.isSunset ? '#FF8C42' : '#FFD700',
              weight: ray.isSunrise || ray.isSunset ? 4 : 2,
              opacity: ray.isSunrise || ray.isSunset ? 0.9 : 0.7,
              dashArray: ray.isSunrise || ray.isSunset ? '10, 5' : '5, 5',
            }}
          />
          {/* Add time label at the end of each ray */}
          <Marker
            position={ray.end}
            icon={L.divIcon({
              className: 'sun-ray-label',
              html: `<div style="
                background: ${ray.isSunrise ? 'rgba(255, 107, 53, 0.9)' : ray.isSunset ? 'rgba(255, 140, 66, 0.9)' : 'rgba(255, 215, 0, 0.9)'};
                color: #000;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: bold;
                white-space: nowrap;
                border: 1px solid ${ray.isSunrise ? '#FF6B35' : ray.isSunset ? '#FF8C42' : '#FFD700'};
              ">${ray.isSunrise ? '🌅' : ray.isSunset ? '🌇' : ''}${ray.time.toTimeString().slice(0, 5)}</div>`,
              iconSize: [50, 20],
              iconAnchor: [25, 10],
            })}
          />
        </React.Fragment>
      ))}
    </>
  );
};

export default SunRays;
