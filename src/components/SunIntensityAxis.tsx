import { Box } from '@mui/material';
import type React from 'react';

interface SunIntensityAxisProps {
  sunTimes: { sunrise: Date; sunset: Date } | null;
  label?: string;
  barHeight?: number; // allow passing bar height for alignment
}

const TICK_HEIGHT = 20; // px, match intensity bar height
const HOUR_TICK_WIDTH = '3px';
const MINOR_TICK_WIDTH = '1px';
const SUNRISE_COLOR = '#ff9800';
const SUNSET_COLOR = '#f57c00';

const SunIntensityAxis: React.FC<SunIntensityAxisProps> = ({ sunTimes, barHeight = TICK_HEIGHT }) => {
  // Helper to get sunrise/sunset positions in minutes
  const getSpecialTicks = () => {
    if (!sunTimes) return [];
    return [
      {
        key: 'sunrise',
        minutes: sunTimes.sunrise.getHours() * 60 + sunTimes.sunrise.getMinutes(),
        color: SUNRISE_COLOR,
        label: sunTimes.sunrise.toTimeString().slice(0, 5),
      },
      {
        key: 'sunset',
        minutes: sunTimes.sunset.getHours() * 60 + sunTimes.sunset.getMinutes(),
        color: SUNSET_COLOR,
        label: sunTimes.sunset.toTimeString().slice(0, 5),
      },
    ];
  };
  const specialTicks = getSpecialTicks();

  // Helper to check if a minute is a special tick
  const isSpecialTick = (minutes: number) => specialTicks.find((t) => Math.abs(t.minutes - minutes) < 1);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
      {/* Empty space for alignment with intensity bars */}
      <Box
        sx={{
          height: barHeight,
          width: 40,
          display: 'flex',
          alignItems: 'center',
        }}
      />
      <Box sx={{ flex: 1, position: 'relative', height: barHeight }}>
        {/* Ticks */}
        {/* 15m and hour ticks */}
        {Array.from({ length: 97 }, (_, i) => {
          const minutes = i * 15;
          const hour = minutes % 60 === 0;
          const left = (minutes / (24 * 60)) * 100;
          // Check for special tick at this position
          const special = isSpecialTick(minutes);
          if (special) return null; // We'll render special ticks separately
          return (
            <Box
              key={`tick-${minutes}`}
              sx={{
                position: 'absolute',
                left: `${left}%`,
                top: 0,
                width: hour ? HOUR_TICK_WIDTH : MINOR_TICK_WIDTH,
                height: barHeight,
                backgroundColor: hour ? '#fff' : '#888',
                borderRadius: 1,
                transform: 'translateX(-50%)',
                zIndex: 2,
              }}
            />
          );
        })}
        {/* Special sunrise/sunset ticks */}
        {specialTicks.map((tick) => (
          <Box
            key={tick.key}
            sx={{
              position: 'absolute',
              left: `${(tick.minutes / (24 * 60)) * 100}%`,
              top: 0,
              width: HOUR_TICK_WIDTH,
              height: barHeight,
              backgroundColor: tick.color,
              borderRadius: 1,
              transform: 'translateX(-50%)',
              zIndex: 3,
            }}
          />
        ))}
        {/* Time labels every 6h, on top, except last (midnight) */}
        {Array.from({ length: 4 }, (_, i) => {
          const hour = i * 6;
          const left = (hour / 24) * 100;
          return (
            <Box
              key={`label-${hour}`}
              sx={{
                position: 'absolute',
                left: `${left}%`,
                top: -18,
                fontSize: '0.85rem',
                color: '#fff',
                fontWeight: 500,
                transform: 'translateX(-50%)',
                zIndex: 4,
                pointerEvents: 'none',
              }}
            >
              {`${hour.toString().padStart(2, '0')}:00`}
            </Box>
          );
        })}
        {/* Sunrise/sunset time labels (rendered last, highest z-index) */}
        {specialTicks.map((tick) => (
          <Box
            key={`${tick.key}-label`}
            sx={{
              position: 'absolute',
              left: `${(tick.minutes / (24 * 60)) * 100}%`,
              top: -18,
              transform: 'translateX(-50%)',
              zIndex: 10,
              pointerEvents: 'none',
              background: tick.color,
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              borderRadius: 1,
              px: 0.5,
              py: 0.1,
              boxShadow: '0 1px 4px 0 rgba(0,0,0,0.10)',
              whiteSpace: 'nowrap',
            }}
          >
            {tick.label}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SunIntensityAxis;
