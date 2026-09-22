import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { usarTema } from '../tema/ContextoTema';
import { MARCA, fuentes, GRADIENTE_DORADO, radios } from '../tema/estilos';
import Icono from './Icono';

type BtnProps = {
  label: string;
  onPress?: () => void;
  icon?: string;
  iconoDerecho?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  colorTexto?: string;
};

const toque = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

export function BotonPrimario({ label, onPress, icon, iconoDerecho, disabled, loading, style }: BtnProps) {
  return (
    <Pressable
      onPress={() => {
        if (disabled || loading) return;
        toque();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: disabled ? '#9AA7B4' : MARCA.navy, opacity: pressed ? 0.9 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.row}>
          {icon ? <Icono name={icon} color="#fff" size={19} style={{ marginRight: 8 }} /> : null}
          <Text style={styles.label}>{label}</Text>
          {iconoDerecho ? <Icono name={iconoDerecho} color="#fff" size={19} style={{ marginLeft: 8 }} /> : null}
        </View>
      )}
    </Pressable>
  );
}

export function BotonDorado({ label, onPress, icon, disabled, loading, style }: BtnProps) {
  const [ancho, setAncho] = useState(320);
  const brillo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bucle = Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(brillo, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(brillo, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    bucle.start();
    return () => bucle.stop();
  }, [brillo]);

  const trasladoX = brillo.interpolate({ inputRange: [0, 1], outputRange: [-ancho * 0.7, ancho * 1.4] });

  if (disabled) {
    // Coincide con el aspecto deshabilitado de BotonPrimario (gris plano,
    // sin sombra) — un degradado dorado a media opacidad con su animación
    // de brillo todavía corriendo se leía como roto/con glitch en vez de
    // "no se puede tocar esto".
    return (
      <Pressable disabled onLayout={(e) => setAncho(e.nativeEvent.layout.width)} style={[styles.base, { backgroundColor: '#9AA7B4' }, style]}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.row}>
            {icon ? <Icono name={icon} color="#fff" size={19} style={{ marginRight: 8 }} /> : null}
            <Text style={styles.label}>{label}</Text>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => {
        if (loading) return;
        toque();
        onPress?.();
      }}
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }, style]}
    >
      <LinearGradient colors={GRADIENTE_DORADO} start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.8 }} style={[styles.base, styles.goldShadow, { overflow: 'hidden' }]}>
        <Animated.View pointerEvents="none" style={[styles.sheen, { transform: [{ translateX: trasladoX }, { rotate: '14deg' }] }]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,.5)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
        {loading ? (
          <ActivityIndicator color="#071B31" />
        ) : (
          <View style={styles.row}>
            {icon ? <Icono name={icon} color="#071B31" size={19} style={{ marginRight: 8 }} /> : null}
            <Text style={[styles.label, { color: '#071B31' }]}>{label}</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export function BotonFantasma({ label, onPress, icon, disabled, style, colorTexto }: BtnProps) {
  const { tema } = usarTema();
  const colorTextoFinal = colorTexto ?? tema.tinta;
  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        toque();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: tema.superficie, borderWidth: 1.5, borderColor: tema.linea, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <View style={styles.row}>
        {icon ? <Icono name={icon} color={colorTextoFinal} size={18} style={{ marginRight: 7 }} /> : null}
        <Text style={[styles.label, { color: colorTextoFinal }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function BotonPeligroContorno({ label, onPress, icon, style }: BtnProps) {
  const { tema } = usarTema();
  return (
    <Pressable
      onPress={() => {
        toque();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: tema.rojo, opacity: pressed ? 0.8 : 1 },
        style,
      ]}
    >
      <View style={styles.row}>
        {icon ? <Icono name={icon} color={tema.rojo} size={19} style={{ marginRight: 8 }} /> : null}
        <Text style={[styles.label, { color: tema.rojo }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function BotonPeligro({ label, onPress, style }: BtnProps) {
  return (
    <Pressable
      onPress={() => {
        toque();
        onPress?.();
      }}
      style={({ pressed }) => [styles.base, { backgroundColor: '#C2352B', opacity: pressed ? 0.9 : 1 }, style]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: radios.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { color: '#fff', fontFamily: fuentes.headingBold, fontSize: 15.5, letterSpacing: 0.1 },
  goldShadow: {
    shadowColor: '#C9A227',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  sheen: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    width: 70,
  },
});
