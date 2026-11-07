import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { initializeDatabase } from '../database/database';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initializeDatabase()
      .then(() => console.log('Database initialized successfully'))
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