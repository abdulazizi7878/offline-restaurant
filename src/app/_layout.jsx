import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';

// Make sure to import your real database initializer here if you have one,
// e.g.: import { initializeDatabase } from '../database/init';
// Or provide a fallback if it's not yet implemented:
const initializeDatabase = async () => {
  // Database initialization logic here
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initializeDatabase()
      .then(() => console.log('Database ready'))
      .catch((error) => console.error('Database initialization failed:', error));
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0B132B' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="cashier" />
        <Stack.Screen name="waiter" />
        <Stack.Screen name="chat" />
      </Stack>
    </ThemeProvider>
  );
}