import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, NavigationContainerRef } from '@react-navigation/native';
import { usarTema } from '../theme/ContextoTema';
import { usarEstadoApp } from '../state/ContextoEstadoApp';
import { iniciarSeguimientoAuditoria, detenerSeguimientoAuditoria, rastrearEvento } from '../lib/auditoria';
import PilaAutenticacion from './PilaAutenticacion';
import PilaRaiz from './PilaRaiz';

export default function NavegadorRaiz() {
  const { theme, dark } = usarTema();
  const { session, touch } = usarEstadoApp();
  const refNav = useRef<NavigationContainerRef<Record<string, object | undefined>>>(null);
  const ultimaRuta = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (session === 'in') {
      iniciarSeguimientoAuditoria();
    } else {
      detenerSeguimientoAuditoria();
      ultimaRuta.current = undefined;
    }
  }, [session]);

  const alCambiarEstado = () => {
    touch();
    const ruta = refNav.current?.getCurrentRoute()?.name;
    if (ruta && ruta !== ultimaRuta.current) {
      ultimaRuta.current = ruta;
      rastrearEvento('screen_view', { screen: ruta });
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
      {session === 'in' ? <PilaRaiz /> : <PilaAutenticacion />}
    </NavigationContainer>
  );
}
