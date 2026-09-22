import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, NavigationContainerRef } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useAppState } from '../state/AppStateContext';
import { startAuditTracking, stopAuditTracking, trackEvent } from '../lib/audit';
import AuthStack from './AuthStack';
import RootStack from './RootStack';

export default function RootNavigator() {
  const { theme, dark } = useTheme();
  const { session, touch } = useAppState();
  const navRef = useRef<NavigationContainerRef<Record<string, object | undefined>>>(null);
  const lastRoute = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (session === 'in') {
      startAuditTracking();
    } else {
      stopAuditTracking();
      lastRoute.current = undefined;
    }
  }, [session]);

  const handleStateChange = () => {
    touch();
    const route = navRef.current?.getCurrentRoute()?.name;
    if (route && route !== lastRoute.current) {
      lastRoute.current = route;
      trackEvent('screen_view', { screen: route });
    }
  };

  if (session === 'checking') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator color={theme.gold} />
      </View>
    );
  }

  const navTheme = {
    ...(dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(dark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.bg,
      card: theme.surf,
      border: theme.line,
      primary: theme.gold,
      text: theme.ink,
    },
  };

  return (
    <NavigationContainer ref={navRef} theme={navTheme} onStateChange={handleStateChange}>
      {session === 'in' ? <RootStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
