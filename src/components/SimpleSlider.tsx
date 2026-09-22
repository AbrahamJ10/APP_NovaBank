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
export default function SimpleSlider({ minimumValue, maximumValue, step = 1, value, onValueChange, onSlidingComplete }: Props) {
  const { theme } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const widthRef = useRef(0);
  const lastValueRef = useRef(value);

  const clampToStep = (raw: number) => {
    const stepped = Math.round(raw / step) * step;
    return Math.max(minimumValue, Math.min(maximumValue, stepped));
  };

  const updateFromX = (x: number) => {
    if (widthRef.current <= 0) return value;
    const pct = Math.max(0, Math.min(1, x / widthRef.current));
    const raw = minimumValue + pct * (maximumValue - minimumValue);
    const next = clampToStep(raw);
    lastValueRef.current = next;
    onValueChange(next);
    return next;
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => updateFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => updateFromX(e.nativeEvent.locationX),
      onPanResponderRelease: () => onSlidingComplete?.(lastValueRef.current),
      onPanResponderTerminate: () => onSlidingComplete?.(lastValueRef.current),
    })
  ).current;

  const pct = (value - minimumValue) / (maximumValue - minimumValue);
  const thumbSize = 24;

  return (
    <View
      style={{ height: 32, justifyContent: 'center', width: '100%' }}
      onLayout={(e) => {
        widthRef.current = e.nativeEvent.layout.width;
        setTrackWidth(e.nativeEvent.layout.width);
      }}
      {...pan.panHandlers}
    >
      <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.line, overflow: 'hidden' }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: '#C9A227', width: `${pct * 100}%` }} />
      </View>
      <View
        style={{
          position: 'absolute',
          left: Math.max(0, trackWidth * pct - thumbSize / 2),
          width: thumbSize,
          height: thumbSize,
          borderRadius: thumbSize / 2,
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
