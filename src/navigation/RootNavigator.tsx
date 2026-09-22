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
  const refNav = useRef<NavigationContainerRef<Record<string, object | undefined>>>(null);
  const ultimaRuta = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (session === 'in') {
      startAuditTracking();
    } else {
      stopAuditTracking();
      ultimaRuta.current = undefined;
    }
  }, [session]);

  const alCambiarEstado = () => {
    touch();
    const ruta = refNav.current?.getCurrentRoute()?.name;
    if (ruta && ruta !== ultimaRuta.current) {
      ultimaRuta.current = ruta;
      trackEvent('screen_view', { screen: ruta });
    }
  };

  if (session === 'checking') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator color={theme.gold} />
      </View>
    );
  }

  const temaNavegacion = {
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
    <NavigationContainer ref={refNav} theme={temaNavegacion} onStateChange={alCambiarEstado}>
      {session === 'in' ? <RootStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
