import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { BRAND, fonts, GOLD_GRADIENT, radii } from '../theme/tokens';
import Icon from './Icon';

type BtnProps = {
  label: string;
  onPress?: () => void;
  icon?: string;
  iconRight?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  textColor?: string;
};

const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

export function PrimaryButton({ label, onPress, icon, iconRight, disabled, loading, style }: BtnProps) {
  return (
    <Pressable
      onPress={() => {
        if (disabled || loading) return;
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: disabled ? '#9AA7B4' : BRAND.navy, opacity: pressed ? 0.9 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} color="#fff" size={19} style={{ marginRight: 8 }} /> : null}
          <Text style={styles.label}>{label}</Text>
          {iconRight ? <Icon name={iconRight} color="#fff" size={19} style={{ marginLeft: 8 }} /> : null}
        </View>
      )}
    </Pressable>
  );
}

export function GoldButton({ label, onPress, icon, disabled, loading, style }: BtnProps) {
  const [width, setWidth] = useState(320);
  const sheen = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(sheen, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sheen, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sheen]);

  const translateX = sheen.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.7, width * 1.4] });

  if (disabled) {
    // Coincide con el aspecto deshabilitado de PrimaryButton (gris plano,
    // sin sombra) — un degradado dorado a media opacidad con su animación
    // de brillo todavía corriendo se leía como roto/con glitch en vez de
    // "no se puede tocar esto".
    return (
      <Pressable disabled onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={[styles.base, { backgroundColor: '#9AA7B4' }, style]}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.row}>
            {icon ? <Icon name={icon} color="#fff" size={19} style={{ marginRight: 8 }} /> : null}
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
        tap();
        onPress?.();
      }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }, style]}
    >
      <LinearGradient colors={GOLD_GRADIENT} start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.8 }} style={[styles.base, styles.goldShadow, { overflow: 'hidden' }]}>
        <Animated.View pointerEvents="none" style={[styles.sheen, { transform: [{ translateX }, { rotate: '14deg' }] }]}>
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
            {icon ? <Icon name={icon} color="#071B31" size={19} style={{ marginRight: 8 }} /> : null}
            <Text style={[styles.label, { color: '#071B31' }]}>{label}</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export function GhostButton({ label, onPress, icon, disabled, style, textColor }: BtnProps) {
  const { theme } = useTheme();
  const fg = textColor ?? theme.ink;
  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: theme.surf, borderWidth: 1.5, borderColor: theme.line, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <View style={styles.row}>
        {icon ? <Icon name={icon} color={fg} size={18} style={{ marginRight: 7 }} /> : null}
        <Text style={[styles.label, { color: fg }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function DangerOutlineButton({ label, onPress, icon, style }: BtnProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.red, opacity: pressed ? 0.8 : 1 },
        style,
      ]}
    >
      <View style={styles.row}>
        {icon ? <Icon name={icon} color={theme.red} size={19} style={{ marginRight: 8 }} /> : null}
        <Text style={[styles.label, { color: theme.red }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function DangerButton({ label, onPress, style }: BtnProps) {
  return (
    <Pressable
      onPress={() => {
        tap();
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
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { color: '#fff', fontFamily: fonts.headingBold, fontSize: 15.5, letterSpacing: 0.1 },
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
