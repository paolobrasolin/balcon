import React from 'react';
import { Card, CardContent, Typography, Box, Divider } from '@mui/material';
import SunIntensityAxis from './SunIntensityAxis';
import SunIntensityBar from './SunIntensityBar';

interface SunPositionData {
  time: Date;
  position: {
    azimuth: number; // in radians
    altitude: number; // in radians
  };
}

interface SunIntensityChartProps {
  sunPositionData: SunPositionData[];
  sunTimes: { sunrise: Date; sunset: Date } | null;
  azm: number;
}

const SunIntensityChart: React.FC<SunIntensityChartProps> = ({
  sunPositionData,
  sunTimes,
  azm
}) => {
  if (sunPositionData.length === 0) {
    return null;
  }

  return (
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
            sideAzimuth={(270 + azm) * Math.PI / 180}
            surfaceAltitude={0}
            label="East"
          />
          <SunIntensityBar
            sunPositions={sunPositionData}
            color="#FF0000"
            sideAzimuth={(0 + azm) * Math.PI / 180}
            surfaceAltitude={0}
            label="South"
          />
          <SunIntensityBar
            sunPositions={sunPositionData}
            color="#3914AF"
            sideAzimuth={(90 + azm) * Math.PI / 180}
            surfaceAltitude={0}
            label="West"
          />
          <SunIntensityBar
            sunPositions={sunPositionData}
            color="#00CC00"
            sideAzimuth={(180 + azm) * Math.PI / 180}
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
  );
};

export default SunIntensityChart; 