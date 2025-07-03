import { Box, Button, ButtonGroup } from '@mui/material';
import type React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
      <ButtonGroup variant="outlined" size="small">
        <Button onClick={() => changeLanguage('en')} variant={i18n.language === 'en' ? 'contained' : 'outlined'}>
          EN
        </Button>
        <Button onClick={() => changeLanguage('it')} variant={i18n.language === 'it' ? 'contained' : 'outlined'}>
          IT
        </Button>
      </ButtonGroup>
    </Box>
  );
};

export default LanguageSwitcher;
