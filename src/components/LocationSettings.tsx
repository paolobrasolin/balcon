import { Box, Divider, Paper, TextField, Typography } from '@mui/material';
import type React from 'react';

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
        Settings
      </Typography>
      <Divider sx={{ mb: 4, mt: 1 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        <TextField
          fullWidth
          label="Latitude"
          type="number"
          inputProps={{
            step: 0.0001,
            min: -90,
            max: 90,
          }}
          value={lat}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!Number.isNaN(value) && value >= -90 && value <= 90) {
              onLatChange(value);
            }
          }}
          helperText="Range: -90° (S) to +90° (N)"
        />
        <TextField
          fullWidth
          label="Longitude"
          type="number"
          inputProps={{
            step: 0.0001,
            min: -180,
            max: 180,
          }}
          value={lon}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!Number.isNaN(value) && value >= -180 && value <= 180) {
              onLonChange(value);
            }
          }}
          helperText="Range: -180° (W) to +180° (E)"
        />
        <TextField
          fullWidth
          label="Southern side azimuth"
          type="number"
          inputProps={{
            step: 1,
            min: -45,
            max: 45,
          }}
          value={azm}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!Number.isNaN(value) && value >= -45 && value <= 45) {
              onAzmChange(value);
            }
          }}
          helperText="Range: -45° (NW) to +45° (NE)"
        />
        <TextField
          fullWidth
          label="Date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
    </Paper>
  );
};

export default LocationSettings;
