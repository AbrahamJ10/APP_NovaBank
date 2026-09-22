import React from 'react';
import { View } from 'react-native';
import { usarEstadoApp } from '../state/ContextoEstadoApp';

// Cualquier toque en cualquier parte de la app cuenta como actividad y
// reinicia el temporizador de inactividad — sin esto, la cuenta regresiva
// de inactividad solo se reiniciaba en el iniciarSesion, así que una sesión usada
// activamente igual se cerraría en un horario fijo sin importar cuánto
// estuviera interactuando la persona.
export default function RastreadorActividad({ children }: { children: React.ReactNode }) {
  const { tocar } = usarEstadoApp();
  return (
    <View style={{ flex: 1 }} onTouchStart={tocar} onTouchMove={tocar}>
      {children}
    </View>
  );
}
