import { StatusBar } from 'expo-status-bar';
import Navigation from './src/navigation';
import { ThemeProvider, useThemeColors } from './src/lib/theme';
import { AuthProvider } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ModalProvider } from './src/contexts/ModalContext';
import { BookingProvider } from './src/contexts/BookingContext';
import { NavigationProvider } from './src/contexts/NavigationContext';
import React, { useState } from 'react';
import SplashAnimation from './src/components/SplashAnimation';

function AppInner() {
  const theme = useThemeColors();
  const [splashDone, setSplashDone] = useState(false);
  if (!splashDone) {
    return <SplashAnimation onFinish={() => setSplashDone(true)} />;
  }
  return (
    <>
      <Navigation />
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationProvider>
        <AuthProvider>
          <LanguageProvider>
            <ModalProvider>
              <BookingProvider>
                <AppInner />
              </BookingProvider>
            </ModalProvider>
          </LanguageProvider>
        </AuthProvider>
      </NavigationProvider>
    </ThemeProvider>
  );
}
