import { Box, Card, CardContent, Divider, Typography } from '@mui/material';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import SunIntensityAxis from './SunIntensityAxis';
import SunIntensityBar from './SunIntensityBar';
import SunIntensityChartHover from './SunIntensityChartHover';

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

const SunIntensityChart: React.FC<SunIntensityChartProps> = ({ sunPositionData, sunTimes, azm }) => {
  const { t } = useTranslation();
  if (sunPositionData.length === 0) {
    return null;
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {t('chart.title')}
        </Typography>
        <Divider sx={{ mb: 4, mt: 1 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, position: 'relative' }}>
          <SunIntensityAxis sunTimes={sunTimes} />
          <SunIntensityBar
            sunPositions={sunPositionData}
            color="#FFD300"
            sideAzimuth={((270 + azm) * Math.PI) / 180}
            surfaceAltitude={0}
            label={t('chart.surfaces.east')}
          />
          <SunIntensityBar
            sunPositions={sunPositionData}
            color="#FF0000"
            sideAzimuth={((0 + azm) * Math.PI) / 180}
            surfaceAltitude={0}
            label={t('chart.surfaces.south')}
          />
          <SunIntensityBar
            sunPositions={sunPositionData}
            color="#3914AF"
            sideAzimuth={((90 + azm) * Math.PI) / 180}
            surfaceAltitude={0}
            label={t('chart.surfaces.west')}
          />
          <SunIntensityBar
            sunPositions={sunPositionData}
            color="#00CC00"
            sideAzimuth={((180 + azm) * Math.PI) / 180}
            surfaceAltitude={0}
            label={t('chart.surfaces.north')}
          />
          <SunIntensityBar
            sunPositions={sunPositionData}
            color="#FFFFFF"
            sideAzimuth={0}
            surfaceAltitude={Math.PI / 2}
            label={t('chart.surfaces.roof')}
          />
          <SunIntensityChartHover sunPositionData={sunPositionData} onMouseMove={() => {}} onMouseLeave={() => {}} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SunIntensityChart;
