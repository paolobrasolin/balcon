import { Box, Divider, Paper, TextField, Typography } from '@mui/material';
import type React from 'react';
import { useTranslation } from 'react-i18next';

interface LocationSettingsProps {
  lat: number;
  lon: number;
  azm: number;
  date: string;
  onLatChange: (value: number) => void;
  onLonChange: (value: number) => void;
  onAzmChange: (value: number) => void;
  onDateChange: (value: string) => void;
}

const LocationSettings: React.FC<LocationSettingsProps> = ({
  lat,
  lon,
  azm,
  date,
  onLatChange,
  onLonChange,
  onAzmChange,
  onDateChange,
}) => {
  const { t } = useTranslation();
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        width: { xs: '100%', sm: 300 },
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" gutterBottom>
        {t('settings.title')}
      </Typography>
      <Divider sx={{ mb: 4, mt: 1 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        <TextField
          fullWidth
          label={t('settings.latitude')}
          type="number"
          slotProps={{
            htmlInput: {
              step: 0.0001,
              min: -90,
              max: 90,
            },
          }}
          value={lat}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!Number.isNaN(value) && value >= -90 && value <= 90) {
              onLatChange(value);
            }
          }}
          helperText={t('settings.latitudeHelper')}
        />
        <TextField
          fullWidth
          label={t('settings.longitude')}
          type="number"
          slotProps={{
            htmlInput: {
              step: 0.0001,
              min: -180,
              max: 180,
            },
          }}
          value={lon}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!Number.isNaN(value) && value >= -180 && value <= 180) {
              onLonChange(value);
            }
          }}
          helperText={t('settings.longitudeHelper')}
        />
        <TextField
          fullWidth
          label={t('settings.southernSideAzimuth')}
          type="number"
          slotProps={{
            htmlInput: {
              step: 1,
              min: -45,
              max: 45,
            },
          }}
          value={azm}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!Number.isNaN(value) && value >= -45 && value <= 45) {
              onAzmChange(value);
            }
          }}
          helperText={t('settings.azimuthHelper')}
        />
        <TextField
          fullWidth
          label={t('settings.date')}
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
          }}
        />
      </Box>
    </Paper>
  );
};

export default LocationSettings;
