import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';

export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = useMemo(() => {
    const mode = resolvedTheme === 'dark' ? 'dark' : 'light';
    
    return createTheme({
      palette: {
        mode,
        primary: {
          main: '#16a34a', // green-600 to match TeaPlanter branding
        },
        background: {
          default: mode === 'dark' ? '#0f172a' : '#f8fafc',
          paper: mode === 'dark' ? '#1e293b' : '#ffffff',
        },
      },
      shape: {
        borderRadius: 8,
      },
      typography: {
        fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
      },
    });
  }, [resolvedTheme]);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
