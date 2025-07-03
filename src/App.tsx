import { Box, Container, CssBaseline, createTheme, ThemeProvider } from '@mui/material';
import LanguageSwitcher from './components/LanguageSwitcher';
import SunlightTimer from './components/SunlightTimer';
import './i18n';

// Create a dark theme to match your current styling
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#020917',
      paper: '#101725',
    },
    primary: {
      main: '#007bff',
    },
  },
  typography: {
    fontFamily: 'Inter, Avenir, Helvetica, Arial, sans-serif',
  },
});

const App = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <LanguageSwitcher />
      <Container maxWidth="lg">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'center',
            py: 3,
          }}
        >
          <SunlightTimer />
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default App;
