import React, { useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  minimumValue: number;
  maximumValue: number;
  step?: number;
  value: number;
  onValueChange: (v: number) => void;
  onSlidingComplete?: (v: number) => void;
};

// Las librerías nativas de slider arrastran generación de código CMake/C++,
// lo que chocaba con el límite de 260 caracteres de ruta de Windows dentro
// de este proyecto de OneDrive tan anidado. Este es un equivalente sin
// dependencias: solo View + PanResponder, sin módulo nativo, así que nunca
// más puede toparse con esa falla de compilación.
export default function DeslizadorSimple({ minimumValue, maximumValue, step = 1, value, onValueChange, onSlidingComplete }: Props) {
  const { theme } = useTheme();
  const [anchoPista, setAnchoPista] = useState(0);
  const anchoRef = useRef(0);
  const ultimoValorRef = useRef(value);

  const ajustarAPaso = (crudo: number) => {
    const escalonado = Math.round(crudo / step) * step;
    return Math.max(minimumValue, Math.min(maximumValue, escalonado));
  };

  const actualizarDesdeX = (x: number) => {
    if (anchoRef.current <= 0) return value;
    const porcentaje = Math.max(0, Math.min(1, x / anchoRef.current));
    const crudo = minimumValue + porcentaje * (maximumValue - minimumValue);
    const siguiente = ajustarAPaso(crudo);
    ultimoValorRef.current = siguiente;
    onValueChange(siguiente);
    return siguiente;
  };

  const panorama = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => actualizarDesdeX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => actualizarDesdeX(e.nativeEvent.locationX),
      onPanResponderRelease: () => onSlidingComplete?.(ultimoValorRef.current),
      onPanResponderTerminate: () => onSlidingComplete?.(ultimoValorRef.current),
    })
  ).current;

  const porcentaje = (value - minimumValue) / (maximumValue - minimumValue);
  const tamanoPerilla = 24;

  return (
    <View
      style={{ height: 32, justifyContent: 'center', width: '100%' }}
      onLayout={(e) => {
        anchoRef.current = e.nativeEvent.layout.width;
        setAnchoPista(e.nativeEvent.layout.width);
      }}
      {...panorama.panHandlers}
    >
      <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.line, overflow: 'hidden' }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: '#C9A227', width: `${porcentaje * 100}%` }} />
      </View>
      <View
        style={{
          position: 'absolute',
          left: Math.max(0, anchoPista * porcentaje - tamanoPerilla / 2),
          width: tamanoPerilla,
          height: tamanoPerilla,
          borderRadius: tamanoPerilla / 2,
          backgroundColor: '#C9A227',
          borderWidth: 3,
          borderColor: theme.surf,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        }}
      />
    </View>
  );
}
