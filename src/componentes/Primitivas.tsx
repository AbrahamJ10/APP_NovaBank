import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usarTema } from '../tema/ContextoTema';
import { fuentes } from '../tema/estilos';
import Icono from './Icono';
import SelectorIdioma from './SelectorIdioma';

export function BotonVolver({ onPress, oscuro }: { onPress?: () => void; oscuro?: boolean }) {
  const nav = useNavigation();
  const { tema } = usarTema();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <Pressable
        onPress={onPress ?? (() => nav.goBack())}
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: oscuro ? 'rgba(255,255,255,.12)' : tema.superficie,
          borderWidth: oscuro ? 0 : 1,
          borderColor: tema.linea,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icono name="arrow_back" size={20} color={oscuro ? '#fff' : tema.tinta} />
      </Pressable>
      <SelectorIdioma oscuro={oscuro} />
    </View>
  );
}

export function TituloPantalla({
  eyebrow,
  title,
  note,
  showLanguageSwitch,
}: {
  eyebrow?: string;
  title: string;
  note?: string;
  // Solo lo necesitan las pantallas que llegan a TituloPantalla sin un
  // BotonVolver arriba — BotonVolver ya trae su propio SelectorIdioma, así
  // que pasar esto junto con uno solo lo mostraría dos veces.
  showLanguageSwitch?: boolean;
}) {
  const { tema } = usarTema();
  const encabezado = (
    <View style={{ flex: 1 }}>
      {eyebrow ? (
        <Text style={{ fontFamily: fuentes.body, fontSize: 10.5, color: tema.dorado, letterSpacing: 1.8, textTransform: 'uppercase' }}>
          {eyebrow}
        </Text>
      ) : null}
      <Text style={{ fontFamily: fuentes.heading, fontSize: 25, letterSpacing: -0.7, color: tema.tinta, marginTop: eyebrow ? 6 : 0 }}>
        {title}
      </Text>
      {note ? <Text style={{ fontFamily: fuentes.body, fontSize: 12.5, color: tema.medio, marginTop: 5 }}>{note}</Text> : null}
    </View>
  );

  if (!showLanguageSwitch) {
    return <View style={{ marginBottom: 4 }}>{encabezado}</View>;
  }

  return (
    <View style={{ marginBottom: 4, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      {encabezado}
      <SelectorIdioma />
    </View>
  );
}

export function Fila({ label, value, k }: { label: string; value?: string; k?: React.ReactNode }) {
  const { tema } = usarTema();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ fontFamily: fuentes.body, fontSize: 12.5, color: tema.suave }}>{label}</Text>
      {k ?? <Text style={{ fontFamily: fuentes.bodyMed, fontSize: 12.5, color: tema.tinta }}>{value}</Text>}
    </View>
  );
}

export function Pastilla({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const { tema } = usarTema();
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 36,
        paddingHorizontal: 15,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? '#133A63' : tema.superficie,
        borderWidth: 1.5,
        borderColor: active ? '#133A63' : tema.linea,
      }}
    >
      <Text style={{ fontFamily: fuentes.bodyMed, fontSize: 12.5, color: active ? '#fff' : tema.medio }}>{label}</Text>
    </Pressable>
  );
}

export function Insignia({ label, tone = 'gold' }: { label: string; tone?: 'gold' | 'green' | 'red' | 'neutral' }) {
  const { tema } = usarTema();
  const mapaColores = {
    gold: { bg: tema.fondoSel, fg: tema.dorado },
    green: { bg: tema.fondoOk, fg: tema.verde },
    red: { bg: tema.fondoAdvertencia, fg: tema.rojo },
    neutral: { bg: tema.matiz, fg: tema.medio },
  } as const;
  const colores = mapaColores[tone];
  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: colores.bg, alignSelf: 'flex-start' }}>
      <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 10.5, color: colores.fg }}>{label}</Text>
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
      <Text style={{ fontFamily: fuentes.headingBold, fontSize: size * 0.33, color: '#E7CE92' }}>{initials}</Text>
    </View>
  );
}

export function Interruptor({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const { tema } = usarTema();
  const animacion = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(animacion, { toValue: value ? 1 : 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [value]);
  const trasladoX = animacion.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={{
        width: 56,
        height: 32,
        borderRadius: 16,
        padding: 3,
        backgroundColor: value ? '#21A26B' : tema.linea,
      }}
    >
      <Animated.View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: '#fff',
          transform: [{ translateX: trasladoX }],
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

export function CasillasOtp({ value, length = 6 }: { value: string; length?: number }) {
  const { tema } = usarTema();
  const caracteres = value.split('');
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {Array.from({ length }).map((_, i) => {
        const lleno = i < caracteres.length;
        const activo = i === caracteres.length;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: 60,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: activo || lleno ? tema.dorado : tema.linea,
              backgroundColor: lleno ? tema.fondoSel : tema.superficie,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: fuentes.headingBold, fontSize: 23, color: tema.tinta }}>{caracteres[i] ?? ''}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function PasosProgreso({ total, current }: { total: number; current: number }) {
  const { tema } = usarTema();
  return (
    <View style={{ flexDirection: 'row', gap: 5, marginBottom: 22 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{ height: 4, flex: 1, borderRadius: 2, backgroundColor: i < current ? tema.dorado : tema.linea }} />
      ))}
    </View>
  );
}
