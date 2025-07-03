import { Box } from '@mui/material';
import type React from 'react';
import { useCallback, useState } from 'react';

interface SunPositionData {
  time: Date;
  position: {
    azimuth: number; // in radians
    altitude: number; // in radians
  };
}

interface SunIntensityChartHoverProps {
  sunPositionData: SunPositionData[];
  onMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
}

const SunIntensityChartHover: React.FC<SunIntensityChartHoverProps> = ({
  sunPositionData,
  onMouseMove,
  onMouseLeave,
}) => {
  const [hoverPosition, setHoverPosition] = useState<{ x: number; time: Date } | null>(null);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const percentage = (x / rect.width) * 100;

      // Find the exact time based on percentage
      const timeIndex = (percentage / 100) * (sunPositionData.length - 1);
      const clampedIndex = Math.max(0, Math.min(sunPositionData.length - 1, timeIndex));

      // Interpolate between the two closest times for more precise positioning
      const lowerIndex = Math.floor(clampedIndex);
      const upperIndex = Math.min(sunPositionData.length - 1, Math.ceil(clampedIndex));
      const fraction = clampedIndex - lowerIndex;

      const lowerTime = sunPositionData[lowerIndex].time;
      const upperTime = sunPositionData[upperIndex].time;

      // Linear interpolation between the two times
      const interpolatedTime = new Date(lowerTime.getTime() + fraction * (upperTime.getTime() - lowerTime.getTime()));

      setHoverPosition({ x: percentage, time: interpolatedTime });
      onMouseMove(event);
    },
    [sunPositionData, onMouseMove],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverPosition(null);
    onMouseLeave();
  }, [onMouseLeave]);

  const formatTime = useCallback((date: Date) => {
    return date.toTimeString().slice(0, 5);
  }, []);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16, // TODO: avoid magic numbers for top and left
        left: 48, // 40px label + 8px gap (gap: 1 = 8px)
        right: 0,
        bottom: 0,
        cursor: 'crosshair',
        zIndex: 5,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hover time label */}
      {hoverPosition && (
        <Box
          sx={{
            position: 'absolute',
            left: `${hoverPosition.x}%`,
            top: -18,
            transform: 'translateX(-50%)',
            zIndex: 10,
            pointerEvents: 'none',
            background: '#e53e3e',
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
          {formatTime(hoverPosition.time)}
        </Box>
      )}

      {/* Vertical hover line */}
      {hoverPosition && (
        <Box
          sx={{
            position: 'absolute',
            left: `${hoverPosition.x}%`,
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: '#e53e3e',
            zIndex: 15,
            pointerEvents: 'none',
            boxShadow: '0 0 4px rgba(229, 62, 62, 0.5)',
          }}
        />
      )}
    </Box>
  );
};

export default SunIntensityChartHover;
