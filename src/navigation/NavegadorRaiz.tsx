import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, NavigationContainerRef } from '@react-navigation/native';
import { usarTema } from '../tema/ContextoTema';
import { usarEstadoApp } from '../state/ContextoEstadoApp';
import { iniciarSeguimientoAuditoria, detenerSeguimientoAuditoria, rastrearEvento } from '../lib/auditoria';
import PilaAutenticacion from './PilaAutenticacion';
import PilaRaiz from './PilaRaiz';

export default function NavegadorRaiz() {
  const { tema, oscuro } = usarTema();
  const { sesion, tocar } = usarEstadoApp();
  const refNav = useRef<NavigationContainerRef<Record<string, object | undefined>>>(null);
  const ultimaRuta = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (sesion === 'in') {
      iniciarSeguimientoAuditoria();
    } else {
      detenerSeguimientoAuditoria();
      ultimaRuta.current = undefined;
    }
  }, [sesion]);

  const alCambiarEstado = () => {
    tocar();
    const ruta = refNav.current?.getCurrentRoute()?.name;
    if (ruta && ruta !== ultimaRuta.current) {
      ultimaRuta.current = ruta;
      rastrearEvento('screen_view', { screen: ruta });
    }
  };

  if (sesion === 'checking') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tema.fondo }}>
        <ActivityIndicator color={tema.dorado} />
      </View>
    );
  }

  const temaNavegacion = {
    ...(oscuro ? DarkTheme : DefaultTheme),
    colors: {
      ...(oscuro ? DarkTheme.colors : DefaultTheme.colors),
      background: tema.fondo,
      card: tema.superficie,
      border: tema.linea,
      primary: tema.dorado,
      text: tema.tinta,
    },
  };

  return (
    <NavigationContainer ref={refNav} theme={temaNavegacion} onStateChange={alCambiarEstado}>
      {sesion === 'in' ? <PilaRaiz /> : <PilaAutenticacion />}
    </NavigationContainer>
  );
}
