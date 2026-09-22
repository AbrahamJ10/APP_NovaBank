import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { fonts, radii } from '../theme/tokens';
import Icon from './Icon';
import LanguageSwitch from './LanguageSwitch';

export function SectionCard({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const { theme } = useTheme();
  const Wrap = onPress ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      style={[
        {
          borderRadius: radii.xl,
          backgroundColor: theme.surf,
          borderWidth: 1,
          borderColor: theme.line,
          padding: 20,
        },
        theme.shadow as ViewStyle,
        style,
      ]}
    >
      {children}
    </Wrap>
  );
}

export function BackButton({ onPress, dark }: { onPress?: () => void; dark?: boolean }) {
  const nav = useNavigation();
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <Pressable
        onPress={onPress ?? (() => nav.goBack())}
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: dark ? 'rgba(255,255,255,.12)' : theme.surf,
          borderWidth: dark ? 0 : 1,
          borderColor: theme.line,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="arrow_back" size={20} color={dark ? '#fff' : theme.ink} />
      </Pressable>
      <LanguageSwitch dark={dark} />
    </View>
  );
}

export function ScreenTitle({
  eyebrow,
  title,
  note,
  showLanguageSwitch,
}: {
  eyebrow?: string;
  title: string;
  note?: string;
  // Only screens that reach ScreenTitle without a BackButton above them
  // need this — BackButton already carries its own LanguageSwitch, so
  // passing this alongside one would just show it twice.
  showLanguageSwitch?: boolean;
}) {
  const { theme } = useTheme();
  const heading = (
    <View style={{ flex: 1 }}>
      {eyebrow ? (
        <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: theme.gold, letterSpacing: 1.8, textTransform: 'uppercase' }}>
          {eyebrow}
        </Text>
      ) : null}
      <Text style={{ fontFamily: fonts.heading, fontSize: 25, letterSpacing: -0.7, color: theme.ink, marginTop: eyebrow ? 6 : 0 }}>
        {title}
      </Text>
      {note ? <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: theme.mid, marginTop: 5 }}>{note}</Text> : null}
    </View>
  );

  if (!showLanguageSwitch) {
    return <View style={{ marginBottom: 4 }}>{heading}</View>;
  }

  return (
    <View style={{ marginBottom: 4, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      {heading}
      <LanguageSwitch />
    </View>
  );
}

export function Row({ label, value, k }: { label: string; value?: string; k?: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: theme.soft }}>{label}</Text>
      {k ?? <Text style={{ fontFamily: fonts.bodyMed, fontSize: 12.5, color: theme.ink }}>{value}</Text>}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 36,
        paddingHorizontal: 15,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? '#133A63' : theme.surf,
        borderWidth: 1.5,
        borderColor: active ? '#133A63' : theme.line,
      }}
    >
      <Text style={{ fontFamily: fonts.bodyMed, fontSize: 12.5, color: active ? '#fff' : theme.mid }}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, tone = 'gold' }: { label: string; tone?: 'gold' | 'green' | 'red' | 'neutral' }) {
  const { theme } = useTheme();
  const map = {
    gold: { bg: theme.selBg, fg: theme.gold },
    green: { bg: theme.okBg, fg: theme.green },
    red: { bg: theme.warnBg, fg: theme.red },
    neutral: { bg: theme.tint, fg: theme.mid },
  } as const;
  const c = map[tone];
  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: c.bg, alignSelf: 'flex-start' }}>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, color: c.fg }}>{label}</Text>
    </View>
  );
}

export function Avatar({ initials, size = 42 }: { initials: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.34,
        backgroundColor: 'rgba(255,255,255,.12)',
        borderWidth: 1,
        borderColor: 'rgba(217,190,122,.4)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: fonts.headingBold, fontSize: size * 0.33, color: '#E7CE92' }}>{initials}</Text>
    </View>
  );
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [value]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={{
        width: 56,
        height: 32,
        borderRadius: 16,
        padding: 3,
        backgroundColor: value ? '#21A26B' : theme.line,
      }}
    >
      <Animated.View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: '#fff',
          transform: [{ translateX }],
          shadowColor: '#000',
          shadowOpacity: 0.22,
          shadowRadius: 5,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      />
    </Pressable>
  );
}

export function OtpBoxes({ value, length = 6 }: { value: string; length?: number }) {
  const { theme } = useTheme();
  const chars = value.split('');
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {Array.from({ length }).map((_, i) => {
        const filled = i < chars.length;
        const active = i === chars.length;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: 60,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: active || filled ? theme.gold : theme.line,
              backgroundColor: filled ? theme.selBg : theme.surf,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: fonts.headingBold, fontSize: 23, color: theme.ink }}>{chars[i] ?? ''}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function ProgressSteps({ total, current }: { total: number; current: number }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 5, marginBottom: 22 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{ height: 4, flex: 1, borderRadius: 2, backgroundColor: i < current ? theme.gold : theme.line }} />
      ))}
    </View>
  );
}
