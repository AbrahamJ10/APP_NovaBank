import React from 'react';
import { View } from 'react-native';
import { useAppState } from '../state/AppStateContext';

// Cualquier toque en cualquier parte de la app cuenta como actividad y
// reinicia el temporizador de inactividad — sin esto, la cuenta regresiva
// de inactividad solo se reiniciaba en el login, así que una sesión usada
// activamente igual se cerraría en un horario fijo sin importar cuánto
// estuviera interactuando la persona.
export default function RastreadorActividad({ children }: { children: React.ReactNode }) {
  const { touch } = useAppState();
  return (
    <View style={{ flex: 1 }} onTouchStart={touch} onTouchMove={touch}>
      {children}
    </View>
  );
}
