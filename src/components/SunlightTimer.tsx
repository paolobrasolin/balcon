import { Box, Typography } from '@mui/material';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import SunCalc from 'suncalc';
import LocationMap from './LocationMap';
import LocationSettings from './LocationSettings';
import SunIntensityChart from './SunIntensityChart';

// Utility functions for query string handling
const getQueryParam = (name: string): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
};

const updateQueryParams = (params: Record<string, string | number>) => {
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    } else {
      url.searchParams.delete(key);
    }
  });

  // Update URL without reloading the page
  window.history.replaceState({}, '', url.toString());
};

interface SunPositionData {
  time: Date;
  position: {
    azimuth: number; // in radians
    altitude: number; // in radians
  };
}
const SunlightTimer: React.FC = () => {
  // Initialize state with query parameters or defaults
  const getInitialLat = (): number => {
    const queryLat = getQueryParam('lat');
    if (queryLat !== null) {
      const parsed = parseFloat(queryLat);
      if (!Number.isNaN(parsed) && parsed >= -90 && parsed <= 90) {
        return parsed;
      }
    }
    return parseFloat(import.meta.env.PUBLIC_DEFAULT_LAT);
  };

  const getInitialLon = (): number => {
    const queryLon = getQueryParam('lon');
    if (queryLon !== null) {
      const parsed = parseFloat(queryLon);
      if (!Number.isNaN(parsed) && parsed >= -180 && parsed <= 180) {
        return parsed;
      }
    }
    return parseFloat(import.meta.env.PUBLIC_DEFAULT_LON);
  };

  const getInitialAzm = (): number => {
    const queryAzm = getQueryParam('azm');
    if (queryAzm !== null) {
      const parsed = parseFloat(queryAzm);
      if (!Number.isNaN(parsed) && parsed >= -45 && parsed <= 45) {
        return parsed;
      }
    }
    return parseFloat(import.meta.env.PUBLIC_DEFAULT_AZM);
  };

  const [lat, setLat] = useState<number>(getInitialLat);
  const [lon, setLon] = useState<number>(getInitialLon);
  const [azm, setAzm] = useState<number>(getInitialAzm);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sunPositionData, setSunPositionData] = useState<SunPositionData[]>([]);
  const [sunTimes, setSunTimes] = useState<{
    sunrise: Date;
    sunset: Date;
  } | null>(null);

  // Update query parameters when lat, lon, or azm change
  useEffect(() => {
    updateQueryParams({ lat, lon, azm });
  }, [lat, lon, azm]);

  const computeSunPositionData = useCallback(() => {
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
      sunset: times.sunset,
    });

    const sunPositions: SunPositionData[] = [];
    for (let d = new Date(start); d <= end; d.setMinutes(d.getMinutes() + intervalMinutes)) {
      const position = SunCalc.getPosition(d, lat, lon);
      sunPositions.push({
        time: new Date(d),
        position: {
          azimuth: position.azimuth,
          altitude: position.altitude,
        },
      });
    }

    setSunPositionData(sunPositions);
  }, [date, lat, lon]);

  // Compute sun position data on initial load and when date changes
  useEffect(() => {
    computeSunPositionData();
  }, [computeSunPositionData]); // Run when date changes

  return (
    <Box>
      <Typography variant="h2" component="h1" gutterBottom sx={{ mb: 4 }}>
        balcón
      </Typography>

      {/* Intensity Chart */}
      <SunIntensityChart sunPositionData={sunPositionData} sunTimes={sunTimes} azm={azm} />

      {/* Inputs and Map side by side */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 3,
          mb: 3,
          alignItems: { xs: 'stretch', sm: 'stretch' },
        }}
      >
        {/* Location Settings */}
        <LocationSettings
          lat={lat}
          lon={lon}
          azm={azm}
          date={date}
          onLatChange={setLat}
          onLonChange={setLon}
          onAzmChange={setAzm}
          onDateChange={setDate}
        />

        {/* Map */}
        <LocationMap lat={lat} lon={lon} azm={azm} date={date} />
      </Box>
    </Box>
  );
};

export default SunlightTimer;
