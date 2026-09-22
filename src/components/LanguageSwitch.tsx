import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import Icon from './Icon';
import { fonts } from '../theme/tokens';

// Píldora de idioma en línea (no flotante) pensada para ir dentro de la
// propia fila de encabezado de una pantalla — usualmente emparejada con
// BackButton en el lado opuesto — para que nunca se superponga con lo que
// esa pantalla ya tenga en sus esquinas. `compact` reduce la etiqueta
// ES/EN a un simple botón cuadrado con ícono, para encabezados ya
// apretados de espacio (ej. la fila de avatar/nombre/modo oscuro/campana
// de Inicio).
export default function LanguageSwitch({ dark, compact }: { dark?: boolean; compact?: boolean }) {
  const { theme } = useTheme();
  const { language, toggle } = useLanguage();

  if (compact) {
    return (
      <Pressable
        onPress={toggle}
        hitSlop={8}
        style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          backgroundColor: dark ? 'rgba(255,255,255,.12)' : theme.surf,
          borderWidth: dark ? 0 : 1,
          borderColor: theme.line,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: fonts.headingBold, fontSize: 10.5, color: dark ? '#fff' : theme.ink, letterSpacing: 0.3 }}>
          {language === 'es' ? 'ES' : 'EN'}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={toggle}
      hitSlop={8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        height: 38,
        borderRadius: 12,
        backgroundColor: dark ? 'rgba(255,255,255,.12)' : theme.surf,
        borderWidth: dark ? 0 : 1,
        borderColor: theme.line,
      }}
    >
      <Icon name="language" size={14} color={dark ? '#fff' : theme.ink} />
      <Text style={{ fontFamily: fonts.headingBold, fontSize: 11.5, color: dark ? '#fff' : theme.ink, letterSpacing: 0.5 }}>
        {language === 'es' ? 'ES' : 'EN'}
      </Text>
    </Pressable>
  );
}
