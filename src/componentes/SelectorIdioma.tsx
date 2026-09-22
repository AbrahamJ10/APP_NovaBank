import React from 'react';
import { Pressable, Text } from 'react-native';
import { usarTema } from '../tema/ContextoTema';
import { usarIdioma } from '../i18n/ContextoIdioma';
import Icono from './Icono';
import { fuentes } from '../tema/estilos';

// Píldora de idioma en línea (no flotante) pensada para ir dentro de la
// propia fila de encabezado de una pantalla — usualmente emparejada con
// BotonVolver en el lado opuesto — para que nunca se superponga con lo que
// esa pantalla ya tenga en sus esquinas. `compacto` reduce la etiqueta
// ES/EN a un simple botón cuadrado con ícono, para encabezados ya
// apretados de espacio (ej. la fila de avatar/nombre/modo oscuro/campana
// de Inicio).
export default function SelectorIdioma({ oscuro, compacto }: { oscuro?: boolean; compacto?: boolean }) {
  const { tema } = usarTema();
  const { language, alternar } = usarIdioma();

  if (compacto) {
    return (
      <Pressable
        onPress={alternar}
        hitSlop={8}
        style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          backgroundColor: oscuro ? 'rgba(255,255,255,.12)' : tema.superficie,
          borderWidth: oscuro ? 0 : 1,
          borderColor: tema.linea,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: fuentes.headingBold, fontSize: 10.5, color: oscuro ? '#fff' : tema.tinta, letterSpacing: 0.3 }}>
          {language === 'es' ? 'ES' : 'EN'}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={alternar}
      hitSlop={8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        height: 38,
        borderRadius: 12,
        backgroundColor: oscuro ? 'rgba(255,255,255,.12)' : tema.superficie,
        borderWidth: oscuro ? 0 : 1,
        borderColor: tema.linea,
      }}
    >
      <Icono name="language" size={14} color={oscuro ? '#fff' : tema.tinta} />
      <Text style={{ fontFamily: fuentes.headingBold, fontSize: 11.5, color: oscuro ? '#fff' : tema.tinta, letterSpacing: 0.5 }}>
        {language === 'es' ? 'ES' : 'EN'}
      </Text>
    </Pressable>
  );
}
